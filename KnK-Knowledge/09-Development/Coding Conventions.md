# Coding Conventions

**Evidence status:** VERIFIED from current source style and tooling.

- Frontend: TypeScript + React function components/hooks; shared network calls live in `frontend/src/api.ts`; UI and shared `OrderTable()` are currently concentrated in `App.tsx`.
- Backend: PHP endpoint scripts dispatch with a query-string `action`, load shared helpers with `require_once`, and return `json_response()` envelopes.
- Database access uses the shared `db(): PDO`; use parameterized SQL for values and preserve transaction boundaries.
- Keep server-side validation and role checks even when the UI hides an action.
- Reuse existing styles/components and keep unrelated admin/customer behavior unchanged when implementing a role-specific fix.
- Use `frontend/.prettierrc`; prettier dependencies include PHP plugin, but no lint/test scripts are defined.

Follow existing naming, formatting, localization, and UI conventions. Confirm before changing product behavior or cross-role behavior.
