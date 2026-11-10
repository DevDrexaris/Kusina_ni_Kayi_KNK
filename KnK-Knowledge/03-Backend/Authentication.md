# Authentication and Authorization

**Evidence status:** VERIFIED in source.

- `backend/helpers/auth.php::require_auth()` (lines 9–34) reads session user data, re-queries the user row, rejects absent/non-active users, refreshes the session user, and optionally enforces an exact role.
- Sessions start with `httponly` and `samesite=Lax` cookie options in `auth.php` helper line 2. This file does not set a `secure` cookie option.
- `AppContent()` restores via `api.me()` and routes the UI by role (`frontend/src/App.tsx` lines 3416 onward). PHP endpoint guards are the security boundary.
- `auth.php` handles public registration/login and authenticated operations. Admin-only operations include team account creation and moderation.
- `orders.php` has separate customer, staff, rider, and admin gates; staff/admin shared actions explicitly test both roles.
- `ratings.php` permits submission only from customers; rating reads allow only the owning customer or admin.

No credential values belong in this vault. Do not copy `Accounts.md`, `.env`, or local database secrets into notes or prompts. See [[Security Implementation]].
