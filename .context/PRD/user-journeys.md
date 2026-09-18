# NovaMarket — User Journeys

The five key flows below cover the MVP. Each step maps to proposed acceptance criteria (ACs) from `docs/proposals/propuesta-ac-matriz-novamarket.md` where they exist.

## (a) Anonymous Browse → Catalog → Product Detail → Add to Cart

| Step | Action | AC |
|---|---|---|
| 1 | Load the catalog and see products with name, price, image | AC-CAT-1 |
| 2 | Navigate pages, search, or filter by category | AC-CAT-2, AC-CAT-3, AC-CAT-4 |
| 3 | See an empty state when no products match | AC-CAT-5 |
| 4 | Open a product detail page with image, name, description, price, stock | AC-DET-1 |
| 5 | Add the product to the cart; navbar counter updates | AC-DET-2 |
| 6 | See a friendly not-found page for an unknown product URL | AC-DET-4 |
| 7 | Cart persists across reloads | AC-CART-1 |

## (b) Register / Login

| Step | Action | AC |
|---|---|---|
| 1 | Open `/register` and submit valid name/email/password | AC-AUTH-1 |
| 2 | See a clear error when the email is already registered | AC-AUTH-2 |
| 3 | See field-level validation for empty fields or a password outside policy | AC-AUTH-3 |
| 4 | Log in with correct credentials and receive a token | AC-AUTH-4 |
| 5 | See a generic error for invalid credentials | AC-AUTH-5 |
| 6 | Reload with an active session; session is restored | AC-AUTH-6 |
| 7 | On an expired/invalid token, receive `401` and redirect to `/login` | AC-AUTH-7 |

## (c) Client Checkout (Simulated)

| Step | Action | AC |
|---|---|---|
| 1 | Anonymous visitor with a cart tries `/checkout` and is redirected to `/login` | AC-CHK-1 |
| 2 | Authenticated client confirms checkout | AC-CHK-2 |
| 3 | An order is created and a confirmation is shown | AC-CHK-2 |
| 4 | The cart is emptied | AC-CHK-3 |
| 5 | No real payment data is requested (simulated checkout) | AC-CHK-4 |
| 6 | The created order reflects the correct items, quantities, and total | AC-CHK-5 |

## (d) Admin Product CRUD

| Step | Action | AC |
|---|---|---|
| 1 | A client without the admin role is redirected away from `/admin` | AC-ADM-1 |
| 2 | Admin creates a product; it appears in the public catalog | AC-ADM-2 |
| 3 | Admin edits a product (price, stock, name); changes propagate | AC-ADM-3 |
| 4 | Admin deletes a product; it disappears from the catalog | AC-ADM-4 |

## (e) Admin View Orders

| Step | Action | AC |
|---|---|---|
| 1 | Admin opens the orders list | AC-ADM-5 |
| 2 | Admin sees each order with its status and items | AC-ADM-5 |
