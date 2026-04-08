@echo off
REM UnFranchise Marketing App - Stop Script (Windows)

echo.
echo ========================================
echo   Stopping UnFranchise Marketing App
echo ========================================
echo.

echo [STOP] Stopping processes on port 3001 (Backend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo   Killing PID: %%a
    taskkill /F /PID %%a >nul 2>nul
)

echo.
echo [STOP] Stopping processes on port 3000 (Frontend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo   Killing PID: %%a
    taskkill /F /PID %%a >nul 2>nul
)

echo.
echo [DONE] All services stopped
echo.
pause
