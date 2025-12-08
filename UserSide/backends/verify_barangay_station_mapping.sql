-- Verify Station Routing Setup
-- Run this to confirm everything is properly configured

USE alertdavao;

SELECT '=== BARANGAYS TABLE ===' AS check1;
DESCRIBE barangays;

SELECT '';
SELECT '=== REPORTS TABLE ===' AS check2;
DESCRIBE reports;

SELECT '';
SELECT '=== BARANGAYS WITH STATION ASSIGNMENTS ===' AS check3;
SELECT 
  COUNT(*) as total_barangays,
  SUM(CASE WHEN station_id IS NOT NULL THEN 1 ELSE 0 END) as assigned,
  SUM(CASE WHEN station_id IS NULL THEN 1 ELSE 0 END) as unassigned
FROM barangays;

SELECT '';
SELECT '=== REPORTS WITH STATION ASSIGNMENTS ===' AS check4;
SELECT 
  COUNT(*) as total_reports,
  SUM(CASE WHEN station_id IS NOT NULL THEN 1 ELSE 0 END) as assigned,
  SUM(CASE WHEN station_id IS NULL THEN 1 ELSE 0 END) as unassigned
FROM reports;

SELECT '';
SELECT '=== BARANGAY-STATION MAPPING SAMPLE (First 20) ===' AS check5;
SELECT 
  b.barangay_id,
  b.barangay_name,
  b.station_id,
  ps.station_name,
  ps.address
FROM barangays b
LEFT JOIN police_stations ps ON b.station_id = ps.station_id
LIMIT 20;

SELECT '';
SELECT '=== FOREIGN KEY CONSTRAINTS ===' AS check6;
SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'alertdavao' 
  AND (CONSTRAINT_NAME LIKE 'fk_barangays_station%' OR CONSTRAINT_NAME LIKE 'fk_reports_station%');

SELECT '';
SELECT '=== ALL STATIONS WITH BARANGAY COUNT ===' AS check7;
SELECT 
  ps.station_id,
  ps.station_name,
  COUNT(b.barangay_id) as barangay_count
FROM police_stations ps
LEFT JOIN barangays b ON ps.station_id = b.station_id
GROUP BY ps.station_id, ps.station_name
ORDER BY ps.station_id;

SELECT '';
SELECT '✅ VERIFICATION COMPLETE!' AS final_status;
