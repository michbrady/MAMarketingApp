# Getting Started - UnFranchise Marketing App

## Quick Start Guide

This guide will help you get the UnFranchise Marketing App up and running on your local development environment.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or later ([Download](https://nodejs.org/))
- **npm** 10.x or later (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Microsoft SQL Server** 2019 or later, OR **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))

## Project Structure

```
MAMarketingApp/
├── frontend/              # Next.js frontend application
├── backend/               # Node.js/TypeScript backend API
├── database/              # SQL Server database scripts
├── docs/                  # Project documentation
│   ├── architecture/      # Architecture documentation
│   ├── PROJECT_PLAN.md
│   └── QA-Testing-Strategy.md
├── docker-compose.yml     # Docker services configuration
├── .env.example           # Environment variables template
└── README.md              # This file
```

## Installation Options

### Option 1: Docker (Recommended for Quick Start)

This is the easiest way to get started. Docker will handle SQL Server, Redis, and all application services.

#### 1. Clone the repository
```bash
git clone <repository-url>
cd MAMarketingApp
```

#### 2. Copy environment variables
```bash
cp .env.example .env
```

#### 3. Start all services with Docker Compose
```bash
docker-compose up -d
```

This will start:
- **SQL Server** on port `1433`
- **Redis** on port `6379`
- **Backend API** on port `3001`
- **Frontend** on port `3000`

#### 4. Initialize the database
```bash
# Wait for SQL Server to be ready (about 30 seconds)
docker-compose exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong@Password123" -i /docker-entrypoint-initdb.d/10_Master_Deploy.sql -C
```

#### 5. Access the application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/v1
- **API Health Check**: http://localhost:3001/health

---

### Option 2: Local Development (Without Docker)

If you prefer to run services locally or already have SQL Server installed.

#### 1. Install SQL Server

**Windows**: Install SQL Server Developer Edition
- Download from [Microsoft SQL Server Downloads](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
- Or use SQL Server Express

**macOS/Linux**: Use Docker for SQL Server
```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong@Password123" \
  -p 1433:1433 --name sqlserver \
  -d mcr.microsoft.com/mssql/server:2022-latest
```

#### 2. Install Redis

**Windows**:
- Download from [Redis Windows](https://github.com/microsoftarchive/redis/releases)
- Or use Docker: `docker run --name redis -p 6379:6379 -d redis:7-alpine`

**macOS**:
```bash
brew install redis
brew services start redis
```

**Linux**:
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

#### 3. Set up the database
```bash
# Navigate to database folder
cd database

# Run the master deployment script using sqlcmd
sqlcmd -S localhost -U sa -P "YourStrong@Password123" -i 10_Master_Deploy.sql
```

#### 4. Set up the backend
```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your database credentials

# Start development server
npm run dev
```

Backend will run on **http://localhost:3001**

#### 5. Set up the frontend
```bash
cd frontend

# Install dependencies (already done if you ran the setup)
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1" > .env.local

# Start development server
npm run dev
```

Frontend will run on **http://localhost:3000**

---

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=YourStrong@Password123
DB_NAME=unfranchise_marketing

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_development_secret_key_here
JWT_REFRESH_SECRET=your_development_refresh_secret_here

# External Services (Optional for development)
SENDGRID_API_KEY=your_key
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

---

## Verify Installation

### 1. Check Backend Health
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-04-04T...",
  "uptime": 123.45,
  "environment": "development"
}
```

### 2. Check Database Connection
```bash
# Using sqlcmd
sqlcmd -S localhost -U sa -P "YourStrong@Password123" -Q "SELECT DB_NAME() AS CurrentDatabase"

# Or using Docker
docker-compose exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong@Password123" -Q "SELECT DB_NAME()" -C
```

### 3. Check Redis Connection
```bash
redis-cli ping
# Should return: PONG

# Or using Docker
docker-compose exec redis redis-cli ping
```

### 4. Access Frontend
Open http://localhost:3000 in your browser

---

## Development Workflow

### Running Backend Tests
```bash
cd backend
npm test
```

### Running Frontend Tests
```bash
cd frontend
npm test
```

### Building for Production

**Backend**:
```bash
cd backend
npm run build
npm start
```

**Frontend**:
```bash
cd frontend
npm run build
npm start
```

---

## Common Issues & Troubleshooting

### Port Already in Use
If ports 3000, 3001, 1433, or 6379 are already in use:

```bash
# Find process using port (Windows)
netstat -ano | findstr :3000

# Find process using port (macOS/Linux)
lsof -i :3000

# Kill the process or change the port in .env files
```

### SQL Server Connection Issues

**Error**: "Login failed for user 'sa'"
- Check your password in `.env` matches SQL Server password
- Ensure SQL Server authentication is enabled

**Error**: "Cannot connect to localhost:1433"
- Verify SQL Server is running
- Check firewall settings

### Backend Won't Start

**Error**: "Cannot find module"
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Frontend Build Errors

```bash
cd frontend
rm -rf node_modules .next package-lock.json
npm install
npm run dev
```

---

## Next Steps

### For Developers

1. **Read the Architecture Docs**
   - `docs/architecture/FRONTEND_ARCHITECTURE.md`
   - `docs/architecture/ARCHITECTURE.md` (Backend)
   - `docs/architecture/API_SPECIFICATION.yaml`

2. **Review the Project Plan**
   - `docs/PROJECT_PLAN.md`

3. **Check Component Specifications**
   - `docs/architecture/COMPONENT_SPECIFICATIONS.md`

4. **Review Testing Strategy**
   - `docs/QA-Testing-Strategy.md`

### For Project Managers

1. **Review Project Plan**: `docs/PROJECT_PLAN.md`
2. **Check Timeline**: Phase 1 MVP is 16 weeks
3. **Review Risks**: Risk management section in project plan

### For QA Engineers

1. **Review QA Strategy**: `docs/QA-Testing-Strategy.md`
2. **Set up Test Environment**: Follow installation steps above
3. **Review Test Cases**: 40+ test cases in QA document

---

## Development Commands Reference

### Backend
```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm start            # Start production server
npm test             # Run tests
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm test             # Run tests
```

### Docker
```bash
docker-compose up -d              # Start all services in background
docker-compose down               # Stop all services
docker-compose logs -f backend    # View backend logs
docker-compose logs -f frontend   # View frontend logs
docker-compose restart            # Restart all services
docker-compose ps                 # View running services
```

---

## Database Management

### Run SQL Scripts
```bash
# Run specific script
sqlcmd -S localhost -U sa -P "YourStrong@Password123" -d unfranchise_marketing -i database/07_Seed_Data.sql

# Or with Docker
docker-compose exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong@Password123" -d unfranchise_marketing -i /docker-entrypoint-initdb.d/07_Seed_Data.sql -C
```

### Backup Database
```bash
sqlcmd -S localhost -U sa -P "YourStrong@Password123" -Q "BACKUP DATABASE unfranchise_marketing TO DISK='C:\backup\unfranchise_marketing.bak'"
```

### View Database Tables
```bash
sqlcmd -S localhost -U sa -P "YourStrong@Password123" -d unfranchise_marketing -Q "SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES"
```

---

## Support

For questions or issues:
1. Check the documentation in the `docs/` folder
2. Review the troubleshooting section above
3. Contact the development team

---

## License

Proprietary - Market America, Inc.
