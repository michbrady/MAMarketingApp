# Sharing Service - Quick Start Guide

## 🚀 What's Ready

The complete backend Sharing Service API is built and ready to use! This service enables content sharing across SMS, Email, and Social channels with comprehensive tracking.

## ✅ Success Checklist

- ✅ TypeScript service layer built (`src/services/sharing.service.ts`)
- ✅ RESTful API endpoints created (`src/controllers/sharing.controller.ts`)
- ✅ Routes registered (`src/routes/sharing.routes.ts`)
- ✅ Type definitions complete (`src/types/sharing.types.ts`)
- ✅ TypeScript compilation successful
- ✅ Test suite ready (`test_sharing_api.cjs`)
- ✅ Documentation complete (`SHARING_API.md`)

## 📋 Prerequisites

1. Backend server running
2. SQL Server database with sharing tables
3. User authentication working
4. Content service operational

## 🏃 Quick Start

### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

Server will start on http://localhost:3001

### 2. Run the Test Suite

```bash
cd backend
node test_sharing_api.cjs
```

This will:
- Login with test credentials
- Create 4 share events (SMS, Email, Facebook, Twitter)
- Generate tracking links
- Simulate clicks
- Fetch analytics

### 3. Try It Manually

**Step 1: Get an auth token**
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah.johnson@unfranchise.com",
    "password": "password123"
  }'
```

**Step 2: Create a share**
```bash
curl -X POST http://localhost:3001/api/v1/share \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contentItemId": 1,
    "channel": "SMS",
    "recipients": [{"mobile": "+1234567890", "name": "John Doe"}],
    "personalMessage": "Check this out!"
  }'
```

Response will include:
- `shareEventId` - Database ID
- `trackingCode` - Unique 8-char code
- `trackingUrl` - Full tracking link

**Step 3: Simulate a click**
```bash
curl -L http://localhost:3001/api/v1/share/TRACKING_CODE/track
```

This will redirect to the content and record the click.

**Step 4: Get analytics**
```bash
curl http://localhost:3001/api/v1/share/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎯 API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/v1/share` | ✅ | Create share event |
| GET | `/api/v1/share/:trackingCode/track` | ❌ | Track click & redirect |
| GET | `/api/v1/share/analytics` | ✅ | Get analytics |
| GET | `/api/v1/share/templates/:channel` | ❌ | Get template |

## 📊 Example Responses

### Create Share Response
```json
{
  "success": true,
  "data": {
    "shareEventId": 123,
    "trackingCode": "aB3xY9zQ",
    "trackingUrl": "http://localhost:3000/s/aB3xY9zQ",
    "shareEvent": {
      "ShareEventID": 123,
      "UserID": 1,
      "ContentItemID": 5,
      "ShareChannel": "SMS",
      "TrackingCode": "aB3xY9zQ",
      "Status": "Sent"
    }
  }
}
```

### Analytics Response
```json
{
  "success": true,
  "data": {
    "totalShares": 42,
    "totalClicks": 156,
    "totalUniqueClicks": 98,
    "averageClickRate": 233.33,
    "sharesByChannel": [
      {
        "channel": "Email",
        "count": 20,
        "clicks": 80,
        "clickRate": 400.0
      }
    ],
    "topContent": [...],
    "recentShares": [...],
    "timeline": [...]
  }
}
```

## 🔧 Configuration

### Environment Variables (Optional)
```env
TRACKING_BASE_URL=http://localhost:3000/s
```

Defaults to `http://localhost:3000/s` if not set.

### Database Tables Used
- `ShareEvent` - All share events
- `ShareRecipient` - Individual recipients
- `TrackingLink` - Tracking URLs
- `EngagementEvent` - Click events

## 📝 Channel Templates

### Get SMS Template
```bash
curl http://localhost:3001/api/v1/share/templates/SMS
```

### Get Email Template
```bash
curl http://localhost:3001/api/v1/share/templates/Email
```

### Get Social Template
```bash
curl http://localhost:3001/api/v1/share/templates/Social?platform=Facebook
curl http://localhost:3001/api/v1/share/templates/Social?platform=Twitter
curl http://localhost:3001/api/v1/share/templates/Social?platform=LinkedIn
```

## 🔒 Security

### Authentication
- Share creation requires JWT token
- Analytics requires JWT token
- Tracking is public (no auth)

### Authorization
- Admins can view all analytics
- UFOs can only view their own analytics

