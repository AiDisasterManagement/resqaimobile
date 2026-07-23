@echo off
REM ResQAI 2.0 Mobile App - automated setup for Windows
REM
REM Run this by double-clicking it, or from Command Prompt:
REM     setup_windows.bat
REM
REM This automates everything we figured out manually: finding the right
REM folder, installing dependencies, and starting Expo. It does NOT need
REM any backend setup -- the app already points at the live backend by
REM default (https://resqai-mo5m.onrender.com).

echo ============================================
echo   ResQAI 2.0 Mobile App - Setup
echo ============================================
echo.

REM Move to the folder this script lives in, whatever that turns out to be
cd /d "%~dp0"

REM If we're not already inside the real project (no package.json here),
REM check one level down -- this is the "folder inside a folder" issue
REM that unzip tools commonly create.
if not exist package.json (
    if exist resqai-mobile\package.json (
        cd resqai-mobile
        echo Found project one folder deeper, moved into it.
    ) else (
        echo.
        echo ERROR: Could not find package.json here or in a resqai-mobile
        echo subfolder. Make sure this script is inside the unzipped
        echo resqai-mobile project folder, next to package.json.
        echo.
        pause
        exit /b 1
    )
)

echo Working directory: %cd%
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not on PATH.
    echo Install it from https://nodejs.org, then run this script again.
    pause
    exit /b 1
)

echo Node.js found:
node --version
echo.

echo Installing dependencies... this can take a few minutes.
echo Yellow "deprecated" warnings are normal, ignore them.
echo.
call npm install
if errorlevel 1 (
    echo.
    echo ERROR: npm install failed. Scroll up to see the actual error.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Install complete. Starting Expo...
echo ============================================
echo.
echo A QR code will appear below shortly.
echo   1. Install "Expo Go" on your phone first if you haven't.
echo   2. Scan the QR code with Expo Go.
echo.
echo Using tunnel mode -- your phone does NOT need to be on the same WiFi.
echo If this seems stuck for more than 3-4 minutes with no progress,
echo press Ctrl+C and re-run with: npx expo start --tunnel --clear
echo.

call npx expo start --tunnel
pause
