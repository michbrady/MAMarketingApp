/**
 * User Management API Test Script
 * Tests all user management, role management, and audit log endpoints
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';
let authToken = '';
let testUserId = null;
let testRoleId = null;

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, colors.yellow);
  log(`  ${message}`, colors.yellow);
  log('='.repeat(60), colors.yellow);
}

async function login() {
  logSection('Authentication');
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@example.com',
      password: 'Admin123!'
    });

    authToken = response.data.token;
    logSuccess('Logged in successfully');
    logInfo(`Token: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetAllUsers() {
  logSection('Get All Users');
  try {
    const response = await axios.get(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        page: 1,
        limit: 10,
        sortBy: 'createdDate',
        sortOrder: 'desc'
      }
    });

    logSuccess(`Retrieved ${response.data.data.length} users`);
    logInfo(`Total users: ${response.data.pagination.total}`);
    logInfo(`Pages: ${response.data.pagination.totalPages}`);

    if (response.data.data.length > 0) {
      const user = response.data.data[0];
      logInfo(`Sample user: ${user.firstName} ${user.lastName} (${user.email})`);
    }

    return true;
  } catch (error) {
    logError(`Get all users failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testCreateUser() {
  logSection('Create New User');
  try {
    const timestamp = Date.now();
    const response = await axios.post(`${API_BASE}/admin/users`, {
      memberId: `TEST${timestamp}`,
      email: `testuser${timestamp}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      password: 'TestUser123!',
      roleId: 1, // UFO role
      marketId: 1, // Default market
      preferredLanguageId: 1, // English
      mobile: '+1234567890',
      timeZone: 'America/New_York'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    testUserId = response.data.data.userId;
    logSuccess(`User created successfully: ID ${testUserId}`);
    logInfo(`Email: ${response.data.data.email}`);
    logInfo(`Role: ${response.data.data.roleName}`);
    logInfo(`Market: ${response.data.data.marketName}`);

    return true;
  } catch (error) {
    logError(`Create user failed: ${error.response?.data?.message || error.message}`);
    console.error(error.response?.data);
    return false;
  }
}

async function testGetUserById() {
  logSection('Get User by ID');
  if (!testUserId) {
    logError('No test user ID available');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE}/admin/users/${testUserId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess(`Retrieved user: ${response.data.data.firstName} ${response.data.data.lastName}`);
    logInfo(`Status: ${response.data.data.status}`);
    logInfo(`Email verified: ${response.data.data.emailVerified}`);
    logInfo(`Total shares: ${response.data.data.stats.totalShares}`);

    return true;
  } catch (error) {
    logError(`Get user by ID failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testUpdateUser() {
  logSection('Update User');
  if (!testUserId) {
    logError('No test user ID available');
    return false;
  }

  try {
    const response = await axios.put(`${API_BASE}/admin/users/${testUserId}`, {
      firstName: 'Updated',
      lastName: 'TestUser',
      timeZone: 'America/Los_Angeles'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('User updated successfully');
    logInfo(`New name: ${response.data.data.firstName} ${response.data.data.lastName}`);
    logInfo(`New timezone: ${response.data.data.timeZone}`);

    return true;
  } catch (error) {
    logError(`Update user failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testAssignRole() {
  logSection('Assign Role to User');
  if (!testUserId) {
    logError('No test user ID available');
    return false;
  }

  try {
    const response = await axios.put(`${API_BASE}/admin/users/${testUserId}/role`, {
      roleId: 1 // UFO
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('Role assigned successfully');
    logInfo(`New role: ${response.data.data.roleName}`);

    return true;
  } catch (error) {
    logError(`Assign role failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testAssignMarket() {
  logSection('Assign Market to User');
  if (!testUserId) {
    logError('No test user ID available');
    return false;
  }

  try {
    const response = await axios.put(`${API_BASE}/admin/users/${testUserId}/market`, {
      marketId: 1
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('Market assigned successfully');
    logInfo(`New market: ${response.data.data.marketName}`);

    return true;
  } catch (error) {
    logError(`Assign market failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testDeactivateUser() {
  logSection('Deactivate User');
  if (!testUserId) {
    logError('No test user ID available');
    return false;
  }

  try {
    const response = await axios.post(`${API_BASE}/admin/users/${testUserId}/deactivate`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('User deactivated successfully');
    logInfo(`Status: ${response.data.data.status}`);

    return true;
  } catch (error) {
    logError(`Deactivate user failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testActivateUser() {
  logSection('Activate User');
  if (!testUserId) {
    logError('No test user ID available');
    return false;
  }

  try {
    const response = await axios.post(`${API_BASE}/admin/users/${testUserId}/activate`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('User activated successfully');
    logInfo(`Status: ${response.data.data.status}`);

    return true;
  } catch (error) {
    logError(`Activate user failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testResetPassword() {
  logSection('Reset User Password');
  if (!testUserId) {
    logError('No test user ID available');
    return false;
  }

  try {
    const response = await axios.post(`${API_BASE}/admin/users/${testUserId}/reset-password`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('Password reset successfully');
    logInfo(`Temporary password: ${response.data.data.temporaryPassword}`);
    logInfo(`Expires at: ${response.data.data.expiresAt}`);

    return true;
  } catch (error) {
    logError(`Reset password failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetUserActivity() {
  logSection('Get User Activity');
  if (!testUserId) {
    logError('No test user ID available');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE}/admin/users/${testUserId}/activity`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { days: 30 }
    });

    logSuccess(`Retrieved ${response.data.data.length} activity events`);
    if (response.data.data.length > 0) {
      const event = response.data.data[0];
      logInfo(`Latest event: ${event.eventType} - ${event.description}`);
    }

    return true;
  } catch (error) {
    logError(`Get user activity failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetAllRoles() {
  logSection('Get All Roles');
  try {
    const response = await axios.get(`${API_BASE}/admin/roles`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess(`Retrieved ${response.data.data.length} roles`);
    response.data.data.forEach(role => {
      logInfo(`${role.roleName} (Level: ${role.permissionLevel}, Users: ${role.userCount})`);
    });

    return true;
  } catch (error) {
    logError(`Get all roles failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetAuditLogs() {
  logSection('Get Audit Logs');
  try {
    const response = await axios.get(`${API_BASE}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        page: 1,
        limit: 10
      }
    });

    logSuccess(`Retrieved ${response.data.data.length} audit logs`);
    logInfo(`Total logs: ${response.data.pagination.total}`);

    if (response.data.data.length > 0) {
      const log = response.data.data[0];
      logInfo(`Latest: ${log.action} on ${log.entityType} by ${log.userEmail}`);
    }

    return true;
  } catch (error) {
    logError(`Get audit logs failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testBulkOperations() {
  logSection('Bulk Operations');

  // Create a second test user for bulk operations
  let testUser2Id = null;
  try {
    const timestamp = Date.now();
    const response = await axios.post(`${API_BASE}/admin/users`, {
      memberId: `BULK${timestamp}`,
      email: `bulktest${timestamp}@example.com`,
      firstName: 'Bulk',
      lastName: 'Test',
      password: 'BulkTest123!',
      roleId: 1,
      marketId: 1,
      preferredLanguageId: 1
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testUser2Id = response.data.data.userId;
    logSuccess(`Created second test user: ID ${testUser2Id}`);
  } catch (error) {
    logError('Failed to create second test user for bulk operations');
    return false;
  }

  // Test bulk status update
  try {
    const response = await axios.post(`${API_BASE}/admin/users/bulk/status`, {
      userIds: [testUserId, testUser2Id],
      status: 'Inactive'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess(`Bulk status update: ${response.data.data.updated} users updated`);
  } catch (error) {
    logError(`Bulk status update failed: ${error.response?.data?.message || error.message}`);
  }

  // Test bulk delete
  try {
    const response = await axios.post(`${API_BASE}/admin/users/bulk/delete`, {
      userIds: [testUserId, testUser2Id]
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess(`Bulk delete: ${response.data.data.deleted} users deleted`);
    return true;
  } catch (error) {
    logError(`Bulk delete failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testUnauthorizedAccess() {
  logSection('Test Unauthorized Access');
  try {
    await axios.get(`${API_BASE}/admin/users`);
    logError('Unauthorized request succeeded (should have failed!)');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      logSuccess('Unauthorized access properly rejected');
      return true;
    } else {
      logError(`Unexpected error: ${error.message}`);
      return false;
    }
  }
}

async function testFilteringAndSearch() {
  logSection('Test Filtering and Search');
  try {
    const response = await axios.get(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        status: 'Active',
        search: 'test',
        sortBy: 'email',
        sortOrder: 'asc',
        page: 1,
        limit: 5
      }
    });

    logSuccess(`Filtered search returned ${response.data.data.length} users`);
    logInfo(`Total matching: ${response.data.pagination.total}`);

    return true;
  } catch (error) {
    logError(`Filtering failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', colors.blue);
  log('║       User Management API Test Suite                      ║', colors.blue);
  log('╚════════════════════════════════════════════════════════════╝', colors.blue);

  const results = {
    passed: 0,
    failed: 0
  };

  const tests = [
    { name: 'Login', fn: login },
    { name: 'Get All Users', fn: testGetAllUsers },
    { name: 'Create User', fn: testCreateUser },
    { name: 'Get User by ID', fn: testGetUserById },
    { name: 'Update User', fn: testUpdateUser },
    { name: 'Assign Role', fn: testAssignRole },
    { name: 'Assign Market', fn: testAssignMarket },
    { name: 'Deactivate User', fn: testDeactivateUser },
    { name: 'Activate User', fn: testActivateUser },
    { name: 'Reset Password', fn: testResetPassword },
    { name: 'Get User Activity', fn: testGetUserActivity },
    { name: 'Get All Roles', fn: testGetAllRoles },
    { name: 'Get Audit Logs', fn: testGetAuditLogs },
    { name: 'Filtering and Search', fn: testFilteringAndSearch },
    { name: 'Bulk Operations', fn: testBulkOperations },
    { name: 'Unauthorized Access', fn: testUnauthorizedAccess }
  ];

  for (const test of tests) {
    const success = await test.fn();
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }

  // Summary
  logSection('Test Summary');
  log(`Total tests: ${results.passed + results.failed}`, colors.blue);
  logSuccess(`Passed: ${results.passed}`);
  if (results.failed > 0) {
    logError(`Failed: ${results.failed}`);
  }

  const successRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
  log(`\nSuccess rate: ${successRate}%`, successRate === '100.0' ? colors.green : colors.yellow);
}

// Run the tests
runAllTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
