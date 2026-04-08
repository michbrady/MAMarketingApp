/**
 * Seed System Settings and Feature Flags
 * Run this after deploying the settings schema
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
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
  }
};

const defaultSettings = [
  // Application Settings
  {
    key: 'app_name',
    value: 'UnFranchise Marketing App',
    category: 'application',
    dataType: 'string',
    description: 'Application name displayed in UI',
    isEncrypted: false
  },
  {
    key: 'app_logo_url',
    value: '/images/logo.png',
    category: 'application',
    dataType: 'string',
    description: 'URL to application logo',
    isEncrypted: false
  },
  {
    key: 'app_theme_primary_color',
    value: '#2563eb',
    category: 'application',
    dataType: 'string',
    description: 'Primary theme color (hex)',
    isEncrypted: false
  },
  {
    key: 'app_theme_secondary_color',
    value: '#7c3aed',
    category: 'application',
    dataType: 'string',
    description: 'Secondary theme color (hex)',
    isEncrypted: false
  },
  {
    key: 'app_support_email',
    value: 'support@unfranchise.com',
    category: 'application',
    dataType: 'string',
    description: 'Support email address',
    isEncrypted: false
  },

  // Email Settings
  {
    key: 'email_enabled',
    value: 'true',
    category: 'email',
    dataType: 'boolean',
    description: 'Enable email functionality',
    isEncrypted: false
  },
  {
    key: 'email_smtp_host',
    value: 'smtp.sendgrid.net',
    category: 'email',
    dataType: 'string',
    description: 'SMTP server host',
    isEncrypted: false
  },
  {
    key: 'email_smtp_port',
    value: '587',
    category: 'email',
    dataType: 'number',
    description: 'SMTP server port',
    isEncrypted: false
  },
  {
    key: 'email_smtp_user',
    value: 'apikey',
    category: 'email',
    dataType: 'string',
    description: 'SMTP username',
    isEncrypted: false
  },
  {
    key: 'email_smtp_password',
    value: '',
    category: 'email',
    dataType: 'string',
    description: 'SMTP password (encrypted)',
    isEncrypted: true
  },
  {
    key: 'email_from_address',
    value: 'noreply@unfranchise.com',
    category: 'email',
    dataType: 'string',
    description: 'Default from email address',
    isEncrypted: false
  },
  {
    key: 'email_from_name',
    value: 'UnFranchise Marketing',
    category: 'email',
    dataType: 'string',
    description: 'Default from name',
    isEncrypted: false
  },

  // SMS Settings
  {
    key: 'sms_enabled',
    value: 'true',
    category: 'sms',
    dataType: 'boolean',
    description: 'Enable SMS functionality',
    isEncrypted: false
  },
  {
    key: 'sms_twilio_account_sid',
    value: '',
    category: 'sms',
    dataType: 'string',
    description: 'Twilio Account SID (encrypted)',
    isEncrypted: true
  },
  {
    key: 'sms_twilio_auth_token',
    value: '',
    category: 'sms',
    dataType: 'string',
    description: 'Twilio Auth Token (encrypted)',
    isEncrypted: true
  },
  {
    key: 'sms_twilio_phone_number',
    value: '',
    category: 'sms',
    dataType: 'string',
    description: 'Twilio phone number',
    isEncrypted: false
  },

  // Notification Settings
  {
    key: 'notifications_email_enabled',
    value: 'true',
    category: 'notifications',
    dataType: 'boolean',
    description: 'Enable email notifications',
    isEncrypted: false
  },
  {
    key: 'notifications_sms_enabled',
    value: 'true',
    category: 'notifications',
    dataType: 'boolean',
    description: 'Enable SMS notifications',
    isEncrypted: false
  },
  {
    key: 'notifications_push_enabled',
    value: 'true',
    category: 'notifications',
    dataType: 'boolean',
    description: 'Enable push notifications',
    isEncrypted: false
  },
  {
    key: 'notifications_digest_enabled',
    value: 'true',
    category: 'notifications',
    dataType: 'boolean',
    description: 'Enable daily digest emails',
    isEncrypted: false
  },

  // Security Settings
  {
    key: 'security_session_timeout',
    value: '3600',
    category: 'security',
    dataType: 'number',
    description: 'Session timeout in seconds',
    isEncrypted: false
  },
  {
    key: 'security_max_login_attempts',
    value: '5',
    category: 'security',
    dataType: 'number',
    description: 'Maximum login attempts before lockout',
    isEncrypted: false
  },
  {
    key: 'security_lockout_duration',
    value: '900',
    category: 'security',
    dataType: 'number',
    description: 'Account lockout duration in seconds',
    isEncrypted: false
  },

  // Content Settings
  {
    key: 'content_approval_required',
    value: 'false',
    category: 'content',
    dataType: 'boolean',
    description: 'Require approval for new content',
    isEncrypted: false
  },
  {
    key: 'content_max_upload_size',
    value: '10485760',
    category: 'content',
    dataType: 'number',
    description: 'Maximum file upload size in bytes (10MB)',
    isEncrypted: false
  },
  {
    key: 'content_allowed_file_types',
    value: '["image/jpeg","image/png","image/gif","application/pdf","video/mp4"]',
    category: 'content',
    dataType: 'json',
    description: 'Allowed file MIME types',
    isEncrypted: false
  }
];

const defaultFeatureFlags = [
  {
    name: 'contacts_enabled',
    isEnabled: true,
    description: 'Enable contact management features'
  },
  {
    name: 'followups_enabled',
    isEnabled: true,
    description: 'Enable follow-up system'
  },
  {
    name: 'analytics_enabled',
    isEnabled: true,
    description: 'Enable analytics dashboard'
  },
  {
    name: 'csv_import_enabled',
    isEnabled: true,
    description: 'Enable CSV import functionality'
  },
  {
    name: 'bulk_actions_enabled',
    isEnabled: true,
    description: 'Enable bulk operations'
  },
  {
    name: 'templates_enabled',
    isEnabled: true,
    description: 'Enable template management'
  },
  {
    name: 'notifications_enabled',
    isEnabled: true,
    description: 'Enable notification system'
  },
  {
    name: 'social_sharing_enabled',
    isEnabled: true,
    description: 'Enable social media sharing'
  },
  {
    name: 'email_sharing_enabled',
    isEnabled: true,
    description: 'Enable email sharing'
  },
  {
    name: 'sms_sharing_enabled',
    isEnabled: true,
    description: 'Enable SMS sharing'
  },
  {
    name: 'advanced_analytics_enabled',
    isEnabled: false,
    description: 'Enable advanced analytics (Phase 2)'
  },
  {
    name: 'ai_recommendations_enabled',
    isEnabled: false,
    description: 'Enable AI recommendations (Phase 5)'
  }
];

async function seedSystemSettings() {
  let pool;

  try {
    console.log('Connecting to database...');
    pool = await sql.connect(config);

    console.log('Seeding system settings...');

    // Insert settings
    for (const setting of defaultSettings) {
      const existingQuery = `
        SELECT COUNT(*) as count
        FROM SystemSettings
        WHERE SettingKey = @key
      `;

      const existing = await pool.request()
        .input('key', sql.NVarChar(100), setting.key)
        .query(existingQuery);

      if (existing.recordset[0].count === 0) {
        const insertQuery = `
          INSERT INTO SystemSettings (SettingKey, SettingValue, Category, DataType, Description, IsEncrypted)
          VALUES (@key, @value, @category, @dataType, @description, @isEncrypted)
        `;

        await pool.request()
          .input('key', sql.NVarChar(100), setting.key)
          .input('value', sql.NVarChar(sql.MAX), setting.value)
          .input('category', sql.NVarChar(50), setting.category)
          .input('dataType', sql.NVarChar(20), setting.dataType)
          .input('description', sql.NVarChar(500), setting.description)
          .input('isEncrypted', sql.Bit, setting.isEncrypted)
          .query(insertQuery);

        console.log(`✓ Setting created: ${setting.key}`);
      } else {
        console.log(`- Setting exists: ${setting.key}`);
      }
    }

    console.log('\nSeeding feature flags...');

    // Insert feature flags
    for (const flag of defaultFeatureFlags) {
      const existingQuery = `
        SELECT COUNT(*) as count
        FROM FeatureFlag
        WHERE FeatureName = @name
      `;

      const existing = await pool.request()
        .input('name', sql.NVarChar(100), flag.name)
        .query(existingQuery);

      if (existing.recordset[0].count === 0) {
        const insertQuery = `
          INSERT INTO FeatureFlag (FeatureName, IsEnabled, Description)
          VALUES (@name, @isEnabled, @description)
        `;

        await pool.request()
          .input('name', sql.NVarChar(100), flag.name)
          .input('isEnabled', sql.Bit, flag.isEnabled)
          .input('description', sql.NVarChar(500), flag.description)
          .query(insertQuery);

        console.log(`✓ Feature flag created: ${flag.name}`);
      } else {
        console.log(`- Feature flag exists: ${flag.name}`);
      }
    }

    console.log('\n✅ System settings seeding completed successfully!');

    // Display summary
    const settingsCount = await pool.request().query('SELECT COUNT(*) as count FROM SystemSettings');
    const flagsCount = await pool.request().query('SELECT COUNT(*) as count FROM FeatureFlag');

    console.log('\nSummary:');
    console.log(`- Total settings: ${settingsCount.recordset[0].count}`);
    console.log(`- Total feature flags: ${flagsCount.recordset[0].count}`);

  } catch (error) {
    console.error('❌ Error seeding system settings:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Run the seed
seedSystemSettings()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed system settings:', error);
    process.exit(1);
  });
