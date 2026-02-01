@echo off
echo Killing existing Node processes...
taskkill /IM node.exe /F >nul 2>&1
timeout /t 2 /nobreak

echo Starting backend server...
cd /d "%~dp0"
npm start
