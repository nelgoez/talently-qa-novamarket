# NovaMarket — Business Model

## Executive Summary

NovaMarket is a small-to-medium enterprise (PYME) that sells technology products: accessories, peripherals, and gadgets. It currently sells through social media and third-party marketplaces. The project goal is to launch its own functional e-commerce web platform, focused on a clear, simple, and operational buying flow.

## The Problem

| Pain | Impact |
|---|---|
| Total dependence on external platforms | No control over catalog, orders, or the customer experience |
| No ownership of the sales channel | Limited ability to manage products and orders directly |
| Manual, disorganized processes | Constrains growth |

## The Solution / MVP

Develop a functional e-commerce web platform. The focus is a clear, simple, and operational flow. The scope is defined by two capabilities:

| Capability | Scope |
|---|---|
| Client | Registration and login, catalog with filters, shopping cart, simulated checkout |
| Administrator | Admin login, CRUD (Create, Read, Update, Delete) of products, basic order view |

## Value Proposition

Replace dependence on third-party channels with an owned online sales channel that gives NovaMarket control over its catalog, order management, and customer experience.

## Customers & Users

| Actor | Authentication | Capabilities |
|---|---|---|
| Visitante (visitor) | No | Catalog, product detail, cart |
| Cliente (customer) | Yes | Catalog, cart, checkout |
| Administrador (administrator) | Yes + admin role | Product management, order view |

## Channels

A single owned web channel (SPA catalog and checkout plus an admin panel) replaces the current social-media and third-party-marketplace sales channels.

## Constraints & Out of Scope

| Constraint | Detail |
|---|---|
| Timeline | 8 weeks of development |
| No real payment gateway | Checkout is simulated ("checkout simulado"), no real payment data requested |
| No shipping management | Out of scope |
| No external integrations | Out of scope |
| No mobile app | Web only |
| Priority | Functionality over extreme optimization |

## Team

| Role | Deliverable (Week 8) |
|---|---|
| Project Manager | Configured, prioritized Kanban board; strict MVP scope control; Final Demo and Retrospective coordination |
| Back End Developer | Deployed, documented REST API; product CRUD and stock management; functional cart logic |
| Front End Developer | Deployed SPA (catalog and checkout); real-time cart state; 100% mobile-first responsive design |
| UX/UI Designer | Navigable sales-funnel prototype; UI Kit (buy buttons, product cards); user personas and flow documentation |
| QA Tester | Test Plan focused on the payment flow; UI and database bug reports; scenario validation (e.g. negative stock) |
| Data Analyst | Telemetry matrix and key events; conversion KPIs (sales); commercial impact report for the Demo |
| Marketing Specialist | Transactional emails; persuasive microcopy for buy buttons; commercial pitch and launch campaign |
| Graphic Designer | Visual identity (logo and palette); graphic assets for products and empty states; realistic mockups |
