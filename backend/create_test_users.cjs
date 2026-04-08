/**
 * Create test users for authentication testing
 */
const sql = require('mssql');
const bcrypt = require('bcryptjs');

const config = {
  server: 'dbms-dwhs.corp.shop.com\\DWP01',
  database: 'UnFranchiseMarketing',
  user: 'unfranchise_app',
  password: 'UnFr@nch1se2026!',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
    instanceName: 'DWP01'
  }
};

async function createTestUsers() {
  console.log('='.repeat(70));
  console.log('Creating Test Users');
  console.log('='.repeat(70));

  try {
    const pool = await sql.connect(config);

    // Get roles
    const rolesResult = await pool.request().query('SELECT RoleID, RoleName FROM [Role]');
    const roles = {};
    rolesResult.recordset.forEach(r => {
      roles[r.RoleName] = r.RoleID;
    });

    // Get first market and language
    const marketResult = await pool.request().query('SELECT TOP 1 MarketID FROM Market');
    const marketId = marketResult.recordset[0].MarketID;

    const langResult = await pool.request().query('SELECT TOP 1 LanguageID FROM [Language]');
    const languageId = langResult.recordset[0].LanguageID;

    // Test users to create
    const testUsers = [
      {
        email: 'admin@unfranchise.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'Corporate Admin'
      },
      {
        email: 'ufo@unfranchise.com',
        password: 'ufo123',
        firstName: 'UFO',
        lastName: 'Demo',
        role: 'UFO'
      },
      {
        email: 'super@unfranchise.com',
        password: 'super123',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'Super Admin'
      }
    ];

    console.log('\nCreating test users...');

    for (const userData of testUsers) {
      try {
        // Check if user exists
        const existingUser = await pool.request()
          .input('email', sql.NVarChar, userData.email)
          .query('SELECT UserID FROM [User] WHERE Email = @email');

        if (existingUser.recordset.length > 0) {
          console.log(`  i User already exists: ${userData.email}`);
          continue;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(userData.password, 10);

        // Insert user
        await pool.request()
          .input('email', sql.NVarChar, userData.email)
          .input('passwordHash', sql.NVarChar, passwordHash)
          .input('firstName', sql.NVarChar, userData.firstName)
          .input('lastName', sql.NVarChar, userData.lastName)
          .input('roleId', sql.Int, roles[userData.role])
          .input('marketId', sql.Int, marketId)
          .input('languageId', sql.Int, languageId)
          .query(`
            INSERT INTO [User] (
              Email, PasswordHash, FirstName, LastName, RoleID, MarketID,
              PreferredLanguageID, Status, EmailVerified, CreatedDate, UpdatedDate
            )
            VALUES (
              @email, @passwordHash, @firstName, @lastName, @roleId, @marketId,
              @languageId, 'Active', 1, GETDATE(), GETDATE()
            )
          `);

        console.log(`  OK Created: ${userData.email} (password: ${userData.password})`);

      } catch (err) {
        console.log(`  X Error creating ${userData.email}: ${err.message}`);
      }
    }

    await pool.close();

    console.log('\n' + '='.repeat(70));
    console.log('Test Users Created Successfully!');
    console.log('='.repeat(70));
    console.log('\nTest Credentials:');
    console.log('\n  UFO User:');
    console.log('    Email: ufo@unfranchise.com');
    console.log('    Password: ufo123');
    console.log('\n  Admin User:');
    console.log('    Email: admin@unfranchise.com');
    console.log('    Password: admin123');
    console.log('\n  Super Admin:');
    console.log('    Email: super@unfranchise.com');
    console.log('    Password: super123');
    console.log('\nYou can now test the login API with these credentials.');

  } catch (error) {
    console.error('\nX Error:', error.message);
    process.exit(1);
  }
}

createTestUsers().then(() => process.exit(0));
