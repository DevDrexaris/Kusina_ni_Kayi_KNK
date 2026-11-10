<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/api.php';
require_once __DIR__ . '/../helpers/auth.php';
$action = $_GET['action'] ?? 'list';
try {
  if ($action === 'list') {
    json_response(
      true,
      'Categories',
      db()->query('SELECT * FROM categories ORDER BY name')->fetchAll(),
    );
  }
  require_auth('admin');
  $d = input();
  if ($action === 'save') {
    $id = (int) ($d['id'] ?? 0);
    if (!$d['name']) {
      json_response(false, 'Category name is required.', null, 422);
    }
    if ($id) {
      $s = db()->prepare('UPDATE categories SET name=?,description=? WHERE id=?');
      $s->execute([trim($d['name']), trim($d['description'] ?? ''), $id]);
    } else {
      $s = db()->prepare('INSERT INTO categories(name,description) VALUES(?,?)');
      $s->execute([trim($d['name']), trim($d['description'] ?? '')]);
    }
    json_response(true, 'Category saved.');
  }
  if ($action === 'delete') {
    $s = db()->prepare('SELECT COUNT(*) FROM products WHERE category_id=?');
    $s->execute([(int) $d['id']]);
    if ($s->fetchColumn()) {
      json_response(false, 'Move or remove products in this category first.', null, 409);
    }
    db()
      ->prepare('DELETE FROM categories WHERE id=?')
      ->execute([(int) $d['id']]);
    json_response(true, 'Category deleted.');
  }
} catch (Throwable $e) {
  json_response(false, 'Unable to load categories.', null, 500);
}
