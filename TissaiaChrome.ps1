# TISSAIA AI - Chrome App Launcher (PowerShell)
# Starts servers hidden and launches Chrome in app mode
# Automatically cleans up servers when Chrome is closed

$ErrorActionPreference = "Stop"

# Set console appearance
$Host.UI.RawUI.WindowTitle = "TISSAIA AI - Chrome App"

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host ""
Write-Host "  ======================================================" -ForegroundColor Cyan
Write-Host "   TISSAIA AI - Chrome App Mode (Silent Servers)" -ForegroundColor Cyan
Write-Host "  ======================================================" -ForegroundColor Cyan
Write-Host ""

# Check if npm is available
try {
    $null = Get-Command npm -ErrorAction Stop
} catch {
    Write-Host "  [ERROR] npm is not installed!" -ForegroundColor Red
    Write-Host "  Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "  Press Enter to exit"
    exit 1
}

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "  Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check .env file
if (-not (Test-Path ".env")) {
    if ($env:GEMINI_API_KEY) {
        "GEMINI_API_KEY=$($env:GEMINI_API_KEY)" | Out-File ".env" -Encoding utf8
        "API_KEY=$($env:GEMINI_API_KEY)" | Add-Content ".env"
        Write-Host "  API Key loaded from environment" -ForegroundColor Green
    } elseif ($env:API_KEY) {
        "GEMINI_API_KEY=$($env:API_KEY)" | Out-File ".env" -Encoding utf8
        "API_KEY=$($env:API_KEY)" | Add-Content ".env"
        Write-Host "  API Key loaded from environment" -ForegroundColor Green
    } else {
        Write-Host "  No API key found - running in Demo Mode" -ForegroundColor Yellow
        "GEMINI_API_KEY=" | Out-File ".env" -Encoding utf8
        "API_KEY=" | Add-Content ".env"
    }
}

Write-Host "  Starting servers (hidden)..." -ForegroundColor Yellow

# Start the servers in a hidden window
$ServerProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev:all" -WindowStyle Hidden -PassThru

Write-Host "  Servers started (PID: $($ServerProcess.Id))" -ForegroundColor Green
Write-Host "  Waiting for servers to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Find Chrome or Edge
$BrowserPath = $null
$BrowserPaths = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LocalAppData\Google\Chrome\Application\chrome.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
)

foreach ($path in $BrowserPaths) {
    if (Test-Path $path) {
        $BrowserPath = $path
        break
    }
}

if ($BrowserPath) {
    Write-Host "  Launching Chrome App..." -ForegroundColor Green
    $BrowserProcess = Start-Process -FilePath $BrowserPath -ArgumentList "--app=http://localhost:5174", "--window-size=1280,800" -PassThru

    Write-Host ""
    Write-Host "  ======================================================" -ForegroundColor Cyan
    Write-Host "   TISSAIA AI is running!" -ForegroundColor White
    Write-Host ""
    Write-Host "   - Servers are running in the background (hidden)" -ForegroundColor Gray
    Write-Host "   - Close the Chrome window to exit" -ForegroundColor Gray
    Write-Host "   - Or press Ctrl+C here to force stop" -ForegroundColor Gray
    Write-Host "  ======================================================" -ForegroundColor Cyan
    Write-Host ""

    # Wait for Chrome to close
    $BrowserProcess.WaitForExit()

    Write-Host "  Chrome closed. Stopping servers..." -ForegroundColor Yellow
} else {
    Write-Host "  [WARNING] Chrome/Edge not found!" -ForegroundColor Yellow
    Start-Process "http://localhost:5174"
    Write-Host "  Press Enter to stop servers when done..." -ForegroundColor Gray
    Read-Host
}

# Cleanup: Kill the server process tree
try {
    # Get child processes
    $ChildProcesses = Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq $ServerProcess.Id }
    foreach ($child in $ChildProcesses) {
        Stop-Process -Id $child.ProcessId -Force -ErrorAction SilentlyContinue
    }
    Stop-Process -Id $ServerProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host "  Servers stopped successfully." -ForegroundColor Green
} catch {
    # Process may have already exited
}

Write-Host "  Goodbye!" -ForegroundColor Cyan
Start-Sleep -Seconds 1
