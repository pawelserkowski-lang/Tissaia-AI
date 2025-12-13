@echo off
REM Tissaia AI - Quick Launch Script for Windows

cd /d "%~dp0"

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python 3 is required but not installed.
    echo Please install Python 3 from: https://www.python.org/
    pause
    exit /b 1
)

REM Install Python dependencies if needed
python -c "import pystray" >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing Python dependencies...
    pip install -q pystray pillow >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  Optional dependencies not installed ^(system tray will be unavailable^)
        echo    To enable system tray: pip install pystray pillow
    )
)

REM Run the launcher
python launch_tissaia.py %*
