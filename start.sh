#!/bin/bash
# UnFranchise Marketing App - Startup Script (Cross-Platform)
# Last Updated: April 8, 2026

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "========================================"
echo "  UnFranchise Marketing App"
echo "  Starting Development Environment"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Node.js is not installed or not in PATH"
    echo "Please install Node.js 20.x or higher from https://nodejs.org"
    exit 1
fi

# Display Node.js version
echo -e "${GREEN}[CHECK]${NC} Node.js version:"
node --version
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} npm is not installed or not in PATH"
    exit 1
fi

# Display npm version
echo -e "${GREEN}[CHECK]${NC} npm version:"
npm --version
echo ""

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}[INSTALL]${NC} Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    echo ""
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}[INSTALL]${NC} Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo ""
fi

# Check if backend .env exists
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}[WARNING]${NC} backend/.env file not found"
    echo -e "${BLUE}[INFO]${NC} Copying from .env.example..."
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}[ACTION REQUIRED]${NC} Please edit backend/.env with your database credentials"
    echo ""
fi

# Check if frontend .env.local exists
if [ ! -f "frontend/.env.local" ]; then
    echo -e "${YELLOW}[WARNING]${NC} frontend/.env.local file not found"
    echo -e "${BLUE}[INFO]${NC} Creating with default values..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1" > frontend/.env.local
    echo ""
fi

echo "========================================"
echo "  Starting Services"
echo "========================================"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}[CLEANUP]${NC} Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}[DONE]${NC} Services stopped"
    exit 0
}

# Trap Ctrl+C and cleanup
trap cleanup SIGINT SIGTERM

# Kill any existing processes on ports 3000 and 3001
echo -e "${BLUE}[CLEANUP]${NC} Checking for processes on ports 3000 and 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
echo ""

# Start backend
echo -e "${GREEN}[START]${NC} Starting Backend Server (Port 3001)..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 3
echo ""

# Start frontend
echo -e "${GREEN}[START]${NC} Starting Frontend Server (Port 3000)..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
sleep 5
echo ""

# Check if services are running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}[ERROR]${NC} Backend failed to start. Check backend.log for details."
    exit 1
fi

if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}[ERROR]${NC} Frontend failed to start. Check frontend.log for details."
    exit 1
fi

echo "========================================"
echo "  Services Started Successfully!"
echo "========================================"
echo ""
echo -e "${GREEN}Backend API:${NC}  http://localhost:3001/api/v1"
echo -e "${GREEN}Frontend UI:${NC}  http://localhost:3000"
echo ""
echo -e "${BLUE}Health Check:${NC} http://localhost:3001/health"
echo ""
echo "========================================"
echo "  Test Credentials"
echo "========================================"
echo ""
echo -e "${BLUE}Email:${NC}    ufo@unfranchise.com"
echo -e "${BLUE}Password:${NC} ufo123"
echo ""
echo "========================================"
echo ""
echo -e "${BLUE}[INFO]${NC} Logs are being written to:"
echo "  - backend.log"
echo "  - frontend.log"
echo ""
echo -e "${YELLOW}[TIP]${NC} Press Ctrl+C to stop all services"
echo -e "${YELLOW}[TIP]${NC} Wait 10-15 seconds for frontend to fully start"
echo ""
echo -e "${GREEN}[READY]${NC} Application is running. Open: http://localhost:3000"
echo ""

# Wait for user to press Ctrl+C
wait
