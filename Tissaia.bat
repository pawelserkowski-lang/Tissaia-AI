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
    :: First check for API key in Windows environment variables
    set "ENV_API_KEY="
    if defined GEMINI_API_KEY (
        set "ENV_API_KEY=!GEMINI_API_KEY!"
        echo       Found GEMINI_API_KEY in Windows environment variables
    ) else if defined API_KEY (
        set "ENV_API_KEY=!API_KEY!"
        echo       Found API_KEY in Windows environment variables
    )

    if defined ENV_API_KEY (
        :: Use environment variable to create .env file
        echo GEMINI_API_KEY=!ENV_API_KEY!> .env
        echo API_KEY=!ENV_API_KEY!>> .env
        echo       API Key loaded from environment variables and saved to .env
    ) else (
        echo.
        echo  --------------------------------------------------------
        echo   TISSAIA requires a Google Gemini API Key for AI features.
        echo   Get your free key at: https://makersuite.google.com/app/apikey
        echo.
        echo   TIP: Set GEMINI_API_KEY in Windows environment variables
        echo        for automatic configuration!
        echo.
        echo   Press ENTER to skip and run in DEMO MODE ^(mock data^)
        echo  --------------------------------------------------------
        echo.
        set /p "USER_API_KEY=  Enter your API Key: "
        if defined USER_API_KEY (
            echo GEMINI_API_KEY=!USER_API_KEY!> .env
            echo API_KEY=!USER_API_KEY!>> .env
            echo       API Key saved to .env
        ) else (
            echo GEMINI_API_KEY=> .env
            echo API_KEY=>> .env
            echo       Running in Demo Mode
        )
    )
)

:: ===============================================
:: [5] Start servers in background
:: ===============================================
echo [5/6] Starting servers in background...

:: Start backend and frontend servers in a minimized window
start /min "Tissaia Servers" cmd /c "npm run dev:all"

:: Wait for servers to initialize
echo       Waiting for servers to initialize...
timeout /t 5 /nobreak >nul

:: ===============================================
:: [6] Launch Chrome in App Mode and close
:: ===============================================
echo [6/6] Launching application...
echo.
echo  ======================================================
echo   TISSAIA AI is starting!
echo.
echo   - Servers are running minimized in the background
echo   - Close Chrome to stop using the app
echo   - This window will close automatically
echo.
echo   To fully stop the servers, find "Tissaia Servers"
echo   in the taskbar and close it.
echo  ======================================================
echo.

:: Find Chrome and launch in app mode
set "CHROME_FOUND=0"
set "CHROME_EXE="

:: Check common Chrome installation paths individually
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
    set "CHROME_FOUND=1"
    goto :found_chrome_main
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
    set "CHROME_FOUND=1"
    goto :found_chrome_main
)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_EXE=%LocalAppData%\Google\Chrome\Application\chrome.exe"
    set "CHROME_FOUND=1"
    goto :found_chrome_main
)

:: Try Edge as fallback
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    set "CHROME_EXE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
    set "CHROME_FOUND=1"
    echo       Using Microsoft Edge ^(Chrome not found^)
    goto :found_chrome_main
)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    set "CHROME_EXE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
    set "CHROME_FOUND=1"
    echo       Using Microsoft Edge ^(Chrome not found^)
    goto :found_chrome_main
)

:found_chrome_main
if "%CHROME_FOUND%"=="1" (
    echo       Launching browser in app mode...
    start "" "%CHROME_EXE%" --app=http://localhost:5174 --new-window --window-size=1280,800 --disable-extensions --disable-infobars --no-first-run --no-default-browser-check
    echo.
    echo       App launched successfully!
    echo       This window will close in 3 seconds...
    timeout /t 3 /nobreak >nul
) else (
    echo.
    echo  [WARNING] Chrome/Edge not found!
    echo  Opening in default browser instead...
    start http://localhost:5174
    echo.
    echo       This window will close in 3 seconds...
    timeout /t 3 /nobreak >nul
)

exit /b 0
