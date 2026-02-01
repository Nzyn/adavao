@echo off
echo ================================================
echo AlertDavao 2.0 - Restart All Services
echo ================================================
echo.

echo Stopping all existing services...
echo.

REM Kill processes on port 3000 (Backend)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul

REM Kill processes on port 8000 (Admin)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul

REM Kill Expo processes
echo Stopping any running services...
taskkill /F /IM node.exe 2>nul

echo.
echo All services stopped!
echo.
echo ================================================
echo Starting services in new windows...
echo ================================================
echo.

REM Start Backend Server
echo Starting Backend Server...
start "AlertDavao - Backend Server" cmd /k "cd /d %~dp0alertdavao2.0\UserSide\backends && npm start"
timeout /t 3 /nobreak >nul

REM Start UserSide App
echo Starting UserSide App...
start "AlertDavao - UserSide App" cmd /k "cd /d %~dp0alertdavao2.0\UserSide && npm start"
timeout /t 2 /nobreak >nul

REM Start AdminSide
echo Starting Admin Panel...
start "AlertDavao - Admin Panel" cmd /k "cd /d %~dp0alertdavao2.0\adminSide\admin && php -S localhost:8000"

echo.
echo ================================================
echo All services started successfully!
echo ================================================
echo.
echo Backend Server: http://192.168.1.11:3000
echo UserSide App: Check the Expo window
echo Admin Panel: http://localhost:8000
echo.
echo Press any key to exit this window...
pause >nul
