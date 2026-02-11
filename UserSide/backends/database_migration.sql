-- AlertDavao 2.0 Database Migration Script
-- Run this script to update your database to the new schema
-- Based on schema provided on 2025-10-17
-- Note: Most tables already exist, we're just adding missing columns

USE alertdavao;

-- =====================================================
-- 1. VERIFY POLICE_STATIONS EXISTS (already exists)
-- =====================================================
-- Table already exists, no action needed

-- =====================================================
-- 2. UPDATE USERS TABLE (columns already added)
-- =====================================================
-- Columns latitude, longitude, station_id, is_verified already exist
-- Foreign key fk_users_station already exists

-- =====================================================
-- 3. UPDATE VERIFICATIONS TABLE (add missing columns)
-- =====================================================

ALTER TABLE verifications
ADD COLUMN IF NOT EXISTS id_selfie VARCHAR(255) COMMENT 'Path to uploaded selfie with ID' AFTER status;

ALTER TABLE verifications
ADD COLUMN IF NOT EXISTS billing_document VARCHAR(255) COMMENT 'Path to uploaded proof of billing' AFTER id_selfie;

-- =====================================================
-- 4. CREATE ROLES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL COMMENT 'admin, police, or user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default roles
INSERT IGNORE INTO roles (role_id, role_name) VALUES 
(1, 'admin'),
(2, 'police'),
(3, 'user');

-- =====================================================
-- 5. CREATE USER_ROLES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_role (user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 6. CREATE ROUTES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS routes (
  route_id INT AUTO_INCREMENT PRIMARY KEY,
  route_name VARCHAR(100) NOT NULL COMMENT 'API route or page name'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 7. CREATE ROLE_ROUTE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS role_route (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  route_id INT NOT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE CASCADE,
  UNIQUE KEY unique_role_route (role_id, route_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 8. UPDATE REPORTS TABLE
-- =====================================================

-- Add new columns to reports table (using procedure to handle existing columns)
DROP PROCEDURE IF EXISTS add_report_columns;

DELIMITER $$
CREATE PROCEDURE add_report_columns()
BEGIN
  -- Add title column if not exists
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA='alertdavao' AND TABLE_NAME='reports' AND COLUMN_NAME='title') THEN
    ALTER TABLE reports ADD COLUMN title VARCHAR(255) COMMENT 'Title or subject of the report' AFTER location_id;
  END IF;
  
  -- Add assigned_station_id column if not exists
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA='alertdavao' AND TABLE_NAME='reports' AND COLUMN_NAME='assigned_station_id') THEN
    ALTER TABLE reports ADD COLUMN assigned_station_id INT NULL COMMENT 'Station assigned to handle the report' AFTER title;
  END IF;
  
  -- Add is_valid column if not exists
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA='alertdavao' AND TABLE_NAME='reports' AND COLUMN_NAME='is_valid') THEN
    ALTER TABLE reports ADD COLUMN is_valid VARCHAR(50) DEFAULT 'checking_for_report_validity' COMMENT 'Report validity status: valid, invalid, or checking_for_report_validity' AFTER status;
  END IF;
END$$
DELIMITER ;

CALL add_report_columns();
DROP PROCEDURE IF EXISTS add_report_columns;

-- Add foreign key for assigned_station_id if not exists
SET @fk_reports_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA='alertdavao' AND TABLE_NAME='reports' AND CONSTRAINT_NAME='fk_reports_station');

SET @sql2 = IF(@fk_reports_exists = 0, 
  'ALTER TABLE reports ADD CONSTRAINT fk_reports_station FOREIGN KEY (assigned_station_id) REFERENCES police_stations(station_id) ON DELETE SET NULL', 
  'SELECT "Foreign key fk_reports_station already exists" AS msg');

PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- =====================================================
-- 9. CREATE MESSAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS messages (
  message_id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  report_id INT NULL,
  message TEXT NOT NULL,
  status BOOLEAN DEFAULT FALSE COMMENT 'True if the recipient has read the message',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 10. CREATE CRIME_FORECASTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS crime_forecasts (
  forecast_id INT AUTO_INCREMENT PRIMARY KEY,
  location_id INT NOT NULL,
  forecast_date DATE NOT NULL,
  predicted_count INT,
  model_used VARCHAR(50) COMMENT 'SARIMA model used for forecasting',
  confidence_score FLOAT,
  FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 11. CREATE CRIME_ANALYTICS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS crime_analytics (
  analytics_id INT AUTO_INCREMENT PRIMARY KEY,
  location_id INT NOT NULL,
  total_reports INT DEFAULT 0,
  crime_rate FLOAT,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 12. CREATE ADMIN_ACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_actions (
  action_id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  action_type VARCHAR(50) COMMENT 'reassign, delete, approve, etc.',
  description TEXT,
  date_performed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 13. SEED POLICE STATIONS DATA
-- =====================================================

-- Insert police stations from your location.tsx file
INSERT INTO police_stations (station_name, address, latitude, longitude, contact_number) VALUES
('PS1 Sta. Ana', '2 M L Quezon Blvd, Poblacion District, Davao City, 8000 Davao del Sur', 7.073926884947963, 125.62460794233071, '09985987055 / 233-4884'),
('PS2 San Pedro', 'Purok 6, 107 San Pedro St, Poblacion District, Davao City, Davao del Sur', 7.06363513645959, 125.60983772750019, '09985987057 / 226-4835'),
('PS3 Talomo', '3G4W+2FM, McArthur Highway, Talomo, Davao City, Davao del Sur', 7.055262956996804, 125.5463240055573, '09194439634 / 297-1598'),
('PS4 Sasa', 'Km 9, Paradise Island Road, Davao City-Panabo City Rd, Buhangin, Davao City, 8000 Davao del Sur', 7.1145752788215075, 125.6574542290678, '09194439634 / 297-1598'),
('PS5 Buhangin', '4J77+C7J, Buhangin-Cabantian-Indangan Rd, Buhangin, Lungsod ng Dabaw, 8000 Lalawigan ng Davao del Sur', 7.11375476140385, 125.61321898470506, '09985987063'),
('PS6 Bunawan', '6JPV+74W, Bunawan, Davao City, Davao del Sur', 7.235684819195078, 125.64280068118306, '09985987065 / 236-0284'),
('PS7 Paquibato', '8FF6+6CJ, Barangay Lacson Rd, Davao City, 8000 Davao del Sur', 7.323117846058702, 125.4610349916833, '09985987067'),
('PS8 Toril', '2F9X+F96, General Lao St, Toril, Davao City, Davao del Sur', 7.018794722669158, 125.49848119837901, '09985987069 / 291-1633'),
('PS9 Tugbok', '3GP5+444, Tugbok, Davao City, 8000 Davao del Sur', 7.085446402287649, 125.50790122883605, '09985987072 / 09082277648 / 293-1177'),
('PS10 Calinan', '5FQ2+QW8, H Quiambao St, Calinan District, Davao City, 8000 Davao del Sur', 7.189501489500771, 125.452646461377, '09985987074 / 295-0119'),
('PS11 Baguio', '5CC3+V73, Baguio Road, Davao City, Davao del Sur', 7.172208918163278, 125.40315983742406, '09985987076'),
('PS12 Marilog', 'C733+JMJ, Davao - Bukidnon Hwy, Marilog District, Davao City, 8000 Davao del Sur', 7.406313963628985, 125.25868719472082, '09985987079'),
('PS13 Mandug', '5H5H+FQJ, Mandug Rd, Buhangin, Davao City, Davao del Sur', 7.158712265897077, 125.57938030393281, '09639749831'),
('PS15 Ecoland', '76-A Candelaria, Talomo, Davao City, Davao del Sur', 7.054131712097039, 125.60214948303488, '09190932408'),
('PS16 Maa', '3HXQ+XVW, Bypass Road, Talomo, Lungsod ng Dabaw, Lalawigan ng Davao del Sur', 7.100157191380795, 125.5899695885922, '09094015088'),
('PS17 Baliok', 'Barangay, Purok 2 Libby Road, Talomo, Davao City, 8000 Davao del Sur', 7.04669076212661, 125.5010750653133, '09079908630'),
('PS18 Bajada', '3JW8+25M, Daang Maharlika Highway, Dacudao Ave, Poblacion District, Davao City, Davao del Sur', 7.0953094237019725, 125.61549817857369, '09691914296 / 282-0302'),
('PS20 Los Amigos', '4FRH+MVQ, Tugbok, Davao City, 8000 Davao del Sur', 7.141641470017805, 125.48006096137699, '09207444000 / 282-8769')
ON DUPLICATE KEY UPDATE station_name=VALUES(station_name);

-- =====================================================
-- 14. ASSIGN DEFAULT USER ROLE
-- =====================================================

-- Assign all existing users to 'user' role (role_id = 3)
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT id, 3 FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles WHERE user_roles.user_id = users.id
);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

SHOW TABLES;

SELECT 'Migration completed successfully! All tables created/updated with new schema.' AS Status;
