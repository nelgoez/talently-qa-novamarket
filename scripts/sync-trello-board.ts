#!/usr/bin/env bun
/**
 * sync-trello-board.ts — write the committed Trello board catalog.
 *
 * Fetches the board's open lists and labels from the live Trello API and writes
 * them to `.agents/trello-board.json` (committed). That catalog is the offline,
 * readable source every other Trello script reads for the board id/url and for the
 * drift fail-safe (`trello:board:check`). It is the Trello analogue of the Jira
 * catalogs (`jira-fields.json` / `jira-workflows.json`).
 *
 * Auth: `TRELLO_API_KEY` + `TRELLO_TOKEN` from `.env`. The board id comes from
 * `.agents/project.yaml` -> `issue_tracker.trello_board_id`.
 *
 * On any network/auth failure the script exits non-zero WITHOUT writing the file,
 * so a broken catalog can never replace a good one.
 */

import type { TrelloBoardCatalog, TrelloLabel, TrelloList } from './trello-shared';
import { mkdirSync, writeFileSync } from 'node:fs';

import { dirname } from 'node:path';
import {
  log,
  projectTrelloConfig,
  TRELLO_BOARD_JSON,

  trelloGet,

} from './trello-shared';

async function main(): Promise<void> {
  const config = projectTrelloConfig();
  if (!config.boardId) {
    log.error('issue_tracker.trello_board_id is not set in .agents/project.yaml');
    process.exit(1);
  }

  try {
    const lists = await trelloGet<TrelloList[]>(`/boards/${config.boardId}/lists?filter=open`);
    const labels = await trelloGet<TrelloLabel[]>(`/boards/${config.boardId}/labels`);

    const catalog: TrelloBoardCatalog = {
      boardId: config.boardId,
      boardUrl: config.boardUrl ?? '',
      lists: lists.map(list => ({ id: list.id, name: list.name })),
      labels: labels.map(label => ({ id: label.id, name: label.name, color: label.color })),
    };

    mkdirSync(dirname(TRELLO_BOARD_JSON), { recursive: true });
    writeFileSync(TRELLO_BOARD_JSON, `${JSON.stringify(catalog, null, 2)}\n`);
    log.success(`Wrote .agents/trello-board.json (${catalog.lists.length} lists, ${catalog.labels.length} labels)`);
  }
  catch (err) {
    log.error(`Failed to fetch the board — catalog NOT written: ${(err as Error).message}`);
    process.exit(1);
  }
}

if (import.meta.main) {
  void main();
}
