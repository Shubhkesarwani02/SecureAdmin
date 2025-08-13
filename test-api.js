const https = require('https');
const http = require('http');

// Test health endpoint
function testHealthEndpoint() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('✅ Health Check Response:');
          console.log(JSON.stringify(jsonData, null, 2));
          resolve(jsonData);
        } catch (error) {
          console.log('Raw response:', data);
          resolve({ raw: data });
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Health Check Failed:', error.message);
      reject(error);
    });

    req.end();
  });
}

// Test API endpoints
async function testAPI() {
  console.log('🔍 Testing Backend API Connection...\n');
  
  try {
    await testHealthEndpoint();
    console.log('\n✅ Backend API is responding correctly!');
  } catch (error) {
    console.log('\n❌ Backend API test failed:', error.message);
  }
}

testAPI();
