@echo off
cd /d "d:\Codes\alertdavao2.0.new\alertdavao2.0\AdminSide\admin"
echo Running Barangay Migration...
php artisan migrate --force
echo.
echo Running Barangay Seeder...
php artisan db:seed --class=BarangaySeeder
echo.
echo ✅ Barangays table created and populated!
pause
