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

  const tables = await pool.request().query(`
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME LIKE 'ContentItem%' OR TABLE_NAME = 'ContentTag'
    ORDER BY TABLE_NAME
  `);

  console.log('Related tables:');
  for (const t of tables.recordset) {
    console.log(`  - ${t.TABLE_NAME}`);

    const cols = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${t.TABLE_NAME}'
      ORDER BY ORDINAL_POSITION
    `);

    cols.recordset.forEach(c => {
      console.log(`      ${c.COLUMN_NAME} (${c.DATA_TYPE})`);
    });
    console.log();
  }

  await pool.close();
}

check().catch(console.error);
