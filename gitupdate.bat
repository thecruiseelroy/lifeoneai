@echo off
title Git Update - Life One
cd /d "%~dp0"

echo.
echo Life One - pushing to GitHub...
echo.

git add .
if errorlevel 1 ( echo git add failed. & pause & exit /b 1 )

git status
echo.

git commit -m "update %date% %time%" 2>nul
if errorlevel 1 (
  echo Nothing to commit or commit failed.
) else (
  git push
  if errorlevel 1 ( echo git push failed. Check remote and branch. )
)

echo.
pause
