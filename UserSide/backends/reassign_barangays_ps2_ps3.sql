-- Reassign specific barangays to PS3 Talomo and PS2 San Pedro
-- This script updates barangay assignments based on user requirements

USE alertdavao;

-- =====================================================
-- 1. ASSIGN BARANGAYS TO PS3 TALOMO (station_id = 3)
-- =====================================================

UPDATE barangays SET station_id = 3 WHERE barangay_name IN (
  '75-A Matina Aplaya',
  '74-A Matina Crossing',
  'Matina Pangi',
  'Talomo Proper',
  'Catalunan Grande'
);

SELECT '✅ PS3 Talomo assignments updated' AS status;
SELECT ROW_NUMBER() OVER (ORDER BY barangay_name) AS '#', barangay_name, station_id 
FROM barangays 
WHERE barangay_name IN (
  '75-A Matina Aplaya',
  '74-A Matina Crossing',
  'Matina Pangi',
  'Talomo Proper',
  'Catalunan Grande'
);

-- =====================================================
-- 2. ASSIGN BARANGAYS TO PS2 SAN PEDRO (station_id = 2)
-- =====================================================
-- Note: Only updating barangays that exist in the database
-- Missing from DB: Barangay 1-A, 5-A, 6-A, 7-A, 19-B, 33-D, 76-A

UPDATE barangays SET station_id = 2 WHERE barangay_name IN (
  'Barangay 2-A',
  'Barangay 3-A',
  'Barangay 4-A',
  'Barangay 8-A',
  'Barangay 9-A',
  'Barangay 10-A',
  'Barangay 11-B',
  'Barangay 12-B',
  'Barangay 34-D',
  'Barangay 35-D',
  'Barangay 36-D',
  'Barangay 37-D',
  'Barangay 38-D',
  'Barangay 39-D',
  'Barangay 40-D'
);

SELECT '✅ PS2 San Pedro assignments updated' AS status;
SELECT ROW_NUMBER() OVER (ORDER BY barangay_name) AS '#', barangay_name, station_id 
FROM barangays 
WHERE barangay_name IN (
  'Barangay 2-A',
  'Barangay 3-A',
  'Barangay 4-A',
  'Barangay 8-A',
  'Barangay 9-A',
  'Barangay 10-A',
  'Barangay 11-B',
  'Barangay 12-B',
  'Barangay 34-D',
  'Barangay 35-D',
  'Barangay 36-D',
  'Barangay 37-D',
  'Barangay 38-D',
  'Barangay 39-D',
  'Barangay 40-D'
);

-- =====================================================
-- 3. VERIFICATION
-- =====================================================

SELECT '';
SELECT '=============================================' AS '';
SELECT 'BARANGAY REASSIGNMENT SUMMARY' AS '';
SELECT '=============================================' AS '';
SELECT '';

-- Count assignments per station
SELECT 
  ps.station_id,
  ps.station_name,
  COUNT(b.barangay_id) as barangay_count
FROM police_stations ps
LEFT JOIN barangays b ON ps.station_id = b.station_id
WHERE ps.station_id IN (2, 3)
GROUP BY ps.station_id, ps.station_name
ORDER BY ps.station_id;

SELECT '';
SELECT 'PS3 Talomo Barangays:' AS '';
SELECT barangay_name 
FROM barangays 
WHERE barangay_name IN (
  '75-A Matina Aplaya',
  '74-A Matina Crossing',
  'Matina Pangi',
  'Talomo Proper',
  'Catalunan Grande'
)
ORDER BY barangay_name;

SELECT '';
SELECT 'PS2 San Pedro Barangays:' AS '';
SELECT barangay_name 
FROM barangays 
WHERE barangay_name IN (
  'Barangay 2-A',
  'Barangay 3-A',
  'Barangay 4-A',
  'Barangay 8-A',
  'Barangay 9-A',
  'Barangay 10-A',
  'Barangay 11-B',
  'Barangay 12-B',
  'Barangay 34-D',
  'Barangay 35-D',
  'Barangay 36-D',
  'Barangay 37-D',
  'Barangay 38-D',
  'Barangay 39-D',
  'Barangay 40-D'
)
ORDER BY barangay_name;

SELECT '';
SELECT '✅ Barangay reassignment complete!' AS status;
SELECT '';
