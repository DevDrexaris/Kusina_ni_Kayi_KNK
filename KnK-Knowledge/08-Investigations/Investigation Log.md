# Investigation Log

## 2026-11-10 — Staff order-history delivery/rating fields

**Status:** FIXED and runtime-verified.

- Staff screenshot had existing columns but missing values. Live staff API payload had order fields and items only.
- Vite proxy in `frontend/vite.config.ts` pointed to `C:\xampp\htdocs\KnK\backend`, which differed from the workspace backend.
- Updated only `staff_history` in the active XAMPP `orders.php`; workspace copy/admin query not changed in that fix.
- Verified PHP syntax and the live staff view: rider name/time and five-star review showed for completed rated orders; cancelled orders without ratings remained unrated.

Further log entries should include date, observed evidence, source paths, root cause, fix, and validation; mark unresolved claims **UNVERIFIED**.
