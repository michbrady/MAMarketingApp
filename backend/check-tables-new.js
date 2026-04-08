import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
async function checkTables() {
  const pool = await sql.connect({
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: { encrypt: true, trustServerCertificate: true, enableArithAbort: true }
  });
  const result = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME");
  console.log('Tables:');
  result.recordset.forEach(r => console.log('  ' + r.TABLE_NAME));
  console.log('\nTotal:', result.recordset.length);
  const check = ['ContentItemCategory', 'ContentItem', 'User', 'Contact'];
  console.log('\nLooking for:');
  check.forEach(t => {
    const found = result.recordset.some(r => r.TABLE_NAME === t);
    console.log('  ' + t + ': ' + (found ? '✓' : '✗'));
  });
  await pool.close();
}
checkTables().catch(console.error);
