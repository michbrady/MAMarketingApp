const axios = require('axios');
const API_BASE_URL = 'http://localhost:3001/api/v1';
let authToken = '';
let testContactId = null;
let testFollowUpId = null;

async function authenticate() {
  console.log('\n1. Authenticating...');
  const response = await axios.post(`${API_BASE_URL}/auth/login`, {
    email: 'john.doe@example.com',
    password: 'Test123!'
  });
  authToken = response.data.data.accessToken;
  console.log('✓ Authenticated');
  return response.data.data.user.userId;
}

async function createTestContact() {
  console.log('\n2. Creating test contact...');
  const response = await axios.post(`${API_BASE_URL}/contacts`, {
    firstName: 'Follow', lastName: 'UpTest',
    email: 'followup.test@example.com', mobile: '+15555551234',
    relationshipType: 'Prospect', emailOptIn: true
  }, { headers: { Authorization: `Bearer ${authToken}` } });
  testContactId = response.data.data.contactId;
  console.log(`✓ Contact created: ${testContactId}`);
  return testContactId;
}

async function createFollowUp() {
  console.log('\n3. Creating follow-up...');
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 3);
  const response = await axios.post(`${API_BASE_URL}/followups`, {
    contactId: testContactId, dueDate: dueDate.toISOString(),
    priority: 'High', type: 'Call', notes: 'Test call'
  }, { headers: { Authorization: `Bearer ${authToken}` } });
  testFollowUpId = response.data.data.followUpId;
  console.log(`✓ Follow-up created: ${testFollowUpId}`);
  return response.data.data;
}

async function getUpcoming() {
  console.log('\n4. Getting upcoming follow-ups...');
  const response = await axios.get(`${API_BASE_URL}/followups/upcoming?days=7`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  console.log(`✓ Found ${response.data.data.followUps.length} upcoming`);
  return response.data.data.followUps;
}

async function snoozeFollowUp() {
  console.log('\n5. Snoozing follow-up...');
  const newDate = new Date();
  newDate.setDate(newDate.getDate() + 5);
  const response = await axios.post(`${API_BASE_URL}/followups/${testFollowUpId}/snooze`, {
    newDueDate: newDate.toISOString()
  }, { headers: { Authorization: `Bearer ${authToken}` } });
  console.log(`✓ Snoozed to ${new Date(response.data.data.dueDate).toLocaleDateString()}`);
  return response.data.data;
}

async function completeFollowUp() {
  console.log('\n6. Completing follow-up...');
  const response = await axios.post(`${API_BASE_URL}/followups/${testFollowUpId}/complete`, {
    notes: 'Successfully connected'
  }, { headers: { Authorization: `Bearer ${authToken}` } });
  console.log('✓ Follow-up completed');
  return response.data.data;
}

async function getTemplates() {
  console.log('\n7. Getting templates...');
  const response = await axios.get(`${API_BASE_URL}/followups/templates`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  console.log(`✓ Found ${response.data.data.templates.length} templates`);
  return response.data.data.templates;
}

async function runTests() {
  console.log('\n=== Follow-up API Test ===\n');
  try {
    await authenticate();
    await createTestContact();
    await createFollowUp();
    await getUpcoming();
    await getTemplates();
    await snoozeFollowUp();
    await completeFollowUp();
    console.log('\n✅ All tests passed!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();
