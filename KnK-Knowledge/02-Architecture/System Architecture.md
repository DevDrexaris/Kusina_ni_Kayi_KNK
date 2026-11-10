# System Architecture

**Evidence status:** VERIFIED from source and configuration.

```text
React SPA (frontend/src)
  -> centralized fetch client (frontend/src/api.ts)
  -> Vite /api proxy in development
  -> PHP action endpoint (backend/api/*.php)
  -> shared session/auth + JSON helpers
  -> PDO connection
  -> MySQL (knk_food_delivery)
```

The UI selects role-specific route trees in [AppContent()](../../frontend/src/App.tsx#L3416). PHP endpoints independently enforce session and role checks. `db()` in [database.php](../../backend/config/database.php#L2) lazily creates a static PDO connection. SQL table definitions and foreign keys are in [knk_database.sql](../../database/knk_database.sql#L3).

**Important deployment boundary:** [vite.config.ts](../../frontend/vite.config.ts#L5) targets `http://localhost/KnK/backend`, not this workspace's `backend` directory. The active XAMPP copy may diverge; compare both before diagnosing an API discrepancy.

See [[Frontend Architecture]], [[Backend Architecture]], [[Request Lifecycle]], and [[Table Relationships]].
