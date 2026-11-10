<?php
function db(): PDO
{
  static $pdo = null;
  if ($pdo) {
    return $pdo;
  }
  $host = getenv('KNK_DB_HOST') ?: 'localhost';
  $name = getenv('KNK_DB_NAME') ?: 'knk_food_delivery';
  $user = getenv('KNK_DB_USER') ?: 'root';
  $pass = getenv('KNK_DB_PASS') ?: '';
  $pdo = new PDO("mysql:host=$host;dbname=$name;charset=utf8mb4", $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  return $pdo;
}
