@echo off
cd /d "%~dp0"

echo.
echo ====================================================
echo Verifying Station Routing Setup
echo ====================================================
echo.

REM Check if barangays table has station_id column
echo Checking barangays table schema...
mysql -u root alertdavao -e "DESCRIBE barangays;" | findstr "station_id"
if %errorlevel% equ 0 (
  echo [OK] barangays.station_id column exists
) else (
  echo [ERROR] barangays.station_id column NOT FOUND
)

echo.

REM Check if reports table has station_id column
echo Checking reports table schema...
mysql -u root alertdavao -e "DESCRIBE reports;" | findstr "station_id"
if %errorlevel% equ 0 (
  echo [OK] reports.station_id column exists
) else (
  echo [ERROR] reports.station_id column NOT FOUND
)

echo.

REM Count barangays with station assignments
echo Checking barangay assignments...
mysql -u root alertdavao -e "SELECT COUNT(*) as barangays_with_station FROM barangays WHERE station_id IS NOT NULL;"

echo.

REM Count reports with station assignments
echo Checking report assignments...
mysql -u root alertdavao -e "SELECT COUNT(*) as reports_with_station FROM reports WHERE station_id IS NOT NULL;"

echo.

REM Show sample data
echo Sample barangay-station mappings:
mysql -u root alertdavao -e "SELECT b.barangay_name, ps.station_name FROM barangays b LEFT JOIN police_stations ps ON b.station_id = ps.station_id LIMIT 10;"

echo.
echo ====================================================
echo Verification Complete!
echo ====================================================
echo.

pause
