# Database Overview

**Evidence status:** VERIFIED in [knk_database.sql](../../database/knk_database.sql#L1) and [role_migration.sql](../../database/role_migration.sql#L1).

Database name is `knk_food_delivery`. PDO connection settings are read by `db()` from environment variables, with `localhost`, `knk_food_delivery`, `root`, and empty password defaults. Do not rely on defaults in shared/production environments.

The baseline schema defines nine tables: `users`, `customer_addresses`, `categories`, `products`, `orders`, `delivery_assignments`, `order_items`, `order_ratings`, and `admin_notifications`. The role migration adds/modifies roles, account status, rider availability, cancellation, delivery audit fields, and creates delivery/rating/notification/address tables.

An ERD already exists at `docs/ERD/KnK_ERD.mmd`, with rendered PNG/SVG files. Treat SQL as authoritative; verify if the ERD differs. See [[Table Relationships]].
