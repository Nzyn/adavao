-- AlertDavao 2.0 Schema Updates
-- Simple script to add missing columns to existing tables
-- Run: Get-Content update_schema.sql | mysql -u root -p1234 alertdavao

USE alertdavao;

-- =====================================================
-- 1. UPDATE VERIFICATIONS TABLE
-- =====================================================

-- Add id_selfie column
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA='alertdavao' AND TABLE_NAME='verifications' AND COLUMN_NAME='id_selfie');

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE verifications ADD COLUMN id_selfie VARCHAR(255) COMMENT ''Path to uploaded selfie with ID'' AFTER status',
  'SELECT ''Column id_selfie already exists'' AS msg');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add billing_document column
SET @col_exists2 = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA='alertdavao' AND TABLE_NAME='verifications' AND COLUMN_NAME='billing_document');

SET @sql2 = IF(@col_exists2 = 0,
  'ALTER TABLE verifications ADD COLUMN billing_document VARCHAR(255) COMMENT ''Path to uploaded proof of billing'' AFTER id_selfie',
  'SELECT ''Column billing_document already exists'' AS msg');

PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- =====================================================
-- 2. UPDATE REPORTS TABLE
-- =====================================================

-- Add title column
SET @col_exists3 = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA='alertdavao' AND TABLE_NAME='reports' AND COLUMN_NAME='title');

SET @sql3 = IF(@col_exists3 = 0,
  'ALTER TABLE reports ADD COLUMN title VARCHAR(255) COMMENT ''Title or subject of the report'' AFTER report_id',
  'SELECT ''Column title already exists'' AS msg');

PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- Add assigned_station_id column
SET @col_exists4 = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA='alertdavao' AND TABLE_NAME='reports' AND COLUMN_NAME='assigned_station_id');

SET @sql4 = IF(@col_exists4 = 0,
  'ALTER TABLE reports ADD COLUMN assigned_station_id INT NULL COMMENT ''Station assigned to handle the report'' AFTER location_id',
  'SELECT ''Column assigned_station_id already exists'' AS msg');

PREPARE stmt4 FROM @sql4;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;

-- Add foreign key for assigned_station_id
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA='alertdavao' AND TABLE_NAME='reports' AND CONSTRAINT_NAME='fk_reports_station');

SET @sql5 = IF(@fk_exists = 0,
  'ALTER TABLE reports ADD CONSTRAINT fk_reports_station FOREIGN KEY (assigned_station_id) REFERENCES police_stations(station_id) ON DELETE SET NULL',
  'SELECT ''Foreign key fk_reports_station already exists'' AS msg');

PREPARE stmt5 FROM @sql5;
EXECUTE stmt5;
DEALLOCATE PREPARE stmt5;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'Schema update completed successfully!' AS Status;
SELECT 'Updated tables: verifications, reports' AS Info;

-- Show updated table structures
DESCRIBE verifications;
DESCRIBE reports;
