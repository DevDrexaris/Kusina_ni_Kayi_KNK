# Technology Stack

**Evidence status:** VERIFIED in package manifests, source, SQL, and project README.

| Area | Verified technology |
|---|---|
| UI | React 18, TypeScript, React Router DOM 7 |
| Build/dev server | Vite 6; `frontend/package.json` |
| Icons | `lucide-react` |
| Server | PHP 8+ per README; PDO in `backend/config/database.php` |
| Database | MySQL, database name default `knk_food_delivery` |
| Local development | XAMPP Apache/MySQL; Vite proxy configured in `frontend/vite.config.ts` |
| Payments | COD only, enforced by the `orders.payment_method` enum and order-create flow |

No separate backend framework, cloud service, map, GPS, or external delivery provider is evidenced in this workspace. See [[Development Commands]] for verified package scripts.
