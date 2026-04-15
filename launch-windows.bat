@echo off
title My Closet

REM ── My Closet — Windows Launcher ─────────────────────────────────────────
REM    Double-click this file to open your closet app.

cd /d "%~dp0"

REM ── Check for Node.js ─────────────────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  Node.js is not installed!
    echo  Please go to https://nodejs.org and download the LTS version.
    echo  After installing, double-click this file again.
    echo.
    pause
    start https://nodejs.org
    exit /b 1
)

REM ── Install dependencies if needed ────────────────────────────────────────
if not exist "node_modules\" (
    echo.
    echo  First-time setup: installing app dependencies...
    echo  This only happens once and takes about a minute.
    echo.
    call npm install --silent
    if %errorlevel% neq 0 (
        echo  Installation failed. Check your internet connection and try again.
        pause
        exit /b 1
    )
)

REM ── Set port and start server ──────────────────────────────────────────────
set PORT=3737

echo.
echo  Starting My Closet...
echo.

REM Start server in background
start /b "" cmd /c "set PORT=%PORT% && npm run dev > %TEMP%\mycloset.log 2>&1"

REM Wait for server to be ready
echo  Waiting for app to start...
:WAIT_LOOP
timeout /t 2 /nobreak >nul
curl -s http://localhost:%PORT% >nul 2>&1
if %errorlevel% neq 0 (
    goto WAIT_LOOP
)

REM Open in default browser
echo  Opening My Closet in your browser...
start http://localhost:%PORT%

echo.
echo  ============================================
echo   My Closet is running!
echo   http://localhost:%PORT%
echo.
echo   Keep this window open while using the app.
echo   Close it to stop the app.
echo  ============================================
echo.
pause
