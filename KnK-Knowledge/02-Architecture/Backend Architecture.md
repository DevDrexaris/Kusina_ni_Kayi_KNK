# Backend Architecture

**Evidence status:** VERIFIED in PHP source.

- Endpoint scripts in `backend/api/` load shared API/auth helpers and use `db()` for MySQL access.
- `backend/config/database.php::db()` configures PDO exception mode and associative fetches; connection settings come from `KNK_DB_HOST`, `KNK_DB_NAME`, `KNK_DB_USER`, and `KNK_DB_PASS`, with local defaults.
- `backend/helpers/auth.php` starts a PHP session with `httponly` and `samesite=Lax` cookie options and defines `current_user()` / `require_auth()`.
- `backend/helpers/api.php` defines `input()`, `require_method()`, and `json_response()` with a `{success,message,data}` envelope.
- Endpoints dispatch on `$_GET['action']` and make direct PDO prepared/query calls. See [[PHP File Inventory]], [[API Documentation]], and [[SQL Operations]].

No PHP framework/router is present in the inspected source. Each PHP endpoint is a directly addressable script.
