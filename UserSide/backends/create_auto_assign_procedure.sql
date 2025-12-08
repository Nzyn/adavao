-- Create stored procedure for auto-assigning reports to stations
-- This can be called manually or triggered when barangays are updated

USE alertdavao;

DELIMITER //

-- Drop procedure if it exists
DROP PROCEDURE IF EXISTS AutoAssignReportsToStations//

-- Create procedure
CREATE PROCEDURE AutoAssignReportsToStations()
BEGIN
  DECLARE assigned_count INT DEFAULT 0;
  
  -- Update reports with NULL station_id by finding nearest barangay
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
    
  -- Get count of assigned reports
  SELECT ROW_COUNT() INTO assigned_count;
  
  -- Return result
  SELECT 
    assigned_count as reports_assigned,
    'Auto-assignment complete' as status,
    NOW() as timestamp;
END//

DELIMITER ;

-- Test the procedure
SELECT 'Stored procedure created successfully!' AS status;
SELECT '';
SELECT 'You can now call this procedure with:' AS info;
SELECT 'CALL AutoAssignReportsToStations();' AS command;
SELECT '';
SELECT 'This will automatically assign all unassigned reports to the nearest police station.' AS description;
