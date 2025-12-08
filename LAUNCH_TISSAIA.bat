@echo off
setlocal enabledelayedexpansion

TITLE Tissaia Launcher

echo [INFO] Tissaia Architect Engine Initialization...
echo ==================================================

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH.
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org/
    echo.
    echo After installing, please restart this script.
    pause
    exit /b 1
)

:: Check for npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not found.
    echo Please ensure npm is selected during Node.js installation.
    pause
    exit /b 1
)

:: Check for .env file
if not exist ".env" (
    echo [WARN] .env file not found.
    echo [INFO] Creating .env template...
    echo GEMINI_API_KEY=YOUR_API_KEY_HERE> .env
    echo [INFO] .env file created.
    echo [ACTION] Please open .env and add your GEMINI_API_KEY before continuing.
    echo.
    pause
)

echo [INFO] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    echo Please check your internet connection or npm configuration.
    pause
    exit /b 1
)

echo [INFO] Starting development server...
echo [INFO] Press Ctrl+C in this window to stop the server.
echo.
call npm run dev

pause
