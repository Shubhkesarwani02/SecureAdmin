// Simple credential test using fetch
const fetch = require('node-fetch');

async function testCredentials() {
  console.log('🧪 Testing Login Credentials\n');
  
  const testData = [
    { email: 'admin@framtt.com', password: 'admin123' },
    { email: 'superadmin@framtt.com', password: 'admin123' }
  ];

  for (const creds of testData) {
    console.log(`Testing: ${creds.email}`);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(creds)
      });

      const result = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log(`Response:`, result);
      
      if (result.success) {
        console.log('✅ LOGIN SUCCESSFUL!');
      } else {
        console.log('❌ LOGIN FAILED');
      }
      
    } catch (error) {
      console.log('❌ ERROR:', error.message);
    }
    
    console.log('-------------------\n');
  }
}

testCredentials();
