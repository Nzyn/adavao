-- Auto-assign barangays to police stations based on geographic proximity
-- Uses Haversine formula to calculate distance between coordinates
-- Each barangay is assigned to its nearest police station

USE alertdavao;

-- =====================================================
-- 1. CREATE TEMPORARY TABLE FOR DISTANCE CALCULATIONS
-- =====================================================

-- Calculate distance between each barangay and all stations
DROP TEMPORARY TABLE IF EXISTS barangay_station_distances;

CREATE TEMPORARY TABLE barangay_station_distances AS
SELECT 
  b.barangay_id,
  b.barangay_name,
  b.latitude as b_lat,
  b.longitude as b_lon,
  ps.station_id,
  ps.station_name,
  ps.latitude as s_lat,
  ps.longitude as s_lon,
  -- Haversine formula: distance in km
  (6371 * acos(
    cos(radians(90 - b.latitude)) * cos(radians(90 - ps.latitude)) +
    sin(radians(90 - b.latitude)) * sin(radians(90 - ps.latitude)) * cos(radians(b.longitude - ps.longitude))
  )) as distance_km
FROM barangays b
CROSS JOIN police_stations ps
WHERE b.latitude IS NOT NULL 
  AND b.longitude IS NOT NULL
  AND ps.latitude IS NOT NULL
  AND ps.longitude IS NOT NULL;

-- =====================================================
-- 2. ASSIGN EACH BARANGAY TO ITS NEAREST STATION
-- =====================================================

-- Find nearest station for each barangay
DROP TEMPORARY TABLE IF EXISTS nearest_stations;

CREATE TEMPORARY TABLE nearest_stations AS
SELECT 
  d1.barangay_id,
  d1.barangay_name,
  d1.station_id,
  d1.station_name,
  d1.distance_km
FROM barangay_station_distances d1
WHERE d1.distance_km = (
  SELECT MIN(d2.distance_km)
  FROM barangay_station_distances d2
  WHERE d2.barangay_id = d1.barangay_id
);

-- =====================================================
-- 3. UPDATE BARANGAYS TABLE WITH STATION ASSIGNMENTS
-- =====================================================

UPDATE barangays b
SET b.station_id = (
  SELECT ns.station_id
  FROM nearest_stations ns
  WHERE ns.barangay_id = b.barangay_id
)
WHERE b.barangay_id IN (SELECT barangay_id FROM nearest_stations);

-- =====================================================
-- 4. VERIFICATION AND SUMMARY
-- =====================================================

SELECT 'Auto-assignment based on geographic proximity complete!' AS status;
SELECT '';

-- Show assignment summary
SELECT 'Barangays assigned to stations:' AS summary;
SELECT COUNT(*) as assigned FROM barangays WHERE station_id IS NOT NULL;
SELECT COUNT(*) as total FROM barangays;
SELECT '';

-- Show detailed assignments
SELECT '=== Barangay-Station Assignments ===' AS detail_header;
SELECT 
  b.barangay_name,
  ps.station_name,
  ps.address,
  ps.contact_number,
  ROUND(
    6371 * acos(
      cos(radians(90 - b.latitude)) * cos(radians(90 - ps.latitude)) +
      sin(radians(90 - b.latitude)) * sin(radians(90 - ps.latitude)) * cos(radians(b.longitude - ps.longitude))
    ), 2
  ) as distance_km
FROM barangays b
LEFT JOIN police_stations ps ON b.station_id = ps.station_id
ORDER BY ps.station_id, b.barangay_name;

SELECT '';
SELECT '=== Summary by Station ===' AS station_summary;
SELECT 
  ps.station_id,
  ps.station_name,
  ps.address,
  COUNT(b.barangay_id) as barangay_count,
  GROUP_CONCAT(CONCAT(b.barangay_name, ' (', 
    ROUND(6371 * acos(
      cos(radians(90 - b.latitude)) * cos(radians(90 - ps.latitude)) +
      sin(radians(90 - b.latitude)) * sin(radians(90 - ps.latitude)) * cos(radians(b.longitude - ps.longitude))
    ), 1), ' km)') 
    SEPARATOR ', ') as barangays_served
FROM police_stations ps
LEFT JOIN barangays b ON ps.station_id = b.station_id
GROUP BY ps.station_id, ps.station_name, ps.address
ORDER BY ps.station_id;

SELECT '';
SELECT '✅ Geo-based auto-assignment complete!' AS final_status;
