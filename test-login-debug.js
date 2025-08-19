const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:5000';

async function testLogin() {
  console.log('🔍 Testing login functionality...\n');
  
  try {
    // Test different user accounts
    const accounts = [
      { email: 'superadmin@framtt.com', password: 'SuperAdmin123!', role: 'superadmin' },
      { email: 'admin@framtt.com', password: 'Admin123!', role: 'admin' },
      { email: 'csm1@framtt.com', password: 'CSM123!', role: 'csm' },
      { email: 'user1@framtt.com', password: 'User123!', role: 'user' }
    ];
    
    let tokens = {};
    
    for (const account of accounts) {
      try {
        console.log(`Testing login for ${account.role}: ${account.email}`);
        
        const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
          email: account.email,
          password: account.password
        });
        
        if (response.status === 200 && response.data.token) {
          console.log(`  ✅ Login successful - Token received`);
          console.log(`  📋 User: ${response.data.user.email} (${response.data.user.role})`);
          tokens[account.role] = response.data.token;
          
          // Test token with protected endpoint
          try {
            const userTestResponse = await axios.get(`${API_BASE_URL}/api/users`, {
              headers: { Authorization: `Bearer ${response.data.token}` }
            });
            console.log(`  ✅ Token works - Protected endpoint accessible`);
          } catch (tokenError) {
            console.log(`  ⚠️  Token test failed: ${tokenError.response?.status} - ${tokenError.response?.data?.message || tokenError.message}`);
          }
        } else {
          console.log(`  ❌ Login failed - No token received`);
        }
        
      } catch (error) {
        console.log(`  ❌ Login failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        
        // Try alternative passwords
        const altPasswords = ['SecurePassword123!', 'password123', 'Password123!'];
        for (const altPassword of altPasswords) {
          try {
            console.log(`    🔄 Trying alternative password...`);
            const altResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
              email: account.email,
              password: altPassword
            });
            
            if (altResponse.status === 200) {
              console.log(`    ✅ Alternative password worked: ${altPassword}`);
              tokens[account.role] = altResponse.data.token;
              break;
            }
          } catch (altError) {
            // Continue trying
          }
        }
      }
      
      console.log('');
    }
    
    console.log('📊 Summary:');
    console.log(`Working tokens: ${Object.keys(tokens).join(', ')}`);
    
    return tokens;
    
  } catch (error) {
    console.error('❌ Error in login testing:', error.message);
  }
}

// Run the test
testLogin().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
