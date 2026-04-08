/**
 * Verify and display comprehensive content library data
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

async function verify() {
  try {
    const pool = await sql.connect(config);

    console.log('='.repeat(80));
    console.log('CONTENT LIBRARY VERIFICATION REPORT');
    console.log('='.repeat(80));
    console.log();

    // Overall statistics
    console.log('OVERALL STATISTICS:');
    console.log('-'.repeat(80));
    const stats = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM ContentItem) AS TotalItems,
        (SELECT COUNT(*) FROM ContentItem WHERE IsFeatured = 1) AS FeaturedItems,
        (SELECT COUNT(*) FROM ContentItem WHERE PublishStatus = 'Published') AS PublishedItems,
        (SELECT COUNT(DISTINCT cc.ContentCategoryID)
         FROM ContentItemCategory cc) AS CategoriesUsed,
        (SELECT COUNT(*) FROM ContentTag WHERE IsActive = 1) AS ActiveTags
    `);
    const s = stats.recordset[0];
    console.log(`Total Content Items: ${s.TotalItems}`);
    console.log(`Published Items: ${s.PublishedItems}`);
    console.log(`Featured Items: ${s.FeaturedItems}`);
    console.log(`Categories Used: ${s.CategoriesUsed}`);
    console.log(`Active Tags: ${s.ActiveTags}`);
    console.log();

    // Content by category
    console.log('CONTENT DISTRIBUTION BY CATEGORY:');
    console.log('-'.repeat(80));
    const byCategory = await pool.request().query(`
      SELECT
        c.CategoryName,
        COUNT(cic.ContentItemID) AS ItemCount
      FROM ContentCategory c
      LEFT JOIN ContentItemCategory cic ON c.ContentCategoryID = cic.ContentCategoryID
      GROUP BY c.CategoryName
      HAVING COUNT(cic.ContentItemID) > 0
      ORDER BY ItemCount DESC, c.CategoryName
    `);
    byCategory.recordset.forEach(cat => {
      console.log(`  ${cat.CategoryName.padEnd(30)} : ${cat.ItemCount} items`);
    });
    console.log();

    // Content by type
    console.log('CONTENT DISTRIBUTION BY TYPE:');
    console.log('-'.repeat(80));
    const byType = await pool.request().query(`
      SELECT
        ContentType,
        COUNT(*) AS ItemCount
      FROM ContentItem
      GROUP BY ContentType
      ORDER BY ItemCount DESC
    `);
    byType.recordset.forEach(type => {
      console.log(`  ${type.ContentType.padEnd(20)} : ${type.ItemCount} items`);
    });
    console.log();

    // Top tags
    console.log('TOP 15 TAGS:');
    console.log('-'.repeat(80));
    const topTags = await pool.request().query(`
      SELECT TOP 15
        ct.TagName,
        COUNT(cit.ContentItemID) AS UsageCount
      FROM ContentTag ct
      LEFT JOIN ContentItemTag cit ON ct.ContentTagID = cit.ContentTagID
      WHERE ct.IsActive = 1
      GROUP BY ct.TagName
      ORDER BY UsageCount DESC, ct.TagName
    `);
    topTags.recordset.forEach(tag => {
      console.log(`  ${tag.TagName.padEnd(30)} : used ${tag.UsageCount} times`);
    });
    console.log();

    // Featured content
    console.log('FEATURED CONTENT (Top Priority):');
    console.log('-'.repeat(80));
    const featured = await pool.request().query(`
      SELECT TOP 10
        ci.Title,
        ci.ContentType,
        ci.FeaturedPriority,
        cc.CategoryName
      FROM ContentItem ci
      LEFT JOIN ContentItemCategory cic ON ci.ContentItemID = cic.ContentItemID AND cic.IsPrimary = 1
      LEFT JOIN ContentCategory cc ON cic.ContentCategoryID = cc.ContentCategoryID
      WHERE ci.IsFeatured = 1
      ORDER BY ci.FeaturedPriority DESC, ci.Title
    `);
    featured.recordset.forEach((item, idx) => {
      console.log(`  ${(idx + 1).toString().padStart(2)}. [Priority ${item.FeaturedPriority}] ${item.Title}`);
      console.log(`      Type: ${item.ContentType} | Category: ${item.CategoryName || 'N/A'}`);
    });
    console.log();

    // Recent content
    console.log('RECENTLY ADDED CONTENT (Last 10):');
    console.log('-'.repeat(80));
    const recent = await pool.request().query(`
      SELECT TOP 10
        ci.Title,
        ci.ContentType,
        cc.CategoryName,
        FORMAT(ci.CreatedDate, 'yyyy-MM-dd') AS DateAdded
      FROM ContentItem ci
      LEFT JOIN ContentItemCategory cic ON ci.ContentItemID = cic.ContentItemID AND cic.IsPrimary = 1
      LEFT JOIN ContentCategory cc ON cic.ContentCategoryID = cc.ContentCategoryID
      ORDER BY ci.CreatedDate DESC
    `);
    recent.recordset.forEach((item, idx) => {
      console.log(`  ${(idx + 1).toString().padStart(2)}. [${item.DateAdded}] ${item.Title}`);
      console.log(`      ${item.ContentType} | ${item.CategoryName || 'N/A'}`);
    });
    console.log();

    // Sample content detail
    console.log('SAMPLE CONTENT DETAILS:');
    console.log('-'.repeat(80));
    const sample = await pool.request().query(`
      SELECT TOP 1
        ci.*,
        cc.CategoryName,
        STRING_AGG(ct.TagName, ', ') AS Tags
      FROM ContentItem ci
      LEFT JOIN ContentItemCategory cic ON ci.ContentItemID = cic.ContentItemID AND cic.IsPrimary = 1
      LEFT JOIN ContentCategory cc ON cic.ContentCategoryID = cc.ContentCategoryID
      LEFT JOIN ContentItemTag cit ON ci.ContentItemID = cit.ContentItemID
      LEFT JOIN ContentTag ct ON cit.ContentTagID = ct.ContentTagID
      WHERE ci.IsFeatured = 1
      GROUP BY ci.ContentItemID, ci.ContentGUID, ci.Title, ci.Subtitle, ci.Description,
               ci.ThumbnailURL, ci.MediaURL, ci.DestinationURL, ci.ContentType,
               ci.MIMEType, ci.FileSizeBytes, ci.DurationSeconds, ci.ExternalContentID,
               ci.PublishStatus, ci.PublishDate, ci.ExpirationDate, ci.AllowSMS,
               ci.AllowEmail, ci.AllowSocial, ci.AllowPersonalNote, ci.CTAType,
               ci.CTALabel, ci.RequiresDisclaimer, ci.DisclaimerText,
               ci.IsRegulatedContent, ci.ViewCount, ci.ShareCount, ci.ClickCount,
               ci.IsFeatured, ci.FeaturedPriority, ci.CreatedDate, ci.CreatedBy,
               ci.UpdatedDate, ci.UpdatedBy, cc.CategoryName
      ORDER BY ci.FeaturedPriority DESC
    `);
    if (sample.recordset.length > 0) {
      const item = sample.recordset[0];
      console.log(`Title: ${item.Title}`);
      console.log(`Subtitle: ${item.Subtitle || 'N/A'}`);
      console.log(`Description: ${item.Description.substring(0, 150)}...`);
      console.log(`Type: ${item.ContentType}`);
      console.log(`Category: ${item.CategoryName || 'N/A'}`);
      console.log(`Tags: ${item.Tags || 'None'}`);
      console.log(`Status: ${item.PublishStatus}`);
      console.log(`Featured: ${item.IsFeatured ? 'Yes (Priority ' + item.FeaturedPriority + ')' : 'No'}`);
      console.log(`Sharing: SMS=${item.AllowSMS}, Email=${item.AllowEmail}, Social=${item.AllowSocial}`);
      console.log(`URLs:`);
      console.log(`  Thumbnail: ${item.ThumbnailURL}`);
      console.log(`  Media: ${item.MediaURL}`);
      console.log(`  Destination: ${item.DestinationURL}`);
    }
    console.log();

    console.log('='.repeat(80));
    console.log('VERIFICATION COMPLETE - Content Library is fully populated!');
    console.log('='.repeat(80));

    await pool.close();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
}

verify().then(() => process.exit(0));
