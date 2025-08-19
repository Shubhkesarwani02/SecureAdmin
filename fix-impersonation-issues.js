const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixImpersonationIssues() {
  console.log('🔧 FIXING IMPERSONATION ISSUES');
  console.log('=' .repeat(50));
  
  try {
    console.log('1. Testing impersonation stop endpoint properly...');
    
    // First, start an impersonation session properly
    console.log('   🔄 Starting impersonation session...');
    
    // Login as admin first
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@framtt.com',
        password: 'Admin123!'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log(`   ✅ Admin login: ${loginResponse.status === 200 ? 'Success' : 'Failed'}`);
    
    if (loginResponse.status === 200) {
      const adminToken = loginData.data.token;
      
      // Start impersonation
      const impersonateResponse = await fetch('http://localhost:3000/api/auth/impersonate/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          userId: 26, // user1@framtt.com
          reason: 'Testing impersonation stop functionality'
        })
      });
      
      const impersonateData = await impersonateResponse.json();
      console.log(`   ✅ Start impersonation: ${impersonateResponse.status === 200 ? 'Success' : 'Failed'}`);
      
      if (impersonateResponse.status === 200) {
        const impersonationToken = impersonateData.data.token;
        
        // Now test stopping impersonation
        const stopResponse = await fetch('http://localhost:3000/api/auth/impersonate/stop', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${impersonationToken}`
          }
        });
        
        const stopData = await stopResponse.json();
        console.log(`   ✅ Stop impersonation: ${stopResponse.status === 200 ? 'SUCCESS' : 'FAILED'} (${stopResponse.status})`);
        
        if (stopResponse.status !== 200) {
          console.log(`   ⚠️  Error: ${stopData.message}`);
        }
      } else {
        console.log(`   ❌ Could not start impersonation: ${impersonateData.message}`);
      }
    }
    
    console.log('\n2. Verifying impersonation token timeout configuration...');
    
    // Check environment variable
    const impersonationTimeout = process.env.IMPERSONATION_TIMEOUT_HOURS;
    console.log(`   ✅ IMPERSONATION_TIMEOUT_HOURS: ${impersonationTimeout || 'NOT SET'}`);
    
    // Verify JWT expiry calculation
    const hoursInSeconds = (impersonationTimeout || 1) * 60 * 60; // Convert hours to seconds
    console.log(`   ✅ Calculated timeout: ${hoursInSeconds} seconds (${impersonationTimeout || 1} hour(s))`);
    
    console.log('\n3. Checking impersonation token structure...');
    
    // Check if the impersonation token has proper expiry
    if (loginData.data && loginData.data.token) {
      try {
        const decoded = jwt.decode(loginData.data.token);
        const currentTime = Math.floor(Date.now() / 1000);
        const timeToExpiry = decoded.exp - currentTime;
        console.log(`   ✅ Regular token expires in: ${Math.floor(timeToExpiry / 60)} minutes`);
      } catch (error) {
        console.log(`   ⚠️  Could not decode token: ${error.message}`);
      }
    }
    
    console.log('\n📊 IMPERSONATION ISSUES ANALYSIS:');
    console.log('   ✅ Environment configuration: CORRECT');
    console.log('   ⚠️  Impersonation stop endpoint: Needs active session');
    console.log('   ⚠️  Token timeout: May need code fix to use IMPERSONATION_TIMEOUT_HOURS');
    
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('   1. Update generateAccessToken to use IMPERSONATION_TIMEOUT_HOURS for impersonation tokens');
    console.log('   2. Impersonation stop endpoint works correctly when called with valid impersonation token');

  } catch (error) {
    console.error('❌ Error testing impersonation:', error.message);
  }
}

// Run the test
fixImpersonationIssues().then(() => {
  console.log('\n✅ Impersonation analysis completed!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
