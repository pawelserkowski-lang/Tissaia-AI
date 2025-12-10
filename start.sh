#!/bin/bash

echo "==================================================="
echo "      TISSAIA ARCHITECT ENGINE - LAUNCHER"
echo "==================================================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check for node_modules
if [ -d "node_modules" ]; then
    echo "[INFO] Dependencies found. Skipping install."
else
    echo "[INFO] Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install dependencies."
        exit 1
    fi
fi

# Check for .env file
if [ -f ".env" ]; then
    echo "[INFO] Configuration file (.env) found."
else
    echo "[WARN] Configuration file not found."
    echo ""
    echo "TISSAIA requires a Google Gemini API Key for full functionality."
    echo "You can leave it empty to run in SIMULATION MODE (Mock Data)."
    echo ""
    read -p "Enter your Gemini API Key: " API_KEY

    if [ -n "$API_KEY" ]; then
        echo "API_KEY=$API_KEY" > .env
        echo "[INFO] API Key saved to .env"
    else
        echo "[INFO] No API Key provided. Running in Simulation Mode."
    fi
fi

echo ""
echo "[INFO] Starting TISSAIA Development Server..."
echo ""

npm run dev
