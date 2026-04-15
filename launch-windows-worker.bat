@echo off
cd /d "%~dp0"

REM ── Check Node.js ─────────────────────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    mshta "vbscript:msgbox(""Node.js is not installed."" & chr(13) & chr(13) & ""Please visit https://nodejs.org and install the LTS version, then try again."",16,""My Closet — Setup Required"")(window.close)"
    start https://nodejs.org
    exit /b 1
)

REM ── Check Git ─────────────────────────────────────────────────────────────
where git >nul 2>&1
if %errorlevel% neq 0 (
    mshta "vbscript:msgbox(""Git is not installed."" & chr(13) & chr(13) & ""Please visit https://git-scm.com and install it, then try again."",16,""My Closet — Setup Required"")(window.close)"
    start https://git-scm.com
    exit /b 1
)

REM ── Auto-update ───────────────────────────────────────────────────────────
set UPDATED=0
git remote get-url origin >nul 2>&1
if %errorlevel% equ 0 (
    git fetch origin main --quiet >nul 2>&1
    for /f %%i in ('git rev-parse HEAD 2^>nul') do set LOCAL=%%i
    for /f %%i in ('git rev-parse origin/main 2^>nul') do set REMOTE=%%i
    if not "%LOCAL%"=="%REMOTE%" (
        git pull origin main --quiet >nul 2>&1
        call npm install --silent >nul 2>&1
        set UPDATED=1
        REM Write a flag file so the app can show the What's New banner
        echo 1 > "%~dp0.updated"
    )
)

REM ── Install dependencies if missing ───────────────────────────────────────
if not exist "%~dp0node_modules\" (
    call npm install --silent >nul 2>&1
)

REM ── Kill any old instance on port 3737 ────────────────────────────────────
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3737 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)

REM ── Start the server ──────────────────────────────────────────────────────
set PORT=3737
set NODE_ENV=development
start /b "" cmd /c "npm run dev > %TEMP%\mycloset.log 2>&1"

REM ── Wait for server ready ─────────────────────────────────────────────────
:WAIT
timeout /t 1 /nobreak >nul 2>&1
curl -s http://localhost:%PORT% >nul 2>&1
if %errorlevel% neq 0 goto WAIT

REM ── Signal splash to close and open browser ───────────────────────────────
echo ready > "%TEMP%\mycloset_ready.flag"
start http://localhost:%PORT%
