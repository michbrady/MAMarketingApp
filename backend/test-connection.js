import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

console.log('Testing SQL Server connection...');
console.log('Host:', process.env.DB_HOST);
console.log('Database:', process.env.DB_NAME);
console.log('User:', process.env.DB_USER);

const config = {
  server: process.env.DB_HOST,
  database: 'master',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true,
    instanceName: process.env.DB_HOST?.includes('\\')
      ? process.env.DB_HOST.split('\\')[1]
      : undefined
  }
};

console.log('Connecting...');

try {
  const pool = await sql.connect(config);
  console.log('✓ Connected successfully!');

  const result = await pool.request().query('SELECT @@VERSION as Version');
  console.log('SQL Server Version:', result.recordset[0].Version);

  await pool.close();
  console.log('✓ Connection closed');
  process.exit(0);
} catch (error) {
  console.error('✗ Connection failed:', error.message);
  process.exit(1);
}
