-- Add citymunCode column to barangays table
-- This is needed to filter barangays by city/municipality

USE alertdavao;

-- Add citymunCode column if it doesn't exist
-- Check if column exists first
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'alertdavao' 
  AND TABLE_NAME = 'barangays' 
  AND COLUMN_NAME = 'citymunCode';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE barangays ADD COLUMN citymunCode VARCHAR(10) COMMENT ''City/Municipality code from PSA PSGC'' AFTER barangay_name',
  'SELECT ''Column citymunCode already exists'' AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Note: You will need to populate this column with data from davao_barangays.csv
-- Run the populate script after this migration to import the citymunCode values
