@echo off
setlocal
title TISSAIA Launcher

echo ===================================================
echo       TISSAIA ARCHITECT ENGINE - LAUNCHER
echo ===================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

:: Check for node_modules
if exist node_modules (
    echo [INFO] Dependencies found. Skipping install.
) else (
    echo [INFO] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b
    )
)

:: Check for .env file
if exist .env (
    echo [INFO] Configuration file (.env) found.
) else (
    echo [WARN] Configuration file not found.
    echo.
    echo TISSAIA requires a Google Gemini API Key for full functionality.
    echo You can leave it empty to run in SIMULATION MODE (Mock Data).
    echo.
    set /p API_KEY="Enter your Gemini API Key: "

    if defined API_KEY (
        echo API_KEY=%API_KEY% > .env
        echo [INFO] API Key saved to .env
    ) else (
        echo [INFO] No API Key provided. Running in Simulation Mode.
    )
)

echo.
echo [INFO] Starting TISSAIA Development Server...
echo.

call npm run dev

pause
