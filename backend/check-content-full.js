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
    console.log('Checking content with all fields...\n');
    const pool = await sql.connect(config);

    const result = await pool.request().query(`
      SELECT TOP 10
        ContentItemID,
        Title,
        Subtitle,
        Description,
        ThumbnailURL,
        MediaURL,
        DestinationURL,
        ContentType,
        FileSizeBytes,
        PublishStatus,
        IsFeatured,
        CreatedDate
      FROM ContentItem
      ORDER BY CreatedDate DESC
    `);

    console.log(`Found ${result.recordset.length} content items:`);
    console.log(JSON.stringify(result.recordset, null, 2));

    await pool.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkContent();
