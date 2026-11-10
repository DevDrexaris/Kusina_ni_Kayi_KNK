<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/api.php';
require_once __DIR__ . '/../helpers/auth.php';
$action = $_GET['action'] ?? 'me';
try {
  if ($action === 'register') {
    require_method('POST');
    $d = input();
    $name = trim($d['name'] ?? '');
    $email = strtolower(trim($d['email'] ?? ''));
    $phone = trim($d['phone'] ?? '');
    $password = $d['password'] ?? '';
    if (
      strlen($name) < 2 ||
      !filter_var($email, FILTER_VALIDATE_EMAIL) ||
      strlen($phone) < 7 ||
      strlen($password) < 6
    ) {
      json_response(false, 'Enter a valid name, email, phone, and password.', null, 422);
    }
    $s = db()->prepare('INSERT INTO users(name,email,phone,password_hash,role) VALUES(?,?,?,?,?)');
    $s->execute([$name, $email, $phone, password_hash($password, PASSWORD_DEFAULT), 'customer']);
    json_response(true, 'Account created.');
  }
  if ($action === 'login') {
    require_method('POST');
    $d = input();
    $s = db()->prepare(
      'SELECT id,name,email,phone,password_hash,role,account_status,availability FROM users WHERE email=?',
    );
    $s->execute([strtolower(trim($d['email'] ?? ''))]);
    $u = $s->fetch();
    if (!$u || !password_verify($d['password'] ?? '', $u['password_hash'])) {
      json_response(false, 'Invalid login credentials.', null, 401);
    }
    if ($u['account_status'] !== 'active') {
      json_response(
        false,
        $u['account_status'] === 'deactivated'
          ? 'This account is deactivated.'
          : 'This account is banned.',
        null,
        403,
      );
    }
    unset($u['password_hash']);
    session_regenerate_id(true);
    $_SESSION['user'] = $u;
    json_response(true, 'Welcome back.', $u);
  }
  if ($action === 'create_user') {
    require_method('POST');
    require_auth('admin');
    $d = input();
    $role = $d['role'] ?? '';
    $name = trim($d['name'] ?? '');
    $email = strtolower(trim($d['email'] ?? ''));
    $phone = trim($d['phone'] ?? '');
    $password = $d['password'] ?? '';
    if (
      !in_array($role, ['staff', 'rider'], true) ||
      strlen($name) < 2 ||
      !filter_var($email, FILTER_VALIDATE_EMAIL) ||
      strlen($phone) < 7 ||
      strlen($password) < 6
    ) {
      json_response(false, 'Enter valid details and choose Staff or Rider.', null, 422);
    }
    $pdo = db();
    $check = $pdo->prepare('SELECT id FROM users WHERE email=?');
    $check->execute([$email]);
    if ($check->fetch()) {
      json_response(
        false,
        'That email is already registered. Use a different email address.',
        null,
        409,
      );
    }
    $s = $pdo->prepare(
      "INSERT INTO users(name,email,phone,password_hash,role,account_status) VALUES(?,?,?,?,?,'active')",
    );
    $s->execute([$name, $email, $phone, password_hash($password, PASSWORD_DEFAULT), $role]);
    $id = (int) $pdo->lastInsertId();
    json_response(true, ucfirst($role) . ' account created.', [
      'id' => $id,
      'name' => $name,
      'email' => $email,
      'phone' => $phone,
      'role' => $role,
      'account_status' => 'active',
    ]);
  }
  if ($action === 'riders') {
    $viewer = require_auth();
    if (!in_array($viewer['role'], ['admin', 'staff'], true)) {
      json_response(false, 'Only Admin or Staff can view available riders.', null, 403);
    }
    $s = db()->query(
      "SELECT id,name,email,phone,availability FROM users WHERE role='rider' AND account_status='active' AND availability=1 ORDER BY name",
    );
    json_response(true, 'Available riders', $s->fetchAll());
  }
  if ($action === 'rider_availability') {
    require_method('POST');
    $rider = require_auth('rider');
    $d = input();
    $available = (int) ($d['available'] ?? 0) === 1 ? 1 : 0;
    $s = db()->prepare("UPDATE users SET availability=? WHERE id=? AND role='rider'");
    $s->execute([$available, $rider['id']]);
    $rider['availability'] = $available;
    json_response(
      true,
      $available
        ? 'You are now available for deliveries.'
        : 'You are now unavailable for deliveries.',
      $rider,
    );
  }
  if ($action === 'admin_users') {
    require_auth('admin');
    $role = $_GET['role'] ?? '';
    $where = in_array($role, ['customer', 'staff', 'rider'], true)
      ? 'WHERE u.role=?'
      : 'WHERE u.role IN ("customer","staff","rider")';
    $sql = "SELECT u.id,u.name,u.email,u.phone,u.role,u.account_status,u.created_at,COALESCE((SELECT COUNT(*) FROM orders o WHERE o.user_id=u.id),0) order_count,COALESCE((SELECT COUNT(*) FROM customer_addresses a WHERE a.user_id=u.id),0) address_count,(SELECT GROUP_CONCAT(CONCAT(a.label,': ',a.recipient_name,' — ',a.delivery_address) SEPARATOR ' | ') FROM customer_addresses a WHERE a.user_id=u.id) address_summary FROM users u $where ORDER BY u.role,u.name";
    $s = db()->prepare($sql);
    $s->execute($where === 'WHERE u.role=?' ? [$role] : []);
    json_response(true, 'Users', $s->fetchAll());
  }
  if ($action === 'moderate_user') {
    require_method('POST');
    $admin = require_auth('admin');
    $d = input();
    $id = (int) ($d['id'] ?? 0);
    $actionName = $d['moderation'] ?? '';
    $s = db()->prepare('SELECT role FROM users WHERE id=?');
    $s->execute([$id]);
    $target = $s->fetch();
    if (!$target || $id === $admin['id']) {
      json_response(false, 'User cannot be moderated.', null, 422);
    }
    $status = null;
    if ($actionName === 'ban' && in_array($target['role'], ['customer', 'staff'], true)) {
      $status = 'banned';
    }
    if ($actionName === 'deactivate' && $target['role'] === 'rider') {
      $status = 'deactivated';
    }
    if ($actionName === 'delete' && $target['role'] === 'rider') {
      $s = db()->prepare(
        "UPDATE users SET account_status='deleted',email=CONCAT('deleted+',id,'@knk.local') WHERE id=?",
      );
      $s->execute([$id]);
      json_response(true, 'Rider account deleted.');
    }
    if (!$status) {
      json_response(false, 'Invalid moderation action.', null, 422);
    }
    $s = db()->prepare('UPDATE users SET account_status=? WHERE id=?');
    $s->execute([$status, $id]);
    json_response(true, $status === 'banned' ? 'User banned.' : 'Rider deactivated.');
  }
  if ($action === 'logout') {
    session_destroy();
    json_response(true, 'Logged out.');
  }
  $u = current_user();
  if ($u) {
    $u = require_auth();
  }
  json_response(true, 'Current user', $u);
} catch (PDOException $e) {
  json_response(
    false,
    $e->getCode() === '23000'
      ? 'That email is already registered. Use a different email address.'
      : 'Unable to save the account.',
    null,
    409,
  );
} catch (Throwable $e) {
  json_response(false, 'Unable to complete authentication.', null, 500);
}
