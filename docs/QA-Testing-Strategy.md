# UnFranchise Marketing App - Quality Assurance & Testing Strategy

## Document Control
- **Version:** 1.0
- **Date:** 2026-04-04
- **QA Lead:** QA Team
- **Status:** Draft

---

## 1. Testing Strategy Overview

### 1.1 Testing Philosophy
This QA strategy is built on the following principles:

**Shift-Left Testing:** Quality is built in from the start, not tested in at the end. Testing activities begin during requirements and design phases.

**Risk-Based Testing:** Prioritize testing efforts based on business criticality and technical risk. The Content Sharing Engine receives highest priority.

**Automated-First:** Automate repetitive tests to enable fast feedback and continuous delivery. Manual testing focuses on exploratory and UX validation.

**Test Pyramid Approach:**
- 70% Unit Tests (fast, isolated, component-level)
- 20% Integration Tests (API, service, database integration)
- 10% E2E Tests (critical user journeys)

**Continuous Testing:** Tests run automatically on every commit, pull request, and deployment.

### 1.2 Testing Approach by Phase

#### Phase 1: MVP Content Sharing Engine
**Focus Areas:**
- Authentication and authorization
- Content library functionality
- Sharing workflows (SMS, Email, Social)
- Tracking link generation and click tracking
- Share event logging
- Admin content management
- API contract validation

**Quality Gates:**
- All critical path tests passing
- 80% code coverage minimum
- Zero critical/high severity bugs
- Performance benchmarks met
- Security scan passed

#### Phase 2: Contacts + Engagement
**Focus Areas:**
- Contact CRUD operations
- Contact import/CSV processing
- Engagement event tracking
- Contact timeline accuracy
- Analytics calculations
- Data integrity

**Quality Gates:**
- All Phase 1 regression tests passing
- New feature coverage 80%+
- Data migration tested
- Performance benchmarks maintained

#### Phase 3: Activity Feed + Nudging
**Focus Areas:**
- Real-time feed updates
- Notification delivery
- Rules engine accuracy
- User preferences
- Notification timing

**Quality Gates:**
- Real-time performance validated
- Rules engine 100% coverage
- Notification reliability 99.9%+

### 1.3 Quality Gates

**Code Commit Gate:**
- Unit tests pass
- Linting passes
- No new security vulnerabilities
- Code review approved

**Pull Request Gate:**
- All unit and integration tests pass
- Code coverage maintained or improved
- No critical/high bugs introduced
- API contracts not broken
- Documentation updated

**Pre-Production Gate:**
- All E2E tests pass
- Performance tests pass
- Security scan clean
- UAT sign-off received
- Rollback plan documented

**Production Release Gate:**
- Smoke tests pass in production
- Monitoring/alerts configured
- Incident response plan ready
- Zero critical bugs

### 1.4 Definition of Done

A feature is "Done" when:
- [ ] Code complete and merged
- [ ] Unit tests written (80% coverage minimum)
- [ ] Integration tests written for APIs
- [ ] E2E tests written for user journeys
- [ ] Security testing completed
- [ ] Performance testing completed
- [ ] Accessibility testing completed (WCAG 2.1 AA)
- [ ] Cross-browser testing completed
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] QA testing completed and signed off
- [ ] Product Owner acceptance received
- [ ] No open critical or high severity bugs

---

## 2. Test Plan by Type

### 2.1 Unit Testing

#### Backend Service Unit Tests

**Scope:**
- Business logic in service layer
- Data validation and transformation
- Utility functions
- Error handling
- Security functions (encryption, hashing, token generation)

**Framework:** Jest (Node.js) or pytest (Python)

**Coverage Targets:**
- Overall: 80% minimum
- Critical services: 90% minimum
  - Authentication service
  - Tracking link service
  - Share event service
  - Engagement tracking service

**Key Test Areas:**

**Authentication Service:**
```javascript
describe('AuthenticationService', () => {
  test('should authenticate valid user credentials')
  test('should reject invalid credentials')
  test('should generate valid JWT token')
  test('should validate token expiration')
  test('should enforce role-based permissions')
  test('should lock account after failed attempts')
  test('should log security events')
})
```

**Content Service:**
```javascript
describe('ContentService', () => {
  test('should filter content by market')
  test('should filter content by language')
  test('should filter content by availability date')
  test('should respect publish status')
  test('should validate content metadata')
  test('should handle missing assets gracefully')
})
```

**Tracking Link Service:**
```javascript
describe('TrackingLinkService', () => {
  test('should generate unique tracking links')
  test('should encode UFO, content, channel in link')
  test('should create short URLs')
  test('should validate link expiration')
  test('should handle link collision')
  test('should support deep link format for future mobile')
})
```

**Share Event Service:**
```javascript
describe('ShareEventService', () => {
  test('should record share event with all metadata')
  test('should validate channel type')
  test('should validate content availability')
  test('should enforce market restrictions')
  test('should handle duplicate shares')
  test('should emit event for tracking')
})
```

**Engagement Tracking Service:**
```javascript
describe('EngagementTrackingService', () => {
  test('should record click events')
  test('should record view events')
  test('should handle duplicate events within timeframe')
  test('should calculate engagement metrics')
  test('should identify hot prospects')
  test('should track video completion percentage')
})
```

#### Frontend Component Unit Tests

**Scope:**
- React component rendering
- User interactions
- State management
- Form validation
- Error states
- Loading states

**Framework:** Jest + React Testing Library

**Coverage Targets:**
- Overall: 75% minimum
- Critical components: 85% minimum
  - Login form
  - Content library
  - Share flow wizard
  - Tracking dashboard

**Key Test Areas:**

**Content Library Component:**
```javascript
describe('ContentLibrary', () => {
  test('should render content grid')
  test('should filter by category')
  test('should search content by keyword')
  test('should handle empty results')
  test('should show loading state')
  test('should handle API errors')
  test('should favorite content')
})
```

**Share Flow Component:**
```javascript
describe('ShareFlow', () => {
  test('should show channel selection')
  test('should validate recipient selection')
  test('should generate preview')
  test('should allow personal message within rules')
  test('should disable submit until valid')
  test('should show success confirmation')
  test('should handle share failure')
})
```

**Login Component:**
```javascript
describe('Login', () => {
  test('should validate email format')
  test('should validate password requirements')
  test('should show error on invalid credentials')
  test('should redirect on success')
  test('should handle locked account')
  test('should show loading during authentication')
})
```

### 2.2 Integration Testing

#### API Integration Tests

**Scope:**
- API endpoint functionality
- Request/response contracts
- Authentication/authorization
- Error responses
- Data validation
- Rate limiting

**Framework:** Supertest (Node.js) or pytest + requests (Python)

**Environment:** Isolated test database with seed data

**Key Test Suites:**

**Authentication API:**
```javascript
describe('POST /api/auth/login', () => {
  test('should return JWT on valid credentials')
  test('should return 401 on invalid credentials')
  test('should return 403 on locked account')
  test('should log security event')
})

describe('GET /api/auth/me', () => {
  test('should return user profile with valid token')
  test('should return 401 with invalid token')
  test('should return 401 with expired token')
})
```

**Content API:**
```javascript
describe('GET /api/content', () => {
  test('should return content for user market')
  test('should filter by category')
  test('should search by keyword')
  test('should paginate results')
  test('should exclude expired content')
  test('should return 401 without authentication')
})

describe('GET /api/content/:id', () => {
  test('should return content detail')
  test('should return 404 for missing content')
  test('should return 403 for wrong market')
})
```

**Share API:**
```javascript
describe('POST /api/shares', () => {
  test('should create share event')
  test('should generate tracking link')
  test('should validate content availability')
  test('should validate channel type')
  test('should enforce market restrictions')
  test('should return 400 on invalid data')
  test('should return share confirmation with tracking URL')
})

describe('GET /api/shares/history', () => {
  test('should return user share history')
  test('should filter by date range')
  test('should include engagement metrics')
})
```