### Data Access
```javascript
// Admin user (RoleID = 1)
GET /api/v1/share/analytics
→ Returns all users' data

// UFO user (RoleID = 2+)
GET /api/v1/share/analytics
→ Returns only their own data

// Try to access other user's data (non-admin)
GET /api/v1/share/analytics?userId=999
→ 403 Forbidden
```

## 🐛 Troubleshooting

### Build Errors
```bash
# Rebuild TypeScript
npm run build

# Check for errors
npm run lint
```

### Database Connection Issues
```bash
# Check .env file
cat .env | grep DB_

# Test connection
curl http://localhost:3001/health
```

### Authentication Issues
```bash
# Verify token is valid
curl http://localhost:3001/api/v1/content \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return 200 if token is valid
```

### No Content Items
```bash
# Check if content exists
curl http://localhost:3001/api/v1/content \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return at least one item
```

## 📚 Documentation

- **API Reference**: `SHARING_API.md` - Complete API documentation
- **Implementation Details**: `SPRINT5_SHARING_ENGINE_COMPLETE.md` - Build summary
- **Project Docs**: `/docs` - Main project documentation

## 🧪 Testing Workflow

1. **Start server**: `npm run dev`
2. **Run test suite**: `node test_sharing_api.cjs`
3. **Review output**: Check for ✓ success indicators
4. **Check database**: Verify records in ShareEvent, TrackingLink tables
5. **Test manually**: Use curl commands above

## 📈 What Gets Tracked

### Per Share Event:
- Tracking code (unique 8-char ID)
- User who shared
- Content shared
- Channel (SMS/Email/Social)
- Recipients (email/mobile/name)
- Personal message
- Timestamp
- IP address
- Device type
- User agent

### Per Click:
- Tracking link clicked
- Click timestamp
- IP address
- Device type (Desktop/Mobile/Tablet)
- Browser
- Operating system
- Unique visitor flag
- Session ID

### Analytics:
- Total shares
- Total clicks
- Unique clicks
- Click rate by channel
- Top performing content
- 30-day timeline

## 🎨 Supported Channels

### SMS
- ✅ Template with 160-char limit
- ✅ Recipient tracking
- ⏳ Delivery via Twilio (future)

### Email
- ✅ Subject + body template
- ✅ Recipient tracking
- ⏳ Delivery via SendGrid (future)

### Social
- ✅ Facebook template (5000 chars)
- ✅ Twitter template (280 chars)
- ✅ LinkedIn template (3000 chars)
- ⏳ API posting (future)

## 🚦 Next Steps

### Immediate (Working Now):
1. ✅ Share events created
2. ✅ Tracking links generated
3. ✅ Clicks recorded
4. ✅ Analytics available

### Phase 1 (MVP):
1. Integrate Twilio for SMS delivery
2. Integrate SendGrid for email delivery
3. Add delivery webhooks
4. Connect to contact management

### Phase 2 (Enhanced):
1. Social media posting APIs
2. Template management UI
3. Real-time analytics
4. Campaign attribution

## 💡 Usage Tips

### Best Practices:
1. Always include personal message for higher engagement
2. Use appropriate channel for recipient type
3. Link shares to campaigns for better analytics
4. Monitor click rates to optimize content

### Performance:
1. Analytics queries are optimized with indexes
2. Click tracking has no rate limit
3. Share creation limited to 100/hour (recommended)
4. Denormalized counters for fast queries

## ⚡ Quick Reference

```bash
# Start server
npm run dev

# Run tests
node test_sharing_api.cjs

# Build TypeScript
npm run build

# Check health
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sarah.johnson@unfranchise.com","password":"password123"}'

# Create share
curl -X POST http://localhost:3001/api/v1/share \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contentItemId":1,"channel":"SMS","recipients":[{"mobile":"+1234567890"}]}'

# Get analytics
curl http://localhost:3001/api/v1/share/analytics \
  -H "Authorization: Bearer TOKEN"

# Get template
curl http://localhost:3001/api/v1/share/templates/SMS
```

## 🎉 You're Ready!

The Sharing Service is fully functional and ready for use. Run the test suite to see it in action, then start integrating it into your frontend application!

For detailed API documentation, see `SHARING_API.md`.

For implementation details, see `SPRINT5_SHARING_ENGINE_COMPLETE.md`.

---

**Need Help?** Check the full documentation or review the test script for working examples.
