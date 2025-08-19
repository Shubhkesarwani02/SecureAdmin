// Test backend database service
require('dotenv').config();
const { testConnection } = require('./services/database');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

async function testBackendConnection() {
  console.log(`${colors.blue}${colors.bright}=== Backend Database Service Test ===${colors.reset}\n`);
  
  console.log(`${colors.yellow}Testing connection with backend database service...${colors.reset}`);
  
  try {
    const isConnected = await testConnection();
    
    if (isConnected) {
      console.log(`${colors.green}${colors.bright}🎉 Backend database service connected successfully!${colors.reset}`);
      console.log(`${colors.green}The backend server should now start without database connection errors.${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Backend database service connection failed.${colors.reset}`);
      console.log(`${colors.yellow}Check the database configuration in the backend.${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error testing backend database service:${colors.reset}`);
    console.error(error.message);
  }
  
  console.log(`\n${colors.blue}Environment check:${colors.reset}`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'Present' : 'Missing'}`);
  console.log(`DB_HOST: ${process.env.DB_HOST || 'Not set'}`);
  console.log(`DB_SSL: ${process.env.DB_SSL || 'Not set'}`);
}

testBackendConnection().catch(console.error);
