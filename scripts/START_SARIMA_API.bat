@echo off
echo ========================================
echo  SARIMA Crime Forecasting - Quick Start
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/3] Checking Python installation...
python --version
echo.

echo [2/3] Installing dependencies...
cd /d "%~dp0AdminSide\sarima_api"
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo [3/3] Starting SARIMA API on port 8001...
echo.
echo ========================================
echo  API will be available at:
echo  http://localhost:8001
echo.
echo  Press Ctrl+C to stop the server
echo ========================================
echo.

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001
