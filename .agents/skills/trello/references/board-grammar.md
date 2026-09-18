# Board Grammar — the `trello` CLI (HOW)

This reference is the command surface for the `trello` skill. It records the verbs, the
slug rule, the checklist↔AC mapping, and the Drive-matrix link-back that the SKILL.md
frontmatter describes at the WHAT level. The `trello` CLI (Scale-Flow/trello-cli) is
JSON-first and self-documenting: `trello <resource> <verb> --help` is authoritative for
exact flags and output shapes, so the tables below are a map, not a full spec.

## Auth

```sh
trello auth set --api-key <key> --token <token>
trello auth status --pretty          # expect "configured": true
```

The key + token come from `TRELLO_API_KEY` + `TRELLO_TOKEN` in `.env` (the CLI falls back
to the environment when no auth is stored). Get both at <https://trello.com/power-ups/admin>
(create a Power-Up → `API Key` tab → Generate key → `Token` link → Allow). The token grants
access to every board you can already see, so a personal Power-Up on a guest workspace is fine.

## Resources and verbs

| Resource      | Verbs (known)            | Notes                                                          |
| ------------- | ------------------------ | -------------------------------------------------------------- |
| `boards`      | `list`                   | enumerate boards you belong to; the canonical board is `{{TRELLO_BOARD}}` |
| `lists`       | (list/get)               | lists of a board — the workflow states (`Por hacer`, `En curso`, `En Prueba`, `Finalizada`) |
| `cards`       | `list`, `get`, `create`, `update`, `move` | card description carries `## Test Plan` + the Drive link-backs |
| `checklists`  | `list`, `add`/`add-item` | one checklist item = one AC; a `## Tests` divider holds manual tests |
| `comments`    | `list`, `add`            | append-only test results (`## Test Results — <date>`)          |
| `labels`      | `list`, (create)         | discipline labels: `UX` / `FRONT` / `BACK` / `QA` / `PO` / `OPS` / `DOC` |
| `auth`        | `set`, `status`          | store + verify the API key / token                             |

For any verb not listed (e.g. attachment upload, card archive), ask the CLI:
`trello <resource> <verb> --help`. Detailed reads (card description, checklist items,
comments) return structured JSON on every command — prefer them over the web UI.

## Card identity and the slug rule

- A card's real identity is **Trello's own card number** — the `#9` in
  `https://trello.com/c/pxHg8Tzs/9-…`. It is unique, never reused, and already in every
  card URL.
- The **slug** every other surface links to is that number prefixed by the discipline
  label: `{LABEL}-{trello-number}` → `QA-9`, `FRONT-2`, `UX-5`.
- Never use a hand-assigned `-NNN` (`QA-001`): it collides, skips, and drifts from the
  order cards were actually created. A card is referenced as `QA-9`, never `QA-001`.

## Checklist ↔ AC mapping

- **One checklist item = one acceptance criterion.** The checklist IS the AC source of
  truth for the card; a card with no checklist means its ACs are not yet defined.
- The **item id** is the stable reference. In the Drive matrix the `AC` column points at
  the checklist item (`AC-1`, `AC-2`, …), never at a paraphrase — a paraphrased AC drifts
  from the real AC the moment the card is edited.
- Test cases are checklist items under a `## Tests` divider (manual tests, checkbox =
  pass/fail at a glance), or a linked Drive doc when a card grows beyond ~10 tests.

## Drive-matrix link-back

The traceability spine (which test covers which feature) lives in a **Google Sheet**, one
matrix per feature/area, with the columns `Feature → Card → AC → Test case → Env → Result → Evidence`.
It is linked from the card, not copied:

- The card description carries a `## Test Matrix` line (the Sheet URL) and a `## Docs`
  line (proposals / briefs). The Sheet's `Card` column carries the card slug back —
  bidirectional.
- The repo references the matrix by URL and never copies its contents into git.
- A test with no `Card` slug in the matrix is an orphan (a coverage gap, not a defect).

Where a full matrix is overkill (a 3-AC card), the same traceability collapses into the
card's own checklist and the matrix is skipped — the rule is that the spine exists
somewhere reachable from the card, not that it is always a separate doc.

## Repo sync commands

The repo wraps the raw CLI in its own sync surface (mirroring the Jira sync scripts it
replaces; design in `docs/qa-standard/trello-parity-plan.md`):

- `bun run trello:sync [--card <id>] [--board] [--include-comments]` — pull board → lists
  → cards (description, checklist items, labels, comments, Drive links) into a gitignored
  local cache under `.context/trello/`.
- `bun run trello:sync-board` — write the board catalog (board id, list names, label
  names) for offline reads and drift checks.
- `bun run trello:board:check` — validate the catalog against the live board (list/label
  drift), the fail-safe that guards the sync.

These scripts wrap the raw CLI — `trello:sync` writes the gitignored `.context/trello/`
cache, `trello:sync-board` writes the committed board catalog, and `trello:board:check`
guards against drift. Use the sync scripts for bulk mirroring; use the raw `trello` CLI for
single, immediate reads and writes.
