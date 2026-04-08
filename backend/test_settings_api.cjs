/**
 * Test System Settings API
 * Tests all settings, feature flags, and maintenance mode endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';
let authToken = '';
let testContentId = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
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
  log(`ℹ ${message}`, 'cyan');
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(message, 'blue');
  log('='.repeat(60), 'blue');
}

async function login() {
  logSection('Authentication');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@unfranchise.com',
      password: 'Admin123!'
    });

    authToken = response.data.token;
    logSuccess('Logged in successfully');
    logInfo(`Token: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    logError('Login failed');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testGetAllSettings() {
  logSection('Test: Get All Settings');
  try {
    const response = await axios.get(`${BASE_URL}/admin/settings`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('Retrieved all settings');
    logInfo(`Total settings: ${response.data.data.length}`);

    // Display some settings
    response.data.data.slice(0, 5).forEach(setting => {
      console.log(`  - ${setting.settingKey}: ${setting.settingValue} (${setting.category})`);
    });

    return true;
  } catch (error) {
    logError('Failed to get all settings');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testGetSettingsByCategory() {
  logSection('Test: Get Settings Grouped by Category');
  try {
    const response = await axios.get(`${BASE_URL}/admin/settings/grouped`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('Retrieved settings grouped by category');
    logInfo(`Total categories: ${response.data.data.length}`);

    response.data.data.forEach(category => {
      console.log(`  - ${category.category}: ${category.settings.length} settings`);
    });

    return true;
  } catch (error) {
    logError('Failed to get settings by category');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testGetCategorySettings() {
  logSection('Test: Get Settings for Application Category');
  try {
    const response = await axios.get(`${BASE_URL}/admin/settings/application`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('Retrieved application settings');
    logInfo(`Settings found: ${response.data.data.length}`);

    response.data.data.forEach(setting => {
      console.log(`  - ${setting.settingKey}: ${setting.settingValue}`);
    });

    return true;
  } catch (error) {
    logError('Failed to get category settings');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testUpdateSetting() {
  logSection('Test: Update a Single Setting');
  try {
    const response = await axios.put(
      `${BASE_URL}/admin/settings/app_name`,
      {
        value: 'UnFranchise Marketing Platform (Updated)'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    logSuccess('Updated setting');
    logInfo(`New value: ${response.data.data.settingValue}`);

    // Restore original value
    await axios.put(
      `${BASE_URL}/admin/settings/app_name`,
      {
        value: 'UnFranchise Marketing App'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    logInfo('Restored original value');

    return true;
  } catch (error) {
    logError('Failed to update setting');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testBulkUpdateSettings() {
  logSection('Test: Bulk Update Settings');
  try {
    const response = await axios.put(
      `${BASE_URL}/admin/settings/bulk`,
      {
        settings: [
          { key: 'app_theme_primary_color', value: '#3b82f6' },
          { key: 'app_theme_secondary_color', value: '#8b5cf6' }
        ]
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    logSuccess('Bulk updated settings');
    logInfo(`Updated ${response.data.data.length} settings`);

    response.data.data.forEach(setting => {
      console.log(`  - ${setting.settingKey}: ${setting.settingValue}`);
    });

    return true;
  } catch (error) {
    logError('Failed to bulk update settings');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testGetFeatureFlags() {
  logSection('Test: Get All Feature Flags');
  try {
    const response = await axios.get(`${BASE_URL}/admin/feature-flags`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('Retrieved all feature flags');
    logInfo(`Total flags: ${response.data.data.length}`);

    response.data.data.forEach(flag => {
      const status = flag.isEnabled ? '✓ Enabled' : '✗ Disabled';
      console.log(`  - ${flag.featureName}: ${status}`);
    });

    return true;
  } catch (error) {
    logError('Failed to get feature flags');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testToggleFeatureFlag() {
  logSection('Test: Toggle Feature Flag');
  try {
    // Disable a feature
    let response = await axios.put(
      `${BASE_URL}/admin/feature-flags/analytics_enabled`,
      {
        isEnabled: false
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    logSuccess('Disabled feature flag');
    logInfo(`analytics_enabled: ${response.data.data.isEnabled}`);

    // Re-enable the feature
    response = await axios.put(
      `${BASE_URL}/admin/feature-flags/analytics_enabled`,
      {
        isEnabled: true
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    logSuccess('Re-enabled feature flag');
    logInfo(`analytics_enabled: ${response.data.data.isEnabled}`);

    return true;
  } catch (error) {
    logError('Failed to toggle feature flag');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testGetMaintenanceStatus() {
  logSection('Test: Get Maintenance Mode Status');
  try {
    const response = await axios.get(`${BASE_URL}/admin/maintenance`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('Retrieved maintenance status');
    logInfo(`Enabled: ${response.data.data.isEnabled}`);
    logInfo(`Message: ${response.data.data.message}`);

    return true;
  } catch (error) {
    logError('Failed to get maintenance status');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testEnableMaintenanceMode() {
  logSection('Test: Enable Maintenance Mode');
  try {
    const response = await axios.post(
      `${BASE_URL}/admin/maintenance/enable`,
      {
        message: 'System maintenance in progress. We will be back shortly.',
        scheduledEnd: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    logSuccess('Enabled maintenance mode');
    logInfo(`Message: ${response.data.data.message}`);

    return true;
  } catch (error) {
    logError('Failed to enable maintenance mode');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testMaintenanceModeBlocking() {
  logSection('Test: Maintenance Mode Blocking');
  try {
    // Try to access a protected endpoint
    await axios.get(`${BASE_URL}/content`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logError('Maintenance mode did NOT block the request');
    return false;
  } catch (error) {
    if (error.response?.status === 503) {
      logSuccess('Maintenance mode correctly blocked the request');
      logInfo(`Response: ${error.response.data.message}`);
      return true;
    } else {
      logError('Unexpected error response');
      console.error(error.response?.data || error.message);
      return false;
    }
  }
}

async function testDisableMaintenanceMode() {
  logSection('Test: Disable Maintenance Mode');
  try {
    const response = await axios.post(
      `${BASE_URL}/admin/maintenance/disable`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    logSuccess('Disabled maintenance mode');
    logInfo(`Enabled: ${response.data.data.isEnabled}`);

    return true;
  } catch (error) {
    logError('Failed to disable maintenance mode');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testContentModeration() {
  logSection('Test: Content Moderation');
  try {
    // Get all content
    const allContentResponse = await axios.get(`${BASE_URL}/admin/content/all`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('Retrieved all content');
    logInfo(`Total content: ${allContentResponse.data.data.length}`);

    if (allContentResponse.data.data.length > 0) {
      testContentId = allContentResponse.data.data[0].contentId;

      // Feature content
      await axios.post(
        `${BASE_URL}/admin/content/${testContentId}/feature`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      logSuccess('Featured content');

      // Get featured content
      const featuredResponse = await axios.get(`${BASE_URL}/admin/content/featured`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      logInfo(`Featured content count: ${featuredResponse.data.data.length}`);

      // Unfeature content
      await axios.post(
        `${BASE_URL}/admin/content/${testContentId}/unfeature`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      logSuccess('Unfeatured content');
    }

    return true;
  } catch (error) {
    logError('Content moderation tests failed');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testAuthorizationCheck() {
  logSection('Test: Authorization Check (non-admin user)');
  try {
    // Try to access settings without admin role (should fail)
    await axios.get(`${BASE_URL}/admin/settings`, {
      headers: { Authorization: `Bearer invalid_token` }
    });

    logError('Authorization check failed - request should have been blocked');
    return false;
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      logSuccess('Authorization correctly blocked unauthorized access');
      return true;
    } else {
      logError('Unexpected error response');
      console.error(error.response?.data || error.message);
      return false;
    }
  }
}

async function runAllTests() {
  log('\n🧪 System Settings API Test Suite', 'cyan');
  log('Testing all settings, feature flags, and maintenance endpoints\n', 'cyan');

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  const tests = [
    { name: 'Login', fn: login },
    { name: 'Get All Settings', fn: testGetAllSettings },
    { name: 'Get Settings by Category', fn: testGetSettingsByCategory },
    { name: 'Get Category Settings', fn: testGetCategorySettings },
    { name: 'Update Setting', fn: testUpdateSetting },
    { name: 'Bulk Update Settings', fn: testBulkUpdateSettings },
    { name: 'Get Feature Flags', fn: testGetFeatureFlags },
    { name: 'Toggle Feature Flag', fn: testToggleFeatureFlag },
    { name: 'Get Maintenance Status', fn: testGetMaintenanceStatus },
    { name: 'Enable Maintenance Mode', fn: testEnableMaintenanceMode },
    { name: 'Maintenance Mode Blocking', fn: testMaintenanceModeBlocking },
    { name: 'Disable Maintenance Mode', fn: testDisableMaintenanceMode },
    { name: 'Content Moderation', fn: testContentModeration },
    { name: 'Authorization Check', fn: testAuthorizationCheck }
  ];

  for (const test of tests) {
    results.total++;
    const passed = await test.fn();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Print summary
  logSection('Test Summary');
  log(`Total Tests: ${results.total}`, 'cyan');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');

  if (results.failed === 0) {
    log('\n🎉 All tests passed!', 'green');
  } else {
    log(`\n⚠️  ${results.failed} test(s) failed`, 'yellow');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  logError('Test suite failed');
  console.error(error);
  process.exit(1);
});
