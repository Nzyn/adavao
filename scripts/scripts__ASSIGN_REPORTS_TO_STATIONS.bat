@echo off
echo.
echo ================================================================
echo   ASSIGNING ALL REPORTS TO THEIR CORRECT POLICE STATIONS
echo ================================================================
echo.

cd /d "d:\Codes\alertdavao2.0.new\alertdavao2.0\AdminSide\admin"

echo Running migration to ensure barangays table exists...
php artisan migrate --force
echo.

echo Seeding barangays with coordinates...
php artisan db:seed --class=BarangaySeeder
echo.

echo Assigning reports to stations based on location...
php artisan assign:reports-to-stations
echo.

echo ================================================================
echo   ✅ COMPLETE - Refresh your police dashboard!
echo ================================================================
echo.
pause
