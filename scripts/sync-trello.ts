#!/usr/bin/env bun
/**
 * sync-trello.ts — pull a Trello board into a local, gitignored mirror.
 *
 * Trello is the source of truth; `.context/trello/` is a read-only cache that this
 * script rebuilds from scratch. One `.md` per card, grouped by list (slugified list
 * name), plus a top-level `board.md` index of lists and labels. See
 * `.context/trello/README.md` for the tier rules and layout.
 *
 * Auth: `TRELLO_API_KEY` + `TRELLO_TOKEN` from `.env`. Board id from
 * `.agents/trello-board.json` (falling back to `.agents/project.yaml`).
 *
 * USAGE:
 *   bun scripts/sync-trello.ts [options]
 *
 * OPTIONS:
 *   --board                 Full board sync (default)
 *   --card <idOrShortLink>  Single card (Trello id, shortLink, or number)
 *   --include-comments      Also pull card comments
 *   --help                  Show usage
 */

import type { TrelloAction, TrelloAttachment, TrelloCard, TrelloChecklist, TrelloLabel, TrelloList } from './trello-shared';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';

import { join } from 'node:path';
import {
  cardSlug,
  log,
  resolveBoardId,
  resolveBoardUrl,
  slugify,
  toPosixPath,
  TRELLO_CACHE,

  trelloGet,

} from './trello-shared';

interface IndexEntry {
  list: string
  listDir: string
  cardFile: string
  cardTitle: string
  cardSlug: string
}

// ============================================================================
// MARKDOWN RENDERING
// ============================================================================

interface CardMarkdownInput {
  card: TrelloCard
  listName: string
  labels: string[]
  checklists: TrelloChecklist[]
  actions: TrelloAction[]
  attachments: TrelloAttachment[]
}