**Tracking API:**
```javascript
describe('GET /api/track/:linkId', () => {
  test('should record click event')
  test('should redirect to content')
  test('should handle invalid link')
  test('should handle expired link')
  test('should record user agent and IP')
})

describe('POST /api/engagement/event', () => {
  test('should record engagement event')
  test('should validate event type')
  test('should deduplicate rapid events')
})
```

**Admin API:**
```javascript
describe('POST /api/admin/content', () => {
  test('should create content as admin')
  test('should return 403 for non-admin')
  test('should validate required fields')
  test('should validate market codes')
})

describe('PUT /api/admin/content/:id/publish', () => {
  test('should publish content')
  test('should validate approval workflow')
  test('should return 403 for UFO user')
})
```

#### Database Integration Tests

**Scope:**
- ORM/query functionality
- Transaction handling
- Constraint enforcement
- Cascade deletes
- Index performance
- Data integrity

**Framework:** Jest with database connection

**Environment:** Isolated test database, reset between tests

**Key Test Areas:**

**User Data Access:**
```javascript
describe('UserRepository', () => {
  test('should create user with hashed password')
  test('should find user by email')
  test('should update user profile')
  test('should enforce unique email constraint')
  test('should cascade delete user data on removal')
})
```

**Content Data Access:**
```javascript
describe('ContentRepository', () => {
  test('should create content with metadata')
  test('should find content by market and language')
  test('should filter by publish status')
  test('should handle many-to-many categories')
  test('should index search queries efficiently')
})
```

**Share Event Data Access:**
```javascript
describe('ShareEventRepository', () => {
  test('should create share with all relationships')
  test('should query shares by user and date range')
  test('should join engagement data efficiently')
  test('should handle concurrent share creation')
})
```

**Engagement Event Data Access:**
```javascript
describe('EngagementRepository', () => {
  test('should record high-volume events')
  test('should query events by contact')
  test('should calculate aggregations efficiently')
  test('should partition by date for performance')
})
```

#### External Service Integration Tests (Mocked)

**Scope:**
- Email service integration
- SMS service integration
- Asset storage integration
- Analytics service integration
- Upstream system integrations

**Approach:** Use mocks/stubs for external services

**Key Test Areas:**

**Email Service:**
```javascript
describe('EmailServiceIntegration', () => {
  test('should send email with tracking link')
  test('should handle service unavailable')
  test('should retry on transient failure')
  test('should log send event')
  test('should respect rate limits')
})
```

**SMS Service:**
```javascript
describe('SMSServiceIntegration', () => {
  test('should send SMS with short link')
  test('should validate phone format')
  test('should handle service errors gracefully')
  test('should log send event')
})
```

**Upstream Systems:**
```javascript
describe('UserSystemIntegration', () => {
  test('should fetch user profile')
  test('should cache user data')
  test('should handle system unavailable')
  test('should log integration failures')
})

describe('ProductSystemIntegration', () => {
  test('should fetch product catalog')
  test('should sync content metadata')
  test('should handle API changes gracefully')
})
```

### 2.3 End-to-End Testing

#### UFO User Journeys

**Framework:** Playwright or Cypress

**Environment:** Staging environment with production-like data

**Coverage:** Critical paths only (avoid E2E explosion)

**Test Journeys:**

**Journey 1: Login and Browse Content**
```javascript
test('UFO can login and browse content', async ({ page }) => {
  // Navigate to login
  await page.goto('/login')

  // Login as UFO user
  await page.fill('[name=email]', 'ufo@test.com')
  await page.fill('[name=password]', 'TestPass123!')
  await page.click('button[type=submit]')

  // Verify dashboard loads
  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('h1')).toContainText('Welcome')

  // Navigate to content library
  await page.click('nav a:has-text("Content")')
  await expect(page).toHaveURL('/content')

  // Verify content displays
  await expect(page.locator('.content-card')).toHaveCount(10)

  // Search for content
  await page.fill('[placeholder="Search content"]', 'product')
  await page.keyboard.press('Enter')
  await page.waitForLoadState('networkidle')

  // Verify search results
  await expect(page.locator('.content-card')).toHaveCountGreaterThan(0)
})
```

**Journey 2: Share Content via SMS**
```javascript
test('UFO can share content via SMS', async ({ page }) => {
  await loginAsUFO(page)
  await navigateToContent(page)

  // Select content item
  await page.click('.content-card').first()
  await expect(page).toHaveURL(/\/content\/\d+/)

  // Click share button
  await page.click('button:has-text("Share")')

  // Select SMS channel
  await page.click('[data-channel="sms"]')

  // Enter recipient
  await page.fill('[name=phone]', '+1234567890')

  // Add optional message
  await page.fill('[name=message]', 'Check this out!')

  // Preview
  await page.click('button:has-text("Preview")')
  await expect(page.locator('.preview')).toBeVisible()

  // Confirm share
  await page.click('button:has-text("Send")')

  // Verify success
  await expect(page.locator('.success-message')).toContainText('Shared successfully')

  // Verify tracking link generated
  await expect(page.locator('[data-tracking-url]')).toBeVisible()
})
```

**Journey 3: Share Content via Email**
```javascript
test('UFO can share content via Email', async ({ page }) => {
  await loginAsUFO(page)
  await navigateToContent(page)

  // Select content
  await page.click('.content-card').first()

  // Share via email
  await page.click('button:has-text("Share")')
  await page.click('[data-channel="email"]')

  // Enter recipient email
  await page.fill('[name=email]', 'prospect@example.com')

  // Add subject (if customizable)
  await page.fill('[name=subject]', 'Check out this product')

  // Add personal message
  await page.fill('[name=message]', 'I think you will love this')

  // Preview email
  await page.click('button:has-text("Preview")')
  await expect(page.locator('.email-preview')).toBeVisible()

  // Send
  await page.click('button:has-text("Send Email")')

  // Verify success
  await expect(page.locator('.success-message')).toBeVisible()
})
```

**Journey 4: View Share History and Engagement**
```javascript
test('UFO can view share history and engagement', async ({ page }) => {
  await loginAsUFO(page)

  // Navigate to share history
  await page.click('nav a:has-text("My Shares")')
  await expect(page).toHaveURL('/shares')

  // Verify shares display
  await expect(page.locator('.share-item')).toHaveCountGreaterThan(0)

  // Filter by date
  await page.selectOption('[name=dateRange]', 'last-7-days')
  await page.waitForLoadState('networkidle')

  // Click on share to view details
  await page.click('.share-item').first()

  // Verify engagement data
  await expect(page.locator('[data-metric="clicks"]')).toBeVisible()
  await expect(page.locator('[data-metric="views"]')).toBeVisible()

  // Verify tracking link
  await expect(page.locator('[data-tracking-url]')).toBeVisible()
})
```

**Journey 5: Tracking Link Click Flow**
```javascript
test('Tracking link records click and redirects', async ({ page, context }) => {
  // Simulate sharing (setup)
  const trackingUrl = await createTestShareAndGetTrackingUrl()

  // Open tracking link in new page (simulating recipient)
  const recipientPage = await context.newPage()
  await recipientPage.goto(trackingUrl)

  // Verify redirect to content
  await recipientPage.waitForURL(/.*/, { timeout: 5000 })
  expect(recipientPage.url()).toContain('http')

  // Verify click recorded in system
  await page.goto('/shares')
  await page.click('.share-item:has-text("Test Content")')
  await expect(page.locator('[data-metric="clicks"]')).toContainText('1')
})
```

#### Admin User Journeys

