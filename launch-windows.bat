@echo off
title My Closet

REM ── My Closet — Windows Launcher ─────────────────────────────────────────
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

REM ── Check for Git ─────────────────────────────────────────────────────────
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  Git is not installed!
    echo  Please go to https://git-scm.com and install it.
    echo  After installing, double-click this file again.
    echo.
    pause
    start https://git-scm.com
    exit /b 1
)

REM ── Auto-update from GitHub ───────────────────────────────────────────────
echo.
echo  Checking for updates...

git remote get-url origin >nul 2>&1
if %errorlevel% equ 0 (
    git fetch origin main --quiet >nul 2>&1

    REM Compare local HEAD to remote
    for /f %%i in ('git rev-parse HEAD 2^>nul') do set LOCAL=%%i
    for /f %%i in ('git rev-parse origin/main 2^>nul') do set REMOTE=%%i

    if not "%LOCAL%"=="%REMOTE%" (
        echo  Update found! Pulling latest version...
        git pull origin main --quiet
        call npm install --silent
        echo  App updated to latest version.
    ) else (
        echo  Already up to date.
    )
) else (
    echo  No git remote found - skipping update check.
)

REM ── Install dependencies if missing ───────────────────────────────────────
if not exist "node_modules\" (
    echo.
    echo  First-time setup: installing dependencies...
    call npm install --silent
)

REM ── Start server and open browser ─────────────────────────────────────────
set PORT=3737

echo.
echo  Starting My Closet...

start /b "" cmd /c "set PORT=%PORT% && npm run dev > %TEMP%\mycloset.log 2>&1"

echo  Waiting for app to start...
:WAIT_LOOP
timeout /t 2 /nobreak >nul
curl -s http://localhost:%PORT% >nul 2>&1
if %errorlevel% neq 0 goto WAIT_LOOP

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
