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

async function clearShareEvents() {
  try {
    console.log('Connecting to database...');
    const pool = await sql.connect(config);

    // Check current count
    const countResult = await pool.request().query(`
      SELECT COUNT(*) as count FROM ShareEvent
    `);
    console.log(`Current share events: ${countResult.recordset[0].count}`);

    if (countResult.recordset[0].count > 0) {
      console.log('Clearing share events...');
      await pool.request().query(`
        DELETE FROM ShareEvent
      `);
      console.log('Share events cleared successfully!');
    } else {
      console.log('No share events to clear.');
    }

    await pool.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

clearShareEvents();
