# Content API Testing Guide

## Prerequisites
1. Backend server running: `npm run dev`
2. Sample content data loaded: `node create_sample_content.cjs`
3. Valid authentication token (from login endpoint)

## Test Endpoints

### Public Endpoints (No Authentication Required)

#### 1. List All Content
```bash
curl http://localhost:3001/api/v1/content
```

#### 2. Get Content with Filters
```bash
# Filter by category
curl "http://localhost:3001/api/v1/content?category=1"

# Search by keyword
curl "http://localhost:3001/api/v1/content?search=Isotonix"

# Filter by market
curl "http://localhost:3001/api/v1/content?market=US"

# Pagination
curl "http://localhost:3001/api/v1/content?limit=5&offset=0"

# Multiple filters
curl "http://localhost:3001/api/v1/content?market=US&contentType=Video&limit=10"
```

#### 3. Get Featured Content
```bash
curl http://localhost:3001/api/v1/content/featured

# With custom limit
curl "http://localhost:3001/api/v1/content/featured?limit=5"
```

#### 4. Get Recent Content
```bash
curl http://localhost:3001/api/v1/content/recent

# With custom limit
curl "http://localhost:3001/api/v1/content/recent?limit=5"
```

#### 5. Search Content
```bash
curl "http://localhost:3001/api/v1/content/search?q=health"
curl "http://localhost:3001/api/v1/content/search?q=training&limit=5"
```

#### 6. Get Categories
```bash
curl http://localhost:3001/api/v1/content/categories
```

#### 7. Get Content by ID
```bash
# Replace 32 with actual content ID
curl http://localhost:3001/api/v1/content/32
```

### Protected Endpoints (Require Authentication)

First, get an authentication token:
```bash
# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@shop.com",
    "password": "YourPassword"
  }'
```

Save the token from the response, then use it in the following requests:

#### 8. Create Content (Admin Only)
```bash
curl -X POST http://localhost:3001/api/v1/content \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "New Product Launch",
    "subtitle": "Introducing our latest innovation",
    "description": "Experience the future of health and wellness",
    "contentType": "Video",
    "thumbnailURL": "https://cdn.shop.com/new-product.jpg",
    "mediaURL": "https://cdn.shop.com/new-product.mp4",
    "destinationURL": "https://www.shop.com/new-product",
    "publishStatus": "Published",
    "isFeatured": true,
    "featuredPriority": 10,
    "allowSMS": true,
    "allowEmail": true,
    "allowSocial": true,
    "ctaType": "BuyNow",
    "ctaLabel": "Shop Now",
    "categoryIds": [1],
    "marketIds": [1, 2],
    "languageIds": [1]
  }'
```

#### 9. Update Content (Admin Only)
```bash
# Replace 32 with actual content ID
curl -X PUT http://localhost:3001/api/v1/content/32 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Updated Title",
    "isFeatured": false,
    "publishStatus": "Published"
  }'
```

#### 10. Delete Content (Admin Only)
```bash
# Replace 32 with actual content ID
curl -X DELETE http://localhost:3001/api/v1/content/32 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Expected Response Format

### Success Response (List)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "ContentItemID": 32,
        "Title": "Isotonix OPC-3 - The Power of Antioxidants",
        "Subtitle": "Premium antioxidant supplement for optimal health",
        "Description": "...",
        "ThumbnailURL": "...",
        "ContentType": "Video",
        "PublishStatus": "Published",
        "IsFeatured": true,
        "CategoryName": "Products",
        "Tags": ["health", "supplements"],
        "Markets": ["US", "CA"],
        "Languages": ["en-US"],
        ...
      }
    ],
    "total": 15,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### Success Response (Single Item)
```json
{
  "success": true,
  "data": {
    "content": {
      "ContentItemID": 32,
      "Title": "...",
      ...
    },
    "relatedContent": [...]
  }
}
```

### Error Response
```json
{
  "error": "Bad Request",
  "message": "Invalid content ID"
}
```

## Testing Checklist

- [ ] List all content (default pagination)
- [ ] Filter by category
- [ ] Filter by market
- [ ] Filter by content type
- [ ] Search by keyword
- [ ] Get featured content
- [ ] Get recent content
- [ ] Get content by ID
- [ ] Get categories list
- [ ] Create new content (admin)
- [ ] Update existing content (admin)
- [ ] Delete content (admin)
- [ ] Test pagination (limit/offset)
- [ ] Test multiple filters combined
- [ ] Test invalid content ID (404)
- [ ] Test unauthorized access (401/403)

## Notes

- All public endpoints work without authentication
- Admin endpoints require valid JWT token
- Admin endpoints require CorporateAdmin or SuperAdmin role
- Content is soft-deleted (archived) not hard-deleted
- View count increments automatically when content is retrieved
- Featured content is sorted by priority
- Expired content is automatically filtered out from published listings
