@echo off
echo ==========================================
echo      AlertDavao Setup Script
echo ==========================================

echo [1/4] Configuring Environment...
if not exist .env (
    if exist .env.example (
        echo Copying .env.example to .env...
        copy .env.example .env
        echo [IMPORTANT] Please update .env with your NGROK_AUTHTOKEN!
    )
)

if not exist AdminSide\admin\.env (
    if exist AdminSide\admin\.env.example (
        echo Copying AdminSide .env.example to .env...
        copy AdminSide\admin\.env.example AdminSide\admin\.env
    )
)

echo [2/4] Installing UserSide dependencies...
cd UserSide
if not exist node_modules (
    echo Installing npm packages...
    call npm install
) else (
    echo node_modules already exists, skipping install...
)
cd ..

echo [3/4] Installing AdminSide dependencies...
cd AdminSide\admin
if not exist vendor (
    echo Installing composer packages...
    call composer install
    call php artisan key:generate
) else (
    echo vendor directory already exists, skipping install...
)

echo [4/4] Checking Database ...
call php artisan migrate --force
cd ..\..

echo [Setup Complete!]
echo.
echo IMPORTANT:
echo 1. Open .env and set your NGROK_AUTHTOKEN.
echo.
echo To run the project:
echo 1. Open a terminal for AdminSide:
echo    cd AdminSide\admin
echo    php artisan serve --host 0.0.0.0 --port 8000
echo.
echo 2. Open a terminal for UserSide:
echo    cd UserSide
echo    npx expo start
echo.
pause
