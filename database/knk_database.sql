CREATE DATABASE IF NOT EXISTS knk_food_delivery CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE knk_food_delivery;
CREATE TABLE IF NOT EXISTS users (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(190) NOT NULL UNIQUE,
 phone VARCHAR(30) NOT NULL, password_hash VARCHAR(255) NOT NULL, role ENUM('customer','admin','staff','rider') NOT NULL DEFAULT 'customer',
 account_status ENUM('active','banned','deactivated','deleted') NOT NULL DEFAULT 'active',
 availability TINYINT(1) NOT NULL DEFAULT 1,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS customer_addresses (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id INT UNSIGNED NOT NULL,
 label ENUM('Home','Work','Other') NOT NULL, recipient_name VARCHAR(120) NOT NULL,
 contact_number VARCHAR(30) NOT NULL, delivery_address TEXT NOT NULL,
 is_default TINYINT(1) NOT NULL DEFAULT 0, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 INDEX idx_customer_addresses_user (user_id), CONSTRAINT fk_customer_addresses_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS categories (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(80) NOT NULL UNIQUE, description VARCHAR(255) NOT NULL DEFAULT '',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS products (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, category_id INT UNSIGNED NULL, name VARCHAR(120) NOT NULL,
 description TEXT NOT NULL, price DECIMAL(10,2) NOT NULL, image_path VARCHAR(255) NULL, is_available TINYINT(1) NOT NULL DEFAULT 1,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 INDEX (category_id), CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS orders (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, order_number VARCHAR(30) NOT NULL UNIQUE, user_id INT UNSIGNED NOT NULL,
 customer_name VARCHAR(120) NOT NULL, contact_number VARCHAR(30) NOT NULL, delivery_address TEXT NOT NULL,
 subtotal DECIMAL(10,2) NOT NULL, delivery_fee DECIMAL(10,2) NOT NULL, total_amount DECIMAL(10,2) NOT NULL,
 payment_method ENUM('COD') NOT NULL DEFAULT 'COD', status ENUM('Pending','Confirmed','Preparing','Accepted','Picked Up','Out for Delivery','Delivered','Cancelled') NOT NULL DEFAULT 'Pending', cancellation_reason VARCHAR(255) NULL,
 rider_id INT UNSIGNED NULL, assigned_at TIMESTAMP NULL,
 delivered_by_rider_id INT UNSIGNED NULL, delivered_at TIMESTAMP NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 INDEX(user_id), INDEX(status), INDEX(rider_id), CONSTRAINT fk_order_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT,
 CONSTRAINT fk_order_rider FOREIGN KEY(rider_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS delivery_assignments (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 order_id BIGINT UNSIGNED NOT NULL,
 rider_id INT UNSIGNED NOT NULL,
 assigned_by_user_id INT UNSIGNED NOT NULL,
 assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 ended_at TIMESTAMP NULL,
 INDEX idx_delivery_assignments_order (order_id, assigned_at),
 INDEX idx_delivery_assignments_rider (rider_id, assigned_at),
 CONSTRAINT fk_delivery_assignment_order FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
 CONSTRAINT fk_delivery_assignment_rider FOREIGN KEY(rider_id) REFERENCES users(id) ON DELETE RESTRICT,
 CONSTRAINT fk_delivery_assignment_by FOREIGN KEY(assigned_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS order_items (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, order_id BIGINT UNSIGNED NOT NULL, product_id INT UNSIGNED NULL,
 product_name VARCHAR(120) NOT NULL, unit_price DECIMAL(10,2) NOT NULL, quantity INT UNSIGNED NOT NULL, line_total DECIMAL(10,2) NOT NULL,
 CONSTRAINT fk_item_order FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
 CONSTRAINT fk_item_product FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS order_ratings (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, order_id BIGINT UNSIGNED NOT NULL UNIQUE, user_id INT UNSIGNED NOT NULL,
 rating TINYINT UNSIGNED NOT NULL, review VARCHAR(1000) NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_rating_order FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
 CONSTRAINT fk_rating_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 CONSTRAINT chk_rating_value CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS admin_notifications (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, order_id BIGINT UNSIGNED NOT NULL, type VARCHAR(40) NOT NULL DEFAULT 'order_cancelled',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, deleted_at TIMESTAMP NULL DEFAULT NULL,
 UNIQUE KEY uq_admin_notification_event(order_id,type), KEY idx_admin_notifications_active(deleted_at,created_at),
 CONSTRAINT fk_admin_notification_order FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;
INSERT IGNORE INTO categories (id,name,description) VALUES
(1,'Meals','Comforting Filipino rice meals'),(2,'Snacks','Small bites to share'),(3,'Drinks','Refreshing house favorites'),(4,'Desserts','Sweet finishes');
INSERT IGNORE INTO products (category_id,name,description,price,image_path) VALUES
(1,'Chicken Adobo','Tender chicken simmered in a savory soy-vinegar sauce.',145,'/assets/foods/chicken-adobo.jpg'),(1,'Pork Sisig','Crispy pork tossed with onions and a bright calamansi finish.',165,'/assets/foods/pork-sisig.jpg'),
(1,'Beef Tapa','Sweet-savory marinated beef served with garlic rice.',175,'/assets/foods/beef-tapa.jpg'),(1,'Chicken Inasal','Char-grilled chicken with KnK atchara.',155,'/assets/foods/chicken-inasal.jpg'),
(2,'Pancit Canton','Stir-fried noodles with vegetables and chicken.',120,'/assets/foods/pancit-canton.jpg'),(2,'Lumpia','Golden vegetable spring rolls with sweet chili dip.',85,'/assets/foods/lumpia.jpg'),
(2,'Champorado','Creamy chocolate rice porridge topped with condensed milk and toasted coconut.',95,'/assets/foods/champorado.jpg'),
(3,'Iced Tea','House-brewed lemon iced tea.',55,'/assets/foods/iced-tea.jpg'),(4,'Halo-Halo','A colorful Filipino shaved-ice dessert.',110,'/assets/foods/halo-halo.jpg');
