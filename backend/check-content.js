import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  server: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true
  }
};

async function checkContent() {
  try {
    console.log('Connecting to database...');
    const pool = await sql.connect(config);

    console.log('\nChecking ContentItem table...');
    const result = await pool.request().query(`
      SELECT TOP 10
        ContentItemID,
        Title,
        ContentType,
        PublishStatus,
        CreatedDate
      FROM ContentItem
      ORDER BY CreatedDate DESC
    `);

    console.log(`\nFound ${result.recordset.length} content items:`);
    console.log(JSON.stringify(result.recordset, null, 2));

    // Get total count
    const countResult = await pool.request().query('SELECT COUNT(*) as Total FROM ContentItem');
    console.log(`\nTotal content items in database: ${countResult.recordset[0].Total}`);

    await pool.close();
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

checkContent();
