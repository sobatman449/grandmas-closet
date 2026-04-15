' My Closet — Windows Launcher
' This file hides the terminal window entirely.
' Double-click ME (launch-windows.vbs) — not the .bat file.

Dim shell, fso, scriptDir, splashProc

Set shell = CreateObject("WScript.Shell")
Set fso   = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Show the friendly splash window (runs async)
Dim splashPath
splashPath = scriptDir & "\launcher-splash.hta"
If fso.FileExists(splashPath) Then
    shell.Run "mshta.exe """ & splashPath & """", 1, False
End If

' Run the actual worker batch silently (window style 0 = hidden, wait = False)
shell.Run "cmd.exe /c """ & scriptDir & "\launch-windows-worker.bat""", 0, False
