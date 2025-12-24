@echo off
REM Batch file wrapper to run PowerShell cleanup then Next.js
REM This ensures proper sequencing on Windows

@echo off
REM Change to script directory to ensure paths work
cd /d "%~dp0.."

REM Run PowerShell cleanup
echo Running cleanup...
powershell -ExecutionPolicy Bypass -File "%~dp0pre-dev.ps1"
set CLEANUP_EXIT=%ERRORLEVEL%
if %CLEANUP_EXIT% NEQ 0 (
    echo.
    echo ❌ Cleanup failed with exit code %CLEANUP_EXIT%. Exiting.
    exit /b %CLEANUP_EXIT%
)

REM Small delay to ensure file system is ready
echo Waiting for file system to be ready...
timeout /t 2 /nobreak >nul 2>&1

REM Verify lock file doesn't exist
if exist ".next\dev\lock" (
    echo ⚠️  WARNING: Lock file still exists after cleanup!
    echo Attempting to remove it...
    del /F /Q ".next\dev\lock" 2>nul
    if exist ".next\dev\lock" (
        echo ❌ Cannot remove lock file. Please manually delete .next\dev directory.
        exit /b 1
    )
    echo ✅ Removed lock file
)

echo.
echo 🚀 Starting Next.js dev server...
echo.

REM Start Next.js - use start /wait to ensure proper process handling
npx next dev
set NEXT_EXIT=%ERRORLEVEL%

if %NEXT_EXIT% NEQ 0 (
    echo.
    echo ❌ Next.js failed with exit code %NEXT_EXIT%
)

exit /b %NEXT_EXIT%

