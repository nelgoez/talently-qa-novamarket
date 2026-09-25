# Handoff — 2026-09-24 — S2 QA board coordination (auth dependency map + week-close agenda)

> **Scope**: Week-2 QA alignment against the course deliverable (50+ test cases). Mapped the auth dev/UX cards to the QA cards, posted dependency + pointer comments, and surfaced a course-vs-routemap calendar mismatch.
> **Committed**: this doc. **Local scratch**: `.session/s2-qa-meeting-agenda.md` (the meeting draft, Spanish).

## What was done

| Action                | Detail                                                                                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Read board + routemap | Pulled all Novamarket cards via the `trello` CLI + REST, and Pame's routemap (`https://docs.google.com/document/d/1ercir08tWisVsgRaJJS6pp5hyXFMLKki/edit`).            |
| Dependency map        | Linked each auth dev/UX card to its QA card, owners, and open pendings (table below).                                                                                  |
| Consolidated comments | 2 comments posted on our own cards (QA-22, QA-23), `@mention`-ing every owner and linking their cards.                                                                 |
| Pointer comments      | 7 one-line comments on the dev/UX cards linking back to QA-22 / QA-23.                                                                                                 |
| Finding               | The course week-2 deliverable (50+ cases across Auth + Productos + Carrito/Checkout) is out of sync with the routemap, which spreads those modules across Sprints 2-6. |

## Dependency map (auth module)

| Dev/UX card                            | Slug                  | Owners                     | Covered by    | Pendings                                                         |
| -------------------------------------- | --------------------- | -------------------------- | ------------- | ---------------------------------------------------------------- |
| Formulario de registro y validaciones  | FRONT-17 (`bPdpisVd`) | Sofía, Daniel              | QA-22         | AC-AUTH-1 auto-login vs redirect; client vs server validation    |
| Login, sesión y manejo de errores      | FRONT-18 (`H9MQPWwz`) | Sofía, Daniel              | QA-23         | AC-AUTH-6 `GET /api/auth/me`; AC-AUTH-5 generic error            |
| Modelo usuario y endpoint de registro  | BACK-19 (`kz5zdrYW`)  | Agustina, Fernando, Sheila | QA-22         | AC-AUTH-1 decision; duplicate-email error shape; password policy |
| Hash de contraseña y manejo de errores | BACK-20 (`IqPgXfsd`)  | Agustina, Fernando, Sheila | QA-22 + QA-23 | password policy; wrong-password behavior (AC-AUTH-5)             |
| Endpoint login y autenticación         | BACK-21 (`EGrxSXPj`)  | Fernando, Agustina         | QA-23         | token TTL (AC-AUTH-7); `/api/auth/me`; generic error             |
| Diseñar registro y estados             | UX-12 (`AXhVzk68`)    | Leandro                    | QA-22         | wireframe as UI reference                                        |
| Diseñar login y estados                | UX-13 (`x1qFSJfU`)    | Leandro                    | QA-23         | wireframe as UI reference                                        |

QA cards (owned by Nahuel): QA-22 = QA-002-S2 "Pruebas de registro" (`TWrXlvim`), QA-23 = QA-003-S2 "Pruebas de login y sesión" (`nMUbJLF8`). AC source: QA-9 (QA-001-S1, AC proposal + matrix).

## Comments posted

- **QA-22** (`TWrXlvim`): `## Dependencias y cobertura (Semana 2)` — registro, pings Sofía/Daniel/Agustina/Fernando/Sheila/Leandro.
- **QA-23** (`nMUbJLF8`): `## Dependencias y cobertura (Semana 2)` — login/sesión, same pings.
- **7 pointer comments** (one line each) on FRONT-17, FRONT-18, BACK-19, BACK-20, BACK-21, UX-12, UX-13 — each links back to its QA card ("Pendientes y feedback ahí").

## Calendar mismatch (course vs routemap)

The course ("QA Tester Semana 2") asks for 50+ cases across **Autenticación + Productos + Carrito & Checkout** this week. Pame's routemap deliberately scopes those modules to different sprints:

| Module                        | Routemap sprint      |
| ----------------------------- | -------------------- |
| Autenticación                 | Sprint 2 (this week) |
| Productos (listado + detalle) | Sprint 3             |
| Categorías / filtros          | Sprint 4             |
| Carrito                       | Sprint 5             |
| Checkout                      | Sprint 6             |

Auth today: QA-22 + QA-23, ~15-25 cases. The 50+ number cannot be met within the sprint cadence without drafting forward cases for later modules.

## Meeting agenda (week closure)

Standalone draft: `.session/s2-qa-meeting-agenda.md`. Inline copy (Spanish, ready to paste):

```
Cierre de semana — QA

1. Entregable 50+ casos: el curso pide Autenticación + Productos + Carrito & Checkout
   en Semana 2; el routemap los reparte en Sprint 2/3/5/6.
2. Hoy: Autenticación cubierta (QA-002 registro, QA-003 login/sesión), ~15-25 casos.
3. Propuesta: redactar ya los casos de Productos/Carrito/Checkout desde el routemap +
   ejemplos del curso, marcados "pendiente wireframe/impl"; se validan cuando cada
   sprint aterrice. Así el 50+ queda documentado esta semana.

Gates de CI/CD — gaps a cerrar:
- Alcance de sanidad (kickoff §3): definir el subset mínimo sobre lo crítico y correrlo en el pipeline.
- Smoke: agregar smoke.yml al mergear (boot del build + camino crítico). Depende del deploy.
- Tests unitarios: adoptar Vitest en frontend/, agregar script test + gate test.yml.
- build.yml: mantener el build en ci.yml; separar recién cuando backend tenga su build.
- Deploy (Railway): cablear el deploy para que develop tenga URL viva (trigger de smoke + env de QA).
Responsables tentativos: QA (sanidad) · QA+Front (smoke) · Front (unit) · Leandro (deploy).

Próxima semana (Sprint 3 — catálogo y detalle):
- Tomar "Pruebas de listado y datos" y "Pruebas de detalle y errores".
- Dependencias: wireframes de listado/detalle (ya en Sprint 2) + endpoints de listado/detalle.
- Coordinar con Leandro (UX) y Back para arrancar apenas esté el endpoint.
```

## Open items

1. **50+ reconciliation decision (Pame)** — draft Productos/Carrito/Checkout cases now (marked "pendiente wireframe/impl") vs grow cumulative by sprint.
2. **AC-AUTH-1** — auto-login vs redirect (Backend/PO decision).
3. **AC-AUTH-6** — confirm `GET /api/auth/me` for session restore.
4. **Card creation is PO-owned** — no QA cards were created this session; the Productos QA card is Pame's call.
5. **Notion** — evaluated and skipped; the traceability spine stays in Google Drive (Sheet matrix + Doc proposal).

## How to pick up

- Sync board: `bun run trello:sync` · `bun run trello:sync-board` · `bun run trello:board:check`.
- This week's QA cards: QA-22 (`TWrXlvim`), QA-23 (`nMUbJLF8`).
- Next: Sprint 3 (catálogo/detalle) once Pame opens the Productos QA card.
