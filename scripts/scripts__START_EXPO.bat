@echo off
REM AlertDavao 2.0 - Expo Frontend Starter

echo.
echo ================================
echo  AlertDavao 2.0 - Expo Start
echo ================================
echo.

cd UserSide

echo Checking Expo installation...
if not exist node_modules (
    echo.
    echo Installing dependencies...
    npm install
)

echo.
echo ✅ Starting Expo development server
echo ✅ Scan the QR code with Expo Go app
echo.
echo Press Ctrl+C to stop the server
echo.

npx expo start
