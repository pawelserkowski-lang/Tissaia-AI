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

:: 2. Security Check: Environment Variables
:: [SECURITY] Enforcing usage of Windows Environment Variables per Directive 2025-12-06
if "%GOOGLE_API_KEY%"=="" (
    echo [SECURITY ALERT] GOOGLE_API_KEY environment variable is missing.
    echo.
    echo Per security protocol, please set your key in Windows:
    echo    1. Press Win + R, type "sysdm.cpl", go to Advanced -^> Environment Variables.
    echo    2. Add a new User Variable named "GOOGLE_API_KEY".
    echo.
    echo Launch aborted to prevent insecure configuration.
    pause
    exit /b 1
)

:: Map the secure env var to the app's expected format if needed
set "API_KEY=%GOOGLE_API_KEY%"
echo [INFO] Security credentials verified.

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

:: [ARCHITECT] Note: Per Directive 2025-12-06, Docker is preferred.
:: This local launch is for debugging only.
call npm run dev

if %errorlevel% neq 0 (
    echo [ERROR] Application crashed or failed to start.
    pause
)