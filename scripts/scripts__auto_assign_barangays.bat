@echo off
cd /d "%~dp0"

echo.
echo ====================================================
echo Auto-Assigning Barangays to Police Stations
echo (Based on Geographic Proximity)
echo ====================================================
echo.

REM Change to backends directory
cd UserSide\backends

REM Run the Node.js script
node auto_assign_barangays_to_stations.js

echo.
echo ====================================================
echo Auto-assignment complete!
echo ====================================================
echo.

pause
