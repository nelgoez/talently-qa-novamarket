# NovaMarket — Master Test Plan

> Risk-ranked test roadmap for the NovaMarket e-commerce MVP. This is the "documento madre" (mother document) required by the course QA directive, derived from the Talently course source brief and the approved AC proposal.

## 1. Purpose and Source

This plan is the single reference for *what to test and why* in NovaMarket. It merges two inputs:

| Input | Role |
|-------|------|
| Talently course (gated, `talentlylab.com.ar` — Introducción, Roles del equipo y entregables finales, QA Tester — Semana 1) | Course directives and QA deliverables (Week 1 "Análisis Funcional Inicial" + "Borrador del Plan de Pruebas") |
| `docs/proposals/propuesta-ac-matriz-novamarket.md` | The working AC draft (35 ACs) + initial RTM (35 test cases) |

The proposal is the live source of truth for acceptance criteria; this plan states scope, critical flows, test types, and the risk ranking that orders the work.

## 2. Scope

### In scope (tested)

The 7 modules and their flows, as declared in the brief:

| Module | Flows under test |
|--------|------------------|
| Autenticación / registro | Register, login, session restore, token expiry |
| Catálogo | Product list, pagination, search, category filter, empty state |
| Detalle de producto | Product info, add-to-cart, out-of-stock, 404 |
| Carrito | Persistence, quantity change, item removal, empty state, stock limit |
| Checkout / creación de pedido | Auth redirect, order creation, cart clear, no-real-payment |
| Panel de administración | Role gate, product CRUD, order view |
| Navegación y general | Navbar state, 404 page, mobile/desktop usability |

### Out of scope (not tested)

Mirrors the brief's explicit restrictions (8-week development window):

- Real payment gateway (no "pasarela de pagos real")
- Shipping management ("gestión de envíos")
- External integrations
- Mobile application (responsive web is tested, native app is not)

### Key scoping note (resolved ambiguity)

The QA deliverable reads "Test Plan con foco en el flujo de pagos" (payment flow). This resolves to the **checkout flow**, not to payment processing: payments are **simulated**. Per AC-CHK-4, a simulated checkout requests **no real payment data**, only order-confirmation data. The "payment flow" focus therefore means the order-creation journey end to end (cart → auth → confirm → order → confirmation), with the payment step stubbed.

## 3. Functional Analysis / Critical Flows

The course's "Análisis Funcional Inicial" deliverable. For each critical flow: what it must do, and what happens if it goes wrong.

| Flow | What it must do | What if something goes wrong |
|------|-----------------|------------------------------|
| Registration / login (auth) | Create an account, reject duplicates, validate fields, issue/restore tokens, return `401` on expired tokens and clean the session | Account lockout or silent session loss; a duplicate-account leak or an unrevealing error message both block the customer. A session that does not restore on reload forces re-login on every page. |
| Catalog browse + filters | List products with name/price/image, paginate, search by term, filter by category, show empty state, mark out-of-stock | An empty or blank results page looks broken; wrong filter results lose sales; an out-of-stock product that appears buyable leads to a failed order. |
| Add-to-cart + stock rules | Add product, update navbar counter, recalculate totals on quantity change/removal, persist across reload, block exceeding stock | Over-selling stock (exceeding available units) is the highest business risk; a stale or lost cart abandons the sale; a counter that does not update confuses the customer. |
| Checkout (order creation + cart clear) | Redirect unauthenticated users to login, create the order (`POST /api/orders`), show confirmation, clear the cart, reflect correct items/quantities/total | A cart that is not cleared allows double-ordering; an order that does not reflect the real items/total corrupts the record; a simulated checkout that accidentally asks for real payment data violates the MVP scope. |
| Admin CRUD + order view | Restrict `/admin` to role admin, create/edit/delete products (reflected in public catalog), list orders with state and items | A non-admin who reaches the panel is a security breach; a product edit that does not propagate leaves stale catalog data; a delete that does not remove the product from catalog shows broken pages. |

## 4. Test Types

