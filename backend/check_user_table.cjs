const sql = require('mssql');
const config = {
  server: 'dbms-dwhs.corp.shop.com\\DWP01',
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
  const result = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'User'
    ORDER BY ORDINAL_POSITION
  `);
  console.log('User table columns:');
  result.recordset.forEach(r => console.log(`  ${r.COLUMN_NAME} (${r.DATA_TYPE})`));
  await pool.close();
})();
