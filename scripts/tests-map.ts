#!/usr/bin/env bun

/**
 * ============================================================================
 * TESTS MAP - Visualize the synced Trello board as a single HTML page
 * ============================================================================
 *
 * Reads the `.context/trello/` tree that `scripts/sync-trello.ts` produces
 * (Trello stays the source of truth; the tree is a read-only cache) and writes
 * one self-contained HTML file so a QA lead can see coverage AND gaps at a
 * glance: List -> Card -> checklist item (AC), plus the orphan/no-AC piles and
 * a discipline-label rollup.
 *
 * Disk-only by design: no Trello calls, runnable offline, instant. Re-run
 * `bun run trello:sync` first if the cache is stale.
 *
 * USAGE:
 *   bun scripts/tests-map.ts [options]
 *
 * OPTIONS:
 *   --out <path>   Output file (default: .context/reports/test-map.html)
 *   --json         Also print the gap summary as JSON to stdout
 *   help           Show usage
 *
 * ============================================================================
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import { slugify, toPosixPath } from './trello-shared';

// ============================================================================
// TYPES
// ============================================================================

interface CheckItemEntry {
  /** Trello checklist-item id — the stable AC reference (no hand `AC-NNN`). */
  id: string
  name: string
  complete: boolean
}

interface CardEntry {
  /** Canonical reference slug (`{LABEL}-{number}`, e.g. `QA-9`). */
  key: string
  number: number
  title: string
  list: string
  labels: string[]
  url: string | null
  checkItems: CheckItemEntry[]
  /** Repo-relative POSIX path of the synced `.md`, so the HTML points back at the cache. */
  relPath: string
}

interface ListEntry {
  name: string
  cards: CardEntry[]
}

interface TrelloModel {
  lists: ListEntry[]
  /** Cards with no checklist items — ACs not yet defined. */
  cardsWithoutAc: CardEntry[]
  /** Cards with no label at all — no discipline home (orphan). */
  cardsWithoutLabels: CardEntry[]
}

interface GapReport {
  cardsWithoutAc: CardEntry[]
  cardsWithoutLabels: CardEntry[]
  listsWithoutCards: ListEntry[]
}

