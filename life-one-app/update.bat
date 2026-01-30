@echo off
title Life One - Update dist (clean rebuild)
cd /d "%~dp0"

echo.
echo Life One - deleting dist and rebuilding...
echo.

if exist dist (
  rmdir /s /q dist
  echo Deleted dist.
) else (
  echo No dist folder to delete.
)

echo.
echo Building (npm run build)...
echo.
call npm run build
if errorlevel 1 (
  echo.
  echo Build FAILED.
  pause
  exit /b 1
)

echo.
echo Done. dist\ is ready to upload to Hostinger.
echo.
pause
