import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api/v1';

async function testContentFlow() {
  try {
    console.log('=== Testing Content Display Flow ===\n');

    // Step 1: Login as admin
    console.log('Step 1: Logging in as admin...');
    let token;
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@unfranchise.com',
        password: 'Admin123!'
      });
      token = loginResponse.data.data.token;
      console.log('✓ Login successful');
      console.log('Token:', token.substring(0, 20) + '...\n');
    } catch (error) {
      console.log('✗ Login failed:', error.response?.data || error.message);
      console.log('Note: You may need to create an admin user first\n');
      return;
    }

    // Step 2: Fetch all content
    console.log('Step 2: Fetching all content...');
    try {
      const contentResponse = await axios.get(`${BASE_URL}/admin/content/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✓ Content fetch successful');
      console.log('Response structure:', JSON.stringify(contentResponse.data, null, 2));
      console.log('\nContent items:', contentResponse.data.data?.length || 0);
    } catch (error) {
      console.log('✗ Content fetch failed:', error.response?.data || error.message);
      console.log('Status:', error.response?.status);
    }

    // Step 3: Also test the regular content endpoint
    console.log('\nStep 3: Testing regular /content endpoint...');
    try {
      const regularContentResponse = await axios.get(`${BASE_URL}/content`);
      console.log('✓ Regular content fetch successful');
      console.log('Items:', regularContentResponse.data.data?.items?.length || 0);
    } catch (error) {
      console.log('✗ Regular content fetch failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

testContentFlow();
