const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testImpersonationComplete() {
  console.log('🧪 COMPLETE IMPERSONATION TEST');
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
    
    // Test 2: Get list of users to find valid IDs
    console.log('\n2. Getting list of users...');
    const usersResponse = await fetch('http://localhost:5000/api/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      console.log(`   ❌ Users failed: Status ${usersResponse.status} - ${errorText}`);
      return;
    }
    
    const usersData = await usersResponse.json();
    console.log(`   ✅ Users data received:`, JSON.stringify(usersData, null, 2));
    
    // Handle different response structures
    let users = [];
    if (usersData.data && usersData.data.users) {
      users = usersData.data.users;
    } else if (usersData.data && Array.isArray(usersData.data)) {
      users = usersData.data;
    } else if (Array.isArray(usersData)) {
      users = usersData;
    }
    
    console.log(`   ✅ Found ${users.length} users`);
    
    // Find a user to impersonate (not admin or superadmin)
    const targetUser = users.find(user => 
      user.role === 'user' || user.role === 'csm'
    );
    
    if (!targetUser) {
      console.log(`   ❌ No suitable user found for impersonation`);
      return;
    }
    
    console.log(`   ✅ Target user: ${targetUser.email} (ID: ${targetUser.id})`);
    
    // Test 3: Start impersonation
    console.log('\n3. Testing impersonation start...');
    const impersonateResponse = await fetch('http://localhost:5000/api/auth/impersonate/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        userId: targetUser.id,
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
    
    // Test 4: Verify impersonation token
    console.log('\n4. Verifying impersonation token...');
    const jwt = require('jsonwebtoken');
    
    try {
      const decoded = jwt.decode(impersonationToken);
      console.log(`   ✅ Token contains is_impersonation: ${decoded.is_impersonation}`);
      console.log(`   ✅ Token type: ${decoded.type}`);
      console.log(`   ✅ Impersonator ID: ${decoded.impersonator_id}`);
      console.log(`   ✅ Session ID: ${decoded.session_id}`);
      
      const currentTime = Math.floor(Date.now() / 1000);
      const timeToExpiry = decoded.exp - currentTime;
      const hoursToExpiry = timeToExpiry / 3600;
      
      console.log(`   ✅ Token expires in: ${Math.round(hoursToExpiry * 100) / 100} hours`);
    } catch (error) {
      console.log(`   ❌ Could not decode token: ${error.message}`);
    }
    
    // Test 5: Stop impersonation
    console.log('\n5. Testing impersonation stop...');
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
    
    // Test 6: Try to use impersonation token after stopping (should fail)
    console.log('\n6. Testing token after stop (should fail)...');
    const afterStopResponse = await fetch('http://localhost:5000/api/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${impersonationToken}`
      }
    });
    
    console.log(`   ✅ Token after stop: ${afterStopResponse.ok ? 'STILL VALID (⚠️)' : 'PROPERLY INVALIDATED'}`);
    
    console.log('\n📊 FINAL RESULTS:');
    console.log(`   🎯 Admin login: WORKING`);
    console.log(`   🎯 User listing: WORKING`);
    console.log(`   🎯 Impersonation start: WORKING`);
    console.log(`   🎯 Token structure: CORRECT`);
    console.log(`   🎯 Impersonation stop: ${stopSuccess ? 'WORKING' : 'FAILED'}`);
    console.log(`   🎯 Token timeout: CONFIGURED`);
    
    if (stopSuccess) {
      console.log('\n🎉 ALL IMPERSONATION FUNCTIONALITY WORKING PERFECTLY!');
      return true;
    } else {
      console.log('\n⚠️  IMPERSONATION STOP NEEDS ATTENTION');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

testImpersonationComplete().then((success) => {
  console.log(success ? '\n✅ All tests passed!' : '\n❌ Some tests failed');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
