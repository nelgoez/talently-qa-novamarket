# Trello Tooling Parity — Workstream Plan

> Status: **built (2026-09-18).** Both halves shipped: the Trello side (Phases 1-3) and the
> Jira-removal pass (Phase 4, functional removal). Remaining: the deferred full
> `{{jira.*}}` prose rewrite and the board/label rename (PO/EM call). Current open items:
> `docs/handoff-2026-09-18-trello-build-and-jira-removal.md`.

## Goal

Bring the Trello tooling to parity with what the Jira default had, **minus the TMS** (the
Drive matrix is the TMS substitute, deliberately manual). Parity = same _kinds_ of tooling,
not a clone of Xray.

## Gap (from the audit)

| Layer               | Jira default                                                      | Trello now                                             | To build                              |
| ------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------- |
| Local mirror + sync | `sync-jira-issues.ts` → `.context/PBI/`                           | none                                                   | `sync-trello.ts` → `.context/trello/` |
| Catalogs            | `jira-fields.json` / `jira-workflows.json` / `jira-required.yaml` | none                                                   | `trello-board.json` (+ drift check)   |
| Coverage map        | `tests:map` (reads PBI cache)                                     | orphaned (`tests-map.ts` reads the deleted Jira cache) | re-point at Trello cache              |
| Skills              | `acli` / `xray-cli` / `jira-administration`                       | none                                                   | `trello` skill (thin, T1)             |
| Fail-safes          | `jira:sync-fields/workflows`, `jira:check`                        | none                                                   | `trello:board:check`, cache check     |

`kata-manifest.json` + `kata:manifest:check` and every KATA-generic fail-safe
(`vars:check`, `vars:env:check`, `skills:check`, `repo:check`, …) are **not** issue-tracker
specific and stay untouched.

## Phases

### Phase 1 — Board catalog + sync (foundation, feeds everything else)

- `scripts/sync-trello.ts` pulls board → lists → cards (description, checklist items,
  labels, comments, attachments/Drive links) into a **gitignored** `.context/trello/` cache.
  One `.md` per card; a `board.md` index of lists + labels. Command shape:
  `bun run trello:sync [--card <id>] [--board] [--include-comments]`.
- `bun run trello:sync-board` writes `.agents/trello-board.json` (board id, list names,
  label names) — the catalog. Cached, offline-readable, like the Jira catalogs.
- **Fail-safe** `bun run trello:board:check` validates the catalog against the live board
  (list/label drift) — the `jira:sync-workflows` analogue.
- Gitignore ladder: `.context/trello/*` ignored, `README.md` + `templates/` committed
  (same pattern as the PBI ladder).
- Consume `{{TRELLO_BOARD}}` / `{{TRELLO_BOARD_ID}}` (already declared in `project.yaml`,
  currently `DECLARED_BUT_UNUSED`) so they stop being orphaned.

### Phase 2 — Coverage map re-point

- Re-point `scripts/tests-map.ts` from `.context/PBI/` → `.context/trello/` + the Drive
  matrix reference. Restore the `tests:map` package.json script (currently absent; the
  script file is orphaned). Offline-first: reads the Trello cache, renders the
  feature→card→AC→test spine into `.context/reports/test-map.html`.

### Phase 3 — `trello` skill + AGENTS.md §9 rewrite

- A thin T1 skill `.agents/skills/trello/` owning the **WHEN/WHAT** (board grammar, auth
  via `TRELLO_API_KEY`/`TRELLO_TOKEN`, checklist = ACs, slug = `{LABEL}-{number}`, Drive
  matrix link-back), with the CLI flags in `references/`. Replaces the current
  "no skill — self-documenting JSON" gap in the `[ISSUE_TRACKER_TOOL]` routing.
- Rewrite AGENTS.md §9 (`.context/PBI/` Jira-cache doctrine) → `.context/trello/`; §7
  `[ISSUE_TRACKER_TOOL]` and the `tests:map`/`context:hydrate` pointers now name the Trello
  commands that actually exist.

### Phase 4 — Jira-side removal (the Workstream B half, interleaved)

- Close `cli/lib/atlassian-instance.ts` (5 importers), `install.ts` Atlassian steps,
  `config/variables.ts` `config.tms` → `none`, CI `xray`/`test:sync`, and the residual
  `{{jira.*}}` prose. This lands the `.env`/manifest cleanup already staged, end-to-end.

## Design decisions to confirm before Phase 1 code

1. **Cache shape** — flat lists (Trello) vs the Jira epic/story tree. Propose: mirror the
   board's lists as directories, one `card.md` per card; no invented hierarchy.
2. **Checklist↔AC mapping** — one checklist item = one AC; keep the item id as the stable
   reference (no hand `AC-NNN`).
3. **Skill vs raw CLI** — a thin skill (Phase 3) is worth it; the raw CLI stays the
   executor. Confirm before writing the skill.

## Non-goals

- No Xray/TMS reimplementation; the Drive matrix stays the (manual) results + traceability
  surface.
- No automation of Drive uploads in this workstream (rclone is wired; publish is by hand
  until someone asks for a sync).
- No renaming of existing Trello cards/labels (PO/EM call, per the traceability standard).
