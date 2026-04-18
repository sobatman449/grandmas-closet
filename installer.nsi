; ═══════════════════════════════════════════════════════════════════════════
;  Grandma's Closet — Windows Installer
;
;  HOW TO BUILD:
;    1. Install NSIS 3.x from https://nsis.sourceforge.io
;    2. Right-click this file → "Compile NSIS Script"
;       (or run:  makensis installer.nsi)
;    3. This produces:  GrandmasCloset-Setup.exe  ← give this to grandma
;
;  What it does for the user (one double-click):
;    • Downloads & installs Node.js automatically if missing
;    • Installs the app to Program Files
;    • Creates a desktop shortcut with the app icon
;    • Adds it to the Start Menu
;    • Registers with Add/Remove Programs for clean uninstall
; ═══════════════════════════════════════════════════════════════════════════

Unicode True
!include "MUI2.nsh"
!include "LogicLib.nsh"

; ── App metadata ─────────────────────────────────────────────────────────────
!define APP_NAME    "Grandma's Closet"
!define APP_SLUG    "GrandmasCloset"
!define APP_VERSION "1.0.0"
!define APP_ICON    "Image.ico"

; ── Node.js LTS — update version/URL here when a new LTS drops ───────────────
!define NODE_VERSION "22.11.0"
!define NODE_MSI     "node-v${NODE_VERSION}-x64.msi"
!define NODE_URL     "https://nodejs.org/dist/v${NODE_VERSION}/${NODE_MSI}"

Name             "${APP_NAME}"
OutFile          "GrandmasCloset-Setup.exe"
InstallDir       "$PROGRAMFILES\Grandma's Closet"
InstallDirRegKey HKLM "Software\${APP_SLUG}" "InstallDir"
RequestExecutionLevel admin    ; needed to install Node.js + write to Program Files

; ── Branding ──────────────────────────────────────────────────────────────────
!define MUI_ICON                "${APP_ICON}"
!define MUI_UNICON              "${APP_ICON}"
!define MUI_WELCOMEPAGE_TITLE   "Welcome to Grandma's Closet"
!define MUI_WELCOMEPAGE_TEXT    "This will set up Grandma's Closet on your computer.$\r$\n$\r$\nClick Next to continue."
!define MUI_FINISHPAGE_RUN      "$SYSDIR\wscript.exe"
!define MUI_FINISHPAGE_RUN_PARAMETERS  '"$INSTDIR\launch.vbs"'
!define MUI_FINISHPAGE_RUN_TEXT "Open Grandma's Closet now"
!define MUI_ABORTWARNING

; ── Wizard pages ─────────────────────────────────────────────────────────────
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

; ── Version info (shows in Properties → Details) ─────────────────────────────
VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName"     "${APP_NAME}"
VIAddVersionKey "FileDescription" "${APP_NAME} Setup"
VIAddVersionKey "FileVersion"     "${APP_VERSION}"
VIAddVersionKey "LegalCopyright"  "© 2025"

