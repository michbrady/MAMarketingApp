# Sharing Service API Documentation

## Overview

The Sharing Service provides a comprehensive API for tracking content shares across multiple channels (SMS, Email, Social), generating unique tracking links, recording click events, and analyzing share performance.

## Features

✅ Multi-channel sharing (SMS, Email, Social media)
✅ Unique tracking link generation with short codes
✅ Click tracking and attribution
✅ Engagement analytics
✅ Channel-specific templates
✅ Recipient management
✅ Real-time analytics

## API Endpoints

### 1. Create Share Event

**POST** `/api/v1/share`

Create and log a new share event with tracking link generation.

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "contentItemId": 1,
  "channel": "SMS",
  "socialPlatform": "Facebook",
  "personalMessage": "Check this out!",
  "recipients": [
    {
      "contactId": 123,
      "email": "prospect@example.com",
      "mobile": "+1234567890",
      "name": "John Doe"
    }
  ],
  "campaignId": 5,
  "templateName": "default_sms"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shareEventId": 456,
    "trackingCode": "aB3xY9zQ",
    "trackingUrl": "http://localhost:3000/s/aB3xY9zQ",
    "shareEvent": {
      "ShareEventID": 456,
      "ShareGUID": "...",
      "UserID": 1,
      "ContentItemID": 1,
      "ShareChannel": "SMS",
      "TrackingCode": "aB3xY9zQ",
      "Status": "Sent",
      "ShareDate": "2026-04-05T10:30:00Z"
    }
  }
}
```

### 2. Track Click

**GET** `/api/v1/share/:trackingCode/track`

Track a click on a tracking link and redirect to content.

**Authentication:** None (public endpoint)

**Parameters:**
- `trackingCode` - The unique tracking code from the share event

**Response:**
- HTTP 302 Redirect to content destination URL
- Records engagement event in database
- Updates click counters

**Example:**
```
GET /api/v1/share/aB3xY9zQ/track
→ Redirects to content destination
```

### 3. Get Share Analytics

**GET** `/api/v1/share/analytics`

Retrieve analytics data for shares with optional filters.

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `userId` (optional) - Filter by user ID
- `contentId` (optional) - Filter by content item ID
- `channel` (optional) - Filter by channel (SMS, Email, Social)
- `campaignId` (optional) - Filter by campaign ID
- `startDate` (optional) - Filter by start date (ISO 8601)
- `endDate` (optional) - Filter by end date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalShares": 150,
    "totalClicks": 420,
    "totalUniqueClicks": 280,
    "averageClickRate": 280.0,
    "sharesByChannel": [
      {
        "channel": "Email",
        "count": 75,
        "clicks": 210,
        "clickRate": 280.0
      },
      {
        "channel": "SMS",
        "count": 50,
        "clicks": 150,
        "clickRate": 300.0
      },
      {
        "channel": "Social",
        "count": 25,
        "clicks": 60,
        "clickRate": 240.0
      }
    ],
    "topContent": [
      {
        "contentItemId": 5,
        "title": "Business Opportunity Overview",
        "shares": 45,
        "clicks": 180,
        "clickRate": 400.0
      }
    ],
    "recentShares": [...],
    "timeline": [
      {
        "date": "2026-04-05",
        "shares": 15,
        "clicks": 45
      }
    ]
  }
}
```

### 4. Get Channel Template

**GET** `/api/v1/share/templates/:channel`

Retrieve the message template for a specific channel.

**Authentication:** None (public endpoint)

**Parameters:**
- `channel` - Channel name (SMS, Email, Social)

**Query Parameters:**
- `platform` (optional) - Social platform (Facebook, Twitter, LinkedIn)

**Response:**
```json
{
  "success": true,
  "data": {
    "channel": "SMS",
    "templateName": "default_sms",
    "body": "Hi! {firstName} here. I wanted to share this with you: {contentTitle}. Check it out: {trackingLink}",
    "variables": ["firstName", "contentTitle", "trackingLink"],
    "maxLength": 160
  }
}
```

## Database Tables

### ShareEvent
Stores all share events with tracking information.

**Key Fields:**
- `ShareEventID` - Primary key
- `ShareGUID` - Unique identifier
- `UserID` - User who shared
- `ContentItemID` - Content being shared
- `ShareChannel` - SMS, Email, or Social
- `TrackingCode` - Unique short code (8 chars)
- `Status` - Sent, Delivered, Failed, Bounced
- `ClickCount` - Total clicks
- `UniqueClickCount` - Unique visitor clicks

### TrackingLink
Stores tracking URLs and their destinations.

**Key Fields:**
- `TrackingLinkID` - Primary key
- `ShareEventID` - Associated share event
- `ShortCode` - Tracking code
- `FullTrackingURL` - Complete tracking URL
- `DestinationURL` - Where to redirect
- `ClickCount` - Total clicks
- `IsActive` - Link status

