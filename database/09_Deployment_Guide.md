# Database Deployment Guide
## UnFranchise Marketing App

## Prerequisites

### System Requirements
- Microsoft SQL Server 2019 or later (Enterprise or Standard Edition)
- Minimum 32 GB RAM (64 GB recommended for production)
- SSD storage with 10,000+ IOPS
- SQL Server Management Studio (SSMS) 18.0 or later

### Permissions Required
- `sysadmin` role for initial deployment
- `db_owner` role for ongoing maintenance
- SQL Server Agent enabled for scheduled jobs

## Deployment Steps

### 1. Create Database

```sql
-- Create the database with appropriate settings
CREATE DATABASE UnFranchiseMarketingApp
ON PRIMARY (
    NAME = N'UnFranchiseMarketingApp_Data',
    FILENAME = N'C:\SQLData\UnFranchiseMarketingApp_Data.mdf',
    SIZE = 1024MB,
    MAXSIZE = UNLIMITED,
    FILEGROWTH = 512MB
)
LOG ON (
    NAME = N'UnFranchiseMarketingApp_Log',
    FILENAME = N'C:\SQLLog\UnFranchiseMarketingApp_Log.ldf',
    SIZE = 512MB,
    MAXSIZE = 10GB,
    FILEGROWTH = 256MB
);
GO

-- Set database options
ALTER DATABASE UnFranchiseMarketingApp
SET RECOVERY FULL;

ALTER DATABASE UnFranchiseMarketingApp
SET AUTO_CREATE_STATISTICS ON;

ALTER DATABASE UnFranchiseMarketingApp
SET AUTO_UPDATE_STATISTICS ON;

ALTER DATABASE UnFranchiseMarketingApp
SET READ_COMMITTED_SNAPSHOT ON;

-- Set compatibility level
ALTER DATABASE UnFranchiseMarketingApp
SET COMPATIBILITY_LEVEL = 150; -- SQL Server 2019
GO
```

### 2. Execute Schema Scripts in Order

Execute the following scripts in sequence:

```bash
# From the database directory
sqlcmd -S localhost -d UnFranchiseMarketingApp -i 02_Schema_Core_Tables.sql
sqlcmd -S localhost -d UnFranchiseMarketingApp -i 03_Schema_Sharing_Tracking.sql
sqlcmd -S localhost -d UnFranchiseMarketingApp -i 04_Schema_Notifications_Audit.sql
sqlcmd -S localhost -d UnFranchiseMarketingApp -i 05_Stored_Procedures.sql
sqlcmd -S localhost -d UnFranchiseMarketingApp -i 06_Views.sql
```

**Or via SSMS:**
1. Open SQL Server Management Studio
2. Connect to your SQL Server instance
3. Open each script file
4. Ensure `UnFranchiseMarketingApp` database is selected
5. Execute each script in order

### 3. Load Seed Data (Development/Staging Only)

```bash
sqlcmd -S localhost -d UnFranchiseMarketingApp -i 07_Seed_Data.sql
```

**Note:** Do NOT run seed data script in production. It contains sample data for development and testing only.

### 4. Create Database Users and Roles

```sql
USE UnFranchiseMarketingApp;
GO

-- Create application service account
CREATE USER [UnFranchiseApp] FOR LOGIN [UnFranchiseApp];
GO

-- Create read-only reporting user
CREATE USER [UnFranchiseReporting] FOR LOGIN [UnFranchiseReporting];
GO

-- Create custom database roles
CREATE ROLE db_api_executor;
GRANT EXECUTE ON SCHEMA::dbo TO db_api_executor;
GRANT SELECT, INSERT, UPDATE ON SCHEMA::dbo TO db_api_executor;
GRANT DELETE ON dbo.UserSession TO db_api_executor;
GRANT DELETE ON dbo.Notification TO db_api_executor;

CREATE ROLE db_readonly_reporting;
GRANT SELECT ON SCHEMA::dbo TO db_readonly_reporting;

-- Assign users to roles
ALTER ROLE db_api_executor ADD MEMBER [UnFranchiseApp];
ALTER ROLE db_readonly_reporting ADD MEMBER [UnFranchiseReporting];
GO
```

