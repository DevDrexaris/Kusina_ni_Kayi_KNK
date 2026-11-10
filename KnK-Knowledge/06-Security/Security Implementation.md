# Security Implementation

**Evidence status:** VERIFIED implementation notes, not a full security audit.

- Session cookies are initialized with `httponly` and `samesite=Lax`; active account status and optional exact role are rechecked by `require_auth()`.
- PHP endpoints apply server-side role checks. Client-side route selection is not sufficient authorization.
- PDO is configured for exception mode; data-dependent operations commonly use prepared statements.
- Checkout recalculates price and checks availability from MySQL rather than trusting cart prices.
- Rating submission validates ownership, delivered status, 1–5 range, max review length, and uniqueness.
- Static source shows no CSRF token flow in the shared client/helper. Session cookie options in this code do not set `secure`. These are observations only; deployment behavior may add controls not present here.
- Connection details may come from environment variables. Keep credentials and session data out of notes and source control.

Related sources: [auth helper](../../backend/helpers/auth.php#L1), [PDO config](../../backend/config/database.php#L2), [rating validation](../../backend/api/ratings.php#L12), [[Authentication]].
