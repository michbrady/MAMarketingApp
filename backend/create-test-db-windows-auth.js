import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.test' });

const databaseDir = path.resolve(__dirname, '../database');

console.log('========================================');
console.log('Test Database Creation (Windows Auth)');
console.log('========================================\n');

async function createAndSetupDatabase() {
  let masterPool = null;
  let dbPool = null;

  try {
    const dbName = process.env.DB_NAME || 'UnFranchiseMarketing_Test';
    const appUser = process.env.DB_USER || 'unfranchise_app';
    const appPassword = process.env.DB_PASSWORD;

    console.log('Using Windows Authentication');
    console.log(`  Server: ${process.env.DB_HOST}`);
    console.log(`  Target DB: ${dbName}`);
    console.log(`  Windows User: ${process.env.USERNAME}\\${process.env.USERDOMAIN}\n`);

    // Step 1: Connect to master database with Windows Authentication
    console.log('Step 1: Connecting to SQL Server with Windows Auth...');
    const masterConfig = {
      server: process.env.DB_HOST,
      database: 'master',
      options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true,
        trustedConnection: true, // Windows Authentication
        instanceName: process.env.DB_HOST?.includes('\\')
          ? process.env.DB_HOST.split('\\')[1]
          : undefined
      }
    };

    masterPool = await sql.connect(masterConfig);
    console.log('✓ Connected to master database\n');

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

    // Step 4: Grant permissions to app user (if using SQL auth)
    if (appUser && appPassword) {
      console.log('Step 4: Granting permissions to SQL Server user...');

      // Switch to new database
      await masterPool.request().query(`USE [${dbName}]`);

      // Check if login exists
      const loginCheck = await masterPool.request().query(`
        SELECT COUNT(*) as LoginCount
        FROM sys.server_principals
        WHERE name = '${appUser}'
      `);

      if (loginCheck.recordset[0].LoginCount === 0) {
        console.log(`  Creating SQL Server login for ${appUser}...`);
        await masterPool.request().query(`
          CREATE LOGIN [${appUser}] WITH PASSWORD = '${appPassword}'
        `);
      }

      // Check if user exists in database
      const userCheck = await masterPool.request().query(`
        SELECT COUNT(*) as UserCount
        FROM sys.database_principals
        WHERE name = '${appUser}'
      `);

      if (userCheck.recordset[0].UserCount === 0) {
        console.log(`  Creating database user for ${appUser}...`);
        await masterPool.request().query(`
          CREATE USER [${appUser}] FOR LOGIN [${appUser}]
        `);
      }

      // Grant db_owner role
      await masterPool.request().query(`
        EXEC sp_addrolemember 'db_owner', '${appUser}'
      `);
      console.log(`✓ Permissions granted to ${appUser}\n`);
    } else {
      console.log('Step 4: Skipping SQL user creation (using Windows Auth)\n');
    }

    await masterPool.close();
    masterPool = null;

    // Step 5: Connect to new test database
    console.log('Step 5: Connecting to test database...');
    let testConfig;

    if (appUser && appPassword) {
      // Use SQL Server authentication for app
      testConfig = {
        server: process.env.DB_HOST,
        database: dbName,
        user: appUser,
        password: appPassword,
        options: {
          encrypt: true,
          trustServerCertificate: true,
          enableArithAbort: true,
          instanceName: process.env.DB_HOST?.includes('\\')
            ? process.env.DB_HOST.split('\\')[1]
            : undefined
        }
      };
    } else {
      // Continue with Windows authentication
      testConfig = {
        ...masterConfig,
        database: dbName
      };
    }

    dbPool = await sql.connect(testConfig);
    console.log('✓ Connected to test database\n');

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
              if (!batchError.message?.includes('already an object named') &&
                  !batchError.message?.includes('already exists')) {
                // Only show unexpected errors
                console.log(`    Note: ${batchError.message.split('\n')[0].substring(0, 100)}`);
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
    console.log('\nReady for integration tests!');
    console.log('Run: npm run test:api');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
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
