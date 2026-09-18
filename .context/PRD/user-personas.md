# NovaMarket — User Personas

Three actors drive the MVP. They are derived strictly from the proposal's actor table and the source brief. Demographic detail (age, income, occupation) is not specified in the source and is therefore left unstated rather than invented.

## Visitante (Anonymous Visitor)

### Who They Are

A person browsing the store without an account and without signing in. Demographics: not specified.

### Goals

- Explore the catalog and find products of interest.
- Inspect a product's detail before deciding.
- Start assembling a cart without committing to an account.

### Capabilities / Actions

| Capability | Notes |
|---|---|
| Browse catalog | Name, price, image; pagination, search, category filter |
| View product detail | Gallery/image, name, description, price, stock |
| Add to cart | Within available stock |
| View and manage cart | Persists across reloads (localStorage) |
| Register or log in | To proceed past the cart |

### Journeys They Care About

- Anonymous browse → catalog → product detail → add to cart
- Register / login (to convert from visitor to customer)

## Cliente (Authenticated Customer)

### Who They Are

A person with a registered account, signed in. Demographics: not specified.

### Goals

- Complete a purchase through the simulated checkout.
- Trust that the order reflects the intended items and totals.

### Capabilities / Actions

| Capability | Notes |
|---|---|
| Register and log in | Account creation, session persistence, token rehydration |
| Browse catalog | Same as visitor |
| Manage cart | Same as visitor |
| Checkout | Requires authentication; creates an order with no real payment data |

### Journeys They Care About

- Register / login
- Client checkout (simulated) — from cart to confirmed order

## Administrador (Store Admin)

### Who They Are

A staff member responsible for the store's products and orders. Signed in with an account carrying the admin role. Demographics: not specified.

### Goals

- Keep the public catalog accurate and current.
- See the orders customers have placed.

### Capabilities / Actions

| Capability | Notes |
|---|---|
| Admin login | Requires admin role; clients cannot access the panel |
| Create product | New product becomes visible in the public catalog |
| Edit product | Price, stock, name changes propagate to catalog and detail |
| Delete product | Product disappears from the catalog |
| View orders | List of orders with status and items |

### Journeys They Care About

- Admin product CRUD (create, edit, delete)
- Admin view orders
