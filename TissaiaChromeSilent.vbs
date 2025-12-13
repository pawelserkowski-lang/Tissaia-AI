' TISSAIA AI - Silent Chrome App Launcher
' This script starts the servers completely hidden (no visible terminal)
' and launches Chrome in app mode

Option Explicit

Dim WshShell, fso, scriptDir, chromePath

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the directory where this script is located
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Change to script directory
WshShell.CurrentDirectory = scriptDir

' Start the servers completely hidden (no window at all)
' Using vbHide (0) makes the window invisible
WshShell.Run "cmd /c npm run dev:all", 0, False

' Wait for servers to start
WScript.Sleep 5000

' Find Chrome
chromePath = ""

If fso.FileExists(WshShell.ExpandEnvironmentStrings("%ProgramFiles%\Google\Chrome\Application\chrome.exe")) Then
    chromePath = WshShell.ExpandEnvironmentStrings("%ProgramFiles%\Google\Chrome\Application\chrome.exe")
ElseIf fso.FileExists(WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe")) Then
    chromePath = WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe")
ElseIf fso.FileExists(WshShell.ExpandEnvironmentStrings("%LocalAppData%\Google\Chrome\Application\chrome.exe")) Then
    chromePath = WshShell.ExpandEnvironmentStrings("%LocalAppData%\Google\Chrome\Application\chrome.exe")
ElseIf fso.FileExists(WshShell.ExpandEnvironmentStrings("%ProgramFiles%\Microsoft\Edge\Application\msedge.exe")) Then
    chromePath = WshShell.ExpandEnvironmentStrings("%ProgramFiles%\Microsoft\Edge\Application\msedge.exe")
ElseIf fso.FileExists(WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe")) Then
    chromePath = WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe")
End If

If chromePath <> "" Then
    ' Launch Chrome/Edge in app mode
    WshShell.Run """" & chromePath & """ --app=http://localhost:5174 --window-size=1280,800", 1, False
Else
    ' Fallback to default browser
    WshShell.Run "http://localhost:5174", 1, False
End If

Set fso = Nothing
Set WshShell = Nothing
