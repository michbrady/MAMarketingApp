# Share Templates & Admin Management System

## Overview

The Share Templates system provides a comprehensive template management solution for SMS, Email, and Social Media sharing. This system enables administrators to create, manage, and optimize message templates with variable substitution, performance tracking, and channel-specific formatting.

## Features

### Backend Features

1. **Template CRUD Operations**
   - Create, read, update, and delete templates
   - Role-based access control (CorporateAdmin and SuperAdmin only)
   - System templates protection (cannot be deleted)

2. **Template Management**
   - Support for SMS, Email, and Social Media channels
   - Content-type specific templates (Product, Business Opportunity, Event, General)
   - Social platform-specific templates (Facebook, Twitter, LinkedIn, Instagram, WhatsApp, WeChat)
   - Default template selection per channel/content-type

3. **Variable Substitution**
   - Dynamic variable replacement with `{variableName}` syntax
   - 13+ built-in variables (firstName, lastName, contentTitle, trackingLink, etc.)
   - Live preview with sample data
   - Automatic variable extraction and validation

4. **Template Rendering**
   - Plain text rendering for SMS and social media
   - HTML rendering for email templates
   - XSS prevention with HTML sanitization
   - Character count tracking with limit enforcement

5. **Performance Tracking**
   - Usage count tracking
   - Total shares and clicks
   - Click-through rate (CTR) calculation
   - Last used date
   - Performance-based template recommendations

6. **Channel-Specific Features**
   - **SMS**: 160 character limit enforcement
   - **Email**: Subject line + HTML templates
   - **Social**: Platform-specific character limits (Twitter: 280, LinkedIn: 3000, etc.)

### Frontend Features

1. **Admin Template Management Interface**
   - Template list with filtering and search
   - Grouped display by channel
   - Performance metrics display
   - Create/Edit/Delete operations

2. **Rich Template Editor**
   - WYSIWYG HTML editor for email templates (using React Quill)
   - Text editor with syntax highlighting
   - HTML source view toggle
   - Variable insertion helper

3. **Variable Inserter Component**
   - Searchable variable picker
   - Variable documentation
   - One-click insertion into template
   - Context-aware placement

4. **Live Template Preview**
   - Real-time rendering with sample data
   - Subject line preview (email)
   - HTML preview with iframe (email)
   - Character count with limit warnings
   - Variables used display

5. **Template List Features**
   - Filter by channel, content type, status
   - Search across template name/description
   - Performance metrics display
   - Set default template action
   - Quick edit/delete actions

## Database Schema

### ShareTemplate Table

```sql
CREATE TABLE dbo.ShareTemplate (
    ShareTemplateID INT IDENTITY(1,1) PRIMARY KEY,
    TemplateName NVARCHAR(100) NOT NULL,
    TemplateDescription NVARCHAR(500) NULL,
    ShareChannel NVARCHAR(20) NOT NULL,  -- SMS, Email, Social
    SocialPlatform NVARCHAR(50) NULL,    -- For Social channel
    ContentType NVARCHAR(50) NULL,       -- Product, BusinessOpportunity, Event, General
    SubjectTemplate NVARCHAR(255) NULL,  -- For Email
    MessageTemplate NVARCHAR(MAX) NOT NULL,
    HTMLTemplate NVARCHAR(MAX) NULL,     -- For Email
    IsDefault BIT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    IsSystemTemplate BIT NOT NULL DEFAULT 0,
    MaxCharacters INT NULL,
    UsageCount INT NOT NULL DEFAULT 0,
    TotalShares INT NOT NULL DEFAULT 0,
    TotalClicks INT NOT NULL DEFAULT 0,
    ClickThroughRate DECIMAL(5,2) NULL,
    LastUsedDate DATETIME2(7) NULL,
    MarketID INT NULL,
    LanguageID INT NULL,
    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    CreatedBy BIGINT NULL,
    UpdatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    UpdatedBy BIGINT NULL
);
```

### Stored Procedures

- `sp_GetDefaultTemplate` - Get default template for a channel/content type
- `sp_UpdateTemplatePerformance` - Update performance metrics
- `sp_IncrementTemplateUsage` - Increment usage counter
- `sp_SetDefaultTemplate` - Set template as default

## API Endpoints

### Template Management

