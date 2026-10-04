#!/usr/bin/env bun
/**
 * Discord Post CLI — send, edit, or delete a message in a Discord channel via
 * an incoming webhook.
 *
 * Reads DISCORD_WEBHOOK_URL from .env (Bun auto-loads it, plus an explicit
 * loadEnvFile fallback for parity with config/variables.ts).
 *
 * Usage:
 *   bun scripts/discord-post.ts "QA update: all green"
 *   bun scripts/discord-post.ts --file .session/discord-qa-update.md
 *   bun scripts/discord-post.ts --dry-run "preview without sending"
 *   bun scripts/discord-post.ts --edit <message-id> --file corrected.md
 *   bun scripts/discord-post.ts --delete <message-id>
 *   bun scripts/discord-post.ts --help
 *
 * Sending uses `?wait=true` so Discord returns the message id, which is printed
 * and persisted to .session/discord-last-message-id. Pass `last` instead of a
 * numeric id to edit/delete the most recently sent message.
 *
 * The payload is sent as plain `content` (Discord webhooks do not render
 * markdown into embeds automatically). Max 2000 characters; longer messages
 * are truncated with a warning.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

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
const LAST_ID_PATH = resolve('.session', 'discord-last-message-id');

// Discord user snowflakes for real @-mentions: `@daniel` → `<@id>`. The token→env
// mapping is fixed; the ids live in .env so they stay out of git. Longest tokens
// first so `@fer` never eats into `@fernando`.
const TAG_ENV: Array<[RegExp, string]> = [
  [/@fernando\b/gi, 'DISCORD_TAG_FERNANDO'],
  [/@leandro\b/gi, 'DISCORD_TAG_LEAN'],
  [/@daniel\b/gi, 'DISCORD_TAG_DANIEL'],
  [/@pame\b/gi, 'DISCORD_TAG_PAMELA'],
  [/@sheila\b/gi, 'DISCORD_TAG_SHEILA'],
  [/@lean\b/gi, 'DISCORD_TAG_LEAN'],
  [/@ro\b/gi, 'DISCORD_TAG_RO'],
  [/@fer\b/gi, 'DISCORD_TAG_FERNANDO'],
];

function expandTags(content: string): string {
  let out = content;
  for (const [re, env] of TAG_ENV) {
    const id = process.env[env];
    if (id) {
      out = out.replace(re, `<@${id}>`);
    }
  }
  return out;
}

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
\x1B[1mDiscord Post\x1B[0m — send, edit, or delete a message via an incoming webhook

\x1B[1mUSAGE\x1B[0m
  bun scripts/discord-post.ts "message"
  bun scripts/discord-post.ts --file <path.md>
  bun scripts/discord-post.ts --edit <message-id|last> [--file <path.md> | "message"]
  bun scripts/discord-post.ts --delete <message-id|last>
  bun run discord:post -- "message"

\x1B[1mOPTIONS\x1B[0m
  -f, --file <path>        Send/edit the contents of a file as the message
      --edit <id|last>     Edit an existing message (id, or "last" for the
                           most recently sent one)
      --delete <id|last>   Delete an existing message
      --dry-run            Print the message without sending it
  -h, --help               Show this help

\x1B[1m@-MENTIONS\x1B[0m
  Write @daniel, @pame, @fer (or @fernando), @sheila, @lean (or @leandro) or @ro
  and it expands to a real <@id> ping (ids from .env DISCORD_TAG_*).

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

const VALUE_FLAGS = new Set(['--file', '-f', '--edit', '--delete']);
const BOOL_FLAGS = new Set(['--dry-run']);

function flagValue(names: string[]): string | undefined {
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    for (const n of names) {
      if (a === n && i + 1 < args.length) {
        return args[i + 1];
      }
      if (a.startsWith(`${n}=`)) {
        return a.slice(n.length + 1);
      }
    }
  }
  return undefined;
}

const dryRun = args.includes('--dry-run');
const filePath = flagValue(['--file', '-f']);
const editIdArg = flagValue(['--edit']);
const deleteIdArg = flagValue(['--delete']);

let mode: 'send' | 'edit' | 'delete' = 'send';
let messageId: string | undefined;

if (editIdArg !== undefined && deleteIdArg !== undefined) {
  log('--edit and --delete are mutually exclusive', 'error');
  process.exit(1);
}
if (editIdArg !== undefined) {
  mode = 'edit';
  messageId = editIdArg;
}
else if (deleteIdArg !== undefined) {
  mode = 'delete';
  messageId = deleteIdArg;
}

// Positional content = every arg that is not a flag token and not a flag value.
const consumed = new Set<number>();
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (VALUE_FLAGS.has(a)) {
    consumed.add(i);
    consumed.add(i + 1);
  }
  else if (a.includes('=') && VALUE_FLAGS.has(a.split('=')[0])) {
    consumed.add(i);
  }
  else if (BOOL_FLAGS.has(a)) {
    consumed.add(i);
  }
}
const positional = args.filter((_, i) => !consumed.has(i)).join(' ').trim();

let content: string;
if (filePath) {
  try {
    content = readFileSync(resolve(filePath), 'utf-8').trim();
  }
  catch (error) {
    log(`Could not read file: ${String(error)}`, 'error');
    process.exit(1);
  }
}
else {
  content = positional;
}

if (mode === 'delete') {
  // No content required to delete.
}
else if (!content) {
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
// Message id helpers
// ============================================

function readLastId(): string | null {
  try {
    return readFileSync(LAST_ID_PATH, 'utf-8').trim() || null;
  }
  catch {
    return null;
  }
}

function writeLastId(id: string): void {
  try {
    mkdirSync(dirname(LAST_ID_PATH), { recursive: true });
    writeFileSync(LAST_ID_PATH, id);
  }
  catch {
    // Non-fatal: the id is still printed to stdout.
  }
}

function resolveMessageId(idArg: string): string {
  if (idArg === 'last') {
    const last = readLastId();
    if (!last) {
      log('No last message id recorded (have you sent one since the update?)', 'error');
      process.exit(1);
    }
    return last;
  }
  return idArg;
}

content = expandTags(content);

// ============================================
// Content length guard
// ============================================

if (content && content.length > MAX_CONTENT) {
  content = `${content.slice(0, MAX_CONTENT - 3)}...`;
  log(`Message truncated to ${MAX_CONTENT} characters`, 'warn');
}

// ============================================
// Send / Edit / Delete
// ============================================

const baseUrl = WEBHOOK_URL.replace(/\/$/, '');

if (dryRun) {
  const verb = mode === 'send' ? 'sent' : mode === 'edit' ? 'edited' : 'deleted';
  log(`Dry run — nothing ${verb}`, 'warn');
  console.log('--- message preview ---');
  console.log(content);
  console.log('--- end preview ---');
  process.exit(0);
}

try {
  if (mode === 'send') {
    const url = new URL(baseUrl);
    url.searchParams.set('wait', 'true');
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (response.ok) {
      const data = await response.json().catch(() => null);
      const id = data?.id as string | undefined;
      if (id) {
        writeLastId(id);
        log(`Message sent to Discord (id: ${id})`, 'success');
      }
      else {
        log('Message sent to Discord', 'success');
      }
    }
    else {
      const body = await response.text();
      log(`Discord responded ${response.status}: ${body}`, 'error');
      process.exit(1);
    }
  }
  else {
    const id = resolveMessageId(messageId as string);
    const url = `${baseUrl}/messages/${id}`;

    if (mode === 'edit') {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (response.ok) {
        log(`Message ${id} edited`, 'success');
      }
      else {
        const body = await response.text();
        log(`Discord responded ${response.status}: ${body}`, 'error');
        process.exit(1);
      }
    }
    else {
      const response = await fetch(url, { method: 'DELETE' });
      if (response.ok) {
        log(`Message ${id} deleted`, 'success');
      }
      else {
        const body = await response.text();
        log(`Discord responded ${response.status}: ${body}`, 'error');
        process.exit(1);
      }
    }
  }
}
catch (error) {
  log('Request failed. Is the webhook URL valid?', 'error');
  log(`  ${String(error)}`, 'error');
  process.exit(1);
}
