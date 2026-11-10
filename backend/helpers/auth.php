<?php
if (session_status() === PHP_SESSION_NONE) {
  session_start(['cookie_httponly' => true, 'cookie_samesite' => 'Lax']);
}
function current_user(): ?array
{
  return $_SESSION['user'] ?? null;
}
function require_auth(?string $role = null): array
{
  $user = current_user();
  if (!$user) {
    json_response(false, 'Please log in.', null, 401);
  }
  $s = db()->prepare('SELECT id,name,email,phone,role,account_status FROM users WHERE id=?');
  $s->execute([$user['id']]);
  $fresh = $s->fetch();
  if (!$fresh || $fresh['account_status'] !== 'active') {
    session_destroy();
    $label = $fresh['account_status'] ?? 'banned';
    json_response(
      false,
      $label === 'deactivated' ? 'This account is deactivated.' : 'This account is banned.',
      null,
      403,
    );
  }
  $user = $fresh;
  $_SESSION['user'] = $user;
  if ($role && $user['role'] !== $role) {
    json_response(false, 'You are not authorized.', null, 403);
  }
  return $user;
}
