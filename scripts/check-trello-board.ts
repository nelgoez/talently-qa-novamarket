#!/usr/bin/env bun
/**
 * check-trello-board.ts — fail-safe drift check for the board catalog.
 *
 * Compares the committed `.agents/trello-board.json` against the live board (open
 * list names + label names) and exits non-zero, printing every difference, when
 * they diverge. This is the Trello analogue of `jira:sync-workflows`: it catches a
 * board that was renamed/reorganized behind the catalog's back.
 *
 * Exits non-zero on drift OR when Trello is unreachable (an unreachable board is
 * not proof the catalog is still accurate).
 */

import type { TrelloLabel, TrelloList } from './trello-shared';
import { loadBoardCatalog, log, trelloGet } from './trello-shared';

function diffNames(catalogNames: string[], liveNames: string[], kind: string): string[] {
  const catalog = new Set(catalogNames);
  const live = new Set(liveNames);
  const drift: string[] = [];
  for (const name of [...catalog].filter(n => !live.has(n))) {
    drift.push(`${kind} removed from board: "${name}"`);
  }
  for (const name of [...live].filter(n => !catalog.has(n))) {
    drift.push(`${kind} added to board: "${name}"`);
  }
  return drift;
}

async function main(): Promise<void> {
  const catalog = loadBoardCatalog();
  if (!catalog) {
    log.error('No board catalog at .agents/trello-board.json — run `bun run trello:sync-board` first');
    process.exit(1);
  }

  let lists: TrelloList[];
  let labels: TrelloLabel[];
  try {
    lists = await trelloGet<TrelloList[]>(`/boards/${catalog.boardId}/lists?filter=open`);
    labels = await trelloGet<TrelloLabel[]>(`/boards/${catalog.boardId}/labels`);
  }
  catch (err) {
    log.error(`Cannot reach Trello to verify the board: ${(err as Error).message}`);
    process.exit(1);
  }

  const drift = [
    ...diffNames(catalog.lists.map(l => l.name), lists.map(l => l.name), 'list'),
    ...diffNames(catalog.labels.map(l => l.name), labels.map(l => l.name), 'label'),
  ];

  if (drift.length > 0) {
    log.error(`Board drift detected — ${drift.length} difference(s):`);
    for (const line of drift) {
      console.error(`  - ${line}`);
    }
    log.info('Re-catalog with `bun run trello:sync-board` (or update the board to match).');
    process.exit(1);
  }

  log.success(`Board catalog matches the live board (${catalog.lists.length} lists, ${catalog.labels.length} labels)`);
}

if (import.meta.main) {
  void main();
}
