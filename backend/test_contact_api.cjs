/**
 * Contact Management API Test Script
 * Sprint 6: Contact Management & Follow-ups
 *
 * Tests all contact and contact group endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Test credentials
const TEST_USER = {
  email: 'test@unfranchise.com',
  password: 'Test123!@#'
};

// Global variables
let authToken = '';
let testContactId = null;
let testContactId2 = null;
let testGroupId = null;

// Axios instance with auth
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(config => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Helper function to log test results
function logTest(testName, success, data = null) {
  const status = success ? '✓' : '✗';
  console.log(`\n${status} ${testName}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Helper function to handle errors
function handleError(testName, error) {
  console.error(`\n✗ ${testName} FAILED`);
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Data:', error.response.data);
  } else {
    console.error('Error:', error.message);
  }
}

/**
 * Test 1: Login
 */
async function testLogin() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    authToken = response.data.token;
    logTest('Login', true, { token: authToken.substring(0, 20) + '...' });
    return true;
  } catch (error) {
    handleError('Login', error);
    return false;
  }
}

/**
 * Test 2: Create Contact
 */
async function testCreateContact() {
  try {
    const contactData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      mobile: '+1234567890',
      companyName: 'Acme Corp',
      jobTitle: 'Sales Manager',
      relationshipType: 'Prospect',
      tags: ['hot-lead', 'referred'],
      notes: 'Met at networking event',
      emailOptIn: true,
      smsOptIn: true,
      status: 'Active'
    };

    const response = await api.post('/contacts', contactData);
    testContactId = response.data.data.ContactID;
    logTest('Create Contact', true, response.data.data);
    return true;
  } catch (error) {
    handleError('Create Contact', error);
    return false;
  }
}

/**
 * Test 3: Create Second Contact
 */
async function testCreateSecondContact() {
  try {
    const contactData = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      mobile: '+0987654321',
      companyName: 'Tech Solutions',
      jobTitle: 'CEO',
      relationshipType: 'Customer',
      tags: ['vip', 'active'],
      emailOptIn: true,
      smsOptIn: false,
      status: 'Active'
    };

    const response = await api.post('/contacts', contactData);
    testContactId2 = response.data.data.ContactID;
    logTest('Create Second Contact', true, response.data.data);
    return true;
  } catch (error) {
    handleError('Create Second Contact', error);
    return false;
  }
}

/**
 * Test 4: Get Contact
 */
async function testGetContact() {
  try {
    const response = await api.get(`/contacts/${testContactId}`);
    logTest('Get Contact', true, response.data.data);
    return true;
  } catch (error) {
    handleError('Get Contact', error);
    return false;
  }
}

/**
 * Test 5: Update Contact
 */
async function testUpdateContact() {
  try {
    const updates = {
      jobTitle: 'VP of Sales',
      notes: 'Promoted to VP! Very interested in our products.',
      relationshipType: 'Customer'
    };

    const response = await api.put(`/contacts/${testContactId}`, updates);
    logTest('Update Contact', true, response.data.data);
    return true;
  } catch (error) {
    handleError('Update Contact', error);
    return false;
  }
}

/**
 * Test 6: List Contacts
 */
async function testListContacts() {
  try {
    const response = await api.get('/contacts', {
      params: {
        limit: 10,
        offset: 0,
        sortBy: 'updatedDate',
        sortOrder: 'DESC'
      }
    });
    logTest('List Contacts', true, {
      total: response.data.pagination.total,
      count: response.data.data.length
    });
    return true;
  } catch (error) {
    handleError('List Contacts', error);
    return false;
  }
}

/**
 * Test 7: Search Contacts
 */
async function testSearchContacts() {
  try {
    const response = await api.get('/contacts/search', {
      params: { q: 'john' }
    });
    logTest('Search Contacts', true, {
      count: response.data.data.length,
      results: response.data.data.map(c => `${c.FirstName} ${c.LastName}`)
    });
    return true;
  } catch (error) {
    handleError('Search Contacts', error);
    return false;
  }
}

/**
 * Test 8: Add Tag to Contact
 */