```
GET    /api/v1/templates                    - Get all templates (with filters)
GET    /api/v1/templates/:id                - Get template by ID
GET    /api/v1/templates/defaults/:channel  - Get default template
GET    /api/v1/templates/performance        - Get performance metrics (admin only)
POST   /api/v1/templates                    - Create template (admin only)
PUT    /api/v1/templates/:id                - Update template (admin only)
DELETE /api/v1/templates/:id                - Delete template (admin only)
POST   /api/v1/templates/preview            - Preview template with data
POST   /api/v1/templates/:id/set-default    - Set as default (admin only)
```

### Query Parameters

**GET /api/v1/templates**
- `ShareChannel` - Filter by channel (SMS, Email, Social)
- `ContentType` - Filter by content type
- `SocialPlatform` - Filter by social platform
- `IsActive` - Filter by active status
- `IsDefault` - Filter by default status
- `MarketID` - Filter by market
- `LanguageID` - Filter by language

## Available Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{firstName}` | Recipient first name | John |
| `{lastName}` | Recipient last name | Doe |
| `{contentTitle}` | Content title | Amazing Product Launch |
| `{contentDescription}` | Content description | Discover our latest innovation... |
| `{trackingLink}` | Unique tracking URL | https://example.com/track/abc123 |
| `{senderEmail}` | Sender's email | sarah@example.com |
| `{senderFirstName}` | Sender's first name | Sarah |
| `{senderLastName}` | Sender's last name | Smith |
| `{companyName}` | Company name | Market America |
| `{eventDate}` | Event date | June 15, 2026 |
| `{eventTime}` | Event time | 7:00 PM EST |
| `{eventLocation}` | Event location | Grand Convention Center |
| `{productPrice}` | Product price | $99.99 |

## Setup Instructions

### 1. Database Setup

Run the database migration:

```bash
sqlcmd -S localhost -U sa -P "password" -d UnFranchiseMarketing -i database/06_Schema_ShareTemplates.sql
```

### 2. Seed Default Templates

Seed the system with 15+ default templates:

```bash
cd backend
node seed_templates.cjs
```

This will create:
- 4 SMS templates (Product, Business, Event, General)
- 3 Email templates with HTML (Product, Business, Event)
- 8 Social templates (Facebook, Twitter, LinkedIn, Instagram, WhatsApp)

### 3. Backend Dependencies

All required dependencies are already in `package.json`:
- `mssql` - SQL Server driver
- `zod` - Validation schemas
- `express` - Web framework

### 4. Frontend Dependencies

Install React Quill for rich text editing:

```bash
cd frontend
npm install react-quill@beta --legacy-peer-deps
```

### 5. Environment Variables

No additional environment variables needed - uses existing database configuration.

## Usage Examples

### Backend - Create Template

```typescript
import * as templateService from './services/template.service';

const template = await templateService.createTemplate({
  TemplateName: 'SMS - Product Promotion',
  TemplateDescription: 'SMS template for product promotions',
  ShareChannel: 'SMS',
  ContentType: 'Product',
  MessageTemplate: 'Hi {firstName}! Check out our new product: {contentTitle}. {trackingLink}',
  IsDefault: false,
  MaxCharacters: 160,
}, userId);
```

### Backend - Render Template

```typescript
const rendered = templateService.renderTemplate(
  'Hi {firstName}, check this out: {contentTitle}',
  {
    firstName: 'John',
    contentTitle: 'Amazing Product',
  }
);
// Result: "Hi John, check this out: Amazing Product"
```

### Frontend - Use Template API

```typescript
import { getTemplates, createTemplate } from '@/lib/api/templates';

// Get all SMS templates
const smsTemplates = await getTemplates({ ShareChannel: 'SMS' });

// Create new template
const newTemplate = await createTemplate({
  TemplateName: 'My Custom Template',
  ShareChannel: 'Email',
  MessageTemplate: 'Hello {firstName}!',
  SubjectTemplate: 'Important Update',
  HTMLTemplate: '<h1>Hello {firstName}!</h1>',
});
```

### Frontend - Access Admin Page

Navigate to: `http://localhost:3000/admin/templates`

**Requirements:**
- Must be logged in
- Must have role: CorporateAdmin or SuperAdmin

## File Structure

### Backend

```
backend/
├── src/
│   ├── services/
│   │   └── template.service.ts          # Template business logic
│   ├── routes/
│   │   └── template.routes.ts           # API endpoints
│   ├── validation/
│   │   └── template.validation.ts       # Zod schemas
│   ├── types/
│   │   ├── template.types.ts            # TypeScript types
│   │   └── express.d.ts                 # Express type extensions
│   ├── middleware/
│   │   ├── role.middleware.ts           # Role-based auth
│   │   └── validation.middleware.ts     # Request validation
│   └── index.ts                         # Routes registration
├── seed_templates.cjs                   # Seed script
└── package.json
```

