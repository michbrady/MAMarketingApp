/**
 * Test database connection for UnFranchise Marketing App
 */
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

async function testConnection() {
  console.log('='.repeat(70));
  console.log('Testing Database Connection');
  console.log('='.repeat(70));
  console.log(`Server: ${config.server}`);
  console.log(`Database: ${config.database}`);
  console.log();

  try {
    console.log('Connecting to database...');
    const pool = await sql.connect(config);
    console.log('OK Connected successfully!');
    console.log();

    // Test query 1: Get database name
    console.log('Test 1: Getting current database...');
    const result1 = await pool.request().query('SELECT DB_NAME() AS CurrentDatabase');
    console.log(`  Current database: ${result1.recordset[0].CurrentDatabase}`);
    console.log('  OK');
    console.log();

    // Test query 2: Count tables
    console.log('Test 2: Counting database objects...');
    const result2 = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE') AS TableCount,
        (SELECT COUNT(*) FROM sys.procedures WHERE is_ms_shipped = 0) AS ProcedureCount,
        (SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped = 0) AS ViewCount
    `);
    console.log(`  Tables: ${result2.recordset[0].TableCount}`);
    console.log(`  Stored Procedures: ${result2.recordset[0].ProcedureCount}`);
    console.log(`  Views: ${result2.recordset[0].ViewCount}`);
    console.log('  OK');
    console.log();

    // Test query 3: Get sample data
    console.log('Test 3: Checking seed data...');
    const result3 = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM Market) AS MarketCount,
        (SELECT COUNT(*) FROM [Language]) AS LanguageCount,
        (SELECT COUNT(*) FROM [Role]) AS RoleCount,
        (SELECT COUNT(*) FROM ContentCategory) AS CategoryCount
    `);
    console.log(`  Markets: ${result3.recordset[0].MarketCount}`);
    console.log(`  Languages: ${result3.recordset[0].LanguageCount}`);
    console.log(`  Roles: ${result3.recordset[0].RoleCount}`);
    console.log(`  Content Categories: ${result3.recordset[0].CategoryCount}`);
    console.log('  OK');
    console.log();

    // Test query 4: List some tables
    console.log('Test 4: Sample tables...');
    const result4 = await pool.request().query(`
      SELECT TOP 10 TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    result4.recordset.forEach(row => {
      console.log(`  - ${row.TABLE_NAME}`);
    });
    console.log('  OK');
    console.log();

    await pool.close();

    console.log('='.repeat(70));
    console.log('ALL TESTS PASSED!');
    console.log('='.repeat(70));
    console.log();
    console.log('Database is ready for development.');
    console.log('You can now start the backend server.');
    console.log();
    return 0;

  } catch (error) {
    console.error('X DATABASE CONNECTION ERROR:');
    console.error(error.message);
    console.error();
    console.error('Full error:', error);
    return 1;
  }
}

testConnection().then(code => process.exit(code));
