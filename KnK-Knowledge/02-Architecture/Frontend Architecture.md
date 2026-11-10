# Frontend Architecture

**Evidence status:** VERIFIED from `frontend/src`.

- `main.tsx` mounts `<App />` in React `StrictMode`, imports global CSS, and registers `/sw.js`.
- `App.tsx` contains `AppContent`, role selection, route trees, and most pages/components. Role route mappings begin at line 3416; staff history is `StaffHistory()` at line 2099; shared `OrderTable()` is at line 2910.
- `Cart.tsx` is a separate customer cart/checkout component. `Customer()` in `App.tsx` stores the cart in `localStorage` under `knk-cart`; the server revalidates price and availability.
- `api.ts` defines API data types and a single `request()` wrapper. It sends credentials, JSON, parses the standard response envelope, and throws when `success` is false.
- `index.css` contains all styles; there are no component-specific CSS modules in `src`.
- The complete `frontend/src/` inventory is `App.tsx`, `Cart.tsx`, `api.ts`, `index.css`, `main.tsx`, and `vite-env.d.ts`. The frontend root also contains `index.html`, `package.json`/lockfile, Vite config, and three TypeScript configs. `frontend/public/` is currently empty; `dist/` and `node_modules/` are generated/dependency directories.

The UI chooses the role shell after `api.me()` restores the session. This client routing is UX, not a substitute for PHP authorization. See [[Authentication]] and [[API Documentation]].