async function testAddTag() {
  try {
    const response = await api.post(`/contacts/${testContactId}/tags`, {
      tag: 'premium'
    });
    logTest('Add Tag', true, { tags: response.data.data.Tags });
    return true;
  } catch (error) {
    handleError('Add Tag', error);
    return false;
  }
}

/**
 * Test 9: Remove Tag from Contact
 */
async function testRemoveTag() {
  try {
    const response = await api.delete(`/contacts/${testContactId}/tags/hot-lead`);
    logTest('Remove Tag', true, { tags: response.data.data.Tags });
    return true;
  } catch (error) {
    handleError('Remove Tag', error);
    return false;
  }
}

/**
 * Test 10: Create Contact Group
 */
async function testCreateGroup() {
  try {
    const groupData = {
      groupName: 'VIP Customers',
      description: 'High-value customers and prospects'
    };

    const response = await api.post('/contact-groups', groupData);
    testGroupId = response.data.data.GroupID;
    logTest('Create Contact Group', true, response.data.data);
    return true;
  } catch (error) {
    handleError('Create Contact Group', error);
    return false;
  }
}

/**
 * Test 11: List Contact Groups
 */
async function testListGroups() {
  try {
    const response = await api.get('/contact-groups');
    logTest('List Contact Groups', true, response.data.data);
    return true;
  } catch (error) {
    handleError('List Contact Groups', error);
    return false;
  }
}

/**
 * Test 12: Add Contacts to Group
 */
async function testAddContactsToGroup() {
  try {
    const response = await api.post(`/contact-groups/${testGroupId}/contacts`, {
      contactIds: [testContactId, testContactId2]
    });
    logTest('Add Contacts to Group', true, response.data);
    return true;
  } catch (error) {
    handleError('Add Contacts to Group', error);
    return false;
  }
}

/**
 * Test 13: Get Group Contacts
 */
async function testGetGroupContacts() {
  try {
    const response = await api.get(`/contact-groups/${testGroupId}/contacts`);
    logTest('Get Group Contacts', true, {
      count: response.data.data.length,
      contacts: response.data.data.map(c => `${c.FirstName} ${c.LastName}`)
    });
    return true;
  } catch (error) {
    handleError('Get Group Contacts', error);
    return false;
  }
}

/**
 * Test 14: Get Contact Activity
 */
async function testGetContactActivity() {
  try {
    const response = await api.get(`/contacts/${testContactId}/activity`);
    logTest('Get Contact Activity', true, {
      count: response.data.data.length,
      activities: response.data.data
    });
    return true;
  } catch (error) {
    handleError('Get Contact Activity', error);
    return false;
  }
}

/**
 * Test 15: Update Engagement Score
 */
async function testUpdateEngagementScore() {
  try {
    const response = await api.post(`/contacts/${testContactId}/engagement-score`);
    logTest('Update Engagement Score', true, response.data.data);
    return true;
  } catch (error) {
    handleError('Update Engagement Score', error);
    return false;
  }
}

/**
 * Test 16: Filter Contacts by Status
 */
async function testFilterContacts() {
  try {
    const response = await api.get('/contacts', {
      params: {
        status: 'Active',
        relationshipType: 'Customer'
      }
    });
    logTest('Filter Contacts', true, {
      total: response.data.pagination.total,
      count: response.data.data.length
    });
    return true;
  } catch (error) {
    handleError('Filter Contacts', error);
    return false;
  }
}

/**
 * Test 17: Import Contacts (CSV data as JSON)
 */
async function testImportContacts() {
  try {
    const csvData = [
      {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        mobile: '+1111111111',
        companyName: 'Import Co',
        relationshipType: 'Prospect',
        tags: 'imported,test'
      },
      {
        firstName: 'Bob',
        lastName: 'Williams',
        email: 'bob@example.com',
        mobile: '+2222222222',
        companyName: 'Import LLC',
        relationshipType: 'Lead',
        tags: 'imported'
      }
    ];

    const response = await api.post('/contacts/import', { contacts: csvData });
    logTest('Import Contacts', true, response.data.data);
    return true;
  } catch (error) {
    handleError('Import Contacts', error);
    return false;
  }
}

/**
 * Test 18: Export Contacts (CSV)
 */
