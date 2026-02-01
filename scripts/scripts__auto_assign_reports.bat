@echo off
REM Auto-assign unassigned reports to police stations
REM This script processes reports that don't have a station_id assigned

echo ============================================
echo AUTO-ASSIGN REPORTS TO POLICE STATIONS
echo ============================================
echo.
echo This script will:
echo   1. Find reports with NULL station_id
echo   2. Assign them to nearest police station
echo   3. Based on location coordinates matching barangays
echo.
pause

echo.
echo Running SQL auto-assignment script...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root alertdavao < UserSide\backends\auto_assign_reports_to_stations.sql

echo.
echo ============================================
echo AUTO-ASSIGNMENT COMPLETE!
echo ============================================
echo.
echo All unassigned reports have been processed.
echo Reports are now assigned to their respective police stations.
echo.
pause
