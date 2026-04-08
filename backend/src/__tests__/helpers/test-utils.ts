import bcrypt from 'bcryptjs';

/**
 * Create a mock user object
 */
export function createMockUser(overrides: any = {}) {
  return {
    UserID: 1,
    Email: 'test@example.com',
    PasswordHash: bcrypt.hashSync('password123', 10),
    FirstName: 'Test',
    LastName: 'User',
    RoleID: 2,
    RoleName: 'UFO',
    Status: 'Active',
    Market: 'US',
    CreatedDate: new Date(),
    UpdatedDate: new Date(),
    ...overrides
  };
}

/**
 * Create a mock contact object
 */
export function createMockContact(overrides: any = {}) {
  // Normalize property names to handle both lowercase and uppercase
  const normalized: any = {};
  for (const key in overrides) {
    // Map lowercase to uppercase property names
    const upperKey = key.charAt(0).toUpperCase() + key.slice(1);
    normalized[upperKey] = overrides[key];
  }

  return {
    ContactID: 1,
    OwnerUserID: 1,
    FirstName: 'John',
    LastName: 'Doe',
    Email: 'john.doe@example.com',
    Mobile: '+15551234567',
    CompanyName: 'Test Company',
    JobTitle: 'CEO',
    RelationshipType: 'Lead',
    Source: 'Manual',
    Tags: 'vip,prospect',
    Notes: 'Test notes',
    EmailOptIn: 1,
    SMSOptIn: 1,
    TotalSharesReceived: 0,
    TotalEngagements: 0,
    LastEngagementDate: null,
    LastContactDate: null,
    EngagementScore: 0,
    Status: 'Active',
    ContactHash: 'testhash123',
    DuplicateOfContactID: null,
    CreatedDate: new Date(),
    UpdatedDate: new Date(),
    ...normalized
  };
}

/**
 * Create a mock content item
 */
export function createMockContentItem(overrides: any = {}) {
  return {
    ContentItemID: 1,
    Title: 'Test Content',
    Description: 'Test content description',
    ContentType: 'Video',
    CategoryID: 1,
    CategoryName: 'Product',
    MarketID: 1,
    LanguageID: 1,
    ThumbnailURL: 'https://example.com/thumbnail.jpg',
    DestinationURL: 'https://example.com/content',
    MediaURL: 'https://example.com/video.mp4',
    Status: 'Published',
    PublishedDate: new Date(),
    CreatedByUserID: 1,
    CreatedDate: new Date(),
    UpdatedDate: new Date(),
    ...overrides
  };
}

/**
 * Create a mock share event
 */
export function createMockShareEvent(overrides: any = {}) {
  return {
    ShareEventID: 1,
    ShareGUID: 'share-guid-123',
    UserID: 1,
    ContentItemID: 1,
    CampaignID: null,
    ShareChannel: 'Email',
    SocialPlatform: null,
    PersonalMessage: 'Check this out!',
    ShareTemplate: 'default_email',
    TrackingCode: 'abc12345',
    Status: 'Sent',
    RecipientCount: 1,
    ShareDate: new Date(),
    ClickCount: 0,
    UniqueClickCount: 0,
    UserAgent: null,
    IPAddress: null,
    DeviceType: null,
    ...overrides
  };
}

/**
 * Create a mock follow-up task
 */
export function createMockFollowUp(overrides: any = {}) {
  // Normalize property names to handle both lowercase and uppercase
  const normalized: any = {};
  for (const key in overrides) {
    // Map lowercase to uppercase property names
    const upperKey = key.charAt(0).toUpperCase() + key.slice(1);
    normalized[upperKey] = overrides[key];
  }

  return {
    FollowUpID: 1,
    UserID: 1,
    ContactID: 1,
    ContactName: 'John Doe',
    ContactEmail: 'john.doe@example.com',
    ContactMobile: '+15551234567',
    DueDate: new Date(Date.now() + 86400000), // Tomorrow
    Priority: 'High',
    Status: 'Pending',
    Type: 'Follow-up Call',
    Notes: 'Call to discuss proposal',
    CompletedDate: null,
    CompletedNotes: null,
    SnoozedUntil: null,
    SnoozedCount: 0,
    ReminderSent: false,
    ReminderSentDate: null,
    CreatedDate: new Date(),
    UpdatedDate: new Date(),
    IsOverdue: 0,
    HoursOverdue: null,
    ...normalized
  };
}

/**
 * Create a mock tracking link
 */
export function createMockTrackingLink(overrides: any = {}) {
  return {
    TrackingLinkID: 1,
    ShareEventID: 1,
    ShortCode: 'abc12345',
    FullTrackingURL: 'http://localhost:3000/s/abc12345',
    DestinationURL: 'https://example.com/content',
    LinkType: 'Content',
    IsActive: 1,
    ClickCount: 0,
    UniqueClickCount: 0,
    FirstClickDate: null,
    LastClickDate: null,
    ExpirationDate: null,
    CreatedDate: new Date(),
    ...overrides
  };
}

/**
 * Create a mock contact group
 */
export function createMockContactGroup(overrides: any = {}) {
  return {
    GroupID: 1,
    UserID: 1,
    GroupName: 'VIP Prospects',
    Description: 'High-value leads',
    CreatedDate: new Date(),
    UpdatedDate: new Date(),
    ...overrides
  };
}

/**
 * Create a mock role
 */
export function createMockRole(overrides: any = {}) {
  return {
    RoleID: 2,
    RoleName: 'UFO',
    Description: 'UnFranchise Owner',
    ...overrides
  };
}

/**
 * Create a mock template
 */
export function createMockTemplate(overrides: any = {}) {
  return {
    TemplateID: 1,
    TemplateName: 'Default Email',
    TemplateType: 'Email',
    Subject: 'Check this out!',
    Body: 'Hi {firstName}, I wanted to share this with you...',
    Variables: 'firstName,contentTitle,trackingLink',
    IsDefault: 1,
    IsActive: 1,
    CreatedDate: new Date(),
    UpdatedDate: new Date(),
    ...overrides
  };
}

/**
 * Create a mock engagement event
 */
export function createMockEngagementEvent(overrides: any = {}) {
  return {
    EngagementEventID: 1,
    ContentItemID: 1,
    TrackingLinkID: 1,
    ShareEventID: 1,
    ContactID: 1,
    EventType: 'Click',
    EventDate: new Date(),
    IPAddress: '192.168.1.1',
    UserAgent: 'Mozilla/5.0',
    DeviceType: 'Desktop',
    OperatingSystem: 'Windows',
    Browser: 'Chrome',
    SessionID: 'session-123',
    IsUniqueVisitor: 1,
    ReferrerURL: null,
    ...overrides
  };
}

/**
 * Mock database query response
 */
export function mockQueryResponse<T>(data: T[]): T[] {
  return data;
}

/**
 * Mock database query with recordset
 */
export function mockRecordsetResponse<T>(data: T[]) {
  return {
    recordset: data,
    rowsAffected: [data.length],
    output: {},
    returnValue: 0
  };
}

/**
 * Mock successful database operation
 */
export function mockSuccessResponse(rowsAffected: number = 1) {
  return {
    recordset: [],
    rowsAffected: [rowsAffected],
    output: {},
    returnValue: 0
  };
}

/**
 * Wait for async operations
 */
export function wait(ms: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock date in the past
 */
export function pastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/**
 * Create a mock date in the future
 */
export function futureDate(daysFromNow: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}