async function testExportContacts() {
  try {
    const response = await api.get('/contacts/export', {
      params: { format: 'csv' }
    });
    logTest('Export Contacts (CSV)', true, {
      format: 'csv',
      preview: response.data.substring(0, 200) + '...'
    });
    return true;
  } catch (error) {
    handleError('Export Contacts (CSV)', error);
    return false;
  }
}

/**
 * Test 19: Export Contacts (JSON)
 */
async function testExportContactsJSON() {
  try {
    const response = await api.get('/contacts/export', {
      params: { format: 'json' }
    });
    const data = JSON.parse(response.data);
    logTest('Export Contacts (JSON)', true, {
      format: 'json',
      count: data.length
    });
    return true;
  } catch (error) {
    handleError('Export Contacts (JSON)', error);
    return false;
  }
}

/**
 * Test 20: Update Contact Group
 */
async function testUpdateGroup() {
  try {
    const updates = {
      groupName: 'Premium VIP Customers',
      description: 'Top-tier high-value customers and prospects'
    };

    const response = await api.put(`/contact-groups/${testGroupId}`, updates);
    logTest('Update Contact Group', true, response.data.data);
    return true;
  } catch (error) {
    handleError('Update Contact Group', error);
    return false;
  }
}

/**
 * Test 21: Remove Contact from Group
 */
async function testRemoveContactFromGroup() {
  try {
    const response = await api.delete(`/contact-groups/${testGroupId}/contacts/${testContactId2}`);
    logTest('Remove Contact from Group', true, response.data);
    return true;
  } catch (error) {
    handleError('Remove Contact from Group', error);
    return false;
  }
}

/**
 * Test 22: Delete Contact
 */
async function testDeleteContact() {
  try {
    const response = await api.delete(`/contacts/${testContactId2}`);
    logTest('Delete Contact (Soft)', true, response.data);
    return true;
  } catch (error) {
    handleError('Delete Contact', error);
    return false;
  }
}

/**
 * Test 23: Delete Contact Group
 */
async function testDeleteGroup() {
  try {
    const response = await api.delete(`/contact-groups/${testGroupId}`);
    logTest('Delete Contact Group', true, response.data);
    return true;
  } catch (error) {
    handleError('Delete Contact Group', error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('==========================================');
  console.log('Contact Management API Test Suite');
  console.log('==========================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test User: ${TEST_USER.email}`);
  console.log('==========================================\n');

  const tests = [
    { name: 'Login', fn: testLogin },
    { name: 'Create Contact', fn: testCreateContact },
    { name: 'Create Second Contact', fn: testCreateSecondContact },
    { name: 'Get Contact', fn: testGetContact },
    { name: 'Update Contact', fn: testUpdateContact },
    { name: 'List Contacts', fn: testListContacts },
    { name: 'Search Contacts', fn: testSearchContacts },
    { name: 'Add Tag', fn: testAddTag },
    { name: 'Remove Tag', fn: testRemoveTag },
    { name: 'Create Contact Group', fn: testCreateGroup },
    { name: 'List Contact Groups', fn: testListGroups },
    { name: 'Add Contacts to Group', fn: testAddContactsToGroup },
    { name: 'Get Group Contacts', fn: testGetGroupContacts },
    { name: 'Get Contact Activity', fn: testGetContactActivity },
    { name: 'Update Engagement Score', fn: testUpdateEngagementScore },
    { name: 'Filter Contacts', fn: testFilterContacts },
    { name: 'Import Contacts', fn: testImportContacts },
    { name: 'Export Contacts (CSV)', fn: testExportContacts },
    { name: 'Export Contacts (JSON)', fn: testExportContactsJSON },
    { name: 'Update Contact Group', fn: testUpdateGroup },
    { name: 'Remove Contact from Group', fn: testRemoveContactFromGroup },
    { name: 'Delete Contact', fn: testDeleteContact },
    { name: 'Delete Contact Group', fn: testDeleteGroup }
  ];

  let passedCount = 0;
  let failedCount = 0;

  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passedCount++;
    } else {
      failedCount++;
    }
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n==========================================');
  console.log('Test Summary');
  console.log('==========================================');
  console.log(`Total Tests: ${tests.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log('==========================================\n');

  if (failedCount === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
