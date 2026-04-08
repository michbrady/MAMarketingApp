/**
 * Sharing API Test Script
 * Tests the complete sharing flow:
 * 1. Create share events for different channels
 * 2. Generate tracking links
 * 3. Simulate click tracking
 * 4. Fetch analytics
 * 5. Test templates
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';
const TRACKING_BASE_URL = 'http://localhost:3000/s';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Store auth token and test data
let authToken = '';
let userId = 0;
let contentItemId = 0;
let shareEventIds = [];
let trackingCodes = [];

/**
 * Step 1: Login
 */
async function login() {
  log('\n=== Step 1: Login ===', 'blue');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'sarah.johnson@unfranchise.com',
      password: 'password123'
    });

    if (response.data.success) {
      authToken = response.data.token;
      userId = response.data.user.id;
      logSuccess(`Logged in as ${response.data.user.firstName} ${response.data.user.lastName}`);
      logInfo(`User ID: ${userId}`);
      logInfo(`Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      logError('Login failed');
      return false;
    }
  } catch (error) {
    logError(`Login error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Step 2: Get a content item
 */
async function getContentItem() {
  log('\n=== Step 2: Get Content Item ===', 'blue');
  try {
    const response = await axios.get(`${API_BASE_URL}/content`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { limit: 1 }
    });

    if (response.data.success && response.data.data.items.length > 0) {
      const content = response.data.data.items[0];
      contentItemId = content.ContentItemID;
      logSuccess(`Found content: ${content.Title}`);
      logInfo(`Content ID: ${contentItemId}`);
      logInfo(`Type: ${content.ContentType}`);
      return true;
    } else {
      logError('No content items found');
      return false;
    }
  } catch (error) {
    logError(`Error fetching content: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Step 3: Create share events for all channels
 */
async function createShareEvents() {
  log('\n=== Step 3: Create Share Events ===', 'blue');

  const channels = [
    {
      channel: 'SMS',
      recipients: [{ mobile: '+1234567890', name: 'John Doe' }],
      personalMessage: 'Check this out!'
    },
    {
      channel: 'Email',
      recipients: [{ email: 'prospect@example.com', name: 'Jane Smith' }],
      personalMessage: 'I thought you might find this interesting.'
    },
    {
      channel: 'Social',
      socialPlatform: 'Facebook',
      personalMessage: 'Great content to share!'
    },
    {
      channel: 'Social',
      socialPlatform: 'Twitter',
      personalMessage: 'Must see!'
    }
  ];

  for (const shareData of channels) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/share`,
        {
          contentItemId,
          ...shareData
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      if (response.data.success) {
        const { shareEventId, trackingCode, trackingUrl } = response.data.data;
        shareEventIds.push(shareEventId);
        trackingCodes.push(trackingCode);

        logSuccess(`Created ${shareData.channel} share (${shareData.socialPlatform || ''})`);
        logInfo(`  Share Event ID: ${shareEventId}`);
        logInfo(`  Tracking Code: ${trackingCode}`);
        logInfo(`  Tracking URL: ${trackingUrl}`);
      } else {
        logError(`Failed to create ${shareData.channel} share`);
      }
    } catch (error) {
      logError(`Error creating ${shareData.channel} share: ${error.response?.data?.message || error.message}`);
    }
  }

  return shareEventIds.length > 0;
}

/**
 * Step 4: Simulate click tracking
 */
async function simulateClicks() {
  log('\n=== Step 4: Simulate Click Tracking ===', 'blue');

  for (let i = 0; i < trackingCodes.length; i++) {
    const trackingCode = trackingCodes[i];

    try {
      // Simulate multiple clicks
      const clickCount = Math.floor(Math.random() * 5) + 1;

      for (let click = 0; click < clickCount; click++) {
        const response = await axios.get(
          `${API_BASE_URL}/share/${trackingCode}/track`,
          {
            maxRedirects: 0,
            validateStatus: (status) => status === 302,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          }
        );

        if (response.status === 302) {
          logSuccess(`Click ${click + 1} tracked for ${trackingCode}`);
          logInfo(`  Redirected to: ${response.headers.location}`);
        }
      }

      logInfo(`  Total clicks simulated: ${clickCount}`);
    } catch (error) {
      // Axios throws on redirect by default, this is expected
      if (error.response?.status === 302) {
        logSuccess(`Click tracked for ${trackingCode}`);
      } else {
        logError(`Error tracking click: ${error.message}`);
      }
    }
  }

  return true;
}

/**
 * Step 5: Fetch analytics
 */
async function fetchAnalytics() {
  log('\n=== Step 5: Fetch Share Analytics ===', 'blue');

  try {
    // Overall analytics
    log('\n--- Overall Analytics ---', 'yellow');
    const overallResponse = await axios.get(
      `${API_BASE_URL}/share/analytics`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (overallResponse.data.success) {
      const data = overallResponse.data.data;
      logSuccess('Analytics fetched successfully');
      logInfo(`Total Shares: ${data.totalShares}`);
      logInfo(`Total Clicks: ${data.totalClicks}`);
      logInfo(`Total Unique Clicks: ${data.totalUniqueClicks}`);
      logInfo(`Average Click Rate: ${data.averageClickRate}%`);

      log('\nShares by Channel:', 'yellow');
      data.sharesByChannel.forEach(channel => {
        logInfo(`  ${channel.channel}: ${channel.count} shares, ${channel.clicks} clicks (${channel.clickRate}%)`);
      });

      if (data.topContent.length > 0) {
        log('\nTop Content:', 'yellow');
        data.topContent.slice(0, 3).forEach((content, index) => {
          logInfo(`  ${index + 1}. ${content.title}`);
          logInfo(`     Shares: ${content.shares}, Clicks: ${content.clicks}, Click Rate: ${content.clickRate}%`);
        });
      }

      if (data.recentShares.length > 0) {
        log('\nRecent Shares:', 'yellow');
        logInfo(`  Latest ${data.recentShares.length} shares logged`);
      }
    }

    // Analytics by content
    log('\n--- Analytics by Content ---', 'yellow');
    const contentResponse = await axios.get(
      `${API_BASE_URL}/share/analytics`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { contentId: contentItemId }
      }
    );

    if (contentResponse.data.success) {
      const data = contentResponse.data.data;
      logSuccess(`Analytics for content ${contentItemId}`);
      logInfo(`Total Shares: ${data.totalShares}`);
      logInfo(`Total Clicks: ${data.totalClicks}`);
      logInfo(`Click Rate: ${data.averageClickRate}%`);
    }

    // Analytics by channel
    log('\n--- Analytics by Channel (SMS) ---', 'yellow');
    const smsResponse = await axios.get(
      `${API_BASE_URL}/share/analytics`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { channel: 'SMS' }
      }
    );

    if (smsResponse.data.success) {
      const data = smsResponse.data.data;
      logSuccess('SMS Analytics');
      logInfo(`Total SMS Shares: ${data.totalShares}`);
      logInfo(`Total Clicks: ${data.totalClicks}`);
    }

    return true;
  } catch (error) {
    logError(`Error fetching analytics: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Step 6: Test templates
 */
async function testTemplates() {
  log('\n=== Step 6: Test Channel Templates ===', 'blue');

  const channels = ['SMS', 'Email', 'Social'];
  const socialPlatforms = ['Facebook', 'Twitter', 'LinkedIn'];

  for (const channel of channels) {
    try {
      const url = channel === 'Social'
        ? `${API_BASE_URL}/share/templates/${channel}?platform=Facebook`
        : `${API_BASE_URL}/share/templates/${channel}`;

      const response = await axios.get(url);

      if (response.data.success) {
        const template = response.data.data;
        logSuccess(`${channel} template retrieved`);
        logInfo(`  Template Name: ${template.templateName}`);
        logInfo(`  Variables: ${template.variables.join(', ')}`);
        if (template.maxLength) {
          logInfo(`  Max Length: ${template.maxLength} characters`);
        }
        if (template.subject) {
          logInfo(`  Subject: ${template.subject}`);
        }
        logInfo(`  Body Preview: ${template.body.substring(0, 80)}...`);
      }
    } catch (error) {
      logError(`Error fetching ${channel} template: ${error.message}`);
    }
  }

  // Test social platform variations
  log('\n--- Social Platform Templates ---', 'yellow');
  for (const platform of socialPlatforms) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/share/templates/Social?platform=${platform}`
      );

      if (response.data.success) {
        const template = response.data.data;
        logSuccess(`${platform} template retrieved`);
        logInfo(`  Max Length: ${template.maxLength} characters`);
      }
    } catch (error) {
      logError(`Error fetching ${platform} template: ${error.message}`);
    }
  }

  return true;
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║        Sharing API Test Suite                         ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');

  const startTime = Date.now();

  // Run all tests in sequence
  const loginSuccess = await login();
  if (!loginSuccess) {
    logError('\nTests aborted: Login failed');
    return;
  }

  const contentSuccess = await getContentItem();
  if (!contentSuccess) {
    logError('\nTests aborted: Could not get content item');
    return;
  }

  const shareSuccess = await createShareEvents();
  if (!shareSuccess) {
    logWarning('\nWarning: Some share events may have failed');
  }

  // Small delay to ensure data is written
  await new Promise(resolve => setTimeout(resolve, 1000));

  await simulateClicks();

  // Small delay to ensure click data is written
  await new Promise(resolve => setTimeout(resolve, 1000));

  await fetchAnalytics();
  await testTemplates();

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  log('\n╔════════════════════════════════════════════════════════╗', 'green');
  log('║        Test Suite Complete!                           ║', 'green');
  log('╚════════════════════════════════════════════════════════╝', 'green');
  log(`\nDuration: ${duration}s`, 'blue');
  logSuccess(`Created ${shareEventIds.length} share events`);
  logSuccess(`Generated ${trackingCodes.length} tracking links`);
  logSuccess('All tests executed');
}

// Run the tests
runTests().catch(error => {
  logError(`\nFatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
