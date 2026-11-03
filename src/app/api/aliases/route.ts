import { NextResponse } from 'next/server';
import crypto from 'crypto';

const MAIL_SERVER = '192.168.0.59';
const SSH_USER = 'root';
const SSH_PASS = '15954Lind';
const DOMAIN = 'ddylongneck.com';

async function sshExec(command: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const { spawn } = await import('child_process');
  
  return new Promise((resolve) => {
    const child = spawn('sshpass', ['-p', SSH_PASS, 'ssh', '-o', 'StrictHostKeyChecking=no', `${SSH_USER}@${MAIL_SERVER}`, command], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => { stdout += data.toString(); });
    child.stderr?.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });

    child.on('error', (err) => {
      resolve({ stdout, stderr, exitCode: 1 });
    });
  });
}

function generatePasswordHash(password: string): string {
  const salt = crypto.randomBytes(16).toString('base64').slice(0, 16);
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('base64');
  return `{SHA512-CRYPT}$6$${salt}$${hash}`;
}

async function listAliases(): Promise<Array<{ name: string; email: string; createdAt: string; active: boolean }>> {
  const { stdout } = await sshExec('cat /etc/postfix/virtual');
  
  const aliases: Array<{ name: string; email: string; createdAt: string; active: boolean }> = [];
  
  stdout.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    
    const [alias, target] = trimmed.split(/\s+/);
    if (alias && target && alias.endsWith(`@${DOMAIN}`) && !alias.startsWith('postmaster') && !alias.startsWith('noreply')) {
      const name = alias.replace(`@${DOMAIN}`, '');
      aliases.push({
        name,
        email: target,
        createdAt: new Date().toISOString(),
        active: true,
      });
    }
  });
  
  return aliases;
}

export async function GET() {
  try {
    const aliases = await listAliases();
    return NextResponse.json({ aliases });
  } catch (error) {
    console.error('Failed to list aliases:', error);
    return NextResponse.json({ error: 'Failed to list aliases' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alias, password, forwardingTo } = body;

    if (!alias || !password || !forwardingTo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!/^[a-z0-9-]{3,32}$/.test(alias)) {
      return NextResponse.json({ 
        error: 'Alias must be 3-32 characters, lowercase letters, numbers, and hyphens only' 
      }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const fullAlias = `${alias}@${DOMAIN}`;

    const { stdout: virtualCheck } = await sshExec(`grep -E "^${fullAlias}\\s" /etc/postfix/virtual`);
    if (virtualCheck.trim()) {
      return NextResponse.json({ error: 'Alias already exists' }, { status: 409 });
    }

    const { stdout: userCheck } = await sshExec(`grep -E "^${fullAlias}:" /etc/dovecot/users`);
    if (userCheck.trim()) {
      return NextResponse.json({ error: 'Alias user already exists' }, { status: 409 });
    }

    const passwordHash = generatePasswordHash(password);

    const virtualEntry = `${fullAlias} ${forwardingTo}`;
    await sshExec(`echo "${virtualEntry}" >> /etc/postfix/virtual && postmap /etc/postfix/virtual`);

    const userEntry = `${fullAlias}:${passwordHash}:5000:5000::/var/vmail/${DOMAIN}/${alias}::`;
    await sshExec(`echo "${userEntry}" >> /etc/dovecot/users`);

    await sshExec(`mkdir -p /var/vmail/${DOMAIN}/${alias}/{new,cur,tmp} && chown -R vmail:vmail /var/vmail/${DOMAIN}/${alias} && chmod -R 700 /var/vmail/${DOMAIN}/${alias}`);

    await sshExec('systemctl reload postfix && systemctl reload dovecot');

    return NextResponse.json({ 
      alias,
      email: forwardingTo,
      message: 'Alias created successfully'
    });
  } catch (error) {
    console.error('Failed to create alias:', error);
    return NextResponse.json({ error: 'Failed to create alias' }, { status: 500 });
  }
}