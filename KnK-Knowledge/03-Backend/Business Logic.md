# Business Logic

**Evidence status:** VERIFIED in PHP/React/SQL source.

## Pricing and checkout
- `Cart.tsx` computes a display subtotal from current product objects, but `orders.php?action=create` re-reads current product price and availability from `products`.
- PHP validates quantity 1–99, verifies each item exists and is available, computes line totals and subtotal, adds a fixed `50` delivery fee, and stores order plus item rows in a transaction.
- `products.price` is the authoritative current menu price; `order_items.unit_price` and `line_total` snapshot checkout pricing.
- Payment method is COD only in the schema.

## Delivery
- Admin/staff assign only active, available rider accounts. Assignment records are written to `delivery_assignments`; order `rider_id` and `assigned_at` are updated.
- Rider status action accepts `Out for Delivery` or `Delivered`; delivery completion stores `delivered_by_rider_id` and `delivered_at`.
- Admin/staff cannot mark an order delivered themselves. Staff/admin status updates also prevent mutation after delivery/cancellation and require an available assigned rider for dispatch.

## Ratings and events
- Only the owning customer can rate an order, only after it is delivered, and only once. Rating is 1–5; review is at most 1000 characters.
- Order creation/cancellation creates `admin_notifications` events; notification consumers are role-specific.

See source: [create](../../backend/api/orders.php#L10), [assign](../../backend/api/orders.php#L205), [rider status](../../backend/api/orders.php#L256), [ratings](../../backend/api/ratings.php#L12), [[Table Relationships]].
