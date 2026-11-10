<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/api.php';
require_once __DIR__ . '/../helpers/auth.php';

try {
  $user = require_auth('customer');
  $pdo = db();
  $s = $pdo->prepare("SELECT id,order_number,status,updated_at
    FROM orders
    WHERE user_id=? AND status NOT IN ('Delivered','Cancelled')
    ORDER BY updated_at DESC");
  $s->execute([$user['id']]);
  json_response(true, 'User order notifications', $s->fetchAll());
} catch (Throwable $e) {
  json_response(false, 'Unable to load order notifications.', null, 500);
}
