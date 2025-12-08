@echo off
cd /d "%~dp0"
setlocal EnableDelayedExpansion

echo ========================================================
echo   TISSAIA ARCHITECT ENGINE - LAUNCHER
echo ========================================================

:: 1. Verify Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH.
    echo Please install Node.js ^(LTS version recommended^) from: https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Check for .env Configuration
if not exist ".env" (
    echo [WARNING] .env configuration file not found.
    echo [SETUP] Creating template .env file...

    (
        echo # Tissaia Architect Engine Configuration
        echo # Get your Gemini API Key from: https://aistudio.google.com/app/apikey
        echo API_KEY=
    ) > .env

    echo [SETUP] Template .env created.
    echo [ACTION REQUIRED] Opening .env file. Please paste your Google GenAI API Key after 'API_KEY='.

    :: Attempt to open .env with default editor, fallback to notepad
    start "" ".env" 2>nul || notepad ".env"

    echo.
    echo Press any key AFTER you have saved and closed the .env file to continue...
    pause >nul
)

:: 3. Install/Update Dependencies
echo [INFO] Checking dependencies...
if not exist "node_modules" (
    echo [INFO] First run detected. Installing dependencies...
    call npm install
) else (
    echo [INFO] Verifying dependencies...
    call npm install
)

if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    echo Check the error message above for details.
    pause
    exit /b 1
)

:: 4. Launch Application
echo [INFO] Starting Development Server...
echo [INFO] Press Ctrl+C to stop the server.
echo.

call npm run dev

if %errorlevel% neq 0 (
    echo [ERROR] Application crashed or failed to start.
    pause
)
