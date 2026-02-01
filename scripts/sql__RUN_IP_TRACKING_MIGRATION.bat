@echo off
REM Create report_ip_tracking table in the database
REM This script creates a table to track IP addresses for report submissions

echo.
echo ========================================
echo  Creating report_ip_tracking Table
echo ========================================
echo.

echo This will create a new table to track IP addresses when users submit reports.
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause > nul

echo.
echo Running SQL migration...
echo.

REM Run the SQL file
mysql -u root -p1234 alertdavao < "%~dp0create_report_ip_tracking.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  ✓ Table created successfully!
    echo ========================================
    echo.
    echo You can now track IP addresses when users submit reports.
    echo.
) else (
    echo.
    echo ========================================
    echo  ✗ Error creating table
    echo ========================================
    echo.
    echo Please check the error message above.
    echo.
)

pause
