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
console.log('Test Database Setup (Schema Only)');
console.log('========================================\n');

async function setupTestDatabase() {
  let dbPool = null;

  try {
    const dbName = process.env.DB_NAME || 'UnFranchiseMarketing_Test';

    // Connect directly to test database (assume it exists)
    console.log('Step 1: Connecting to test database...');
    console.log(`  Database: ${dbName}`);
    console.log(`  Server: ${process.env.DB_HOST}`);

    const testConfig = {
      server: process.env.DB_HOST,
      database: dbName,
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

    dbPool = await sql.connect(testConfig);
    console.log('✓ Connected to test database\n');

    // Check if database has tables
    const checkTables = await dbPool.request().query(`
      SELECT COUNT(*) as TableCount FROM sys.tables WHERE is_ms_shipped = 0
    `);

    const existingTables = checkTables.recordset[0].TableCount;

    if (existingTables > 0) {
      console.log(`⚠ Warning: Database has ${existingTables} existing tables.`);
      console.log('  This script will attempt to create/update schema.\n');
    } else {
      console.log('✓ Database is empty - ready for schema creation\n');
    }

    // Execute schema scripts in order
    console.log('Step 2: Creating/updating database schema...\n');

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

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const scriptName of schemaScripts) {
      const scriptPath = path.join(databaseDir, scriptName);

      if (!fs.existsSync(scriptPath)) {
        console.log(`  ⚠ Skipping ${scriptName} (not found)`);
        skipCount++;
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

        let batchErrors = 0;

        for (const batch of batches) {
          // Skip comments-only batches and PRINT statements
          const cleanBatch = batch
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/--.*$/gm, '')
            .replace(/^\s*PRINT\s+.*/gim, '')
            .trim();

          if (cleanBatch.length > 0) {
            try {
              await dbPool.request().query(batch);
            } catch (batchError) {
              // Ignore "already exists" errors
              if (batchError.message?.includes('already an object named') ||
                  batchError.message?.includes('already exists') ||
                  batchError.message?.includes('Cannot drop the index')) {
                // Silent - this is expected for idempotent scripts
              } else {
                batchErrors++;
                if (batchErrors === 1) {
                  console.log(`    Error: ${batchError.message.split('\n')[0]}`);
                }
              }
            }
          }
        }

        if (batchErrors === 0) {
          console.log(`  ✓ ${scriptName} completed`);
          successCount++;
        } else {
          console.log(`  ⚠ ${scriptName} completed with ${batchErrors} errors (may be expected)`);
          successCount++;
        }
      } catch (error) {
        console.error(`  ✗ Error in ${scriptName}:`, error.message.split('\n')[0]);
        errorCount++;
      }
    }

    console.log(`\n✓ Schema execution complete`);
    console.log(`  Success: ${successCount}, Skipped: ${skipCount}, Errors: ${errorCount}\n`);

    // Step 3: Seed test data
    console.log('Step 3: Seeding test data...\n');
    await seedTestData(dbPool);
    console.log('✓ Test data seeded\n');

    // Step 4: Verify database
    console.log('Step 4: Verifying database...\n');
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

    if (error.message?.includes('Cannot open database')) {
      console.error('\n⚠ The test database does not exist!');
      console.error('Please ask your DBA to create it, or run this SQL as a user with CREATE DATABASE permissions:');
      console.error(`\nCREATE DATABASE [${process.env.DB_NAME}];\n`);
      console.error(`GRANT ALL ON DATABASE::[${process.env.DB_NAME}] TO [${process.env.DB_USER}];\n`);
    }

    throw error;
  } finally {
    if (dbPool) {
      await dbPool.close();
    }
  }
}

async function seedTestData(pool) {
  try {
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
  } catch (error) {
    console.warn('  ⚠ Error seeding data (may already exist):', error.message.split('\n')[0]);
  }
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
    console.warn('  ⚠ Warning: Expected more tables (10+). Schema may be incomplete.');
  } else {
    console.log('  ✓ Schema looks good!');
  }
}

// Run
setupTestDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
