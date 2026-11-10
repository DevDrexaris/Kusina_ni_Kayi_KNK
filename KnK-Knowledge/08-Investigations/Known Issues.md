# Known Issues

**Evidence status:** VERIFIED observations as of 2026-11-10. “Known” does not necessarily mean a defect.

1. **Workspace/deployment copy drift risk:** Vite proxies `/api` to `http://localhost/KnK/backend`, which is outside the workspace backend path. Changes made only in the workspace may not affect the running app. Compare the served PHP file before implementing a runtime-only fix. See [[Root Causes]] and [[Investigation Log]].
2. **Graphify PHP coverage:** the local Graphify update produced AST nodes for PHP files but reported PHP source files with no symbols. Its generated graph cannot fully connect PHP action bodies to SQL/API calls. See [[Graph Index]].
3. **Migration repeatability:** `role_migration.sql` contains unguarded `ALTER TABLE` statements; applying it a second time may fail. Verify migration state before execution.
4. **No frontend test script is defined** in `frontend/package.json`; the verified automated check is the TypeScript/Vite production build.
5. **OUTDATED README delivery-status description:** `README.md` says riders advance through Accepted and Picked Up, but `orders.php?action=rider_status` currently accepts only Out for Delivery and Delivered. The DB enum includes Accepted/Picked Up, but no current rider API workflow for those states was verified. See [README.md](../../README.md#L16) and [orders.php](../../backend/api/orders.php#L256).

Recheck these statements when deployment, Graphify version, or project scripts change.
