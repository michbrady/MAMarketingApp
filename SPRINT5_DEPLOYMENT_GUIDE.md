# Sprint 5: Tracking & Analytics - Deployment Guide

## Prerequisites

- Node.js 20+ installed
- SQL Server 2019+ running
- Backend and frontend environments configured

## Deployment Steps

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install recharts date-fns
```

### 2. Deploy Database Views

```bash
# Connect to your SQL Server instance
sqlcmd -S your-server -U your-user -P your-password -d UnFranchiseMarketing -i database/08_Analytics_Views.sql
```

Or using SQL Server Management Studio:
- Open `database/08_Analytics_Views.sql`
- Execute against the UnFranchiseMarketing database

### 3. Verify Database Views Created

```sql
-- Check if views exist
SELECT name FROM sys.views WHERE name LIKE 'v_%Analytics%' OR name LIKE 'v_Share%';

-- Expected results:
-- v_SharePerformance
-- v_UserShareActivity
-- v_ChannelPerformance
-- v_ShareTrends
-- v_EngagementMetrics
-- v_ContentEngagementSummary
-- v_RecentActivity
-- v_MarketAnalytics
```

### 4. Build Backend

```bash
cd backend
npm run build
```

Expected output:
- Analytics service compiles successfully
- Analytics controller compiles successfully
- Analytics routes compiles successfully
- (Ignore errors from template.routes.ts and middleware files - those are unrelated)

### 5. Build Frontend

```bash
cd frontend
npm run build
```

Expected output:
- All analytics components compile successfully
- Click tracking route compiles successfully
- Analytics dashboard compiles successfully

### 6. Start Backend Server

```bash
cd backend
npm run dev
```

Server should start on port 3001 (or configured PORT)

### 7. Start Frontend Server

```bash
cd frontend
npm run dev
```

Frontend should start on port 3000 (or configured PORT)

### 8. Verify Analytics Endpoints

Test the following endpoints to ensure they're accessible:

```bash
# Overview (should return metrics or empty data)
curl http://localhost:3001/api/v1/analytics/overview

# Trends
curl "http://localhost:3001/api/v1/analytics/trends?startDate=2026-03-01&endDate=2026-04-05"

# Channels
curl http://localhost:3001/api/v1/analytics/channels

# Top Content
curl http://localhost:3001/api/v1/analytics/top-content?limit=10

# Leaderboard
curl http://localhost:3001/api/v1/analytics/leaderboard?limit=10

# Recent Shares
curl http://localhost:3001/api/v1/analytics/recent-shares?limit=10
```

All endpoints should return JSON with `success: true` (even if data arrays are empty)

### 9. Access Analytics Dashboard

Navigate to: `http://localhost:3000/analytics`

You should see:
- Overview metric cards
- Share trends chart (may be empty if no data)
- Channel breakdown chart
- Top content table
- Top sharers leaderboard
- Date range filters
- Export CSV button

### 10. Test Click Tracking

To test the tracking route:

1. Create a share event in the database (or use the sharing UI)
2. Get the tracking code from the ShareEvent table
3. Navigate to: `http://localhost:3000/s/[trackingCode]`
4. You should be redirected to the destination URL
5. An EngagementEvent record should be created in the database

Example query to verify:
```sql
SELECT TOP 10 * FROM dbo.EngagementEvent ORDER BY EventDate DESC;
```

## Environment Variables

Ensure these are set in your backend `.env`:

