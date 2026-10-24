@echo off
title JobFlow Assistant Server
echo ===================================================
echo Starting JobFlow Assistant Server...
echo ===================================================

cd /d "%~dp0"

:: Check if node is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found. Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

:: Open browser after a short 2-second delay in background
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

:: Start the Node.js server
node server.js

pause
