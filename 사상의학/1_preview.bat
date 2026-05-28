@echo off
title Obesity Preview
cls
echo.
echo ============================================
echo   Obesity File - PREVIEW MODE (safe)
echo ============================================
echo.
echo This will scan F: drive and create a list of files
echo that would be moved. It does NOT move any files yet.
echo.
echo Starting PowerShell...
echo.

powershell -NoExit -ExecutionPolicy Bypass -NoProfile -File "%~dp0obesity_collect.ps1" -Mode Preview

echo.
echo ============================================
echo   Batch script finished. ErrorLevel=%ERRORLEVEL%
echo ============================================
echo.
echo Log file: %~dp0obesity_log.txt
echo.
pause
