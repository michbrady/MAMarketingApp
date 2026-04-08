# System Settings & Advanced Admin Features

Sprint 7: Admin Panel & User Management - System Settings Module

## Overview

This module provides comprehensive system settings management, feature flags, maintenance mode, and content moderation capabilities for the UnFranchise Marketing App.

## Features Implemented

### 1. System Settings Management
- **Settings Categories:**
  - Application (app name, logo, theme colors, support email)
  - Email (SMTP configuration)
  - SMS (Twilio configuration)
  - Notifications (email/SMS/push preferences)
  - Security (session timeout, login attempts, lockout duration)
  - Content (approval, upload limits, file types)

- **Settings Operations:**
  - Get all settings or by category
  - Update single setting
  - Bulk update multiple settings
  - Reset to defaults (all or by category)
  - Automatic encryption for sensitive settings
  - Audit logging for all changes

### 2. Feature Flags
- Enable/disable features without code deployment
- Default features:
  - `contacts_enabled` - Contact management
  - `followups_enabled` - Follow-up system
  - `analytics_enabled` - Analytics dashboard
  - `csv_import_enabled` - CSV import
  - `bulk_actions_enabled` - Bulk operations
  - `templates_enabled` - Template management
  - `notifications_enabled` - Notifications
  - `social_sharing_enabled` - Social sharing
  - `email_sharing_enabled` - Email sharing
  - `sms_sharing_enabled` - SMS sharing
  - `advanced_analytics_enabled` - Advanced analytics (Phase 2)
  - `ai_recommendations_enabled` - AI recommendations (Phase 5)

### 3. Maintenance Mode
- Enable/disable system-wide maintenance mode
- Custom maintenance message
- Scheduled end time (optional)
- Admin routes bypass maintenance mode
- Automatic 503 response for non-admin requests

### 4. Content Moderation
- Approve/reject content
- Feature/unfeature content
- Bulk approve/reject operations
- View pending, approved, rejected, and featured content
- Rejection reasons tracking

## Database Schema

### Tables Created

#### SystemSettings
```sql
- SettingID (PK)
- SettingKey (unique)
- SettingValue
- Category
- DataType (string, number, boolean, json)
- Description
- IsEncrypted
- UpdatedBy (FK to User)
- UpdatedDate
- CreatedDate
```

#### FeatureFlag
```sql
- FeatureFlagID (PK)
- FeatureName (unique)
- IsEnabled
- Description
- EnabledBy (FK to User)
- EnabledDate
- DisabledBy (FK to User)
- DisabledDate
- CreatedDate
```

#### MaintenanceMode
```sql
- MaintenanceModeID (PK)
- IsEnabled
- Message
- ScheduledStart
- ScheduledEnd
- EnabledBy (FK to User)
- EnabledDate
- DisabledBy (FK to User)
- DisabledDate
```

#### SettingsChangeLog
```sql
- ChangeLogID (PK)
- SettingKey
- OldValue
- NewValue
- ChangedBy (FK to User)
- ChangedDate
- IPAddress
- UserAgent
```

### Content Table Extensions
Added moderation fields to existing Content table:
- ApprovalStatus (Pending, Approved, Rejected)
- ApprovedBy, ApprovedDate
- RejectedBy, RejectedDate, RejectionReason
- IsFeatured, FeaturedBy, FeaturedDate

## API Endpoints

### System Settings
- `GET /api/v1/admin/settings` - Get all settings
- `GET /api/v1/admin/settings/grouped` - Get settings grouped by category
- `GET /api/v1/admin/settings/:category` - Get category settings
- `PUT /api/v1/admin/settings/:key` - Update single setting
- `PUT /api/v1/admin/settings/bulk` - Bulk update settings
- `POST /api/v1/admin/settings/reset` - Reset to defaults

### Feature Flags
- `GET /api/v1/admin/feature-flags` - Get all feature flags
- `PUT /api/v1/admin/feature-flags/:feature` - Toggle feature flag

### Maintenance Mode
- `GET /api/v1/admin/maintenance` - Get maintenance status
- `POST /api/v1/admin/maintenance/enable` - Enable maintenance mode
- `POST /api/v1/admin/maintenance/disable` - Disable maintenance mode

### Content Moderation
- `GET /api/v1/admin/content/pending` - Get pending content
- `GET /api/v1/admin/content/all` - Get all content
- `GET /api/v1/admin/content/featured` - Get featured content
- `POST /api/v1/admin/content/:id/approve` - Approve content
- `POST /api/v1/admin/content/:id/reject` - Reject content
- `POST /api/v1/admin/content/:id/feature` - Feature content
- `POST /api/v1/admin/content/:id/unfeature` - Unfeature content
- `POST /api/v1/admin/content/bulk/approve` - Bulk approve
- `POST /api/v1/admin/content/bulk/reject` - Bulk reject

## Backend Files

### Services
- `src/services/system-settings.service.ts` - Settings CRUD operations
- `src/services/feature-flag.service.ts` - Feature flag management
- `src/services/maintenance.service.ts` - Maintenance mode management
- `src/services/content-moderation.service.ts` - Content moderation

### Controllers
- `src/controllers/settings.controller.ts` - Settings & maintenance endpoints
- `src/controllers/content-moderation.controller.ts` - Content moderation endpoints