### 5. Configure SQL Server Agent Jobs

#### Daily Statistics Update Job

```sql
USE msdb;
GO

EXEC sp_add_job
    @job_name = N'UnFranchise - Update Statistics',
    @enabled = 1,
    @description = N'Daily statistics update for high-volume tables';

EXEC sp_add_jobstep
    @job_name = N'UnFranchise - Update Statistics',
    @step_name = N'Update Stats',
    @subsystem = N'TSQL',
    @database_name = N'UnFranchiseMarketingApp',
    @command = N'EXEC dbo.usp_UpdateStatistics;',
    @retry_attempts = 3,
    @retry_interval = 5;

EXEC sp_add_schedule
    @schedule_name = N'Daily 2 AM',
    @freq_type = 4,
    @freq_interval = 1,
    @active_start_time = 020000;

EXEC sp_attach_schedule
    @job_name = N'UnFranchise - Update Statistics',
    @schedule_name = N'Daily 2 AM';

EXEC sp_add_jobserver
    @job_name = N'UnFranchise - Update Statistics',
    @server_name = N'(LOCAL)';
GO
```

#### Weekly Index Maintenance Job

```sql
USE msdb;
GO

EXEC sp_add_job
    @job_name = N'UnFranchise - Index Maintenance',
    @enabled = 1,
    @description = N'Weekly index reorganization and rebuild';

EXEC sp_add_jobstep
    @job_name = N'UnFranchise - Index Maintenance',
    @step_name = N'Rebuild Indexes',
    @subsystem = N'TSQL',
    @database_name = N'UnFranchiseMarketingApp',
    @command = N'EXEC dbo.usp_IndexMaintenance;',
    @retry_attempts = 2,
    @retry_interval = 10;

EXEC sp_add_schedule
    @schedule_name = N'Weekly Sunday 1 AM',
    @freq_type = 8,
    @freq_interval = 1,
    @freq_recurrence_factor = 1,
    @active_start_time = 010000;

EXEC sp_attach_schedule
    @job_name = N'UnFranchise - Index Maintenance',
    @schedule_name = N'Weekly Sunday 1 AM';

EXEC sp_add_jobserver
    @job_name = N'UnFranchise - Index Maintenance',
    @server_name = N'(LOCAL)';
GO
```

#### Weekly Data Archival Job

```sql
USE msdb;
GO

EXEC sp_add_job
    @job_name = N'UnFranchise - Archive Old Data',
    @enabled = 1,
    @description = N'Weekly archival of old event data';

EXEC sp_add_jobstep
    @job_name = N'UnFranchise - Archive Old Data',
    @step_name = N'Archive Data',
    @subsystem = N'TSQL',
    @database_name = N'UnFranchiseMarketingApp',
    @command = N'EXEC dbo.usp_ArchiveOldData;',
    @retry_attempts = 2,
    @retry_interval = 15;

EXEC sp_add_schedule
    @schedule_name = N'Weekly Saturday 3 AM',
    @freq_type = 8,
    @freq_interval = 64,
    @freq_recurrence_factor = 1,
    @active_start_time = 030000;

EXEC sp_attach_schedule
    @job_name = N'UnFranchise - Archive Old Data',
    @schedule_name = N'Weekly Saturday 3 AM';

EXEC sp_add_jobserver
    @job_name = N'UnFranchise - Archive Old Data',
    @server_name = N'(LOCAL)';
GO
```

### 6. Configure Backup Strategy