The course names functional, usability, and E2E. This plan also covers negative and compatibility testing.

| Type | One-line definition |
|------|---------------------|
| Functional | Verifies each module does what its ACs specify (happy paths). |
| Negative | Verifies error handling and edge cases (duplicate email, invalid credentials, out-of-stock, unauthorized access). |
| Usability | Verifies empty states, clear error messages, and suggested actions instead of blank pages. |
| E2E | Verifies complete user journeys across modules (browse → add → checkout → confirm; admin create → public catalog). |
| Compatibility | Verifies the responsive views work on mobile and desktop (mobile-first breakpoints). |

## 5. Risk-Ranked Test Focus

Modules/flows ranked by business risk. Risk drives the order and depth of testing.

| Rank | Flow | Risk | Justification |
|------|------|------|---------------|
| 1 | Checkout (order creation) | High | The revenue moment. A broken order, a cart that does not clear, or a wrong total directly corrupts the business record. |
| 2 | Authentication / authorization | High | A session leak, a missing `401`, or a non-admin reaching `/admin` is a security breach, not just a bug. |
| 3 | Add-to-cart + stock rules | High | Stock integrity is the data-critical rule; over-selling is the specific failure mode. |
| 4 | Admin CRUD + order view | Medium | A product edit/delete that does not propagate leaves stale public data, but it is recoverable and admin-only. |
| 5 | Catalog browse + filters | Medium | A broken filter degrades conversion but does not corrupt data. |
| 6 | Navigation and general | Low | Cosmetic and discoverability issues; low data or security impact. |

**Named scenario — stock negativo**: the course explicitly names "stock negativo" as a validation example. It maps to AC-CART-5 (cannot exceed available stock) and AC-CAT-6 / AC-DET-3 (out-of-stock product is marked and cannot be added). The risk being prevented: an order that requests more units than exist, or a stock count that drops below zero.

## 6. Acceptance Criteria Approach

The 35 ACs in `docs/proposals/propuesta-ac-matriz-novamarket.md` are the working AC draft. They are grouped by module (AC-AUTH-*, AC-CAT-*, AC-DET-*, AC-CART-*, AC-CHK-*, AC-ADM-*, AC-NAV-*).

**Format**: two industry-standard shapes, chosen per case:

- **Given / When / Then** for flows with clear steps; each block maps 1:1 to a test case.
- **Rule checklist** for simple business conditions ("if the product has no stock...").

**Specificity standard (course Tip Pro)**: every AC must be measurable and verifiable. The bad example "el carrito funciona" (the cart works) is rejected; the corporate standard "el usuario puede agregar un producto al carrito en 2 clics y ver el subtotal actualizado" is the bar. The proposal applies this by replacing vague outcomes with observable results ("shows an error message", "redirects to `/login`", "returns `401`").

## 7. Traceability

The RTM (Requirements Traceability Matrix) is the initial 35-row matrix in the proposal (section 5), linking each test case (TC-001..TC-035) to one AC, with Priority, Type, Environment, Result, and Evidence columns.

- `Resultado` and `Evidencia` columns are filled **during execution**, not ahead of time.
- The matrix is a draft; where it lives definitively (Drive > QA, or the card checklist) is still to be agreed with the team.

## 8. Deferred / Pending

Marked as pending dev deliverables. Do not invent entities, endpoints, schemas, or specs beyond the source.

| Item | Status |
|------|--------|
| Database schema | PostgreSQL assumed as the data engine, **pending ratification by Backend** |
| API contracts | Endpoints (`POST /api/orders`, protected routes), error format, and JWT behavior pending Backend closure (BCK-001..010) |
| Environments | Test data and targets referenced as `dev` in the matrix; the environment map is not yet defined |
| Business decisions | Register → auto-login vs redirect to login (AC-AUTH-1); out-of-stock product shown as "sin stock" vs omitted (AC-CAT-6) — both await a business/PO decision |

These gaps are raised now (Tip Pro: question the brief early) and become unblockers for Week 1, so no one starts Week 2 blocked.
