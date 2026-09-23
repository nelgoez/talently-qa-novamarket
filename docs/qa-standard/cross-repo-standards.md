# Cross-repo standards — QA harness vs target product repo

This repo (`qa-novamarket`, the "QA harness") and the product it tests live in **two separate git repositories with different standards**. This document is the contract for what applies where, so cross-repo work (commits, PRs, rebases, QA) never mixes the two.

## The two repos

|                 | QA harness repo                                             | Target product repo                                                                                               |
| --------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Role            | QA engineering harness (KATA, skills, tests, docs, tooling) | The product under test (NovaMarket e-commerce MVP)                                                                |
| Local path      | `D:\Nahuel\Proyectos\novamarket`                            | `D:\Nahuel\Proyectos\S2621-novamarket`                                                                            |
| `origin` remote | `nelgoez/talently-qa-novamarket`                            | `Talently-Lab/S2621-novamarket` (the org repo, not a fork)                                                        |
| Package manager | `bun` (`bun.lock`, `bun run …`)                             | `npm` (`package-lock.json`, `npm run …`)                                                                          |
| Stack           | TypeScript + Playwright + KATA                              | `frontend/` React 18 + Vite 8 + Tailwind 3 + React Router 6 (JS) · `backend/` Node + Express (not yet scaffolded) |

> `project.yaml`'s `frontend.frontend_repo` / `backend.backend_repo` now point at the sibling clone (`../S2621-novamarket/frontend`, `../S2621-novamarket/backend`). The product does NOT live under this repo as `/frontend` + `/backend` — it is a separate clone. Always treat the target repo as a sibling checkout.

## Resolving the product repo path — local vs CI (compatible, not in conflict)

The question of where `frontend_repo` / `backend_repo` point and whether that survives remote/CI is **two orthogonal mechanisms**, not a conflict:

- **Local agent resolution** (`project.yaml` `frontend.frontend_repo` / `backend.backend_repo`) is a _workspace hint_ for the agent to locate product code on disk (reverse-engineering, discovery). It should point at the sibling clone: `../S2621-novamarket/frontend` and `../S2621-novamarket/backend`.
- **Remote / CI cross-repo access** does NOT read those fields. GitHub Actions materializes the other repo at runtime with `actions/checkout` (`repository:` + `path:` + a PAT for private repos), never a pre-existing sibling directory on the runner.

So the two are compatible: keep the local path for the agent, use `actions/checkout` for CI. The one hard rule is that CI must never assume a sibling path exists on disk — it checks the repo out explicitly.

```yaml
# authoritative cross-repo checkout pattern (actions/checkout)
- uses: actions/checkout@v7
  with:
    path: main
- uses: actions/checkout@v7
  with:
    repository: Talently-Lab/S2621-novamarket # or the QA repo, as needed
    token: ${{ secrets.GH_PAT }} # only if the second repo is private
    path: novamarket
```

## Standards comparison

