USE knk_food_delivery;
ALTER TABLE users MODIFY role ENUM('customer','admin','staff','rider') NOT NULL DEFAULT 'customer';
ALTER TABLE users ADD COLUMN account_status ENUM('active','banned','deactivated','deleted') NOT NULL DEFAULT 'active' AFTER role;
ALTER TABLE users ADD COLUMN availability TINYINT(1) NOT NULL DEFAULT 1 AFTER account_status;
ALTER TABLE orders
  MODIFY status ENUM('Pending','Confirmed','Preparing','Accepted','Picked Up','Out for Delivery','Delivered','Cancelled') NOT NULL DEFAULT 'Pending',
  ADD COLUMN rider_id INT UNSIGNED NULL AFTER status,
  ADD COLUMN assigned_at TIMESTAMP NULL AFTER rider_id,
  ADD INDEX idx_orders_rider (rider_id),
  ADD CONSTRAINT fk_order_rider FOREIGN KEY (rider_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN cancellation_reason VARCHAR(255) NULL AFTER status;
ALTER TABLE orders ADD COLUMN delivered_by_rider_id INT UNSIGNED NULL AFTER assigned_at;
ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP NULL AFTER delivered_by_rider_id;
ALTER TABLE orders ADD INDEX idx_orders_delivered_by (delivered_by_rider_id);
ALTER TABLE orders ADD CONSTRAINT fk_order_delivered_by FOREIGN KEY (delivered_by_rider_id) REFERENCES users(id) ON DELETE SET NULL;
CREATE TABLE IF NOT EXISTS delivery_assignments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  rider_id INT UNSIGNED NOT NULL,
  assigned_by_user_id INT UNSIGNED NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  KEY idx_delivery_assignments_order (order_id, assigned_at),
  KEY idx_delivery_assignments_rider (rider_id, assigned_at),
  CONSTRAINT fk_delivery_assignment_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_delivery_assignment_rider FOREIGN KEY (rider_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_delivery_assignment_by FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS order_ratings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL UNIQUE,
  user_id INT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  review VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rating_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_rating_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_rating_value CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS admin_notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(40) NOT NULL DEFAULT 'order_cancelled',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uq_admin_notification_event (order_id,type),
  KEY idx_admin_notifications_active (deleted_at,created_at),
  CONSTRAINT fk_admin_notification_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS customer_addresses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  label ENUM('Home','Work','Other') NOT NULL DEFAULT 'Home',
  recipient_name VARCHAR(120) NOT NULL,
  contact_number VARCHAR(40) NOT NULL,
  delivery_address VARCHAR(500) NOT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_customer_addresses_user (user_id),
  CONSTRAINT fk_customer_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
