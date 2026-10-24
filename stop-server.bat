@echo off
echo Stopping JobFlow server on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a
    echo Server stopped successfully.
    pause
    exit /b
)
echo No server found running on port 3000.
pause
