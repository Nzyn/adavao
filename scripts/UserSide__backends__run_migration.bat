@echo off
echo ========================================
echo Running Notification Reads Table Migration
echo ========================================
echo.

REM Update these variables with your database credentials
set DB_HOST=localhost
set DB_USER=root
set DB_PASSWORD=
set DB_NAME=alertdavao

echo Creating notification_reads table...
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < migrations\create_notification_reads_table.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Migration completed successfully!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo Migration failed! Please check your database credentials.
    echo ========================================
)

echo.
pause
