// Test credentials using built-in Node.js modules
const http = require('http');

function testLogin(email, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ email, password });
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: { error: 'Invalid JSON', raw: data } });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Login Credentials\n');
  
  const credentials = [
    { email: 'admin@framtt.com', password: 'admin123' },
    { email: 'superadmin@framtt.com', password: 'admin123' }
  ];

  for (const cred of credentials) {
    console.log(`📧 Testing: ${cred.email}`);
    
    try {
      const result = await testLogin(cred.email, cred.password);
      
      console.log(`   📊 Status Code: ${result.status}`);
      
      if (result.status === 200 && result.data.success) {
        console.log('   ✅ LOGIN SUCCESSFUL!');
        console.log(`   👤 User: ${result.data.data.user.fullName}`);
        console.log(`   🔑 Role: ${result.data.data.user.role}`);
        console.log(`   🎯 Token: ${result.data.data.token ? 'Received' : 'Missing'}`);
      } else {
        console.log('   ❌ LOGIN FAILED');
        console.log(`   📝 Message: ${result.data.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.log('   ❌ CONNECTION ERROR:', error.message);
    }
    
    console.log(''); // Empty line
  }
  
  console.log('🎯 Test completed! Try logging in via browser now.');
}

runTests();
