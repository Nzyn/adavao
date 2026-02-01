@echo off
cd /d "%~dp0"
echo Checking police stations in database...
mysql -u root alertdavao -e "SELECT station_id, station_name FROM police_stations LIMIT 10;"
pause
