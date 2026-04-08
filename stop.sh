#!/bin/bash
# UnFranchise Marketing App - Stop Script (Cross-Platform)

echo ""
echo "========================================"
echo "  Stopping UnFranchise Marketing App"
echo "========================================"
echo ""

echo "[STOP] Stopping processes on port 3001 (Backend)..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "  No processes found on port 3001"

echo ""
echo "[STOP] Stopping processes on port 3000 (Frontend)..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "  No processes found on port 3000"

echo ""
echo "[DONE] All services stopped"
echo ""
