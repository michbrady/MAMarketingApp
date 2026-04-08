import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load DBA credentials
const dbaEnv = dotenv.config({ path: '.env.dba' });
if (dbaEnv.error) {
  console.error('✗ Error: .env.dba file not found or invalid');
  console.error('Please create .env.dba with your DBA credentials');
  process.exit(1);
}

// Load test environment for app user credentials
dotenv.config({ path: '.env.test' });

const databaseDir = path.resolve(__dirname, '../database');

console.log('========================================');
console.log('Test Database Creation (DBA Mode)');
console.log('========================================\n');

async function createAndSetupDatabase() {
  let masterPool = null;
  let dbPool = null;

  try {
    const dbName = process.env.DB_NAME || 'UnFranchiseMarketing_Test';
    const dbaUser = process.env.DBA_USER;
    const dbaPassword = process.env.DBA_PASSWORD;
    const appUser = process.env.APP_USER || 'unfranchise_app';

    if (!dbaUser || !dbaPassword) {
      console.error('✗ Error: DBA_USER and DBA_PASSWORD must be set in .env.dba');
      process.exit(1);
    }

    console.log('Using DBA credentials:');
    console.log(`  User: ${dbaUser}`);
    console.log(`  Server: ${process.env.DB_HOST}`);
    console.log(`  Target DB: ${dbName}\n`);

    // Step 1: Connect to master database with DBA credentials
    console.log('Step 1: Connecting to SQL Server as DBA...');
    const masterConfig = {
      server: process.env.DB_HOST,
      database: 'master',
      user: dbaUser,
      password: dbaPassword,
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true,
        enableArithAbort: true,
        instanceName: process.env.DB_HOST?.includes('\\')
          ? process.env.DB_HOST.split('\\')[1]
          : undefined
      }
    };

    masterPool = await sql.connect(masterConfig);
    console.log('✓ Connected to master database as DBA\n');

    // Step 2: Drop test database if it exists
    console.log('Step 2: Dropping existing test database (if exists)...');
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

    // Step 4: Grant permissions to app user
    console.log('Step 4: Granting permissions to application user...');
    await masterPool.request().query(`USE [${dbName}]`);

    // Check if user exists in database, if not create mapping
    const userCheck = await masterPool.request().query(`
      SELECT COUNT(*) as UserCount
      FROM sys.database_principals
      WHERE name = '${appUser}'
    `);

    if (userCheck.recordset[0].UserCount === 0) {
      console.log(`  Creating user mapping for ${appUser}...`);
      try {
        await masterPool.request().query(`CREATE USER [${appUser}] FOR LOGIN [${appUser}]`);
      } catch (err) {
        console.log(`  Note: ${err.message}`);
      }
    }

    // Grant db_owner role
    await masterPool.request().query(`
      EXEC sp_addrolemember 'db_owner', '${appUser}'
    `);
    console.log(`✓ Permissions granted to ${appUser}\n`);

    await masterPool.close();
    masterPool = null;

    // Step 5: Connect to new test database with app user
    console.log('Step 5: Connecting as application user...');
    const testConfig = {
      server: process.env.DB_HOST,
      database: dbName,
      user: appUser,
      password: process.env.DB_PASSWORD, // from .env.test
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true,
        enableArithAbort: true,
        instanceName: process.env.DB_HOST?.includes('\\')
          ? process.env.DB_HOST.split('\\')[1]
          : undefined
      }
    };

    dbPool = await sql.connect(testConfig);
    console.log(`✓ Connected as ${appUser}\n`);

    // Step 6: Execute schema scripts
    console.log('Step 6: Creating database schema...\n');

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

        // Split by GO statements
        const batches = scriptContent
          .split(/^\s*GO\s*$/gim)
          .map(batch => batch.trim())
          .filter(batch => batch.length > 0);

        for (const batch of batches) {
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
              if (!batchError.message?.includes('already an object named') &&
                  !batchError.message?.includes('already exists')) {
                console.log(`    Warning: ${batchError.message.split('\n')[0]}`);
              }
            }
          }
        }

        console.log(`  ✓ ${scriptName} completed`);
        successCount++;
      } catch (error) {
        console.error(`  ✗ Error in ${scriptName}:`, error.message.split('\n')[0]);
      }
    }

    console.log(`\n✓ Schema execution complete (${successCount} scripts, ${skipCount} skipped)\n`);

    // Step 7: Seed test data
    console.log('Step 7: Seeding test data...\n');
    await seedTestData(dbPool);
    console.log('✓ Test data seeded\n');

    // Step 8: Verify database
    console.log('Step 8: Verifying database...\n');
    await verifyDatabase(dbPool);

    console.log('\n========================================');
    console.log('✓ Test Database Setup Complete!');
    console.log('========================================');
    console.log(`Database: ${dbName}`);
    console.log(`Server: ${process.env.DB_HOST}`);
    console.log(`App User: ${appUser}`);
    console.log('\nReady for integration tests!');
    console.log('Run: npm run test:api');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    if (masterPool) await masterPool.close();
    if (dbPool) await dbPool.close();
  }
}

async function seedTestData(pool) {
  try {
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
    console.warn('  ⚠ Error seeding data:', error.message.split('\n')[0]);
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
    console.warn('  ⚠ Warning: Expected 10+ tables. Schema may be incomplete.');
  } else {
    console.log('  ✓ Schema looks good!');
  }
}

createAndSetupDatabase();
