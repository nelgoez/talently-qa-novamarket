# Handoff — Drive wiring, env cleanup, next workstreams (2026-09-18)

> **SUPERSEDED** by `docs/handoff-2026-09-18-trello-build-and-jira-removal.md`. Its
> workstreams are now done: the commit batch landed, Discord was sent, Trello parity was
> built, and the Jira executable paths were removed. Kept for history only — read the new
> handoff for the current open items.

> Resume point for the next session. Supersedes the deleted
> `handoff-2026-09-18-trello-drive-migration.md`. One line of truth: **Trello is the issue
> tracker, Drive holds the traceability artifacts, and the Jira/Xray/Atlassian machinery is
> removed at the variable layer but still present in the code.** QA-9 is fully wired.

## Done this session

**Drive traceability (QA-9)**

- rclone `gdrive` remote, now on the **own OAuth client** (rate-limit fix). Client JSON at
  `.auth/google-oauth-client.json` (gitignored).
- Published to Drive `/QA` (`1VSV-Wiw53rSwVKRRvxnuejpvHx08-LMn`):
  - `NovaMarket_QA-9_MatrizDePruebas_v0.1` (Google Sheet, 35 AC rows) — `1k6mbYXUFk3qLmOwB9EcDcK-iQGebwOD2n16mARCLexA`
  - `NovaMarket_QA-9_PropuestaAC_v0.1` (Google Doc) — `1uyw4pEPaasQnx6rLWi1aUjJMete1NsAL4z807_XspN4`
- Bidirectional links: Trello `QA-9` description → Drive; Drive titles carry the `QA-9` slug.

**Docs**

- `docs/qa-standard/tool-platform-integration.md` — integration playbook (rclone, own
  client_id, import/export format rules, rate-limit mitigation, naming).
- `docs/qa-standard/traceability-trello-drive.md` — ratified: matrix = Sheet, prose = Doc,
  snapshot = PDF, `.md` = git-only; naming `NovaMarket_{SLUG}_{TYPE}_v`.
- `docs/qa-standard/trello-parity-plan.md` — Trello tooling workstream (4 phases, below).

**Env / credentials cleanup**

- Removed Jira/Xray/Atlassian/TMS vars from `cli/lib/variables-manifest.ts`, `.env.example`,
  and `.env` (real, gitignored).
- Secrets audited: nothing committed. Safe homes are `.env`, `.auth/`, and the rclone config.

## Committed

- `435fed0` docs: wire Drive traceability and document the integration playbook
- `2305b79` docs: mark Drive wiring complete (own client_id, renames landed)

## Pending — uncommitted (batch by workstream)

- `cli/lib/variables-manifest.ts` — Jira/Xray/Atlassian/TMS removed (env-cleanup workstream)
- `.env.example` — same sections removed
- `docs/qa-standard/trello-parity-plan.md` — new
- ` D docs/handoff-2026-09-18-trello-drive-migration.md` — deleted (superseded here)
- gitignored/local: `.env`, `.auth/google-oauth-client.json`, `.session/*`

## Open workstreams (in order)

1. **Commit the batch** — group: (a) docs/plans, (b) env cleanup (manifest + `.env.example`),
   (c) framework pass when it lands.
2. **Discord** — send the `QA Update — QA-9` draft (`.session/discord-qa-update.md`). Ask a
   Talently admin for **Manage Webhooks** (that is why you cannot see the option). Then
   optionally scaffold `DISCORD_WEBHOOK_URL` + `scripts/discord-post.ts`, mirroring the
   existing `SLACK_WEBHOOK_URL` pattern.
3. **Trello-parity** — `docs/qa-standard/trello-parity-plan.md`, 4 phases: (1) `sync-trello.ts`
   → `.context/trello/` cache + `trello-board.json` catalog + drift check, (2) re-point
   `tests-map.ts` and restore the `tests:map` script, (3) thin `trello` T1 skill + AGENTS.md §9
   rewrite, (4) Jira-side removal. Confirm the 3 design decisions first (cache shape,
   checklist↔AC reference, skill vs raw CLI).
4. **Framework pass (Jira removal)** — the deferred list: `cli/lib/atlassian-instance.ts`
   (imported by `doctor.ts`, `install.ts`, `variables-flow.ts`, `config/variables.ts`,
   `validateTestEnv.ts`), `install.ts` Atlassian steps 12.4/13/14, `config/variables.ts`
   `config.tms` block, AGENTS.md §7/8/9, workflow-skill `{{jira.*}}` refs (~457), CI
   `bun xray` / `test:sync`. This lands the staged env-cleanup end-to-end.
5. **OAuth publish** — the Drive OAuth app is in Testing mode → refresh token expires weekly.
   Publish (External, team-only) or re-auth weekly via `rclone authorize "drive" <id> <secret>`.

## Open decisions (confirm before next code)

- Trello cache shape: flat lists (proposed) vs an invented hierarchy.
- Checklist item id as the AC reference (no hand `AC-NNN`).
- Thin `trello` skill vs raw CLI only.
