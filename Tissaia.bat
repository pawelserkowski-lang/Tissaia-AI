@echo off
setlocal EnableDelayedExpansion
title TISSAIA AI - All-in-One Launcher
color 0B

:: Change to script directory
cd /d "%~dp0"

echo.
echo  ======================================================
echo   _____ ___ ____ ____    _    ___    _      ___
echo  ^|_   _^|_ _^/ ___^/ ___^|  / \  ^|_ _^|  / \    ^|_ _^|
echo    ^| ^|  ^| ^|\___ \___ \ / _ \  ^| ^|  / _ \    ^| ^|
echo    ^| ^|  ^| ^| ___) ^|__) / ___ \ ^| ^| / ___ \   ^| ^|
echo    ^|_^| ^|___^|____/____/_/   \_\___/_/   \_\ ^|___^|
echo.
echo              Architect Engine - Photo Restoration AI
echo  ======================================================
echo.

:: ===============================================
:: [1] Check Node.js
:: ===============================================
echo [1/5] Checking Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Node.js is not installed!
    echo  Please install from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo       Found Node.js %NODE_VER%

:: ===============================================
:: [2] Check npm
:: ===============================================
echo [2/5] Checking npm...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] npm is not installed!
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i
echo       Found npm v%NPM_VER%

:: ===============================================
:: [3] Install dependencies
:: ===============================================
echo [3/5] Checking dependencies...
if exist "node_modules" (
    echo       Dependencies already installed
) else (
    echo       Installing dependencies ^(this may take a few minutes^)...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo  [ERROR] Failed to install dependencies!
        echo.
        pause
        exit /b 1
    )
    echo       Dependencies installed successfully
)

:: ===============================================
:: [4] Check .env configuration
:: ===============================================
echo [4/5] Checking configuration...
if exist ".env" (
    echo       Configuration file found
) else (
    echo.
    echo  --------------------------------------------------------
    echo   TISSAIA requires a Google Gemini API Key for AI features.
    echo   Get your free key at: https://makersuite.google.com/app/apikey
    echo.
    echo   Press ENTER to skip and run in DEMO MODE ^(mock data^)
    echo  --------------------------------------------------------
    echo.
    set /p "API_KEY=  Enter your API Key: "
    if defined API_KEY (
        echo API_KEY=!API_KEY!> .env
        echo       API Key saved to .env
    ) else (
        echo API_KEY=> .env
        echo       Running in Demo Mode
    )
)

:: ===============================================
:: [5] Start application
:: ===============================================
echo [5/5] Starting TISSAIA...
echo.
echo  ======================================================
echo   Starting Backend + Frontend servers...
echo   URL: http://localhost:5173
echo   Press Ctrl+C to stop
echo  ======================================================
echo.

:: Run both backend and frontend
call npm run dev:all

pause
