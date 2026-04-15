; ═══════════════════════════════════════════════════════════════════════════
;  Grandma's Closet — Windows Installer
;
;  HOW TO BUILD:
;    1. Install NSIS 3.x from https://nsis.sourceforge.io
;    2. Right-click this file → "Compile NSIS Script"
;       (or run:  makensis installer.nsi)
;    3. This produces:  GrandmasCloset-Setup.exe
; ═══════════════════════════════════════════════════════════════════════════

Unicode True
!include "MUI2.nsh"
!include "LogicLib.nsh"

; ── App metadata ─────────────────────────────────────────────────────────────
!define APP_NAME    "Grandma's Closet"
!define APP_SLUG    "GrandmasCloset"
!define APP_VERSION "1.0.0"
!define APP_ICON    "Image.ico"

Name             "${APP_NAME}"
OutFile          "GrandmasCloset-Setup.exe"
InstallDir       "$LOCALAPPDATA\${APP_SLUG}"
InstallDirRegKey HKCU "Software\${APP_SLUG}" "InstallDir"
RequestExecutionLevel user    ; no UAC / admin prompt needed

; ── Branding ──────────────────────────────────────────────────────────────────
!define MUI_ICON                "${APP_ICON}"
!define MUI_UNICON              "${APP_ICON}"
!define MUI_WELCOMEPAGE_TITLE   "Welcome to Grandma's Closet"
!define MUI_WELCOMEPAGE_TEXT    "This wizard will install Grandma's Closet on your computer.$\r$\n$\r$\nClick Next to continue."
!define MUI_FINISHPAGE_RUN      "$SYSDIR\wscript.exe"
!define MUI_FINISHPAGE_RUN_PARAMETERS  '"$INSTDIR\launch.vbs"'
!define MUI_FINISHPAGE_RUN_TEXT "Open Grandma's Closet now"
!define MUI_ABORTWARNING

; ── Wizard pages ─────────────────────────────────────────────────────────────
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

; ── Version info (shows in Properties → Details) ──────────────────────────────
VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName"     "${APP_NAME}"
VIAddVersionKey "FileDescription" "${APP_NAME} Setup"
VIAddVersionKey "FileVersion"     "${APP_VERSION}"
VIAddVersionKey "LegalCopyright"  "© 2025"

; ═══════════════════════════════════════════════════════════════════════════
Section "Install" SecMain

  ; ── Verify Node.js is present ─────────────────────────────────────────────
  DetailPrint "Checking for Node.js..."
  nsExec::ExecToStack "node --version"
  Pop $0
  ${If} $0 != 0
    MessageBox MB_OKCANCEL|MB_ICONINFORMATION \
      "Node.js is required to run Grandma's Closet.$\r$\n$\r$\nClick OK to open the Node.js download page.$\r$\nDownload and install the LTS version, then run this setup again." \
      IDOK get_node IDCANCEL cancel_install
    get_node:
      ExecShell "open" "https://nodejs.org/en/download/"
    cancel_install:
      Abort "Setup cancelled — Node.js must be installed first."
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

  ; ── Install npm dependencies ──────────────────────────────────────────────
  DetailPrint "Setting up the app (this takes about a minute, please wait)..."
  nsExec::ExecToLog 'cmd.exe /C "cd /d ""$INSTDIR"" && npm install --silent"'
  Pop $0
  ${If} $0 != 0
    MessageBox MB_OK|MB_ICONEXCLAMATION \
      "Warning: some dependencies could not be installed.$\r$\nThe app may not work correctly.$\r$\nTry running the installer again."
  ${EndIf}

  ; ── Desktop shortcut ──────────────────────────────────────────────────────
  DetailPrint "Creating shortcuts..."
  CreateShortcut \
    "$DESKTOP\Grandma's Closet.lnk" \
    "$SYSDIR\wscript.exe" \
    '"$INSTDIR\launch.vbs"' \
    "$INSTDIR\${APP_ICON}" 0

  ; ── Start Menu ────────────────────────────────────────────────────────────
  CreateDirectory "$SMPROGRAMS\Grandma's Closet"
  CreateShortcut \
    "$SMPROGRAMS\Grandma's Closet\Grandma's Closet.lnk" \
    "$SYSDIR\wscript.exe" \
    '"$INSTDIR\launch.vbs"' \
    "$INSTDIR\${APP_ICON}" 0
  CreateShortcut \
    "$SMPROGRAMS\Grandma's Closet\Uninstall Grandma's Closet.lnk" \
    "$INSTDIR\Uninstall.exe"

  ; ── Register with Windows Add/Remove Programs ─────────────────────────────
  WriteRegStr   HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
                     "DisplayName"      "${APP_NAME}"
  WriteRegStr   HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
                     "UninstallString"  '"$INSTDIR\Uninstall.exe"'
  WriteRegStr   HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
                     "DisplayIcon"      "$INSTDIR\${APP_ICON}"
  WriteRegStr   HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
                     "Publisher"        "Grandma's Closet"
  WriteRegStr   HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
                     "DisplayVersion"   "${APP_VERSION}"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
                     "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}" \
                     "NoRepair"  1
  WriteRegStr   HKCU "Software\${APP_SLUG}" "InstallDir" "$INSTDIR"

  ; ── Write uninstaller ─────────────────────────────────────────────────────
  WriteUninstaller "$INSTDIR\Uninstall.exe"

SectionEnd

; ═══════════════════════════════════════════════════════════════════════════
Section "Uninstall"

  ; Stop any running server
  nsExec::ExecToLog 'taskkill /F /FI "IMAGENAME eq node.exe" /T'

  ; Remove everything
  RMDir /r "$INSTDIR"
  Delete "$DESKTOP\Grandma's Closet.lnk"
  RMDir /r "$SMPROGRAMS\Grandma's Closet"

  ; Clean up registry
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_SLUG}"
  DeleteRegKey HKCU "Software\${APP_SLUG}"

SectionEnd
