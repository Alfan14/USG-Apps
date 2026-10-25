' USG Recorder - Silent Launcher
' Executes run-kiosk.ps1 completely hidden without console window flicker.

Dim fso, scriptDir, installRoot, psScript, shell, cmd
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
psScript = scriptDir & "\run-kiosk.ps1"

Set shell = CreateObject("WScript.Shell")
cmd = "powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File """ & psScript & """"
shell.Run cmd, 0, False
