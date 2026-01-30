@echo off
title Life One API
cd /d "%~dp0"

echo.
echo [Life One API] Working dir: %CD%
echo.

if not exist .venv (
  echo [Life One API] Creating .venv...
  python -m venv .venv
  if errorlevel 1 ( echo FAILED to create venv. Install Python. & pause & exit /b 1 )
)

set PY=%CD%\.venv\Scripts\python.exe
if not exist "%PY%" ( echo .venv\Scripts\python.exe not found. & pause & exit /b 1 )

echo [Life One API] Installing deps...
"%PY%" -m pip install -r requirements.txt -q
if errorlevel 1 ( echo FAILED pip install. & pause & exit /b 1 )

echo.
echo [Life One API] Starting at http://localhost:8765
echo [Life One API] Leave this window open. Close it to stop the API.
echo.
"%PY%" -m uvicorn main:app --port 8765

echo.
echo [Life One API] Server stopped.
pause
