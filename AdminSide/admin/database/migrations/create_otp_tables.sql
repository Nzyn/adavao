-- OTP System Tables for AdminSide

-- OTP Codes Table
CREATE TABLE IF NOT EXISTS otp_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(64) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(64) NOT NULL COMMENT 'login, register, verify',
    user_id INT DEFAULT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone_purpose (phone, purpose),
    INDEX idx_expires (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Verified Phones Table
CREATE TABLE IF NOT EXISTS verified_phones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(64) NOT NULL UNIQUE,
    verified TINYINT(1) DEFAULT 1,
    verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
