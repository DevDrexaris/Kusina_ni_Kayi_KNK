<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/api.php';
require_once __DIR__ . '/../helpers/auth.php';
$action = $_GET['action'] ?? 'list';
try {
  if ($action === 'list') {
    $q = trim($_GET['q'] ?? '');
    $s = db()->prepare(
      'SELECT p.*,c.name category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.name LIKE ? ORDER BY p.created_at DESC',
    );
    $s->execute(["%$q%"]);
    json_response(true, 'Products', $s->fetchAll());
  }
  if ($action === 'detail') {
    $s = db()->prepare(
      'SELECT p.*,c.name category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.id=?',
    );
    $s->execute([(int) ($_GET['id'] ?? 0)]);
    $product = $s->fetch();
    if (!$product) {
      json_response(false, 'Product not found.', null, 404);
    }
    json_response(true, 'Product', $product);
  }
  $a = require_auth('admin');
  $d = input();
  if ($action === 'save') {
    require_method('POST');
    $id = (int) ($d['id'] ?? 0);
    $name = trim($d['name'] ?? '');
    $price = (float) ($d['price'] ?? 0);
    $cat = $d['category_id'] ?: null;
    if (!$name || $price < 0) {
      json_response(false, 'Name and valid price are required.', null, 422);
    }
    $imagePath = trim((string) ($d['image_path'] ?? ''));
    $imagePath = $imagePath === '' ? null : $imagePath;
    if ($id) {
      $s = db()->prepare(
        'UPDATE products SET name=?,description=?,price=?,category_id=?,image_path=?,is_available=? WHERE id=?',
      );
      $s->execute([
        $name,
        trim($d['description'] ?? ''),
        $price,
        $cat,
        $imagePath,
        (int) ($d['is_available'] ?? 1),
        $id,
      ]);
    } else {
      $s = db()->prepare(
        'INSERT INTO products(name,description,price,category_id,image_path,is_available) VALUES(?,?,?,?,?,?)',
      );
      $s->execute([
        $name,
        trim($d['description'] ?? ''),
        $price,
        $cat,
        $imagePath,
        (int) ($d['is_available'] ?? 1),
      ]);
    }
    json_response(true, 'Product saved.');
  }
  if ($action === 'delete') {
    db()
      ->prepare('DELETE FROM products WHERE id=?')
      ->execute([(int) ($d['id'] ?? 0)]);
    json_response(true, 'Product deleted.');
  }
  json_response(false, 'Unknown action', null, 400);
} catch (Throwable $e) {
  json_response(false, 'Unable to load products.', null, 500);
}
