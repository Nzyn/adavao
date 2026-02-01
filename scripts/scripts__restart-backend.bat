@echo off
echo ================================================
echo AlertDavao 2.0 - Restart Backend Server
echo ================================================
echo.

echo Stopping backend server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul

timeout /t 2 /nobreak >nul

echo.
echo Starting backend server...
cd /d %~dp0alertdavao2.0\UserSide\backends
npm start
