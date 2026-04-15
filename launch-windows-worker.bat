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
git remote get-url origin >nul 2>&1
if %errorlevel% equ 0 (
    git fetch origin main --quiet >nul 2>&1
    for /f %%i in ('git rev-parse HEAD 2^>nul') do set LOCAL_SHA=%%i
    for /f %%i in ('git rev-parse origin/main 2^>nul') do set REMOTE_SHA=%%i
    if not "%LOCAL_SHA%"=="%REMOTE_SHA%" (
        git pull origin main --quiet >nul 2>&1
        call npm install --silent >nul 2>&1
        echo 1 > "%~dp0.updated"
    )
)

REM ── Install dependencies if missing ───────────────────────────────────────
if not exist "%~dp0node_modules\" (
    call npm install --silent >nul 2>&1
)

REM ── Detect local IP address ───────────────────────────────────────────────
set LOCAL_IP=localhost
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "169.254"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        if not defined LOCAL_IP_FOUND (
            set LOCAL_IP=%%b
            set LOCAL_IP_FOUND=1
        )
    )
)
REM Trim leading space
for /f "tokens=* delims= " %%a in ("%LOCAL_IP%") do set LOCAL_IP=%%a

REM Write IP to temp file so the splash can read it
echo %LOCAL_IP% > "%TEMP%\mycloset_ip.txt"

REM ── Kill any old instance on port 3737 ────────────────────────────────────
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3737 ^| findstr LISTENING 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)

set PORT=3737
set NODE_ENV=development
set ATTEMPT=0

:START_SERVER
set /a ATTEMPT+=1
if %ATTEMPT% gtr 3 goto GIVE_UP

REM ── Start the server ──────────────────────────────────────────────────────
start /b "" cmd /c "npm run dev > %TEMP%\mycloset.log 2>&1"

REM Give the process a moment to get its PID into the table
timeout /t 2 /nobreak >nul 2>&1

REM ── Wait for port to accept connections (up to 30 s) ──────────────────────
set WAIT_COUNT=0
:WAIT_PORT
timeout /t 1 /nobreak >nul 2>&1
curl -s http://localhost:%PORT% >nul 2>&1
if %errorlevel% neq 0 (
    set /a WAIT_COUNT+=1
    if %WAIT_COUNT% lss 30 goto WAIT_PORT
    REM Port never opened — kill and retry
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%PORT% ^| findstr LISTENING 2^>nul') do taskkill /f /pid %%a >nul 2>&1
    goto START_SERVER
)

REM ── Health-check: verify the response body isn't blank ────────────────────
REM curl the root URL into a temp file, then check its size
curl -s --max-time 5 http://localhost:%PORT%/ -o "%TEMP%\mycloset_check.html" 2>nul
REM If the file is missing or tiny (< 50 bytes) the server returned garbage
for %%F in ("%TEMP%\mycloset_check.html") do set FILE_SIZE=%%~zF
if not defined FILE_SIZE set FILE_SIZE=0
if %FILE_SIZE% lss 50 (
    REM Kill the sick server and restart
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%PORT% ^| findstr LISTENING 2^>nul') do taskkill /f /pid %%a >nul 2>&1
    timeout /t 2 /nobreak >nul 2>&1
    goto START_SERVER
)
del "%TEMP%\mycloset_check.html" >nul 2>&1

REM ── All good — signal splash and open browser ─────────────────────────────
echo ready > "%TEMP%\mycloset_ready.flag"
start http://localhost:%PORT%
exit /b 0

:GIVE_UP
REM After 3 failed attempts, open anyway and let the error boundary explain
echo ready > "%TEMP%\mycloset_ready.flag"
start http://localhost:%PORT%
exit /b 1
