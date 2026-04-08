# Scaling and Performance Strategy
## UnFranchise Marketing App Database

## Overview

This document outlines strategies for scaling the database to handle high-volume event tracking, multi-market growth, and long-term data retention.

## 1. Partitioning Strategy

### High-Volume Tables

#### ShareEvent Table Partitioning
```sql
-- Partition by month for optimal management
CREATE PARTITION FUNCTION PF_ShareEventByMonth (DATETIME2(7))
AS RANGE RIGHT FOR VALUES (
    '2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01',
    '2026-05-01', '2026-06-01', '2026-07-01', '2026-08-01',
    '2026-09-01', '2026-10-01', '2026-11-01', '2026-12-01',
    '2027-01-01' -- Extend monthly as needed
);

CREATE PARTITION SCHEME PS_ShareEventByMonth
AS PARTITION PF_ShareEventByMonth
ALL TO ([PRIMARY]);

-- When creating table, use:
-- ON PS_ShareEventByMonth(ShareDate)
```

**Benefits:**
- Faster queries on recent data
- Easy archival of old partitions
- Improved index maintenance
- Better backup/restore granularity

#### EngagementEvent Table Partitioning
```sql
-- Similar monthly partitioning for engagement events
CREATE PARTITION FUNCTION PF_EngagementEventByMonth (DATETIME2(7))
AS RANGE RIGHT FOR VALUES (
    '2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01',
    '2026-05-01', '2026-06-01', '2026-07-01', '2026-08-01',
    '2026-09-01', '2026-10-01', '2026-11-01', '2026-12-01',
    '2027-01-01'
);

CREATE PARTITION SCHEME PS_EngagementEventByMonth
AS PARTITION PF_EngagementEventByMonth
ALL TO ([PRIMARY]);
```

#### AuditLog Table Partitioning
```sql
-- Quarterly partitioning for audit logs (lower query frequency)
CREATE PARTITION FUNCTION PF_AuditLogByQuarter (DATETIME2(7))
AS RANGE RIGHT FOR VALUES (
    '2026-01-01', '2026-04-01', '2026-07-01', '2026-10-01',
    '2027-01-01', '2027-04-01', '2027-07-01', '2027-10-01'
);

CREATE PARTITION SCHEME PS_AuditLogByQuarter
AS PARTITION PF_AuditLogByQuarter
ALL TO ([PRIMARY]);
```

### Partition Maintenance

**Automated Partition Management:**
```sql
-- SQL Agent Job to add new partitions monthly
CREATE PROCEDURE dbo.usp_AddMonthlyPartitions
AS
BEGIN
    DECLARE @NextMonth DATETIME2(7) = DATEADD(MONTH, 1, EOMONTH(GETDATE()));

    -- Add partition to ShareEvent function
    ALTER PARTITION FUNCTION PF_ShareEventByMonth()
    SPLIT RANGE (@NextMonth);

    -- Add partition to EngagementEvent function
    ALTER PARTITION FUNCTION PF_EngagementEventByMonth()
    SPLIT RANGE (@NextMonth);
END
```

**Schedule:** Run monthly via SQL Server Agent on the 1st of each month.

## 2. Data Archival Strategy

### Hot/Warm/Cold Data Tiers

#### Hot Data (Active Tables)
- **Timeframe:** Last 90 days
- **Location:** Primary tables with full indexing
- **Access Pattern:** High read/write, real-time queries
- **Tables:**
  - ShareEvent (last 90 days)
  - EngagementEvent (last 90 days)
  - ActivityFeedItem (last 90 days)
  - Notification (unread + 30 days)

#### Warm Data (Archive Tables)
- **Timeframe:** 91-365 days
- **Location:** Separate archive tables or read-only filegroup
- **Access Pattern:** Occasional reporting, analytics
- **Tables:**
  - ShareEvent_Archive
  - EngagementEvent_Archive
  - ActivityFeedItem_Archive
  - AuditLog_Archive

#### Cold Data (Long-term Storage)
- **Timeframe:** 365+ days
- **Location:** Compressed storage or Azure Blob Storage
- **Access Pattern:** Rare, compliance/legal only
- **Format:** Compressed Parquet files or SQL Server compressed tables

### Archival Process

