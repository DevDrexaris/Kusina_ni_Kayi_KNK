# SQL Operations

**Evidence status:** VERIFIED from PDO and SQL source.

- Queries use PDO through `db()`; most variable values are passed through prepared statements. `database.php` enables PDO exceptions and associative fetches.
- `orders.php?action=create` uses a transaction for order/order-item/notification inserts and rolls back in the catch path if needed.
- Rider assign/unassign, rider delivery, customer cancellation, and status change paths also use transactions/row locks where coded.
- Product/category CRUD and list operations are in their respective endpoints.
- `knk_database.sql` is a full `CREATE DATABASE` + `CREATE TABLE IF NOT EXISTS` baseline and inserts sample categories/products.
- `role_migration.sql` contains `ALTER TABLE` statements and creates additional tables. Its `ALTER` steps are not guarded as idempotent; verify the DB migration state before running it again.

Do not run schema scripts against a live database as a documentation step. Read [knk_database.sql](../../database/knk_database.sql#L1) and [role_migration.sql](../../database/role_migration.sql#L1) first.
