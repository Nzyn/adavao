@echo off
REM Quick Start Guide for Auto-Assignment Feature

echo ╔═══════════════════════════════════════════════════════════╗
echo ║     AUTO-ASSIGNMENT OF REPORTS - QUICK START GUIDE        ║
echo ╔═══════════════════════════════════════════════════════════╝
echo.
echo WHAT THIS DOES:
echo   • Reports are ALWAYS accepted (no more "out of scope" errors)
echo   • Reports outside known barangays are saved with station_id = NULL
echo   • This tool assigns those reports to the nearest police station
echo.
echo ═══════════════════════════════════════════════════════════
echo OPTION 1: Run Auto-Assignment Now (Recommended)
echo ═══════════════════════════════════════════════════════════
echo.
echo   Just run: auto_assign_reports.bat
echo.
echo ═══════════════════════════════════════════════════════════
echo OPTION 2: Via API (when backend is running)
echo ═══════════════════════════════════════════════════════════
echo.
echo   POST http://localhost:3000/api/reports/auto-assign
echo.
echo ═══════════════════════════════════════════════════════════
echo OPTION 3: Via MySQL Command
echo ═══════════════════════════════════════════════════════════
echo.
echo   mysql -u root alertdavao -e "CALL AutoAssignReportsToStations();"
echo.
echo ═══════════════════════════════════════════════════════════
echo WHEN TO RUN THIS:
echo ═══════════════════════════════════════════════════════════
echo.
echo   1. After adding new barangays to the database
echo   2. After updating barangay station assignments
echo   3. Periodically (daily/weekly) to catch any missed reports
echo   4. After system maintenance or data migration
echo.
echo ═══════════════════════════════════════════════════════════
echo CURRENT STATUS:
echo ═══════════════════════════════════════════════════════════
echo.
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root alertdavao -e "SELECT COUNT(*) as 'Unassigned Reports' FROM reports WHERE station_id IS NULL; SELECT COUNT(*) as 'Total Reports' FROM reports;"
echo.
echo ═══════════════════════════════════════════════════════════
echo.
pause