```sql
CREATE PROCEDURE dbo.usp_ArchiveOldData
    @ArchiveDate DATETIME2(7) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET @ArchiveDate = ISNULL(@ArchiveDate, DATEADD(DAY, -90, SYSDATETIME()));

    BEGIN TRANSACTION;

    -- Archive ShareEvent records
    INSERT INTO dbo.ShareEvent_Archive
    SELECT * FROM dbo.ShareEvent
    WHERE ShareDate < @ArchiveDate;

    DELETE FROM dbo.ShareEvent
    WHERE ShareDate < @ArchiveDate;

    -- Archive EngagementEvent records
    INSERT INTO dbo.EngagementEvent_Archive
    SELECT * FROM dbo.EngagementEvent
    WHERE EventDate < @ArchiveDate;

    DELETE FROM dbo.EngagementEvent
    WHERE EventDate < @ArchiveDate;

    -- Archive ActivityFeedItem records
    INSERT INTO dbo.ActivityFeedItem_Archive
    SELECT * FROM dbo.ActivityFeedItem
    WHERE ActivityDate < @ArchiveDate AND IsArchived = 1;

    DELETE FROM dbo.ActivityFeedItem
    WHERE ActivityDate < @ArchiveDate AND IsArchived = 1;

    COMMIT TRANSACTION;

    -- Update statistics after bulk operations
    UPDATE STATISTICS dbo.ShareEvent;
    UPDATE STATISTICS dbo.EngagementEvent;
    UPDATE STATISTICS dbo.ActivityFeedItem;
END
```

**Schedule:** Run weekly during off-peak hours via SQL Server Agent.

## 3. Index Optimization

### Columnstore Indexes for Analytics

```sql
-- Columnstore index for ShareEvent analytics
CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_ShareEvent_Analytics
ON dbo.ShareEvent_Archive (
    ShareDate, UserID, ContentItemID, ShareChannel,
    RecipientCount, ClickCount, UniqueClickCount
);

-- Columnstore index for EngagementEvent analytics
CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_EngagementEvent_Analytics
ON dbo.EngagementEvent_Archive (
    EventDate, ContentItemID, EventType,
    TrackingLinkID, ContactID, IsUniqueVisitor
);
```

### Covering Indexes for Common Queries

```sql
-- User dashboard query optimization
CREATE NONCLUSTERED INDEX IX_ShareEvent_UserDashboard
ON dbo.ShareEvent (UserID, ShareDate DESC)
INCLUDE (ContentItemID, ShareChannel, ClickCount, RecipientCount);

-- Content performance query optimization
CREATE NONCLUSTERED INDEX IX_ShareEvent_ContentPerformance
ON dbo.ShareEvent (ContentItemID, ShareDate DESC)
INCLUDE (UserID, ClickCount, UniqueClickCount, RecipientCount);

-- Contact engagement query optimization
CREATE NONCLUSTERED INDEX IX_EngagementEvent_ContactEngagement
ON dbo.EngagementEvent (ContactID, EventDate DESC)
INCLUDE (ContentItemID, EventType, TrackingLinkID);
```

### Index Maintenance

```sql
CREATE PROCEDURE dbo.usp_IndexMaintenance
AS
BEGIN
    -- Reorganize fragmented indexes
    DECLARE @TableName NVARCHAR(255);
    DECLARE @IndexName NVARCHAR(255);
    DECLARE @Fragmentation FLOAT;

    DECLARE index_cursor CURSOR FOR
    SELECT
        OBJECT_NAME(ips.object_id) AS TableName,
        i.name AS IndexName,
        ips.avg_fragmentation_in_percent
    FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
    INNER JOIN sys.indexes i ON ips.object_id = i.object_id
        AND ips.index_id = i.index_id
    WHERE ips.avg_fragmentation_in_percent > 10
        AND ips.page_count > 1000;

    OPEN index_cursor;
    FETCH NEXT FROM index_cursor INTO @TableName, @IndexName, @Fragmentation;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        IF @Fragmentation > 30
            EXEC('ALTER INDEX ' + @IndexName + ' ON ' + @TableName + ' REBUILD');
        ELSE
            EXEC('ALTER INDEX ' + @IndexName + ' ON ' + @TableName + ' REORGANIZE');

        FETCH NEXT FROM index_cursor INTO @TableName, @IndexName, @Fragmentation;
    END

    CLOSE index_cursor;
    DEALLOCATE index_cursor;
END
```

**Schedule:** Run weekly during maintenance window.

## 4. Query Optimization

### Statistics Updates

