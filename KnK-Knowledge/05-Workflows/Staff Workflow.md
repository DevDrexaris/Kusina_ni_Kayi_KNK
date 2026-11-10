# Staff Workflow

**Evidence status:** VERIFIED in `App.tsx` and `orders.php`.

1. Staff routes are `/staff`, `/staff/orders`, `/staff/history`, `/staff/customers`, and `/staff/notifications`.
2. Active orders load via `orders.php?action=active`; staff can assign/unassign riders and update permitted statuses.
3. `staff_history` returns completed/cancelled orders; `OrderTable()` renders the delivery audit and rating/review columns.
4. Staff customer details and staff notifications use dedicated order endpoint actions.

Staff cannot complete delivery via `staff_status`; only the assigned rider can set Delivered. The PHP server repeats role checks, so route visibility is not the permission control.

Sources: [routes](../../frontend/src/App.tsx#L3533), [StaffHistory()](../../frontend/src/App.tsx#L2099), [OrderTable()](../../frontend/src/App.tsx#L2910), [staff endpoint](../../backend/api/orders.php#L100).
