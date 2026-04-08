# Follow-up System - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### Step 1: Deploy Database Schema
```bash
cd database
sqlcmd -S dbms-dwhs.corp.shop.com\DWP01 -U unfranchise_app -P <password> -d UnFranchiseMarketing -i 09_Schema_FollowUp.sql
```

### Step 2: Seed Templates
```bash
cd ../backend
node seed_followup_templates.cjs
```
Expected output: "15 templates created"

### Step 3: Test API
```bash
# Start server in one terminal
npm run dev

# Test in another terminal
node test_followup_api.cjs
```
Expected output: "All tests passed"

## 📋 Quick API Reference

### Create Follow-up
```bash
POST /api/v1/followups
{
  "contactId": 123,
  "dueDate": "2026-04-08T10:00:00Z",
  "priority": "High",
  "type": "Call",
  "notes": "Discuss product interest"
}
```

### List Upcoming
```bash
GET /api/v1/followups/upcoming?days=7
```

### Apply Template
```bash
POST /api/v1/followups/apply-template
{
  "templateId": 1,
  "contactId": 123
}
```

### Complete Follow-up
```bash
POST /api/v1/followups/:id/complete
{
  "notes": "Successfully connected"
}
```

## 📁 Key Files

- **Backend**: `src/services/followup.service.ts`
- **API**: `src/controllers/followup.controller.ts`  
- **Routes**: `src/routes/followup.routes.ts`
- **Types**: `src/types/followup.types.ts`
- **DB Schema**: `database/09_Schema_FollowUp.sql`
- **Tests**: `test_followup_api.cjs`
- **Docs**: `FOLLOWUP_SYSTEM_README.md`

## ✅ Success Criteria

All implemented and tested:
- ✅ 11 API endpoints working
- ✅ 15 templates seeded
- ✅ 3 database tables + procedures + trigger
- ✅ Automated follow-up creation ready
- ✅ Contact integration complete
- ✅ Statistics and analytics working

## 🔗 Next Steps

1. **Frontend Integration**: Build UI components
2. **Notification Worker**: Send reminder emails
3. **Share Integration**: Auto-create on share
4. **Mobile App**: Add follow-up features

## 📞 Support

See `FOLLOWUP_SYSTEM_README.md` for complete documentation.