```sql
-- Automated statistics update
CREATE PROCEDURE dbo.usp_UpdateStatistics
AS
BEGIN
    -- Update stats on high-volume tables
    UPDATE STATISTICS dbo.ShareEvent WITH FULLSCAN;
    UPDATE STATISTICS dbo.EngagementEvent WITH FULLSCAN;
    UPDATE STATISTICS dbo.Contact WITH FULLSCAN;
    UPDATE STATISTICS dbo.ContentItem WITH FULLSCAN;
    UPDATE STATISTICS dbo.TrackingLink WITH FULLSCAN;
END
```

**Schedule:** Run daily during off-peak hours.

### Query Store Configuration

```sql
-- Enable Query Store for performance monitoring
ALTER DATABASE [UnFranchiseMarketingApp]
SET QUERY_STORE = ON;

ALTER DATABASE [UnFranchiseMarketingApp]
SET QUERY_STORE (
    OPERATION_MODE = READ_WRITE,
    DATA_FLUSH_INTERVAL_SECONDS = 900,
    INTERVAL_LENGTH_MINUTES = 60,
    MAX_STORAGE_SIZE_MB = 1000,
    QUERY_CAPTURE_MODE = AUTO,
    SIZE_BASED_CLEANUP_MODE = AUTO
);
```

## 5. Caching Strategy

### SQL Server In-Memory Tables (OLTP)

```sql
-- In-memory table for active user sessions
ALTER DATABASE [UnFranchiseMarketingApp]
ADD FILEGROUP InMemory_FG CONTAINS MEMORY_OPTIMIZED_DATA;

ALTER DATABASE [UnFranchiseMarketingApp]
ADD FILE (
    NAME = 'InMemory_Data',
    FILENAME = 'C:\SQLData\InMemory_Data'
) TO FILEGROUP InMemory_FG;

-- Create memory-optimized session table
CREATE TABLE dbo.UserSession_InMemory (
    SessionToken NVARCHAR(255) NOT NULL PRIMARY KEY NONCLUSTERED HASH WITH (BUCKET_COUNT = 1000000),
    UserID BIGINT NOT NULL,
    ExpirationDate DATETIME2(7) NOT NULL,
    INDEX IX_UserID NONCLUSTERED (UserID),
    INDEX IX_Expiration NONCLUSTERED (ExpirationDate)
) WITH (MEMORY_OPTIMIZED = ON, DURABILITY = SCHEMA_AND_DATA);
```

### Application-Level Caching

**Redis Cache Recommendations:**
- Active user sessions (TTL: 60 minutes)
- Published content library (TTL: 15 minutes)
- User dashboard summary (TTL: 5 minutes)
- Content categories/tags (TTL: 1 hour)
- Market/Language reference data (TTL: 24 hours)

## 6. Database Sharding (Future Growth)

### Shard Key Selection

**Recommended Shard Key:** `MarketID`

**Rationale:**
- Natural business boundary
- Relatively even distribution
- Minimal cross-shard queries
- Regulatory compliance alignment

### Shard Distribution Example

```
Shard 1: North America (US, CA, MX)
Shard 2: Asia Pacific (TW, CN, AU)
Shard 3: Europe (UK, DE, FR)
Shard 4: Latin America (BR, AR, CL)
```

### Cross-Shard Queries

Use federated views or application-level aggregation for:
- Global content performance reports
- Cross-market campaign analytics
- Platform-wide user statistics

## 7. Read Replicas

### Always On Availability Groups

```sql
-- Secondary replica for reporting (read-only)
-- Offload analytics and reporting queries to read replica

-- Connection string for reporting:
-- Server=tcp:db-replica.unfranchise.com;Database=UnFranchiseMarketingApp;
--   ApplicationIntent=ReadOnly;
```

**Benefits:**
- Zero performance impact on production
- Real-time reporting data
- High availability and disaster recovery

## 8. Compression

### Data Compression

```sql
-- Enable page compression on archive tables
ALTER TABLE dbo.ShareEvent_Archive
REBUILD PARTITION = ALL WITH (DATA_COMPRESSION = PAGE);

ALTER TABLE dbo.EngagementEvent_Archive
REBUILD PARTITION = ALL WITH (DATA_COMPRESSION = PAGE);

ALTER TABLE dbo.AuditLog_Archive
REBUILD PARTITION = ALL WITH (DATA_COMPRESSION = PAGE);

-- Backup compression
BACKUP DATABASE [UnFranchiseMarketingApp]
TO DISK = 'backup.bak'
WITH COMPRESSION;
```

**Space Savings:** 50-80% reduction on historical data

## 9. Monitoring and Alerts

