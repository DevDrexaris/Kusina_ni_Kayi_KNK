# Customer Workflow

**Evidence status:** VERIFIED in `App.tsx`, `Cart.tsx`, and the PHP APIs.

1. Customer registers/logs in; `AppContent()` restores the session and `Customer()` supplies customer routes.
2. `MenuPage()` loads public products and categories. Cart items are persisted to browser `localStorage`.
3. `Cart.tsx` loads/saves customer addresses and submits product IDs/quantities to `orders.php?action=create`.
4. PHP rechecks product availability and price, calculates subtotal + ₱50 delivery, and writes `orders`, `order_items`, and an order-created notification.
5. Customer views `orders.php?action=mine`, can cancel only eligible orders with a reason, and can submit a 1–5 rating after delivery.

Sources: [Customer routes](../../frontend/src/App.tsx#L1381), [checkout](../../frontend/src/Cart.tsx#L41), [order creation](../../backend/api/orders.php#L10), [rating restrictions](../../backend/api/ratings.php#L12).
