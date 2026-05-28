@echo off
title Obesity Execute - MOVE
color 0C
cls
echo.
echo ============================================
echo   Obesity File - ACTUAL MOVE (destructive)
echo ============================================
echo.
echo WARNING: Original files will be MOVED.
echo They will be removed from F:\NewFolder\...
echo and placed under F:\BimanData\
echo.
echo Did you run 1_preview.bat first and check the list?
echo.
echo Press any key to continue or close window (X) to cancel.
echo.
pause

echo.
echo Starting PowerShell...
echo.

powershell -NoExit -ExecutionPolicy Bypass -NoProfile -File "%~dp0obesity_collect.ps1" -Mode Execute

echo.
echo ============================================
echo   Batch script finished. ErrorLevel=%ERRORLEVEL%
echo ============================================
echo.
echo Log file: %~dp0obesity_log.txt
echo Result folder: F:\BimanData\
echo.
pause