### Performance Metrics to Monitor

1. **Query Performance:**
   - Queries taking > 5 seconds
   - Blocking chains > 10 seconds
   - Deadlocks

2. **Resource Utilization:**
   - CPU > 80% for 5+ minutes
   - Memory pressure
   - Disk I/O latency > 20ms

3. **Growth Metrics:**
   - Table size growth rate
   - Index fragmentation levels
   - Partition fill rates

### Alert Configuration

```sql
-- Monitor table growth
CREATE PROCEDURE dbo.usp_MonitorTableGrowth
AS
BEGIN
    SELECT
        t.name AS TableName,
        SUM(p.rows) AS RowCount,
        SUM(a.total_pages) * 8 / 1024 AS TotalSpaceMB,
        SUM(a.used_pages) * 8 / 1024 AS UsedSpaceMB
    FROM sys.tables t
    INNER JOIN sys.indexes i ON t.object_id = i.object_id
    INNER JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
    INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
    WHERE t.name IN ('ShareEvent', 'EngagementEvent', 'Contact', 'ContentItem')
    GROUP BY t.name
    ORDER BY SUM(a.total_pages) DESC;
END
```

## 10. Capacity Planning

### Growth Projections

**Assumptions:**
- 10,000 active UFO users
- Average 20 shares per user per month
- 5% click-through rate on shares
- 30% annual user growth

**Projected Growth:**

| Year | Users   | Shares/Month | Engagements/Month | Total Records/Year |
|------|---------|--------------|-------------------|--------------------|
| 2026 | 10,000  | 200,000      | 10,000            | 2,520,000          |
| 2027 | 13,000  | 260,000      | 13,000            | 3,276,000          |
| 2028 | 16,900  | 338,000      | 16,900            | 4,258,800          |
| 2029 | 21,970  | 439,400      | 21,970            | 5,536,440          |
| 2030 | 28,561  | 571,220      | 28,561            | 7,197,372          |

### Storage Estimates

**Per Record Size:**
- ShareEvent: ~500 bytes
- EngagementEvent: ~400 bytes
- ActivityFeedItem: ~300 bytes
- Notification: ~250 bytes

**5-Year Storage Projection:**
- Hot Data (90 days): ~50 GB
- Warm Data (1 year): ~200 GB
- Cold Data (archive): ~800 GB
- **Total:** ~1.05 TB (with compression: ~500 GB)

### Hardware Recommendations

**Year 1-2 (10K-13K users):**
- CPU: 8 cores
- RAM: 64 GB
- Storage: 500 GB SSD (IOPS: 10,000)

**Year 3-5 (16K-28K users):**
- CPU: 16 cores
- RAM: 128 GB
- Storage: 1.5 TB SSD (IOPS: 20,000)

## 11. Disaster Recovery

### Backup Strategy

**Full Backups:**
- Frequency: Weekly (Sunday 2:00 AM)
- Retention: 4 weeks

**Differential Backups:**
- Frequency: Daily (2:00 AM)
- Retention: 7 days

**Transaction Log Backups:**
- Frequency: Every 15 minutes
- Retention: 24 hours

### Recovery Time Objective (RTO)

- **Critical:** < 1 hour
- **High:** < 4 hours
- **Normal:** < 24 hours

### Recovery Point Objective (RPO)

- **Maximum data loss:** 15 minutes (transaction log backup frequency)

## 12. Implementation Roadmap

### Phase 1: Foundation (Months 1-3)
- [x] Initial schema deployment
- [x] Core indexes
- [ ] Monitoring setup
- [ ] Backup configuration

### Phase 2: Optimization (Months 4-6)
- [ ] Implement partitioning on high-volume tables
- [ ] Deploy read replica
- [ ] Enable Query Store
- [ ] Application-level caching (Redis)

### Phase 3: Scale (Months 7-12)
- [ ] Implement archival process
- [ ] Columnstore indexes on archive tables
- [ ] In-memory OLTP for sessions
- [ ] Performance tuning based on actual workload

### Phase 4: Growth (Year 2+)
- [ ] Evaluate sharding strategy
- [ ] Cross-region replication if needed
- [ ] Advanced analytics (data warehouse)
- [ ] Machine learning integration for engagement scoring

## Conclusion

This scaling strategy provides a comprehensive roadmap for handling growth from 10,000 to 100,000+ users while maintaining sub-second query performance and ensuring data durability. Regular monitoring and iterative optimization based on actual usage patterns will be critical to success.
