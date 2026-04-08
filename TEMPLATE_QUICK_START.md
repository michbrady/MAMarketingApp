# Share Templates - Quick Start Guide

## 5-Minute Setup

### 1. Database Setup (1 minute)

```bash
cd /path/to/MAMarketingApp
sqlcmd -S localhost -U sa -P "YourPassword" -d UnFranchiseMarketing -i database/06_Schema_ShareTemplates.sql
```

### 2. Seed Templates (1 minute)

```bash
cd backend
node seed_templates.cjs
```

You should see:
```
✅ Created: SMS - Product Share
✅ Created: Email - Product Share
✅ Created: Facebook - Product
...
🎉 Template seeding completed!
```

### 3. Verify Backend Build (1 minute)

```bash
npm run build
```

Should complete with no errors.

### 4. Install Frontend Dependencies (2 minutes)

```bash
cd ../frontend
npm install
```

### 5. Start the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Using the Template System

### As an Administrator

1. **Access Template Manager**
   - Login with CorporateAdmin or SuperAdmin account
   - Navigate to: http://localhost:3000/admin/templates
   - You'll see 15+ default templates grouped by channel

2. **Create a New Template**
   - Click "Create Template" button
   - Fill in template information:
     - **Name:** "My Custom SMS Template"
     - **Channel:** SMS
     - **Content Type:** Product
     - **Message:** "Hi {firstName}! Check this out: {contentTitle}. {trackingLink}"
   - Click "Insert Variable" to add dynamic fields
   - Preview updates in real-time on the right
   - Click "Create Template"

3. **Set Default Template**
   - Find your template in the list
   - Click "Set Default" button
   - This template will be used automatically for SMS + Product shares

4. **View Performance**
   - See usage count, shares, clicks, and CTR for each template
   - Higher CTR templates are better performers

### As a Developer

#### Get Templates

```typescript
import { getTemplates } from '@/lib/api/templates';

// Get all SMS templates
const smsTemplates = await getTemplates({
  ShareChannel: 'SMS',
  IsActive: true,
});

// Get default email template for products
const defaultTemplate = await getDefaultTemplate('Email', {
  ContentType: 'Product',
});
```

#### Create Template

```typescript
import { createTemplate } from '@/lib/api/templates';

const template = await createTemplate({
  TemplateName: 'My Template',
  ShareChannel: 'Email',
  ContentType: 'Product',
  SubjectTemplate: 'Check this out, {firstName}!',
  MessageTemplate: 'Hi {firstName}, I wanted to share {contentTitle} with you.',
  HTMLTemplate: '<h1>Hi {firstName}!</h1><p>{contentDescription}</p>',
  IsDefault: false,
});
```

#### Render Template

```typescript
import { previewTemplate } from '@/lib/api/templates';

const result = await previewTemplate({
  ShareTemplateID: 1,
  Variables: {
    firstName: 'John',
    contentTitle: 'Amazing Product',
    trackingLink: 'https://example.com/track/abc123',
  },
});

console.log(result.message);
// Output: "Hi John, I wanted to share Amazing Product with you."
```

## Available Variables

Use these in your templates with `{variableName}` syntax:

| Variable | Example |
|----------|---------|
| `{firstName}` | John |
| `{lastName}` | Doe |
| `{contentTitle}` | Amazing Product Launch |
| `{contentDescription}` | Discover our latest... |
| `{trackingLink}` | https://example.com/track/abc123 |
| `{senderEmail}` | sarah@example.com |
| `{senderFirstName}` | Sarah |
| `{senderLastName}` | Smith |
| `{companyName}` | Market America |
| `{eventDate}` | June 15, 2026 |
| `{eventTime}` | 7:00 PM EST |
| `{eventLocation}` | Grand Convention Center |
| `{productPrice}` | $99.99 |

## Character Limits by Channel

