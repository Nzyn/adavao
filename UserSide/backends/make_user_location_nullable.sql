-- Make latitude and longitude columns nullable in users table
USE alertdavao;

-- Modify latitude column to be nullable
ALTER TABLE users MODIFY COLUMN latitude DOUBLE NULL COMMENT 'User current or registered latitude';

-- Modify longitude column to be nullable
ALTER TABLE users MODIFY COLUMN longitude DOUBLE NULL COMMENT 'User current or registered longitude';

SELECT 'Successfully updated users table: latitude and longitude columns are now nullable' AS Status;