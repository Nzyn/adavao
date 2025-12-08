-- Add station_id to barangays and reports tables
-- This enables proper routing of reports to their respective police stations

USE alertdavao;

-- =====================================================
-- 1. ADD station_id TO BARANGAYS TABLE
-- =====================================================

SET @col_exists1 = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA='alertdavao' AND TABLE_NAME='barangays' AND COLUMN_NAME='station_id');

SET @sql1 = IF(@col_exists1 = 0,
  'ALTER TABLE barangays ADD COLUMN station_id BIGINT(20) UNSIGNED NULL COMMENT ''Associated police station ID'' AFTER barangay_name',
  'SELECT ''Column station_id already exists in barangays'' AS msg');

PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- Add foreign key for barangays.station_id
SET @fk_barangays_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA='alertdavao' AND TABLE_NAME='barangays' AND CONSTRAINT_NAME='fk_barangays_station');

SET @sql_fk1 = IF(@fk_barangays_exists = 0, 
  'ALTER TABLE barangays ADD CONSTRAINT fk_barangays_station FOREIGN KEY (station_id) REFERENCES police_stations(station_id) ON DELETE SET NULL', 
  'SELECT ''Foreign key fk_barangays_station already exists'' AS msg');

PREPARE stmt_fk1 FROM @sql_fk1;
EXECUTE stmt_fk1;
DEALLOCATE PREPARE stmt_fk1;

-- =====================================================
-- 2. ADD station_id TO REPORTS TABLE
-- =====================================================

SET @col_exists2 = (SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA='alertdavao' AND TABLE_NAME='reports' AND COLUMN_NAME='station_id');

SET @sql2 = IF(@col_exists2 = 0,
  'ALTER TABLE reports ADD COLUMN station_id BIGINT(20) UNSIGNED NULL COMMENT ''Police station handling this report'' AFTER assigned_station_id',
  'SELECT ''Column station_id already exists in reports'' AS msg');

PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Add foreign key for reports.station_id
SET @fk_reports_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA='alertdavao' AND TABLE_NAME='reports' AND CONSTRAINT_NAME='fk_reports_station_id');

SET @sql_fk2 = IF(@fk_reports_exists = 0, 
  'ALTER TABLE reports ADD CONSTRAINT fk_reports_station_id FOREIGN KEY (station_id) REFERENCES police_stations(station_id) ON DELETE SET NULL', 
  'SELECT ''Foreign key fk_reports_station_id already exists'' AS msg');

PREPARE stmt_fk2 FROM @sql_fk2;
EXECUTE stmt_fk2;
DEALLOCATE PREPARE stmt_fk2;

-- =====================================================
-- 3. UPDATE EXISTING REPORTS WITH STATION_ID FROM BARANGAY
-- =====================================================

-- Update reports to include station_id from their barangay location
UPDATE reports r
SET r.station_id = (
  SELECT b.station_id 
  FROM barangays b 
  JOIN locations l ON b.barangay_id = l.barangay_id 
  WHERE l.location_id = r.location_id 
  LIMIT 1
)
WHERE r.station_id IS NULL AND r.location_id IS NOT NULL;

-- =====================================================
-- 4. VERIFICATION
-- =====================================================

SELECT 'Migration completed successfully!' AS Status;

DESCRIBE barangays;
SELECT '---' AS separator;
DESCRIBE reports;

SELECT COUNT(*) as reports_with_station FROM reports WHERE station_id IS NOT NULL;
SELECT COUNT(*) as barangays_with_station FROM barangays WHERE station_id IS NOT NULL;
