@echo off
title Life One - Dev Server
set "ROOT=%~dp0.."
set "API_DIR=%ROOT%\life-one-api"
set "APP_DIR=%~dp0"

echo.
echo Life One - starting API and app...
echo.

REM Start the API in a new window (creates venv + installs deps if needed)
echo Starting API (life-one-api) in new window...
start "Life One API" cmd /k "cd /d "%API_DIR%" && call start.bat"

REM Give the API a moment to bind
timeout /t 3 /nobreak > nul

REM Open browser after a few seconds (give Vite time to be ready)
start /B cmd /c "timeout /t 4 /nobreak > nul && start http://localhost:5173/"

echo Starting app (Vite)...
echo.
cd /d "%APP_DIR%"
npm run dev
pause
