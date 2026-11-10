# Project Overview

**Evidence status:** VERIFIED. Primary references: [README.md](../../README.md), [App.tsx](../../frontend/src/App.tsx#L3416), [orders.php](../../backend/api/orders.php#L10).

KnK is a local online food-ordering and delivery application. Customers browse products, keep a browser-local cart, place Cash on Delivery (COD) orders, and review order status. Staff process active orders and assign riders. Riders update delivery status. Admin manages products, categories, users, and orders.

The backend is PHP using PDO and MySQL. The frontend is a React SPA built with TypeScript and Vite. The development Vite proxy forwards `/api` to `http://localhost/KnK/backend`; this points to an XAMPP path outside this workspace and can differ from `backend/` here. Verify which copy is serving a runtime issue.

## Main code areas
- `frontend/src/App.tsx` — role-specific pages, routing, and shared UI.
- `frontend/src/api.ts` — typed API models and centralized fetch methods.
- `backend/api/` — PHP action endpoints.
- `backend/helpers/` — JSON/method and session-auth helpers.
- `backend/config/database.php` — PDO connection.
- `database/knk_database.sql` — current schema and seed rows.
- `database/role_migration.sql` — role, delivery, rating, notification, and address migration.

See [[System Architecture]], [[PHP File Inventory]], [[Database Overview]], and [[Knowledge Maintenance Workflow]].