```sql
-- Full backup job
USE msdb;
GO

EXEC sp_add_job
    @job_name = N'UnFranchise - Full Backup',
    @enabled = 1;

EXEC sp_add_jobstep
    @job_name = N'UnFranchise - Full Backup',
    @step_name = N'Backup Database',
    @subsystem = N'TSQL',
    @command = N'
        BACKUP DATABASE [UnFranchiseMarketingApp]
        TO DISK = N''C:\SQLBackup\UnFranchiseMarketingApp_Full_'' +
            CONVERT(NVARCHAR(8), GETDATE(), 112) + ''.bak''
        WITH COMPRESSION, CHECKSUM, INIT;
    ',
    @retry_attempts = 3;

EXEC sp_add_schedule
    @schedule_name = N'Weekly Sunday 2 AM',
    @freq_type = 8,
    @freq_interval = 1,
    @active_start_time = 020000;

EXEC sp_attach_schedule
    @job_name = N'UnFranchise - Full Backup',
    @schedule_name = N'Weekly Sunday 2 AM';

EXEC sp_add_jobserver
    @job_name = N'UnFranchise - Full Backup';
GO

-- Transaction log backup job
EXEC sp_add_job
    @job_name = N'UnFranchise - Log Backup',
    @enabled = 1;

EXEC sp_add_jobstep
    @job_name = N'UnFranchise - Log Backup',
    @step_name = N'Backup Log',
    @subsystem = N'TSQL',
    @command = N'
        BACKUP LOG [UnFranchiseMarketingApp]
        TO DISK = N''C:\SQLBackup\UnFranchiseMarketingApp_Log_'' +
            CONVERT(NVARCHAR(8), GETDATE(), 112) + ''_'' +
            REPLACE(CONVERT(NVARCHAR(8), GETDATE(), 108), '':'', '''') + ''.trn''
        WITH COMPRESSION, CHECKSUM;
    ';

EXEC sp_add_schedule
    @schedule_name = N'Every 15 Minutes',
    @freq_type = 4,
    @freq_interval = 1,
    @freq_subday_type = 4,
    @freq_subday_interval = 15;

EXEC sp_attach_schedule
    @job_name = N'UnFranchise - Log Backup',
    @schedule_name = N'Every 15 Minutes';

EXEC sp_add_jobserver
    @job_name = N'UnFranchise - Log Backup';
GO
```

### 7. Enable Query Store

```sql
USE master;
GO

ALTER DATABASE UnFranchiseMarketingApp
SET QUERY_STORE = ON;

ALTER DATABASE UnFranchiseMarketingApp
SET QUERY_STORE (
    OPERATION_MODE = READ_WRITE,
    CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30),
    DATA_FLUSH_INTERVAL_SECONDS = 900,
    INTERVAL_LENGTH_MINUTES = 60,
    MAX_STORAGE_SIZE_MB = 1000,
    QUERY_CAPTURE_MODE = AUTO,
    SIZE_BASED_CLEANUP_MODE = AUTO,
    MAX_PLANS_PER_QUERY = 200
);
GO
```

### 8. Configure Extended Events for Monitoring

```sql
USE UnFranchiseMarketingApp;
GO

-- Create extended events session for slow queries
CREATE EVENT SESSION [UnFranchise_SlowQueries] ON SERVER
ADD EVENT sqlserver.sql_statement_completed (
    ACTION (sqlserver.client_app_name, sqlserver.database_name, sqlserver.username)
    WHERE (duration > 5000000 AND database_name = 'UnFranchiseMarketingApp')
)
ADD TARGET package0.event_file (
    SET filename = N'C:\SQLLog\UnFranchise_SlowQueries.xel',
    max_file_size = 100,
    max_rollover_files = 5
)
WITH (
    MAX_MEMORY = 4096 KB,
    EVENT_RETENTION_MODE = ALLOW_SINGLE_EVENT_LOSS,
    MAX_DISPATCH_LATENCY = 30 SECONDS,
    STARTUP_STATE = ON
);
GO

ALTER EVENT SESSION [UnFranchise_SlowQueries] ON SERVER STATE = START;
GO
```

## Post-Deployment Verification

### 1. Verify Schema Objects

```sql
USE UnFranchiseMarketingApp;
GO

-- Count tables
SELECT COUNT(*) AS TableCount FROM sys.tables;
-- Expected: ~30 tables

-- Count stored procedures
SELECT COUNT(*) AS ProcedureCount FROM sys.procedures;
-- Expected: ~10+ procedures

-- Count views
SELECT COUNT(*) AS ViewCount FROM sys.views;
-- Expected: ~15+ views

-- Check for missing foreign keys
SELECT
    fk.name AS ForeignKeyName,
    OBJECT_NAME(fk.parent_object_id) AS TableName
FROM sys.foreign_keys fk;
```

