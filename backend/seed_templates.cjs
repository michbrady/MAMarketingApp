/**
 * Seed Default Share Templates
 *
 * Run with: node seed_templates.cjs
 */

const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_NAME || 'unfranchise_marketing',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT !== 'false',
    enableArithAbort: true,
  },
};

const templates = [
  // ===== SMS TEMPLATES =====
  {
    TemplateName: 'SMS - Product Share',
    TemplateDescription: 'Default SMS template for sharing products',
    ShareChannel: 'SMS',
    ContentType: 'Product',
    MessageTemplate: 'Hi! {senderFirstName} here. Check out this amazing product: {contentTitle}. {trackingLink}',
    IsDefault: true,
    IsSystemTemplate: true,
    MaxCharacters: 160,
  },
  {
    TemplateName: 'SMS - Business Opportunity',
    TemplateDescription: 'Default SMS template for business opportunities',
    ShareChannel: 'SMS',
    ContentType: 'BusinessOpportunity',
    MessageTemplate: '{senderFirstName} thought you\'d be interested in this opportunity: {contentTitle}. Learn more: {trackingLink}',
    IsDefault: true,
    IsSystemTemplate: true,
    MaxCharacters: 160,
  },
  {
    TemplateName: 'SMS - Event Invitation',
    TemplateDescription: 'Default SMS template for event invitations',
    ShareChannel: 'SMS',
    ContentType: 'Event',
    MessageTemplate: 'You\'re invited! {contentTitle}. RSVP: {trackingLink} - {senderFirstName}',
    IsDefault: true,
    IsSystemTemplate: true,
    MaxCharacters: 160,
  },
  {
    TemplateName: 'SMS - General Content',
    TemplateDescription: 'Default SMS template for general content',
    ShareChannel: 'SMS',
    ContentType: 'General',
    MessageTemplate: 'Hey! {senderFirstName} wants to share this with you: {contentTitle}. {trackingLink}',
    IsDefault: true,
    IsSystemTemplate: true,
    MaxCharacters: 160,
  },

  // ===== EMAIL TEMPLATES =====
  {
    TemplateName: 'Email - Product Share',
    TemplateDescription: 'Professional email template for sharing products',
    ShareChannel: 'Email',
    ContentType: 'Product',
    SubjectTemplate: '{senderFirstName} {senderLastName} shared {contentTitle} with you',
    MessageTemplate: 'Hi,\n\nI wanted to share this amazing product with you: {contentTitle}\n\n{contentDescription}\n\nCheck it out here: {trackingLink}\n\nBest regards,\n{senderFirstName} {senderLastName}',
    HTMLTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{contentTitle}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Product Recommendation</h1>
  </div>

  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; color: #555;">Hi there,</p>

    <p style="font-size: 16px; color: #555;">I wanted to share this amazing product with you:</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #667eea; margin-top: 0;">{contentTitle}</h2>
      <p style="color: #666; font-size: 15px;">{contentDescription}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{trackingLink}" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">View Product</a>
    </div>

    <p style="font-size: 14px; color: #777; margin-top: 30px;">
      Best regards,<br>
      <strong>{senderFirstName} {senderLastName}</strong><br>
      {senderEmail}
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #999; text-align: center;">
      This email was sent by {senderFirstName} {senderLastName} via {companyName}
    </p>
  </div>
</body>
</html>`,
    IsDefault: true,
    IsSystemTemplate: true,
  },
  {
    TemplateName: 'Email - Business Opportunity',
    TemplateDescription: 'Professional email template for business opportunities',
    ShareChannel: 'Email',
    ContentType: 'BusinessOpportunity',
    SubjectTemplate: 'Exciting Business Opportunity - {contentTitle}',
    MessageTemplate: 'Hi,\n\nI came across an exciting business opportunity that I think would be perfect for you.\n\n{contentTitle}\n\n{contentDescription}\n\nLearn more: {trackingLink}\n\nLet me know if you\'d like to discuss this further.\n\nBest,\n{senderFirstName} {senderLastName}',
    HTMLTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{contentTitle}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Business Opportunity</h1>
  </div>

  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; color: #555;">Hi there,</p>

    <p style="font-size: 16px; color: #555;">I came across an exciting business opportunity that I think would be perfect for you:</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #11998e; margin-top: 0;">{contentTitle}</h2>
      <p style="color: #666; font-size: 15px;">{contentDescription}</p>

      <div style="margin: 20px 0;">
        <h3 style="color: #11998e; font-size: 16px;">Key Benefits:</h3>
        <ul style="color: #666;">
          <li>Flexible schedule and work-life balance</li>
          <li>Proven business model with support</li>
          <li>Unlimited earning potential</li>
          <li>Comprehensive training provided</li>
        </ul>
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{trackingLink}" style="display: inline-block; background: #11998e; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Learn More</a>
    </div>

    <p style="font-size: 15px; color: #555;">Let me know if you'd like to discuss this further. I'd be happy to answer any questions!</p>

    <p style="font-size: 14px; color: #777; margin-top: 30px;">
      Best regards,<br>
      <strong>{senderFirstName} {senderLastName}</strong><br>
      {senderEmail}
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #999; text-align: center;">
      This email was sent by {senderFirstName} {senderLastName} via {companyName}
    </p>
  </div>
</body>
</html>`,
    IsDefault: true,
    IsSystemTemplate: true,
  },
  {
    TemplateName: 'Email - Event Invitation',
    TemplateDescription: 'Email template for event invitations',
    ShareChannel: 'Email',
    ContentType: 'Event',
    SubjectTemplate: 'You\'re Invited: {contentTitle}',
    MessageTemplate: 'Hi,\n\nYou\'re invited to an exciting event!\n\n{contentTitle}\n\n{contentDescription}\n\nRSVP here: {trackingLink}\n\nHope to see you there!\n\n{senderFirstName} {senderLastName}',
    HTMLTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{contentTitle}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 You're Invited!</h1>
  </div>

  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; color: #555;">Hi there,</p>

    <p style="font-size: 16px; color: #555;">I'm excited to invite you to this special event:</p>

    <div style="background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #f5576c; margin-top: 0;">{contentTitle}</h2>
      <p style="color: #666; font-size: 15px; margin-bottom: 20px;">{contentDescription}</p>

      <div style="background: #fff5f5; padding: 15px; border-radius: 5px; border-left: 4px solid #f5576c;">
        <p style="margin: 5px 0; color: #555;"><strong>📅 Date:</strong> {eventDate}</p>
        <p style="margin: 5px 0; color: #555;"><strong>🕐 Time:</strong> {eventTime}</p>
        <p style="margin: 5px 0; color: #555;"><strong>📍 Location:</strong> {eventLocation}</p>
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{trackingLink}" style="display: inline-block; background: #f5576c; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">RSVP Now</a>
    </div>

    <p style="font-size: 15px; color: #555; text-align: center;">Hope to see you there!</p>

    <p style="font-size: 14px; color: #777; margin-top: 30px;">
      Best regards,<br>
      <strong>{senderFirstName} {senderLastName}</strong><br>
      {senderEmail}
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #999; text-align: center;">
      This invitation was sent by {senderFirstName} {senderLastName} via {companyName}
    </p>
  </div>
</body>
</html>`,
    IsDefault: true,
    IsSystemTemplate: true,
  },

  // ===== SOCIAL TEMPLATES - FACEBOOK =====
  {
    TemplateName: 'Facebook - Product',
    TemplateDescription: 'Facebook post template for products',
    ShareChannel: 'Social',
    SocialPlatform: 'Facebook',
    ContentType: 'Product',
    MessageTemplate: 'Just discovered {contentTitle}! 🎉\n\n{contentDescription}\n\nCheck it out: {trackingLink}\n\n#UnFranchise #MarketAmerica #Product',
    IsDefault: true,
    IsSystemTemplate: true,
    MaxCharacters: 63206,
  },
  {
    TemplateName: 'Facebook - Business Opportunity',
    TemplateDescription: 'Facebook post template for business opportunities',
    ShareChannel: 'Social',
    SocialPlatform: 'Facebook',
    ContentType: 'BusinessOpportunity',
    MessageTemplate: '💼 Exciting opportunity alert!\n\n{contentTitle}\n\n{contentDescription}\n\nLearn more: {trackingLink}\n\n#BusinessOpportunity #UnFranchise #Entrepreneur',
    IsDefault: true,
    IsSystemTemplate: true,
    MaxCharacters: 63206,
  },

  // ===== SOCIAL TEMPLATES - TWITTER/X =====
  {
    TemplateName: 'Twitter - Product',
    TemplateDescription: 'Twitter/X post template for products',
    ShareChannel: 'Social',
    SocialPlatform: 'Twitter',
    ContentType: 'Product',
    MessageTemplate: 'Check out {contentTitle}! 🚀\n\n{trackingLink}\n\n#UnFranchise #Product',
    IsDefault: true,
    IsSystemTemplate: true,
    MaxCharacters: 280,
  },
  {
    TemplateName: 'Twitter - Business Opportunity',
    TemplateDescription: 'Twitter/X post template for business opportunities',
    ShareChannel: 'Social',
    SocialPlatform: 'Twitter',
    ContentType: 'BusinessOpportunity',
    MessageTemplate: '💼 {contentTitle}\n\nInterested in a business opportunity?\n\n{trackingLink}\n\n#BusinessOpportunity #Entrepreneur',
    IsDefault: true,
    IsSystemTemplate: true,
    MaxCharacters: 280,
  },

  // ===== SOCIAL TEMPLATES - LINKEDIN =====
  {
    TemplateName: 'LinkedIn - Product',
    TemplateDescription: 'LinkedIn post template for products',
    ShareChannel: 'Social',
    SocialPlatform: 'LinkedIn',
    ContentType: 'Product',
    MessageTemplate: 'Excited to share: {contentTitle}\n\n{contentDescription}\n\nLearn more: {trackingLink}\n\n#UnFranchise #Innovation #Product',
    IsDefault: true,
    IsSystemTemplate: true,
    MaxCharacters: 3000,
  },
  {
    TemplateName: 'LinkedIn - Business Opportunity',
    TemplateDescription: 'LinkedIn post template for business opportunities',
    ShareChannel: 'Social',
    SocialPlatform: 'LinkedIn',
    ContentType: 'BusinessOpportunity',
    MessageTemplate: '🚀 Professional Growth Opportunity\n\n{contentTitle}\n\n{contentDescription}\n\nInterested? Let\'s connect: {trackingLink}\n\n#BusinessOpportunity #Entrepreneurship #CareerGrowth',
    IsDefault: true,
    IsSystemTemplate: true,
    MaxCharacters: 3000,
  },

  // ===== SOCIAL TEMPLATES - INSTAGRAM =====
  {
    TemplateName: 'Instagram - Product',
    TemplateDescription: 'Instagram caption template for products',
    ShareChannel: 'Social',
    SocialPlatform: 'Instagram',
    ContentType: 'Product',
    MessageTemplate: '✨ {contentTitle} ✨\n\n{contentDescription}\n\n🔗 Link in bio!\n\n#UnFranchise #MarketAmerica #Product #Lifestyle',
    IsDefault: true,
    IsSystemTemplate: true,
    MaxCharacters: 2200,
  },

  // ===== SOCIAL TEMPLATES - WHATSAPP =====
  {
    TemplateName: 'WhatsApp - Product',
    TemplateDescription: 'WhatsApp message template for products',
    ShareChannel: 'Social',
    SocialPlatform: 'WhatsApp',
    ContentType: 'Product',
    MessageTemplate: 'Hi! 👋\n\nI wanted to share this amazing product with you:\n\n*{contentTitle}*\n\n{contentDescription}\n\nCheck it out: {trackingLink}',
    IsDefault: true,
    IsSystemTemplate: true,
    MaxCharacters: 65536,
  },
];

async function seedTemplates() {
  let pool;

  try {
    console.log('🌱 Connecting to database...');
    pool = await sql.connect(config);
    console.log('✅ Database connected');

    console.log(`\n📝 Seeding ${templates.length} templates...\n`);

    for (const template of templates) {
      try {
        const result = await pool.request()
          .input('TemplateName', sql.NVarChar(100), template.TemplateName)
          .input('TemplateDescription', sql.NVarChar(500), template.TemplateDescription)
          .input('ShareChannel', sql.NVarChar(20), template.ShareChannel)
          .input('SocialPlatform', sql.NVarChar(50), template.SocialPlatform || null)
          .input('ContentType', sql.NVarChar(50), template.ContentType || null)
          .input('SubjectTemplate', sql.NVarChar(255), template.SubjectTemplate || null)
          .input('MessageTemplate', sql.NVarChar(sql.MAX), template.MessageTemplate)
          .input('HTMLTemplate', sql.NVarChar(sql.MAX), template.HTMLTemplate || null)
          .input('IsDefault', sql.Bit, template.IsDefault)
          .input('IsSystemTemplate', sql.Bit, template.IsSystemTemplate)
          .input('MaxCharacters', sql.Int, template.MaxCharacters || null)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM dbo.ShareTemplate WHERE TemplateName = @TemplateName)
            BEGIN
              INSERT INTO dbo.ShareTemplate (
                TemplateName, TemplateDescription, ShareChannel, SocialPlatform,
                ContentType, SubjectTemplate, MessageTemplate, HTMLTemplate,
                IsDefault, IsSystemTemplate, MaxCharacters
              )
              VALUES (
                @TemplateName, @TemplateDescription, @ShareChannel, @SocialPlatform,
                @ContentType, @SubjectTemplate, @MessageTemplate, @HTMLTemplate,
                @IsDefault, @IsSystemTemplate, @MaxCharacters
              );
              SELECT 1 as Created;
            END
            ELSE
            BEGIN
              SELECT 0 as Created;
            END
          `);

        if (result.recordset[0].Created) {
          console.log(`✅ Created: ${template.TemplateName}`);
        } else {
          console.log(`⏭️  Skipped (exists): ${template.TemplateName}`);
        }
      } catch (error) {
        console.error(`❌ Error creating ${template.TemplateName}:`, error.message);
      }
    }

    console.log('\n🎉 Template seeding completed!\n');

    // Show summary
    const summary = await pool.request().query(`
      SELECT
        ShareChannel,
        ContentType,
        SocialPlatform,
        COUNT(*) as Count
      FROM dbo.ShareTemplate
      GROUP BY ShareChannel, ContentType, SocialPlatform
      ORDER BY ShareChannel, ContentType
    `);

    console.log('📊 Template Summary:');
    console.table(summary.recordset);

  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n👋 Database connection closed');
    }
  }
}

// Run the seed function
seedTemplates();
