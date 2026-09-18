/**
 * trello-shared.ts — shared helpers for the Trello local-mirror tooling.
 *
 * Kept in one module because three scripts (`sync-trello.ts`, `sync-trello-board.ts`,
 * `check-trello-board.ts`) all need the same REST fetch, board-id resolution, slug
 * grammar, and logging. This module is a pure library: it never runs on its own.
 *
 * Auth comes from `TRELLO_API_KEY` + `TRELLO_TOKEN` in `.env` — never hardcoded.
 * The board id resolves from the committed catalog `.agents/trello-board.json` first,
 * then falls back to `issue_tracker.trello_board_id` in `.agents/project.yaml`.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { parse as parseYaml } from 'yaml';

export const REPO_ROOT = join(import.meta.dir, '..');
export const TRELLO_API = 'https://api.trello.com/1';
export const TRELLO_BOARD_JSON = join(REPO_ROOT, '.agents', 'trello-board.json');
export const PROJECT_YAML = join(REPO_ROOT, '.agents', 'project.yaml');
export const TRELLO_CACHE = join(REPO_ROOT, '.context', 'trello');

// ============================================================================
// LOGGING (sync-openapi.ts style)
// ============================================================================

const colors = {
  reset: '\x1B[0m',
  bold: '\x1B[1m',
  green: '\x1B[32m',
  yellow: '\x1B[33m',
  blue: '\x1B[34m',
  cyan: '\x1B[36m',
  red: '\x1B[31m',
};

export const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✔${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.error(`${colors.red}✖${colors.reset} ${msg}`),
  title: (msg: string) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}`),
};

// ============================================================================
// TRELLO REST TYPES (subset of the API surface the mirror needs)
// ============================================================================

export interface TrelloList {
  id: string
  name: string
  closed: boolean
}

export interface TrelloLabel {
  id: string
  name: string
  color: string | null
}

export interface TrelloCard {
  id: string
  idShort: number
  name: string
  desc: string
  shortUrl: string
  idList: string
  idLabels: string[]
  idChecklists: string[]
  closed: boolean
}

export interface TrelloCheckItem {
  id: string
  name: string
  state: 'complete' | 'incomplete'
}

export interface TrelloChecklist {
  id: string
  name: string
  checkItems: TrelloCheckItem[]
}

export interface TrelloAction {
  id: string
  type: string
  date: string
  data?: { text?: string }
  memberCreator?: { fullName?: string, username?: string }
}

export interface TrelloAttachment {
  id: string
  name: string
  url: string
}

/** The committed catalog `.agents/trello-board.json`. */
export interface TrelloBoardCatalog {
  boardId: string
  boardUrl: string
  lists: Array<{ id: string, name: string }>
  labels: Array<{ id: string, name: string, color: string | null }>
}

// ============================================================================
// AUTH + FETCH
// ============================================================================

function requireTrelloAuth(): { key: string, token: string } {
  const key = process.env.TRELLO_API_KEY;
  const token = process.env.TRELLO_TOKEN;
  if (!key || !token) {
    throw new Error('TRELLO_API_KEY or TRELLO_TOKEN is missing from .env (see .env.example)');
  }
  return { key, token };
}

/**
 * GET from the Trello REST API, appending the key/token query params. Throws on
 * any non-2xx so callers can decide between "network/auth failure" and success.
 */
export async function trelloGet<T>(path: string): Promise<T> {
  const { key, token } = requireTrelloAuth();
  const sepChar = path.includes('?') ? '&' : '?';
  const url = `${TRELLO_API}${path}${sepChar}key=${encodeURIComponent(key)}&token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Trello API ${res.status} ${res.statusText} (${path})`);
  }
  return res.json() as Promise<T>;
}

// ============================================================================
// BOARD ID / URL RESOLUTION
// ============================================================================

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};
}

/** Reads the `issue_tracker` block out of `.agents/project.yaml` (never throws). */
export function projectTrelloConfig(): { boardId?: string, boardUrl?: string } {
  let raw: unknown;
  try {
    raw = parseYaml(readFileSync(PROJECT_YAML, 'utf8'));
  }
  catch {
    return {};
  }
  const issueTracker = asRecord(asRecord(raw).issue_tracker);
  const str = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);
  return {
    boardId: str(issueTracker.trello_board_id),
    boardUrl: str(issueTracker.trello_board_url),
  };
}

export function loadBoardCatalog(): TrelloBoardCatalog | null {
  if (!existsSync(TRELLO_BOARD_JSON)) { return null; }
  try {
    const parsed = JSON.parse(readFileSync(TRELLO_BOARD_JSON, 'utf8')) as TrelloBoardCatalog;
    return parsed?.boardId ? parsed : null;
  }
  catch {
    return null;
  }
}

export function resolveBoardId(): string {
  const catalog = loadBoardCatalog();
  if (catalog?.boardId) { return catalog.boardId; }
  const config = projectTrelloConfig();
  if (config.boardId) { return config.boardId; }
  throw new Error(
    'No Trello board id: run `bun run trello:sync-board` or set issue_tracker.trello_board_id in .agents/project.yaml',
  );
}

export function resolveBoardUrl(): string {
  const catalog = loadBoardCatalog();
  if (catalog?.boardUrl) { return catalog.boardUrl; }
  return projectTrelloConfig().boardUrl ?? '';
}

// ============================================================================
// NAMING / SLUG GRAMMAR
// ============================================================================

/** Kebab-case slug from a free-text name (accents stripped, separators collapsed). */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Normalize an OS-native path to POSIX separators for anything persisted. */
export function toPosixPath(path: string): string {
  return path.split(sep).join('/');
}

/**
 * Maps a free-form label name onto a discipline code (see the ratified label list
 * in `docs/qa-standard/traceability-trello-drive.md` §1). Returns null when the
 * label is not a recognised discipline, so a stray colored label never invents one.
 */
const DISCIPLINE_ALIASES: Record<string, string> = {
  'ux': 'UX',
  'u x': 'UX',
  'uxui': 'UX',
  'ux/ui': 'UX',
  'ux ui': 'UX',
  'front': 'FRONT',
  'frontend': 'FRONT',
  'front-end': 'FRONT',
  'back': 'BACK',
  'backend': 'BACK',
  'back-end': 'BACK',
  'qa': 'QA',
  'po': 'PO',
  'product': 'PO',
  'pm': 'PO',
  'ops': 'OPS',
  'infra': 'OPS',
  'infrastructure': 'OPS',
  'devops': 'OPS',
  'ci/cd': 'OPS',
  'doc': 'DOC',
  'docs': 'DOC',
  'documentation': 'DOC',
};

export function disciplineCode(labelName: string): string | null {
  const key = labelName.trim().toLowerCase().replace(/\s+/g, ' ');
  return DISCIPLINE_ALIASES[key] ?? null;
}

/**
 * A card's canonical reference slug: `{LABEL}-{number}` (e.g. `QA-9`) when a
 * discipline label is present, else the bare Trello number. Matches
 * `traceability-trello-drive.md` §1.
 */
export function cardSlug(labels: string[], idShort: number): string {
  for (const label of labels) {
    const code = disciplineCode(label);
    if (code) { return `${code}-${idShort}`; }
  }
  return String(idShort);
}