**Journey 6: Admin Creates and Publishes Content**
```javascript
test('Admin can create and publish content', async ({ page }) => {
  await loginAsAdmin(page)

  // Navigate to admin content management
  await page.click('nav a:has-text("Manage Content")')
  await expect(page).toHaveURL('/admin/content')

  // Click create new
  await page.click('button:has-text("Create Content")')

  // Fill content form
  await page.fill('[name=title]', 'New Product Video')
  await page.fill('[name=description]', 'Amazing new product features')
  await page.selectOption('[name=contentType]', 'video')
  await page.fill('[name=mediaUrl]', 'https://cdn.example.com/video.mp4')
  await page.fill('[name=destinationUrl]', 'https://example.com/product')

  // Select markets
  await page.check('[name="markets"][value="US"]')
  await page.check('[name="markets"][value="CA"]')

  // Select language
  await page.selectOption('[name=language]', 'en')

  // Select categories
  await page.check('[name="categories"][value="products"]')

  // Select channels
  await page.check('[name="channels"][value="sms"]')
  await page.check('[name="channels"][value="email"]')
  await page.check('[name="channels"][value="social"]')

  // Save as draft
  await page.click('button:has-text("Save Draft")')
  await expect(page.locator('.success-message')).toContainText('Content saved')

  // Publish content
  await page.click('button:has-text("Publish")')
  await page.click('button:has-text("Confirm")')

  // Verify published
  await expect(page.locator('.status')).toContainText('Published')
})
```

**Journey 7: Admin Views Reporting Dashboard**
```javascript
test('Admin can view reporting dashboard', async ({ page }) => {
  await loginAsAdmin(page)

  // Navigate to reports
  await page.click('nav a:has-text("Reports")')
  await expect(page).toHaveURL('/admin/reports')

  // Verify key metrics display
  await expect(page.locator('[data-metric="total-shares"]')).toBeVisible()
  await expect(page.locator('[data-metric="total-clicks"]')).toBeVisible()
  await expect(page.locator('[data-metric="engagement-rate"]')).toBeVisible()

  // Filter by date range
  await page.selectOption('[name=dateRange]', 'last-30-days')
  await page.waitForLoadState('networkidle')

  // View top content
  await expect(page.locator('.top-content-list')).toBeVisible()

  // View top users
  await page.click('tab:has-text("Top Users")')
  await expect(page.locator('.top-users-list')).toBeVisible()

  // Export report
  await page.click('button:has-text("Export")')
  // Verify download initiated
})
```

#### Cross-Browser Testing

**Browsers to Test:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Mobile Chrome (Android)

**Approach:**
- Run critical E2E tests on all browsers
- Use Playwright for cross-browser automation
- Test responsive layouts on different viewports

**Viewports to Test:**
- Desktop: 1920x1080, 1366x768
- Tablet: 768x1024, 1024x768
- Mobile: 375x667, 414x896, 360x640

### 2.4 Performance Testing

#### Load Testing Scenarios

**Tools:** k6 or Artillery

**Scenarios:**

**Scenario 1: Normal Load**
- **Users:** 100 concurrent UFOs
- **Duration:** 10 minutes
- **Actions:** Browse content, search, view details
- **Success Criteria:**
  - 95th percentile response time < 500ms
  - Error rate < 0.1%
  - No memory leaks

**Scenario 2: Peak Load (Share Campaign)**
- **Users:** 500 concurrent UFOs
- **Duration:** 5 minutes
- **Actions:** Heavy sharing activity (SMS, Email)
- **Success Criteria:**
  - 95th percentile response time < 1000ms
  - Share event recording < 200ms
  - Tracking link generation < 100ms
  - Error rate < 1%

**Scenario 3: Spike Load**
- **Users:** Ramp from 50 to 1000 over 2 minutes
- **Duration:** 10 minutes total
- **Actions:** Mixed browsing and sharing
- **Success Criteria:**
  - System remains stable
  - Auto-scaling triggers appropriately
  - Error rate < 2%

**Scenario 4: Tracking Link Click Volume**
- **Requests:** 10,000 concurrent tracking link redirects
- **Duration:** 1 minute
- **Success Criteria:**
  - All clicks recorded
  - Redirect time < 200ms
  - No data loss
  - Event queue processes without backup

#### Stress Testing Approach

**Purpose:** Find breaking points

**Approach:**
- Gradually increase load until system fails
- Identify bottlenecks
- Verify graceful degradation
- Test recovery after stress

**Key Tests:**
- Database connection pool exhaustion
- API rate limiting effectiveness
- Memory usage under sustained load
- Disk I/O limits (event logging)

#### Database Performance Testing

**Query Performance:**
- Content search queries < 100ms
- Share history queries < 200ms
- Engagement analytics queries < 500ms
- Admin reporting queries < 2000ms

**Write Performance:**
- Share event insert < 50ms
- Engagement event insert < 20ms (high volume)
- Bulk contact import < 5 seconds per 1000 contacts

**Concurrency:**
- Test simultaneous share creation
- Test concurrent engagement tracking
- Verify no deadlocks
- Verify transaction isolation

#### API Response Time Benchmarks

**Target Response Times (95th percentile):**

| Endpoint | Target |
|----------|---------|
| GET /api/content | < 300ms |
| GET /api/content/:id | < 200ms |
| POST /api/shares | < 500ms |
| GET /api/shares/history | < 400ms |
| GET /api/track/:linkId | < 150ms (critical) |
| POST /api/engagement/event | < 100ms |
| GET /api/admin/reports | < 2000ms |

### 2.5 Security Testing

#### Authentication/Authorization Tests

**Authentication Tests:**
```javascript
describe('Authentication Security', () => {
  test('should reject weak passwords')
  test('should hash passwords with bcrypt')
  test('should lock account after 5 failed attempts')
  test('should enforce session timeout')
  test('should invalidate token on logout')
  test('should prevent concurrent sessions if configured')
  test('should log all authentication events')
  test('should implement rate limiting on login endpoint')
})
```

**Authorization Tests:**
```javascript
describe('Authorization Security', () => {
  test('UFO cannot access admin endpoints')
  test('UFO can only view own shares')
  test('UFO cannot view other user contacts')
  test('Admin can access admin endpoints')
  test('Admin cannot impersonate UFO without audit')
  test('JWT contains correct role claims')
  test('Expired tokens are rejected')
})
```

#### SQL Injection Prevention

**Approach:**
- Use parameterized queries exclusively
- ORM with parameter binding
- Input validation on all user inputs

**Test Cases:**
```javascript
describe('SQL Injection Prevention', () => {
  test('search query with SQL injection attempt')
  test('login with SQL injection in username')
  test('content filter with malicious input')
  test('contact import with SQL in CSV data')
})
```

**Example Test:**
```javascript
test('Content search prevents SQL injection', async () => {
  const maliciousQuery = "'; DROP TABLE content; --"
  const response = await request(app)
    .get('/api/content')
    .query({ search: maliciousQuery })
    .set('Authorization', `Bearer ${validToken}`)

  expect(response.status).toBe(200)
  expect(response.body.results).toBeArray()

  // Verify table still exists
  const content = await db.query('SELECT COUNT(*) FROM content')
  expect(content.rows[0].count).toBeGreaterThan(0)
})
```

#### XSS Prevention

**Approach:**
- Sanitize all user inputs
- Escape output in templates
- Content Security Policy headers
- HTTP-only cookies

**Test Cases:**
```javascript
describe('XSS Prevention', () => {
  test('personal message in share sanitizes script tags')
  test('contact name with XSS attempt is escaped')
  test('content title with HTML is sanitized')
  test('admin content description prevents XSS')
})
```

