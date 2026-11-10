# Testing Guide

**Evidence status:** VERIFIED in current package scripts; no standalone test suite was found in the enumerated project files.

1. For frontend/TypeScript changes run `npm --prefix frontend run build` (executes `tsc -b && vite build`).
2. For PHP changes run `php -l <changed-file.php>`.
3. For endpoint behavior, verify the live PHP target and DB, authenticate with the appropriate role, and inspect both response fields and rendered UI.
4. For schema changes, review both SQL scripts and the actual DB migration state before execution; do not use a production DB for exploratory validation.
5. For UI changes, verify the relevant role route and responsive layout, especially table overflow.

There is no `test` or `lint` script in `frontend/package.json`. Do not claim a full test suite passed when only the build/lint command ran.
