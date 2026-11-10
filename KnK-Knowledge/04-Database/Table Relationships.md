# Table Relationships

**Evidence status:** VERIFIED from foreign-key constraints in `database/knk_database.sql`.

| Parent | Child / key | Behavior |
|---|---|---|
| `users` | `customer_addresses.user_id` | Delete user cascades addresses. |
| `categories` | `products.category_id` | Delete category sets product category to NULL. |
| `users` | `orders.user_id` | Delete restricted. |
| `users` | `orders.rider_id` | Delete sets assigned rider to NULL. |
| `orders` | `order_items.order_id` | Delete order cascades item rows. |
| `products` | `order_items.product_id` | Delete product sets item product reference to NULL; product name/price snapshot remains. |
| `orders` | `delivery_assignments.order_id` | Delete order cascades assignment history. |
| `users` | `delivery_assignments.rider_id`, `assigned_by_user_id` | Delete restricted. |
| `orders` | `order_ratings.order_id` | Delete order cascades; `order_id` is unique (one rating per order). |
| `users` | `order_ratings.user_id` | Delete user cascades. |
| `orders` | `admin_notifications.order_id` | Delete order cascades; unique `(order_id,type)`. |

The delivered rider is stored separately in `orders.delivered_by_rider_id`; its FK is added by `role_migration.sql` (line 15). `orders.rider_id` means current assignment, while `delivered_by_rider_id` records who completed delivery. See [[SQL Operations]] and [[Database Overview]].