**Example Test:**
```javascript
test('Share personal message prevents XSS', async () => {
  const xssMessage = '<script>alert("xss")</script>Hi there'

  const response = await request(app)
    .post('/api/shares')
    .send({
      contentId: 1,
      channel: 'email',
      recipients: ['test@example.com'],
      personalMessage: xssMessage
    })
    .set('Authorization', `Bearer ${ufoToken}`)

  expect(response.status).toBe(201)

  // Verify message is sanitized
  const share = await db.query('SELECT * FROM share_events WHERE id = $1', [response.body.id])
  expect(share.rows[0].personal_message).not.toContain('<script>')
  expect(share.rows[0].personal_message).toContain('Hi there')
})
```

#### CSRF Protection

**Approach:**
- CSRF tokens for state-changing operations
- SameSite cookie attribute
- Verify Origin/Referer headers

**Test Cases:**
```javascript
describe('CSRF Protection', () => {
  test('POST requests require CSRF token')
  test('Invalid CSRF token is rejected')
  test('CSRF token expires after use')
  test('GET requests do not require CSRF token')
})
```

#### Data Encryption Validation

**Encryption Requirements:**
- Passwords: bcrypt hashed
- Tokens: secure random generation
- TLS in transit
- Sensitive fields encrypted at rest (if applicable)

**Test Cases:**
```javascript
describe('Data Encryption', () => {
  test('passwords are never stored in plain text')
  test('JWT tokens use strong secret')
  test('tracking links use secure random IDs')
  test('API enforces HTTPS in production')
})
```

#### Security Scanning

**Tools:**
- **SAST:** SonarQube, ESLint security plugins
- **DAST:** OWASP ZAP, Burp Suite
- **Dependency Scanning:** npm audit, Snyk
- **Container Scanning:** Trivy, Clair

**Frequency:**
- SAST: Every commit
- Dependency scan: Daily
- DAST: Weekly in staging
- Penetration test: Before major releases

### 2.6 Compliance Testing

#### CAN-SPAM Compliance

**Requirements:**
- Accurate "From" information
- Clear subject lines
- Valid physical address in emails
- Opt-out mechanism
- Honor opt-outs within 10 days

**Test Cases:**
```javascript
describe('CAN-SPAM Compliance', () => {
  test('email includes valid sender information')
  test('email includes physical address in footer')
  test('email includes unsubscribe link')
  test('unsubscribe request is honored immediately')
  test('opt-out status prevents future emails')
  test('subject line is not deceptive')
})
```

#### GDPR Considerations

**Requirements:**
- Consent tracking
- Right to access data
- Right to deletion
- Data portability
- Breach notification capability

**Test Cases:**
```javascript
describe('GDPR Compliance', () => {
  test('contact consent flag is recorded')
  test('user can export their data')
  test('user can request data deletion')
  test('deleted data is anonymized in analytics')
  test('audit log tracks data access')
})
```

#### Data Privacy Validation

**Test Cases:**
```javascript
describe('Data Privacy', () => {
  test('UFO cannot access other UFO contacts')
  test('contact phone numbers are not exposed in URLs')
  test('PII is not logged in application logs')
  test('analytics do not expose PII')
  test('tracking respects do-not-track if configured')
})
```

---

## 3. Detailed Test Cases

### 3.1 User Authentication Flow

**Test Case ID:** AUTH-001
**Title:** Successful UFO Login
**Priority:** Critical
**Preconditions:** Valid UFO account exists

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to /login | Login page displays |
| 2 | Enter valid email | Email field accepts input |
| 3 | Enter valid password | Password field masks input |
| 4 | Click "Login" button | Authentication request sent |
| 5 | - | JWT token received |
| 6 | - | Redirect to /dashboard |
| 7 | - | User name displays in header |
| 8 | - | Navigation shows UFO menu items |

**Test Case ID:** AUTH-002
**Title:** Failed Login - Invalid Credentials
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to /login | Login page displays |
| 2 | Enter invalid email | Email field accepts input |
| 3 | Enter any password | Password field masks input |
| 4 | Click "Login" button | Authentication request sent |
| 5 | - | Error message displays: "Invalid credentials" |
| 6 | - | User remains on login page |
| 7 | - | Security event logged |

**Test Case ID:** AUTH-003
**Title:** Account Lockout After Failed Attempts
**Priority:** High

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Attempt login with wrong password | Failed, attempt 1/5 |
| 2 | Attempt login with wrong password | Failed, attempt 2/5 |
| 3 | Attempt login with wrong password | Failed, attempt 3/5 |
| 4 | Attempt login with wrong password | Failed, attempt 4/5 |
| 5 | Attempt login with wrong password | Failed, attempt 5/5 |
| 6 | Attempt login with CORRECT password | Account locked error |
| 7 | - | Security event logged |
| 8 | - | Admin notification sent |

**Test Case ID:** AUTH-004
**Title:** Role-Based Access - UFO Cannot Access Admin
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login as UFO user | Successful login |
| 2 | Navigate to /admin/content | 403 Forbidden error |
| 3 | Directly call GET /api/admin/content | 403 Forbidden response |
| 4 | - | Access attempt logged |

**Test Case ID:** AUTH-005
**Title:** Session Timeout
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login as UFO | Successful login |
| 2 | Wait for session timeout (30 min) | - |
| 3 | Attempt to access protected page | Redirect to login |
| 4 | - | Message: "Session expired" |

### 3.2 Content Browsing and Search

**Test Case ID:** CONTENT-001
**Title:** Browse Content Library
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login as UFO | Dashboard displays |
| 2 | Click "Content" in navigation | Content library page loads |
| 3 | - | Content cards display (paginated) |
| 4 | - | Featured content highlighted |
| 5 | - | Categories filter visible |
| 6 | - | Search box visible |

**Test Case ID:** CONTENT-002
**Title:** Search Content by Keyword
**Priority:** High

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to content library | Library displays |
| 2 | Enter "product" in search | Search box accepts input |
| 3 | Press Enter or click Search | Search request sent |
| 4 | - | Results filtered to matching content |
| 5 | - | Result count displays |
| 6 | - | "Clear search" option available |

**Test Case ID:** CONTENT-003
**Title:** Filter Content by Category
**Priority:** High

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to content library | Library displays |
| 2 | Click "Products" category | Filter applied |
| 3 | - | Only product content displays |
| 4 | - | Category filter shown as active |
| 5 | Select additional "Videos" type filter | Multiple filters applied |
| 6 | - | Only product videos display |

**Test Case ID:** CONTENT-004
**Title:** View Content Detail
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to content library | Library displays |
| 2 | Click on content card | Detail page loads |
| 3 | - | Content title displays |
| 4 | - | Description displays |
| 5 | - | Media preview/thumbnail displays |
| 6 | - | Share button visible |
| 7 | - | Available channels indicated |

**Test Case ID:** CONTENT-005
**Title:** Market-Restricted Content
**Priority:** High
**Preconditions:** UFO in US market, content restricted to CA only

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login as US UFO | Dashboard displays |
| 2 | Navigate to content library | Content displays |
| 3 | Search for CA-only content | No results found |
| 4 | Directly access CA content URL | 403 Forbidden or 404 |
| 5 | API call for CA content | Empty or 403 response |

### 3.3 SMS Sharing Workflow

**Test Case ID:** SHARE-SMS-001
**Title:** Share Content via SMS - Happy Path
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | View content detail | Detail page displays |
| 2 | Click "Share" button | Share modal opens |
| 3 | Select "SMS" channel | SMS form displays |
| 4 | Enter recipient phone: +1234567890 | Phone field accepts input |
| 5 | Enter personal message (optional) | Message field accepts input |
| 6 | Click "Preview" | Preview displays |
| 7 | - | Message shows approved template |
| 8 | - | Tracking link included (short) |
| 9 | - | Personal message included |
| 10 | Click "Send SMS" | Share request sent |
| 11 | - | Success message displays |
| 12 | - | Tracking URL shown |
| 13 | - | Share event recorded in DB |
| 14 | - | ShareEvent.channel = 'sms' |
| 15 | - | Tracking link generated and stored |

