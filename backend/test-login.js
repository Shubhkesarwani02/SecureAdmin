// Test Login Functionality
const http = require('http');

async function testLogin() {
  console.log('🔍 Testing Login Functionality...\n');

  const postData = JSON.stringify({
    email: 'admin@framtt.com',
    password: 'admin123'
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

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Response Headers:`, res.headers);
        console.log(`Response Body:`, data);
        
        try {
          const jsonData = JSON.parse(data);
          if (res.statusCode === 200 && jsonData.success) {
            console.log('\n✅ Login test PASSED!');
            console.log('🎉 Authentication is working correctly');
          } else {
            console.log('\n❌ Login test FAILED!');
            console.log('Error:', jsonData.message || 'Unknown error');
          }
        } catch (e) {
          console.log('\n❌ Login test FAILED!');
          console.log('Invalid JSON response:', data);
        }
        
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`\n❌ Connection Error: ${err.message}`);
      console.log('Make sure the server is running on localhost:5000');
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

// First check if server is running
console.log('Checking if server is running on localhost:5000...\n');

const checkOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/health',
  method: 'GET',
  timeout: 3000
};

const healthReq = http.request(checkOptions, (res) => {
  console.log('✅ Server is running!');
  console.log('Running login test...\n');
  testLogin();
});

healthReq.on('error', (err) => {
  console.log('⚠️ Server not running or health check failed');
  console.log('Attempting login test anyway...\n');
  testLogin();
});

healthReq.on('timeout', () => {
  console.log('⚠️ Health check timeout');
  console.log('Attempting login test anyway...\n');
  testLogin();
});

healthReq.end();
