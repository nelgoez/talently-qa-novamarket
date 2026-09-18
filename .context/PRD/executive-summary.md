# NovaMarket — Executive Summary

## What NovaMarket Is

NovaMarket is a small-to-medium enterprise (PYME) that sells technology products: accessories, peripherals, and gadgets. Today it sells through social media and third-party marketplaces. This project delivers the company's own online sales channel: a functional e-commerce web platform.

## The Problem

| Pain | Impact |
|---|---|
| Total dependence on external platforms | No control over catalog, orders, or the customer experience |
| No ownership of the sales channel | Limited ability to manage products and orders directly |
| Manual, disorganized processes | Constrains growth |

## The MVP Goal

Build a functional e-commerce web platform. The focus is a clear, simple, and operational buying flow, with functionality prioritized over extreme optimization. This is an educational, collaborative simulation with an eventual production deployment, so the team applies real-world practices without the pressure of an external client.

## In-Scope Capabilities

| Audience | Capabilities |
|---|---|
| Clients | Registration and login, catalog with filters, shopping cart, simulated checkout ("checkout simulado") |
| Administrators | Admin login, product CRUD (Create, Read, Update, Delete), basic order view |

## Out of Scope

| Excluded | Rationale |
|---|---|
| Real payment gateway | Checkout is simulated; no real payment data is requested |
| Shipping management | Not included |
| External integrations | Not included |
| Mobile app | Web only |

## The 8-Week Constraint

The project has 8 weeks of development. The exclusions above are deliberate trade-offs to meet that timeline. The absolute priority is working functionality over extreme optimization.

## Product Scope by Module

Seven modules define the MVP. Each carries proposed acceptance criteria (ACs) that QA drafted as a starting point for the team.

| Module | Purpose |
|---|---|
| Authentication / registration | Visitor sign-up and login, session persistence |
| Catalog | Product listing with pagination, search, and category filters |
| Product detail | Single product view with image, price, stock, and add-to-cart |
| Cart | Persistent cart with quantity, removal, and totals |
| Checkout / order creation | Simulated checkout that creates an order ("checkout simulado") |
| Admin panel | Product CRUD and order view, restricted to the admin role |
| Navigation and general | Navbar state, 404 handling, responsive (mobile-first) views |

## Cross-Functional Team

| Role | Week 8 Deliverable |
|---|---|
| Project Manager | Configured, prioritized Kanban board; strict MVP scope control; Final Demo and Retrospective coordination |
| Back End Developer | Deployed, documented REST API; product CRUD and stock management; functional cart logic |
| Front End Developer | Deployed SPA (catalog and checkout); real-time cart state; 100% mobile-first responsive design |
| UX/UI Designer | Navigable sales-funnel prototype; UI Kit (buy buttons, product cards); user personas and flow documentation |
| QA Tester | Test Plan focused on the payment flow; UI and database bug reports; scenario validation (e.g. negative stock) |
| Data Analyst | Telemetry matrix and key events; conversion KPIs (sales); commercial impact report for the Demo |
| Marketing Specialist | Transactional emails; persuasive microcopy for buy buttons; commercial pitch and launch campaign |
| Graphic Designer | Visual identity (logo and palette); graphic assets for products and empty states; realistic mockups |

## Related Artifacts

- `user-personas.md` — the three target actors
- `user-journeys.md` — key end-to-end flows
- `feature-inventory.md` — feature catalog grouped by module