**Test Case ID:** SHARE-SMS-002
**Title:** SMS Share - Invalid Phone Number
**Priority:** High

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Initiate SMS share | SMS form displays |
| 2 | Enter invalid phone: "abc123" | Validation error displays |
| 3 | - | Send button disabled |
| 4 | Enter valid phone format | Validation passes |
| 5 | - | Send button enabled |

**Test Case ID:** SHARE-SMS-003
**Title:** SMS Share - Content Not Available for SMS
**Priority:** Medium
**Preconditions:** Content marked as email-only

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | View email-only content | Detail displays |
| 2 | Click "Share" | Share modal opens |
| 3 | - | SMS option disabled or hidden |
| 4 | - | Tooltip explains "Not available for SMS" |

### 3.4 Email Sharing Workflow

**Test Case ID:** SHARE-EMAIL-001
**Title:** Share Content via Email - Happy Path
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | View content detail | Detail page displays |
| 2 | Click "Share" button | Share modal opens |
| 3 | Select "Email" channel | Email form displays |
| 4 | Enter recipient: prospect@example.com | Email field accepts input |
| 5 | Enter subject (if customizable) | Subject field accepts input |
| 6 | Enter personal message | Message field accepts input |
| 7 | Click "Preview" | Email preview displays |
| 8 | - | Approved template shown |
| 9 | - | Tracking link embedded |
| 10 | - | Personal message included |
| 11 | - | CAN-SPAM footer included |
| 12 | Click "Send Email" | Share request sent |
| 13 | - | Success message displays |
| 14 | - | Share event recorded |
| 15 | - | Email sent via service |

**Test Case ID:** SHARE-EMAIL-002
**Title:** Email Share - Invalid Email Address
**Priority:** High

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Initiate email share | Email form displays |
| 2 | Enter invalid email: "notanemail" | Validation error displays |
| 3 | - | Send button disabled |
| 4 | Enter valid email | Validation passes |
| 5 | - | Send button enabled |

**Test Case ID:** SHARE-EMAIL-003
**Title:** Email Share - Multiple Recipients
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Initiate email share | Email form displays |
| 2 | Enter first email | Email added to recipients |
| 3 | Click "Add recipient" | Additional field appears |
| 4 | Enter second email | Email added to recipients |
| 5 | Click "Send Email" | Share request sent |
| 6 | - | Separate share event per recipient |
| 7 | - | Unique tracking link per recipient |

### 3.5 Social Sharing Workflow

**Test Case ID:** SHARE-SOCIAL-001
**Title:** Share Content to Social - Copy Link
**Priority:** High

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | View content detail | Detail page displays |
| 2 | Click "Share" | Share modal opens |
| 3 | Select "Social" channel | Social options display |
| 4 | Click "Copy Link" | Tracking link copied to clipboard |
| 5 | - | Success message displays |
| 6 | - | Share event recorded |
| 7 | - | Link includes tracking parameters |

**Test Case ID:** SHARE-SOCIAL-002
**Title:** Share Content - Native Share Dialog (Mobile)
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | View content on mobile browser | Detail displays |
| 2 | Click "Share" | Share modal opens |
| 3 | Select "Social" | Social options display |
| 4 | Click "Share via..." | Native share sheet opens |
| 5 | - | Apps like WhatsApp, Facebook shown |
| 6 | Select app and complete share | Share completes in app |
| 7 | - | Share event recorded with channel=social |

**Test Case ID:** SHARE-SOCIAL-003
**Title:** Social Share - Download Asset
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | View image/video content | Detail displays |
| 2 | Click "Share" | Share modal opens |
| 3 | Select "Social" | Social options display |
| 4 | Click "Download Asset" | Asset downloads |
| 5 | - | Approved caption provided for copy |
| 6 | - | Tracking link provided |
| 7 | - | Share event recorded (when confirmed) |

### 3.6 Tracking Link Generation and Click Tracking

**Test Case ID:** TRACK-001
**Title:** Unique Tracking Link Generation
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | UFO shares content #1 to contact A | Share created |
| 2 | - | Tracking link L1 generated |
| 3 | UFO shares content #1 to contact B | Share created |
| 4 | - | Tracking link L2 generated |
| 5 | - | L1 ≠ L2 (unique links) |
| 6 | UFO shares content #1 to contact A again | Share created |
| 7 | - | New tracking link L3 generated |
| 8 | - | L3 ≠ L1 (even same UFO+content+contact) |

**Test Case ID:** TRACK-002
**Title:** Tracking Link Click Recorded
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Share created with tracking link L1 | Link generated |
| 2 | Recipient clicks L1 | GET /api/track/{linkId} called |
| 3 | - | Click event recorded in DB |
| 4 | - | EngagementEvent.type = 'click' |
| 5 | - | EngagementEvent.tracking_link_id = L1 |
| 6 | - | Timestamp recorded |
| 7 | - | User agent recorded |
| 8 | - | IP address recorded (anonymized) |
| 9 | - | Redirect to content destination URL |
| 10 | - | Redirect happens quickly (< 200ms) |

**Test Case ID:** TRACK-003
**Title:** Tracking Link Metadata Encoding
**Priority:** High

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | UFO ID 123 shares content ID 456 | Share created |
| 2 | Channel = 'email' | - |
| 3 | Campaign = 'summer-promo' | - |
| 4 | Tracking link generated | Link created |
| 5 | Decode tracking link | UFO ID 123 encoded |
| 6 | - | Content ID 456 encoded |
| 7 | - | Channel 'email' encoded |
| 8 | - | Campaign 'summer-promo' encoded |
| 9 | - | Timestamp encoded |

**Test Case ID:** TRACK-004
**Title:** Short Link Format
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Generate tracking link | Link created |
| 2 | - | Link format: {domain}/t/{shortcode} |
| 3 | - | Shortcode length ≤ 10 characters |
| 4 | - | Shortcode uses URL-safe chars |
| 5 | - | Link total length suitable for SMS |

**Test Case ID:** TRACK-005
**Title:** Tracking Link Expiration (Future)
**Priority:** Low

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Generate tracking link with expiry | Link created |
| 2 | Click link before expiration | Click recorded, redirect works |
| 3 | Wait for expiration | - |
| 4 | Click expired link | Error page or message displays |
| 5 | - | No click event recorded |

### 3.7 Contact Management

**Test Case ID:** CONTACT-001
**Title:** Manually Add Contact
**Priority:** High
**Phase:** Phase 2

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to Contacts | Contacts page displays |
| 2 | Click "Add Contact" | Add contact form opens |
| 3 | Enter first name: "John" | Field accepts input |
| 4 | Enter last name: "Doe" | Field accepts input |
| 5 | Enter email: john@example.com | Field accepts input |
| 6 | Enter phone: +1234567890 | Field accepts input |
| 7 | Select relationship: "Prospect" | Dropdown selection works |
| 8 | Add tags: "hot-lead, product-interested" | Tags added |
| 9 | Click "Save" | Contact saved |
| 10 | - | Contact appears in list |
| 11 | - | Contact owned by logged-in UFO |

**Test Case ID:** CONTACT-002
**Title:** Import Contacts from CSV
**Priority:** High
**Phase:** Phase 2

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to Contacts | Contacts page displays |
| 2 | Click "Import" | Import dialog opens |
| 3 | Upload valid CSV file | File uploads |
| 4 | - | Column mapping interface displays |
| 5 | Map CSV columns to fields | Mapping confirmed |
| 6 | Click "Import" | Import process starts |
| 7 | - | Progress indicator displays |
| 8 | - | Success message with count |
| 9 | - | Contacts appear in list |
| 10 | - | Duplicates detected and flagged |