### EngagementEvent
Records all click and view events.

**Key Fields:**
- `EngagementEventID` - Primary key
- `ContentItemID` - Content engaged with
- `TrackingLinkID` - Source tracking link
- `ShareEventID` - Source share event
- `EventType` - Click, View, etc.
- `IPAddress` - Visitor IP
- `UserAgent` - Browser/device info
- `DeviceType` - Desktop, Mobile, Tablet
- `IsUniqueVisitor` - First-time visitor flag

### ShareRecipient
Tracks individual recipients of shares.

**Key Fields:**
- `ShareRecipientID` - Primary key
- `ShareEventID` - Associated share event
- `ContactID` - Known contact (optional)
- `RecipientEmail` - Email address
- `RecipientMobile` - Phone number
- `DeliveryStatus` - Pending, Sent, Delivered, Failed

## Service Methods

### SharingService

#### generateTrackingLink(contentId, userId, channel, destinationUrl)
Generates a unique 8-character tracking code and constructs the full tracking URL.

#### logShareEvent(shareData, userId, metadata)
Creates a share event, generates tracking link, and stores all data.

#### trackClick(trackingData)
Records a click event, updates counters, and returns redirect URL.

#### getShareAnalytics(filters)
Fetches comprehensive analytics data with optional filtering.

#### getTemplateForChannel(channel, socialPlatform)
Returns the message template for a specific channel.

## Template Variables

All templates support the following variables:

- `{firstName}` - Sender's first name
- `{lastName}` - Sender's last name
- `{contentTitle}` - Content title
- `{contentDescription}` - Content description
- `{trackingLink}` - Unique tracking URL
- `{senderEmail}` - Sender's email address

## Channel Templates

### SMS Template
- Max length: 160 characters
- Format: Short, concise message with tracking link

### Email Template
- Subject line with variables
- HTML/text body with formatting
- Professional signature

### Social Templates

**Facebook:**
- Max length: 5000 characters
- Rich content description

**Twitter:**
- Max length: 280 characters
- Concise with hashtags

**LinkedIn:**
- Max length: 3000 characters
- Professional tone

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `302` - Redirect (tracking)
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Security

### Authentication
- Most endpoints require JWT Bearer token
- Tracking endpoint is public (no auth required)
- Users can only access their own data (non-admins)

### Authorization
- Admin users (RoleID = 1) can access all analytics
- UFO users (RoleID = 2+) can only access their own data

### Rate Limiting
Recommended rate limits:
- Share creation: 100/hour per user
- Analytics: 1000/hour per user
- Click tracking: No limit (public)

## Usage Examples

### Example 1: Share via SMS
```javascript
const response = await axios.post('/api/v1/share', {
  contentItemId: 5,
  channel: 'SMS',
  recipients: [
    { mobile: '+1234567890', name: 'John Doe' }
  ],
  personalMessage: 'Check this out!'
}, {
  headers: { Authorization: `Bearer ${token}` }
});

console.log('Tracking URL:', response.data.data.trackingUrl);
```

### Example 2: Get Analytics
```javascript
const response = await axios.get('/api/v1/share/analytics', {
  headers: { Authorization: `Bearer ${token}` },
  params: {
    channel: 'Email',
    startDate: '2026-04-01',
    endDate: '2026-04-30'
  }
});

console.log('Total clicks:', response.data.data.totalClicks);
```

### Example 3: Get Template
```javascript
const response = await axios.get('/api/v1/share/templates/Social', {
  params: { platform: 'Facebook' }
});

console.log('Template:', response.data.data.body);
```

## Testing

Run the comprehensive test suite:

```bash
cd backend
node test_sharing_api.cjs
```

The test script will:
1. Login with test credentials
2. Fetch a content item
3. Create shares for all channels
4. Simulate click tracking
5. Fetch analytics
6. Test all templates

## Performance Considerations

### Indexing
All tracking tables have optimized indexes for:
- Tracking code lookups
- User/content filtering
- Date range queries

### Denormalization
Share events store denormalized click counts for fast analytics queries.

### Caching
Consider caching:
- Templates (rarely change)
- Analytics (cache for 5-15 minutes)
- Content metadata

## Future Enhancements

- [ ] Geolocation tracking for engagement events
- [ ] A/B testing for templates
- [ ] Scheduled shares
- [ ] Bulk import of recipients
- [ ] Email delivery webhooks (SendGrid)
- [ ] SMS delivery webhooks (Twilio)
- [ ] Real-time analytics via WebSockets
- [ ] Export analytics to CSV/PDF
- [ ] Campaign performance comparison

## Support

For questions or issues, contact the development team or refer to:
- Main project documentation: `/docs`
- API specification: `/docs/architecture/API_SPECIFICATION.yaml`
- Database schema: `/database/03_Schema_Sharing_Tracking.sql`
