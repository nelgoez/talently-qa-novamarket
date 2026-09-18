# Handoff — 2026-09-18 — Trello build + Jira removal + context backfill (week wrap)

> **Scope**: everything after the Drive-wiring handoff (`docs/handoff-2026-09-18-drive-wiring-and-cleanup.md`, now superseded). All of this is committed and pushed to `main`.
> **Read order next session**: §"Where things live" → §"Open items" → the individual docs.

## What shipped this session

| Area             | Result                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------ |
| Business context | `.context/` backfilled from the gated Talently course: `business/business-model.md`, `domain-glossary.md`, `business-feature-map.md`, `PRD/` ×4, `master-test-plan.md`. Data-map / API-map / SRS intentionally **deferred** (need dev deliverables).                                                                                                                                |
| Autonomous mode  | Ported from `nelgoez/bunkai-qa-engineering`: `agentic-qa-core/references/autonomous-gates.md` + `permission-manifest-template.md`, `docs/autonomous-mode-spec.md`, AGENTS.md Critical Rule 16 (`/autonomous full                                                                                                                                                                    | semi | off`). |
| Trello tooling   | `scripts/sync-trello.ts` (+ `trello-shared.ts`) → gitignored `.context/trello/` cache; `scripts/sync-trello-board.ts` → committed `.agents/trello-board.json`; `scripts/check-trello-board.ts` drift fail-safe; `tests-map.ts` re-pointed. New scripts: `trello:sync`, `trello:sync-board`, `trello:board:check`, `tests:map`. Verified live: 4 lists, 7 cards, 55 checklist items. |
| `trello` skill   | Thin T1 skill (`.agents/skills/trello/`), registered in `REGISTRY.md`. Slug `{LABEL}-{trello-number}`, checklist item = one AC.                                                                                                                                                                                                                                                     |
| Jira removal     | `cli/lib/atlassian-instance.ts` deleted; `config.tms` → `provider: 'none'`; TMS/Atlassian env reads, validation, install/doctor steps, CI Xray job + secrets removed; test-runtime `config.tms` consumers neutralized. No Jira skill folders remain.                                                                                                                                |
| OAuth            | `docs/qa-standard/tool-platform-integration.md` §2.1 documents the **publish** path to stop the 7-day refresh-token expiry.                                                                                                                                                                                                                                                         |
| git policy       | Stale `accepted_divergences` entry removed; `git:policy verify` now `DRIFT (0)`, `policy_source: verified`.                                                                                                                                                                                                                                                                         |
| Credentials      | `TALENTLY_USER_EMAIL` / `TALENTLY_USER_PASSWORD` in `.env` (gitignored), registered in the variable manifest.                                                                                                                                                                                                                                                                       |

Full check green: `bun run repo:check` (types, lint, skills 18 T1, registry, compat, vars, git-policy).

## Where things live

- `docs/qa-standard/traceability-trello-drive.md` — the naming/traceability standard (slug, checklist=AC, Drive matrix spine). **DRAFT — pending team ratification.**
- `docs/qa-standard/trello-parity-plan.md` — the build plan (now **built**).
- `docs/qa-standard/tool-platform-integration.md` — Drive/OAuth gotchas + publish runbook.
- `.context/master-test-plan.md` — risk-ranked test plan (checkout + auth highest).
- `.context/business/*`, `.context/PRD/*` — business context (English; the Spanish source lives in `docs/proposals/propuesta-ac-matriz-novamarket.md`).
- `AGENTS.md` — now Trello-routed (§5/§6.5/§7/§9 rewritten; §4/§8 still carry inert `{{jira.*}}` prose, see below).

## Open items

1. **OAuth publish (user action, Google Console)** — External consent screen → Publish app. Until then the Drive refresh token still expires weekly (`rclone authorize "drive"` fallback documented).
2. **`{{jira.*}}` prose rewrite — deferred by design** — ~428 inert refs remain in the workflow skills and AGENTS.md §4/§8. They no longer resolve or execute (everything executable is gone), but the docs still read Jira-first. Rewrite when the team cares about prose hygiene.
3. **Trello board/label rename — PO/EM decision** — the standard (§1 of the traceability doc) drops hand numbers and normalizes labels; QA does not execute this unilaterally.
4. **Env URLs in `.agents/project.yaml`** — `web_url`/`api_url` are still `null`/placeholder for all environments. Fill them when the app is deployed, before any real test run.
5. **Discord** — message sent by the user; **Manage Webhooks** access still pending an admin reply.
6. **`data-map` / `api-map` / `SRS`** — deferred until Backend delivers the DB schema + API contracts.

## Gotchas carried forward

- `kata-manifest` generator now normalizes to POSIX `/` separators (Windows fix); keep it that way — regenerating on Windows must not flip `\`.
- `.agents/trello-board.json` is **committed** (catalog); `.context/trello/` cache is **gitignored** (`README.md` + `templates/` committed).
- `trello:board:check` fails the build on list/label drift against the live board — intentional.

## How to pick up

- Sync the board: `bun run trello:sync` · `bun run trello:sync-board` · `bun run trello:board:check`.
- Coverage map: `bun run tests:map`.
- Per-ticket QA: `/sprint-testing` or `/test-automation` (Trello-routed now).
- Autonomous runs: `/autonomous full` then approve the permission manifest.