**Test Case ID:** CONTACT-003
**Title:** View Contact Timeline
**Priority:** High
**Phase:** Phase 2

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to Contacts | Contact list displays |
| 2 | Click on contact "John Doe" | Contact detail page opens |
| 3 | - | Contact information displays |
| 4 | - | Timeline/activity feed displays |
| 5 | - | All shares to this contact listed |
| 6 | - | All engagement events listed |
| 7 | - | Events in chronological order |
| 8 | - | Event types clearly indicated |

**Test Case ID:** CONTACT-004
**Title:** Duplicate Contact Detection
**Priority:** Medium
**Phase:** Phase 2

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Add contact: john@example.com | Contact saved |
| 2 | Attempt to add same email again | Duplicate warning displays |
| 3 | - | Option to merge or cancel |
| 4 | Select "Merge" | Merge interface displays |
| 5 | Confirm merge | Contacts merged |
| 6 | - | Activity from both retained |

### 3.8 Engagement Event Recording

**Test Case ID:** ENGAGE-001
**Title:** Record Link Click Event
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Recipient clicks tracking link | GET /track/{linkId} |
| 2 | - | Event record created |
| 3 | - | Event.type = 'click' |
| 4 | - | Event.timestamp = now |
| 5 | - | Event.tracking_link_id populated |
| 6 | - | Event.contact_id populated if known |
| 7 | - | Event.user_agent populated |
| 8 | - | Event.ip_address populated (anonymized) |

**Test Case ID:** ENGAGE-002
**Title:** Record Page View Event
**Priority:** High

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Recipient lands on content page | Page loads |
| 2 | Analytics script fires | POST /api/engagement/event |
| 3 | - | Event.type = 'view' |
| 4 | - | Event.content_id populated |
| 5 | - | Event.timestamp recorded |
| 6 | - | Event.duration_seconds = 0 initially |

**Test Case ID:** ENGAGE-003
**Title:** Record Video Start Event
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Recipient clicks play on video | Video starts |
| 2 | Video player event fires | POST /api/engagement/event |
| 3 | - | Event.type = 'video_start' |
| 4 | - | Event.content_id populated |
| 5 | - | Event.metadata.position = 0 |

**Test Case ID:** ENGAGE-004
**Title:** Record Video Completion Event
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Recipient watches video to end | Video completes |
| 2 | Player completion event fires | POST /api/engagement/event |
| 3 | - | Event.type = 'video_complete' |
| 4 | - | Event.metadata.completion_percent = 100 |
| 5 | - | Event.metadata.duration_watched populated |

**Test Case ID:** ENGAGE-005
**Title:** Deduplicate Rapid Click Events
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Recipient clicks link | Click event recorded |
| 2 | Recipient clicks link again (< 5 sec) | Event detected |
| 3 | - | Duplicate event not recorded |
| 4 | - | Original event timestamp unchanged |
| 5 | Wait 5+ seconds | - |
| 6 | Recipient clicks link again | New click event recorded |

### 3.9 Admin Content Management

**Test Case ID:** ADMIN-001
**Title:** Create Draft Content
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login as admin | Admin dashboard displays |
| 2 | Navigate to Content Management | Content list displays |
| 3 | Click "Create Content" | Content form displays |
| 4 | Fill all required fields | Form accepts input |
| 5 | Select markets and languages | Selections work |
| 6 | Select available channels | Checkboxes work |
| 7 | Click "Save Draft" | Content saved |
| 8 | - | Status = 'draft' |
| 9 | - | Content not visible to UFOs |
| 10 | - | Content appears in admin drafts list |

**Test Case ID:** ADMIN-002
**Title:** Publish Content
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open draft content | Detail view displays |
| 2 | Click "Publish" | Confirmation dialog displays |
| 3 | Confirm publish | Content published |
| 4 | - | Status = 'published' |
| 5 | - | Publish date set to now |
| 6 | - | Content visible to UFOs in allowed markets |

**Test Case ID:** ADMIN-003
**Title:** Unpublish/Archive Content
**Priority:** High

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open published content | Detail displays |
| 2 | Click "Unpublish" or "Archive" | Confirmation dialog displays |
| 3 | Confirm action | Content unpublished |
| 4 | - | Status = 'archived' |
| 5 | - | Content not visible to UFOs |
| 6 | - | Existing shares still have tracking links |
| 7 | - | Tracking links still work (redirect) |

**Test Case ID:** ADMIN-004
**Title:** Expire Content Automatically
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Create content with expiration date | Content saved |
| 2 | Publish content | Content visible to UFOs |
| 3 | Wait for expiration date to pass | - |
| 4 | Nightly job runs | - |
| 5 | - | Content status = 'expired' |
| 6 | - | Content not visible in UFO library |
| 7 | - | Admin sees content in expired list |

**Test Case ID:** ADMIN-005
**Title:** Content Approval Workflow (Optional)
**Priority:** Low

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Content creator saves draft | Status = 'draft' |
| 2 | Creator submits for review | Status = 'pending_review' |
| 3 | Approver reviews content | Review interface displays |
| 4 | Approver rejects with comments | Status = 'rejected' |
| 5 | - | Creator notified |
| 6 | Creator updates and resubmits | Status = 'pending_review' |
| 7 | Approver approves | Status = 'approved' |
| 8 | Creator publishes | Status = 'published' |

---

## 4. Acceptance Criteria for MVP Phase 1

### 4.1 Functional Acceptance Criteria

**Authentication & Authorization:**
- [ ] UFO users can login with email and password
- [ ] Admin users can login with elevated permissions
- [ ] Passwords are securely hashed (bcrypt)
- [ ] Sessions expire after 30 minutes of inactivity
- [ ] Failed login attempts are logged
- [ ] Account locks after 5 failed attempts
- [ ] UFOs cannot access admin endpoints
- [ ] Admins have access to all admin functions

**Content Library:**
- [ ] UFOs can browse content library
- [ ] Content displays in paginated grid (10-20 per page)
- [ ] Content can be searched by keyword
- [ ] Content can be filtered by category
- [ ] Content can be filtered by type (video, image, PDF, etc.)
- [ ] Featured content is highlighted
- [ ] Content detail page displays all metadata
- [ ] Content respects market restrictions
- [ ] Expired content is not visible

**Content Sharing:**
- [ ] UFOs can share content via SMS
- [ ] UFOs can share content via email
- [ ] UFOs can share content via social (copy link)
- [ ] Share flow includes channel selection
- [ ] Share flow includes recipient selection
- [ ] Share flow allows optional personal message (within rules)
- [ ] Share preview displays before confirmation
- [ ] Share creates unique tracking link
- [ ] Share event is recorded with all metadata
- [ ] Share confirmation displays tracking URL

**Tracking:**
- [ ] Every share generates unique tracking link
- [ ] Tracking links are short (suitable for SMS)
- [ ] Tracking links encode UFO, content, channel, timestamp
- [ ] Clicking tracking link records engagement event
- [ ] Clicking tracking link redirects to content
- [ ] Redirect happens quickly (< 200ms)
- [ ] Click events include user agent and anonymized IP
- [ ] Duplicate rapid clicks are deduplicated

**Share History & Reporting:**
- [ ] UFOs can view their share history
- [ ] Share history shows date, content, channel, recipient
- [ ] Share history shows click/engagement counts
- [ ] Share history can be filtered by date range
- [ ] Share detail shows tracking link and engagement
- [ ] Basic engagement dashboard displays total shares, clicks, CTR

**Admin Content Management:**
- [ ] Admins can create new content
- [ ] Admins can edit existing content
- [ ] Admins can save content as draft
- [ ] Admins can publish content
- [ ] Admins can unpublish/archive content
- [ ] Content form validates required fields
- [ ] Content can be restricted by market
- [ ] Content can be restricted by language
- [ ] Content can have expiration date set

