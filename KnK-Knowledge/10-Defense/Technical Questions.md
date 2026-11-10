# Technical Questions

## Verified answers

- **How is the backend database accessed?** `db()` returns a cached PDO connection configured for MySQL in `backend/config/database.php`.
- **How are user sessions checked?** `require_auth()` reads and refreshes the PHP session user from `users`; it can enforce a role and rejects inactive accounts.
- **Where are order totals trusted?** Nowhere from the client: checkout reads product prices and availability from the database, then computes total in PHP.
- **What is delivery fee?** The order-create handler currently applies a fixed ₱50.
- **Who completes an order?** The assigned rider's `rider_status` action sets Delivered and records rider/time.
- **Can a cancelled order be rated?** No; submission requires an owned Delivered order.
- **What runs frontend validation?** `npm --prefix frontend run build` runs TypeScript build and Vite production bundling; no frontend test script is defined.

## Verify before answering

- Exact production PHP path, database configuration, actual migration history, runtime PHP/MySQL versions, and deployed changes are **UNVERIFIED** until inspected in that environment.
