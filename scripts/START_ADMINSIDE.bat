@echo off
echo Starting SARIMA API and AdminSide Laravel Server...
echo.

REM Start SARIMA API in background
echo [1/2] Starting SARIMA API on port 8001...
start /B "SARIMA API" cmd /c "cd AdminSide\sarima_api && python -m uvicorn main:app --host 0.0.0.0 --port 8001 > sarima.log 2>&1"
timeout /t 3 /nobreak >nul
echo     SARIMA API started in background
echo.

REM Start Laravel server
echo [2/2] Starting Laravel server on port 8000...
cd AdminSide\admin
php artisan serve

REM When Laravel stops, cleanup
taskkill /FI "WINDOWTITLE eq SARIMA API*" /F >nul 2>&1