| Dimension           | QA harness repo                                                     | Target product repo                                                                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Commit style        | conventional + mandatory `Worktree:` / `Session:` forensic trailers | plain conventional `type(scope): description`, **NO trailers**                                                                                                                                                      |
| AI attribution      | forbidden                                                           | forbidden                                                                                                                                                                                                           |
| Git strategy        | `solo-main` — direct push to `main` (standing authorization)        | `develop`-based PR flow — PRs target `develop`, **squash-merged**                                                                                                                                                   |
| Long-lived branches | `main` only                                                         | `main` (production) + `develop` (integration)                                                                                                                                                                       |
| Node                | — (bun runtime)                                                     | Node 20.19+ (`.nvmrc` = `20.19`)                                                                                                                                                                                    |
| Quality gates       | KATA manifest, `bun run repo:check` (tests → types → lint)          | husky pre-commit (lint-staged, eslint → prettier chained) · pre-push (`format:check → lint → build`, skipped when push doesn't touch `frontend/`) · GitHub Actions CI (`format:check → lint → build` on Node 20/22) |
| Chat register       | caveman / PM Voice (this agent's own behavior, not a repo file)     | n/a (not a repo concern)                                                                                                                                                                                            |

## The ruling rule

**When you land an artifact IN the target repo — commit, PR, branch, file — follow the TARGET repo's own conventions. The QA harness's `AGENTS.md` rules (forensic trailers, KATA, skills, caveman, PM Voice) govern the QA repo and the QA workflow, NOT the product repo's commit/PR surface.**

Concretely:

- Commits in `S2621-novamarket` = `type(scope): description` (e.g. `feat(front):`, `ci: add quality gates`). No `Worktree:`/`Session:` trailers. No AI attribution.
- Package manager = `npm`, never `bun`.
- PRs target `develop`, not `main`.
- The QA harness's forensic-trailer rule does **not** cross the repo boundary.

The QA disciplines (test-design doctrine, defect management, KATA, etc.) still apply when you are **testing** the product, but they produce artifacts (test plans, bug reports, test code) that live in the QA repo. Only the code/commits you contribute to the product repo follow product conventions.

## Aimed level of quality

**Target repo — the bar for a mergeable PR:**

- Green CI: `format:check → lint → build` on Node 20/22.
- Clean conventional commits, one responsibility each, no AI attribution.
- Rebased on the latest `origin/develop` — no conflicts, no dragged-in upstream commits.
- Reviewer's non-blocking suggestions addressed, or explicitly deferred in a reply.

**QA repo — the bar for QA work itself:**

- KATA compliance (`kata-manifest.json`), test-design doctrine, defect-management doctrine, artifact lifecycle.
- `bun run repo:check` green (tests → types → lint).

## Target repo quality gates — install / config (as of PR #2)

The target repo's quality posture, landed via PR #2 (`ci: quality gates`, rebased on `develop`):

| Piece             | Location                                                                                        | What it does                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| husky pre-commit  | `.husky/pre-commit`                                                                             | `npx lint-staged` — formats + lints staged files only                                                           |
| lint-staged       | `.lintstagedrc.json`                                                                            | `eslint --fix` → `prettier --write` chained on `frontend/**/*.{js,jsx}`; `prettier --write` on css/json/md/html |
| husky pre-push    | `.husky/pre-push`                                                                               | `format:check → lint → build`, only when the push touches `frontend/`                                           |
| CI                | `.github/workflows/ci.yml`                                                                      | on PR to `develop`/`main`: `format:check → lint → build`, Node 20/22                                            |
| Node pin          | `.nvmrc` = `20.19` · `frontend/package.json` `engines >=20.19`                                  | per team minute §2.2 (Node 20.19+ for Vite 8)                                                                   |
| prettier / eslint | `frontend/.prettierrc` (`endOfLine: auto`) · `eslint.config.js` (`eslint-config-prettier` last) | CRLF-safe; no prettier↔eslint rule clashes                                                                      |

Install: `npm install` (root, activates husky) then `cd frontend && npm install`. Gates: `npm run format:check`, `npm run lint`, `npm run build`.

Review suggestions applied (Daniel's review of PR #2): (1) lint-staged chained eslint→prettier, (2) pre-push skips non-`frontend/` pushes, (3) gate order format:check→lint→build mirrored in pre-push, (4) eslint-config-prettier kept; the Node 22/24 bump was reverted to 20.19+ to match team minute §2.2.

## Planned: `agents.md` in the target repo (documented for the next PR)

Two minutes agree on an `agents.md` at the target repo ROOT so any AI assistant the team uses works under the same parameters. The kickoff (v2 PDF) set the _mechanism_ (root `agents.md`, markdown, human-readable, per-folder `/frontend`/`/backend` conventions allowed); the 22-Sep minute filled in the _content_ the standards must carry. **QA harness stays OUT of scope** (it is QA-internal). Re-framed outline to land in its own PR:

- **Project context** — NovaMarket e-commerce MVP (Talently Lab, grupo S2621); monorepo `/frontend` + `/backend`; `main`/`develop` protected, PRs mandatory.
- **Naming** (§1.3) — `<ÁREA>-<##>-<semana> | <descripción>` across cards, branches, and PR titles (ÁREAS: FRONT, BACK, UX, QA, PM). Not every PR maps 1:1 to a card (some map to none, some to several); the convention's job is traceability so QA can correlate PR ↔ Trello ↔ docs.
- **Code standards** — npm, Node 20.19+ (§2.2), ESLint + Prettier + `eslint-config-prettier`.
- **Quality gates** — husky pre-commit/pre-push + CI (agents must not bypass).
- **Docs single source of truth** (§1.4) — repo = technical docs (READMEs, conventions); Drive = project docs (contracts, ACs, minutas, roadmap), linked from Drive, never duplicated.
- **Communication** (§1.2) — Discord = avisos only; details/errors/suggestions live on the Trello card.
- **Per-folder** — `/frontend`, `/backend` may add their own `agents.md`.

Not written yet — this is the record of the plan; the actual `agents.md` lands as its own PR.

## Gotchas that caused the confusion (do not repeat)

1. **`develop` vs `origin/develop`.** After `git fetch`, the LOCAL `develop` branch can be stale. Always rebase onto `origin/develop` and diff against `origin/develop...HEAD` — never the local `develop`, which produced a phantom ~4900-line diff.
2. **Squash-merged stacked PRs.** When #1 is squash-merged into `develop`, a stacked PR #2 still carries #1's original commits → conflicts. Fix: `git rebase --onto origin/develop <last-#1-sha> <branch>`, which drops the duplicated #1 commits and keeps only your own.
3. **Force-push after rebase.** Rebase rewrites history; use `git push --force-with-lease` (never `--force`). The branch is your own PR branch, so this is safe.
4. **Hooks belong to the target repo.** The target repo's own husky pre-commit/pre-push run `npm`-based gates. Don't assume the QA repo's `bun`-based gates apply.
