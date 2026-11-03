import { NextResponse } from 'next/server';

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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    
    if (!name || !/^[a-z0-9-]{3,32}$/.test(name)) {
      return NextResponse.json({ error: 'Invalid alias name' }, { status: 400 });
    }

    const fullAlias = `${name}@${DOMAIN}`;

    // Check if alias exists
    const { stdout: virtualCheck } = await sshExec(`grep -E "^${fullAlias}\\s" /etc/postfix/virtual`);
    if (!virtualCheck.trim()) {
      return NextResponse.json({ error: 'Alias not found' }, { status: 404 });
    }

    // Remove from Postfix virtual file
    await sshExec(`sed -i "/^${fullAlias}\\s/d" /etc/postfix/virtual && postmap /etc/postfix/virtual`);

    // Remove from Dovecot users file
    await sshExec(`sed -i "/^${fullAlias}:/d" /etc/dovecot/users`);

    // Optionally remove maildir (commented out for safety)
    // await sshExec(`rm -rf /var/vmail/${DOMAIN}/${name}`);

    // Reload services
    await sshExec('systemctl reload postfix && systemctl reload dovecot');

    return NextResponse.json({ message: 'Alias deleted successfully' });
  } catch (error) {
    console.error('Failed to delete alias:', error);
    return NextResponse.json({ error: 'Failed to delete alias' }, { status: 500 });
  }
}