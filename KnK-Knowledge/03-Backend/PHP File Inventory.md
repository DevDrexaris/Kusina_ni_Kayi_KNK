# PHP File Inventory

**Evidence status:** VERIFIED by enumerating the workspace `backend/` directory. Paths below are relative to project root.

| Path | Responsibility / verified entry points |
|---|---|
| `backend/api/addresses.php` | Customer address list/save/delete; see actions at lines 20, 28, 99. |
| `backend/api/auth.php` | Registration/login, team-user creation, rider availability/listing, admin moderation, logout and session user; see lines 7–171. |
| `backend/api/categories.php` | Public list; admin save/delete; lines 7–30. |
| `backend/api/get_notifications.php` | Admin notifications and deletion. |
| `backend/api/get_user_notifications.php` | Authenticated customer's order notifications. |
| `backend/api/orders.php` | Order create/read/update; staff, rider, admin flows; lines 10–415. |
| `backend/api/products.php` | Product list/detail and admin save/delete; lines 7–67. |
| `backend/api/ratings.php` | Customer rating submit; customer/admin rating read; lines 12–65. |
| `backend/api/stats.php` | Admin dashboard stats; admin gate at line 5. |
| `backend/config/database.php` | `db(): PDO`, env-based connection. |
| `backend/helpers/api.php` | `json_response()`, `input()`, `require_method()`. |
| `backend/helpers/auth.php` | `current_user()`, `require_auth()`. |
| `backend/setup/seed_admin.php` | Administrative account setup/seed utility. |

The PHP files are action scripts, not class-based controllers. Detailed action mapping: [[API Documentation]]. Line references should be refreshed after code movement.
