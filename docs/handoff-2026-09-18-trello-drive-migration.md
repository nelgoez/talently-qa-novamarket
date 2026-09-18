# Handoff — Trello + Google Drive migration (2026-09-18)

> One-page record of the session that connected NovaMarket QA to Trello + Google Drive and removed the Jira/Atlassian tooling. Read this first when resuming.

## What was done

| Area                  | Result                                                                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trello CLI            | Installed `trello` v1.1.0 (Scale-Flow/trello-cli) → `~/.local/bin/trello.exe` (on PATH). Authenticated as `nahuelgomez6` via API key + token.              |
| Trello board          | `Novamarket` (`aRb2rJ1p`, id `6aa491a7e9a666fe9d9c648c`). 4 lists: Por hacer / En curso / En Prueba / Finalizada. 7 cards, 6 members.                      |
| Google Drive          | Folder mapped (`NOVAMARKET`, id `1YcB6hUbtf5-u30qVOg4lwF-OSrKF6tUk`). 6 subfolders. Read all 3 source docs (minuta kickoff, frontend + backend proposals). |
| QA-9 card             | Description populated, 35-AC checklist added, proposal `.md` attached, Spanish summary comment posted.                                                     |
| Traceability standard | `docs/qa-standard/traceability-trello-drive.md` — remaps the Jira ladder onto Trello + Drive.                                                              |
| AC + matrix proposal  | `docs/proposals/propuesta-ac-matriz-novamarket.md` — v0.1, Spanish, Given/When/Then + RTM, assumes PostgreSQL.                                             |
| Jira removal          | Isolated Jira surface deleted; tool routing repointed to `trello` CLI + Drive matrix; all hooks green.                                                     |

## Tooling state (how to operate)

- **Trello auth**: `TRELLO_API_KEY` + `TRELLO_TOKEN` in `.env` (gitignored) and stored in the CLI keyring (`trello auth set`). The `secret` you generated at the Power-Up admin is NOT used and should stay private.
- **Trello CLI commands** (JSON-first, `--pretty`): `boards list`, `lists list --board <id>`, `cards list --board <id>`, `cards get/update --card <id>`, `checklists create` + `checklists items add`, `comments add`, `attachments add-file`.
- **No TMS**: `testing.tms_cli: none` in `project.yaml`. Tests live in Trello card checklists + the Drive matrix.
- **rclone** was installed but is unused (docs are link-only, not synced).

## Decisions made (ratified in code/docs)

1. **Discipline = Trello label**, not a title prefix. Normalize labels to `UX / FRONT / BACK / QA / PO / OPS / DOC`.
2. **Card slug** = label + Trello's own card number (`QA-9`), no hand-assigned `-NNN`.
3. **Card rename + label cleanup is a PO / Engineering Manager call**, not QA's to execute.
4. **No TMS integration**; traceability spine = Drive matrix (feature → card → AC → test case).
5. **PostgreSQL** assumed for the AC matrix (backend `BCK-001` still open).
6. **Team-wide AGENTS.md** (Spanish, cross-provider) is agreed but not yet written — separate deliverable.

## What is left (next session)

The deferred **framework-adaptation pass** — removing Jira from the _shared_ layers, which the cleanup deliberately did not touch because it would break the pre-commit hooks:

1. `cli/lib/atlassian-instance.ts` — still imported by 5 shared files (`doctor.ts`, `install.ts`, `variables-flow.ts`, `config/variables.ts`, `validateTestEnv.ts`).
2. `cli/install.ts` steps 12.4 / 13 / 14 — still prompt for Atlassian credentials + Jira catalogs at setup.
3. `config/variables.ts` `config.tms` block — still Xray/Jira-shaped (but compiles).
4. `AGENTS.md` §7/§8/§9 doctrine prose — still describes Jira statuses/epics/`.context/PBI/`.
5. Workflow skills' bodies (`sprint-testing`, `test-documentation`, `shift-left-testing`, `regression-testing`) — prose still references `{{jira.*}}` and Jira concepts (~457 refs); `lint-vars.ts` now _skips_ that validation when the catalog is absent, so it no longer blocks, but the docs are still Jira-shaped.
6. CI workflows (`regression.yml`, `sanity.yml`, `smoke.yml`) — still reference `bun xray` / `test:sync`.

**Recommended entry point**: `/framework-development` for the framework pass, or `/sprint-testing` for per-ticket QA on the Trello board.

## Drive wiring follow-up (same session)

Drive access now works via `rclone` (`gdrive` remote, OAuth). `QA-9` is wired: matrix = Google Sheet
`NovaMarket_QA-9_MatrizDePruebas_v0.1`, proposal = Google Doc `NovaMarket_QA-9_PropuestaAC_v0.1`,
both under `/QA` and linked bidirectionally from the card. Canonical docs:
`docs/qa-standard/tool-platform-integration.md` (the playbook) + `docs/qa-standard/traceability-trello-drive.md`
(ratified). Open items:

1. ~~Rate limit — long-term fix~~ — **DONE**: own OAuth `client_id` wired (Desktop app; JSON backup
   at `.auth/google-oauth-client.json`). Service-account caveat + steps in the playbook §2.1.
2. ~~Two pending renames~~ — **DONE**: both files renamed to the convention (rate limit cleared
   once the own client was live).
3. **Testing-mode token expiry** — the OAuth app is in Testing mode, so the refresh token expires
   weekly; re-run `rclone authorize "drive" <client_id> <client_secret>` on a `401`.
4. **Future tasks (team):** a minimal QA-Update post to the team's Discord; and research whether
   Discord can be wired into this repo (webhook/MCP) to automate that update.

## Verification (all green at commit `363f9ea`)

`format:check` · `lint:check` · `types:check` · `vars:check` · `skills:check` · `skills:registry:check` · `agents:compat:check` · `vars:env:check`
