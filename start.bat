@echo off
REM UnFranchise Marketing App - Startup Script (Windows)
REM Last Updated: April 8, 2026

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   UnFranchise Marketing App
echo   Starting Development Environment
echo ========================================
echo.

REM Get the directory where this batch file is located
set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 20.x or higher from https://nodejs.org
    pause
    exit /b 1
)

REM Display Node.js version
echo [CHECK] Node.js version:
node --version
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed or not in PATH
    pause
    exit /b 1
)

REM Display npm version
echo [CHECK] npm version:
npm --version
echo.

REM Check if backend dependencies are installed
if not exist "backend\node_modules" (
    echo [INSTALL] Installing backend dependencies...
    cd backend
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install backend dependencies
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo.
)

REM Check if frontend dependencies are installed
if not exist "frontend\node_modules" (
    echo [INSTALL] Installing frontend dependencies...
    cd frontend
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install frontend dependencies
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo.
)

REM Check if backend .env exists
if not exist "backend\.env" (
    echo [WARNING] backend\.env file not found
    if exist "backend\.env.example" (
        echo [INFO] Copying from .env.example...
        copy backend\.env.example backend\.env >nul
        echo [ACTION REQUIRED] Please edit backend\.env with your database credentials
        echo.
    ) else (
        echo [ERROR] backend\.env.example not found!
        pause
        exit /b 1
    )
)

REM Check if frontend .env.local exists
if not exist "frontend\.env.local" (
    echo [INFO] Creating frontend\.env.local with default values...
    echo NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1 > frontend\.env.local
    echo.
)

echo ========================================
echo   Cleaning Up Old Processes
echo ========================================
echo.

REM Kill any existing node processes on ports 3000 and 3001
echo [CLEANUP] Stopping processes on port 3001 (Backend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo [CLEANUP] Stopping processes on port 3000 (Frontend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>nul
)
echo [CLEANUP] Done
echo.

echo ========================================
echo   Starting Services
echo ========================================
echo.

REM Start Backend
echo [START] Starting Backend Server (Port 3001)...
start "UnFranchise Backend" cmd /k "cd /d "%ROOT_DIR%backend" && npm run dev"

REM Wait for backend to start
echo [WAIT] Waiting for backend to initialize (5 seconds)...
timeout /t 5 /nobreak >nul
echo.

REM Start Frontend
echo [START] Starting Frontend Server (Port 3000)...
start "UnFranchise Frontend" cmd /k "cd /d "%ROOT_DIR%frontend" && npm run dev"

REM Wait for frontend to start
echo [WAIT] Waiting for frontend to initialize (8 seconds)...
timeout /t 8 /nobreak >nul
echo.

echo ========================================
echo   Services Started!
echo ========================================
echo.
echo Backend API:  http://localhost:3001/api/v1
echo Frontend UI:  http://localhost:3000
echo Health Check: http://localhost:3001/health
echo.
echo ========================================
echo   Test Credentials
echo ========================================
echo.
echo Email:    ufo@unfranchise.com
echo Password: ufo123
echo.
echo ========================================
echo.
echo [INFO] Backend and Frontend are running in separate windows
echo [INFO] Check those windows for any errors or startup messages
echo [INFO] Close those windows or press Ctrl+C to stop the servers
echo.
echo [BROWSER] Opening http://localhost:3000 in your default browser...
start http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul
