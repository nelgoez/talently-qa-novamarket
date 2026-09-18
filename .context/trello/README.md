# Trello Board Mirror

Local, read-only cache of the `Novamarket` Trello board, shared by the QA workflow.

> **This tree is a CACHE of Trello, and it is gitignored.** Trello is the source of truth.
> `bun run trello:sync` rebuilds the whole thing from scratch, which is exactly why it is not
> committed: two sessions that re-sync at different times would otherwise produce conflicting
> commits of the same generated content. Authoritative ownership rules live in `AGENTS.md` §9.

## Three tiers, three lifecycles

Everything under `.context/trello/` is one of three things. Getting the tier wrong is the most
common mistake here, so check this table before creating any file.

| Tier | Source of truth | In git? | How it is produced | How it is recovered |
|---|---|---|---|---|
| **`[SYNC]`** | Trello | No | `scripts/sync-trello.ts` writes it | `bun run trello:sync` |
| **`[COMMIT]`** | This repo | **Yes** | A human authors it | `git checkout` |
| **`[LOCAL]`** | Nothing durable | No | A skill authors it during a session | Not recovered — disposable by design |

`[SYNC]` files are **forbidden to hand-write** — every sync overwrites them and no file is
protected. To set a card's content, edit it in Trello, then re-run `bun run trello:sync`.

## Layout

```
.context/trello/
  README.md                 [COMMIT] this file
  templates/                [COMMIT] skeletons; do not edit per-project
  board.md                  [SYNC] index of lists + labels + card links
  <list-slug>/              [SYNC] one dir per open list (slugified list name)
    <number>-<slug>.md      [SYNC] one card.md per card
```

`<number>` is the card's Trello number (the `#9` in its short URL); `<slug>` is the kebab-case
title. The card's canonical reference elsewhere is its **slug** `{LABEL}-{number}` (e.g. `QA-9`)
per `docs/qa-standard/traceability-trello-drive.md` §1; it is written into each `card.md` as the
`**Slug:**` header.

## Card `.md` shape

Each `card.md` holds, in order: the `# ` title, `**Trello Card:**` (number), `**Slug:**`,
`**Short URL:**`, `**List:**`, `**Labels:**`, then `## Description`, `## Checklists` (one
`- [x] (id) name` line per checklist item — the item id is the stable AC reference, no hand
`AC-NNN`), `## Attachments`, and `## Comments` (only when synced with `--include-comments`).

## Commands

```bash
bun run trello:sync              # full board sync (default)
bun run trello:sync --card 9     # single card (Trello id, shortLink, or number)
bun run trello:sync --include-comments
bun run trello:sync-board        # write the committed board catalog (.agents/trello-board.json)
bun run trello:board:check       # fail-safe: catalog vs live board drift
bun run tests:map                # render the cache as .context/reports/test-map.html
```

Requires `TRELLO_API_KEY` and `TRELLO_TOKEN` in `.env` (see `.env.example`). The board id comes
from `.agents/trello-board.json` (written by `trello:sync-board`) or
`.agents/project.yaml` -> `issue_tracker.trello_board_id`.

## Cold clone

A fresh clone has an almost-empty `.context/trello/` — this README and `templates/`. That is the
intended state, not a broken checkout. `bun run trello:sync` rebuilds the cache. Someone without
Trello credentials keeps an empty cache and can still read `templates/`, run the test suite, and
work on framework code, but not per-ticket QA.

## Conventions

- **Slug**: `{LABEL}-{number}` (label = discipline, `UX`/`FRONT`/`BACK`/`QA`/`PO`/`OPS`/`DOC`);
  a card with no discipline label falls back to its bare number.
- **Names**: kebab-case file names; `<number>-<slug>.md` per card.
- **Checklist = ACs**: one checklist item = one acceptance criterion; the item id is the stable
  reference (not a hand-assigned `AC-NNN`).
