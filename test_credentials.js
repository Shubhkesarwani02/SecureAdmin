const https = require('http');
const querystring = require('querystring');

async function testLogin() {
  console.log('🧪 Testing login credentials...\n');

  const credentials = [
    { email: 'admin@framtt.com', password: 'admin123', note: 'Main admin account' },
    { email: 'superadmin@framtt.com', password: 'admin123', note: 'Super admin account' },
    { email: 'admin.user@framtt.com', password: 'admin123', note: 'Secondary admin account' }
  ];

  for (const cred of credentials) {
    console.log(`Testing: ${cred.email} (${cred.note})`);
    
    const postData = JSON.stringify({
      email: cred.email,
      password: cred.password
    });

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

    try {
      const result = await makeRequest(options, postData);
      
      if (result.success) {
        console.log(`✅ LOGIN SUCCESS for ${cred.email}`);
        console.log(`   Role: ${result.data.user.role}`);
        console.log(`   Name: ${result.data.user.fullName}`);
        console.log(`   Token received: ${result.data.token ? 'Yes' : 'No'}`);
      } else {
        console.log(`❌ LOGIN FAILED for ${cred.email}`);
        console.log(`   Error: ${result.message}`);
      }
    } catch (error) {
      console.log(`❌ REQUEST FAILED for ${cred.email}`);
      console.log(`   Error: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
}

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Run the test
testLogin().catch(console.error);