function formatCardMarkdown(input: CardMarkdownInput): string {
  const { card, listName, labels, checklists, actions, attachments } = input;
  const slug = cardSlug(labels, card.idShort);
  const lines: string[] = [
    `# ${card.name}`,
    '',
    `**Trello Card:** ${card.idShort}`,
    `**Slug:** ${slug}`,
    `**Short URL:** ${card.shortUrl}`,
    `**List:** ${listName}`,
    `**Labels:** ${labels.length > 0 ? labels.join(', ') : 'None'}`,
    '',
    '---',
    '',
    '## Description',
    '',
    card.desc.trim() || '_(no description)_',
    '',
    '---',
    '',
    '## Checklists',
    '',
  ];

  if (checklists.length === 0) {
    lines.push('_No checklists — acceptance criteria not yet defined._');
  }
  else {
    for (const checklist of checklists) {
      lines.push(`### ${checklist.name}`, '');
      if (checklist.checkItems.length === 0) {
        lines.push('_Empty checklist._');
      }
      else {
        for (const item of checklist.checkItems) {
          const mark = item.state === 'complete' ? 'x' : ' ';
          lines.push(`- [${mark}] (${item.id}) ${item.name}`);
        }
      }
      lines.push('');
    }
  }

  lines.push('---', '', '## Attachments', '');
  if (attachments.length === 0) {
    lines.push('_None._');
  }
  else {
    for (const attachment of attachments) {
      lines.push(`- [${attachment.name}](${attachment.url})`);
    }
  }

  if (actions.length > 0) {
    lines.push('', '---', '', '## Comments', '');
    for (const action of actions) {
      const author = action.memberCreator?.fullName ?? action.memberCreator?.username ?? 'Unknown';
      lines.push(`**${author}** - ${action.date}`, '');
      lines.push(action.data?.text ?? '', '');
    }
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

function formatBoardIndex(
  boardId: string,
  boardUrl: string,
  lists: TrelloList[],
  labels: TrelloLabel[],
  entries: IndexEntry[],
): string {
  const lines: string[] = [
    '# Trello Board Mirror',
    '',
    `**Board ID:** ${boardId}`,
    `**Board URL:** ${boardUrl}`,
    '',
    '---',
    '',
    '## Lists',
    '',
  ];

  for (const list of lists) {
    const count = entries.filter(e => e.list === list.name).length;
    lines.push(`- ${list.name} (${count} cards)`);
  }

  lines.push('', '---', '', '## Labels', '');
  if (labels.length === 0) {
    lines.push('_None._');
  }
  else {
    for (const label of labels) {
      lines.push(`- ${label.name}${label.color ? ` (${label.color})` : ''}`);
    }
  }

  lines.push('', '---', '', '## Cards', '');
  if (entries.length === 0) {
    lines.push('_No cards._');
  }
  else {
    for (const entry of entries) {
      const posix = toPosixPath(join(entry.listDir, entry.cardFile));
      lines.push(`- [${entry.cardSlug}] ${entry.cardTitle} - \`${posix}\``);
    }
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

// ============================================================================
// FETCH + WRITE
// ============================================================================

async function resolveCardById(boardId: string, idOrShortLink: string): Promise<TrelloCard> {
  if (/^\d+$/.test(idOrShortLink)) {
    const cards = await trelloGet<TrelloCard[]>(`/boards/${boardId}/cards`);
    const match = cards.find(c => String(c.idShort) === idOrShortLink);
    if (!match) {
      throw new Error(`No open card with number ${idOrShortLink} on this board`);
    }
    return match;
  }
  return trelloGet<TrelloCard>(`/cards/${idOrShortLink}`);
}

async function fetchCardExtras(card: TrelloCard, includeComments: boolean): Promise<{
  checklists: TrelloChecklist[]
  actions: TrelloAction[]
  attachments: TrelloAttachment[]
}> {
  const [checklists, attachments, actions] = await Promise.all([
    trelloGet<TrelloChecklist[]>(`/cards/${card.id}/checklists`),
    trelloGet<TrelloAttachment[]>(`/cards/${card.id}/attachments`),
    includeComments ? trelloGet<TrelloAction[]>(`/cards/${card.id}/actions?filter=commentCard`) : Promise.resolve([]),
  ]);
  return { checklists, actions, attachments };
}

function writeCard(input: CardMarkdownInput, listDir: string): string {
  const cardFile = `${input.card.idShort}-${slugify(input.card.name)}.md`;
  mkdirSync(join(TRELLO_CACHE, listDir), { recursive: true });
  writeFileSync(join(TRELLO_CACHE, listDir, cardFile), formatCardMarkdown(input));
  log.info(`  card ${input.card.idShort}: ${input.card.name} (${input.labels.length > 0 ? input.labels.join(', ') : 'no label'})`);
  return cardFile;
}

async function syncBoard(boardId: string, includeComments: boolean): Promise<void> {
  const lists = await trelloGet<TrelloList[]>(`/boards/${boardId}/lists?filter=open`);
  const labels = await trelloGet<TrelloLabel[]>(`/boards/${boardId}/labels`);
  const boardUrl = resolveBoardUrl();

  mkdirSync(TRELLO_CACHE, { recursive: true });

  const labelNameById = new Map(labels.map(l => [l.id, l.name]));
  const entries: IndexEntry[] = [];
  const writtenByList = new Map<string, Set<string>>();
  const currentListDirs = new Set<string>();

  for (const list of lists) {
    const listDir = slugify(list.name);
    currentListDirs.add(listDir);
    const written = new Set<string>();
    writtenByList.set(listDir, written);
    // Materialize a dir even for an empty list so the mirror (and tests:map)
    // can surface "empty column" as a visible gap rather than a silent absence.
    mkdirSync(join(TRELLO_CACHE, listDir), { recursive: true });

    const cards = await trelloGet<TrelloCard[]>(`/lists/${list.id}/cards`);
    for (const card of cards) {
      if (card.closed) { continue; }
      const cardLabels = card.idLabels
        .map(id => labelNameById.get(id))
        .filter((name): name is string => name !== undefined && name !== '');
      const { checklists, actions, attachments } = await fetchCardExtras(card, includeComments);
      const cardFile = writeCard(
        { card, listName: list.name, labels: cardLabels, checklists, actions, attachments },
        listDir,
      );
      written.add(cardFile);
      entries.push({ list: list.name, listDir, cardFile, cardTitle: card.name, cardSlug: cardSlug(cardLabels, card.idShort) });
    }
  }

  writeFileSync(join(TRELLO_CACHE, 'board.md'), formatBoardIndex(boardId, boardUrl, lists, labels, entries));
  pruneCache(currentListDirs, writtenByList);

  log.success(`Synced ${entries.length} cards across ${lists.length} lists into .context/trello/`);
}

async function syncSingleCard(boardId: string, idOrShortLink: string, includeComments: boolean): Promise<void> {
  const lists = await trelloGet<TrelloList[]>(`/boards/${boardId}/lists?filter=open`);
  const labels = await trelloGet<TrelloLabel[]>(`/boards/${boardId}/labels`);
  const listNameById = new Map(lists.map(l => [l.id, l.name]));
  const labelNameById = new Map(labels.map(l => [l.id, l.name]));

  const card = await resolveCardById(boardId, idOrShortLink);
  const listName = listNameById.get(card.idList) ?? card.idList;
  const cardLabels = card.idLabels
    .map(id => labelNameById.get(id))
    .filter((name): name is string => name !== undefined);
  const { checklists, actions, attachments } = await fetchCardExtras(card, includeComments);

  const listDir = slugify(listName);
  const cardFile = writeCard(
    { card, listName, labels: cardLabels, checklists, actions, attachments },
    listDir,
  );

  log.success(`Synced card ${card.idShort} -> .context/trello/${toPosixPath(join(listDir, cardFile))}`);
}

/**
 * Removes cache files the board no longer owns so the mirror stays a faithful
 * copy: list dirs that disappeared, and card.md files that were archived or
 * deleted. Never touches the committed `templates/` dir or `README.md`.
 */
function pruneCache(currentListDirs: Set<string>, writtenByList: Map<string, Set<string>>): void {
  if (!existsSync(TRELLO_CACHE)) { return; }
  for (const entry of readdirSync(TRELLO_CACHE, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'templates') { continue; }
    if (!currentListDirs.has(entry.name)) {
      rmSync(join(TRELLO_CACHE, entry.name), { recursive: true, force: true });
      continue;
    }
    const written = writtenByList.get(entry.name) ?? new Set<string>();
    for (const file of readdirSync(join(TRELLO_CACHE, entry.name))) {
      if (file.endsWith('.md') && !written.has(file)) {
        rmSync(join(TRELLO_CACHE, entry.name, file), { force: true });
      }
    }
  }
}

// ============================================================================
// CLI
// ============================================================================

const USAGE = `
Usage: bun scripts/sync-trello.ts [options]

Pulls the Trello board into .context/trello/ (gitignored cache). Trello is the
source of truth.

Options:
  --board                 Full board sync (default)
  --card <idOrShortLink>  Sync a single card (Trello id, shortLink, or number)
  --include-comments      Also pull card comments
  --help                  Show this message
`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(USAGE);
    return;
  }

  const cardIndex = args.indexOf('--card');
  const card = cardIndex !== -1 ? args[cardIndex + 1] : null;
  const includeComments = args.includes('--include-comments');

  let boardId: string;
  try {
    boardId = resolveBoardId();
  }
  catch (err) {
    log.error((err as Error).message);
    process.exit(1);
  }

  try {
    if (card) {
      await syncSingleCard(boardId, card, includeComments);
    }
    else {
      await syncBoard(boardId, includeComments);
    }
  }
  catch (err) {
    log.error(`Sync failed: ${(err as Error).message}`);
    process.exit(1);
  }
}

if (import.meta.main) {
  main().catch((err) => {
    log.error(`Unexpected error: ${(err as Error).message}`);
    process.exit(1);
  });
}
