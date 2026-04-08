import sql from 'mssql';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// CRITICAL: Load test environment variables FIRST with override
// This must happen before importing any modules that use process.env
dotenv.config({ path: '.env.test', override: true });

import { createLogger } from '../../utils/logger.js';
import { getPool, closePool } from '../../config/database.js';

const logger = createLogger('TestDB');

/**
 * Setup test database
 * Creates test database if it doesn't exist
 */
export async function setupTestDatabase(): Promise<void> {
  try {
    logger.info('Setting up test database...');

    // Database already created by DBA - just verify connection
    const pool = await getPool();

    // Verify connection to correct database
    const dbCheck = await pool.request().query('SELECT DB_NAME() AS CurrentDatabase');
    const currentDb = dbCheck.recordset[0].CurrentDatabase;

    console.log(`[TEST-DB] Connected to database: ${currentDb}`);
    logger.info(`Test database setup complete - connected to: ${currentDb}`);

    if (currentDb !== process.env.DB_NAME) {
      throw new Error(`Connected to wrong database! Expected: ${process.env.DB_NAME}, Got: ${currentDb}`);
    }
  } catch (error) {
    logger.error('Error setting up test database:', error);
    console.error('[TEST-DB] Setup error:', error);
    throw error;
  }
}

/**
 * Clean up test database
 * Truncates all tables
 */
export async function cleanupTestDatabase(): Promise<void> {
  try {
    logger.info('Cleaning up test database...');

    const pool = await getPool();

    // Use DELETE instead of TRUNCATE to respect foreign key constraints
    // Delete in reverse dependency order (children first, parents last)
    const tables = [
      'FollowUpReminder',
      'FollowUp',
      'ContactTimeline',
      'ContactNote',
      'ContactGroupMember',
      'ContactTag',
      'ContactGroup',
      'Contact',
      'ShareRecipient',
      'ShareEvent',
      'EngagementEvent',
      'TrackingLink',
      'ContentItemCategory',
      'ContentItemTag',
      'ContentItemMarket',
      'ContentItemLanguage',
      'ContentItem',
      'ContentCategory',
      'ContentTag',
      'UserSession',
      'UserSettings',
      'UserFavoriteContent',
      '[User]',
      'Role',
      'Market',
      'Language',
      'AuditLog'
    ];

    for (const table of tables) {
      try {
        await pool.request().query(`
          IF OBJECT_ID('dbo.${table}', 'U') IS NOT NULL
            DELETE FROM dbo.${table}
        `);
      } catch (error) {
        // Ignore errors for tables that don't exist
        logger.debug(`Could not delete from ${table}:`, error);
      }
    }

    logger.info('Test database cleanup complete');
  } catch (error) {
    logger.error('Error cleaning up test database:', error);
    throw error;
  }
}

/**
 * Seed test data
 * Creates initial test data for all tests
 */
