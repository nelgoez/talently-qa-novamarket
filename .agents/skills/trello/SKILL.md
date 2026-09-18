---
name: trello
description: "Operate the NovaMarket Trello board from the terminal — list boards, read/move/create cards, manage checklists (one item = one acceptance criterion), post comments, set discipline labels, and attach evidence via the `trello` CLI (Scale-Flow/trello-cli). Use whenever the user wants a Trello board/card/list/label/checklist/comment operation: 'Trello card', 'move card', 'add checklist', 'add label', 'read this card', 'trello', 'tablero', 'tarjeta', 'mover tarjeta'. Card identity is Trello's own number; the slug is `{LABEL}-{trello-number}` (e.g. `QA-9`); the Google Drive matrix is the traceability spine and is linked from the card, never copied. Auth reads `TRELLO_API_KEY` + `TRELLO_TOKEN` from `.env` (`trello auth set`). This is the repo's `[ISSUE_TRACKER_TOOL]` (Trello replaces Jira/Atlassian). Do NOT use for Jira/Atlassian ticket operations or for authoring automated tests."
license: MIT
compatibility: [claude-code, opencode, codex]
---

# Trello

Thin T1 issue-tracker skill: loaded when the user wants any Trello board / list / card / checklist / label / comment / attachment operation for NovaMarket. The `trello` CLI (Scale-Flow/trello-cli) is the executor — this skill owns the **WHEN/WHAT** (board grammar, slug rule, checklist↔AC mapping, Drive-matrix link-back) and hands the **HOW** (CLI verbs + flags) to `references/board-grammar.md`.

## Compact Rules

- DO treat the `trello` CLI as the executor: read `references/board-grammar.md` for the verbs + flags before issuing any command. The CLI is JSON-first and self-documenting (`trello <resource> <verb> --help`).
- DO read card identity from Trello's own card number — the slug is `{LABEL}-{trello-number}` (`QA-9`), never a hand-assigned `-NNN`.
- DO put acceptance criteria in the card **checklist** (one item = one AC) and test results in **comments**. The card description holds the `## Test Plan` section and the Drive link-backs.
- DO treat the Google Drive matrix as the traceability spine: link it from the card description (`## Test Matrix` / `## Docs`), never copy its contents into the card or the repo.
- DO authenticate from `TRELLO_API_KEY` + `TRELLO_TOKEN` in `.env` (`trello auth set`). Never hardcode a token or key.
- DO NOT rename cards or normalize discipline labels on QA's own initiative — that is a PO / Engineering Manager decision (see the traceability standard).
- DO NOT use this skill for Jira/Atlassian ticket operations.

**Read full SKILL.md when**: the board grammar, slug rule, or Drive link-back below is insufficient, or when a command needs its exact sub-verbs and flags (then read `references/board-grammar.md`).

---

## When to use

Trigger on any of these intents, even without literal keywords:

- "create a Trello card for …", "move this card to En Prueba", "mover la tarjeta a En curso"
- "add a checklist to the card", "add these ACs as checklist items", "agregar checklist"
- "what does this card's description say", "read the comments on QA-9", "leer la tarjeta"
- "set the QA label on this card", "add a label", "poner etiqueta"
- "link the test matrix to the card", "attach this screenshot as evidence"
- "which board do we use", "list the lists on the Novamarket board", "el tablero"

## Board grammar (WHAT)

The board nests in a fixed order; each level is addressed by the level above it:

```
board → list → card → checklist → label → attachment
                              → comment
```

- **Board** — the canonical board is `{{TRELLO_BOARD}}` (id `{{TRELLO_BOARD_ID}}`, URL `{{TRELLO_BOARD_URL}}`), read from `.agents/project.yaml` → `issue_tracker`.
- **List** — a workflow state (`Por hacer` → `En curso` → `En Prueba` → `Finalizada`), not a type. Moving a card across lists is a status transition.
- **Card** — the unit of work. Title is a bare Spanish verb phrase (`Definir alcance UX/UI del MVP`). Its identity is Trello's own number (the `#9` in the card URL), and the **slug** every other surface links to is `{LABEL}-{trello-number}` → `QA-9`, `FRONT-2`, `UX-5`. Discipline lives in the **label**, not a title prefix.
- **Checklist** — the acceptance criteria. One checklist item = one AC; a `## Tests` divider holds manual test items. A card with no checklist = ACs not yet defined.
- **Label** — the discipline, normalized to `UX` / `FRONT` / `BACK` / `QA` / `PO` / `OPS` / `DOC`.
- **Attachment** — test evidence (screenshots, logs), named `{CARD-SLUG}-step{NN}-{action}.png`.

The **Drive matrix** (one Google Sheet per feature/area) is the traceability spine: `Feature → Card → AC → Test case → Env → Result → Evidence`. It is linked bidirectionally from the card description, never copied into the card or the repo.

Canonical standard: `docs/qa-standard/traceability-trello-drive.md`. Platform gotchas: `docs/qa-standard/tool-platform-integration.md`.

## Auth

The `trello` CLI authenticates with an API key + token, exactly like the REST API. Both are read from `.env`:

- `TRELLO_API_KEY` — public, identifies the Power-Up.
- `TRELLO_TOKEN` — the secret.

Store them once with `trello auth set --api-key <key> --token <token>`, then verify with `trello auth status --pretty`. The full get-a-key walkthrough lives in `.env.example` under the `TRELLO` block.

## References

- `references/board-grammar.md` — the HOW: CLI verbs (`boards list`, `lists`, `cards`, `checklists`, `comments`, `labels`, `auth set`), the slug rule, the checklist↔AC mapping, the Drive-matrix link-back, and the repo's own sync commands.
- `docs/qa-standard/traceability-trello-drive.md` — the ratified naming + traceability standard this skill enforces.
- `docs/qa-standard/tool-platform-integration.md` — §3, the Trello integration case study (JSON-first CLI, auth, card identity).
