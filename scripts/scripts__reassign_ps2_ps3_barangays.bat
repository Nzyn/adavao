@echo off
REM Reassign specific barangays to PS2 San Pedro and PS3 Talomo
REM Run this script from the project root directory

echo ============================================
echo BARANGAY REASSIGNMENT TO PS2 AND PS3
echo ============================================
echo.
echo This script will:
echo   1. Assign 5 barangays to PS3 Talomo (station_id = 3)
echo   2. Assign 15 barangays to PS2 San Pedro (station_id = 2)
echo   3. Update existing reports with new assignments
echo.
pause

echo.
echo Running SQL script...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root alertdavao < UserSide\backends\reassign_barangays_ps2_ps3.sql

echo.
echo ============================================
echo COMPLETE!
echo ============================================
echo.
echo The barangays have been reassigned.
echo When users submit reports from these barangays,
echo they will automatically route to the correct police station.
echo.
pause
