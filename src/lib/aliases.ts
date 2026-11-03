import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const ALIASES_FILE = join(DATA_DIR, 'aliases.json');

export interface EmailAlias {
  id: string;
  name: string;
  domain: string;
  fullEmail: string;
  forwardTo: string;
  createdAt: string;
  isActive: boolean;
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadAliases(): EmailAlias[] {
  ensureDataDir();
  if (!existsSync(ALIASES_FILE)) {
    const defaultAliases: EmailAlias[] = [
      {
        id: '1',
        name: 'coolio',
        domain: 'ddylongneck.com',
        fullEmail: 'coolio@ddylongneck.com',
        forwardTo: 'brody@ddylongneck.com',
        createdAt: new Date().toISOString(),
        isActive: true,
      },
    ];
    saveAliases(defaultAliases);
    return defaultAliases;
  }
  const data = readFileSync(ALIASES_FILE, 'utf-8');
  return JSON.parse(data);
}

function saveAliases(aliases: EmailAlias[]) {
  ensureDataDir();
  writeFileSync(ALIASES_FILE, JSON.stringify(aliases, null, 2));
}

export function getAllAliases(): EmailAlias[] {
  return loadAliases();
}

export function getAliasById(id: string): EmailAlias | undefined {
  return loadAliases().find(a => a.id === id);
}

export function createAlias(name: string, domain: string, forwardTo: string): EmailAlias {
  const aliases = loadAliases();
  
  if (aliases.some(a => a.name.toLowerCase() === name.toLowerCase() && a.domain === domain)) {
    throw new Error('Alias already exists');
  }

  const newAlias: EmailAlias = {
    id: crypto.randomUUID(),
    name: name.toLowerCase(),
    domain,
    fullEmail: `${name.toLowerCase()}@${domain}`,
    forwardTo,
    createdAt: new Date().toISOString(),
    isActive: true,
  };

  aliases.push(newAlias);
  saveAliases(aliases);
  return newAlias;
}

export function deleteAlias(id: string): boolean {
  const aliases = loadAliases();
  const index = aliases.findIndex(a => a.id === id);
  if (index === -1) return false;
  aliases.splice(index, 1);
  saveAliases(aliases);
  return true;
}

export function toggleAlias(id: string): EmailAlias | undefined {
  const aliases = loadAliases();
  const alias = aliases.find(a => a.id === id);
  if (!alias) return undefined;
  alias.isActive = !alias.isActive;
  saveAliases(aliases);
  return alias;
}

export const EMAIL_CONFIG = {
  smtp: {
    host: process.env.SMTP_HOST || 'mail.ddylongneck.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'brody@ddylongneck.com',
      pass: process.env.SMTP_PASS || '15954Lind',
    },
  },
  imap: {
    host: process.env.IMAP_HOST || 'mail.ddylongneck.com',
    port: parseInt(process.env.IMAP_PORT || '993'),
    tls: true,
    auth: {
      user: process.env.IMAP_USER || 'brody@ddylongneck.com',
      pass: process.env.IMAP_PASS || '15954Lind',
    },
  },
  defaultFrom: process.env.DEFAULT_FROM || 'brody@ddylongneck.com',
  domain: process.env.EMAIL_DOMAIN || 'ddylongneck.com',
};