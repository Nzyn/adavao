@echo off
echo.
echo ========================================
echo Police Real-Time Updates - Verification
echo ========================================
echo.

echo [1/5] Checking WebSocket client file...
if exist "alertdavao2.0\AdminSide\admin\public\js\websocket-client.js" (
    echo ✓ websocket-client.js exists
) else (
    echo ✗ websocket-client.js MISSING
)

echo.
echo [2/5] Checking reports.blade.php WebSocket initialization...
findstr /M "@section('scripts')" "alertdavao2.0\AdminSide\admin\resources\views\reports.blade.php" >nul
if %errorlevel% equ 0 (
    echo ✓ Reports page has @section('scripts') for WebSocket
) else (
    echo ✗ Reports page missing WebSocket initialization
)

echo.
echo [3/5] Checking handleNewFeatures.js for getUserStation...
findstr /M "getUserStation" "alertdavao2.0\UserSide\backends\handleNewFeatures.js" >nul
if %errorlevel% equ 0 (
    echo ✓ getUserStation function exists
) else (
    echo ✗ getUserStation function MISSING
)

echo.
echo [4/5] Checking server.js for station route...
findstr /M "/api/users/:userId/station" "alertdavao2.0\UserSide\backends\server.js" >nul
if %errorlevel% equ 0 (
    echo ✓ Station API route exists in server.js
) else (
    echo ✗ Station API route MISSING in server.js
)

echo.
echo [5/5] Checking handleWebSocket.js for admin broadcast support...
findstr /M "stationId == 0" "alertdavao2.0\UserSide\backends\handleWebSocket.js" >nul
if %errorlevel% equ 0 (
    echo ✓ WebSocket broadcasts to admin users (station 0)
) else (
    echo ✗ Admin broadcast support MISSING
)

echo.
echo ========================================
echo Verification complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start backend: npm start (in UserSide/backends)
echo 2. Start admin: php artisan serve (in AdminSide/admin)
echo 3. Log in as police officer
echo 4. Check browser console for WebSocket connection
echo 5. Submit a test report and verify it appears in real-time
echo.
