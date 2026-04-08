/**
 * Test Admin Dashboard API
 *
 * Tests all admin dashboard endpoints including:
 * - System metrics
 * - Recent activity feed
 * - System health checks
 * - User growth trends
 * - Content growth trends
 * - Share trends
 * - Engagement metrics
 * - Role authorization
 *
 * Run: node test_admin_api.cjs
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';
let adminToken = '';
let regularToken = '';

// ANSI color codes for output
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

/**
 * Authenticate as admin
 */
async function authenticateAdmin() {
  try {
    logSection('AUTHENTICATION - Admin User');

    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@unfranchise.com',
      password: 'Password123!'
    });

    if (response.data.success && response.data.data.token) {
      adminToken = response.data.data.token;
      logSuccess('Admin authenticated successfully');
      logInfo(`Role: ${response.data.data.user.role}`);
      return true;
    } else {
      logError('Admin authentication failed - no token received');
      return false;
    }
  } catch (error) {
    logError('Admin authentication failed');
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Error: ${JSON.stringify(error.response.data)}`);
    } else {
      logError(`Error: ${error.message}`);
    }
    return false;
  }
}

/**
 * Authenticate as regular user
 */
async function authenticateRegularUser() {
  try {
    logSection('AUTHENTICATION - Regular User');

    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'john.smith@example.com',
      password: 'Password123!'
    });

    if (response.data.success && response.data.data.token) {
      regularToken = response.data.data.token;
      logSuccess('Regular user authenticated successfully');
      logInfo(`Role: ${response.data.data.user.role}`);
      return true;
    } else {
      logError('Regular user authentication failed - no token received');
      return false;
    }
  } catch (error) {
    logError('Regular user authentication failed');
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Error: ${JSON.stringify(error.response.data)}`);
    } else {
      logError(`Error: ${error.message}`);
    }
    return false;
  }
}

/**
 * Test: Get system metrics
 */
async function testGetSystemMetrics() {
  try {
    logSection('TEST: Get System Metrics');

    const response = await axios.get(`${API_BASE_URL}/admin/dashboard/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (response.data.success && response.data.data) {
      const metrics = response.data.data;

      logSuccess('System metrics retrieved successfully');
      log('\nUser Metrics:', 'yellow');
      log(`  Total Users: ${metrics.users.total}`);
      log(`  Active Today: ${metrics.users.activeToday}`);
      log(`  New This Week: ${metrics.users.newThisWeek}`);
      log(`  By Role: ${JSON.stringify(metrics.users.byRole)}`);

      log('\nContent Metrics:', 'yellow');
      log(`  Total Content: ${metrics.content.total}`);
      log(`  Added This Week: ${metrics.content.addedThisWeek}`);

      log('\nShare Metrics:', 'yellow');
      log(`  Total Shares: ${metrics.shares.total}`);
      log(`  Today: ${metrics.shares.todayCount}`);
      log(`  This Week: ${metrics.shares.weeklyCount}`);

      log('\nEngagement Metrics:', 'yellow');
      log(`  Avg Shares/User: ${metrics.engagement.averageSharesPerUser}`);
      log(`  Avg Engagement Rate: ${metrics.engagement.averageEngagementRate}%`);
      log(`  Total Clicks: ${metrics.engagement.totalClicks}`);

      return true;
    } else {
      logError('Failed to get system metrics');
      return false;
    }
  } catch (error) {
    logError('Get system metrics failed');
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Error: ${JSON.stringify(error.response.data)}`);
    } else {
      logError(`Error: ${error.message}`);
    }
    return false;
  }
}

/**
 * Test: Get recent activity
 */
async function testGetRecentActivity() {
  try {
    logSection('TEST: Get Recent Activity');

    const response = await axios.get(`${API_BASE_URL}/admin/dashboard/activity?limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (response.data.success && response.data.data) {
      const activities = response.data.data;

      logSuccess(`Retrieved ${activities.length} recent activities`);

      log('\nRecent Activities:', 'yellow');
      activities.slice(0, 5).forEach((activity, index) => {
        log(`\n${index + 1}. ${activity.eventType.toUpperCase()}`);
        log(`   User: ${activity.userName}`);
        log(`   Time: ${new Date(activity.timestamp).toLocaleString()}`);
        log(`   Description: ${activity.description}`);
      });

      return true;
    } else {
      logError('Failed to get recent activity');
      return false;
    }
  } catch (error) {
    logError('Get recent activity failed');
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Error: ${JSON.stringify(error.response.data)}`);
    } else {
      logError(`Error: ${error.message}`);
    }
    return false;
  }
}

