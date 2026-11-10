<?php require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/api.php';
require_once __DIR__ . '/../helpers/auth.php';
try {
  $u = require_auth('admin');
  $p = db();
  $stats = $p
    ->query(
      "SELECT (SELECT COUNT(*) FROM orders WHERE DATE(created_at)=CURDATE()) orders_today,(SELECT COUNT(*) FROM orders WHERE status='Pending') pending,(SELECT COUNT(*) FROM products WHERE is_available=1) products_available,(SELECT COALESCE(SUM(total_amount),0) FROM orders WHERE DATE(created_at)=CURDATE() AND status!='Cancelled') sales_today",
    )
    ->fetch();
  json_response(true, 'Dashboard', $stats);
} catch (Throwable $e) {
  json_response(false, 'Unable to load dashboard.', null, 500);
}
