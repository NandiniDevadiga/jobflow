@echo off
title Push JobFlow to GitHub
echo ===================================================
echo Pushing JobFlow to https://github.com/NandiniDevadiga/jobflow ...
echo ===================================================

cd /d "%~dp0"
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ===================================================
    echo SUCCESS! Your code has been uploaded to GitHub!
    echo ===================================================
) else (
    echo.
    echo [NOTE] If you saw "Repository not found", please ensure you
    echo created the repository named "jobflow" at https://github.com/new
)

pause
