#!/bin/bash

echo "=========================================="
echo "Testing UnFranchise Marketing App Auth API"
echo "=========================================="
echo ""

# Start backend server in background
echo "Starting backend server..."
npm run dev > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 5

echo "Testing login endpoint..."
echo ""

# Test login with UFO user
echo "1. Testing UFO login (ufo@unfranchise.com / ufo123):"
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ufo@unfranchise.com","password":"ufo123"}' \
  | python -m json.tool

echo ""
echo ""

# Test login with admin user
echo "2. Testing Admin login (admin@unfranchise.com / admin123):"
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@unfranchise.com","password":"admin123"}' \
  | python -m json.tool

echo ""
echo ""

# Test invalid login
echo "3. Testing invalid login:"
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}' \
  | python -m json.tool

echo ""
echo ""

# Cleanup
echo "Stopping server..."
kill $SERVER_PID
echo "Done!"
