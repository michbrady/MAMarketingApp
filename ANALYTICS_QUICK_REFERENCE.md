# Analytics System - Quick Reference Card

## Overview

The Tracking & Analytics System provides comprehensive insights into content sharing performance, user engagement, and click-through metrics.

## Key Features

### 1. Click Tracking
- **Route**: `/s/:trackingId`
- **Function**: Captures click events and redirects to content
- **Data Captured**: IP (anonymized), device, browser, OS, timestamp
- **Privacy**: GDPR-compliant, last octet of IP removed

### 2. Analytics Dashboard
- **Route**: `/analytics`
- **Features**:
  - Overview metrics (shares, clicks, CTR)
  - Share trends over time (line chart)
  - Channel performance (bar chart)
  - Top performing content (sortable table)
  - Top sharers leaderboard
  - Date range filtering
  - CSV export

### 3. Recent Shares Widget
- **Location**: Dashboard or custom placement
- **Features**:
  - Last 10 shares
  - Real-time updates (30s polling)
  - Click count badges
  - Channel icons
  - Time ago display

## API Endpoints

### Base URL
```
http://localhost:3001/api/v1/analytics
```

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/overview` | GET | Overview metrics (shares, clicks, CTR, top channel) |
| `/trends` | GET | Time-series data for charts |
| `/channels` | GET | Performance by channel (SMS/Email/Social) |
| `/top-content` | GET | Most shared content items |
| `/leaderboard` | GET | Top sharers ranking |
| `/recent-shares` | GET | Recent share activity |
| `/track/:code` | GET | Click tracking (records event, returns URL) |

### Common Query Parameters

All endpoints support these filters:
- `userId` - Filter by specific user
- `contentId` - Filter by specific content
- `campaignId` - Filter by campaign
- `channel` - Filter by channel (SMS/Email/Social)
- `marketCode` - Filter by market
- `startDate` - Start of date range (YYYY-MM-DD)
- `endDate` - End of date range (YYYY-MM-DD)
- `limit` - Number of results (default 10)

### Example Requests

```bash
# Get overview for last 30 days
curl "http://localhost:3001/api/v1/analytics/overview?startDate=2026-03-05&endDate=2026-04-05"

# Get SMS channel performance
curl "http://localhost:3001/api/v1/analytics/channels?channel=SMS"

# Get top 5 content items
curl "http://localhost:3001/api/v1/analytics/top-content?limit=5"

# Get user-specific shares
curl "http://localhost:3001/api/v1/analytics/recent-shares?userId=123&limit=20"
```

## Frontend Components

### Usage Examples

#### 1. Share Metrics Cards
```tsx
import ShareMetrics from '@/components/analytics/ShareMetrics';
import { SharePerformanceMetrics } from '@/types/analytics';

const metrics: SharePerformanceMetrics = {
  totalShares: 1250,
  totalClicks: 3420,
  uniqueClicks: 2180,
  totalRecipients: 5600,
  clickThroughRate: 61.07,
  averageClicksPerShare: 2.74,
  topChannel: "SMS",
  topChannelShares: 650
};

<ShareMetrics metrics={metrics} loading={false} />
```

#### 2. Trends Chart
```tsx
import ShareTrendsChart from '@/components/analytics/ShareTrendsChart';

const trends = [
  { date: "2026-04-01", shares: 45, clicks: 120, uniqueClicks: 85, recipients: 180 },
  { date: "2026-04-02", shares: 52, clicks: 135, uniqueClicks: 95, recipients: 200 },
  // ...
];

<ShareTrendsChart data={trends} loading={false} />
```

#### 3. Recent Shares Widget
```tsx
import RecentShares from '@/components/dashboard/RecentShares';

// Auto-refreshing widget for dashboard
<RecentShares
  userId={currentUserId}
  limit={10}
  autoRefresh={true}
  refreshInterval={30000}
/>

// Static widget without auto-refresh
<RecentShares
  limit={5}
  autoRefresh={false}
/>
```

## Database Views

### Analytics Views Available

| View Name | Purpose |
|-----------|---------|
| `v_SharePerformance` | Share metrics by content |
| `v_UserShareActivity` | Activity and trends by user |
| `v_ChannelPerformance` | Performance by channel |
| `v_ShareTrends` | Daily aggregated metrics |
| `v_EngagementMetrics` | Detailed engagement data |
| `v_ContentEngagementSummary` | Engagement by content |
| `v_RecentActivity` | Latest 100 events |
| `v_MarketAnalytics` | Regional performance |

### Example Queries

```sql
-- Get performance for specific content
SELECT * FROM dbo.v_SharePerformance
WHERE ContentItemID = 123;

