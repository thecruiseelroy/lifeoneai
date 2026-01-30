@echo off
title Git Update - Life One
cd /d "%~dp0"

if exist "%~dp0deploy-env.bat" call "%~dp0deploy-env.bat"

echo.
echo Life One - build and push...
echo.

echo Building life-one-app...
cd life-one-app
call npm run build
if errorlevel 1 (
  echo.
  echo BUILD FAILED. See above.
  cd ..
  goto :finish
)
cd ..

if defined FTP_HOST (
  echo Deploying to Hostinger...
  cd life-one-app
  call npm run deploy:hostinger
  if errorlevel 1 (
    echo.
    echo DEPLOY FAILED. See above.
    cd ..
  ) else (
    cd ..
    echo Deploy done.
  )
  echo.
) else (
  echo Skipping Hostinger deploy ^(set FTP_HOST, FTP_USER, FTP_PASSWORD to enable^).
  echo.
)

echo Pushing to GitHub...
git add .
if errorlevel 1 (
  echo git add failed.
  goto :finish
)

git status
echo.

REM Build commit message without dot (%%time%% can be "12:34:56.78" which breaks batch)
set "COMMIT_MSG=update %date% %time:~0,8%"
set "COMMIT_MSG=%COMMIT_MSG: =0%"
git commit -m "%COMMIT_MSG%" 2>nul
if errorlevel 1 (
  echo Nothing to commit or commit failed.
) else (
  git push
  if errorlevel 1 ( echo git push failed. Check remote and branch. )
)

:finish
echo.
echo ----------------------------------------
echo Finished. Press any key to close this window.
echo ----------------------------------------
pause
