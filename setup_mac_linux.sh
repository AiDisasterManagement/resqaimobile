#!/bin/bash
# ResQAI 2.0 Mobile App - automated setup for Mac/Linux
#
# Run this from Terminal:
#     bash setup_mac_linux.sh
# (you may need to run: chmod +x setup_mac_linux.sh   first, once)
#
# This automates everything: finding the right folder, installing
# dependencies, and starting Expo. No backend setup needed -- the app
# already points at the live backend by default
# (https://resqai-mo5m.onrender.com).

set -e

echo "============================================"
echo "  ResQAI 2.0 Mobile App - Setup"
echo "============================================"
echo ""

# Move to the folder this script lives in
cd "$(dirname "$0")"

# Handle the "folder inside a folder" issue some unzip tools create
if [ ! -f package.json ]; then
    if [ -f resqai-mobile/package.json ]; then
        cd resqai-mobile
        echo "Found project one folder deeper, moved into it."
    else
        echo ""
        echo "ERROR: Could not find package.json here or in a resqai-mobile"
        echo "subfolder. Make sure this script is inside the unzipped"
        echo "resqai-mobile project folder, next to package.json."
        echo ""
        exit 1
    fi
fi

echo "Working directory: $(pwd)"
echo ""

if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not on PATH."
    echo "Install it from https://nodejs.org, then run this script again."
    exit 1
fi

echo "Node.js found:"
node --version
echo ""

echo "Installing dependencies... this can take a few minutes."
echo "Yellow 'deprecated' warnings are normal, ignore them."
echo ""
npm install

echo ""
echo "============================================"
echo "  Install complete. Starting Expo..."
echo "============================================"
echo ""
echo "A QR code will appear below shortly."
echo "  1. Install 'Expo Go' on your phone first if you haven't."
echo "  2. Scan the QR code with Expo Go (Camera app on iOS, in-app on Android)."
echo ""
echo "Using tunnel mode -- your phone does NOT need to be on the same WiFi."
echo "If this seems stuck for more than 3-4 minutes with no progress,"
echo "press Ctrl+C and re-run with: npx expo start --tunnel --clear"
echo ""

npx expo start --tunnel
