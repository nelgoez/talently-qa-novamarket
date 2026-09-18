# NovaMarket — Traceability & Naming Standard (Trello + Drive)

> **Status**: DRAFT for team ratification. This project does NOT use Jira/Xray, so the
> boilerplate's Jira traceability doctrine (`agentic-qa-core/references/traceability-linking.md`,
> `docs/qa-standard/planning-ladder-proposal.md`) is remapped here onto Trello primitives
> (board / list / card / label / checklist / custom field) plus Google Drive docs. The Jira
> ladder's _ideas_ survive — the acronym grammar, test↔feature traceability, one-home-per-artifact —
> but their _mechanism_ changes: Trello has no issue-links and no coverage panel.
>
> **Languages**: repo artifacts (this file, commits, branch names, file names, code) are English.
> Team communication and Trello card content are Spanish. This doc is English per repo rule;
> examples carry Spanish card titles because that is what the board actually holds.

---

## 0. Why this exists (the justification, up front)

The board right now has **7 cards and 4 different naming schemes**, observed live on
`Novamarket` (2026-09-18):

| Card (as written today)                                           | Scheme            |
| ----------------------------------------------------------------- | ----------------- |
| `UX-002 \| Definir Proto-Persona y objetivos de usuario`          | `UX-### \| title` |
| `UX-003 \| Analizar referentes y crear moodboard inicial`         | `UX-### \| title` |
| `UX-001 \| Definir alcance UX/UI y arquitectura base del MVP`     | `UX-### \| title` |
| `[FRONT] Definir stack base y estructura de carpetas`             | `[DISC] title`    |
| `[FRONT] Relevar y documentar mapa de vistas y componentes`       | `[DISC] title`    |
| `BACK - Definir arquitectura API, entidades y contratos`          | `DISC - title`    |
| `QA- Revisar criterios de aceptación y matriz inicial de pruebas` | `DISC- title`     |

Four schemes, three separators (`|`, `-`, `[ ]`), a trailing hyphen that is sometimes spaced
(`QA- `) and sometimes not, and no discipline→board/list→doc convention at all. None of this is
_wrong_ — it is exactly what a team produces before it decides. But it costs the team on every
future touchpoint:

- **The traceability question ("which test covers which feature?") has no answer today.** The
  QA card has no ACs, no checklist, and no test matrix — because the team has not yet agreed
  _where_ those live.
- **A slug you cannot predict is a slug you cannot link.** `QA-` vs `BACK -` vs `[FRONT]` vs
  `UX-###` means any doc, commit, or script that wants to reference a card has to be told the
  scheme each time, or guess.
- **Manual IDs (`UX-001`) are a trap.** They are assigned by hand, so they will collide, skip,
  or drift from the order cards were actually created (note `UX-001` sits in `En curso` while
  `UX-002` and `UX-003` sit in `Por hacer` — the hand number and the real state already diverge).
- **The discipline is already in two places and disagrees.** The board has discipline _labels_
  (`Ux ui`, `Front`, `Back`, `Qa`) AND discipline _prefixes_ in titles (`[FRONT]`, `BACK -`,
  `QA-`, `UX-###`), each with its own casing. Two homes for one fact, neither consistent.

The standard below fixes exactly three things, nothing more: **one home for discipline**, **one home
per artifact**, and **one traceability spine (feature ↔ test)**. Everything else the team already
does stays.

---

## 1. Discipline is a label; the title is a verb phrase

**Resolution (labels question):** discipline lives in the Trello **label**, not the title prefix.
The board already has discipline labels (`Ux ui`, `Front`, `Back`, `Qa`) — Trello filters on them
natively. Keeping discipline in the label means "show me every QA card" is one click, and the title
stops carrying a redundant, inconsistent prefix. The title carries only what the card is.

**Card title grammar:**

```
{verb-phrase}
```

| Part          | Rule                                            | Example                         |
| ------------- | ----------------------------------------------- | ------------------------------- |
| `verb-phrase` | imperative, Spanish (team language), title case | `Definir alcance UX/UI del MVP` |

**Discipline label list (closed, extend by agreement — never ad hoc):**