/**
 * Test: Get system health
 */
async function testGetSystemHealth() {
  try {
    logSection('TEST: Get System Health');

    const response = await axios.get(`${API_BASE_URL}/admin/dashboard/health`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (response.data.success && response.data.data) {
      const health = response.data.data;

      logSuccess('System health retrieved successfully');

      log('\nDatabase Health:', 'yellow');
      log(`  Status: ${health.database.status}`);
      log(`  Response Time: ${health.database.responseTime}ms`);
      log(`  Connection Count: ${health.database.connectionCount}`);

      log('\nServer Health:', 'yellow');
      log(`  Status: ${health.server.status}`);
      log(`  Uptime: ${Math.floor(health.server.uptime / 3600)}h ${Math.floor((health.server.uptime % 3600) / 60)}m`);
      log(`  Memory Usage: ${health.server.memoryUsage.percentage.toFixed(2)}%`);
      log(`  CPU Usage: ${health.server.cpuUsage.toFixed(2)}%`);

      log('\nAPI Health:', 'yellow');
      log(`  Avg Response Time: ${health.api.averageResponseTime}ms`);
      log(`  Error Rate: ${health.api.errorRate}%`);

      return true;
    } else {
      logError('Failed to get system health');
      return false;
    }
  } catch (error) {
    logError('Get system health failed');
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Error: ${JSON.stringify(error.response.data)}`);
    } else {
      logError(`Error: ${error.message}`);
    }
    return false;
  }
}

/**
 * Test: Get user growth trends
 */
async function testGetUserGrowth() {
  try {
    logSection('TEST: Get User Growth Trends');

    const response = await axios.get(`${API_BASE_URL}/admin/dashboard/growth/users?days=30`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (response.data.success && response.data.data) {
      const growth = response.data.data;

      logSuccess('User growth trends retrieved successfully');
      log(`\nTotal New Users (30 days): ${growth.total}`);
      log(`Change from Previous Period: ${growth.change > 0 ? '+' : ''}${growth.change.toFixed(2)}%`);
      log(`Data Points: ${growth.labels.length}`);

      if (growth.labels.length > 0) {
        log('\nSample Data (first 5 days):', 'yellow');
        for (let i = 0; i < Math.min(5, growth.labels.length); i++) {
          log(`  ${growth.labels[i]}: ${growth.values[i]} users`);
        }
      }

      return true;
    } else {
      logError('Failed to get user growth trends');
      return false;
    }
  } catch (error) {
    logError('Get user growth trends failed');
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Error: ${JSON.stringify(error.response.data)}`);
    } else {
      logError(`Error: ${error.message}`);
    }
    return false;
  }
}

/**
 * Test: Get content growth trends
 */
async function testGetContentGrowth() {
  try {
    logSection('TEST: Get Content Growth Trends');

    const response = await axios.get(`${API_BASE_URL}/admin/dashboard/growth/content?days=30`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (response.data.success && response.data.data) {
      const growth = response.data.data;

      logSuccess('Content growth trends retrieved successfully');
      log(`\nTotal New Content (30 days): ${growth.total}`);
      log(`Change from Previous Period: ${growth.change > 0 ? '+' : ''}${growth.change.toFixed(2)}%`);
      log(`Data Points: ${growth.labels.length}`);

      return true;
    } else {
      logError('Failed to get content growth trends');
      return false;
    }
  } catch (error) {
    logError('Get content growth trends failed');
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Error: ${JSON.stringify(error.response.data)}`);
    } else {
      logError(`Error: ${error.message}`);
    }
    return false;
  }
}

/**
 * Test: Get share trends
 */
async function testGetShareTrends() {
  try {
    logSection('TEST: Get Share Trends');

    const response = await axios.get(`${API_BASE_URL}/admin/dashboard/growth/shares?days=30`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (response.data.success && response.data.data) {
      const trends = response.data.data;

      logSuccess('Share trends retrieved successfully');
      log(`\nTotal Shares (30 days): ${trends.total}`);
      log(`Change from Previous Period: ${trends.change > 0 ? '+' : ''}${trends.change.toFixed(2)}%`);
      log(`Data Points: ${trends.labels.length}`);

      return true;
    } else {
      logError('Failed to get share trends');
      return false;
    }
  } catch (error) {
    logError('Get share trends failed');
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Error: ${JSON.stringify(error.response.data)}`);
    } else {
      logError(`Error: ${error.message}`);
    }
    return false;
  }
}

