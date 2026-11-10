# Feature Inventory

**Evidence status:** VERIFIED against the workspace routes, API methods, and SQL.

| Feature | UI / entry point | Backend / data |
|---|---|---|
| Browse products/categories | `MenuPage()` | `products.php`, `categories.php`; `products`, `categories` |
| Cart and COD checkout | `Customer()`, `Cart.tsx` | `orders.php?action=create`; `orders`, `order_items`, `products` |
| Saved addresses | `AddressBook`, `Cart` | `addresses.php`; `customer_addresses` |
| Order history/cancel | `Orders()` | `orders.php`; `orders`, `order_items` |
| Customer rating | `RatingModal` | `ratings.php`; `order_ratings` |
| Staff order operations/history | `StaffOrders`, `StaffHistory` | `orders.php`; orders, items, users, ratings |
| Delivery assignment/history | `RiderAssignmentSheet`, admin/staff orders | `orders.php`; `delivery_assignments`, `orders`, `users` |
| Rider availability/delivery | `RiderDashboard()` | `auth.php`, `orders.php`; `users`, `orders` |
| Admin product/category/team management | admin route components | `products.php`, `categories.php`, `auth.php` |
| Notifications | role-specific notification components | `get_notifications.php`, `get_user_notifications.php`, order actions; `admin_notifications` |
| Dashboard stats | admin/staff dashboards | `stats.php`, `orders.php`; aggregate database queries |

See [[API Documentation]] and the role-specific workflow notes for behavior and permissions.
