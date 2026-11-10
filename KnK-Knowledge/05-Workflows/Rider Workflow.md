# Rider Workflow

**Evidence status:** VERIFIED in `App.tsx`, `auth.php`, and `orders.php`.

1. Admin/staff selects an active, available rider; PHP records assignment history and the current rider on the order.
2. Rider dashboard lists only orders assigned to the authenticated rider.
3. Rider can update their own availability. The delivery status endpoint accepts `Out for Delivery` or `Delivered`.
4. On Delivered, PHP records rider ID and timestamp. The customer may then rate the order.

There is no map/GPS tracking in the verified scope. See [RiderDashboard()](../../frontend/src/App.tsx#L2349), [assignment](../../backend/api/orders.php#L205), [rider status](../../backend/api/orders.php#L256), and [[Table Relationships]].
