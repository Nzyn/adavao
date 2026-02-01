@echo off
echo Starting AlertDavao Admin Services...
echo.

echo [1/2] Starting SARIMAX API on port 8001...
cd /d "%~dp0..\..\sarima_api"
start "SARIMAX API" cmd /k "python main.py"
timeout /t 3 /nobreak > nul
echo     [OK] SARIMAX API started
echo.

echo [2/2] Starting Laravel Server on port 8000...
cd /d "%~dp0"
echo     Access admin panel at: http://localhost:8000
echo.
php artisan serve

pause
