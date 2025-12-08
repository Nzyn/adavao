-- Auto-assign unassigned reports to police stations
-- This script finds reports with NULL station_id and assigns them to the nearest station
-- based on their location coordinates matching barangays

USE alertdavao;

-- =====================================================
-- 1. UPDATE REPORTS WITH NULL STATION_ID
-- =====================================================

SELECT 'Starting auto-assignment of unassigned reports...' AS status;
SELECT '';

-- Count unassigned reports before update
SELECT 
  COUNT(*) as unassigned_reports
FROM reports r
JOIN locations l ON r.location_id = l.location_id
WHERE r.station_id IS NULL
  AND l.latitude IS NOT NULL
  AND l.longitude IS NOT NULL
  AND l.latitude != 0
  AND l.longitude != 0;

SELECT '';
SELECT 'Assigning reports to stations based on location...' AS status;

-- Update reports by finding nearest barangay and using its station_id
UPDATE reports r
JOIN locations l ON r.location_id = l.location_id
SET r.station_id = (
  SELECT b.station_id
  FROM barangays b
  WHERE b.station_id IS NOT NULL
    AND b.latitude IS NOT NULL
    AND b.longitude IS NOT NULL
  ORDER BY (
    -- Haversine formula to calculate distance
    6371 * acos(
      cos(radians(90 - b.latitude)) * cos(radians(90 - l.latitude)) +
      sin(radians(90 - b.latitude)) * sin(radians(90 - l.latitude)) * 
      cos(radians(b.longitude - l.longitude))
    )
  ) ASC
  LIMIT 1
)
WHERE r.station_id IS NULL
  AND l.latitude IS NOT NULL
  AND l.longitude IS NOT NULL
  AND l.latitude != 0
  AND l.longitude != 0;

-- Show results
SELECT '';
SELECT 'Assignment complete!' AS status;
SELECT '';

-- Count reports still unassigned
SELECT 
  COUNT(*) as still_unassigned
FROM reports r
JOIN locations l ON r.location_id = l.location_id
WHERE r.station_id IS NULL
  AND l.latitude IS NOT NULL
  AND l.longitude IS NOT NULL;

SELECT '';

-- Show assignment summary by station
SELECT 
  ps.station_id,
  ps.station_name,
  COUNT(r.report_id) as total_reports
FROM reports r
JOIN police_stations ps ON r.station_id = ps.station_id
GROUP BY ps.station_id, ps.station_name
ORDER BY ps.station_id;

SELECT '';

-- Show recently assigned reports
SELECT 
  r.report_id,
  r.title,
  r.station_id,
  ps.station_name,
  l.latitude,
  l.longitude,
  l.barangay
FROM reports r
JOIN locations l ON r.location_id = l.location_id
LEFT JOIN police_stations ps ON r.station_id = ps.station_id
WHERE r.station_id IS NOT NULL
ORDER BY r.created_at DESC
LIMIT 10;

SELECT '';
SELECT '✅ Auto-assignment process complete!' AS final_status;
