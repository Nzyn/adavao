@echo off
echo ==========================================
echo   TESTING AUTO-START FUNCTIONALITY
echo ==========================================
echo.

echo [Step 1] Killing any existing processes...
taskkill /F /IM php.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo   Done
echo.

echo [Step 2] Starting Laravel server...
echo   This should auto-start the SARIMA API
cd AdminSide\admin
start "Laravel Server" cmd /c "php artisan serve"
timeout /t 5 /nobreak >nul
echo.

echo [Step 3] Checking SARIMA API status...
timeout /t 3 /nobreak >nul

curl -s http://localhost:8001/health > temp_health.json 2>nul
if %ERRORLEVEL% EQU 0 (
    echo   ✓ SARIMA API is running!
    type temp_health.json
    del temp_health.json
) else (
    echo   ✗ SARIMA API is NOT running
    echo.
    echo   Manual start command:
    echo   cd AdminSide\sarima_api
    echo   python -m uvicorn main:app --host 0.0.0.0 --port 8001
)
echo.

echo [Step 4] Checking Laravel...
curl -s http://localhost:8000 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   ✓ Laravel is running on port 8000
) else (
    echo   ✗ Laravel is NOT running
)
echo.

echo ==========================================
echo Press any key to stop servers and exit...
pause >nul

taskkill /F /IM php.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
echo Servers stopped.
