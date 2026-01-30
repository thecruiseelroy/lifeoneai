@echo off
title Git Update - Life One
cd /d "%~dp0"
set "DBG_LOG=%~dp0life-one-app\.cursor\debug.log"
REM #region agent log
echo ^{^"m^":^"start^",^"loc^":^"gitupdate.bat^",^"h^":^"H1^"^}>> "%DBG_LOG%"
REM #endregion

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
REM #region agent log
echo ^{^"m^":^"after_build^",^"loc^":^"gitupdate.bat^",^"h^":^"H2^"^}>> "%DBG_LOG%"
REM #endregion

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
REM #region agent log
echo ^{^"m^":^"before_commit_msg^",^"loc^":^"gitupdate.bat^",^"h^":^"H5^"^}>> "%DBG_LOG%"
REM #endregion
set "COMMIT_MSG=update %date% %time:~0,8%"
REM #region agent log
echo ^{^"m^":^"after_set_raw^",^"loc^":^"gitupdate.bat^",^"h^":^"H5^"^}>> "%DBG_LOG%"
REM #endregion
set "COMMIT_MSG=%COMMIT_MSG: =0%"
REM #region agent log
echo ^{^"m^":^"before_git_commit^",^"loc^":^"gitupdate.bat^",^"h^":^"H1^"^}>> "%DBG_LOG%"
REM #endregion
git commit -m "%COMMIT_MSG%" 2>nul
if errorlevel 1 (
  echo Nothing to commit or commit failed.
) else (
  git push
  if errorlevel 1 ( echo git push failed. Check remote and branch. )
)

:finish
REM #region agent log
echo ^{^"m^":^"finish^",^"loc^":^"gitupdate.bat^",^"h^":^"H4^"^}>> "%DBG_LOG%"
REM #endregion
echo.
echo ----------------------------------------
echo Finished. Press any key to close this window.
echo ----------------------------------------
pause
