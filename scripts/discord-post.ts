#!/usr/bin/env bun
/**
 * Discord Post CLI — send a message to a Discord channel via an incoming webhook.
 *
 * Reads DISCORD_WEBHOOK_URL from .env (Bun auto-loads it, plus an explicit
 * loadEnvFile fallback for parity with config/variables.ts).
 *
 * Usage:
 *   bun scripts/discord-post.ts "QA update: all green"
 *   bun scripts/discord-post.ts --file .session/discord-qa-update.md
 *   bun scripts/discord-post.ts --dry-run "preview without sending"
 *   bun scripts/discord-post.ts --help
 *
 * The payload is sent as plain `content` (Discord webhooks do not render
 * markdown into embeds automatically). Max 2000 characters; longer messages
 * are truncated with a warning.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Bun loads .env automatically when running a script, but be explicit so the
// script behaves the same when invoked directly vs through `bun run`.
try {
  process.loadEnvFile();
}
catch {
  // .env missing (expected in CI, where DISCORD_WEBHOOK_URL is a secret).
}

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const MAX_CONTENT = 2000;

// ============================================
// Logging
// ============================================

const PREFIX = '[discord-post]';

function log(msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') {
  const icons = { info: '\u2139', success: '\u2713', warn: '\u26A0', error: '\u2717' };
  const colors = { info: '\x1B[36m', success: '\x1B[32m', warn: '\x1B[33m', error: '\x1B[31m' };
  console.log(`${colors[type]}${icons[type]}\x1B[0m ${PREFIX} ${msg}`);
}

// ============================================
// Help
// ============================================

function showHelp(): void {
  console.log(`
\x1B[1mDiscord Post\x1B[0m — send a message to Discord via an incoming webhook

\x1B[1mUSAGE\x1B[0m
  bun scripts/discord-post.ts "message"
  bun scripts/discord-post.ts --file <path.md>
  bun run discord:post -- "message"

\x1B[1mOPTIONS\x1B[0m
  -f, --file <path>   Send the contents of a file as the message
  --dry-run           Print the message without sending it
  -h, --help          Show this help

\x1B[1mREQUIRED .env VARIABLE\x1B[0m
  DISCORD_WEBHOOK_URL  Incoming webhook URL (Server Settings → Integrations → Webhooks)
`);
}

// ============================================
// Argument Parsing
// ============================================

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

const dryRun = args.includes('--dry-run');
const fileIdx = args.findIndex(a => a === '--file' || a === '-f');

let content: string;
if (fileIdx !== -1) {
  const filePath = args[fileIdx + 1];
  if (!filePath || filePath.startsWith('-')) {
    log('--file requires a path', 'error');
    process.exit(1);
  }
  try {
    content = readFileSync(resolve(filePath), 'utf-8').trim();
  }
  catch (error) {
    log(`Could not read file: ${String(error)}`, 'error');
    process.exit(1);
  }
}
else {
  content = args.filter(a => !a.startsWith('-')).join(' ').trim();
}

if (!content) {
  log('No message provided', 'error');
  showHelp();
  process.exit(1);
}

if (!WEBHOOK_URL) {
  log('DISCORD_WEBHOOK_URL is not set in .env', 'error');
  log('Set it in your .env file and try again.', 'info');
  process.exit(1);
}

// ============================================
// Send
// ============================================

if (content.length > MAX_CONTENT) {
  content = `${content.slice(0, MAX_CONTENT - 3)}...`;
  log(`Message truncated to ${MAX_CONTENT} characters`, 'warn');
}

if (dryRun) {
  log('Dry run — nothing sent', 'warn');
  console.log('--- message preview ---');
  console.log(content);
  console.log('--- end preview ---');
  process.exit(0);
}

try {
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (response.status === 204 || response.ok) {
    log('Message sent to Discord', 'success');
  }
  else {
    const body = await response.text();
    log(`Discord responded ${response.status}: ${body}`, 'error');
    process.exit(1);
  }
}
catch (error) {
  log('Send failed. Is the webhook URL valid?', 'error');
  log(`  ${String(error)}`, 'error');
  process.exit(1);
}