### Frontend

```
frontend/
├── src/
│   ├── app/
│   │   └── (dashboard)/
│   │       └── admin/
│   │           └── templates/
│   │               └── page.tsx         # Main admin page
│   ├── components/
│   │   └── admin/
│   │       ├── TemplateList.tsx         # Template list component
│   │       ├── TemplateForm.tsx         # Create/Edit form
│   │       ├── TemplateEditor.tsx       # Rich text editor
│   │       ├── TemplatePreview.tsx      # Live preview
│   │       └── VariableInserter.tsx     # Variable picker
│   ├── lib/
│   │   └── api/
│   │       └── templates.ts             # API client
│   ├── types/
│   │   └── template.ts                  # TypeScript types
│   └── app/
│       └── globals.css                  # Quill editor styles
└── package.json
```

### Database

```
database/
└── 06_Schema_ShareTemplates.sql         # Table and stored procedures
```

## Performance Optimization

### Backend Optimizations

1. **Indexed Queries**
   - Index on `(ShareChannel, ContentType, IsActive)`
   - Index on `(ShareChannel, ContentType, IsDefault)`
   - Index on `(ClickThroughRate DESC, TotalShares DESC)`

2. **Stored Procedures**
   - Pre-compiled execution plans
   - Reduced network round-trips

3. **Caching Opportunities**
   - Default templates (rarely change)
   - Active templates list
   - Template performance metrics

### Frontend Optimizations

1. **React Query**
   - Automatic caching
   - Background refetching
   - Optimistic updates

2. **Component Optimizations**
   - Debounced preview updates (500ms)
   - Lazy loading of React Quill
   - Conditional rendering

## Security Considerations

1. **Role-Based Access Control**
   - Only CorporateAdmin and SuperAdmin can manage templates
   - System templates cannot be deleted
   - UFOs can only view/use templates

2. **Input Validation**
   - Zod schema validation on all endpoints
   - XSS prevention in HTML templates
   - SQL injection prevention (parameterized queries)

3. **Template Safety**
   - HTML sanitization before preview
   - Character limit enforcement
   - Variable validation

## Testing

### Backend Tests

```bash
cd backend
npm test
```

Test coverage includes:
- Template CRUD operations
- Variable substitution
- Template rendering
- Performance metrics calculation
- Role-based access control

### Frontend Tests

```bash
cd frontend
npm test
```

Test coverage includes:
- Template list filtering
- Template form validation
- Variable insertion
- Preview rendering

## Troubleshooting

### Common Issues

1. **React Quill not loading**
   - Ensure `react-quill@beta` is installed with `--legacy-peer-deps`
   - Check that dynamic import is used (SSR compatibility)

2. **Database connection errors**
   - Verify database schema is deployed
   - Check ShareTemplate table exists
   - Ensure stored procedures are created

3. **Permission denied errors**
   - Verify user has CorporateAdmin or SuperAdmin role
   - Check authentication token is valid

4. **Template preview not updating**
   - Check browser console for errors
   - Verify API endpoints are accessible
   - Ensure sample data is provided

## Future Enhancements

1. **A/B Testing**
   - Compare template performance
   - Automatic winner selection

2. **Template Versions**
   - Version history
   - Rollback capability

3. **AI-Powered Templates**
   - Template suggestions based on content
   - Performance prediction
   - Auto-optimization

4. **Multi-Language Support**
   - Language-specific templates
   - Translation management
   - Locale-aware rendering

5. **Advanced Analytics**
   - Conversion tracking
   - Engagement heatmaps
   - ROI calculation

## Success Criteria

- ✅ Template service with CRUD operations
- ✅ 15+ default templates created and seeded
- ✅ Template rendering with variable substitution
- ✅ Admin UI for template management
- ✅ Rich text editor for email templates
- ✅ Template preview functionality
- ✅ Variable inserter helper
- ✅ Template validation working
- ✅ Channel-specific character limits enforced
- ✅ Performance tracking implemented
- ✅ Role-based access control
- ✅ TypeScript compilation successful
- ✅ Production-ready code

## Support

For questions or issues:
- Check this README
- Review API documentation in `docs/architecture/API_SPECIFICATION.yaml`
- Check component specifications in `docs/architecture/COMPONENT_SPECIFICATIONS.md`
- Review database schema in `database/00_Schema_Summary.md`

---

**Version:** 1.0.0
**Last Updated:** 2026-04-05
**Sprint:** Phase 1, Sprint 5 - Sharing Engine
