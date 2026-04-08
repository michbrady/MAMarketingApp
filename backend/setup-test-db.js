import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment
dotenv.config({ path: '.env.test' });

const databaseDir = path.resolve(__dirname, '../database');

console.log('========================================');
console.log('Test Database Setup');
console.log('========================================\n');

async function createTestDatabase() {
  let masterPool = null;
  let dbPool = null;

  try {
    // Step 1: Connect to master database
    console.log('Step 1: Connecting to SQL Server...');
    const masterConfig = {
      server: process.env.DB_HOST,
      database: 'master',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        enableArithAbort: true,
        instanceName: process.env.DB_HOST?.includes('\\')
          ? process.env.DB_HOST.split('\\')[1]
          : undefined
      }
    };

    masterPool = await sql.connect(masterConfig);
    console.log('✓ Connected to master database\n');

    // Step 2: Drop test database if it exists (clean slate)
    console.log('Step 2: Dropping existing test database (if exists)...');
    const dbName = process.env.DB_NAME || 'UnFranchiseMarketing_Test';

    await masterPool.request().query(`
      IF EXISTS (SELECT 1 FROM sys.databases WHERE name = '${dbName}')
      BEGIN
        ALTER DATABASE [${dbName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
        DROP DATABASE [${dbName}];
      END
    `);
    console.log('✓ Existing database dropped (if it existed)\n');

    // Step 3: Create fresh test database
    console.log('Step 3: Creating test database...');
    await masterPool.request().query(`CREATE DATABASE [${dbName}]`);
    console.log(`✓ Database created: ${dbName}\n`);

    await masterPool.close();
    masterPool = null;

    // Step 4: Connect to new test database
    console.log('Step 4: Connecting to test database...');
    const testConfig = {
      ...masterConfig,
      database: dbName
    };

    dbPool = await sql.connect(testConfig);
    console.log('✓ Connected to test database\n');

    // Step 5: Execute schema scripts in order
    console.log('Step 5: Creating database schema...\n');

    const schemaScripts = [
      '02_Schema_Core_Tables.sql',
      '03_Schema_Sharing_Tracking.sql',
      '04_Schema_Notifications_Audit.sql',
      '06_Schema_ShareTemplates.sql',
      '09_Schema_FollowUp.sql',
      '10_Schema_Settings.sql',
      '11_Contact_Groups_Migration.sql',
      '05_Stored_Procedures.sql',
      '06_Views.sql',
      '08_Analytics_Views.sql'
    ];

    for (const scriptName of schemaScripts) {
      const scriptPath = path.join(databaseDir, scriptName);

      if (!fs.existsSync(scriptPath)) {
        console.log(`  ⚠ Skipping ${scriptName} (not found)`);
        continue;
      }

      console.log(`  Executing ${scriptName}...`);

      try {
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');

        // Split by GO statements and execute each batch
        const batches = scriptContent
          .split(/^\s*GO\s*$/gim)
          .map(batch => batch.trim())
          .filter(batch => batch.length > 0);

        for (const batch of batches) {
          // Skip comments-only batches
          const cleanBatch = batch.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '').trim();
          if (cleanBatch.length > 0) {
            await dbPool.request().query(batch);
          }
        }

        console.log(`  ✓ ${scriptName} completed`);
      } catch (error) {
        // Some errors are expected (e.g., "already exists" for idempotent scripts)
        if (error.message?.includes('already exists') ||
            error.message?.includes('There is already an object')) {
          console.log(`  ✓ ${scriptName} completed (some objects already existed)`);
        } else {
          console.error(`  ✗ Error in ${scriptName}:`, error.message);
          // Don't throw - continue with other scripts
        }
      }
    }

    console.log('\n✓ Schema creation complete\n');

    // Step 6: Seed test data
    console.log('Step 6: Seeding test data...\n');
    await seedTestData(dbPool);
    console.log('✓ Test data seeded\n');

    // Step 7: Verify database
    console.log('Step 7: Verifying database...\n');
    await verifyDatabase(dbPool);

    console.log('\n========================================');
    console.log('✓ Test Database Setup Complete!');
    console.log('========================================');
    console.log(`Database: ${dbName}`);
    console.log(`Server: ${process.env.DB_HOST}`);
    console.log('Ready for integration tests.');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n✗ Error setting up test database:', error);
    throw error;
  } finally {
    if (masterPool) {
      await masterPool.close();
    }
    if (dbPool) {
      await dbPool.close();
    }
  }
}

async function seedTestData(pool) {
  // Markets
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM Market WHERE MarketCode = 'US')
      INSERT INTO Market (MarketCode, MarketName, CountryCode, Region, CurrencyCode, TimeZone, IsActive)
      VALUES ('US', 'United States', 'USA', 'North America', 'USD', 'America/New_York', 1)
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM Market WHERE MarketCode = 'CA')
      INSERT INTO Market (MarketCode, MarketName, CountryCode, Region, CurrencyCode, TimeZone, IsActive)
      VALUES ('CA', 'Canada', 'CAN', 'North America', 'CAD', 'America/Toronto', 1)
  `);

  console.log('  ✓ Markets seeded');

  // Languages
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM Language WHERE LanguageCode = 'en')
      INSERT INTO Language (LanguageCode, LanguageName, NativeName, IsActive)
      VALUES ('en', 'English', 'English', 1)
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM Language WHERE LanguageCode = 'es')
      INSERT INTO Language (LanguageCode, LanguageName, NativeName, IsActive)
      VALUES ('es', 'Spanish', 'Español', 1)
  `);

  console.log('  ✓ Languages seeded');

  // Roles
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM Role WHERE RoleName = 'Admin')
      INSERT INTO Role (RoleName, RoleDescription, PermissionLevel, IsActive)
      VALUES ('Admin', 'System Administrator', 99, 1)
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM Role WHERE RoleName = 'UFO')
      INSERT INTO Role (RoleName, RoleDescription, PermissionLevel, IsActive)
      VALUES ('UFO', 'UnFranchise Owner', 10, 1)
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM Role WHERE RoleName = 'Moderator')
      INSERT INTO Role (RoleName, RoleDescription, PermissionLevel, IsActive)
      VALUES ('Moderator', 'Content Moderator', 50, 1)
  `);

  console.log('  ✓ Roles seeded');
}

async function verifyDatabase(pool) {
  const result = await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped = 0) as TableCount,
      (SELECT COUNT(*) FROM sys.procedures WHERE is_ms_shipped = 0) as ProcedureCount,
      (SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped = 0) as ViewCount
  `);

  const stats = result.recordset[0];
  console.log(`  Tables: ${stats.TableCount}`);
  console.log(`  Stored Procedures: ${stats.ProcedureCount}`);
  console.log(`  Views: ${stats.ViewCount}`);

  if (stats.TableCount < 10) {
    console.warn('  ⚠ Warning: Expected more tables. Schema may be incomplete.');
  }
}

// Run
createTestDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
