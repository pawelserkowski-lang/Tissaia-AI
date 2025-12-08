@echo off
setlocal enabledelayedexpansion

:: Change directory to script location
cd /d "%~dp0"

TITLE Tissaia Launcher
set LOG_FILE=tissaia_launcher.log

echo [INFO] Initializing Tissaia Architect Engine...
echo [INFO] Logs will be saved to %LOG_FILE%

:: Initialize log file
echo [INFO] Tissaia Architect Engine Initialization... > "%LOG_FILE%"
echo ================================================== >> "%LOG_FILE%"
echo [INFO] Tissaia Architect Engine Initialization...
echo ==================================================

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH.
    echo [ERROR] Node.js is not installed or not in your PATH. >> "%LOG_FILE%"
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org/
    echo.
    echo After installing, please restart this script.
    echo [ERROR] Script failed: Node.js missing. >> "%LOG_FILE%"
    pause
    exit /b 1
)

:: Check for npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not found.
    echo [ERROR] npm is not found. >> "%LOG_FILE%"
    echo Please ensure npm is selected during Node.js installation.
    echo [ERROR] Script failed: npm missing. >> "%LOG_FILE%"
    pause
    exit /b 1
)

:: Check for .env file
if not exist ".env" (
    echo [WARN] .env file not found.
    echo [WARN] .env file not found. >> "%LOG_FILE%"
    echo [INFO] Creating .env template...
    echo GEMINI_API_KEY=YOUR_API_KEY_HERE> .env
    echo [INFO] .env file created.
    echo [ACTION] Please open .env and add your GEMINI_API_KEY before continuing.
    echo.
    echo Press any key to continue after editing .env...
    pause >nul
)

echo [INFO] Installing dependencies...
echo [INFO] Installing dependencies... >> "%LOG_FILE%"
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    echo [ERROR] Failed to install dependencies. >> "%LOG_FILE%"
    echo Please check your internet connection or npm configuration.
    pause
    exit /b 1
)

echo [INFO] Starting development server...
echo [INFO] Starting development server... >> "%LOG_FILE%"
echo [INFO] Press Ctrl+C in this window to stop the server.
echo.
call npm run dev

pause
exit /b 0
