import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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

async function getAliasPassword(alias: string): Promise<string | null> {
  const fullAlias = `${alias}@${DOMAIN}`;
  const { stdout } = await sshExec(`grep -E "^${fullAlias}:" /etc/dovecot/users`);
  if (!stdout.trim()) return null;
  
  // We can't easily extract the plaintext password from the hash
  // For now, we'll need the user to provide it or we use a master account
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fromAlias, to, subject, text, html, replyTo } = body;

    if (!fromAlias || !to || !subject) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate alias format
    if (!/^[a-z0-9-]{3,32}$/.test(fromAlias)) {
      return NextResponse.json({ error: 'Invalid alias format' }, { status: 400 });
    }

    const fullAlias = `${fromAlias}@${DOMAIN}`;

    // Check if alias exists
    const { stdout: virtualCheck } = await sshExec(`grep -E "^${fullAlias}\\s" /etc/postfix/virtual`);
    if (!virtualCheck.trim()) {
      return NextResponse.json({ error: 'Alias not found' }, { status: 404 });
    }

    // For sending, we need SMTP credentials. Since we can't retrieve the password from hash,
    // we'll use a master SMTP account (e.g., noreply@) and set the From header to the alias
    // with Reply-To set to the user's real email.
    // This is the standard "send as" pattern.
    
    const smtpUser = process.env.SMTP_USER || 'noreply@ddylongneck.com';
    const smtpPass = process.env.SMTP_PASS || 'NoreplyEmail2026!';
    const smtpHost = process.env.SMTP_HOST || 'mail.ddylongneck.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false, // STARTTLS
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false, // For self-signed certs
      },
    });

    const mailOptions = {
      from: `"${fromAlias}" <${fullAlias}>`,
      to,
      subject,
      text,
      html,
      replyTo: replyTo || 'brody@ddylongneck.com',
      headers: {
        'X-Alias': fullAlias,
      },
    };

    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      message: 'Email sent successfully',
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json({ error: 'Failed to send email', details: String(error) }, { status: 500 });
  }
}