# Development Commands

**Evidence status:** VERIFIED against `frontend/package.json`, Vite config, and installed Graphify CLI workflow.

From project root in PowerShell:

```powershell
npm --prefix frontend install
npm --prefix frontend run dev
npm --prefix frontend run build
npm --prefix frontend run preview
php -l "backend\api\orders.php"
```

Vite's configured `/api` proxy points to `http://localhost/KnK/backend`; Apache/MySQL must be available at the configured local XAMPP setup. Verify the PHP path before expecting workspace edits to be served.

Graphify's local graph and Obsidian export commands are documented in [[Graph Index]] and [[Knowledge Maintenance Workflow]]. Do not run LLM extraction against private source unless an approved local-only backend is configured.
