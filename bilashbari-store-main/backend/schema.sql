-- Bilashbari MySQL schema + seed data
-- Run:  mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS bilashbari CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bilashbari;

DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  slug VARCHAR(140) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category_id INT,
  price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url VARCHAR(500),
  stock INT NOT NULL DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status ENUM('Pending','Paid','Shipped','Delivered','Cancelled') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  user_id INT NOT NULL,
  method ENUM('COD','Bkash','Nagad','Rocket') NOT NULL,
  name VARCHAR(120) NOT NULL,
  address VARCHAR(400) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Seed categories
INSERT INTO categories (name, slug) VALUES
  ('Trees','trees'),
  ('Indoor Plants','indoor-plants'),
  ('Gardening Tools','gardening-tools'),
  ('Tubs & Pots','tubs-pots'),
  ('Seeds','seeds'),
  ('Fertilizers','fertilizers');

-- Seed admin user  (email: admin@bilashbari.com  password: admin123)
-- bcrypt hash of "admin123"
INSERT INTO users (name, email, password, role) VALUES
  ('Admin','admin@bilashbari.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','admin');

-- Seed products
INSERT INTO products (name, description, category_id, price, discount, image_url, stock) VALUES
  ('Mango Sapling','Healthy grafted mango sapling, 2ft tall.',1,450.00,50.00,'https://images.unsplash.com/photo-1591172942306-4be6bfb9d1a4?w=600',80),
  ('Lemon Tree','Bearing lemon tree, 3ft.',1,600.00,0,'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600',40),
  ('Snake Plant','Low-maintenance indoor plant.',2,350.00,50.00,'https://images.unsplash.com/photo-1593482892290-f54927ae1bb6?w=600',120),
  ('Money Plant','Trailing vine in nursery pot.',2,220.00,20.00,'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600',150),
  ('Garden Trowel','Stainless steel hand trowel.',3,180.00,0,'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600',200),
  ('Pruning Shears','Sharp bypass pruners.',3,520.00,70.00,'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600',60),
  ('Clay Tub Large','Handcrafted terracotta tub.',4,750.00,100.00,'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600',30),
  ('Ceramic Pot Set','Set of 3 ceramic pots.',4,980.00,150.00,'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600',25),
  ('Tomato Seeds','High-yield hybrid seeds, 50pcs.',5,90.00,0,'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=600',300),
  ('Organic Compost 5kg','Rich organic compost.',6,320.00,20.00,'https://images.unsplash.com/photo-1611843467160-25afb8df1074?w=600',90);
