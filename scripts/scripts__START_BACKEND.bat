@echo off
REM AlertDavao 2.0 - Laravel Backend Starter

echo.
echo ================================
echo  AlertDavao 2.0 - Backend Start
echo ================================
echo.

cd AdminSide\admin

echo Checking Laravel installation...
if not exist vendor (
    echo.
    echo Installing dependencies...
    composer install
)

echo.
echo ✅ Starting Laravel backend on http://127.0.0.1:8000
echo ✅ Accessible from phone at http://192.168.1.4:8000
echo.
echo Press Ctrl+C to stop the server
echo.

php artisan serve
