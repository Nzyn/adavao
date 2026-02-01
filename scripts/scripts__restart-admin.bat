@echo off
echo ================================================
echo AlertDavao 2.0 - Restart Admin Panel
echo ================================================
echo.

echo Stopping admin server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul

timeout /t 2 /nobreak >nul

echo.
echo Starting admin panel...
cd /d %~dp0alertdavao2.0\adminSide\admin
php -S localhost:8000
