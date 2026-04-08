@echo off
REM UnFranchise Marketing App - Startup Script (Windows)
REM Last Updated: April 8, 2026

echo.
echo ========================================
echo   UnFranchise Marketing App
echo   Starting Development Environment
echo ========================================
echo.

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
    cd ..
    echo.
)

REM Check if frontend dependencies are installed
if not exist "frontend\node_modules" (
    echo [INSTALL] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo.
)

REM Check if backend .env exists
if not exist "backend\.env" (
    echo [WARNING] backend\.env file not found
    echo [INFO] Copying from .env.example...
    copy backend\.env.example backend\.env >nul
    echo [ACTION REQUIRED] Please edit backend\.env with your database credentials
    echo.
)

REM Check if frontend .env.local exists
if not exist "frontend\.env.local" (
    echo [WARNING] frontend\.env.local file not found
    echo [INFO] Creating with default values...
    echo NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1 > frontend\.env.local
    echo.
)

echo ========================================
echo   Starting Services
echo ========================================
echo.

REM Kill any existing node processes on ports 3000 and 3001
echo [CLEANUP] Checking for processes on ports 3000 and 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    taskkill /F /PID %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /F /PID %%a >nul 2>nul
)
echo.

echo [START] Starting Backend Server (Port 3001)...
start "UnFranchise Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
echo.

echo [START] Starting Frontend Server (Port 3000)...
start "UnFranchise Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 5 /nobreak >nul
echo.

echo ========================================
echo   Services Started Successfully!
echo ========================================
echo.
echo Backend API:  http://localhost:3001/api/v1
echo Frontend UI:  http://localhost:3000
echo.
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
echo [INFO] Close those windows to stop the servers
echo [INFO] Or press Ctrl+C in each window
echo.
echo [TIP] Wait 10-15 seconds for frontend to fully start
echo [TIP] Then open: http://localhost:3000
echo.

pause
