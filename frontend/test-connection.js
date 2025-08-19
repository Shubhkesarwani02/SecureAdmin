// Frontend Supabase Connection Diagnostic
import { supabase } from './src/utils/supabase/client.js';

async function testFrontendConnection() {
  console.log('🔍 Testing Frontend Supabase Connection...');
  
  try {
    // Test 1: Check configuration
    console.log('📋 Configuration Check:');
    const config = supabase.supabaseUrl;
    console.log('Supabase URL:', config);
    
    // Test 2: Test auth service
    console.log('🔐 Testing Auth Service...');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('❌ Auth Error:', sessionError);
    } else {
      console.log('✅ Auth service working');
    }
    
    // Test 3: Test database connection
    console.log('🗄️ Testing Database Connection...');
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Database Error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('✅ Database connection successful');
    }
    
    // Test 4: Check network connectivity
    console.log('🌐 Testing Network Connectivity...');
    try {
      const response = await fetch('https://wqpkqjxsuqburhksoafb.supabase.co/rest/v1/', {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcGtxanhzdXFidXJoa3NvYWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0OTU0NTQsImV4cCI6MjA3MTA3MTQ1NH0.FfTT5TUWqbc6cXqDIThP7Sybl-vVvP82hhAXm1t31I4'
        }
      });
      
      if (response.ok) {
        console.log('✅ Network connectivity successful');
      } else {
        console.error('❌ Network Error:', response.status, response.statusText);
      }
    } catch (networkError) {
      console.error('❌ Network Error:', networkError);
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

// Run the test when page loads
testFrontendConnection();
