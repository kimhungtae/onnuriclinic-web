@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "LOG=%~dp0push_log.txt"
echo ============================================ > "%LOG%"
echo   Onnuri - Diagnostic Push >> "%LOG%"
echo   %DATE% %TIME% >> "%LOG%"
echo ============================================ >> "%LOG%"
echo. >> "%LOG%"

echo --- 0. Cleaning git lock files --- >> "%LOG%"
if exist ".git\HEAD.lock" (del /f /q ".git\HEAD.lock" >> "%LOG%" 2>&1 && echo Removed HEAD.lock >> "%LOG%")
if exist ".git\index.lock" (del /f /q ".git\index.lock" >> "%LOG%" 2>&1 && echo Removed index.lock >> "%LOG%")
if exist ".git\refs\heads\main.lock" (del /f /q ".git\refs\heads\main.lock" >> "%LOG%" 2>&1 && echo Removed heads/main.lock >> "%LOG%")
if exist ".git\refs\remotes\origin\main.lock" (del /f /q ".git\refs\remotes\origin\main.lock" >> "%LOG%" 2>&1 && echo Removed origin/main.lock >> "%LOG%")
if exist ".git\objects\maintenance.lock" (del /f /q ".git\objects\maintenance.lock" >> "%LOG%" 2>&1 && echo Removed maintenance.lock >> "%LOG%")
if exist "test_write_check.txt" (del /f /q "test_write_check.txt" >> "%LOG%" 2>&1 && echo Removed test_write_check.txt >> "%LOG%")
echo Lock cleanup done. >> "%LOG%"
echo. >> "%LOG%"

echo --- 1. Sync mobile from index --- >> "%LOG%"
copy /Y "index.html" "onnuri_clinic (3)_mobile.html" >> "%LOG%" 2>&1
echo. >> "%LOG%"

echo --- 2. git status BEFORE add --- >> "%LOG%"
git status --short >> "%LOG%" 2>&1
echo. >> "%LOG%"

echo --- 3. git add -A --- >> "%LOG%"
git add -A >> "%LOG%" 2>&1
echo errorlevel=!errorlevel! >> "%LOG%"
echo. >> "%LOG%"

echo --- 4. git status AFTER add --- >> "%LOG%"
git status --short >> "%LOG%" 2>&1
echo. >> "%LOG%"

echo --- 5. git diff --cached --stat --- >> "%LOG%"
git diff --cached --stat >> "%LOG%" 2>&1
echo. >> "%LOG%"

echo --- 6. git commit --- >> "%LOG%"
for /f "delims=" %%I in ('powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd HH:mm'"') do set "dt=%%I"
git commit -m "Add treatment detail modals - !dt!" >> "%LOG%" 2>&1
echo errorlevel=!errorlevel! >> "%LOG%"
echo. >> "%LOG%"

echo --- 7. git log -3 --- >> "%LOG%"
git log --oneline -3 >> "%LOG%" 2>&1
echo. >> "%LOG%"

echo --- 8. git push origin main --- >> "%LOG%"
git push origin main >> "%LOG%" 2>&1
echo errorlevel=!errorlevel! >> "%LOG%"
echo. >> "%LOG%"

echo --- 9. git log -3 (after push) --- >> "%LOG%"
git log --oneline -3 >> "%LOG%" 2>&1
echo. >> "%LOG%"

echo ============================================ >> "%LOG%"
echo   Done. Log saved to push_log.txt >> "%LOG%"
echo ============================================ >> "%LOG%"

echo.
echo ============================================
echo   Done! Check push_log.txt for details.
echo ============================================
echo.
echo Press any key to close...
pause >nul
exit /b 0