// ============================================================================
// LOGGING (same pattern as sync-trello.ts, trimmed to what this needs)
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

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✔${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.error(`${colors.red}✖${colors.reset} ${msg}`),
  title: (msg: string) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}`),
};

// ============================================================================
// PURE PARSERS
// ============================================================================

/**
 * Extracts a `**Label:** value` header field from a synced card body.
 * The sync writes these as plain bold-label lines, one per line.
 */
function parseHeaderField(content: string, label: string): string | null {
  const match = content.match(new RegExp(`^\\*\\*${label}:\\*\\*\\s*(.+)$`, 'm'));
  return match ? match[1].trim() : null;
}

/** Returns the raw body of one `## Heading` section (h2 only), or '' when absent. */
function sectionOf(content: string, heading: string): string {
  const match = new RegExp(`^## ${heading}\\b`, 'm').exec(content);
  if (!match) { return ''; }
  const rest = content.slice(match.index + match[0].length);
  const next = rest.match(/^## /m);
  return (next ? rest.slice(0, next.index) : rest).trim();
}

/** First `# ` heading of a card body. */
function parseCardTitle(content: string): string | null {
  const match = content.match(/^#\s+(\S.*)$/m);
  return match ? match[1].trim() : null;
}

/** Trello card number from a `{number}-{slug}.md` filename (the sync's own id). */
function parseCardNumber(filename: string): number {
  const match = filename.match(/^(\d+)-/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

/**
 * Parses one `card.md` as written by `formatCardMarkdown` in sync-trello.ts.
 * Tolerant of missing fields: hand-synced or older files fall back to the
 * filename for the number and an empty label set, so one malformed file never
 * sinks the whole map.
 */
function parseCard(content: string, filename: string): Omit<CardEntry, 'relPath' | 'list'> {
  const number = Number.parseInt(parseHeaderField(content, 'Trello Card') ?? '', 10) || parseCardNumber(filename);
  const labels = (parseHeaderField(content, 'Labels') ?? '')
    .split(',')
    .map(l => l.trim())
    .filter(l => l !== '' && l !== 'None');
  return {
    key: parseHeaderField(content, 'Slug') ?? String(number),
    number,
    title: parseCardTitle(content) ?? filename.replace(/\.md$/, ''),
    labels,
    url: parseHeaderField(content, 'Short URL'),
    checkItems: parseCheckItems(content),
  };
}

/**
 * Parses checklist items out of the `## Checklists` section: one
 * `- [x| ] (itemId) name` line per item. Scoped to the section so a comment
 * that happens to look like a checkbox can never leak in.
 */
function parseCheckItems(content: string): CheckItemEntry[] {
  const section = sectionOf(content, 'Checklists');
  if (!section) { return []; }
  const items: CheckItemEntry[] = [];
  const re = /^- \[(x| )\] \(([^)]+)\) (.+)$/gm;
  for (const match of section.matchAll(re)) {
    items.push({ id: match[2], name: match[3].trim(), complete: match[1] === 'x' });
  }
  return items;
}

// ============================================================================
// TREE LOADING
// ============================================================================

function listCardDirs(root: string): string[] {
  if (!existsSync(root)) { return []; }
  return readdirSync(root, { withFileTypes: true })
    .filter(e => e.isDirectory() && e.name !== 'templates')
    .map(e => e.name)
    .sort();
}

function readCardFiles(dir: string): string[] {
  if (!existsSync(dir)) { return []; }
  return readdirSync(dir).filter(f => f.endsWith('.md')).sort();
}

/**
 * Extracts the real list names from a `board.md` index (`- <name> (N cards)`
 * lines under `## Lists`). Needed because an empty list has no card.md to carry
 * its `**List:**` header, so its directory name (slugified) is all a card-only
 * walk can see.
 */
function parseBoardListNames(content: string): string[] {
  const section = sectionOf(content, 'Lists');
  if (!section) { return []; }
  const names: string[] = [];
  for (const match of section.matchAll(/^- (.+?) \(\d+ cards?\)$/gm)) {
    names.push(match[1]);
  }
  return names;
}

/**
 * Loads the whole Trello cache into memory. Returns null when the tree is absent
 * or has never been synced — the caller decides how loudly to say so.
 */
function loadTrelloTree(root: string): TrelloModel | null {
  const boardMdPath = join(root, 'board.md');
  const boardListNames = existsSync(boardMdPath)
    ? parseBoardListNames(readFileSync(boardMdPath, 'utf-8'))
    : [];
  const realNameByDir = new Map<string, string>();
  for (const name of boardListNames) {
    realNameByDir.set(slugify(name), name);
  }

  const lists: ListEntry[] = [];
  for (const dirName of listCardDirs(root)) {
    const dir = join(root, dirName);
    const cards: CardEntry[] = readCardFiles(dir).map((file) => {
      const full = join(dir, file);
      const content = readFileSync(full, 'utf-8');
      const parsed = parseCard(content, file);
      const list = parseHeaderField(content, 'List') ?? dirName;
      return { ...parsed, list, relPath: toPosixPath(relative(root, full)) };
    });
    const name = cards[0]?.list ?? realNameByDir.get(dirName) ?? dirName;
    lists.push({ name, cards });
  }

  if (lists.length === 0) { return null; }

  const allCards = lists.flatMap(l => l.cards);
  return {
    lists,
    cardsWithoutAc: allCards.filter(c => c.checkItems.length === 0),
    cardsWithoutLabels: allCards.filter(c => c.labels.length === 0),
  };
}

// ============================================================================
// GAP COMPUTATION
// ============================================================================

function computeGaps(model: TrelloModel): GapReport {
  return {
    cardsWithoutAc: model.cardsWithoutAc,
    cardsWithoutLabels: model.cardsWithoutLabels,
    listsWithoutCards: model.lists.filter(l => l.cards.length === 0),
  };
}

function collectAllCards(model: TrelloModel): CardEntry[] {
  return model.lists.flatMap(l => l.cards);
}

/** Discipline rollup derived from the SAME parsed cards — no second source of truth. */
function groupByLabel(cards: CardEntry[]): Map<string, CardEntry[]> {
  const groups = new Map<string, CardEntry[]>();
  for (const card of cards) {
    const buckets = card.labels.length > 0 ? card.labels : ['(no label)'];
    for (const label of buckets) {
      const list = groups.get(label) ?? [];
      list.push(card);
      groups.set(label, list);
    }
  }
  return new Map([...groups.entries()].sort(([a], [b]) => {
    if (a === '(no label)') { return -1; }
    if (b === '(no label)') { return 1; }
    return a.localeCompare(b);
  }));
}

// ============================================================================
// HTML RENDERING
// ============================================================================

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function keyLink(key: string, url: string | null): string {
  const safe = escapeHtml(key);
  return url ? `<a class="key" href="${escapeHtml(url)}">${safe}</a>` : `<span class="key">${safe}</span>`;
}

function labelChips(labels: string[]): string {
  if (labels.length === 0) { return '<span class="chip chip-warn">no label</span>'; }
  return labels.map(l => `<span class="chip chip-neutral">${escapeHtml(l)}</span>`).join(' ');
}

function acBadge(card: CardEntry): string {
  if (card.checkItems.length === 0) { return '<span class="chip chip-bad">NO ACs</span>'; }
  const done = card.checkItems.filter(i => i.complete).length;
  return `<span class="chip chip-neutral">${done}/${card.checkItems.length} ACs</span>`;
}

function checkItemRows(items: CheckItemEntry[]): string {
  return items.map(item => `
    <tr>
      <td>${item.complete ? '<span class="chip chip-good">done</span>' : '<span class="chip chip-warn">open</span>'}</td>
      <td class="summary">${escapeHtml(item.name)}</td>
      <td><span class="key">${escapeHtml(item.id)}</span></td>
    </tr>`).join('');
}

function checkItemTable(card: CardEntry): string {
  if (card.checkItems.length === 0) {
    return '<p class="empty">No checklist items — acceptance criteria not yet defined.</p>';
  }
  return `
    <div class="scroll-x">
      <table class="narrow">
        <thead><tr><th>State</th><th>Checklist item (AC)</th><th>Item id</th></tr></thead>
        <tbody>${checkItemRows(card.checkItems)}</tbody>
      </table>
    </div>`;
}

function cardBlock(card: CardEntry): string {
  const cacheLink = `<a class="dim" href="${escapeHtml(card.relPath)}">cache</a>`;
  return `
    <details class="story" open>
      <summary>${keyLink(card.key, card.url)} ${escapeHtml(card.title)} ${labelChips(card.labels)} ${acBadge(card)} ${cacheLink}</summary>
      ${checkItemTable(card)}
    </details>`;
}

function renderListTree(model: TrelloModel): string {
  const listBlocks = model.lists.map((list) => {
    const done = list.cards.reduce((n, c) => n + c.checkItems.filter(i => i.complete).length, 0);
    const total = list.cards.reduce((n, c) => n + c.checkItems.length, 0);
    const gapBadge = list.cards.length > 0 && total === 0
      ? '<span class="chip chip-bad">NO ACs</span>'
      : '';
    const cardBlocks = list.cards.map(cardBlock).join('');
    return `
      <details class="epic" open>
        <summary><strong>${escapeHtml(list.name)}</strong>
          <span class="dim">${list.cards.length} cards · ${done}/${total} ACs done</span> ${gapBadge}</summary>
        ${list.cards.length > 0 ? cardBlocks : '<p class="empty">No cards in this list.</p>'}
      </details>`;
  }).join('');

  return `
    <section id="tree">
      <h2>Coverage tree — List → Card → AC</h2>
      ${listBlocks}
    </section>`;
}

function renderLabelView(model: TrelloModel): string {
  const groups = groupByLabel(collectAllCards(model));
  const rows = [...groups.entries()].map(([label, cards]) => {
    const withAc = cards.filter(c => c.checkItems.length > 0).length;
    const isGap = label === '(no label)';
    return `
      <tr class="${isGap ? 'row-gap' : ''}">
        <td>${escapeHtml(label)}</td>
        <td>${cards.length}</td>
        <td>${withAc}</td>
        <td class="summary">${cards.map(c => keyLink(c.key, c.url)).join(' ')}</td>
      </tr>`;
  }).join('');
  return `
    <section id="labels">
      <h2>By discipline label</h2>
      <p class="dim">Same parsed corpus, second axis — labels come from each card's own header.</p>
      <div class="scroll-x">
        <table>
          <thead><tr><th>Label</th><th>Cards</th><th>With ACs</th><th>Slugs</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>`;
}

function gapCard(count: number, label: string, tone: 'bad' | 'warn', body: string): string {
  const cls = count === 0 ? 'good' : tone;
  return `
    <details class="gap-card gap-${cls}" ${count > 0 ? 'open' : ''}>
      <summary><span class="gap-count">${count}</span> ${escapeHtml(label)}</summary>
      ${count > 0 ? body : '<p class="empty">Nothing here — good.</p>'}
    </details>`;
}

function renderGapSection(gaps: GapReport): string {
  const noAcList = `<ul>${gaps.cardsWithoutAc.map(c =>
    `<li>${keyLink(c.key, c.url)} ${escapeHtml(c.title)} <span class="dim">(${escapeHtml(c.list)})</span></li>`,
  ).join('')}</ul>`;

  const noLabelList = `<ul>${gaps.cardsWithoutLabels.map(c =>
    `<li>${keyLink(c.key, c.url)} ${escapeHtml(c.title)} <span class="dim">(${escapeHtml(c.list)})</span></li>`,
  ).join('')}</ul>`;

  const emptyLists = `<ul>${gaps.listsWithoutCards.map(l =>
    `<li>${escapeHtml(l.name)}</li>`,
  ).join('')}</ul>`;

  return `
    <section id="gaps">
      <h2>Gaps</h2>
      <div class="gap-grid">
        ${gapCard(gaps.cardsWithoutAc.length, 'cards with no checklist (ACs not defined)', 'bad', noAcList)}
        ${gapCard(gaps.cardsWithoutLabels.length, 'cards with no label (no discipline home)', 'warn', noLabelList)}
        ${gapCard(gaps.listsWithoutCards.length, 'empty lists', 'warn', emptyLists)}
      </div>
    </section>`;
}

function renderHtml(model: TrelloModel, gaps: GapReport): string {
  const allCards = collectAllCards(model);
  const totalAc = allCards.reduce((n, c) => n + c.checkItems.length, 0);
  const totalDone = allCards.reduce((n, c) => n + c.checkItems.filter(i => i.complete).length, 0);
  const generated = new Date().toISOString().replace('T', ' ').slice(0, 16);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Test Map</title>
<style>
  :root {
    --bg: #0f1217; --panel: #171c24; --panel-2: #1d242f; --border: #2a3342;
    --text: #d7dde6; --dim: #8a94a6; --accent: #5aa9e6;
    --good: #3fb96f; --warn: #e0a83e; --bad: #e05d5d;
  }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 1.5rem; background: var(--bg); color: var(--text);
    font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, sans-serif; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  h1 { font-size: 1.4rem; margin: 0 0 .25rem; }
  h2 { font-size: 1.1rem; margin: 2rem 0 .75rem; border-bottom: 1px solid var(--border); padding-bottom: .4rem; }
  .dim { color: var(--dim); font-weight: normal; }
  .totals { display: flex; flex-wrap: wrap; gap: 1.5rem; margin: 1rem 0; }
  .totals div { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: .6rem 1rem; }
  .totals strong { font-size: 1.3rem; display: block; }
  .gap-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; }
  .gap-card { background: var(--panel); border-radius: 8px; padding: .75rem 1rem; border-left: 4px solid var(--border); }
  .gap-card summary { cursor: pointer; font-weight: 600; }
  .gap-count { font-size: 1.5rem; margin-right: .35rem; }
  .gap-bad { border-left-color: var(--bad); } .gap-bad .gap-count { color: var(--bad); }
  .gap-warn { border-left-color: var(--warn); } .gap-warn .gap-count { color: var(--warn); }
  .gap-good { border-left-color: var(--good); } .gap-good .gap-count { color: var(--good); }
  .gap-card ul { margin: .5rem 0 0; padding-left: 1.2rem; max-height: 22rem; overflow-y: auto; }
  details.epic { background: var(--panel); border: 1px solid var(--border); border-radius: 8px;
    padding: .6rem .9rem; margin: .75rem 0; }
  details.epic > summary { cursor: pointer; font-size: 1rem; }
  details.story { background: var(--panel-2); border: 1px solid var(--border); border-radius: 6px;
    padding: .4rem .7rem; margin: .5rem 0 .5rem 1rem; }
  details.story > summary { cursor: pointer; }
  .scroll-x { overflow-x: auto; margin: .5rem 0; }
  table { border-collapse: collapse; width: 100%; min-width: 640px; }
  table.narrow { min-width: 280px; width: auto; }
  th, td { text-align: left; padding: .35rem .6rem; border-bottom: 1px solid var(--border); vertical-align: top; }
  th { color: var(--dim); font-weight: 600; white-space: nowrap; }
  td.summary { max-width: 40rem; }
  .key { font-family: ui-monospace, monospace; white-space: nowrap; }
  .chip { display: inline-block; border-radius: 10px; padding: 0 .5rem; font-size: .75rem;
    font-weight: 600; white-space: nowrap; }
  .chip-good { background: rgba(63,185,111,.15); color: var(--good); }
  .chip-bad { background: rgba(224,93,93,.15); color: var(--bad); }
  .chip-warn { background: rgba(224,168,62,.15); color: var(--warn); }
  .chip-neutral { background: rgba(90,169,230,.15); color: var(--accent); }
  .row-gap td { background: rgba(224,168,62,.08); }
  .empty { color: var(--dim); font-style: italic; margin: .4rem 0; }
</style>
</head>
<body>
<h1>Test Map</h1>
<p class="dim">Generated ${generated} from <code>.context/trello/</code> (read-only cache of the Trello board — refresh with <code>bun run trello:sync</code>).</p>
<div class="totals">
  <div><strong>${model.lists.length}</strong> lists</div>
  <div><strong>${allCards.length}</strong> cards</div>
  <div><strong>${totalAc}</strong> checklist items (ACs)</div>
  <div><strong>${totalDone}</strong> ACs done</div>
</div>
${renderGapSection(gaps)}
${renderListTree(model)}
${renderLabelView(model)}
</body>
</html>
`;
}

// ============================================================================
// MAIN
// ============================================================================

const USAGE = `
Usage: bun scripts/tests-map.ts [options]

Reads .context/trello/ (already synced from Trello) and writes a self-contained
HTML test map. No network calls.

Options:
  --out <path>   Output file (default: .context/reports/test-map.html)
  --json         Also print the gap summary as JSON to stdout
  help           Show this message
`;

function main(): void {
  const args = process.argv.slice(2);
  if (args.includes('help') || args.includes('--help')) {
    console.log(USAGE);
    return;
  }
  const outFlag = args.indexOf('--out');
  const outPath = outFlag !== -1 && args[outFlag + 1]
    ? args[outFlag + 1]
    : join('.context', 'reports', 'test-map.html');
  const asJson = args.includes('--json');

  const trelloRoot = join(process.cwd(), '.context', 'trello');
  const model = loadTrelloTree(trelloRoot);
  if (!model) {
    // Cold clone or never-synced cache: not an error, just nothing to map.
    log.warn('.context/trello/ is empty or absent — nothing to map.');
    log.info('Run `bun run trello:sync` first, then re-run this command.');
    return;
  }

  const gaps = computeGaps(model);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, renderHtml(model, gaps));

  log.title('Test Map');
  log.success(`Wrote ${outPath}`);
  log.info(`${model.lists.length} lists · ${collectAllCards(model).length} cards · ${collectAllCards(model).reduce((n, c) => n + c.checkItems.length, 0)} checklist items`);
  const gapTotal = gaps.cardsWithoutAc.length + gaps.cardsWithoutLabels.length + gaps.listsWithoutCards.length;
  if (gapTotal > 0) {
    log.warn(`${gaps.cardsWithoutAc.length} cards without ACs · ${gaps.cardsWithoutLabels.length} cards without label · ${gaps.listsWithoutCards.length} empty lists`);
  }
  else {
    log.success('No coverage gaps detected.');
  }
  if (asJson) {
    console.log(JSON.stringify({
      lists: model.lists.length,
      cards: collectAllCards(model).length,
      checklistItems: collectAllCards(model).reduce((n, c) => n + c.checkItems.length, 0),
      gaps: {
        cardsWithoutAc: gaps.cardsWithoutAc.map(c => c.key),
        cardsWithoutLabels: gaps.cardsWithoutLabels.map(c => c.key),
        listsWithoutCards: gaps.listsWithoutCards.map(l => l.name),
      },
    }, null, 2));
  }
  log.info(`Open it: open ${outPath}`);
}

export {
  collectAllCards,
  computeGaps,
  groupByLabel,
  loadTrelloTree,
  parseCard,
  parseCardNumber,
  parseCheckItems,
  parseHeaderField,
  sectionOf,
};

export type { CardEntry, CheckItemEntry, GapReport, ListEntry, TrelloModel };

// Guarded so the pure helpers above can be imported by tests without running
// the generator. Same convention as scripts/sync-trello.ts.
if (import.meta.main) {
  main();
}
