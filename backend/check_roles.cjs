const sql = require('mssql');
const config = {
  server: 'dbms-dwhs.corp.shop.com\DWP01',
  database: 'UnFranchiseMarketing',
  user: 'unfranchise_app',
  password: 'UnFr@nch1se2026!',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    instanceName: 'DWP01'
  }
};

(async () => {
  const pool = await sql.connect(config);
  const result = await pool.request().query('SELECT RoleID, RoleName FROM [Role]');
  console.log('Available roles:');
  result.recordset.forEach(r => console.log(`  ${r.RoleID}: ${r.RoleName}`));
  await pool.close();
})();
