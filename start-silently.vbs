Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.Run "cmd /c node server.js", 0, False
WshShell.Run "cmd /c timeout /t 2 /nobreak >nul && start http://localhost:3000", 0, False
