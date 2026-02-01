@echo off
cd /d "%~dp0"
echo Seeding police stations...
mysql -u root alertdavao < seed_police_stations.sql
echo.
echo Verifying data...
mysql -u root alertdavao -e "SELECT COUNT(*) as total_stations FROM police_stations;"
echo Done!
pause
