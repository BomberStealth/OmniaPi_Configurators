-- configuratori_db initial schema

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ftv_calcs (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  name         VARCHAR(255) NOT NULL,
  struct_type  VARCHAR(20) NOT NULL,
  orient       VARCHAR(20) NOT NULL,
  grid_rows    TINYINT UNSIGNED NOT NULL DEFAULT 3,
  grid_cols    TINYINT UNSIGNED NOT NULL DEFAULT 6,
  grid_state   TEXT NOT NULL,
  pan_w        SMALLINT UNSIGNED NOT NULL DEFAULT 1134,
  pan_h        SMALLINT UNSIGNED NOT NULL DEFAULT 1762,
  controvento  TINYINT(1) NOT NULL DEFAULT 0,
  result_json  MEDIUMTEXT NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default admin user: admin@omniapi.com / admin123
-- bcrypt hash of 'admin123' with 10 rounds
INSERT IGNORE INTO users (email, password_hash, role) VALUES
  ('admin@omniapi.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin');
