<?php require_once __DIR__ . '/../config/database.php';
$email = 'admin@knk.local';
$s = db()->prepare('SELECT id FROM users WHERE email=?');
$s->execute([$email]);
if ($s->fetch()) {
  echo "Admin already exists.\n";
  exit();
}
$s = db()->prepare('INSERT INTO users(name,email,phone,password_hash,role) VALUES(?,?,?,?,?)');
$s->execute([
  'KnK Administrator',
  $email,
  '09170000000',
  password_hash('Admin123!', PASSWORD_DEFAULT),
  'admin',
]);
echo "Admin created: $email / Admin123!\n";
