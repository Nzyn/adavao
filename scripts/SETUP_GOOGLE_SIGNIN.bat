@echo off
echo ========================================
echo  Google Sign-In Setup - AlertDavao
echo ========================================
echo.
echo This will:
echo 1. Install required packages
echo 2. Update database schema
echo 3. Guide you through Google OAuth setup
echo.
pause

echo.
echo Step 1: Installing packages...
echo ========================================
echo.

cd UserSide
echo Installing Expo packages...
call npx expo install expo-auth-session expo-crypto expo-web-browser
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install Expo packages
    pause
    exit /b 1
)

cd backends
echo Installing backend packages...
call npm install google-auth-library
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install backend packages
    pause
    exit /b 1
)

cd ..\..

echo.
echo Step 2: Updating database...
echo ========================================
echo.

mysql -u root alertdavao < "UserSide\backends\migrations\add_google_signin_to_users.sql"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to update database
    echo Make sure MySQL is running and alertdavao database exists
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Installation Complete!
echo ========================================
echo.
echo Next Steps:
echo.
echo 1. Get Google OAuth credentials:
echo    - Visit: https://console.cloud.google.com/
echo    - Create OAuth 2.0 Web Application client ID
echo    - Get your Web Client ID
echo.
echo 2. Update app.json:
echo    - Open: UserSide\app.json
echo    - Replace: YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com
echo    - With your actual Google Web Client ID
echo.
echo 3. Update backend .env:
echo    - Create: UserSide\backends\.env
echo    - Add: GOOGLE_WEB_CLIENT_ID=your-client-id
echo.
echo 4. Restart both servers:
echo    - UserSide: npm start
echo    - Backend: cd backends ^&^& npm start
echo.
echo For detailed instructions, see:
echo GOOGLE_SIGNIN_EXPO_SETUP.md
echo.
pause
