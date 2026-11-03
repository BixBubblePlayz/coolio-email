'use client';

import { useState } from 'react';
import { Plus, Mail, Send, Trash2, Copy, Check, Loader2, Shield, Sparkles, MessageSquare, X, RotateCcw } from 'lucide-react';

interface Alias {
  name: string;
  email: string;
  createdAt: string;
  active: boolean;
}

interface FormState {
  alias: string;
  password: string;
  forwardingTo: string;
}

interface ComposeState {
  fromAlias: string;
  to: string;
  subject: string;
  text: string;
}

const DEFAULT_FORWARDING = 'brody@ddylongneck.com';
const DOMAIN = 'ddylongneck.com';

export default function CoolioEmailPage() {
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [formState, setFormState] = useState<FormState>({
    alias: '',
    password: '',
    forwardingTo: DEFAULT_FORWARDING,
  });
  const [status, setStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState<string | null>(null);
  const [composeState, setComposeState] = useState<ComposeState>({
    fromAlias: '',
    to: '',
    subject: '',
    text: '',
  });
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [sendMessage, setSendMessage] = useState('');

  const loadAliases = async () => {
    try {
      const res = await fetch('/api/aliases');
      if (res.ok) {
        const data = await res.json();
        setAliases(data.aliases || []);
      }
    } catch (e) {
      console.error('Failed to load aliases:', e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('creating');
    setMessage('');

    try {
      const res = await fetch('/api/aliases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(`Created ${data.alias}@${DOMAIN}! You can now send/receive from this address.`);
        setFormState({ alias: '', password: '', forwardingTo: DEFAULT_FORWARDING });
        loadAliases();
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to create alias');
      }
    } catch (e) {
      setStatus('error');
      setMessage('Network error. Check if the server is running.');
    }
  };

  const handleDelete = async (aliasName: string) => {
    if (!confirm(`Delete ${aliasName}@${DOMAIN}? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/aliases/${aliasName}`, { method: 'DELETE' });
      if (res.ok) {
        loadAliases();
      } else {
        alert('Failed to delete alias');
      }
    } catch (e) {
      alert('Network error');
    }
  };

  const openCompose = (aliasName: string) => {
    setComposeOpen(aliasName);
    setComposeState({
      fromAlias: aliasName,
      to: '',
      subject: '',
      text: '',
    });
    setSendStatus('idle');
    setSendMessage('');
  };

  const closeCompose = () => {
    setComposeOpen(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendStatus('sending');
    setSendMessage('');

    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAlias: composeState.fromAlias,
          to: composeState.to,
          subject: composeState.subject,
          text: composeState.text,
          replyTo: 'brody@ddylongneck.com',
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSendStatus('success');
        setSendMessage('Email sent! Replies will go to your real inbox.');
        setComposeState({ fromAlias: composeState.fromAlias, to: '', subject: '', text: '' });
      } else {
        setSendStatus('error');
        setSendMessage(data.error || 'Failed to send email');
      }
    } catch (e) {
      setSendStatus('error');
      setSendMessage('Network error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[var(--accent)]/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[var(--info)]/10 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {/* Header */}
        <header className="mb-12 text-center page-transition">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="relative p-3 rounded-xl bg-[var(--accent-soft)]">
              <Sparkles className="h-8 w-8 text-[var(--accent)]" />
              <div className="absolute -inset-1 rounded-xl bg-[var(--accent)]/20 blur-xl" />
            </div>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[var(--ink)] tracking-tight">
            Coolio Email
          </h1>
          <p className="mt-3 text-lg text-[var(--ink-muted)] max-w-2xl mx-auto">
            Create custom <span className="font-mono text-[var(--accent)]">@ddylongneck.com</span> aliases instantly.
            Send, receive, and reply from any name you want.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-[var(--ink-subtle)]">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)]">
              <Shield className="h-3.5 w-3.5 text-[var(--success)]" />
              Your real email stays private
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)]">
              <Send className="h-3.5 w-3.5 text-[var(--accent)]" />
              Full send/receive support
            </span>
          </div>
        </header>

        {/* Create Alias Form */}
        <section className="card-elevated p-6 sm:p-8 mb-8 page-transition" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-[var(--accent-soft)]">
              <Plus className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-[var(--ink)]">Create New Alias</h2>
              <p className="text-sm text-[var(--ink-muted)]">Pick a name, set a password, and start emailing in seconds</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="alias" className="label">
                  Alias Name
                </label>
                <div className="relative">
                  <input
                    id="alias"
                    type="text"
                    value={formState.alias}
                    onChange={(e) => setFormState({ ...formState, alias: e.target.value.toLowerCase() })}
                    placeholder="coolio"
                    className="input pr-12"
                    pattern="[a-z0-9-]+"
                    title="Lowercase letters, numbers, and hyphens only"
                    required
                    disabled={status === 'creating'}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-subtle)] font-mono text-sm">
                    @{DOMAIN}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-[var(--ink-subtle)]">
                  Lowercase, numbers, hyphens only. 3-32 characters.
                </p>
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={formState.password}
                  onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                  placeholder="••••••••"
                  className="input"
                  minLength={8}
                  required
                  disabled={status === 'creating'}
                />
                <p className="mt-1.5 text-xs text-[var(--ink-subtle)]">
                  Min 8 chars. Used for SMTP/IMAP auth.
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="forwarding" className="label">
                Forward To
              </label>
              <select
                id="forwarding"
                value={formState.forwardingTo}
                onChange={(e) => setFormState({ ...formState, forwardingTo: e.target.value })}
                className="input"
                disabled={status === 'creating'}
              >
                <option value="brody@ddylongneck.com">brody@ddylongneck.com</option>
                <option value="him@ddylongneck.com">him@ddylongneck.com</option>
                <option value="bix@ddylongneck.com">bix@ddylongneck.com</option>
              </select>
              <p className="mt-1.5 text-xs text-[var(--ink-subtle)]">
                Where emails sent to this alias will be delivered.
              </p>
            </div>

            <button
              type="submit"
              className="btn-primary w-full sm:w-auto"
              disabled={status === 'creating' || !formState.alias || !formState.password}
            >
              {status === 'creating' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Alias
                </>
              )}
            </button>
          </form>

          {/* Status Messages */}
          {(status === 'success' || status === 'error') && (
            <div
              className={`mt-5 p-4 rounded-lg border flex items-start gap-3 ${
                status === 'success'
                  ? 'bg-[color-mix(in_oklch,_var(--success)_10%,_transparent)] border-[var(--success)]/30 text-[var(--success)]'
                  : 'bg-[color-mix(in_oklch,_var(--danger)_10%,_transparent)] border-[var(--danger)]/30 text-[var(--danger)]'
              }`}
              role="alert"
            >
              {status === 'success' ? (
                <Check className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <div className="h-5 w-5 shrink-0 mt-0.5">✕</div>
              )}
              <p className="text-sm">{message}</p>
            </div>
          )}
        </section>

        {/* Existing Aliases */}
        <section className="page-transition" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--surface-elevated)]">
                <Mail className="h-5 w-5 text-[var(--ink-muted)]" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-[var(--ink)]">Your Aliases</h2>
                <p className="text-sm text-[var(--ink-muted)]">{aliases.length} active</p>
              </div>
            </div>
          </div>

          {aliases.length === 0 ? (
            <div className="card p-12 text-center">
              <Mail className="h-12 w-12 text-[var(--ink-subtle)] mx-auto mb-4" />
              <h3 className="font-display text-lg font-medium text-[var(--ink)] mb-2">No aliases yet</h3>
              <p className="text-[var(--ink-muted)]">Create your first custom email address above</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {aliases.map((alias) => (
                <article
                  key={alias.name}
                  className="card p-5 hover:border-[var(--accent)]/50 transition-colors duration-200 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-[var(--accent-soft)]">
                        <Mail className="h-5 w-5 text-[var(--accent)]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-lg font-medium text-[var(--ink)]">
                            {alias.name}
                          </span>
                          <span className="font-mono text-lg font-medium text-[var(--ink-muted)]">
                            @{DOMAIN}
                          </span>
                        </div>
                        <span className="text-xs text-[var(--ink-subtle)]">
                          Forwards to {alias.email}
                        </span>
                      </div>
                    </div>
                    <span className="badge-success">Active</span>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--ink-muted)]">SMTP / IMAP</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(`mail.ddylongneck.com`)}
                          className="btn-ghost text-xs px-2 py-1"
                          title="Copy server"
                        >
                          {copied === `mail.ddylongneck.com` ? (
                            <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center justify-between text-[var(--ink-muted)]">
                        <span>Username</span>
                        <code className="font-mono text-[var(--ink)] bg-[var(--surface-elevated)] px-2 py-1 rounded">
                          {alias.name}@{DOMAIN}
                        </code>
                      </div>
                      <div className="flex items-center justify-between text-[var(--ink-muted)]">
                        <span>Password</span>
                        <code className="font-mono text-[var(--ink)] bg-[var(--surface-elevated)] px-2 py-1 rounded">
                          {'•'.repeat(12)}
                        </code>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => openCompose(alias.name)}
                        className="btn-ghost flex-1"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Compose
                      </button>
                      <button
                        onClick={() => handleDelete(alias.name)}
                        className="btn-ghost flex-1 text-[var(--danger)] hover:bg-[color-mix(in_oklch,_var(--danger)_10%,_transparent)]"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="mt-12 page-transition" style={{ animationDelay: '300ms' }}>
          <h2 className="font-display text-xl font-semibold text-[var(--ink)] mb-6 text-center">How it works</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: 'Pick a name',
                desc: 'Choose any available name like coolio, boss, vip, or your nickname.',
              },
              {
                icon: Shield,
                title: 'Auto-configured',
                desc: 'We instantly set up Postfix forwarding and Dovecot auth on your mail server.',
              },
              {
                icon: Send,
                title: 'Use anywhere',
                desc: 'Configure in Gmail, Outlook, Apple Mail, or any client with SMTP/IMAP.',
              },
            ].map((step, i) => (
              <article key={step.title} className="card p-6 text-center group">
                <div className="p-3 rounded-xl bg-[var(--accent-soft)] w-fit mx-auto mb-4 group-hover:bg-[var(--accent)]/30 transition-colors">
                  <step.icon className="h-6 w-6 text-[var(--accent)]" />
                </div>
                <h3 className="font-display font-medium text-[var(--ink)] mb-2">{step.title}</h3>
                <p className="text-sm text-[var(--ink-muted)]">{step.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Compose Modal */}
        {composeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm page-transition">
            <div className="card-elevated w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--accent-soft)]">
                    <MessageSquare className="h-5 w-5 text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-[var(--ink)]">Compose Email</h3>
                    <p className="text-sm text-[var(--ink-muted)]">Sending as <span className="font-mono text-[var(--accent)]">{composeOpen}@{DOMAIN}</span></p>
                  </div>
                </div>
                <button onClick={closeCompose} className="btn-ghost p-2" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSend} className="p-5 space-y-4">
                <div>
                  <label htmlFor="compose-to" className="label">To</label>
                  <input
                    id="compose-to"
                    type="email"
                    value={composeState.to}
                    onChange={(e) => setComposeState({ ...composeState, to: e.target.value })}
                    placeholder="recipient@example.com"
                    className="input"
                    required
                    disabled={sendStatus === 'sending'}
                  />
                </div>

                <div>
                  <label htmlFor="compose-subject" className="label">Subject</label>
                  <input
                    id="compose-subject"
                    type="text"
                    value={composeState.subject}
                    onChange={(e) => setComposeState({ ...composeState, subject: e.target.value })}
                    placeholder="What's this about?"
                    className="input"
                    required
                    disabled={sendStatus === 'sending'}
                  />
                </div>

                <div>
                  <label htmlFor="compose-text" className="label">Message</label>
                  <textarea
                    id="compose-text"
                    value={composeState.text}
                    onChange={(e) => setComposeState({ ...composeState, text: e.target.value })}
                    placeholder="Write your email here..."
                    className="input min-h-[200px] resize-y font-mono text-sm"
                    required
                    disabled={sendStatus === 'sending'}
                  />
                </div>

                {(sendStatus === 'success' || sendStatus === 'error') && (
                  <div
                    className={`p-3 rounded-lg border flex items-center gap-3 ${
                      sendStatus === 'success'
                        ? 'bg-[color-mix(in_oklch,_var(--success)_10%,_transparent)] border-[var(--success)]/30 text-[var(--success)]'
                        : 'bg-[color-mix(in_oklch,_var(--danger)_10%,_transparent)] border-[var(--danger)]/30 text-[var(--danger)]'
                    }`}
                    role="alert"
                  >
                    {sendStatus === 'success' ? (
                      <Check className="h-5 w-5 shrink-0" />
                    ) : (
                      <div className="h-5 w-5 shrink-0">✕</div>
                    )}
                    <p className="text-sm">{sendMessage}</p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                  <button type="button" onClick={closeCompose} className="btn-secondary" disabled={sendStatus === 'sending'}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={sendStatus === 'sending' || !composeState.to || !composeState.subject || !composeState.text}>
                    {sendStatus === 'sending' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Email
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Connection Details */}
        <section className="mt-12 card p-6 page-transition" style={{ animationDelay: '400ms' }}>
          <h2 className="font-display text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-[var(--accent)]" />
            Connection Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            {[
              { label: 'IMAP Server', value: 'mail.ddylongneck.com', port: '993 (SSL)' },
              { label: 'SMTP Server', value: 'mail.ddylongneck.com', port: '587 (STARTTLS)' },
              { label: 'Username', value: 'youralias@ddylongneck.com', port: '' },
              { label: 'Password', value: 'Your alias password', port: '' },
            ].map((item) => (
              <div key={item.label} className="p-4 bg-[var(--surface-elevated)] rounded-lg">
                <span className="text-[var(--ink-subtle)] block mb-1">{item.label}</span>
                <code className="font-mono text-[var(--ink)] block">{item.value}</code>
                {item.port && <span className="text-[var(--ink-muted)] mt-1 block">{item.port}</span>}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-[var(--ink-muted)]">
            <strong>Tip:</strong> In Gmail, go to Settings → Accounts → "Send mail as" → Add another email address.
            Use your alias address, mail.ddylongneck.com:587, your alias as username, and your alias password.
          </p>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-[var(--ink-subtle)]">
          Running on your mail server at <code className="font-mono text-[var(--ink)]">mail.ddylongneck.com</code>
          <span className="mx-2">·</span>
          Powered by Postfix + Dovecot + Next.js
        </div>
      </footer>
    </div>
  );
}