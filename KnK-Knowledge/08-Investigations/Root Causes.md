# Root Causes

**Evidence status:** VERIFIED for the logged incident; no other root cause is asserted.

## Staff history missing delivery and rating details (2026-11-10)

- **Symptom:** staff page showed “Rider not recorded” and “Not rated” for rows that admin showed with a delivery timestamp/rider and five-star review.
- **Root cause:** Vite served API requests through `frontend/vite.config.ts` to `http://localhost/KnK/backend`. That active XAMPP copy's `orders.php?action=staff_history` selected only order and item columns. The workspace copy of the staff-history query already joined rider and rating data, but editing it did not alter the served copy.
- **Fix:** add rider/delivery and order-rating joins/fields to `C:\xampp\htdocs\KnK\backend\api\orders.php` staff-history action only.
- **Verification:** PHP syntax check passed; live API returned `delivered_by_name`, `delivered_at`, `rating`, and `review`; reloaded staff page rendered rider, time, stars, and review. Admin code/query was unchanged.
- **Prevention:** inspect the Vite proxy and confirm the exact served PHP path before code changes; keep deployed and workspace copies synchronized intentionally.

See [[Investigation Log]].
