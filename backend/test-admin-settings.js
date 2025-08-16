const http = require('http');

const testAdminSettings = async () => {
  console.log('🧪 Testing Admin Settings Endpoint...\n');
  
  // First, get a superadmin token
  console.log('1. Getting superadmin token...');
  
  const loginData = JSON.stringify({
    email: 'superadmin@framtt.com',
    password: 'admin123'
  });
  
  const loginOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };
  
  return new Promise((resolve, reject) => {
    const loginReq = http.request(loginOptions, (loginRes) => {
      let loginResponseData = '';
      
      loginRes.on('data', (chunk) => {
        loginResponseData += chunk;
      });
      
      loginRes.on('end', () => {
        try {
          const loginResult = JSON.parse(loginResponseData);
          
          if (loginResult.success) {
            const token = loginResult.data.token;
            console.log('   ✅ Login successful, got token');
            
            // Now test the admin settings endpoint
            console.log('\n2. Testing admin settings endpoint...');
            
            const settingsOptions = {
              hostname: 'localhost',
              port: 5000,
              path: '/api/admin/settings',
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            };
            
            const settingsReq = http.request(settingsOptions, (settingsRes) => {
              let settingsResponseData = '';
              
              settingsRes.on('data', (chunk) => {
                settingsResponseData += chunk;
              });
              
              settingsRes.on('end', () => {
                console.log(`   Status Code: ${settingsRes.statusCode}`);
                console.log(`   Response: ${settingsResponseData}`);
                
                if (settingsRes.statusCode === 200) {
                  console.log('   ✅ Admin Settings: SUCCESS');
                } else {
                  console.log('   ❌ Admin Settings: FAILED');
                }
                
                resolve();
              });
            });
            
            settingsReq.on('error', (error) => {
              console.log(`   ❌ Request Error: ${error.message}`);
              resolve();
            });
            
            settingsReq.end();
            
          } else {
            console.log(`   ❌ Login failed: ${loginResult.message}`);
            resolve();
          }
        } catch (error) {
          console.log(`   ❌ Login parse error: ${error.message}`);
          resolve();
        }
      });
    });
    
    loginReq.on('error', (error) => {
      console.log(`   ❌ Login request error: ${error.message}`);
      resolve();
    });
    
    loginReq.write(loginData);
    loginReq.end();
  });
};

testAdminSettings().catch(console.error);
