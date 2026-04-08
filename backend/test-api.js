import axios from 'axios';

async function testAPI() {
  try {
    console.log('Testing /admin/content/all endpoint...\n');

    // First, let's try without auth to see the error
    try {
      const response = await axios.get('http://localhost:3001/api/v1/admin/content/all');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('Error (expected - need auth):', error.response?.data);
      console.log('Status:', error.response?.status);
    }

    // Check if authentication is required
    console.log('\n--- Authentication is required for this endpoint ---');
    console.log('The frontend should be sending auth token with the request');

  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

testAPI();