```env
# Database
DB_HOST=your-sql-server
DB_PORT=1433
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=UnFranchiseMarketing
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# Server
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

Frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Troubleshooting

### Analytics Dashboard Shows No Data

This is expected if you have no share events yet. To populate test data:

1. Navigate to the content library
2. Share some content via SMS/Email/Social
3. The shares will appear in analytics after a few moments
4. Use the Recent Shares widget to verify

### Click Tracking Not Working

Check:
1. Is the tracking code valid? Query: `SELECT * FROM dbo.TrackingLink WHERE ShortCode = 'xxx'`
2. Is the tracking link active? Check `IsActive = 1` and `ExpirationDate IS NULL OR > GETDATE()`
3. Check browser console for errors
4. Verify backend endpoint is accessible: `GET /api/v1/analytics/track/:code`

### Charts Not Rendering

Ensure:
1. `recharts` and `date-fns` are installed
2. No console errors in browser
3. Data is being returned from API (check Network tab)
4. Date ranges are valid

### Database Views Not Found

Run:
```sql
SELECT * FROM sys.views WHERE name LIKE 'v_%';
```

If views are missing, re-run `08_Analytics_Views.sql`

### TypeScript Compilation Errors

Analytics code should compile without errors. If you see errors in:
- `analytics.service.ts`
- `analytics.controller.ts`
- `analytics.routes.ts`

Verify you have the latest code from the implementation.

Errors in `template.routes.ts`, `role.middleware.ts`, or `validation.middleware.ts` are pre-existing and can be ignored for this sprint.

## Production Deployment

### Additional Steps for Production

1. **Enable Caching**
   - Add Redis caching layer for analytics queries
   - Cache duration: 5-15 minutes for overview metrics

2. **Add Rate Limiting**
   - Limit tracking endpoint: 100 requests/minute per IP
   - Limit analytics endpoints: 60 requests/minute per user

3. **Optimize Database**
   - Add indexes if missing (check execution plans)
   - Consider partitioning for EngagementEvent and ShareEvent tables
   - Enable compression on high-volume tables

4. **Enable Real-time Updates**
   - Replace polling with WebSocket connections
   - Use SignalR or Socket.io for live updates

5. **Add Monitoring**
   - Log analytics query performance
   - Monitor tracking endpoint response times
   - Alert on failed click tracking events

6. **Configure CORS**
   - Set specific frontend domain (not *)
   - Enable credentials if using authentication

7. **Security Hardening**
   - Enable HTTPS
   - Add CSRF protection
   - Implement API key authentication for analytics endpoints
   - Add SQL injection protection (parameterized queries already in place)

8. **Data Retention**
   - Archive old engagement events (>90 days)
   - Implement data deletion policy for GDPR compliance
   - Schedule cleanup jobs

## Testing in Production

### Load Testing

Test with realistic data volumes:
- 10,000+ shares
- 100,000+ engagement events
- 1,000+ concurrent users on analytics dashboard

### Performance Targets

- Analytics overview: < 500ms
- Trends endpoint: < 1s
- Click tracking: < 200ms
- Dashboard load: < 2s

### Monitoring

Monitor these metrics:
- API response times
- Database query execution times
- Click tracking success rate
- Analytics dashboard page views
- Export CSV usage

## Support

For issues or questions:
1. Check the Sprint 5 Summary document
2. Review API logs for errors
3. Check database for data integrity
4. Verify all endpoints are accessible
5. Test with sample data

## Rollback Plan

If issues occur:

1. Remove analytics routes from `backend/src/index.ts`:
   ```typescript
   // Comment out:
   // import analyticsRoutes from './routes/analytics.routes.js';
   // app.use('/api/v1/analytics', analyticsRoutes);
   ```

2. Database views can remain (they don't affect existing functionality)

3. Frontend analytics route can be disabled by removing or renaming the directory:
   ```bash
   mv frontend/src/app/(dashboard)/analytics frontend/src/app/(dashboard)/_analytics
   ```

## Success Verification

After deployment, verify:

- [ ] Analytics dashboard is accessible at /analytics
- [ ] All metric cards display (even if zero)
- [ ] Charts render without errors
- [ ] Tables are sortable
- [ ] Date range filters work
- [ ] Export CSV downloads
- [ ] Click tracking redirects properly
- [ ] Engagement events are recorded
- [ ] Recent shares widget updates
- [ ] Mobile layout is responsive
- [ ] No console errors
- [ ] API endpoints return valid JSON
- [ ] Database views are queryable

## Next Sprint Integration

Sprint 6 (Contact Management) will integrate with analytics:
- Contact engagement scores
- Per-contact analytics
- Contact timeline with share events
- Follow-up recommendations based on engagement

The analytics foundation built in Sprint 5 supports these future features.
