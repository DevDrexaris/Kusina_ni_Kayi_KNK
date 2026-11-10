# Backend Defense Guide

**Evidence status:** VERIFIED implementation summary; not a penetration-test report.

- `require_auth()` is the common authentication gate; role-specific APIs must continue to apply server-side checks.
- Prefer PDO prepared statements for request-derived values; preserve existing validation and explicit error responses.
- Recalculate price and availability server-side. Never trust values supplied by the browser for order totals.
- Preserve ownership checks for customer addresses, orders, cancellations, and ratings.
- Keep delivery completion restricted to the assigned rider; preserve the delivery audit fields.
- Use transactions and row locks where the current code uses them for concurrent assignment/status changes.
- Keep `KNK_DB_*` secrets outside source and notes. Do not expose values from `Accounts.md` or local config.
- Avoid sending source code to hosted Graphify/LLM services; the documented update path here is no-LLM and local.

Consult [[Authentication]], [[Security Implementation]], [[Business Logic]], and [[SQL Operations]] before modifying backend behavior.
