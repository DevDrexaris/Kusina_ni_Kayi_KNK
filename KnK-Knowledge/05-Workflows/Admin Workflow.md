# Admin Workflow

**Evidence status:** VERIFIED in route tree and admin-gated PHP actions.

Admin routes include dashboard, orders, products, categories, and team management. Admin can view order/rating data, manage product prices/availability and categories, create team users, moderate accounts, view notifications, and update eligible order statuses. Admin cannot mark an order Delivered directly; the assigned rider must do so.

Sources: [Admin routes](../../frontend/src/App.tsx#L2688), [order endpoint](../../backend/api/orders.php#L390), [product CRUD](../../backend/api/products.php#L26), [auth management](../../backend/api/auth.php#L52).