-- Get top sharers
SELECT TOP 10 * FROM dbo.v_UserShareActivity
ORDER BY TotalShares DESC;

-- Get channel breakdown
SELECT * FROM dbo.v_ChannelPerformance;

-- Get recent engagement
SELECT TOP 50 * FROM dbo.v_EngagementMetrics
ORDER BY EventDate DESC;
```

## Metrics Explained

### Click-Through Rate (CTR)
```
CTR = (Total Clicks / Total Recipients) × 100
```
Industry benchmark: 2-5% (varies by channel)

### Average Clicks Per Share
```
Avg = Total Clicks / Total Shares
```
Higher is better, indicates engaging content

### Unique Clicks
Distinct visitors who clicked (deduped by IP + User Agent)

### Top Channel
Channel with most shares in selected period

## Data Model

### Key Tables

**ShareEvent** - Records each share action
- ShareEventID (PK)
- UserID (FK)
- ContentItemID (FK)
- ShareChannel (SMS/Email/Social)
- TrackingCode (unique)
- RecipientCount
- ClickCount (denormalized)
- UniqueClickCount (denormalized)

**TrackingLink** - Unique tracking URLs
- TrackingLinkID (PK)
- ShareEventID (FK)
- ShortCode (unique)
- DestinationURL
- ClickCount (denormalized)
- FirstClickDate
- LastClickDate

**EngagementEvent** - Click and interaction events
- EngagementEventID (PK)
- TrackingLinkID (FK)
- EventType (Click/View/VideoStart/etc)
- IPAddress (anonymized)
- DeviceType
- Browser
- OperatingSystem
- EventDate

## Performance Tips

### Backend
1. Use date range filters to limit data
2. Views are optimized with indexes
3. Consider caching for frequently accessed metrics
4. Use `limit` parameter to reduce payload size

### Frontend
1. Use loading states to improve perceived performance
2. Implement pagination for large datasets
3. Debounce date range filter changes
4. Use React Query for caching API responses
5. Lazy load charts and tables

### Database
1. Partitioning recommended for ShareEvent and EngagementEvent
2. Archive old data (>90 days)
3. Regular index maintenance
4. Monitor query execution plans

## Troubleshooting

### No Data in Dashboard
- Check if shares exist: `SELECT COUNT(*) FROM dbo.ShareEvent`
- Verify date range covers existing data
- Check API response in Network tab

### Tracking Link Not Working
- Verify tracking code: `SELECT * FROM dbo.TrackingLink WHERE ShortCode = 'xxx'`
- Check if active: `IsActive = 1`
- Check expiration: `ExpirationDate IS NULL OR > GETDATE()`

### Charts Not Rendering
- Verify `recharts` is installed
- Check console for errors
- Ensure data format matches expected schema
- Verify date strings are ISO format

### Slow Performance
- Add date range filters
- Use pagination for large datasets
- Check database indexes
- Enable caching
- Consider aggregating data for older periods

## Best Practices

### Analytics Dashboard
1. Default to last 30 days for quick load
2. Show loading states for all components
3. Handle empty states gracefully
4. Provide clear error messages
5. Make charts responsive

### Click Tracking
1. Always anonymize IP addresses
2. Limit user agent string length
3. Handle invalid tracking codes gracefully
4. Log tracking failures for debugging
5. Use unique session IDs when possible

### Data Privacy
1. Don't store PII in tracking data
2. Anonymize IPs (remove last octet)
3. Truncate user agents
4. Implement data retention policy
5. Provide data export for users

## Integration Points

### With Other Systems

**Content Library**
- Share buttons generate tracking links
- Content performance feeds into recommendations

**Contact Management** (Sprint 6)
- Engagement events linked to contacts
- Contact scoring based on clicks
- Timeline integration

**Activity Feed** (Sprint 7)
- Recent shares appear in feed
- Engagement notifications
- Follow-up reminders

**Campaigns** (Future)
- Campaign-level analytics
- A/B testing support
- ROI tracking

## Testing

### Unit Tests
- Analytics service methods
- Controller request handling
- Data formatting functions

### Integration Tests
- API endpoint responses
- Database view queries
- Click tracking flow

### E2E Tests
- Analytics dashboard navigation
- Chart interactions
- CSV export
- Click tracking redirect

## Support Contacts

For questions about:
- **Analytics API**: Check API documentation
- **Dashboard UI**: Review component specs
- **Database**: Query view definitions
- **Performance**: Check indexes and execution plans
- **Privacy**: Review GDPR compliance docs

## Version History

- **v1.0** (2026-04-05): Initial release
  - Click tracking
  - Analytics dashboard
  - 8 database views
  - 7 API endpoints
  - 9 UI components
