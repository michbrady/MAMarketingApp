/**
 * Add comprehensive seed data to Content Library
 * Creates realistic UnFranchise/Market America content items
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

// Helper to generate dates in the last 30 days
function getRandomPastDate(daysBack) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date.toISOString();
}

// Comprehensive content items - realistic UnFranchise/Market America content
const contentItems = [
  // Product Showcases (7 items)
  {
    title: 'Isotonix OPC-3 - The Power of Antioxidants',
    subtitle: 'Support Your Health with Premium Antioxidants',
    description: 'Discover why Isotonix OPC-3 is one of the most popular antioxidant supplements in America. This powerful formula combines bioflavonoids and OPCs to support cardiovascular health, joint flexibility, and immune function. Share this with your customers to showcase the science-backed benefits.',
    thumbnailURL: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200',
    destinationURL: 'https://www.shop.com/isotonix-opc3',
    contentType: 'Image',
    categoryID: 10, // Nutrition
    marketID: 1, // US
    languageID: 1, // English (US)
    tags: 'antioxidants,health,isotonix,supplements,wellness',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: true,
    featuredPriority: 5
  },
  {
    title: 'Motives Cosmetics - Professional Quality, Exceptional Value',
    subtitle: 'Discover Luxury Makeup at Unbeatable Prices',
    description: 'Motives Cosmetics delivers salon-quality makeup at prices that make sense. From foundations to eye shadows, our cruelty-free formulas are perfect for everyday beauty or special occasions. Perfect content to share with beauty enthusiasts!',
    thumbnailURL: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200',
    destinationURL: 'https://www.shop.com/motives-cosmetics',
    contentType: 'Image',
    categoryID: 11, // Beauty
    marketID: 1,
    languageID: 1,
    tags: 'beauty,cosmetics,motives,makeup,skincare',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: true,
    featuredPriority: 4
  },
  {
    title: 'TLS Weight Loss Solution - Transform Your Life',
    subtitle: 'Science-Based Weight Management That Works',
    description: 'The TLS (Transition Lifestyle System) helps thousands achieve their weight loss goals through proven nutrition, fitness, and lifestyle strategies. Share this powerful transformation story with prospects looking for real results.',
    thumbnailURL: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200',
    destinationURL: 'https://www.shop.com/tls-weight-loss',
    contentType: 'Image',
    categoryID: 12, // Weight Management
    marketID: 1,
    languageID: 1,
    tags: 'weight loss,tls,health,fitness,transformation',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: true,
    featuredPriority: 3
  },
  {
    title: 'DNA Miracles Baby Care - Pure, Safe, Effective',
    subtitle: 'Premium Baby Products Parents Trust',
    description: 'DNA Miracles offers pediatrician-developed baby care products free from harsh chemicals. From supplements to skincare, every product is designed with your baby\'s health in mind. A perfect share for new parents in your network.',
    thumbnailURL: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1200',
    destinationURL: 'https://www.shop.com/dna-miracles',
    contentType: 'Image',
    categoryID: 1, // Products
    marketID: 1,
    languageID: 1,
    tags: 'baby,parenting,health,supplements,skincare',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: false,
    featuredPriority: 0
  },
  {
    title: 'Lumiere de Vie Skincare - Age-Defying Luxury',
    subtitle: 'Advanced Anti-Aging Technology',
    description: 'Experience the ultimate in anti-aging skincare with Lumiere de Vie. Our premium formulas combine cutting-edge science with luxurious ingredients to visibly reduce fine lines, improve skin texture, and restore youthful radiance.',
    thumbnailURL: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1200',
    destinationURL: 'https://www.shop.com/lumiere-de-vie',
    contentType: 'Image',
    categoryID: 11, // Beauty
    marketID: 1,
    languageID: 1,
    tags: 'skincare,anti-aging,beauty,luxury,wellness',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: false,
    featuredPriority: 0
  },
  {
    title: 'Ultimate Aloe Juice - Pure Wellness from Nature',
    subtitle: 'Support Digestive Health Naturally',
    description: 'Our Ultimate Aloe contains 97% pure inner leaf aloe vera gel to support digestive health, immune function, and overall wellness. This refreshing drink is a customer favorite and perfect for daily health routines.',
    thumbnailURL: 'https://images.unsplash.com/photo-1610824307823-ce2e8df46731?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1610824307823-ce2e8df46731?w=1200',
    destinationURL: 'https://www.shop.com/ultimate-aloe',
    contentType: 'Image',
    categoryID: 10, // Nutrition
    marketID: 1,
    languageID: 1,
    tags: 'aloe,digestive health,wellness,supplements,natural',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: false,
    featuredPriority: 0
  },
  {
    title: 'Heart Health Essential Omega III - Premium Fish Oil',
    subtitle: 'Support Your Cardiovascular System',
    description: 'High-potency omega-3 fatty acids from sustainably sourced fish oil. Support heart health, brain function, and reduce inflammation with our pharmaceutical-grade formula that\'s tested for purity and potency.',
    thumbnailURL: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=1200',
    destinationURL: 'https://www.shop.com/heart-health-omega',
    contentType: 'Image',
    categoryID: 10, // Nutrition
    marketID: 1,
    languageID: 1,
    tags: 'omega-3,heart health,supplements,wellness,fish oil',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: false,
    featuredPriority: 0
  },

  // Business Opportunity Content (4 items)
  {
    title: 'Start Your UnFranchise Business Today',
    subtitle: 'Own Your Future - No Franchise Fees Required',
    description: 'Discover how the UnFranchise Business Model is revolutionizing entrepreneurship. No massive upfront costs, no territory restrictions, just unlimited potential to build residual income while helping others. Perfect for sharing with serious business prospects.',
    thumbnailURL: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200',
    destinationURL: 'https://www.marketamerica.com/opportunity',
    contentType: 'Video',
    categoryID: 2, // Business Opportunity
    marketID: 1,
    languageID: 1,
    tags: 'business opportunity,income,entrepreneurship,unfranchise,residual income',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: true,
    featuredPriority: 10
  },
  {
    title: 'The Power of Passive Income - Your Path to Financial Freedom',
    subtitle: 'Build Income That Works While You Sleep',
    description: 'Learn how UnFranchise Owners create multiple streams of passive income through product sales, customer referrals, and team building. This presentation breaks down the compensation plan in simple terms anyone can understand.',
    thumbnailURL: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200',
    destinationURL: 'https://www.marketamerica.com/compensation',
    contentType: 'LandingPage',
    categoryID: 20, // Income Opportunity
    marketID: 1,
    languageID: 1,
    tags: 'passive income,compensation plan,financial freedom,residual income,wealth building',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: true,
    featuredPriority: 8
  },
  {
    title: '5 Reasons to Join Market America in 2026',
    subtitle: 'Why Now Is the Perfect Time',
    description: 'Explosive e-commerce growth, proven compensation plan, world-class products, comprehensive training, and a global opportunity - discover why thousands are joining Market America this year. Share this with prospects on the fence!',
    thumbnailURL: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200',
    destinationURL: 'https://www.marketamerica.com/why-join',
    contentType: 'Image',
    categoryID: 2, // Business Opportunity
    marketID: 1,
    languageID: 1,
    tags: 'opportunity,join,2026,growth,recruitment',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: false,
    featuredPriority: 0
  },
  {
    title: 'From Part-Time to Full-Time - Real Income Stories',
    subtitle: 'Ordinary People, Extraordinary Results',
    description: 'Watch inspiring interviews with UnFranchise Owners who started part-time and built full-time incomes. Real people sharing real numbers and the strategies that got them there. Perfect for prospecting conversations!',
    thumbnailURL: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200',
    destinationURL: 'https://www.marketamerica.com/success-stories',
    contentType: 'Video',
    categoryID: 22, // Success Stories
    marketID: 1,
    languageID: 1,
    tags: 'success stories,income,testimonials,inspiration,proof',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: false,
    featuredPriority: 0
  },

  // Event Promotions (3 items)
  {
    title: 'International Convention 2026 - Register Now!',
    subtitle: 'The Event That Will Change Your Life',
    description: 'Join thousands of UnFranchise Owners for four days of training, inspiration, and celebration. Hear from top earners, learn cutting-edge strategies, and connect with your global team. Early bird pricing ends soon - secure your spot today!',
    thumbnailURL: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
    destinationURL: 'https://www.marketamerica.com/convention2026',
    contentType: 'LandingPage',
    categoryID: 4, // Events
    marketID: 1,
    languageID: 1,
    tags: 'convention,event,training,networking,2026',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: true,
    featuredPriority: 9
  },
  {
    title: 'Regional Business Briefing - This Saturday!',
    subtitle: 'Discover the UnFranchise Opportunity',
    description: 'Bring your prospects to this high-energy overview of the Market America business opportunity. Professional presentation, inspiring testimonials, and light refreshments provided. Perfect for introducing new people to the business!',
    thumbnailURL: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200',
    destinationURL: 'https://www.marketamerica.com/events/regional-briefing',
    contentType: 'Image',
    categoryID: 4, // Events
    marketID: 1,
    languageID: 1,
    tags: 'event,briefing,opportunity,local,presentation',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: false,
    featuredPriority: 0
  },
  {
    title: 'Virtual Product Training - Master Your Product Knowledge',
    subtitle: 'Live Online Training Every Tuesday',
    description: 'Join our weekly virtual training sessions to become a product expert. Learn the science, benefits, and selling points of our top products. Great for new team members and refresher training for veterans!',
    thumbnailURL: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200',
    destinationURL: 'https://www.marketamerica.com/training/product-tuesday',
    contentType: 'Video',
    categoryID: 4, // Events
    marketID: 1,
    languageID: 1,
    tags: 'training,virtual,product knowledge,education,webinar',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: false,
    featuredPriority: 0
  },

  // Training Videos (4 items)
  {
    title: 'Social Media Marketing Masterclass',
    subtitle: 'Grow Your Business on Facebook and Instagram',
    description: 'Learn proven strategies to attract prospects, engage customers, and build your brand on social media. This comprehensive training covers content creation, paid advertising, and organic growth tactics that actually work.',
    thumbnailURL: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1200',
    destinationURL: 'https://www.marketamerica.com/training/social-media',
    contentType: 'Video',
    categoryID: 3, // Training
    marketID: 1,
    languageID: 1,
    tags: 'social media,marketing,training,facebook,instagram',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: true,
    featuredPriority: 6
  },
  {
    title: 'The Art of the Follow-Up - Convert More Prospects',
    subtitle: 'Fortune Is in the Follow-Up',
    description: 'Most sales happen after the 5th follow-up, yet most people quit after one. Learn the exact scripts, timing, and strategies top earners use to turn "maybe" into "yes!" This training will transform your closing rate.',
    thumbnailURL: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200',
    destinationURL: 'https://www.marketamerica.com/training/follow-up',
    contentType: 'Video',
    categoryID: 3, // Training
    marketID: 1,
    languageID: 1,
    tags: 'sales,follow-up,closing,prospecting,training',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: false,
    featuredPriority: 0
  },
  {
    title: 'Building Your Customer Base - Fast Start Guide',
    subtitle: '30 Customers in 30 Days',
    description: 'New to the business? This step-by-step guide shows you exactly how to find, approach, and convert your first 30 customers. Includes scripts, objection handlers, and practical action steps you can implement immediately.',
    thumbnailURL: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200',
    destinationURL: 'https://www.marketamerica.com/training/fast-start',
    contentType: 'Document',
    categoryID: 3, // Training
    marketID: 1,
    languageID: 1,
    tags: 'fast start,customers,new business,training,getting started',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: false,
    featuredPriority: 0
  },
  {
    title: 'Team Duplication System - Build Leaders, Not Followers',
    subtitle: 'Scale Your Organization Exponentially',
    description: 'The secret to massive success is duplication. Learn how to identify leaders, develop their skills, and create a self-sustaining organization that grows with or without you. Advanced training for serious business builders.',
    thumbnailURL: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200',
    destinationURL: 'https://www.marketamerica.com/training/duplication',
    contentType: 'Video',
    categoryID: 3, // Training
    marketID: 1,
    languageID: 1,
    tags: 'duplication,leadership,team building,training,advanced',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: false,
    featuredPriority: 0
  },

  // Customer Testimonials (3 items)
  {
    title: 'Lost 45 Pounds with TLS - Sarah\'s Transformation',
    subtitle: 'Real Results from a Real Customer',
    description: 'Watch Sarah share her incredible weight loss journey using the TLS program. From struggling with yo-yo dieting to finally finding a sustainable solution, her story inspires and shows what\'s possible with the right system.',
    thumbnailURL: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200',
    destinationURL: 'https://www.shop.com/testimonials/sarah-weight-loss',
    contentType: 'Video',
    categoryID: 5, // Testimonials
    marketID: 1,
    languageID: 1,
    tags: 'testimonial,weight loss,transformation,TLS,customer story',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: false,
    featuredPriority: 0
  },
  {
    title: 'Isotonix Changed My Energy Levels - Michael\'s Story',
    subtitle: 'From Exhausted to Energized',
    description: 'Michael was skeptical about supplements until he tried Isotonix. Hear how this busy executive went from afternoon crashes to sustained energy throughout the day. Perfect testimonial for health-conscious professionals!',
    thumbnailURL: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200',
    destinationURL: 'https://www.shop.com/testimonials/michael-energy',
    contentType: 'Image',
    categoryID: 5, // Testimonials
    marketID: 1,
    languageID: 1,
    tags: 'testimonial,energy,isotonix,health,customer story',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: false,
    featuredPriority: 0
  },
  {
    title: 'My Skin Has Never Looked Better - Jennifer Loves Lumiere de Vie',
    subtitle: 'Anti-Aging Results That Speak for Themselves',
    description: 'At 52, Jennifer tried countless skincare products with disappointing results. See the visible difference Lumiere de Vie made in just 8 weeks - reduced fine lines, improved texture, and a radiant glow that has her friends asking for her secret!',
    thumbnailURL: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=1200',
    destinationURL: 'https://www.shop.com/testimonials/jennifer-skincare',
    contentType: 'Image',
    categoryID: 5, // Testimonials
    marketID: 1,
    languageID: 1,
    tags: 'testimonial,skincare,anti-aging,lumiere de vie,customer story',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: false,
    featuredPriority: 0
  },

  // Promotional Campaigns (2 items)
  {
    title: 'Spring Sale - 20% Off Top Products!',
    subtitle: 'Limited Time - Stock Up and Save',
    description: 'Don\'t miss our biggest sale of the season! Get 20% off bestselling Isotonix products, Motives cosmetics, and select TLS items. Sale ends Sunday - share this with your customers now and help them save big!',
    thumbnailURL: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=1200',
    destinationURL: 'https://www.shop.com/spring-sale',
    contentType: 'Image',
    categoryID: 21, // Lifestyle
    marketID: 1,
    languageID: 1,
    tags: 'sale,promotion,discount,spring,savings',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: true,
    featuredPriority: 7
  },
  {
    title: 'New Customer Special - Free Shipping on First Order',
    subtitle: 'Perfect for New Customers',
    description: 'Help your new customers get started with free shipping on their first order of $50 or more. A great way to remove barriers and get people experiencing our amazing products. Use code: WELCOME2026',
    thumbnailURL: 'https://images.unsplash.com/photo-1558769132-cb1aea2f5e51?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1558769132-cb1aea2f5e51?w=1200',
    destinationURL: 'https://www.shop.com/new-customer-offer',
    contentType: 'LandingPage',
    categoryID: 21, // Lifestyle
    marketID: 1,
    languageID: 1,
    tags: 'promotion,new customer,free shipping,offer,welcome',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: false,
    featuredPriority: 0
  },

  // Health & Wellness Tips (3 items)
  {
    title: '5 Daily Habits for Better Health',
    subtitle: 'Simple Steps to Wellness',
    description: 'Small daily actions create big results. Learn five science-backed habits you can implement today: hydration strategies, supplement timing, sleep optimization, stress management, and movement tips. Share this valuable content with your health-conscious network!',
    thumbnailURL: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200',
    destinationURL: 'https://www.marketamerica.com/wellness/daily-habits',
    contentType: 'Image',
    categoryID: 21, // Lifestyle
    marketID: 1,
    languageID: 1,
    tags: 'wellness,health tips,habits,lifestyle,daily routine',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: false,
    featuredPriority: 0
  },
  {
    title: 'Understanding Antioxidants - Why They Matter',
    subtitle: 'The Science Behind Cell Protection',
    description: 'Free radicals damage your cells every day. Antioxidants are your defense system. This educational video explains the science in simple terms and shows why supplementation with products like OPC-3 supports optimal health.',
    thumbnailURL: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1200',
    destinationURL: 'https://www.marketamerica.com/wellness/antioxidants-explained',
    contentType: 'Video',
    categoryID: 21, // Lifestyle
    marketID: 1,
    languageID: 1,
    tags: 'antioxidants,education,health,science,wellness',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: false,
    featuredPriority: 0
  },
  {
    title: 'Boost Your Immune System Naturally',
    subtitle: 'Year-Round Immune Support Strategies',
    description: 'Your immune system works 24/7 to protect you. Support it with proper nutrition, quality sleep, stress management, and targeted supplementation. This guide provides actionable tips plus product recommendations for optimal immune health.',
    thumbnailURL: 'https://images.unsplash.com/photo-1584467735867-4c1a10f8e938?w=800',
    mediaURL: 'https://images.unsplash.com/photo-1584467735867-4c1a10f8e938?w=1200',
    destinationURL: 'https://www.marketamerica.com/wellness/immune-support',
    contentType: 'Document',
    categoryID: 21, // Lifestyle
    marketID: 1,
    languageID: 1,
    tags: 'immune system,health,wellness,prevention,supplements',
    publishStatus: 'Published',
    allowSMS: true,
    allowEmail: true,
    allowSocial: true,
    isFeatured: false,
    featuredPriority: 0
  }
];

async function insertContentData() {
  let pool;

  try {
    console.log('='.repeat(70));
    console.log('CONTENT LIBRARY SEED DATA INSERTION');
    console.log('='.repeat(70));
    console.log();

    console.log('Connecting to database...');
    pool = await sql.connect(config);
    console.log('Connected successfully!\n');

    // Check existing content to avoid duplicates
    console.log('Checking existing content items...');
    const existing = await pool.request().query(`
      SELECT Title FROM ContentItem
    `);
    const existingTitles = new Set(existing.recordset.map(r => r.Title));
    console.log(`Found ${existingTitles.size} existing content items\n`);

    // Filter out items that already exist
    const newItems = contentItems.filter(item => !existingTitles.has(item.title));

    if (newItems.length === 0) {
      console.log('All content items already exist. No new items to insert.');
      return;
    }

    console.log(`Preparing to insert ${newItems.length} new content items...\n`);

    let inserted = 0;
    let skipped = 0;

    // Insert items one by one with progress tracking
    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];
      const createdDate = getRandomPastDate(30);

      try {
        const request = pool.request();

        await request
          .input('title', sql.NVarChar(255), item.title)
          .input('subtitle', sql.NVarChar(255), item.subtitle || null)
          .input('description', sql.NVarChar(sql.MAX), item.description)
          .input('thumbnailURL', sql.NVarChar(500), item.thumbnailURL)
          .input('mediaURL', sql.NVarChar(500), item.mediaURL)
          .input('destinationURL', sql.NVarChar(500), item.destinationURL)
          .input('contentType', sql.NVarChar(50), item.contentType)
          .input('publishStatus', sql.NVarChar(20), item.publishStatus)
          .input('allowSMS', sql.Bit, item.allowSMS ? 1 : 0)
          .input('allowEmail', sql.Bit, item.allowEmail ? 1 : 0)
          .input('allowSocial', sql.Bit, item.allowSocial ? 1 : 0)
          .input('allowPersonalNote', sql.Bit, 1)
          .input('requiresDisclaimer', sql.Bit, 0)
          .input('isRegulatedContent', sql.Bit, 0)
          .input('isFeatured', sql.Bit, item.isFeatured ? 1 : 0)
          .input('featuredPriority', sql.Int, item.featuredPriority || 0)
          .input('createdDate', sql.DateTime2, createdDate)
          .query(`
            INSERT INTO ContentItem (
              ContentGUID, Title, Subtitle, Description,
              ThumbnailURL, MediaURL, DestinationURL, ContentType,
              PublishStatus, PublishDate,
              AllowSMS, AllowEmail, AllowSocial, AllowPersonalNote,
              RequiresDisclaimer, IsRegulatedContent,
              ViewCount, ShareCount, ClickCount,
              IsFeatured, FeaturedPriority,
              CreatedDate, UpdatedDate
            ) VALUES (
              NEWID(), @title, @subtitle, @description,
              @thumbnailURL, @mediaURL, @destinationURL, @contentType,
              @publishStatus, @createdDate,
              @allowSMS, @allowEmail, @allowSocial, @allowPersonalNote,
              @requiresDisclaimer, @isRegulatedContent,
              0, 0, 0,
              @isFeatured, @featuredPriority,
              @createdDate, @createdDate
            );

            DECLARE @ContentItemID BIGINT = SCOPE_IDENTITY();

            -- Link to category
            INSERT INTO ContentItemCategory (ContentItemID, ContentCategoryID, IsPrimary, CreatedDate)
            VALUES (@ContentItemID, ${item.categoryID}, 1, @createdDate);

            -- Link to market
            INSERT INTO ContentItemMarket (ContentItemID, MarketID, CreatedDate)
            VALUES (@ContentItemID, ${item.marketID}, @createdDate);

            -- Link to language
            INSERT INTO ContentItemLanguage (ContentItemID, LanguageID, CreatedDate)
            VALUES (@ContentItemID, ${item.languageID}, @createdDate);

            -- Add tags
            ${item.tags ? `
            DECLARE @TagList NVARCHAR(MAX) = '${item.tags}';
            DECLARE @TagName NVARCHAR(50);
            DECLARE @TagID INT;

            WHILE LEN(@TagList) > 0
            BEGIN
              IF CHARINDEX(',', @TagList) > 0
              BEGIN
                SET @TagName = LTRIM(RTRIM(SUBSTRING(@TagList, 1, CHARINDEX(',', @TagList) - 1)));
                SET @TagList = SUBSTRING(@TagList, CHARINDEX(',', @TagList) + 1, LEN(@TagList));
              END
              ELSE
              BEGIN
                SET @TagName = LTRIM(RTRIM(@TagList));
                SET @TagList = '';
              END

              -- Check if tag exists, create if not
              IF NOT EXISTS (SELECT 1 FROM ContentTag WHERE TagName = @TagName)
              BEGIN
                INSERT INTO ContentTag (TagName, IsActive, CreatedDate)
                VALUES (@TagName, 1, @createdDate);
              END

              SELECT @TagID = ContentTagID FROM ContentTag WHERE TagName = @TagName;

              -- Link content to tag
              IF NOT EXISTS (SELECT 1 FROM ContentItemTag WHERE ContentItemID = @ContentItemID AND ContentTagID = @TagID)
              BEGIN
                INSERT INTO ContentItemTag (ContentItemID, ContentTagID, CreatedDate)
                VALUES (@ContentItemID, @TagID, @createdDate);
              END
            END
            ` : ''}
          `);

        inserted++;
        const progress = Math.round((i + 1) / newItems.length * 100);
        console.log(`[${progress}%] Inserted: ${item.title}`);

      } catch (error) {
        console.log(`[SKIP] ${item.title}: ${error.message}`);
        skipped++;
      }
    }

    console.log();
    console.log('='.repeat(70));
    console.log('INSERTION COMPLETE');
    console.log('='.repeat(70));
    console.log(`Successfully inserted: ${inserted} items`);
    console.log(`Skipped: ${skipped} items`);
    console.log();

    // Verify final counts
    console.log('Verifying database...');
    const verification = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM ContentItem) AS TotalContentItems,
        (SELECT COUNT(*) FROM ContentCategory) AS TotalCategories,
        (SELECT COUNT(*) FROM ContentTag) AS TotalTags,
        (SELECT COUNT(*) FROM ContentItem WHERE IsFeatured = 1) AS FeaturedItems,
        (SELECT COUNT(*) FROM ContentItem WHERE PublishStatus = 'Published') AS PublishedItems
    `);

    const stats = verification.recordset[0];
    console.log(`Total Content Items: ${stats.TotalContentItems}`);
    console.log(`Total Categories: ${stats.TotalCategories}`);
    console.log(`Total Tags: ${stats.TotalTags}`);
    console.log(`Featured Items: ${stats.FeaturedItems}`);
    console.log(`Published Items: ${stats.PublishedItems}`);
    console.log();

    console.log('='.repeat(70));
    console.log('SUCCESS! Content Library is ready for use.');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('ERROR:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

insertContentData().then(() => process.exit(0));
