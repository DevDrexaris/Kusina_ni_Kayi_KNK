<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/api.php';
require_once __DIR__ . '/../helpers/auth.php';

try {
  require_auth('admin');
  $pdo = db();
  if (($_GET['action'] ?? 'list') === 'delete') {
    require_method('POST');
    $data = input();
    $s = $pdo->prepare(
      'UPDATE admin_notifications SET deleted_at=CURRENT_TIMESTAMP WHERE id=? AND deleted_at IS NULL',
    );
    $s->execute([(int) ($data['id'] ?? 0)]);
    if (!$s->rowCount()) {
      json_response(false, 'Notification was already deleted.', null, 404);
    }
    json_response(true, 'Notification deleted.');
  }
  $s = $pdo->query("SELECT n.id,o.order_number,o.customer_name,o.cancellation_reason,o.updated_at,n.created_at
    FROM admin_notifications n JOIN orders o ON o.id=n.order_id
    WHERE n.type='order_cancelled' AND n.deleted_at IS NULL
    ORDER BY n.created_at DESC LIMIT 50");
  json_response(true, 'Notifications', $s->fetchAll());
} catch (Throwable $e) {
  json_response(false, 'Unable to load notifications.', null, 500);
}