; ═══════════════════════════════════════════════════════════════════════════
Section "Install" SecMain

  ; ── Check for Node.js; download + install silently if missing ─────────────
  DetailPrint "Checking for Node.js..."
  nsExec::ExecToStack "node --version"
  Pop $0
  ${If} $0 != 0

    DetailPrint "Node.js not found — downloading (please wait)..."
    nsExec::ExecToLog 'powershell.exe -NoProfile -ExecutionPolicy Bypass -Command \
      "Invoke-WebRequest -Uri ''${NODE_URL}'' \
       -OutFile ''$TEMP\${NODE_MSI}'' -UseBasicParsing"'
    Pop $0
    ${If} $0 != 0
      MessageBox MB_OK|MB_ICONEXCLAMATION \
        "Could not download Node.js. Please check your internet connection and run setup again."
      Abort
    ${EndIf}

    DetailPrint "Installing Node.js ${NODE_VERSION} (a progress window will appear briefly)..."
    ExecWait '"$SYSDIR\msiexec.exe" /i "$TEMP\${NODE_MSI}" /passive /norestart' $0
    Delete "$TEMP\${NODE_MSI}"

    ${If} $0 != 0
      MessageBox MB_OK|MB_ICONEXCLAMATION \
        "Node.js installation failed (code $0). Please try running setup again."
      Abort
    ${EndIf}

    ; Refresh PATH in this process so npm is usable immediately
    nsExec::ExecToLog 'powershell.exe -NoProfile -Command \
      "[Environment]::SetEnvironmentVariable( \
        ''Path'', \
        [Environment]::GetEnvironmentVariable(''Path'',''Machine'') + '';'' + \
        [Environment]::GetEnvironmentVariable(''Path'',''User''), \
        ''Process'')"'

  ${EndIf}

  ; ── Copy application files ────────────────────────────────────────────────
  DetailPrint "Installing Grandma's Closet..."
  SetOutPath "$INSTDIR"

  File "${APP_ICON}"
  File "package.json"
  File "package-lock.json"
  File "vite.config.ts"
  File "tsconfig.json"
  File "tailwind.config.ts"
  File "postcss.config.js"
  File "drizzle.config.ts"
  File "components.json"
  File "launch.vbs"
  File "launch.bat"

  File /r "client"
  File /r "server"
  File /r "shared"
  File /r "script"

  ; ── Pre-install npm dependencies ─────────────────────────────────────────
  ; (so the first launch opens instantly rather than waiting ~60s)
  DetailPrint "Setting up the app — this takes about a minute, please wait..."
  nsExec::ExecToLog 'cmd.exe /C "cd /d ""$INSTDIR"" && npm install --silent"'
  Pop $0
  ${If} $0 != 0
    ; Non-fatal — the launcher will retry on first run
    DetailPrint "Note: dependency setup had errors; the app will retry on first launch."
  ${EndIf}

  ; ── Desktop shortcut ─────────────────────────────────────────────────────
  DetailPrint "Creating shortcuts..."
  CreateShortcut \
    "$DESKTOP\Grandma's Closet.lnk" \
    "$SYSDIR\wscript.exe" \
    '"$INSTDIR\launch.vbs"' \
    "$INSTDIR\${APP_ICON}" 0

  ; ── Start Menu ───────────────────────────────────────────────────────────
  CreateDirectory "$SMPROGRAMS\Grandma's Closet"
  CreateShortcut \
    "$SMPROGRAMS\Grandma's Closet\Grandma's Closet.lnk" \
    "$SYSDIR\wscript.exe" \
    '"$INSTDIR\launch.vbs"' \
    "$INSTDIR\${APP_ICON}" 0
  CreateShortcut \
    "$SMPROGRAMS\Grandma's Closet\Uninstall.lnk" \
    "$INSTDIR\Uninstall.exe"

  ; ── Register with Windows Add/Remove Programs ────────────────────────────
  WriteRegStr   HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
                     "DisplayName"     "${APP_NAME}"
  WriteRegStr   HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
                     "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr   HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
                     "DisplayIcon"     "$INSTDIR\${APP_ICON}"
  WriteRegStr   HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
                     "Publisher"       "Grandma's Closet"
  WriteRegStr   HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
                     "DisplayVersion"  "${APP_VERSION}"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
                     "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
                     "NoRepair" 1
  WriteRegStr   HKLM "Software\${APP_SLUG}" "InstallDir" "$INSTDIR"

  WriteUninstaller "$INSTDIR\Uninstall.exe"

SectionEnd

; ═══════════════════════════════════════════════════════════════════════════
Section "Uninstall"

  nsExec::ExecToLog 'taskkill /F /FI "IMAGENAME eq node.exe" /T'

  RMDir /r "$INSTDIR"
  Delete "$DESKTOP\Grandma's Closet.lnk"
  RMDir /r "$SMPROGRAMS\Grandma's Closet"

  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}"
  DeleteRegKey HKLM "Software\${APP_SLUG}"

SectionEnd