### 2. Verify Indexes

```sql
-- Check index coverage on critical tables
SELECT
    OBJECT_NAME(i.object_id) AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType
FROM sys.indexes i
WHERE OBJECT_NAME(i.object_id) IN (
    'User', 'ContentItem', 'ShareEvent', 'EngagementEvent', 'Contact'
)
ORDER BY TableName, IndexName;
```

### 3. Test Key Procedures

```sql
-- Test authentication
EXEC dbo.usp_AuthenticateUser
    @Email = 'john.smith@example.com',
    @PasswordHash = 'HASHED_PASSWORD_PLACEHOLDER';

-- Test content library retrieval
EXEC dbo.usp_GetContentLibrary
    @UserID = 10,
    @PageNumber = 1,
    @PageSize = 20;

-- Test user dashboard
EXEC dbo.usp_GetUserDashboard
    @UserID = 10;
```

### 4. Verify SQL Server Agent Jobs

```sql
USE msdb;
GO

SELECT
    j.name AS JobName,
    j.enabled AS IsEnabled,
    CASE
        WHEN ja.start_execution_date IS NULL THEN 'Never Run'
        ELSE CONVERT(NVARCHAR(20), ja.start_execution_date, 120)
    END AS LastRunDate,
    CASE ja.run_status
        WHEN 0 THEN 'Failed'
        WHEN 1 THEN 'Succeeded'
        WHEN 2 THEN 'Retry'
        WHEN 3 THEN 'Canceled'
        WHEN 4 THEN 'In Progress'
        ELSE 'Unknown'
    END AS LastRunStatus
FROM sysjobs j
LEFT JOIN (
    SELECT job_id, start_execution_date, run_status,
           ROW_NUMBER() OVER (PARTITION BY job_id ORDER BY start_execution_date DESC) AS rn
    FROM sysjobactivity
) ja ON j.job_id = ja.job_id AND ja.rn = 1
WHERE j.name LIKE 'UnFranchise%';
```

## Environment-Specific Configuration

### Development Environment

```sql
-- Smaller file sizes
ALTER DATABASE UnFranchiseMarketingApp
MODIFY FILE (NAME = 'UnFranchiseMarketingApp_Data', SIZE = 512MB, FILEGROWTH = 256MB);

ALTER DATABASE UnFranchiseMarketingApp
MODIFY FILE (NAME = 'UnFranchiseMarketingApp_Log', SIZE = 256MB, FILEGROWTH = 128MB);

-- Simple recovery model for dev
ALTER DATABASE UnFranchiseMarketingApp SET RECOVERY SIMPLE;

-- Load seed data
-- Execute: 07_Seed_Data.sql
```

### Staging Environment

```sql
-- Medium file sizes
ALTER DATABASE UnFranchiseMarketingApp
MODIFY FILE (NAME = 'UnFranchiseMarketingApp_Data', SIZE = 2048MB, FILEGROWTH = 512MB);

-- Full recovery for testing backup/restore
ALTER DATABASE UnFranchiseMarketingApp SET RECOVERY FULL;

-- Enable same monitoring as production
-- Load anonymized production data or seed data
```

### Production Environment

```sql
-- Large file sizes
ALTER DATABASE UnFranchiseMarketingApp
MODIFY FILE (NAME = 'UnFranchiseMarketingApp_Data', SIZE = 10240MB, FILEGROWTH = 1024MB);

ALTER DATABASE UnFranchiseMarketingApp
MODIFY FILE (NAME = 'UnFranchiseMarketingApp_Log', SIZE = 5120MB, FILEGROWTH = 512MB);

-- Full recovery model
ALTER DATABASE UnFranchiseMarketingApp SET RECOVERY FULL;

-- Enable all monitoring and backups
-- Do NOT load seed data
```

## Connection Strings

### Application Connection String

