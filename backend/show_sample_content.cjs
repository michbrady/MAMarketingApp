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

async function showSamples() {
  const pool = await sql.connect(config);

  console.log('\nSample of Newly Added Content:\n');
  console.log('='.repeat(80));

  const result = await pool.request().query(`
    SELECT TOP 10
      ci.Title,
      ci.Subtitle,
      ci.ContentType,
      cc.CategoryName,
      FORMAT(ci.CreatedDate, 'yyyy-MM-dd') AS Created,
      ci.IsFeatured
    FROM ContentItem ci
    LEFT JOIN ContentItemCategory cic ON ci.ContentItemID = cic.ContentItemID
    LEFT JOIN ContentCategory cc ON cic.ContentCategoryID = cc.ContentCategoryID
    WHERE ci.Title LIKE '%UnFranchise%'
       OR ci.Title LIKE '%TLS%'
       OR ci.Title LIKE '%Isotonix%'
       OR ci.Title LIKE '%Training%'
       OR ci.Title LIKE '%Convention%'
    ORDER BY ci.CreatedDate DESC
  `);

  result.recordset.forEach((r, i) => {
    console.log(`${i + 1}. ${r.Title}`);
    console.log(`   ${r.Subtitle || 'No subtitle'}`);
    console.log(`   Type: ${r.ContentType} | Category: ${r.CategoryName || 'N/A'} | Created: ${r.Created}`);
    console.log(`   Featured: ${r.IsFeatured ? 'YES' : 'No'}`);
    console.log();
  });

  await pool.close();
}

showSamples();
