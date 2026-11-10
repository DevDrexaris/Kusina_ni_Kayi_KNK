# Graph Index

**Evidence status:** VERIFIED from Graphify CLI output created 2026-11-10.

At setup, the Graphify CLI was installed at `C:\Users\ADMIN\.local\bin\graphify.exe`; this workspace had no prior `graphify-out/`. Other registered Obsidian vaults belonged to other projects; no KnK vault was present.

## Actual Graphify artifacts

- `graphify-out/graph.json` — Graphify-generated graph for this workspace (180 nodes, 295 links at generation time).
- `KnK-Knowledge/11-Graph/Graphify-Generated/` — Graphify Obsidian export (180 notes plus `graph.canvas`).
- `.graphifyignore` excludes the vault, graph output, frontend dependencies, build output, `Accounts.md`, and environment files from future extraction.
- The generated graph includes React/TypeScript symbols and call/containment edges, SQL table nodes/foreign-key edges, and PHP file nodes. Use the actual canvas/notes for visual navigation; graph data is not manually authored.

Useful installed commands: `graphify query "..."`, `graphify path "A" "B"`, `graphify explain "Node"`, `graphify god-nodes`, and the update/export commands in [[Knowledge Maintenance Workflow]].

## Important parser limitation

The local Graphify run warned that code files yielded no symbols, including PHP endpoint action scripts. Some shared PHP helper symbols are present, but endpoint actions/queries are not extracted into semantic edges in this build. Therefore, a Graphify path from `StaffHistory()` to the `orders.php` action is not currently present. This is a **tool coverage limitation**, not evidence that the application has no connection.

Use the curated, source-cited [[API Documentation]], [[Business Logic]], and role workflow notes for verified PHP/API/database traces. They are documentation, not edits to the Graphify output. Do not manufacture Graphify JSON or describe a manual diagram as Graphify-generated.

The generated graph is a point-in-time artifact. Refresh it after source changes; keep tool warnings and version/coverage limitations visible.
