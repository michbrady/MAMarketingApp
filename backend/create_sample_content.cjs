/**
 * Create Sample Content for UnFranchise Marketing App
 *
 * This script populates the database with realistic sample content items
 * across various categories, markets, and languages.
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

async function createSampleContent() {
  console.log('='.repeat(70));
  console.log('Creating Sample Content for UnFranchise Marketing App');
  console.log('='.repeat(70));
  console.log();

  let pool;

  try {
    console.log('Connecting to database...');
    pool = await sql.connect(config);
    console.log('Connected successfully!');
    console.log();

    // Get reference data IDs
    console.log('Getting reference data...');

    // Get markets
    const markets = await pool.request().query('SELECT MarketID, MarketCode FROM Market');
    const usMarket = markets.recordset.find(m => m.MarketCode === 'US');
    const caMarket = markets.recordset.find(m => m.MarketCode === 'CA');
    const twMarket = markets.recordset.find(m => m.MarketCode === 'TW');

    // Get languages
    const languages = await pool.request().query('SELECT LanguageID, LanguageCode FROM Language');
    const enUS = languages.recordset.find(l => l.LanguageCode === 'en-US');
    const zhTW = languages.recordset.find(l => l.LanguageCode === 'zh-TW');

    // Get categories
    const categories = await pool.request().query('SELECT ContentCategoryID, CategoryName FROM ContentCategory');
    const productCat = categories.recordset.find(c => c.CategoryName === 'Products');
    const businessCat = categories.recordset.find(c => c.CategoryName === 'Business Opportunity');
    const eventsCat = categories.recordset.find(c => c.CategoryName === 'Events');
    const trainingCat = categories.recordset.find(c => c.CategoryName === 'Training');
    const successCat = categories.recordset.find(c => c.CategoryName === 'Success Stories');

    // Get admin user
    const users = await pool.request().query(`
      SELECT TOP 1 UserID
      FROM [User]
      WHERE RoleID IN (SELECT RoleID FROM Role WHERE RoleName IN ('CorporateAdmin', 'SuperAdmin'))
    `);
    const adminUserId = users.recordset[0]?.UserID || 1;

    console.log(`Markets: ${markets.recordset.length}`);
    console.log(`Languages: ${languages.recordset.length}`);
    console.log(`Categories: ${categories.recordset.length}`);
    console.log(`Admin User ID: ${adminUserId}`);
    console.log();

    // Sample content items
    const contentItems = [
      {
        title: 'Isotonix OPC-3 - The Power of Antioxidants',
        subtitle: 'Premium antioxidant supplement for optimal health',
        description: 'Isotonix OPC-3 is an isotonic-capable food supplement that is made from a combination of bilberry, grape seed, red wine, pine bark extracts and citrus extract bioflavonoids, all found to be powerful antioxidants.',
        thumbnailURL: 'https://cdn.shop.com/content/images/isotonix-opc3-thumbnail.jpg',
        mediaURL: 'https://cdn.shop.com/content/videos/isotonix-opc3-intro.mp4',
        destinationURL: 'https://www.shop.com/isotonix-opc3',
        contentType: 'Video',
        mimeType: 'video/mp4',
        durationSeconds: 180,
        publishStatus: 'Published',
        publishDate: new Date('2026-03-01'),
        allowSMS: true,
        allowEmail: true,
        allowSocial: true,
        ctaType: 'BuyNow',
        ctaLabel: 'Shop Now',
        isFeatured: true,
        featuredPriority: 10,
        categoryId: productCat?.ContentCategoryID,
        marketIds: [usMarket?.MarketID, caMarket?.MarketID].filter(Boolean),
        languageIds: [enUS?.LanguageID].filter(Boolean)
      },
      {
        title: 'Motives Cosmetics - Beauty Without Compromise',
        subtitle: 'Professional-quality makeup for everyone',
        description: 'Motives by Loren Ridinger offers professional-quality cosmetics and beauty products that empower you to look and feel your best. Cruelty-free and affordable.',
        thumbnailURL: 'https://cdn.shop.com/content/images/motives-collection.jpg',
        mediaURL: 'https://cdn.shop.com/content/images/motives-hero.jpg',
        destinationURL: 'https://www.shop.com/motives',
        contentType: 'Image',
        mimeType: 'image/jpeg',
        publishStatus: 'Published',
        publishDate: new Date('2026-03-05'),
        allowSMS: true,
        allowEmail: true,
        allowSocial: true,
        ctaType: 'LearnMore',
        ctaLabel: 'Discover Motives',
        isFeatured: true,
        featuredPriority: 9,
        categoryId: productCat?.ContentCategoryID,
        marketIds: [usMarket?.MarketID, caMarket?.MarketID].filter(Boolean),
        languageIds: [enUS?.LanguageID].filter(Boolean)
      },
      {
        title: 'Build Your UnFranchise Business',
        subtitle: 'Start your journey to financial freedom',
        description: 'The UnFranchise Business offers a proven system for building your own business without the traditional franchise costs. Learn how to leverage the power of e-commerce and create lasting wealth.',
        thumbnailURL: 'https://cdn.shop.com/content/images/unfranchise-opportunity.jpg',
        mediaURL: 'https://cdn.shop.com/content/videos/unfranchise-overview.mp4',
        destinationURL: 'https://www.shop.com/opportunity',
        contentType: 'Video',
        mimeType: 'video/mp4',
        durationSeconds: 300,
        publishStatus: 'Published',
        publishDate: new Date('2026-02-15'),
        allowSMS: true,
        allowEmail: true,
        allowSocial: true,
        ctaType: 'JoinNow',
        ctaLabel: 'Get Started',
        requiresDisclaimer: true,
        disclaimerText: 'Results may vary. Success depends on individual effort and market conditions.',
        isFeatured: true,
        featuredPriority: 8,
        categoryId: businessCat?.ContentCategoryID,
        marketIds: [usMarket?.MarketID, caMarket?.MarketID, twMarket?.MarketID].filter(Boolean),
        languageIds: [enUS?.LanguageID].filter(Boolean)
      },
      {
        title: 'International Convention 2026',
        subtitle: 'Join us in Miami for the event of the year',
        description: 'Experience the power of connection at our annual International Convention. Network with top earners, attend world-class training sessions, and celebrate success together.',
        thumbnailURL: 'https://cdn.shop.com/content/images/convention-2026.jpg',
        mediaURL: 'https://cdn.shop.com/content/images/convention-venue.jpg',
        destinationURL: 'https://www.shop.com/convention2026',
        contentType: 'LandingPage',
        publishStatus: 'Published',
        publishDate: new Date('2026-02-01'),
        expirationDate: new Date('2026-08-15'),
        allowSMS: true,
        allowEmail: true,
        allowSocial: true,
        ctaType: 'Register',
        ctaLabel: 'Register Now',
        isFeatured: true,
        featuredPriority: 7,
        categoryId: eventsCat?.ContentCategoryID,
        marketIds: [usMarket?.MarketID, caMarket?.MarketID, twMarket?.MarketID].filter(Boolean),
        languageIds: [enUS?.LanguageID].filter(Boolean)
      },
      {
        title: 'Social Media Marketing Mastery',
        subtitle: 'Learn to grow your business on social platforms',
        description: 'Master the art of social media marketing with our comprehensive training program. Learn proven strategies for Facebook, Instagram, TikTok, and more.',
        thumbnailURL: 'https://cdn.shop.com/content/images/social-media-training.jpg',
        mediaURL: 'https://cdn.shop.com/content/videos/social-media-course.mp4',
        destinationURL: 'https://training.shop.com/social-media',
        contentType: 'Video',
        mimeType: 'video/mp4',
        durationSeconds: 420,
        publishStatus: 'Published',
        publishDate: new Date('2026-03-10'),
        allowSMS: true,
        allowEmail: true,
        allowSocial: true,
        ctaType: 'LearnMore',
        ctaLabel: 'Start Learning',
        isFeatured: false,
        categoryId: trainingCat?.ContentCategoryID,
        marketIds: [usMarket?.MarketID, caMarket?.MarketID].filter(Boolean),
        languageIds: [enUS?.LanguageID].filter(Boolean)
      },
      {
        title: 'From Teacher to Top Earner',
        subtitle: 'Sarah\'s inspiring journey to success',
        description: 'Former teacher Sarah Johnson shares how she built a thriving UnFranchise Business while maintaining work-life balance. Her story proves that anyone can succeed with the right mindset and support.',
        thumbnailURL: 'https://cdn.shop.com/content/images/success-sarah.jpg',
        mediaURL: 'https://cdn.shop.com/content/videos/success-sarah-story.mp4',
        destinationURL: 'https://www.shop.com/success-stories/sarah-johnson',
        contentType: 'Video',
        mimeType: 'video/mp4',
        durationSeconds: 240,
        publishStatus: 'Published',
        publishDate: new Date('2026-03-12'),
        allowSMS: true,
        allowEmail: true,
        allowSocial: true,
        ctaType: 'LearnMore',
        ctaLabel: 'Read Her Story',
        isFeatured: true,
        featuredPriority: 6,
        categoryId: successCat?.ContentCategoryID,
        marketIds: [usMarket?.MarketID].filter(Boolean),
        languageIds: [enUS?.LanguageID].filter(Boolean)
      },
      {
        title: 'TLS Weight Loss Solution',
        subtitle: 'Lose weight, gain confidence',
        description: 'The TLS Weight Loss Solution is a comprehensive program that combines premium nutrition products with personalized coaching to help you achieve your weight loss goals.',
        thumbnailURL: 'https://cdn.shop.com/content/images/tls-program.jpg',
        mediaURL: 'https://cdn.shop.com/content/videos/tls-transformation.mp4',
        destinationURL: 'https://www.shop.com/tls',
        contentType: 'Video',
        mimeType: 'video/mp4',
        durationSeconds: 150,
        publishStatus: 'Published',
        publishDate: new Date('2026-03-08'),
        allowSMS: true,
        allowEmail: true,
        allowSocial: true,
        ctaType: 'BuyNow',
        ctaLabel: 'Start Your Journey',
        requiresDisclaimer: true,
        disclaimerText: 'Individual results may vary. Consult with your healthcare provider before starting any weight loss program.',
        isFeatured: false,
        categoryId: productCat?.ContentCategoryID,
        marketIds: [usMarket?.MarketID, caMarket?.MarketID].filter(Boolean),
        languageIds: [enUS?.LanguageID].filter(Boolean)
      },
      {
        title: 'DNA Nutritional Testing',
        subtitle: 'Personalized nutrition based on your DNA',
        description: 'Discover the power of personalized nutrition with NutriGen DNA testing. Get customized supplement recommendations based on your unique genetic profile.',
        thumbnailURL: 'https://cdn.shop.com/content/images/nutrigen-dna.jpg',
        mediaURL: 'https://cdn.shop.com/content/images/dna-testing.jpg',
        destinationURL: 'https://www.shop.com/nutrigen',
        contentType: 'Image',
        mimeType: 'image/jpeg',
        publishStatus: 'Published',
        publishDate: new Date('2026-03-15'),
        allowSMS: true,
        allowEmail: true,
        allowSocial: true,
        ctaType: 'LearnMore',
        ctaLabel: 'Learn More',
        isFeatured: false,
        categoryId: productCat?.ContentCategoryID,
        marketIds: [usMarket?.MarketID].filter(Boolean),
        languageIds: [enUS?.LanguageID].filter(Boolean)
      },
      {
        title: 'Building Teams That Win',
        subtitle: 'Leadership training for UFOs',
        description: 'Learn the secrets of building and leading high-performing teams. This training covers recruitment, retention, motivation, and creating a culture of success.',
        thumbnailURL: 'https://cdn.shop.com/content/images/leadership-training.jpg',
        mediaURL: 'https://cdn.shop.com/content/pdfs/leadership-guide.pdf',
        destinationURL: 'https://training.shop.com/leadership',
        contentType: 'PDF',
        mimeType: 'application/pdf',
        publishStatus: 'Published',
        publishDate: new Date('2026-03-18'),
        allowSMS: true,
        allowEmail: true,
        allowSocial: false,
        ctaType: 'LearnMore',
        ctaLabel: 'Download Guide',
        isFeatured: false,
        categoryId: trainingCat?.ContentCategoryID,
        marketIds: [usMarket?.MarketID, caMarket?.MarketID, twMarket?.MarketID].filter(Boolean),
        languageIds: [enUS?.LanguageID].filter(Boolean)
      },
      {
        title: 'Spring Product Launch Webinar',
        subtitle: 'Discover our newest innovations',
        description: 'Join us for an exclusive webinar showcasing our latest product innovations for Spring 2026. Learn about new formulations, exclusive bundles, and special launch promotions.',
        thumbnailURL: 'https://cdn.shop.com/content/images/spring-launch.jpg',
        mediaURL: 'https://cdn.shop.com/content/videos/spring-webinar.mp4',
        destinationURL: 'https://webinar.shop.com/spring-2026',
        contentType: 'Video',
        mimeType: 'video/mp4',
        durationSeconds: 600,
        publishStatus: 'Published',
        publishDate: new Date('2026-03-20'),
        expirationDate: new Date('2026-04-30'),
        allowSMS: true,
        allowEmail: true,
        allowSocial: true,
        ctaType: 'Register',
        ctaLabel: 'Register for Webinar',
        isFeatured: true,
        featuredPriority: 5,
        categoryId: eventsCat?.ContentCategoryID,
        marketIds: [usMarket?.MarketID, caMarket?.MarketID].filter(Boolean),
        languageIds: [enUS?.LanguageID].filter(Boolean)
      },
      {
        title: 'Ultimate Aloe Vera Gel',
        subtitle: 'Pure aloe for digestive health',
        description: 'Our premium Ultimate Aloe Vera Gel supports digestive health and promotes nutrient absorption. Made from pure inner leaf aloe vera with no added preservatives.',
        thumbnailURL: 'https://cdn.shop.com/content/images/ultimate-aloe.jpg',
        mediaURL: 'https://cdn.shop.com/content/images/aloe-product.jpg',
        destinationURL: 'https://www.shop.com/ultimate-aloe',
        contentType: 'Image',
        mimeType: 'image/jpeg',
        publishStatus: 'Published',
        publishDate: new Date('2026-03-22'),
        allowSMS: true,
        allowEmail: true,
        allowSocial: true,
        ctaType: 'BuyNow',
        ctaLabel: 'Shop Now',
        isFeatured: false,
        categoryId: productCat?.ContentCategoryID,
        marketIds: [usMarket?.MarketID, caMarket?.MarketID].filter(Boolean),
        languageIds: [enUS?.LanguageID].filter(Boolean)
      },
      {
        title: 'Compensation Plan Deep Dive',
        subtitle: 'Understanding your earning potential',
        description: 'Get a comprehensive breakdown of the UnFranchise Compensation Plan. Learn about BV requirements, qualification levels, bonuses, and strategies to maximize your earnings.',
        thumbnailURL: 'https://cdn.shop.com/content/images/comp-plan.jpg',
        mediaURL: 'https://cdn.shop.com/content/videos/comp-plan-training.mp4',
        destinationURL: 'https://training.shop.com/compensation',
        contentType: 'Video',
        mimeType: 'video/mp4',
        durationSeconds: 480,
        publishStatus: 'Published',
        publishDate: new Date('2026-03-25'),
        allowSMS: true,
        allowEmail: true,
        allowSocial: false,
        ctaType: 'LearnMore',
        ctaLabel: 'Watch Training',
        requiresDisclaimer: true,
        disclaimerText: 'Earnings are not guaranteed and depend on individual performance and market conditions.',
        isFeatured: false,
        categoryId: trainingCat?.ContentCategoryID,
        marketIds: [usMarket?.MarketID, caMarket?.MarketID, twMarket?.MarketID].filter(Boolean),
        languageIds: [enUS?.LanguageID].filter(Boolean)
      },
      {
        title: 'Taiwan Market Success Stories',
        subtitle: '台灣市場成功案例分享',
        description: 'Hear from top performers in the Taiwan market as they share their strategies for building successful UnFranchise Businesses in the Asia-Pacific region.',
        thumbnailURL: 'https://cdn.shop.com/content/images/taiwan-success.jpg',
        mediaURL: 'https://cdn.shop.com/content/videos/taiwan-testimonials.mp4',
        destinationURL: 'https://www.shop.com/tw/success',
        contentType: 'Video',
        mimeType: 'video/mp4',
        durationSeconds: 360,
        publishStatus: 'Published',
        publishDate: new Date('2026-03-28'),
        allowSMS: true,
        allowEmail: true,
        allowSocial: true,
        ctaType: 'LearnMore',
        ctaLabel: '了解更多',
        isFeatured: true,
        featuredPriority: 4,
        categoryId: successCat?.ContentCategoryID,
        marketIds: [twMarket?.MarketID].filter(Boolean),
        languageIds: [zhTW?.LanguageID].filter(Boolean)
      },
      {
        title: 'Heart Health Essentials Bundle',
        subtitle: 'Complete cardiovascular support',
        description: 'Our Heart Health Bundle combines Isotonix OPC-3, Heart Health Essential Omega III, and CoQ10 to provide comprehensive cardiovascular support.',
        thumbnailURL: 'https://cdn.shop.com/content/images/heart-health-bundle.jpg',
        mediaURL: 'https://cdn.shop.com/content/images/heart-products.jpg',
        destinationURL: 'https://www.shop.com/bundles/heart-health',
        contentType: 'Image',
        mimeType: 'image/jpeg',
        publishStatus: 'Published',
        publishDate: new Date('2026-04-01'),
        allowSMS: true,
        allowEmail: true,
        allowSocial: true,
        ctaType: 'BuyNow',
        ctaLabel: 'Shop Bundle',
        requiresDisclaimer: true,
        disclaimerText: 'These statements have not been evaluated by the FDA. This product is not intended to diagnose, treat, cure, or prevent any disease.',
        isFeatured: false,
        categoryId: productCat?.ContentCategoryID,
        marketIds: [usMarket?.MarketID, caMarket?.MarketID].filter(Boolean),
        languageIds: [enUS?.LanguageID].filter(Boolean)
      },
      {
        title: 'Mobile App Training Session',
        subtitle: 'Master the UnFranchise Marketing App',
        description: 'Learn how to use the new UnFranchise Marketing App to share content, track engagement, and grow your business from your smartphone.',
        thumbnailURL: 'https://cdn.shop.com/content/images/app-training.jpg',
        mediaURL: 'https://cdn.shop.com/content/videos/app-tutorial.mp4',
        destinationURL: 'https://training.shop.com/mobile-app',
        contentType: 'Video',
        mimeType: 'video/mp4',
        durationSeconds: 300,
        publishStatus: 'Published',
        publishDate: new Date('2026-04-03'),
        allowSMS: true,
        allowEmail: true,
        allowSocial: true,
        ctaType: 'LearnMore',
        ctaLabel: 'Watch Tutorial',
        isFeatured: true,
        featuredPriority: 3,
        categoryId: trainingCat?.ContentCategoryID,
        marketIds: [usMarket?.MarketID, caMarket?.MarketID, twMarket?.MarketID].filter(Boolean),
        languageIds: [enUS?.LanguageID].filter(Boolean)
      }
    ];

    console.log(`Preparing to create ${contentItems.length} content items...`);
    console.log();

    let created = 0;
    let failed = 0;

    for (const item of contentItems) {
      try {
        // Insert content item
        const result = await pool.request()
          .input('title', sql.NVarChar, item.title)
          .input('subtitle', sql.NVarChar, item.subtitle || null)
          .input('description', sql.NVarChar, item.description || null)
          .input('thumbnailURL', sql.NVarChar, item.thumbnailURL || null)
          .input('mediaURL', sql.NVarChar, item.mediaURL || null)
          .input('destinationURL', sql.NVarChar, item.destinationURL || null)
          .input('contentType', sql.NVarChar, item.contentType)
          .input('mimeType', sql.NVarChar, item.mimeType || null)
          .input('durationSeconds', sql.Int, item.durationSeconds || null)
          .input('publishStatus', sql.NVarChar, item.publishStatus)
          .input('publishDate', sql.DateTime2, item.publishDate || null)
          .input('expirationDate', sql.DateTime2, item.expirationDate || null)
          .input('allowSMS', sql.Bit, item.allowSMS)
          .input('allowEmail', sql.Bit, item.allowEmail)
          .input('allowSocial', sql.Bit, item.allowSocial)
          .input('ctaType', sql.NVarChar, item.ctaType || null)
          .input('ctaLabel', sql.NVarChar, item.ctaLabel || null)
          .input('requiresDisclaimer', sql.Bit, item.requiresDisclaimer || false)
          .input('disclaimerText', sql.NVarChar, item.disclaimerText || null)
          .input('isFeatured', sql.Bit, item.isFeatured)
          .input('featuredPriority', sql.Int, item.featuredPriority || 0)
          .input('createdBy', sql.BigInt, adminUserId)
          .query(`
            INSERT INTO ContentItem (
              Title, Subtitle, Description,
              ThumbnailURL, MediaURL, DestinationURL,
              ContentType, MIMEType, DurationSeconds,
              PublishStatus, PublishDate, ExpirationDate,
              AllowSMS, AllowEmail, AllowSocial,
              CTAType, CTALabel,
              RequiresDisclaimer, DisclaimerText,
              IsFeatured, FeaturedPriority,
              CreatedBy, UpdatedBy
            )
            OUTPUT INSERTED.ContentItemID
            VALUES (
              @title, @subtitle, @description,
              @thumbnailURL, @mediaURL, @destinationURL,
              @contentType, @mimeType, @durationSeconds,
              @publishStatus, @publishDate, @expirationDate,
              @allowSMS, @allowEmail, @allowSocial,
              @ctaType, @ctaLabel,
              @requiresDisclaimer, @disclaimerText,
              @isFeatured, @featuredPriority,
              @createdBy, @createdBy
            )
          `);

        const contentItemId = result.recordset[0].ContentItemID;

        // Add category
        if (item.categoryId) {
          await pool.request()
            .input('contentItemId', sql.BigInt, contentItemId)
            .input('categoryId', sql.Int, item.categoryId)
            .query(`
              INSERT INTO ContentItemCategory (ContentItemID, ContentCategoryID, IsPrimary)
              VALUES (@contentItemId, @categoryId, 1)
            `);
        }

        // Add markets
        if (item.marketIds && item.marketIds.length > 0) {
          for (const marketId of item.marketIds) {
            await pool.request()
              .input('contentItemId', sql.BigInt, contentItemId)
              .input('marketId', sql.Int, marketId)
              .query(`
                INSERT INTO ContentItemMarket (ContentItemID, MarketID)
                VALUES (@contentItemId, @marketId)
              `);
          }
        }

        // Add languages
        if (item.languageIds && item.languageIds.length > 0) {
          for (const languageId of item.languageIds) {
            await pool.request()
              .input('contentItemId', sql.BigInt, contentItemId)
              .input('languageId', sql.Int, languageId)
              .query(`
                INSERT INTO ContentItemLanguage (ContentItemID, LanguageID)
                VALUES (@contentItemId, @languageId)
              `);
          }
        }

        console.log(`✓ Created: ${item.title} (ID: ${contentItemId})`);
        created++;

      } catch (error) {
        console.error(`✗ Failed: ${item.title}`);
        console.error(`  Error: ${error.message}`);
        failed++;
      }
    }

    console.log();
    console.log('='.repeat(70));
    console.log('Summary');
    console.log('='.repeat(70));
    console.log(`Total items: ${contentItems.length}`);
    console.log(`Created: ${created}`);
    console.log(`Failed: ${failed}`);
    console.log();

    if (created > 0) {
      console.log('Sample content created successfully!');
      console.log('You can now test the Content API endpoints.');
    }

    return 0;

  } catch (error) {
    console.error('Error creating sample content:');
    console.error(error);
    return 1;

  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

createSampleContent().then(code => process.exit(code));
