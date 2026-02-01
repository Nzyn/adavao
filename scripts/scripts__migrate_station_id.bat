@echo off
cd /d "%~dp0"

echo.
echo ====================================================
echo Adding station_id to barangays and reports tables
echo ====================================================
echo.

REM Run the migration
mysql -u root alertdavao < UserSide\backends\add_station_id_to_tables.sql

echo.
echo ====================================================
echo Migration completed!
echo ====================================================
echo.

pause
