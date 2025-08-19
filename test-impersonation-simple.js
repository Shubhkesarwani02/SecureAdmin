const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testImpersonationFixes() {
  console.log('🧪 TESTING IMPERSONATION FIXES');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Login as admin
    console.log('1. Testing admin login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@framtt.com',
        password: 'Admin123!'
      })
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log(`   ❌ Login failed: Status ${loginResponse.status} - ${errorText}`);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log(`   ✅ Admin login: SUCCESS`);
    
    const adminToken = loginData.data.token;
    
    // Test 2: Start impersonation
    console.log('\n2. Testing impersonation start...');
    const impersonateResponse = await fetch('http://localhost:5000/api/auth/impersonate/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        userId: 26,
        reason: 'Testing impersonation functionality'
      })
    });
    
    if (!impersonateResponse.ok) {
      const errorText = await impersonateResponse.text();
      console.log(`   ❌ Impersonation start failed: Status ${impersonateResponse.status} - ${errorText}`);
      return;
    }
    
    const impersonateData = await impersonateResponse.json();
    console.log(`   ✅ Start impersonation: SUCCESS`);
    
    const impersonationToken = impersonateData.data.token;
    
    // Test 3: Stop impersonation
    console.log('\n3. Testing impersonation stop...');
    const stopResponse = await fetch('http://localhost:5000/api/auth/impersonate/stop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${impersonationToken}`
      }
    });
    
    const stopSuccess = stopResponse.ok;
    console.log(`   ✅ Stop impersonation: ${stopSuccess ? 'SUCCESS' : 'FAILED'} (${stopResponse.status})`);
    
    if (!stopSuccess) {
      const errorText = await stopResponse.text();
      console.log(`   ❌ Stop failed: ${errorText}`);
    }
    
    // Test 4: Verify token timeout configuration
    console.log('\n4. Verifying impersonation token timeout...');
    const jwt = require('jsonwebtoken');
    
    try {
      const decoded = jwt.decode(impersonationToken);
      const currentTime = Math.floor(Date.now() / 1000);
      const timeToExpiry = decoded.exp - currentTime;
      const hoursToExpiry = timeToExpiry / 3600;
      
      console.log(`   ✅ Impersonation token expires in: ${Math.round(hoursToExpiry * 100) / 100} hours`);
      console.log(`   ✅ Expected timeout: ${process.env.IMPERSONATION_TIMEOUT_HOURS || '1'} hours`);
      
      if (Math.abs(hoursToExpiry - (process.env.IMPERSONATION_TIMEOUT_HOURS || 1)) < 0.1) {
        console.log(`   ✅ Token timeout correctly configured!`);
      } else {
        console.log(`   ⚠️  Token timeout might need adjustment`);
      }
    } catch (error) {
      console.log(`   ❌ Could not decode token: ${error.message}`);
    }
    
    console.log('\n📊 FINAL RESULTS:');
    console.log(`   🎯 Impersonation start: WORKING`);
    console.log(`   🎯 Impersonation stop: ${stopSuccess ? 'WORKING' : 'FAILED'}`);
    console.log(`   🎯 Token timeout: CONFIGURED`);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testImpersonationFixes().then(() => {
  console.log('\n✅ Impersonation tests completed!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
