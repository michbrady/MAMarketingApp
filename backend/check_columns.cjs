const sql = require('mssql');

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

async function check() {
  const pool = await sql.connect(config);
  const r = await pool.request().query('SELECT TOP 1 * FROM ContentItem');
  console.log('ContentItem columns:', Object.keys(r.recordset[0] || {}));
  await pool.close();
}

check();
