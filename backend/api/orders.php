<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/api.php';
require_once __DIR__ . '/../helpers/auth.php';
$action = $_GET['action'] ?? 'mine';
$pdo = null;
try {
  $u = require_auth();
  $pdo = db();
  if ($action === 'create') {
    require_method('POST');
    $d = input();
    $items = $d['items'] ?? [];
    if (!$items || !trim($d['customer_name'] ?? '') || !trim($d['delivery_address'] ?? '')) {
      json_response(false, 'Complete the delivery information and cart.', null, 422);
    }
    $ids = array_values(array_unique(array_map('intval', array_column($items, 'product_id'))));
    $marks = implode(',', array_fill(0, count($ids), '?'));
    $s = $pdo->prepare("SELECT id,name,price,is_available FROM products WHERE id IN ($marks)");
    $s->execute($ids);
    $products = [];
    foreach ($s as $p) {
      $products[$p['id']] = $p;
    }
    $subtotal = 0;
    $lines = [];
    foreach ($items as $i) {
      $id = (int) ($i['product_id'] ?? 0);
      $qty = (int) ($i['quantity'] ?? 0);
      if ($qty < 1 || $qty > 99 || !isset($products[$id]) || !$products[$id]['is_available']) {
        json_response(false, 'One or more cart items are unavailable.', null, 422);
      }
      $p = $products[$id];
      $line = $p['price'] * $qty;
      $subtotal += $line;
      $lines[] = [$p['id'], $p['name'], $p['price'], $qty, $line];
    }
    $fee = 50;
    $pdo->beginTransaction();
    $number = 'KNK-' . date('ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
    $s = $pdo->prepare(
      'INSERT INTO orders(order_number,user_id,customer_name,contact_number,delivery_address,subtotal,delivery_fee,total_amount) VALUES(?,?,?,?,?,?,?,?)',
    );
    $s->execute([
      $number,
      $u['id'],
      trim($d['customer_name']),
      trim($d['contact_number'] ?? $u['phone']),
      trim($d['delivery_address']),
      $subtotal,
      $fee,
      $subtotal + $fee,
    ]);
    $oid = $pdo->lastInsertId();
    $s = $pdo->prepare(
      'INSERT INTO order_items(order_id,product_id,product_name,unit_price,quantity,line_total) VALUES(?,?,?,?,?,?)',
    );
    foreach ($lines as $l) {
      $s->execute([$oid, ...$l]);
    }
    $s = $pdo->prepare("INSERT INTO admin_notifications(order_id,type) VALUES(?, 'order_created')");
    $s->execute([$oid]);
    $pdo->commit();
    json_response(true, 'Order placed successfully.', ['order_number' => $number]);
  }
  if ($action === 'mine') {
    $s = $pdo->prepare(
      'SELECT o.*,GROUP_CONCAT(CONCAT(oi.product_name," x",oi.quantity) SEPARATOR ", ") items,r.id rating_id,CASE WHEN r.id IS NULL THEN 0 ELSE 1 END is_rated,r.rating,r.review,r.created_at rating_created_at,cr.name rider_name,cr.phone rider_phone,dr.name delivered_by_name FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id LEFT JOIN order_ratings r ON r.order_id=o.id LEFT JOIN users cr ON cr.id=o.rider_id LEFT JOIN users dr ON dr.id=o.delivered_by_rider_id WHERE o.user_id=? GROUP BY o.id ORDER BY o.created_at DESC',
    );
    $s->execute([$u['id']]);
    json_response(true, 'Orders', $s->fetchAll());
  }
  if ($action === 'staff_dashboard') {
    require_auth('staff');
    $s = $pdo->query(
      "SELECT status,COUNT(*) total FROM orders WHERE status IN ('Pending','Preparing','Out for Delivery') GROUP BY status",
    );
    $counts = ['Pending' => 0, 'Preparing' => 0, 'Out for Delivery' => 0];
    foreach ($s as $row) {
      $counts[$row['status']] = (int) $row['total'];
    }
    $s = $pdo->query(
      "SELECT COUNT(*) FROM orders WHERE status='Delivered' AND DATE(updated_at)=CURRENT_DATE",
    );
    $counts['Completed Today'] = (int) $s->fetchColumn();
    $s = $pdo->query(
      "SELECT o.*,GROUP_CONCAT(CONCAT(oi.product_name,' x',oi.quantity) SEPARATOR ', ') items,r.name rider_name,r.phone rider_phone,r.availability rider_availability,dr.name delivered_by_name,ratings.id rating_id,CASE WHEN ratings.id IS NULL THEN 0 ELSE 1 END is_rated,ratings.rating,ratings.review,ratings.created_at rating_created_at FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id LEFT JOIN users r ON r.id=o.rider_id LEFT JOIN users dr ON dr.id=o.delivered_by_rider_id LEFT JOIN order_ratings ratings ON ratings.order_id=o.id WHERE o.status NOT IN ('Delivered','Cancelled') GROUP BY o.id ORDER BY o.created_at DESC LIMIT 8",
    );
    $available = (int) $pdo
      ->query(
        "SELECT COUNT(*) FROM users WHERE role='rider' AND account_status='active' AND availability=1",
      )
      ->fetchColumn();
    json_response(true, 'Staff dashboard', [
      'counts' => $counts,
      'recent' => $s->fetchAll(),
      'available_riders' => $available,
    ]);
  }
  if ($action === 'staff_history') {
    require_auth('staff');
    $status = trim($_GET['status'] ?? '');
    $q = trim($_GET['q'] ?? '');
    $where = ["o.status IN ('Delivered','Cancelled')"];
    $params = [];
    if (in_array($status, ['Delivered', 'Cancelled'], true)) {
      $where[] = 'o.status=?';
      $params[] = $status;
    }
    if ($q !== '') {
      $where[] = '(o.order_number LIKE ? OR o.customer_name LIKE ?)';
      $params[] = "%$q%";
      $params[] = "%$q%";
    }
    $s = $pdo->prepare(
      'SELECT o.*,GROUP_CONCAT(CONCAT(oi.product_name," x",oi.quantity) SEPARATOR ", ") items,r.name rider_name,r.phone rider_phone,r.availability rider_availability,dr.name delivered_by_name,ratings.id rating_id,CASE WHEN ratings.id IS NULL THEN 0 ELSE 1 END is_rated,ratings.rating,ratings.review,ratings.created_at rating_created_at FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id LEFT JOIN users r ON r.id=o.rider_id LEFT JOIN users dr ON dr.id=o.delivered_by_rider_id LEFT JOIN order_ratings ratings ON ratings.order_id=o.id WHERE ' .
        implode(' AND ', $where) .
        ' GROUP BY o.id ORDER BY o.updated_at DESC',
    );
    $s->execute($params);
    json_response(true, 'Staff order history', $s->fetchAll());
  }
  if ($action === 'staff_customers') {
    require_auth('staff');
    $s = $pdo->query(
      'SELECT o.user_id,u.name,u.email,u.phone,MAX(o.customer_name) customer_name,MAX(o.contact_number) contact_number,COUNT(*) order_count,MAX(o.created_at) last_order,(SELECT COUNT(*) FROM customer_addresses a WHERE a.user_id=o.user_id) address_count FROM orders o JOIN users u ON u.id=o.user_id GROUP BY o.user_id,u.name,u.email,u.phone ORDER BY last_order DESC',
    );
    json_response(true, 'Staff customers', $s->fetchAll());
  }
  if ($action === 'customer_details') {
    $viewer = require_auth();
    if (!in_array($viewer['role'], ['admin', 'staff'], true)) {
      json_response(false, 'Only Admin or Staff can view customer details.', null, 403);
    }
    $id = (int) ($_GET['user_id'] ?? 0);
    $s = $pdo->prepare(
      "SELECT id,name,email,phone,role,account_status FROM users WHERE id=? AND role='customer'",
    );
    $s->execute([$id]);
    $customer = $s->fetch();
    if (!$customer) {
      json_response(false, 'Customer not found.', null, 404);
    }
    $s = $pdo->prepare(
      'SELECT id,label,recipient_name,contact_number,delivery_address,is_default FROM customer_addresses WHERE user_id=? ORDER BY is_default DESC,id DESC',
    );
    $s->execute([$id]);
    $addresses = $s->fetchAll();
    $s = $pdo->prepare(
      'SELECT o.id,o.order_number,o.created_at,o.status,o.total_amount,o.payment_method,o.customer_name,o.contact_number,o.delivery_address,GROUP_CONCAT(CONCAT(oi.product_name," x",oi.quantity) SEPARATOR ", ") items,r.name rider_name,r.phone rider_phone,dr.name delivered_by_name FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id LEFT JOIN users r ON r.id=o.rider_id LEFT JOIN users dr ON dr.id=o.delivered_by_rider_id WHERE o.user_id=? GROUP BY o.id ORDER BY o.created_at DESC',
    );
    $s->execute([$id]);
    json_response(true, 'Customer details', [
      'customer' => $customer,
      'addresses' => $addresses,
      'orders' => $s->fetchAll(),
    ]);
  }
  if ($action === 'staff_notifications') {
    require_auth('staff');
    $s = $pdo->query(
      "SELECT n.id,n.type,n.created_at,o.id order_id,o.order_number,o.customer_name,o.cancellation_reason,o.status,o.total_amount FROM admin_notifications n JOIN orders o ON o.id=n.order_id WHERE n.deleted_at IS NULL AND n.type IN ('order_created','order_cancelled') ORDER BY n.created_at DESC LIMIT 50",
    );
    json_response(true, 'Staff notifications', $s->fetchAll());
  }
  if ($action === 'active') {
    $viewer = require_auth();
    if (!in_array($viewer['role'], ['admin', 'staff'], true)) {
      json_response(false, 'Only Admin or Staff can view active orders.', null, 403);
    }
    $s = $pdo->query(
      "SELECT o.*,r.name rider_name,r.phone rider_phone,r.availability rider_availability,GROUP_CONCAT(CONCAT(oi.product_name,' x',oi.quantity) SEPARATOR ', ') items,dr.name delivered_by_name,ratings.id rating_id,CASE WHEN ratings.id IS NULL THEN 0 ELSE 1 END is_rated,ratings.rating,ratings.review,ratings.created_at rating_created_at FROM orders o LEFT JOIN users r ON r.id=o.rider_id LEFT JOIN users dr ON dr.id=o.delivered_by_rider_id LEFT JOIN order_items oi ON oi.order_id=o.id LEFT JOIN order_ratings ratings ON ratings.order_id=o.id WHERE o.status NOT IN ('Delivered','Cancelled') GROUP BY o.id ORDER BY o.created_at DESC",
    );
    json_response(true, 'Active orders', $s->fetchAll());
  }
  if ($action === 'unassign') {
    require_method('POST');
    $viewer = require_auth();
    if (!in_array($viewer['role'], ['admin', 'staff'], true)) {
      json_response(false, 'Only Admin or Staff can unassign riders.', null, 403);
    }
    $d = input();
    $orderId = (int) ($d['id'] ?? 0);
    $pdo->beginTransaction();
    $s = $pdo->prepare('SELECT rider_id,status FROM orders WHERE id=? FOR UPDATE');
    $s->execute([$orderId]);
    $order = $s->fetch();
    if (!$order || in_array($order['status'], ['Delivered', 'Cancelled'], true)) {
      $pdo->rollBack();
      json_response(false, 'Order cannot be unassigned.', null, 409);
    }
    if (!$order['rider_id']) {
      $pdo->rollBack();
      json_response(false, 'This order has no assigned rider.', null, 409);
    }
    $s = $pdo->prepare(
      'UPDATE delivery_assignments SET ended_at=CURRENT_TIMESTAMP WHERE order_id=? AND rider_id=? AND ended_at IS NULL',
    );
    $s->execute([$orderId, $order['rider_id']]);
    $s = $pdo->prepare('UPDATE orders SET rider_id=NULL,assigned_at=NULL WHERE id=?');
    $s->execute([$orderId]);
    $pdo->commit();
    json_response(true, 'Rider unassigned.');
  }
  if ($action === 'assign') {
    require_method('POST');
    $viewer = require_auth();
    if (!in_array($viewer['role'], ['admin', 'staff'], true)) {
      json_response(false, 'Only Admin or Staff can assign riders.', null, 403);
    }
    $d = input();
    $orderId = (int) ($d['id'] ?? 0);
    $rider = (int) ($d['rider_id'] ?? 0);
    $check = $pdo->prepare(
      "SELECT id FROM users WHERE id=? AND role='rider' AND account_status='active' AND availability=1",
    );
    $check->execute([$rider]);
    if (!$check->fetch()) {
      json_response(false, 'This rider is unavailable. Select an available rider.', null, 422);
    }
    $pdo->beginTransaction();
    $s = $pdo->prepare('SELECT rider_id,status FROM orders WHERE id=? FOR UPDATE');
    $s->execute([$orderId]);
    $order = $s->fetch();
    if (!$order || in_array($order['status'], ['Delivered', 'Cancelled'], true)) {
      $pdo->rollBack();
      json_response(false, 'Order cannot be assigned.', null, 409);
    }
    if ((int) $order['rider_id'] === $rider) {
      $pdo->rollBack();
      json_response(false, 'This rider is already assigned to this order.', null, 409);
    }
    $s = $pdo->prepare(
      'UPDATE delivery_assignments SET ended_at=CURRENT_TIMESTAMP WHERE order_id=? AND ended_at IS NULL',
    );
    $s->execute([$orderId]);
    $s = $pdo->prepare(
      "UPDATE orders SET rider_id=?,assigned_at=CURRENT_TIMESTAMP,status=IF(status='Pending','Confirmed',status) WHERE id=?",
    );
    $s->execute([$rider, $orderId]);
    $s = $pdo->prepare(
      'INSERT INTO delivery_assignments(order_id,rider_id,assigned_by_user_id) VALUES(?,?,?)',
    );
    $s->execute([$orderId, $rider, $viewer['id']]);
    $pdo->commit();
    json_response(true, 'Delivery assigned.');
  }
  if ($action === 'rider') {
    $rider = require_auth('rider');
    $s = $pdo->prepare(
      "SELECT o.*,GROUP_CONCAT(CONCAT(oi.product_name,' x',oi.quantity) SEPARATOR ', ') items FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id WHERE o.rider_id=? GROUP BY o.id ORDER BY o.created_at DESC",
    );
    $s->execute([$rider['id']]);
    json_response(true, 'Assigned orders', $s->fetchAll());
  }
  if ($action === 'rider_status') {
    require_method('POST');
    $rider = require_auth('rider');
    $d = input();
    $status = $d['status'] ?? '';
    if (!in_array($status, ['Out for Delivery', 'Delivered'], true)) {
      json_response(
        false,
        'Riders may update deliveries only to Out for Delivery or Delivered.',
        null,
        422,
      );
    }
    $orderId = (int) ($d['id'] ?? 0);
    $s = $pdo->prepare('SELECT status FROM orders WHERE id=? AND rider_id=?');
    $s->execute([$orderId, $rider['id']]);
    $current = $s->fetchColumn();
    if (!$current || in_array($current, ['Delivered', 'Cancelled'], true)) {
      json_response(false, 'This delivery is no longer active.', null, 409);
    }
    if ($status === 'Out for Delivery' && $current === 'Out for Delivery') {
      json_response(false, 'This delivery is already out for delivery.', null, 409);
    }
    $pdo->beginTransaction();
    if ($status === 'Delivered') {
      $s = $pdo->prepare(
        'UPDATE orders SET status=?,delivered_by_rider_id=?,delivered_at=CURRENT_TIMESTAMP WHERE id=? AND rider_id=?',
      );
      $s->execute([$status, $rider['id'], $orderId, $rider['id']]);
    } else {
      $s = $pdo->prepare('UPDATE orders SET status=? WHERE id=? AND rider_id=?');
      $s->execute([$status, $orderId, $rider['id']]);
    }
    $pdo->commit();
    json_response(true, 'Delivery status updated.');
  }
  if ($action === 'staff_status') {
    require_method('POST');
    $viewer = require_auth();
    if (!in_array($viewer['role'], ['admin', 'staff'], true)) {
      json_response(false, 'Only Admin or Staff can update order statuses.', null, 403);
    }
    $d = input();
    $status = $d['status'] ?? '';
    $id = (int) ($d['id'] ?? 0);
    $reason = trim($d['reason'] ?? '');
    $allowed = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!in_array($status, $allowed, true)) {
      json_response(false, 'Invalid status.', null, 422);
    }
    if ($status === 'Delivered') {
      json_response(false, 'Only the assigned rider can mark a delivery as Delivered.', null, 403);
    }
    if ($status === 'Cancelled' && $reason === '') {
      json_response(false, 'A cancellation reason is required.', null, 422);
    }
    $pdo->beginTransaction();
    $check = $pdo->prepare(
      'SELECT o.id,o.status,o.rider_id,o.delivered_at,o.delivered_by_rider_id,r.availability FROM orders o LEFT JOIN users r ON r.id=o.rider_id WHERE o.id=? FOR UPDATE',
    );
    $check->execute([$id]);
    $order = $check->fetch();
    if (!$order) {
      $pdo->rollBack();
      json_response(false, 'Order not found.', null, 404);
    }
    if ($order['status'] === 'Cancelled') {
      $pdo->rollBack();
      json_response(false, 'A cancelled order cannot be changed.', null, 409);
    }
    if (
      $order['status'] === 'Delivered' ||
      $order['delivered_at'] !== null ||
      $order['delivered_by_rider_id'] !== null
    ) {
      $pdo->rollBack();
      json_response(false, 'A delivered order cannot be changed.', null, 409);
    }
    if ($status === 'Out for Delivery' && (!$order['rider_id'] || !(int) $order['availability'])) {
      $pdo->rollBack();
      json_response(
        false,
        'No available rider is assigned. Assign an available rider before dispatching this order.',
        null,
        422,
      );
    }
    if ($status === 'Cancelled') {
      $s = $pdo->prepare('UPDATE orders SET status=?,cancellation_reason=? WHERE id=?');
      $s->execute([$status, $reason, $id]);
      $n = $pdo->prepare(
        "INSERT IGNORE INTO admin_notifications(order_id,type) VALUES(?, 'order_cancelled')",
      );
      $n->execute([$id]);
    } else {
      $s = $pdo->prepare('UPDATE orders SET status=? WHERE id=?');
      $s->execute([$status, $id]);
    }
    $pdo->commit();
    json_response(true, 'Order status updated.');
  }
  if ($action === 'cancel') {
    require_method('POST');
    $u = require_auth('customer');
    $d = input();
    $reason = trim($d['reason'] ?? '');
    if ($reason === '') {
      json_response(false, 'A cancellation reason is required.', null, 422);
    }
    $orderId = (int) ($d['id'] ?? 0);
    $pdo->beginTransaction();
    $s = $pdo->prepare(
      "UPDATE orders SET status='Cancelled',cancellation_reason=? WHERE id=? AND user_id=? AND status NOT IN ('Preparing','Out for Delivery','Delivered','Cancelled')",
    );
    $s->execute([$reason, $orderId, $u['id']]);
    if (!$s->rowCount()) {
      $pdo->rollBack();
      json_response(false, 'This order can no longer be cancelled.', null, 409);
    }
    $n = $pdo->prepare(
      "INSERT IGNORE INTO admin_notifications(order_id,type) VALUES(?, 'order_cancelled')",
    );
    $n->execute([$orderId]);
    $pdo->commit();
    json_response(true, 'Order cancelled.');
  }
  if ($action === 'cancellation_alerts') {
    require_auth('admin');
    $s = $pdo->query(
      "SELECT id,order_number,customer_name,cancellation_reason,updated_at FROM orders WHERE status='Cancelled' AND cancellation_reason IS NOT NULL ORDER BY updated_at DESC LIMIT 50",
    );
    json_response(true, 'Cancellation alerts', $s->fetchAll());
  }
  require_auth('admin');
  if ($action === 'all') {
    $s = $pdo->query(
      'SELECT o.*,u.email,GROUP_CONCAT(CONCAT(oi.product_name," x",oi.quantity) SEPARATOR ", ") items,r.id rating_id,CASE WHEN r.id IS NULL THEN 0 ELSE 1 END is_rated,r.rating,r.review,r.created_at rating_created_at,cr.name rider_name,cr.phone rider_phone,cr.availability rider_availability,dr.name delivered_by_name FROM orders o JOIN users u ON u.id=o.user_id LEFT JOIN order_items oi ON oi.order_id=o.id LEFT JOIN order_ratings r ON r.order_id=o.id LEFT JOIN users cr ON cr.id=o.rider_id LEFT JOIN users dr ON dr.id=o.delivered_by_rider_id GROUP BY o.id ORDER BY o.created_at DESC',
    );
    json_response(true, 'Orders', $s->fetchAll());
  }
  if ($action === 'assignment_history') {
    $viewer = require_auth();
    if (!in_array($viewer['role'], ['admin', 'staff'], true)) {
      json_response(false, 'Only Admin or Staff can view assignment history.', null, 403);
    }
    $q = trim($_GET['q'] ?? '');
    $params = [];
    $where = '';
    if ($q !== '') {
      $where = 'WHERE o.order_number LIKE ? OR r.name LIKE ? OR a.name LIKE ?';
      $params = ["%$q%", "%$q%", "%$q%"];
    }
    $s = $pdo->prepare(
      "SELECT da.id,da.order_id,o.order_number,da.assigned_at,da.ended_at,r.name rider_name,r.phone rider_phone,a.name assigned_by_name FROM delivery_assignments da JOIN orders o ON o.id=da.order_id JOIN users r ON r.id=da.rider_id JOIN users a ON a.id=da.assigned_by_user_id $where ORDER BY da.assigned_at DESC",
    );
    $s->execute($params);
    json_response(true, 'Assignment history', $s->fetchAll());
  }
  if ($action === 'status') {
    $viewer = require_auth('admin');
    $d = input();
    $allowed = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
    $status = $d['status'] ?? '';
    $id = (int) ($d['id'] ?? 0);
    if (!in_array($status, $allowed, true)) {
      json_response(false, 'Invalid status.', null, 422);
    }
    if ($status === 'Delivered') {
      json_response(false, 'Only the assigned rider can mark a delivery as Delivered.', null, 403);
    }
    $pdo->beginTransaction();
    $check = $pdo->prepare(
      'SELECT o.id,o.status,o.rider_id,o.delivered_at,o.delivered_by_rider_id,r.availability FROM orders o LEFT JOIN users r ON r.id=o.rider_id WHERE o.id=? FOR UPDATE',
    );
    $check->execute([$id]);
    $order = $check->fetch();
    if (!$order) {
      $pdo->rollBack();
      json_response(false, 'Order not found.', null, 404);
    }
    if ($order['status'] === 'Cancelled') {
      $pdo->rollBack();
      json_response(false, 'A cancelled order cannot be changed.', null, 409);
    }
    if (
      $order['status'] === 'Delivered' ||
      $order['delivered_at'] !== null ||
      $order['delivered_by_rider_id'] !== null
    ) {
      $pdo->rollBack();
      json_response(false, 'A delivered order cannot be changed.', null, 409);
    }
    if ($status === 'Out for Delivery' && (!$order['rider_id'] || !(int) $order['availability'])) {
      $pdo->rollBack();
      json_response(
        false,
        'No available rider is assigned. Assign an available rider before dispatching this order.',
        null,
        422,
      );
    }
    $s = $pdo->prepare('UPDATE orders SET status=? WHERE id=?');
    $s->execute([$status, $id]);
    if ($status === 'Cancelled') {
      $n = $pdo->prepare(
        "INSERT IGNORE INTO admin_notifications(order_id,type) VALUES(?, 'order_cancelled')",
      );
      $n->execute([$id]);
    }
    $pdo->commit();
    json_response(true, 'Order status updated.');
  }
} catch (Throwable $e) {
  if ($pdo?->inTransaction()) {
    $pdo->rollBack();
  }
  json_response(false, 'Unable to process order.', null, 500);
}
