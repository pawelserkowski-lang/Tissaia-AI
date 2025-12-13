#!/bin/bash
# TISSAIA AI - Chrome App Launcher (Linux/macOS)
# Starts servers in background and launches Chrome in app mode

cd "$(dirname "$0")"

echo ""
echo "  ======================================================"
echo "   TISSAIA AI - Chrome App Mode"
echo "  ======================================================"
echo ""

# Check dependencies
if ! command -v node &> /dev/null; then
    echo "  [ERROR] Node.js is not installed!"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "  [ERROR] npm is not installed!"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "  Installing dependencies..."
    npm install
fi

# Check .env
if [ ! -f ".env" ]; then
    if [ -n "$GEMINI_API_KEY" ]; then
        echo "GEMINI_API_KEY=$GEMINI_API_KEY" > .env
        echo "API_KEY=$GEMINI_API_KEY" >> .env
        echo "  API Key loaded from environment"
    else
        echo "GEMINI_API_KEY=" > .env
        echo "API_KEY=" >> .env
        echo "  Running in Demo Mode"
    fi
fi

echo "  Starting servers in background..."

# Start servers in background
npm run dev:all &> /dev/null &
SERVER_PID=$!

echo "  Servers started (PID: $SERVER_PID)"
echo "  Waiting for servers to initialize..."
sleep 5

# Find Chrome or Chromium
CHROME_CMD=""
for cmd in google-chrome google-chrome-stable chromium chromium-browser; do
    if command -v $cmd &> /dev/null; then
        CHROME_CMD=$cmd
        break
    fi
done

if [ -n "$CHROME_CMD" ]; then
    echo "  Launching Chrome in app mode..."
    $CHROME_CMD --app=http://localhost:5173 --window-size=1280,800 &
    CHROME_PID=$!

    echo ""
    echo "  ======================================================"
    echo "   TISSAIA AI is running!"
    echo ""
    echo "   - Servers are running in the background"
    echo "   - Close Chrome to exit, or press Ctrl+C here"
    echo "  ======================================================"
    echo ""

    # Wait for Chrome to close
    wait $CHROME_PID 2>/dev/null

    echo "  Chrome closed. Stopping servers..."
    kill $SERVER_PID 2>/dev/null
    pkill -P $SERVER_PID 2>/dev/null
    echo "  Done!"
else
    echo "  [WARNING] Chrome not found. Opening in default browser..."
    xdg-open http://localhost:5173 2>/dev/null || open http://localhost:5173 2>/dev/null
    echo "  Press Enter to stop servers..."
    read
    kill $SERVER_PID 2>/dev/null
fi
