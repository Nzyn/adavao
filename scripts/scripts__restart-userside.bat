@echo off
echo ================================================
echo AlertDavao 2.0 - Restart UserSide App
echo ================================================
echo.

echo Stopping UserSide app...
taskkill /F /IM node.exe 2>nul

timeout /t 2 /nobreak >nul

echo.
echo Starting UserSide app...
cd /d %~dp0alertdavao2.0\UserSide
npm start
