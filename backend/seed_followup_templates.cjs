/**
 * Seed Follow-up Templates
 * Creates default follow-up templates for the UnFranchise Marketing App
 */
const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_HOST || 'dbms-dwhs.corp.shop.com\DWP01',
  database: process.env.DB_NAME || 'UnFranchiseMarketing',
  user: process.env.DB_USER || 'unfranchise_app',
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
    instanceName: 'DWP01'
  }
};

const templates = [
  { templateName: 'Product Interest Follow-up', description: 'Follow up with prospect who showed interest in a product', defaultDays: 3, defaultPriority: 'High', defaultType: 'Call', suggestedAction: 'Call to answer questions about the product and discuss their needs.', category: 'Product' },
  { templateName: 'Business Opportunity Check-in', description: 'Check in with potential business builder', defaultDays: 5, defaultPriority: 'High', defaultType: 'Call', suggestedAction: 'Call to discuss the business opportunity in detail.', category: 'Business' },
  { templateName: 'Event Follow-up', description: 'Follow up after sharing event information', defaultDays: 1, defaultPriority: 'Medium', defaultType: 'Call', suggestedAction: 'Call to confirm attendance and answer questions about the event.', category: 'Event' },
  { templateName: 'No Response Follow-up', description: 'Gentle follow-up when prospect has not responded', defaultDays: 7, defaultPriority: 'Low', defaultType: 'Email', suggestedAction: 'Send a friendly email checking in.', category: 'NoResponse' },
  { templateName: 'Thank You Follow-up', description: 'Thank prospect for their time and interest', defaultDays: 1, defaultPriority: 'Medium', defaultType: 'Email', suggestedAction: 'Send a thank-you note expressing appreciation.', category: 'ThankYou' },
  { templateName: 'Content Engagement Follow-up', description: 'Follow up when prospect clicks/views shared content', defaultDays: 2, defaultPriority: 'High', defaultType: 'Call', suggestedAction: 'Call while the content is fresh in their mind.', category: 'Product' },
  { templateName: 'Second Touch', description: 'Second follow-up attempt for warm prospect', defaultDays: 14, defaultPriority: 'Medium', defaultType: 'Call', suggestedAction: 'Make a second attempt to connect.', category: 'NoResponse' },
  { templateName: 'Nurture Check-in', description: 'Regular check-in with ongoing prospect', defaultDays: 30, defaultPriority: 'Low', defaultType: 'Email', suggestedAction: 'Send a nurture email with valuable content.', category: 'Product' },
  { templateName: 'Video Follow-up', description: 'Follow up after sharing video content', defaultDays: 3, defaultPriority: 'Medium', defaultType: 'Call', suggestedAction: 'Call to discuss the video.', category: 'Product' },
  { templateName: 'Meeting Scheduled', description: 'Reminder before scheduled meeting', defaultDays: 1, defaultPriority: 'High', defaultType: 'Email', suggestedAction: 'Send meeting reminder with agenda.', category: 'Event' },
  { templateName: 'Post-Meeting Follow-up', description: 'Follow up after a meeting or presentation', defaultDays: 1, defaultPriority: 'High', defaultType: 'Email', suggestedAction: 'Send recap of meeting with next steps.', category: 'ThankYou' },
  { templateName: 'Decision Time', description: 'Check in when prospect is considering their decision', defaultDays: 7, defaultPriority: 'High', defaultType: 'Call', suggestedAction: 'Call to help with any final questions.', category: 'Business' },
  { templateName: 'Testimonial Share Follow-up', description: 'Follow up after sharing customer testimonials', defaultDays: 3, defaultPriority: 'Medium', defaultType: 'Call', suggestedAction: 'Call to discuss the testimonials.', category: 'Product' },
  { templateName: 'Re-engagement', description: 'Re-engage contact who has gone cold', defaultDays: 60, defaultPriority: 'Low', defaultType: 'Email', suggestedAction: 'Send re-engagement email with fresh information.', category: 'NoResponse' },
  { templateName: 'Seasonal Check-in', description: 'Seasonal or holiday follow-up', defaultDays: 90, defaultPriority: 'Low', defaultType: 'Email', suggestedAction: 'Send seasonal greeting.', category: 'Product' }
];

async function seedTemplates() {
  let pool;
  try {
    console.log('\n📦 Seeding Follow-up Templates...\n');
    pool = await sql.connect(config);
    console.log('Connected to database\n');

    const existingCount = await pool.request().query('SELECT COUNT(*) as count FROM dbo.FollowUpTemplate');
    if (existingCount.recordset[0].count > 0) {
      console.log(`Found ${existingCount.recordset[0].count} existing templates, clearing...`);
      await pool.request().query('DELETE FROM dbo.FollowUpTemplate');
    }

    let successCount = 0;
    for (const template of templates) {
      try {
        await pool.request()
          .input('templateName', sql.NVarChar, template.templateName)
          .input('description', sql.NVarChar, template.description)
          .input('defaultDays', sql.Int, template.defaultDays)
          .input('defaultPriority', sql.NVarChar, template.defaultPriority)
          .input('defaultType', sql.NVarChar, template.defaultType)
          .input('suggestedAction', sql.NVarChar, template.suggestedAction)
          .input('category', sql.NVarChar, template.category)
          .query(`
            INSERT INTO dbo.FollowUpTemplate (TemplateName, Description, DefaultDays, DefaultPriority, DefaultType, SuggestedAction, Category, IsActive, CreatedDate, UpdatedDate)
            VALUES (@templateName, @description, @defaultDays, @defaultPriority, @defaultType, @suggestedAction, @category, 1, SYSDATETIME(), SYSDATETIME())
          `);
        console.log(`✓ Created: ${template.templateName}`);
        successCount++;
      } catch (error) {
        console.error(`✗ Failed: ${template.templateName}:`, error.message);
      }
    }

    console.log(`\n✓ Seeding completed: ${successCount} templates created\n`);
    const summary = await pool.request().query('SELECT Category, COUNT(*) as Count FROM dbo.FollowUpTemplate WHERE IsActive = 1 GROUP BY Category ORDER BY Category');
    console.log('Templates by Category:');
    summary.recordset.forEach(row => console.log(`  ${row.Category}: ${row.Count}`));
  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    if (pool) await pool.close();
  }
}

seedTemplates().then(() => { console.log('\n✅ Done!\n'); process.exit(0); }).catch(() => process.exit(1));
