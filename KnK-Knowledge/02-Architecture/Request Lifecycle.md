# Request Lifecycle

**Evidence status:** VERIFIED in [api.ts](../../frontend/src/api.ts#L63), [vite.config.ts](../../frontend/vite.config.ts#L5), [api.php](../../backend/helpers/api.php#L2), and [auth.php](../../backend/helpers/auth.php#L1).

1. A page calls a named method on the `api` object.
2. `request()` sends `fetch('/api/<path>', { credentials: 'include', headers: {'Content-Type':'application/json'} })`. Mutations use JSON request bodies.
3. During Vite development, `/api` is proxied to `http://localhost/KnK/backend`.
4. PHP loads helpers, resolves the action, checks authentication/role where applicable, and executes PDO SQL.
5. `json_response()` emits `{success,message,data}`. The client parses JSON and throws an `Error` for unsuccessful envelopes.
6. Components update React state based on returned data; several screens refresh on an interval.

**Deployment caveat:** the local Vite proxy target is an external XAMPP installation path. A successful UI build does not verify the PHP copy or database used at runtime.