**Admin Reporting:**
- [ ] Admins can view top content by shares
- [ ] Admins can view top content by engagement
- [ ] Admins can view most active UFOs
- [ ] Admins can filter reports by date range
- [ ] Admins can export reports to CSV

### 4.2 Performance Acceptance Criteria

**Response Times (95th percentile):**
- [ ] Login response < 500ms
- [ ] Content library load < 500ms
- [ ] Content search < 500ms
- [ ] Content detail load < 300ms
- [ ] Share submission < 500ms
- [ ] Tracking link redirect < 200ms
- [ ] Share history load < 400ms
- [ ] Admin dashboard load < 1000ms

**Scalability:**
- [ ] System supports 100 concurrent users
- [ ] System supports 500 shares per minute
- [ ] System supports 10,000 tracking link clicks per minute
- [ ] Database queries use appropriate indexes
- [ ] No N+1 query problems

**Reliability:**
- [ ] 99.9% uptime during business hours
- [ ] Graceful degradation when external services unavailable
- [ ] All errors logged for debugging
- [ ] Failed email/SMS sends are retried

### 4.3 Security Acceptance Criteria

**Authentication:**
- [ ] Passwords never stored in plain text
- [ ] JWT tokens use strong secret (256-bit minimum)
- [ ] Tokens expire after defined period
- [ ] Sessions invalidated on logout
- [ ] Rate limiting on login endpoint (10 attempts per 15 min)

**Authorization:**
- [ ] All API endpoints enforce authentication
- [ ] Role-based access control enforced
- [ ] Users can only access their own data
- [ ] Admins have appropriate elevated access

**Data Protection:**
- [ ] All transport uses HTTPS/TLS
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (input sanitization, output escaping)
- [ ] CSRF protection implemented
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)

**Privacy:**
- [ ] PII not exposed in URLs
- [ ] PII not logged in application logs
- [ ] IP addresses anonymized before storage
- [ ] UFOs cannot see other UFO data

**Compliance:**
- [ ] Email shares include CAN-SPAM footer
- [ ] Email shares include unsubscribe mechanism
- [ ] Opt-out requests are honored
- [ ] Data deletion capability exists

**Vulnerability Management:**
- [ ] No critical or high severity vulnerabilities in dependencies
- [ ] SAST scan passes with no critical issues
- [ ] DAST scan passes with no critical issues

### 4.4 User Experience Acceptance Criteria

**Usability:**
- [ ] Application is intuitive for first-time UFO users
- [ ] Share flow completes in < 5 clicks
- [ ] Error messages are clear and actionable
- [ ] Success confirmations are visible and clear
- [ ] Loading states provide feedback

**Responsive Design:**
- [ ] Application works on desktop (1920x1080, 1366x768)
- [ ] Application works on tablet (768x1024)
- [ ] Application works on mobile (375x667, 414x896)
- [ ] Touch targets are appropriately sized (44x44px minimum)
- [ ] Text is readable without zooming

**Cross-Browser:**
- [ ] Application works in Chrome (latest)
- [ ] Application works in Firefox (latest)
- [ ] Application works in Safari (latest)
- [ ] Application works in Edge (latest)
- [ ] Application works in Mobile Safari (iOS)
- [ ] Application works in Mobile Chrome (Android)

**Accessibility:**
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation works throughout app
- [ ] Screen reader compatible
- [ ] Color contrast meets AA standards (4.5:1)
- [ ] Form fields have proper labels
- [ ] Error messages are announced to screen readers

**Performance (UX):**
- [ ] Pages load quickly (perceived performance)
- [ ] No jank or layout shift
- [ ] Images lazy load
- [ ] App feels responsive on mobile networks

---

## 5. Testing Tools and Infrastructure

### 5.1 Testing Frameworks

**Backend Testing (Node.js example):**
- **Unit Testing:** Jest
- **API Testing:** Supertest + Jest
- **Mocking:** jest.mock(), nock (for HTTP mocks)
- **Test Runner:** Jest
- **Coverage:** Istanbul (built into Jest)

**Backend Testing (Python example):**
- **Unit Testing:** pytest
- **API Testing:** pytest + requests or httpx
- **Mocking:** pytest-mock, responses
- **Test Runner:** pytest
- **Coverage:** pytest-cov

**Frontend Testing:**
- **Unit Testing:** Jest + React Testing Library
- **Component Testing:** React Testing Library
- **E2E Testing:** Playwright or Cypress
- **Visual Regression:** Percy or Chromatic (optional)
- **Accessibility:** jest-axe, axe-core

**Performance Testing:**
- **Load Testing:** k6 or Artillery
- **Database Profiling:** Database native tools (SQL Server Profiler, pg_stat_statements)
- **APM:** New Relic, Datadog, or Application Insights

**Security Testing:**
- **SAST:** SonarQube, ESLint security plugins
- **DAST:** OWASP ZAP
- **Dependency Scanning:** npm audit, Snyk, Dependabot
- **Secrets Scanning:** GitGuardian, TruffleHog

### 5.2 CI/CD Integration

**Pipeline Stages:**

```yaml
# Example CI/CD Pipeline

stages:
  - lint
  - unit-test
  - integration-test
  - security-scan
  - build
  - e2e-test
  - performance-test
  - deploy-staging
  - smoke-test
  - deploy-production

lint:
  - Run ESLint / Pylint
  - Run Prettier / Black
  - Fail pipeline on errors

unit-test:
  - Run all unit tests
  - Generate coverage report
  - Fail if coverage < 80%
  - Publish coverage to dashboard

integration-test:
  - Spin up test database
  - Run database migrations
  - Seed test data
  - Run API integration tests
  - Tear down test environment

security-scan:
  - Run npm audit / pip-audit
  - Run SAST scan (SonarQube)
  - Run secret scanning
  - Fail on critical vulnerabilities

build:
  - Build frontend assets
  - Build backend container
  - Tag with version and commit SHA
  - Push to container registry

e2e-test:
  - Deploy to ephemeral test environment
  - Run Playwright E2E tests
  - Record videos on failure
  - Tear down environment

performance-test:
  - Deploy to performance test environment
  - Run k6 load tests
  - Verify performance benchmarks
  - Generate performance report

deploy-staging:
  - Deploy to staging environment
  - Run database migrations
  - Verify deployment health

smoke-test:
  - Run critical smoke tests in staging
  - Verify login works
  - Verify content library loads
  - Verify share flow works

deploy-production:
  - Require manual approval
  - Deploy to production (blue-green)
  - Run database migrations
  - Switch traffic to new version
  - Monitor for errors
```

**CI/CD Best Practices:**
- Run tests on every commit
- Fast feedback (unit tests run first)
- Fail fast on critical issues
- Parallel test execution where possible
- Caching dependencies for speed
- Automated rollback on failure
- Deployment notifications (Slack, email)

### 5.3 Test Data Management

**Approach:**

**Seed Data:**
- Create SQL scripts or ORM seeders
- Include realistic test data
- Cover edge cases (empty, max length, special chars)
- Include data for all user roles

**Example Seed Data:**
```sql
-- Users
INSERT INTO users (id, email, role, market, language, status)
VALUES
  (1, 'ufo1@test.com', 'ufo', 'US', 'en', 'active'),
  (2, 'ufo2@test.com', 'ufo', 'CA', 'en', 'active'),
  (3, 'admin@test.com', 'admin', 'US', 'en', 'active');

-- Content
INSERT INTO content (id, title, content_type, status, market, language)
VALUES
  (1, 'Product Video', 'video', 'published', 'US', 'en'),
  (2, 'Product PDF', 'pdf', 'published', 'US', 'en'),
  (3, 'CA Only Content', 'image', 'published', 'CA', 'en'),
  (4, 'Draft Content', 'video', 'draft', 'US', 'en');
```

