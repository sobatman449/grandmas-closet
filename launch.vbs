' Grandma's Closet — Launcher
' Double-click this to open the app. No window will appear.

Set shell = CreateObject("WScript.Shell")
Set fso   = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

shell.Run "cmd.exe /c """ & scriptDir & "\launch.bat""", 0, False