| Label   | Meaning                       | Current label (normalize to) |
| ------- | ----------------------------- | ---------------------------- |
| `UX`    | UX/UI design                  | `Ux ui` → `UX`               |
| `FRONT` | Frontend                      | `Front` → `FRONT`            |
| `BACK`  | Backend                       | `Back` → `BACK`              |
| `QA`    | Quality assurance / testing   | `Qa` → `QA`                  |
| `PO`    | Product ownership / business  | (new)                        |
| `OPS`   | Infrastructure, deploy, CI/CD | (new)                        |
| `DOC`   | Documentation                 | (new)                        |

The existing unnamed colored labels are noise; name them to a discipline or delete them.

**Identity vs label — the `-NNN` question is gone.** Under the old `UX-001` scheme the number was
hand-assigned and already drifting from reality. The standard drops hand numbers entirely: a card's
real identity is Trello's own card number (the `#9` in `https://trello.com/c/pxHg8Tzs/9-…`), which is
unique, never reused, and already in every card URL. The **slug** every other surface links to is
the card's Trello number prefixed by its discipline label: `QA-9`, `FRONT-2`, `UX-5`.

A card is therefore referenced as `QA-9` (label + Trello number), never `QA-001` (hand number).

---

## 2. One home per artifact

The board already has the workflow lists (Por hacer → En curso → En Prueba → Finalizada). Those
are **status**, not **type**. The standard adds _where each kind of artifact lives_, so nothing
is ambiguous about "where do ACs go" or "where does the test matrix go".

| Artifact                                          | Home                                                                                           | Notes                                                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Acceptance criteria (ACs)                         | **Card checklist** (one item per AC)                                                           | The checklist IS the AC source of truth for the card. A card with no checklist = ACs not yet defined. |
| Test cases (TCs)                                  | **Card checklist items under a `## Tests` divider**, or a linked Drive doc when there are >~10 | A checklist item is a _manual_ test; its checkbox = pass/fail at a glance.                            |
| Feature → test mapping                            | **Google Drive doc** (one matrix per feature/area)                                             | The traceability spine (§3). Trello has no coverage panel; the Drive doc replaces it.                 |
| Test evidence (screenshots, logs)                 | **Card attachments**                                                                           | Named per the evidence rule (§4).                                                                     |
| Test plan (ATP / "qué voy a probar")              | **Card description section `## Test Plan`**                                                    | One per card, in Spanish.                                                                             |
| Test results (ATR / "qué pasó")                   | **Card comment** `## Test Results — <date>`                                                    | Append-only progress, like the boilerplate's STP convention.                                          |
| General project docs (brief, decisions, glossary) | **Google Drive** (link-only from the repo)                                                     | Never copied into git unless it is a QA-standard doc like this one.                                   |

**The "items-over-fields" spirit carries over** even without Jira: ACs and test cases are real
checklist _items_, not a blob of prose in the card description — a checklist is what makes "did we
cover every AC" checkable by a human and a script.

---

## 3. The traceability spine: feature ↔ test

This is the part that answers "which test covers which feature?" and it is the one that Trello
cannot do natively. The spine is a **Drive matrix**, one row per test case, one column per link:

```
Feature / Historia  ->  Card  ->  AC  ->  Test case  ->  Env  ->  Result  ->  Evidence
```

A concrete matrix row (Spanish content, English headers):

| Feature         | Card   | AC   | Test case                                    | Env | Result | Evidence                     |
| --------------- | ------ | ---- | -------------------------------------------- | --- | ------ | ---------------------------- |
| Alta de usuario | `QA-9` | AC-1 | `Usuario puede registrarse con email válido` | dev | PASS   | `QA-9-step3-error-shown.png` |

**Rules that make the spine real (not decorative):**

1. **The `Card` column uses the slug from §1** (`QA-9` = label + Trello number), so the Drive row
   and the Trello card point at each other by an identifier a human can predict.
2. **The `AC` column references the checklist item id** (AC-1, AC-2, …) on that card — not a
   paraphrase. A paraphrased AC drifts from the real AC the moment the card is edited.
