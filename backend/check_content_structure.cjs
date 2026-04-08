/**
 * Check existing content structure and categories
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

async function checkStructure() {
  try {
    console.log('Connecting to database...\n');
    const pool = await sql.connect(config);

    // Check ContentCategory table structure
    console.log('='.repeat(70));
    console.log('ContentCategory Table Structure:');
    console.log('='.repeat(70));
    const columns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'ContentCategory'
      ORDER BY ORDINAL_POSITION
    `);
    columns.recordset.forEach(col => {
      console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    console.log();

    // Check existing categories
    console.log('='.repeat(70));
    console.log('Existing ContentCategories:');
    console.log('='.repeat(70));
    const categories = await pool.request().query(`
      SELECT ContentCategoryID, CategoryName, CategoryDescription, IsActive
      FROM ContentCategory
      ORDER BY CategoryName
    `);
    if (categories.recordset.length > 0) {
      categories.recordset.forEach(cat => {
        console.log(`[${cat.ContentCategoryID}] ${cat.CategoryName} - ${cat.CategoryDescription || 'No description'} (Active: ${cat.IsActive})`);
      });
    } else {
      console.log('No categories found.');
    }
    console.log();

    // Check ContentItem table structure
    console.log('='.repeat(70));
    console.log('ContentItem Table Structure:');
    console.log('='.repeat(70));
    const itemColumns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'ContentItem'
      ORDER BY ORDINAL_POSITION
    `);
    itemColumns.recordset.forEach(col => {
      console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    console.log();

    // Check existing content items
    console.log('='.repeat(70));
    console.log('Existing ContentItems:');
    console.log('='.repeat(70));
    const items = await pool.request().query(`
      SELECT COUNT(*) as Total FROM ContentItem
    `);
    console.log(`Total content items: ${items.recordset[0].Total}`);
    console.log();

    // Check Markets
    console.log('='.repeat(70));
    console.log('Available Markets:');
    console.log('='.repeat(70));
    const markets = await pool.request().query(`
      SELECT MarketID, MarketName, MarketCode FROM Market ORDER BY MarketName
    `);
    markets.recordset.forEach(m => {
      console.log(`[${m.MarketID}] ${m.MarketName} (${m.MarketCode})`);
    });
    console.log();

    // Check Languages
    console.log('='.repeat(70));
    console.log('Available Languages:');
    console.log('='.repeat(70));
    const languages = await pool.request().query(`
      SELECT LanguageID, LanguageName, LanguageCode FROM [Language] ORDER BY LanguageName
    `);
    languages.recordset.forEach(l => {
      console.log(`[${l.LanguageID}] ${l.LanguageName} (${l.LanguageCode})`);
    });
    console.log();

    await pool.close();
    console.log('Done!');

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
}

checkStructure().then(() => process.exit(0));
