<?php
function json_response(
  bool $success,
  string $message = '',
  mixed $data = null,
  int $status = 200,
): never {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
  exit();
}
function input(): array
{
  $body = json_decode(file_get_contents('php://input'), true);
  return is_array($body) ? $body : $_POST;
}
function require_method(string $method): void
{
  if ($_SERVER['REQUEST_METHOD'] !== $method) {
    json_response(false, 'Method not allowed', null, 405);
  }
}