/**
 * Test: Get engagement metrics
 */
async function testGetEngagementMetrics() {
  try {
    logSection('TEST: Get Engagement Metrics');

    const response = await axios.get(`${API_BASE_URL}/admin/dashboard/engagement`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (response.data.success && response.data.data) {
      const metrics = response.data.data;

      logSuccess('Engagement metrics retrieved successfully');
      log(`\nAverage Shares per User: ${metrics.averageSharesPerUser}`);
      log(`Average Engagement Rate: ${metrics.averageEngagementRate}%`);

      log('\nTop Performing Content:', 'yellow');
      metrics.topPerformingContent.slice(0, 3).forEach((content, index) => {
        log(`\n${index + 1}. ${content.title}`);
        log(`   Type: ${content.contentType}`);
        log(`   Shares: ${content.totalShares} | Clicks: ${content.totalClicks}`);
        log(`   Engagement Rate: ${content.engagementRate}%`);
      });

      log('\nTop Performing Users:', 'yellow');
      metrics.topPerformingUsers.slice(0, 3).forEach((user, index) => {
        log(`\n${index + 1}. ${user.name}`);
        log(`   Email: ${user.email}`);
        log(`   Shares: ${user.totalShares} | Clicks: ${user.totalClicks}`);
        log(`   Engagement Rate: ${user.engagementRate}%`);
      });

      return true;
    } else {
      logError('Failed to get engagement metrics');
      return false;
    }
  } catch (error) {
    logError('Get engagement metrics failed');
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Error: ${JSON.stringify(error.response.data)}`);
    } else {
      logError(`Error: ${error.message}`);
    }
    return false;
  }
}

/**
 * Test: Role authorization (non-admin should fail)
 */
async function testRoleAuthorization() {
  try {
    logSection('TEST: Role Authorization (Non-Admin Access)');

    const response = await axios.get(`${API_BASE_URL}/admin/dashboard/metrics`, {
      headers: { Authorization: `Bearer ${regularToken}` }
    });

    // If we get here, the authorization didn't work properly
    logError('Non-admin user was able to access admin endpoint (SECURITY ISSUE!)');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 403) {
      logSuccess('Non-admin user correctly denied access (403 Forbidden)');
      logInfo('Role authorization working properly');
      return true;
    } else {
      logError('Unexpected error in authorization test');
      if (error.response) {
        logError(`Status: ${error.response.status}`);
        logError(`Error: ${JSON.stringify(error.response.data)}`);
      } else {
        logError(`Error: ${error.message}`);
      }
      return false;
    }
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║         ADMIN DASHBOARD API TEST SUITE                    ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Authenticate both admin and regular user
  const adminAuth = await authenticateAdmin();
  if (!adminAuth) {
    logError('\nCannot proceed without admin authentication');
    return;
  }

  const userAuth = await authenticateRegularUser();
  if (!userAuth) {
    logError('\nCannot proceed without regular user authentication');
    return;
  }

  // Run all tests
  const tests = [
    { name: 'Get System Metrics', fn: testGetSystemMetrics },
    { name: 'Get Recent Activity', fn: testGetRecentActivity },
    { name: 'Get System Health', fn: testGetSystemHealth },
    { name: 'Get User Growth Trends', fn: testGetUserGrowth },
    { name: 'Get Content Growth Trends', fn: testGetContentGrowth },
    { name: 'Get Share Trends', fn: testGetShareTrends },
    { name: 'Get Engagement Metrics', fn: testGetEngagementMetrics },
    { name: 'Role Authorization', fn: testRoleAuthorization }
  ];

  for (const test of tests) {
    results.total++;
    const passed = await test.fn();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Print summary
  logSection('TEST SUMMARY');
  log(`Total Tests: ${results.total}`, 'cyan');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`,
      results.failed === 0 ? 'green' : 'yellow');

  if (results.failed === 0) {
    log('\n🎉 All tests passed!', 'green');
  } else {
    log(`\n⚠️  ${results.failed} test(s) failed`, 'red');
  }
}

// Run the tests
runTests().catch(error => {
  logError('Test suite failed with error:');
  console.error(error);
  process.exit(1);
});
