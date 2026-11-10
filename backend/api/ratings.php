<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/api.php';
require_once __DIR__ . '/../helpers/auth.php';

try {
  $user = require_auth();
  $pdo = db();
  $action = $_GET['action'] ?? 'get';
  $orderId = (int) ($_GET['order_id'] ?? 0);

  if ($action === 'submit') {
    require_method('POST');
    if ($user['role'] !== 'customer') {
      json_response(false, 'Only customers can rate orders.', null, 403);
    }
    $data = input();
    $orderId = (int) ($data['order_id'] ?? 0);
    $rating = filter_var($data['rating'] ?? null, FILTER_VALIDATE_INT);
    $review = trim((string) ($data['review'] ?? ''));
    if ($rating === false || $rating < 1 || $rating > 5) {
      json_response(false, 'Choose a rating from 1 to 5 stars.', null, 422);
    }
    if (mb_strlen($review) > 1000) {
      json_response(false, 'Review must be 1000 characters or fewer.', null, 422);
    }
    $order = $pdo->prepare("SELECT id FROM orders WHERE id=? AND user_id=? AND status='Delivered'");
    $order->execute([$orderId, $user['id']]);
    if (!$order->fetch()) {
      json_response(false, 'Only your delivered orders can be rated.', null, 403);
    }
    $existing = $pdo->prepare('SELECT id FROM order_ratings WHERE order_id=?');
    $existing->execute([$orderId]);
    if ($existing->fetch()) {
      json_response(false, 'This order has already been rated.', null, 409);
    }
    try {
      $save = $pdo->prepare(
        'INSERT INTO order_ratings (order_id,user_id,rating,review) VALUES (?,?,?,?)',
      );
      $save->execute([$orderId, $user['id'], $rating, $review === '' ? null : $review]);
    } catch (PDOException $e) {
      if ((int) $e->errorInfo[1] === 1062) {
        json_response(false, 'This order has already been rated.', null, 409);
      }
      throw $e;
    }
    json_response(true, 'Rating submitted.', [
      'order_id' => $orderId,
      'rating' => $rating,
      'review' => $review,
    ]);
  }

  if ($user['role'] !== 'customer' && $user['role'] !== 'admin') {
    json_response(false, 'You are not authorized.', null, 403);
  }
  if ($user['role'] === 'customer') {
    $check = $pdo->prepare(
      'SELECT r.id,r.order_id,r.rating,r.review,r.created_at FROM order_ratings r JOIN orders o ON o.id=r.order_id WHERE r.order_id=? AND o.user_id=?',
    );
    $check->execute([$orderId, $user['id']]);
  } else {
    $check = $pdo->prepare(
      'SELECT id,order_id,rating,review,created_at FROM order_ratings WHERE order_id=?',
    );
    $check->execute([$orderId]);
  }
  json_response(true, 'Rating', $check->fetch() ?: null);
} catch (Throwable $e) {
  json_response(false, 'Unable to process rating.', null, 500);
}
