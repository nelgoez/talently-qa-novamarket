# NovaMarket — Domain Glossary

| Term | Definition |
|---|---|
| NovaMarket | Small-to-medium enterprise (PYME) that sells technology products (accessories, peripherals, and gadgets) and is building its own online sales channel. |
| Catálogo (catalog) | Public product listing with name, price, image, search, category filters, and pagination. |
| Producto (product) | An item sold on the platform, defined by name, description, price, image, category, and stock. |
| Stock | Available quantity of a product; drives "sin stock" (out-of-stock) states, disabled add-to-cart, and the stock-exceed guard in the cart. |
| Carrito (cart) | Shopping cart holding selected items and quantities; persists across page reloads (localStorage per the proposal, pending Frontend confirmation). |
| Checkout simulado (simulated checkout) | Order confirmation flow with no real payment gateway and no real payment data requested; only order confirmation data. |
| Pedido (order) | Created when an authenticated customer confirms checkout; reflects items, quantities, and total. |
| Cliente (customer) | Authenticated user who can browse the catalog, use the cart, and check out. |
| Administrador (administrator) | Authenticated user with an admin role who manages products (CRUD) and views orders. |
| Visitante (visitor) | Unauthenticated user who can browse the catalog, view product detail, and use the cart. |
| CRUD | Create, Read, Update, Delete; the product-management operations available to the administrator in the admin panel. |
| Filtro (filter) | Catalog capability to narrow products by category (and search by term). |
| Paginación (pagination) | Catalog capability to page through product results beyond a threshold (N products) with forward/back navigation. |
| Rol admin (admin role) | Authorization level that gates the admin panel; a customer without it is redirected away from `/admin`. |
| JWT/token | Session credential returned on successful login; rehydrates the session on reload and is rejected (`401`) when expired or invalid (pending Backend decision on the token mechanism). |
| MVP | Minimum viable product: a functional e-commerce web platform with client capabilities (registration/login, catalog, cart, simulated checkout) and admin capabilities (login, product CRUD, basic order view), delivered within 8 weeks. |
