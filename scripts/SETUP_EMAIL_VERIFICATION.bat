@echo off
echo ========================================
echo  Email Verification Setup - AlertDavao
echo ========================================
echo.
echo This will create the pending_users table in your database.
echo.
echo Make sure MySQL is running before proceeding!
echo.
pause

echo.
echo Applying database migration...
echo.

mysql -u root alertdavao < "UserSide\backends\migrations\create_pending_users_table.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  SUCCESS! Migration applied.
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Install nodemailer: cd UserSide\backends ^&^& npm install nodemailer
    echo 2. Configure email in .env file ^(see EMAIL_VERIFICATION_SETUP_GUIDE.md^)
    echo 3. Test registration with email verification
    echo.
) else (
    echo.
    echo ========================================
    echo  ERROR! Migration failed.
    echo ========================================
    echo.
    echo Possible issues:
    echo - MySQL is not running
    echo - Database 'alertdavao' does not exist
    echo - Wrong MySQL credentials
    echo.
    echo Please check and try again.
    echo.
)

pause
