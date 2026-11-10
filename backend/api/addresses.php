<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/api.php';
require_once __DIR__ . '/../helpers/auth.php';

$action = $_GET['action'] ?? 'list';

try {
  $user = require_auth();
  $pdo = db();
  $requestedUserId = (int) ($_GET['user_id'] ?? 0);
  $ownerId = $user['id'];
  if ($requestedUserId && $requestedUserId !== $ownerId) {
    if (!in_array($user['role'], ['admin', 'staff'], true)) {
      json_response(false, 'You are not authorized to view these addresses.', null, 403);
    }
    $ownerId = $requestedUserId;
  }

  if ($action === 'list') {
    $s = $pdo->prepare(
      'SELECT id,user_id,label,recipient_name,contact_number,delivery_address,is_default,created_at,updated_at FROM customer_addresses WHERE user_id=? ORDER BY is_default DESC, created_at ASC',
    );
    $s->execute([$ownerId]);
    json_response(true, 'Saved addresses', $s->fetchAll());
  }

  if ($action === 'save') {
    require_method('POST');
    if ($ownerId !== $user['id']) {
      json_response(false, 'Only the customer can edit saved addresses.', null, 403);
    }
    $d = input();
    $id = (int) ($d['id'] ?? 0);
    $label = trim($d['label'] ?? '');
    $recipient = trim($d['recipient_name'] ?? '');
    $contact = trim($d['contact_number'] ?? '');
    $address = trim($d['delivery_address'] ?? '');
    $isDefault = !empty($d['is_default']) ? 1 : 0;
    if (
      !in_array($label, ['Home', 'Work', 'Other'], true) ||
      strlen($recipient) < 2 ||
      strlen($contact) < 7 ||
      strlen($address) < 8
    ) {
      json_response(
        false,
        'Enter a valid label, recipient, contact number, and complete address.',
        null,
        422,
      );
    }
    $s = $pdo->prepare('SELECT COUNT(*) FROM customer_addresses WHERE user_id=? AND id<>?');
    $s->execute([$user['id'], $id]);
    if (!$id && (int) $s->fetchColumn() >= 3) {
      json_response(false, 'You can save up to 3 delivery addresses.', null, 409);
    }
    $pdo->beginTransaction();
    if ($isDefault) {
      $pdo
        ->prepare('UPDATE customer_addresses SET is_default=0 WHERE user_id=?')
        ->execute([$user['id']]);
    }
    if ($id) {
      $s = $pdo->prepare(
        'UPDATE customer_addresses SET label=?,recipient_name=?,contact_number=?,delivery_address=?,is_default=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?',
      );
      $s->execute([$label, $recipient, $contact, $address, $isDefault, $id, $user['id']]);
      if (!$s->rowCount()) {
        $pdo->rollBack();
        json_response(false, 'Saved address not found.', null, 404);
      }
    } else {
      $s = $pdo->prepare(
        'INSERT INTO customer_addresses(user_id,label,recipient_name,contact_number,delivery_address,is_default) VALUES(?,?,?,?,?,?)',
      );
      $s->execute([$user['id'], $label, $recipient, $contact, $address, $isDefault]);
      $id = (int) $pdo->lastInsertId();
    }
    if (!$isDefault) {
      $s = $pdo->prepare(
        'SELECT COUNT(*) FROM customer_addresses WHERE user_id=? AND is_default=1',
      );
      $s->execute([$user['id']]);
      if (!(int) $s->fetchColumn()) {
        $pdo
          ->prepare('UPDATE customer_addresses SET is_default=1 WHERE id=? AND user_id=?')
          ->execute([$id, $user['id']]);
      }
    }
    $pdo->commit();
    $s = $pdo->prepare(
      'SELECT id,user_id,label,recipient_name,contact_number,delivery_address,is_default,created_at,updated_at FROM customer_addresses WHERE id=? AND user_id=?',
    );
    $s->execute([$id, $user['id']]);
    json_response(true, 'Address saved.', $s->fetch());
  }

  if ($action === 'delete') {
    require_method('POST');
    $id = (int) (input()['id'] ?? 0);
    $s = $pdo->prepare('DELETE FROM customer_addresses WHERE id=? AND user_id=?');
    $s->execute([$id, $user['id']]);
    if (!$s->rowCount()) {
      json_response(false, 'Saved address not found.', null, 404);
    }
    $s = $pdo->prepare(
      'SELECT id FROM customer_addresses WHERE user_id=? ORDER BY is_default DESC, created_at ASC LIMIT 1',
    );
    $s->execute([$user['id']]);
    if ($next = $s->fetchColumn()) {
      $pdo
        ->prepare('UPDATE customer_addresses SET is_default=1 WHERE id=? AND user_id=?')
        ->execute([$next, $user['id']]);
    }
    json_response(true, 'Address deleted.');
  }

  json_response(false, 'Unknown address action.', null, 404);
} catch (PDOException $e) {
  json_response(false, 'Unable to save the address.', null, 500);
} catch (Throwable $e) {
  json_response(false, 'Unable to process the address request.', null, 500);
}