**Test Data Strategies:**
- **Unit Tests:** Mock data in tests
- **Integration Tests:** Seed database, reset between tests
- **E2E Tests:** Dedicated test environment with stable data
- **Performance Tests:** Large realistic datasets

**Data Privacy:**
- Never use real customer data in tests
- Generate synthetic data (Faker.js, Python Faker)
- Anonymize any production data used

### 5.4 Test Environment Strategy

**Environments:**

| Environment | Purpose | Refresh | Data |
|-------------|---------|---------|------|
| Local Dev | Developer testing | On demand | Small seed data |
| CI | Automated test runs | Every commit | Seed data |
| Integration | Integration testing | Daily | Realistic volume |
| Staging | Pre-production validation | Per release | Production-like |
| Performance | Load/stress testing | Weekly | Large datasets |
| Production | Live system | N/A | Real data |

**Environment Configuration:**
- Use environment variables for config
- Never commit secrets
- Use secret management (Azure Key Vault, AWS Secrets Manager, etc.)
- Database: Separate instance per environment
- External services: Mock in test environments

**Database Management:**
- Migration scripts version controlled
- Migrations run automatically in pipeline
- Rollback scripts available
- Test migrations in staging first

---

## 6. Bug Tracking and Quality Metrics

### 6.1 Bug Severity Classification

**Critical (P0):**
- System is down or unusable
- Data loss or corruption
- Security vulnerability exposing data
- Unable to login
- Unable to share content (core functionality)
- Payment or financial transaction errors

**SLA:** Fix within 4 hours, hotfix to production

**High (P1):**
- Major functionality broken
- Significant performance degradation
- Workaround exists but difficult
- Affects large percentage of users
- Admin cannot manage content

**SLA:** Fix within 24 hours, include in next release

**Medium (P2):**
- Minor functionality broken
- Usability issue
- Edge case error
- Affects small percentage of users
- Easy workaround available

**SLA:** Fix within 1 week, include in upcoming release

**Low (P3):**
- Cosmetic issue
- Minor UI glitch
- Enhancement request
- Documentation error

**SLA:** Fix in backlog priority order

**Bug Priority Matrix:**

| Severity | Frequency | Priority |
|----------|-----------|----------|
| Critical | Common | P0 - Immediate |
| Critical | Rare | P1 - Urgent |
| High | Common | P1 - Urgent |
| High | Rare | P2 - High |
| Medium | Common | P2 - High |
| Medium | Rare | P3 - Medium |
| Low | Any | P4 - Low |

### 6.2 Quality Metrics to Track

**Test Metrics:**
- **Test Coverage:** Overall, per module (Target: 80%+)
- **Test Pass Rate:** % passing (Target: 100%)
- **Test Execution Time:** Duration of test suites
- **Flaky Tests:** Tests that intermittently fail (Target: 0)
- **Tests Added:** New tests per sprint

**Defect Metrics:**
- **Defect Density:** Defects per 1000 lines of code
- **Defect Escape Rate:** % of bugs found in production vs. testing
- **Defect Removal Efficiency:** % defects found before release
- **Mean Time to Detect (MTTD):** Average time to find a bug
- **Mean Time to Resolve (MTTR):** Average time to fix a bug

**Release Metrics:**
- **Deployment Frequency:** How often code is deployed
- **Lead Time:** Time from commit to production
- **Change Failure Rate:** % of deployments causing issues
- **Rollback Rate:** % of deployments requiring rollback

**Quality Gates:**
- Zero P0/P1 bugs before release
- Test coverage ≥ 80%
- All E2E tests passing
- Performance benchmarks met
- Security scan clean

### 6.3 Regression Testing Approach

**Regression Test Suite:**

**Scope:**
- All critical user journeys (E2E tests)
- All API endpoints (Integration tests)
- Core business logic (Unit tests)

**Frequency:**
- **Full Regression:** Before every release
- **Smoke Tests:** After every deployment
- **Targeted Regression:** After bug fixes in specific area

**Automation:**
- 100% of regression tests automated
- Run on every pull request (subset)
- Run nightly (full suite)
- Run before release (full suite + manual exploratory)

**Regression Test Prioritization:**

**Tier 1 (Critical - Run Always):**
- Login and authentication
- Content browsing
- SMS share flow
- Email share flow
- Tracking link click and redirect
- Admin content publish

**Tier 2 (High - Run on PR + Nightly):**
- Content search and filters
- Share history
- Engagement dashboard
- Admin reporting
- Social share flow

**Tier 3 (Medium - Run Nightly):**
- Edge cases
- Error scenarios
- Performance tests
- Security tests

**Regression Test Maintenance:**
- Review and update tests quarterly
- Remove obsolete tests
- Update tests when requirements change
- Keep tests DRY (Don't Repeat Yourself)
- Refactor flaky tests immediately

---

## 7. Quality Assurance Process

### 7.1 QA Workflow

**Feature Development QA Cycle:**

1. **Requirements Review**
   - QA reviews user stories
   - Identifies testability concerns
   - Defines acceptance criteria
   - Creates test plan outline

2. **Development**
   - Developer writes unit tests
   - Developer runs tests locally
   - Code review includes test review

3. **PR Review**
   - Automated tests run on PR
   - QA reviews test coverage
   - QA approves test approach

4. **QA Testing**
   - QA runs automated tests
   - QA performs exploratory testing
   - QA validates acceptance criteria
   - QA logs defects if found

5. **Bug Fix Cycle**
   - Developer fixes bugs
   - Developer adds regression test
   - QA verifies fix
   - QA verifies regression test

6. **Sign-off**
   - QA signs off on feature
   - Feature ready for release

### 7.2 Release QA Process

**Pre-Release Checklist:**
- [ ] All acceptance criteria met
- [ ] All automated tests passing
- [ ] Manual exploratory testing complete
- [ ] Performance testing complete
- [ ] Security scanning complete
- [ ] Cross-browser testing complete
- [ ] Accessibility testing complete
- [ ] Zero P0/P1 open bugs
- [ ] Release notes reviewed
- [ ] Rollback plan documented

**Post-Release Checklist:**
- [ ] Smoke tests passing in production
- [ ] Monitoring dashboards reviewed
- [ ] Error rates normal
- [ ] Performance metrics normal
- [ ] User feedback monitored
- [ ] Support tickets reviewed

### 7.3 Test Reporting

**Daily Test Report:**
- Tests run today
- Pass/fail rate
- New failures
- Flaky tests identified
- Code coverage trend

**Sprint Test Report:**
- Features tested
- Test cases executed
- Defects found
- Defects fixed
- Test coverage by feature
- Risk areas identified

**Release Test Report:**
- Release candidate version
- Test execution summary
- Defect summary by severity
- Open issues and risks
- Go/no-go recommendation
- Sign-off status

---

## Conclusion

This comprehensive QA strategy ensures the UnFranchise Marketing App is delivered with production-ready quality. The strategy prioritizes:

1. **Content Sharing Engine** - The highest priority feature receives the most rigorous testing
2. **Automated Testing** - Fast feedback through extensive automation
3. **Security & Compliance** - Critical for enterprise application handling user data
4. **Performance** - Ensuring scalability for growing user base
5. **User Experience** - Responsive, accessible, cross-browser compatibility

**Success Metrics:**
- 80%+ automated test coverage
- < 1% defect escape rate
- < 500ms average page load time
- 99.9% uptime
- Zero critical security vulnerabilities

This QA plan provides a solid foundation for delivering a high-quality MVP in Phase 1 and scaling quality practices through Phases 2-5.

---

**Document Version:** 1.0
**Last Updated:** 2026-04-04
**Next Review:** At end of Phase 1 development
