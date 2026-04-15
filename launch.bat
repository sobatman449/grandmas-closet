@echo off
cd /d "%~dp0"

REM ── Check Node.js ─────────────────────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    mshta "vbscript:msgbox(""Something is missing on this computer. Please ask a family member for help."",16,""Grandma's Closet"")(window.close)"
    exit /b 1
)

REM ── Install dependencies if missing (first run or after update) ───────────
if not exist "%~dp0node_modules\" (
    call npm install --silent >nul 2>&1
)

REM ── Kill any leftover server on port 3737 ─────────────────────────────────
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3737 ^| findstr LISTENING 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)

set PORT=3737
set NODE_ENV=development
set ATTEMPT=0
set WAIT_COUNT=0

:START_SERVER
set /a ATTEMPT+=1
if %ATTEMPT% gtr 3 goto OPEN_ANYWAY

start /b "" cmd /c "npm run dev > %TEMP%\grandmascloset.log 2>&1"
timeout /t 2 /nobreak >nul

:WAIT_PORT
timeout /t 1 /nobreak >nul
curl -s http://localhost:%PORT% >nul 2>&1
if %errorlevel% neq 0 (
    set /a WAIT_COUNT+=1
    if %WAIT_COUNT% lss 30 goto WAIT_PORT
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%PORT% ^| findstr LISTENING 2^>nul') do (
        taskkill /f /pid %%a >nul 2>&1
    )
    set WAIT_COUNT=0
    goto START_SERVER
)

start http://localhost:%PORT%
exit /b 0

:OPEN_ANYWAY
start http://localhost:%PORT%
exit /b 1
