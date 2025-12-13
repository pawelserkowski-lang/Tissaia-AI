#!/bin/bash
# Tissaia AI - Quick Launch Script for Linux/Mac

# Make sure we're in the script's directory
cd "$(dirname "$0")"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3 from: https://www.python.org/"
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "⚠️  pip3 not found, trying pip..."
    if ! command -v pip &> /dev/null; then
        echo "❌ pip is required but not installed."
        exit 1
    fi
    PIP_CMD="pip"
else
    PIP_CMD="pip3"
fi

# Install Python dependencies if needed
if ! python3 -c "import pystray" 2>/dev/null; then
    echo "📦 Installing Python dependencies..."
    $PIP_CMD install -q pystray pillow 2>/dev/null || {
        echo "⚠️  Optional dependencies not installed (system tray will be unavailable)"
        echo "   To enable system tray: $PIP_CMD install pystray pillow"
    }
fi

# Make the Python script executable
chmod +x launch_tissaia.py

# Run the launcher
python3 launch_tissaia.py "$@"
