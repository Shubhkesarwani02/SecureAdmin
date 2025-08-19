// Test script to verify UserManagement component fix
const fetch = require('node-fetch');

async function testUserEndpoint() {
  try {
    const response = await fetch('http://localhost:5000/api/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real app, we would need a valid auth token
      },
    });

    const data = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('API Response Structure:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check if the response matches what the frontend expects
    if (data.success) {
      console.log('\n✅ Response structure analysis:');
      console.log('- success:', typeof data.success);
      console.log('- data (users array):', Array.isArray(data.data));
      console.log('- pagination object:', typeof data.pagination);
      
      if (data.data && data.data.length > 0) {
        console.log('\n👤 First user structure:');
        const firstUser = data.data[0];
        console.log('- id:', typeof firstUser.id);
        console.log('- fullName:', typeof firstUser.fullName);
        console.log('- email:', typeof firstUser.email);
        console.log('- role:', typeof firstUser.role);
        console.log('- status:', typeof firstUser.status);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
  }
}

testUserEndpoint();