```csharp
// C# .NET connection string
"Server=db.unfranchise.com;Database=UnFranchiseMarketingApp;User Id=UnFranchiseApp;Password=<password>;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;Application Name=UnFranchiseApp;"
```

```javascript
// Node.js connection string
{
  server: 'db.unfranchise.com',
  database: 'UnFranchiseMarketingApp',
  user: 'UnFranchiseApp',
  password: '<password>',
  options: {
    encrypt: true,
    trustServerCertificate: false,
    connectionTimeout: 30000,
    requestTimeout: 30000
  }
}
```

### Reporting Connection String (Read-Only)

```
Server=db-replica.unfranchise.com;Database=UnFranchiseMarketingApp;User Id=UnFranchiseReporting;Password=<password>;Encrypt=True;ApplicationIntent=ReadOnly;
```

## Rollback Plan

If deployment fails, execute rollback:

```sql
USE master;
GO

-- Disconnect all users
ALTER DATABASE UnFranchiseMarketingApp SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
GO

-- Drop database
DROP DATABASE UnFranchiseMarketingApp;
GO

-- Restore from backup if upgrading
RESTORE DATABASE UnFranchiseMarketingApp
FROM DISK = 'C:\SQLBackup\UnFranchiseMarketingApp_PreDeployment.bak'
WITH REPLACE;
GO
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Remove or disable seed data accounts in production
- [ ] Enable Transparent Data Encryption (TDE) if required
- [ ] Configure firewall rules for database server
- [ ] Enable SQL Server Audit
- [ ] Review and restrict `sysadmin` access
- [ ] Enable SSL/TLS for connections
- [ ] Configure Azure AD authentication (if using Azure SQL)

## Performance Baseline

After deployment, establish performance baselines:

```sql
-- Capture baseline query performance
SELECT
    s.name + '.' + o.name AS ObjectName,
    i.name AS IndexName,
    ps.avg_fragmentation_in_percent AS Fragmentation,
    ps.page_count AS PageCount
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ps
INNER JOIN sys.objects o ON ps.object_id = o.object_id
INNER JOIN sys.schemas s ON o.schema_id = s.schema_id
INNER JOIN sys.indexes i ON ps.object_id = i.object_id AND ps.index_id = i.index_id
WHERE ps.page_count > 100
ORDER BY ps.avg_fragmentation_in_percent DESC;

-- Capture wait statistics baseline
DBCC SQLPERF('sys.dm_os_wait_stats', CLEAR);
```

## Support and Troubleshooting

### Common Issues

**Issue: Slow query performance**
- Check Query Store for top resource consumers
- Review index fragmentation
- Update statistics
- Check for parameter sniffing issues

**Issue: High transaction log growth**
- Verify transaction log backups are running
- Check for long-running transactions
- Review recovery model setting

**Issue: Blocking/Deadlocks**
- Review Extended Events for blocked processes
- Check for missing indexes
- Review transaction isolation levels
- Consider READ_COMMITTED_SNAPSHOT isolation

### Monitoring Queries

```sql
-- Active connections
SELECT
    session_id,
    login_name,
    host_name,
    program_name,
    status,
    cpu_time,
    memory_usage,
    last_request_start_time
FROM sys.dm_exec_sessions
WHERE database_id = DB_ID('UnFranchiseMarketingApp')
AND is_user_process = 1;

-- Current blocking
SELECT
    blocking.session_id AS BlockingSessionId,
    blocked.session_id AS BlockedSessionId,
    waitstats.wait_type,
    waitstats.wait_duration_ms
FROM sys.dm_exec_requests blocked
CROSS APPLY (
    SELECT session_id, wait_type, wait_time AS wait_duration_ms
    FROM sys.dm_exec_requests
    WHERE session_id = blocked.blocking_session_id
) blocking
CROSS APPLY sys.dm_exec_sql_text(blocked.sql_handle) AS sqltext
OUTER APPLY sys.dm_exec_requests AS waitstats
WHERE blocked.blocking_session_id <> 0;
```

## Conclusion

This deployment guide provides step-by-step instructions for deploying the UnFranchise Marketing App database to development, staging, and production environments. Follow the verification steps carefully to ensure a successful deployment.
