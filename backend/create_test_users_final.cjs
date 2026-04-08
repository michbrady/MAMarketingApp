const sql = require('mssql');
const bcrypt = require('bcryptjs');

const config = {
  server: 'dbms-dwhs.corp.shop.com',
  database: 'UnFranchiseMarketing',
  user: 'unfranchise_app',
  password: 'UnFr@nch1se2026!',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    instanceName: 'DWP01'
  }
};

async function main() {
  console.log('Creating test users...\n');
  const pool = await sql.connect(config);

  // Get roles
  const roles = await pool.request().query('SELECT RoleID, RoleName FROM [Role]');
  console.log('Available roles:');
  roles.recordset.forEach(r => console.log(`  - ${r.RoleName} (ID: ${r.RoleID})`));

  const roleMap = {};
  roles.recordset.forEach(r => { roleMap[r.RoleName] = r.RoleID; });

  // Get market and language
  const market = await pool.request().query('SELECT TOP 1 MarketID FROM Market');
  const lang = await pool.request().query('SELECT TOP 1 LanguageID FROM [Language]');
  const marketId = market.recordset[0].MarketID;
  const langId = lang.recordset[0].LanguageID;

  const users = [
    { email: 'ufo@unfranchise.com', password: 'ufo123', firstName: 'UFO', lastName: 'Demo', role: 'UFO', memberId: 'UFO001' },
    { email: 'admin@unfranchise.com', password: 'admin123', firstName: 'Admin', lastName: 'User', role: 'Corporate Admin', memberId: 'ADMIN001' },
    { email: 'super@unfranchise.com', password: 'super123', firstName: 'Super', lastName: 'Admin', role: 'Super Admin', memberId: 'SUPER001' }
  ];

  console.log('\nCreating users:');
  for (const u of users) {
    const exists = await pool.request().input('email', sql.NVarChar, u.email).query('SELECT UserID FROM [User] WHERE Email = @email');
    if (exists.recordset.length > 0) {
      console.log(`  - ${u.email} already exists`);
      continue;
    }

    const hash = await bcrypt.hash(u.password, 10);
    await pool.request()
      .input('memberId', sql.NVarChar, u.memberId)
      .input('email', sql.NVarChar, u.email)
      .input('hash', sql.NVarChar, hash)
      .input('first', sql.NVarChar, u.firstName)
      .input('last', sql.NVarChar, u.lastName)
      .input('role', sql.Int, roleMap[u.role])
      .input('market', sql.Int, marketId)
      .input('lang', sql.Int, langId)
      .query(`
        INSERT INTO [User] (MemberID, Email, PasswordHash, FirstName, LastName, RoleID, MarketID, PreferredLanguageID, Status, EmailVerified, CreatedDate, UpdatedDate)
        VALUES (@memberId, @email, @hash, @first, @last, @role, @market, @lang, 'Active', 1, GETDATE(), GETDATE())
      `);
    console.log(`  + Created: ${u.email} (password: ${u.password})`);
  }

  await pool.close();
  console.log('\nDone! Test credentials:\n  ufo@unfranchise.com / ufo123\n  admin@unfranchise.com / admin123\n  super@unfranchise.com / super123');
}

main().catch(err => console.error(err));
