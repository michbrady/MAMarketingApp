# 🚀 Quick Start Guide

## Starting the Application

### Windows Users

**Double-click** `start.bat` or run in Command Prompt:
```cmd
start.bat
```

This will:
- ✅ Check Node.js and npm are installed
- ✅ Install dependencies if needed
- ✅ Create environment files if missing
- ✅ Start backend server (Port 3001)
- ✅ Start frontend server (Port 3000)
- ✅ Open in separate windows

### Mac/Linux Users (or Git Bash on Windows)

Run in terminal:
```bash
./start.sh
```

Or if permission denied:
```bash
chmod +x start.sh
./start.sh
```

---

## Accessing the Application

**Wait 10-15 seconds** for services to start, then:

**Open Browser**: http://localhost:3000

**Test Credentials**:
```
Email:    ufo@unfranchise.com
Password: ufo123
```

---

## Stopping the Application

### Windows
- **Double-click** `stop.bat`, OR
- Close the Backend and Frontend command windows, OR
- Press `Ctrl+C` in each window

### Mac/Linux
```bash
./stop.sh
```

Or press `Ctrl+C` in the terminal where `start.sh` is running.

---

## Checking Status

### Backend API
- **Health Check**: http://localhost:3001/health
- **API Base**: http://localhost:3001/api/v1

### Frontend
- **Application**: http://localhost:3000

---

## Troubleshooting

### Port Already in Use

If you see "port already in use" errors:

**Windows**:
```cmd
stop.bat
start.bat
```

**Mac/Linux**:
```bash
./stop.sh
./start.sh
```

### Dependencies Not Installing

**Backend**:
```cmd
cd backend
npm install
cd ..
```

**Frontend**:
```cmd
cd frontend
npm install
cd ..
```

### Database Connection Issues

1. Check SQL Server is running
2. Verify credentials in `backend/.env`:
   ```env
   DB_HOST=your-server
   DB_USER=your-username
   DB_PASSWORD=your-password
   DB_NAME=UnFranchiseMarketing
   ```

### Clear Cache and Restart

**Windows**:
```cmd
cd backend
rd /s /q node_modules
npm install
cd ..\frontend
rd /s /q node_modules .next
npm install
cd ..
start.bat
```

**Mac/Linux**:
```bash
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules .next && npm install
cd ..
./start.sh
```

---

## System Requirements

- **Node.js**: 20.x or higher
- **npm**: 10.x or higher
- **SQL Server**: 2019 or higher (with database already set up)
- **RAM**: 2GB minimum (4GB recommended)
- **OS**: Windows 10/11, macOS, Linux

---

## What Gets Started

### Backend Server (Port 3001)
- Express.js API server
- Database connections
- Authentication endpoints
- Business logic services

### Frontend Server (Port 3000)
- Next.js 15.1.3 application
- React UI components
- Client-side routing
- Hot module replacement

---

## First Time Setup

If this is your first time running the app:

1. **Run the startup script** (it will handle most setup)
2. **Edit `backend/.env`** if database credentials are wrong
3. **Wait for services to start** (10-15 seconds)
4. **Open browser** to http://localhost:3000
5. **Login** with test credentials

---

## Development Workflow

### Daily Development
```cmd
start.bat          # Start everything
# ... do your work ...
stop.bat           # Stop everything when done
```

### Running Tests
```cmd
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Building for Production
```cmd
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

---

## Log Files (Mac/Linux only)

When using `start.sh`, logs are written to:
- `backend.log` - Backend server output
- `frontend.log` - Frontend server output

View logs in real-time:
```bash
tail -f backend.log
tail -f frontend.log
```

---

## Need Help?

- **Documentation**: See project README.md and docs/ folder
- **Startup Issues**: Check the error messages in the command windows
- **Database Issues**: See `DATABASE_SETUP_SUMMARY.md`
- **Memory Issues**: See `MEMORY_ISSUE_RESOLVED.md`

---

**Last Updated**: April 8, 2026
