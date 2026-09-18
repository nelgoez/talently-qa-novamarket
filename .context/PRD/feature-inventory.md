# NovaMarket — Feature Inventory

Feature catalog grouped by the seven MVP modules. Descriptions are user-facing; acceptance criteria (AC) references come from `docs/proposals/propuesta-ac-matriz-novamarket.md`. No endpoints, database schema, or data are specified here — such detail is a pending dev deliverable.

## Module 1 — Authentication / Registration

| Feature | Description | AC |
|---|---|---|
| Account registration | A visitor creates an account with name, email, and password | AC-AUTH-1, AC-AUTH-2, AC-AUTH-3 |
| Login | A user signs in and receives a token to access client areas | AC-AUTH-4, AC-AUTH-5 |
| Session persistence | An active session survives reloads; expired tokens redirect to login | AC-AUTH-6, AC-AUTH-7 |

## Module 2 — Catalog

| Feature | Description | AC |
|---|---|---|
| Product listing | Browse products with name, price, and image | AC-CAT-1 |
| Pagination | Move between pages of products | AC-CAT-2 |
| Search | Filter products by name/description term | AC-CAT-3 |
| Category filter | Show products in a chosen category | AC-CAT-4 |
| Empty state | Friendly message when no products match | AC-CAT-5 |
| Out-of-stock handling | Mark or omit products with no stock | AC-CAT-6 |

## Module 3 — Product Detail

| Feature | Description | AC |
|---|---|---|
| Detail view | Show gallery/image, name, description, price, and stock | AC-DET-1 |
| Add to cart | Add the product and update the navbar counter | AC-DET-2 |
| Out-of-stock guard | Disable add-to-cart when stock is zero | AC-DET-3 |
| Not-found page | Friendly page for an unknown product URL | AC-DET-4 |

## Module 4 — Cart

| Feature | Description | AC |
|---|---|---|
| Cart persistence | Cart survives page reloads (localStorage) | AC-CART-1 |
| Quantity update | Adjust quantity; subtotal and total recalculate | AC-CART-2 |
| Item removal | Remove an item; total updates | AC-CART-3 |
| Empty state | Empty cart with a link back to the catalog | AC-CART-4 |
| Stock cap | Prevent adding more than available stock | AC-CART-5 |

## Module 5 — Checkout / Order Creation

| Feature | Description | AC |
|---|---|---|
| Authentication gate | Anonymous visitors are redirected to login | AC-CHK-1 |
| Order creation | Confirming checkout creates an order and shows confirmation | AC-CHK-2 |
| Cart clearing | The cart empties after checkout | AC-CHK-3 |
| Simulated payment | No real payment data requested ("checkout simulado") | AC-CHK-4 |
| Order accuracy | Orders reflect correct items, quantities, and total | AC-CHK-5 |

## Module 6 — Admin Panel

| Feature | Description | AC |
|---|---|---|
| Role guard | Only the admin role can access the panel | AC-ADM-1 |
| Create product | Add a product that becomes publicly visible | AC-ADM-2 |
| Edit product | Update price, stock, or name; changes propagate | AC-ADM-3 |
| Delete product | Remove a product from the catalog | AC-ADM-4 |
| View orders | List orders with status and items | AC-ADM-5 |

## Module 7 — Navigation and General

| Feature | Description | AC |
|---|---|---|
| Contextual navbar | Navbar options reflect login state | AC-NAV-1 |
| 404 handling | Friendly page for unknown routes | AC-NAV-2 |
| Responsive views | Main views usable on mobile and desktop (mobile-first) | AC-NAV-3 |

## Pending Dev Deliverables

The following detail is deferred to the Back End and Front End teams and is not specified in this PRD:

- API endpoint contracts
- Database schema
- Error response format
- Authentication mechanism details

The base assumption is PostgreSQL as the data engine, pending Backend ratification.