3. **The matrix lives in Drive, one doc per feature/area**, linked from the feature's card
   description under a `## Test Matrix` line. The repo references it by URL, never copies it.
4. **A test with no `Card` slug is an orphan** — the same smell the boilerplate's
   `epics/_orphans/` exists to surface. Orphan tests are a coverage gap, not a defect, but they
   must be visible.

Where a full Drive matrix is overkill (a 3-AC card), the same traceability collapses into the
card's own checklist (AC item → test item) and the Drive matrix is skipped. The rule is: **the
spine must exist somewhere reachable from the card**, not that it must always be a separate doc.

---

## 4. Naming for everything that is not a card

Carried over from the boilerplate's ratified `docs/qa-standard/naming-gaps-backlog.md`, re-expressed
for Trello/Drive. Only the rules this project actually touches now are listed; the rest stay in the
boilerplate doc until a need surfaces.

| Thing                                      | Convention                                                                     | Example                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------ |
| Evidence / screenshot                      | `{CARD-SLUG}-step{NN}-{action}.png`                                            | `QA-9-step3-error-shown.png`               |
| Test-data file                             | `{resource}-{variant}.json`                                                    | `users-valid.json`, `orders-boundary.json` |
| Env identifier                             | `local` · `dev` · `qa` · `staging` · `production` (lowercase, no abbreviation) | `dev`                                      |
| Drive doc title                            | `{AREA} {title}` (no hand number; Drive revision = version)                    | `QA Matriz de pruebas`                     |
| Test module folder (when automation lands) | `{domain-plural}/` kebab-case                                                  | `orders/`, `user-management/`              |

---

## 5. Contrast: today vs the standard

| Axis              | Today (observed)                                 | Standard                                                         |
| ----------------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| Discipline        | in title AND label, both inconsistent            | label only, normalized `UX`/`FRONT`/`BACK`/`QA`/`PO`/`OPS`/`DOC` |
| Card title        | `UX-### \|`, `[FRONT]`, `BACK -`, `QA-` prefixes | bare `{verb-phrase}` (Spanish imperative)                        |
| Card identity     | hand number `UX-001`, drifting from state        | Trello's own card number (`#9`), slug = `QA-9`                   |
| ACs               | nowhere (QA card empty)                          | card checklist, one item per AC                                  |
| Test cases        | nowhere                                          | checklist items or Drive doc, referenced by slug                 |
| Feature↔test link | nonexistent                                      | Drive matrix, `Card` column = slug, `AC` column = checklist id   |
| Evidence          | not defined                                      | `{CARD-SLUG}-step{NN}-{action}`                                  |
| Docs              | unknown home                                     | Drive (general), git (QA-standard only)                          |

---

## 6. What this does NOT do

- It does **not** migrate the board. Renaming cards and normalizing labels is a **PO / Engineering
  Manager decision**, not QA's to make unilaterally — this doc records the standard; the product
  owner or EM triggers the rename and the label cleanup when they are ready.
- It does **not** port the Jira planning ladder (FTP/STP/ATP/ATR/ATS acronyms). Those acronyms
  presuppose Jira/Xray items and links. If the team later wants a real planning ladder on Trello,
  that is a follow-up decision; today the sprint is small enough that the card + checklist + Drive
  matrix carries everything.
- It does **not** wire Trello into the boilerplate's skills/scripts. That is the deferred
  "framework adaptation" (AGENTS.md §2 note), a separate effort from agreeing on names.

---

## Decision log

- **2026-09-18 — DRAFT** — authored from the live board state (7 cards, 4 schemes, 4 labels) + the
  boilerplate's Jira traceability doctrine, remapped to Trello + Drive.
- **2026-09-18 — labels question RESOLVED (pending team ratification)** — discipline lives in the
  Trello **label** (normalized casing), the title carries a bare Spanish verb phrase, and the card
  slug is `{LABEL}-{trello-number}` (`QA-9`), not a hand-assigned `-NNN`. Renaming existing cards
  and normalizing labels is a PO / EM decision, out of QA's scope to execute unilaterally.