export async function seedTestData(): Promise<{
  users: any[];
  roles: any[];
  markets: any[];
  languages: any[];
  categories: any[];
  content: any[];
  contacts: any[];
  contactGroups: any[];
}> {
  try {
    logger.info('Seeding test data...');

    const pool = await getPool();

    // Verify connection
    const dbCheck = await pool.request().query('SELECT DB_NAME() AS CurrentDatabase');
    logger.info(`Connected to database: ${dbCheck.recordset[0].CurrentDatabase}`);

    // Create languages
    const languages = [
      { LanguageID: 1, LanguageCode: 'en', LanguageName: 'English', NativeName: 'English' },
      { LanguageID: 2, LanguageCode: 'es', LanguageName: 'Spanish', NativeName: 'Español' }
    ];

    // Insert languages with IDENTITY_INSERT
    // Note: SQL Server allows only one table per session to have IDENTITY_INSERT ON
    logger.info('Inserting languages with IDENTITY_INSERT...');
    const request1 = pool.request();
    await request1.query(`
      SET IDENTITY_INSERT dbo.Language ON;

      ${languages.map(lang => `
      IF NOT EXISTS (SELECT 1 FROM dbo.Language WHERE LanguageID = ${lang.LanguageID})
        INSERT INTO dbo.Language (LanguageID, LanguageCode, LanguageName, NativeName, IsActive, CreatedDate)
        VALUES (${lang.LanguageID}, '${lang.LanguageCode}', '${lang.LanguageName}', '${lang.NativeName}', 1, GETUTCDATE());
      `).join('\n')}

      SET IDENTITY_INSERT dbo.Language OFF;
    `);

    // Create markets
    const markets = [
      { MarketID: 1, MarketCode: 'US', MarketName: 'United States', CountryCode: 'USA', CurrencyCode: 'USD', TimeZone: 'America/New_York' },
      { MarketID: 2, MarketCode: 'CA', MarketName: 'Canada', CountryCode: 'CAN', CurrencyCode: 'CAD', TimeZone: 'America/Toronto' },
      { MarketID: 3, MarketCode: 'MX', MarketName: 'Mexico', CountryCode: 'MEX', CurrencyCode: 'MXN', TimeZone: 'America/Mexico_City' }
    ];

    // Insert markets with IDENTITY_INSERT
    logger.info('Inserting markets with IDENTITY_INSERT...');
    const request2 = pool.request();
    await request2.query(`
      SET IDENTITY_INSERT dbo.Market ON;

      ${markets.map(market => `
      IF NOT EXISTS (SELECT 1 FROM dbo.Market WHERE MarketID = ${market.MarketID})
        INSERT INTO dbo.Market (MarketID, MarketCode, MarketName, CountryCode, Region, CurrencyCode, TimeZone, IsActive)
        VALUES (${market.MarketID}, '${market.MarketCode}', '${market.MarketName}', '${market.CountryCode}', 'North America', '${market.CurrencyCode}', '${market.TimeZone}', 1);
      `).join('\n')}

      SET IDENTITY_INSERT dbo.Market OFF;
    `);

    // Create roles
    const roles = [
      { RoleID: 1, RoleName: 'Admin', RoleDescription: 'Administrator', PermissionLevel: 99 },
      { RoleID: 2, RoleName: 'UFO', RoleDescription: 'UnFranchise Owner', PermissionLevel: 10 },
      { RoleID: 3, RoleName: 'Moderator', RoleDescription: 'Content Moderator', PermissionLevel: 50 }
    ];

    // Insert roles with IDENTITY_INSERT
    logger.info('Inserting roles with IDENTITY_INSERT...');
    const request3 = pool.request();
    await request3.query(`
      SET IDENTITY_INSERT dbo.Role ON;

      ${roles.map(role => `
      IF NOT EXISTS (SELECT 1 FROM dbo.Role WHERE RoleID = ${role.RoleID})
        INSERT INTO dbo.Role (RoleID, RoleName, RoleDescription, PermissionLevel, IsActive, CreatedDate)
        VALUES (${role.RoleID}, '${role.RoleName}', '${role.RoleDescription}', ${role.PermissionLevel}, 1, GETUTCDATE());
      `).join('\n')}

      SET IDENTITY_INSERT dbo.Role OFF;
    `);

    // Create test users
    const passwordHash = await bcrypt.hash('password123', 10);

    const users = [
      {
        UserID: 1,
        MemberID: 'ADMIN001',
        Email: 'admin@test.com',
        FirstName: 'Admin',
        LastName: 'User',
        RoleID: 1,
        MarketID: 1,
        PreferredLanguageID: 1,
        Status: 'Active'
      },
      {
        UserID: 2,
        MemberID: 'UFO001',
        Email: 'ufo@test.com',
        FirstName: 'Test',
        LastName: 'UFO',
        RoleID: 2,
        MarketID: 1,
        PreferredLanguageID: 1,
        Status: 'Active'
      },
      {
        UserID: 3,
        MemberID: 'UFO002',
        Email: 'ufo2@test.com',
        FirstName: 'Another',
        LastName: 'UFO',
        RoleID: 2,
        MarketID: 1,
        PreferredLanguageID: 1,
        Status: 'Active'
      },
      {
        UserID: 4,
        MemberID: 'UFO003',
        Email: 'inactive@test.com',
        FirstName: 'Inactive',
        LastName: 'User',
        RoleID: 2,
        MarketID: 1,
        PreferredLanguageID: 1,
        Status: 'Inactive'
      }
    ];

    // Insert users with IDENTITY_INSERT
    logger.info('Inserting users with IDENTITY_INSERT...');
    const request4 = pool.request();
    await request4.query(`
      SET IDENTITY_INSERT dbo.[User] ON;

      ${users.map(user => `
      IF NOT EXISTS (SELECT 1 FROM dbo.[User] WHERE UserID = ${user.UserID})
        INSERT INTO dbo.[User] (UserID, MemberID, Email, PasswordHash, FirstName, LastName, RoleID, MarketID, PreferredLanguageID, Status, CreatedDate)
        VALUES (${user.UserID}, '${user.MemberID}', '${user.Email}', '${passwordHash}', '${user.FirstName}', '${user.LastName}', ${user.RoleID}, ${user.MarketID}, ${user.PreferredLanguageID}, '${user.Status}', GETUTCDATE());
      `).join('\n')}

      SET IDENTITY_INSERT dbo.[User] OFF;
    `);

    // Create content categories
    const categories = [
      { ContentCategoryID: 1, CategoryName: 'Product' },
      { ContentCategoryID: 2, CategoryName: 'Training' },
      { ContentCategoryID: 3, CategoryName: 'Event' }
    ];

    // Insert content categories with IDENTITY_INSERT
    logger.info('Inserting content categories with IDENTITY_INSERT...');
    const request5 = pool.request();
    await request5.query(`
      SET IDENTITY_INSERT dbo.ContentCategory ON;

      ${categories.map(category => `
      IF NOT EXISTS (SELECT 1 FROM dbo.ContentCategory WHERE ContentCategoryID = ${category.ContentCategoryID})
        INSERT INTO dbo.ContentCategory (ContentCategoryID, CategoryName, CategoryDescription, SortOrder, IsActive, CreatedDate)
        VALUES (${category.ContentCategoryID}, '${category.CategoryName}', '${category.CategoryName} content', ${category.ContentCategoryID}, 1, GETUTCDATE());
      `).join('\n')}

      SET IDENTITY_INSERT dbo.ContentCategory OFF;
    `);

    // Create content items
    const content = [
      {
        ContentItemID: 1,
        Title: 'Product Launch Video',
        Description: 'New product announcement',
        ContentType: 'Video',
        ContentCategoryID: 1,
        CreatedByUserID: 1,
        PublishStatus: 'Published'
      },
      {
        ContentItemID: 2,
        Title: 'Training Guide',
        Description: 'Getting started guide',
        ContentType: 'Document',
        ContentCategoryID: 2,
        CreatedByUserID: 1,
        PublishStatus: 'Published'
      },
      {
        ContentItemID: 3,
        Title: 'Event Invitation',
        Description: 'Annual conference',
        ContentType: 'Image',
        ContentCategoryID: 3,
        CreatedByUserID: 1,
        PublishStatus: 'Published'
      },
      {
        ContentItemID: 4,
        Title: 'Draft Content',
        Description: 'Not published yet',
        ContentType: 'Video',
        ContentCategoryID: 1,
        CreatedByUserID: 1,
        PublishStatus: 'Draft'
      }
    ];

    // Insert content items with IDENTITY_INSERT
    logger.info('Inserting content items with IDENTITY_INSERT...');
    const request6 = pool.request();
    await request6.query(`
      SET IDENTITY_INSERT dbo.ContentItem ON;

      ${content.map(item => `
      IF NOT EXISTS (SELECT 1 FROM dbo.ContentItem WHERE ContentItemID = ${item.ContentItemID})
      BEGIN
        INSERT INTO dbo.ContentItem (ContentItemID, Title, Description, ContentType, PublishStatus, CreatedBy, CreatedDate, PublishDate)
        VALUES (${item.ContentItemID}, '${item.Title}', '${item.Description}', '${item.ContentType}', '${item.PublishStatus}', ${item.CreatedByUserID}, GETUTCDATE(), ${item.PublishStatus === 'Published' ? 'GETUTCDATE()' : 'NULL'});

        INSERT INTO dbo.ContentItemCategory (ContentItemID, ContentCategoryID, IsPrimary)
        VALUES (${item.ContentItemID}, ${item.ContentCategoryID}, 1);
      END
      `).join('\n')}

      SET IDENTITY_INSERT dbo.ContentItem OFF;
    `);

    // Create contacts
    const contacts = [
      {
        ContactID: 1,
        OwnerUserID: 2,
        FirstName: 'John',
        LastName: 'Doe',
        Email: 'john.doe@example.com',
        Mobile: '+15551234567'
      },
      {
        ContactID: 2,
        OwnerUserID: 2,
        FirstName: 'Jane',
        LastName: 'Smith',
        Email: 'jane.smith@example.com',
        Mobile: '+15559876543'
      },
      {
        ContactID: 3,
        OwnerUserID: 3,
        FirstName: 'Bob',
        LastName: 'Johnson',
        Email: 'bob.johnson@example.com',
        Mobile: '+15555555555'
      }
    ];

    // Insert contacts with IDENTITY_INSERT
    logger.info('Inserting contacts with IDENTITY_INSERT...');
    const request7 = pool.request();
    await request7.query(`
      SET IDENTITY_INSERT dbo.Contact ON;

      ${contacts.map(contact => {
        const contactHash = `${contact.Email}_${contact.Mobile}`.toLowerCase();
        return `
      IF NOT EXISTS (SELECT 1 FROM dbo.Contact WHERE ContactID = ${contact.ContactID})
        INSERT INTO dbo.Contact (ContactID, OwnerUserID, FirstName, LastName, Email, Mobile, Status, ContactHash, Source, CreatedDate, UpdatedDate)
        VALUES (${contact.ContactID}, ${contact.OwnerUserID}, '${contact.FirstName}', '${contact.LastName}', '${contact.Email}', '${contact.Mobile}', 'Active', '${contactHash}', 'Manual', GETUTCDATE(), GETUTCDATE());
      `;
      }).join('\n')}

      SET IDENTITY_INSERT dbo.Contact OFF;
    `);

    // Create contact groups
    const contactGroups = [
      {
        GroupID: 1,
        UserID: 2,
        GroupName: 'Hot Prospects',
        Description: 'High-priority leads'
      },
      {
        GroupID: 2,
        UserID: 2,
        GroupName: 'VIP Customers',
        Description: 'Top customers'
      }
    ];

    // Insert contact groups with IDENTITY_INSERT
    logger.info('Inserting contact groups with IDENTITY_INSERT...');
    const request8 = pool.request();
    await request8.query(`
      SET IDENTITY_INSERT dbo.ContactGroup ON;

      ${contactGroups.map(group => `
      IF NOT EXISTS (SELECT 1 FROM dbo.ContactGroup WHERE GroupID = ${group.GroupID})
        INSERT INTO dbo.ContactGroup (GroupID, UserID, GroupName, Description, CreatedDate, UpdatedDate)
        VALUES (${group.GroupID}, ${group.UserID}, '${group.GroupName}', '${group.Description}', GETUTCDATE(), GETUTCDATE());
      `).join('\n')}

      SET IDENTITY_INSERT dbo.ContactGroup OFF;
    `);

    logger.info('Test data seeding complete');

    return {
      users,
      roles,
      markets,
      languages,
      categories,
      content,
      contacts,
      contactGroups
    };

  } catch (error) {
    logger.error('Error seeding test data:', error);
    throw error;
  }
}

/**
 * Close database connections
 */
export async function closeTestDatabase(): Promise<void> {
  await closePool();
}