| Channel | Limit | Recommendation |
|---------|-------|----------------|
| SMS | 160 | Keep it short and sweet |
| Email Subject | 255 | 50-60 chars for mobile preview |
| Twitter/X | 280 | Include link and hashtags |
| LinkedIn | 3000 | Professional, detailed |
| Facebook | 63,206 | First 130 chars are key |
| Instagram | 2,200 | Visual-first, caption second |
| WhatsApp | 65,536 | Conversational tone |

## Template Best Practices

### SMS Templates
```
✅ Good: "Hi {firstName}! New product: {contentTitle}. See it: {trackingLink}"
❌ Bad: "Hello there! I'm reaching out to share with you this incredible new product..."
```
**Why:** SMS is character-limited. Be concise and include the link.

### Email Subject Lines
```
✅ Good: "{senderFirstName} shared {contentTitle} with you"
❌ Bad: "You've been sent a link to view some content from our platform"
```
**Why:** Personal and specific subjects get higher open rates.

### Social Media
```
✅ Good: "Just discovered {contentTitle}! 🎉 {trackingLink} #UnFranchise"
❌ Bad: "{trackingLink}"
```
**Why:** Add context, emoji, and hashtags for better engagement.

## Testing Your Templates

### 1. Use the Preview Feature

In the template form, the right side shows a live preview with sample data. Make sure:
- Variables are replaced correctly
- Character count is within limits
- Message makes sense

### 2. Test API Endpoints

```bash
# Get templates
curl http://localhost:3001/api/v1/templates \
  -H "Authorization: Bearer YOUR_TOKEN"

# Preview template
curl -X POST http://localhost:3001/api/v1/templates/preview \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "MessageTemplate": "Hi {firstName}, check out {contentTitle}!",
    "Variables": {
      "firstName": "John",
      "contentTitle": "New Product"
    }
  }'
```

### 3. Check Performance Metrics

After using templates in production:
1. Go to admin/templates
2. Look at "Shares", "Clicks", and "CTR" columns
3. Templates with higher CTR perform better
4. Consider setting high-CTR templates as default

## Troubleshooting

### "Permission denied" when accessing /admin/templates
- **Solution:** Make sure you're logged in with CorporateAdmin or SuperAdmin role

### Template preview not updating
- **Solution:** Wait 500ms (debounce delay) or check browser console for errors

### Rich text editor not loading
- **Solution:**
  ```bash
  cd frontend
  npm install react-quill@beta --legacy-peer-deps
  ```

### Database connection error
- **Solution:** Verify database schema is deployed:
  ```bash
  sqlcmd -S localhost -U sa -Q "SELECT COUNT(*) FROM ShareTemplate"
  ```

### Build errors
- **Backend:** Check `npm run build` output for TypeScript errors
- **Frontend:** Check `npm run build` output for component errors

## API Quick Reference

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/v1/templates` | GET | Auth | List templates |
| `/api/v1/templates/:id` | GET | Auth | Get one template |
| `/api/v1/templates` | POST | Admin | Create template |
| `/api/v1/templates/:id` | PUT | Admin | Update template |
| `/api/v1/templates/:id` | DELETE | Admin | Delete template |
| `/api/v1/templates/preview` | POST | Auth | Preview rendering |
| `/api/v1/templates/defaults/:channel` | GET | Auth | Get default |
| `/api/v1/templates/:id/set-default` | POST | Admin | Set as default |
| `/api/v1/templates/performance` | GET | Admin | Get metrics |

## Next Steps

1. **Integrate with Share Workflows**
   - Use templates when users share content
   - Pass dynamic variables from content and user data
   - Track which templates users prefer

2. **Monitor Performance**
   - Check template CTR weekly
   - A/B test different messages
   - Update low-performing templates

3. **Customize for Your Market**
   - Create market-specific templates
   - Add language translations
   - Adjust tone and messaging

## Support

- **Documentation:** See `TEMPLATE_SYSTEM_README.md` for full details
- **API Spec:** See `docs/architecture/API_SPECIFICATION.yaml`
- **Issues:** Check browser console and backend logs

---

**Quick Links:**
- Admin Panel: http://localhost:3000/admin/templates
- API Docs: http://localhost:3001/api/v1
- Full README: `TEMPLATE_SYSTEM_README.md`