### Middleware
- `src/middleware/maintenance.middleware.ts` - Maintenance mode check

### Utilities
- `src/utils/encryption.ts` - AES-256 encryption for sensitive settings

### Types
- `src/types/settings.types.ts` - TypeScript type definitions

### Routes
- `src/routes/admin.routes.ts` - Updated with new endpoints

### Database
- `database/10_Schema_Settings.sql` - Schema and stored procedures

### Scripts
- `seed_system_settings.cjs` - Seed default settings and feature flags
- `test_settings_api.cjs` - Comprehensive API test suite

## Frontend Files

### Pages
- `src/app/(dashboard)/admin/settings/page.tsx` - Main settings page
- `src/app/(dashboard)/admin/content/moderation/page.tsx` - Content moderation
- `src/app/maintenance/page.tsx` - Maintenance mode display page

### Components
- `src/components/admin/settings/ApplicationSettings.tsx`
- `src/components/admin/settings/EmailSettings.tsx`
- `src/components/admin/settings/SmsSettings.tsx`
- `src/components/admin/settings/NotificationSettings.tsx`
- `src/components/admin/settings/FeatureFlags.tsx`
- `src/components/admin/settings/MaintenanceMode.tsx`

### API Client
- `src/lib/api/settings.ts` - API functions for all settings operations

## Setup & Deployment

### 1. Deploy Database Schema
```bash
sqlcmd -S localhost -U sa -P "password" -d unfranchise_marketing -i database/10_Schema_Settings.sql
```

### 2. Seed Default Settings
```bash
cd backend
node seed_system_settings.cjs
```

### 3. Environment Variables
Add to `.env`:
```env
ENCRYPTION_KEY=your_32_character_encryption_key_here
```

### 4. Start Backend
```bash
cd backend
npm run dev
```

### 5. Start Frontend
```bash
cd frontend
npm run dev
```

## Testing

### Run API Tests
```bash
cd backend
node test_settings_api.cjs
```

Tests include:
- Authentication
- Get all settings
- Get settings by category
- Update single setting
- Bulk update settings
- Feature flag toggling
- Maintenance mode enable/disable
- Maintenance mode blocking
- Content moderation
- Authorization checks

## Security Features

### Encryption
- Sensitive settings encrypted using AES-256-CBC
- Encrypted settings:
  - `email_smtp_password`
  - `sms_twilio_account_sid`
  - `sms_twilio_auth_token`

### Authorization
- All endpoints require SuperAdmin role
- Admin routes bypass maintenance mode
- Audit logging for all changes

### Audit Trail
- All setting changes logged with:
  - Setting key
  - Old value and new value
  - Changed by (user ID)
  - IP address and user agent
  - Timestamp

## Usage Examples

### Update a Setting
```typescript
import { updateSetting } from '@/lib/api/settings';

await updateSetting('app_name', 'My Custom App Name');
```

### Bulk Update Settings
```typescript
import { bulkUpdateSettings } from '@/lib/api/settings';

await bulkUpdateSettings([
  { key: 'app_theme_primary_color', value: '#3b82f6' },
  { key: 'app_theme_secondary_color', value: '#8b5cf6' }
]);
```

### Toggle Feature Flag
```typescript
import { toggleFeatureFlag } from '@/lib/api/settings';

await toggleFeatureFlag('analytics_enabled', true);
```

### Enable Maintenance Mode
```typescript
import { enableMaintenance } from '@/lib/api/settings';

await enableMaintenance(
  'System maintenance in progress',
  new Date(Date.now() + 3600000).toISOString() // 1 hour from now
);
```

### Check if Feature Enabled
```typescript
import featureFlagService from './services/feature-flag.service';

const isEnabled = await featureFlagService.isFeatureEnabled('contacts_enabled');
```

## Best Practices

1. **Sensitive Settings**: Always encrypt passwords, tokens, and keys
2. **Feature Flags**: Use for gradual rollouts and emergency switches
3. **Maintenance Mode**: Schedule during low-traffic periods
4. **Content Moderation**: Review content before featuring
5. **Audit Logs**: Regularly review for security and compliance

## Troubleshooting

### Settings Not Updating
- Check user has SuperAdmin role
- Verify setting key exists in database
- Check audit logs for errors

### Maintenance Mode Not Working
- Verify middleware is registered in index.ts
- Check maintenance mode is enabled in database
- Ensure admin routes are properly bypassing

### Encryption Errors
- Verify ENCRYPTION_KEY is 32 characters
- Check encrypted settings have correct format (IV:encrypted)
- Re-save setting if encryption key changed

## Future Enhancements

- [ ] Setting validation rules
- [ ] Setting templates/presets
- [ ] Role-based setting permissions
- [ ] Setting version history
- [ ] Scheduled maintenance windows
- [ ] Feature flag targeting (by user, role, market)
- [ ] A/B testing with feature flags
- [ ] Content approval workflows
- [ ] Automated content moderation with AI

## Support

For issues or questions, contact the development team or refer to:
- Project documentation in `docs/`
- API specification in `docs/architecture/API_SPECIFICATION.yaml`
- Database schema in `database/00_Schema_Summary.md`
