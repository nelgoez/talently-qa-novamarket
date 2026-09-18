# Business Feature Map — NovaMarket

> Source of truth: `docs/proposals/propuesta-ac-matriz-novamarket.md` (7 modules, 35 ACs, v0.1 draft) and the gated Talently course "Proyecto Grupal NovaMarket E-commerce" (lessons: Introducción, Roles del equipo y entregables finales, QA Tester — Semana 1). Status: draft proposal, subject to team review. Nothing here is invented beyond those two sources.

## Feature Catalog

Seven modules, each with its sub-features derived from the proposal's AC IDs. AC references keep the catalog traceable back to the source.

### 1. Autenticación y registro (Authentication and registration)

| Sub-feature | AC refs |
| --- | --- |
| Register (account creation) | AC-AUTH-1, AC-AUTH-2, AC-AUTH-3 |
| Login | AC-AUTH-4, AC-AUTH-5 |
| Session persistence (token rehydration on reload) | AC-AUTH-6 |
| Token expiry / invalid token handling | AC-AUTH-7 |

### 2. Catálogo (Product catalog)

| Sub-feature | AC refs |
| --- | --- |
| Product listing (name, price, image) | AC-CAT-1 |
| Pagination | AC-CAT-2 |
| Search (by name/description) | AC-CAT-3 |
| Category filter | AC-CAT-4 |
| Empty state (no results) | AC-CAT-5 |
| Out-of-stock marking | AC-CAT-6 |

### 3. Detalle de producto (Product detail)

| Sub-feature | AC refs |
| --- | --- |
| Product detail display (image, name, description, price, stock) | AC-DET-1 |
| Add to cart (updates navbar counter) | AC-DET-2 |
| Out-of-stock disables "Add to cart" | AC-DET-3 |
| Not-found page for unknown product URL | AC-DET-4 |

### 4. Carrito (Shopping cart)

| Sub-feature | AC refs |
| --- | --- |
| Cart persistence (localStorage) | AC-CART-1 |
| Quantity update (recalculates subtotal/total) | AC-CART-2 |
| Item removal (updates total) | AC-CART-3 |
| Empty state (link back to catalog) | AC-CART-4 |
| Stock limit enforcement | AC-CART-5 |

### 5. Checkout y creación de pedido (Checkout and order creation)

| Sub-feature | AC refs |
| --- | --- |
| Auth guard (redirect unauthenticated to login) | AC-CHK-1 |
| Order creation (`POST /api/orders`) and confirmation | AC-CHK-2 |
| Cart clearing after checkout | AC-CHK-3 |
| Simulated checkout (no real payment data) | AC-CHK-4 |
| Order reflects items, quantities, total | AC-CHK-5 |

### 6. Panel de administración (Admin panel)

| Sub-feature | AC refs |
| --- | --- |
| Role guard (non-admin redirected) | AC-ADM-1 |
| Product create (visible in public catalog) | AC-ADM-2 |
| Product edit (price, stock, name) | AC-ADM-3 |
| Product delete | AC-ADM-4 |
| Order listing (status and items) | AC-ADM-5 |

### 7. Navegación y general (Navigation and general)

| Sub-feature | AC refs |
| --- | --- |
| Navbar state by session (logged in / not) | AC-NAV-1 |
| Friendly 404 page | AC-NAV-2 |
| Responsive / mobile-first views | AC-NAV-3 |

## CRUD Matrix

Actor vs entity. Operations: **C**reate, **R**ead, **U**pdate, **D**elete, or **—** (none). Derived strictly from the proposal's actor table and AC set; cells the sources do not settle are marked `TBD — pending dev`.

| Actor | Producto | Pedido | Carrito | Cuenta |
| --- | --- | --- | --- | --- |
| **Visitante** | R | — | C / R / U / D | C |
| **Cliente** | R | C / R | C / R / U / D | R (`TBD — pending dev` for U/D) |
| **Administrador** | C / R / U / D | R | — | R |

Notes on uncertain cells:

- **Visitante → Pedido**: `—` (checkout requires auth; unauthenticated users are redirected to login per AC-CHK-1).
- **Cliente → Pedido**: C (AC-CHK-2) and R (AC-CHK-5) only; update/delete not specified → `TBD — pending dev`.
- **Cliente → Cuenta**: only read of their own authenticated state is implied; account update/delete not in the ACs → `TBD — pending dev`.
- **Administrador → Cuenta**: only the admin login is covered; no account-management ACs exist → R only.
- **Carrito for Visitante/Cliente**: persisted client-side (localStorage) per AC-CART-1, so full C/R/U/D applies regardless of role.

## Feature Flags

None known or defined. The proposal and brief make no mention of feature flags; none are recorded here.

## Roadmap Mapping

Modules mapped to course weeks only where the brief names them. The brief's week titles are: S4 "Desarrollo I y Autenticación", S5 "Desarrollo II y Catálogo de Productos", S6 "Desarrollo III, carrito y checkout".

| Course week | Module(s) named in the brief |
| --- | --- |
| S4 — Desarrollo I y Autenticación | Autenticación y registro |
| S5 — Desarrollo II y Catálogo de Productos | Catálogo |
| S6 — Desarrollo III, carrito y checkout | Carrito · Checkout y creación de pedido |

Unmapped (not named in the brief's week structure): **Detalle de producto**, **Panel de administración**, **Navegación y general**. Detalle de producto is a separate module in the proposal but is not separately named in the week titles; its placement is `TBD — pending dev`.
