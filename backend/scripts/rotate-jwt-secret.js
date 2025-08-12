const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('\n🔑 JWT Secret Rotation Script\n');

// Generate a new strong JWT secret
function generateStrongSecret() {
  return crypto.randomBytes(64).toString('hex');
}

// Read current environment variables
function getCurrentConfig() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  .env file not found. Please create one from .env.example');
    return null;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const currentSecret = envContent.match(/JWT_SECRET=(.+)/)?.[1];
  const previousSecret = envContent.match(/JWT_PREVIOUS_SECRET=(.+)/)?.[1];
  
  return {
    envContent,
    currentSecret,
    previousSecret
  };
}

// Update .env file with new secrets
function updateEnvFile(envContent, newSecret, currentSecret) {
  let updatedContent = envContent;
  
  // Update JWT_PREVIOUS_SECRET with current secret
  if (updatedContent.includes('JWT_PREVIOUS_SECRET=')) {
    updatedContent = updatedContent.replace(
      /JWT_PREVIOUS_SECRET=.+/,
      `JWT_PREVIOUS_SECRET=${currentSecret}`
    );
  } else {
    // Add JWT_PREVIOUS_SECRET if it doesn't exist
    const jwtSecretLine = updatedContent.match(/JWT_SECRET=.+/)?.[0];
    if (jwtSecretLine) {
      updatedContent = updatedContent.replace(
        jwtSecretLine,
        `${jwtSecretLine}\nJWT_PREVIOUS_SECRET=${currentSecret}`
      );
    }
  }
  
  // Update JWT_SECRET with new secret
  updatedContent = updatedContent.replace(
    /JWT_SECRET=.+/,
    `JWT_SECRET=${newSecret}`
  );
  
  // Update rotation timestamp
  const rotationDate = new Date().toISOString();
  if (updatedContent.includes('JWT_SECRET_LAST_ROTATION=')) {
    updatedContent = updatedContent.replace(
      /JWT_SECRET_LAST_ROTATION=.+/,
      `JWT_SECRET_LAST_ROTATION=${rotationDate}`
    );
  } else {
    // Add rotation timestamp if it doesn't exist
    const jwtSecretLine = updatedContent.match(/JWT_SECRET=.+/)?.[0];
    if (jwtSecretLine) {
      updatedContent = updatedContent.replace(
        jwtSecretLine,
        `${jwtSecretLine}\nJWT_SECRET_LAST_ROTATION=${rotationDate}`
      );
    }
  }
  
  return updatedContent;
}

// Main rotation function
async function rotateJWTSecret() {
  console.log('🔄 Starting JWT secret rotation...\n');
  
  // Get current configuration
  const config = getCurrentConfig();
  if (!config) {
    process.exit(1);
  }
  
  const { envContent, currentSecret, previousSecret } = config;
  
  if (!currentSecret) {
    console.log('❌ No JWT_SECRET found in .env file');
    process.exit(1);
  }
  
  console.log(`📋 Current JWT secret: ${currentSecret.substring(0, 10)}...`);
  if (previousSecret) {
    console.log(`📋 Previous JWT secret: ${previousSecret.substring(0, 10)}...`);
  }
  
  // Generate new secret
  const newSecret = generateStrongSecret();
  console.log(`🆕 New JWT secret: ${newSecret.substring(0, 10)}...`);
  
  // Create backup of current .env
  const backupPath = path.join(__dirname, `.env.backup.${Date.now()}`);
  fs.writeFileSync(backupPath, envContent);
  console.log(`💾 Backup created: ${backupPath}`);
  
  // Update .env file
  const updatedContent = updateEnvFile(envContent, newSecret, currentSecret);
  fs.writeFileSync(path.join(__dirname, '.env'), updatedContent);
  
  console.log('\n✅ JWT secret rotation completed!');
  console.log('\n📝 What happened:');
  console.log('   • Previous JWT_SECRET moved to JWT_PREVIOUS_SECRET');
  console.log('   • New JWT_SECRET generated and set');
  console.log('   • Rotation timestamp updated');
  console.log('   • Backup of old .env created');
  
  console.log('\n⚠️  Important Notes:');
  console.log('   • Restart your application server to apply changes');
  console.log('   • Existing tokens will be validated with both secrets during transition');
  console.log('   • Users with old tokens can continue using them until expiry');
  console.log('   • New tokens will be signed with the new secret');
  
  console.log('\n🔄 Next rotation recommended after 30 days');
  
  return {
    newSecret: newSecret.substring(0, 10) + '...',
    previousSecret: currentSecret.substring(0, 10) + '...',
    rotationDate: new Date().toISOString()
  };
}

// Check if this script is being run directly
if (require.main === module) {
  rotateJWTSecret()
    .then(() => {
      console.log('\n🎉 Secret rotation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error during rotation:', error.message);
      process.exit(1);
    });
}

module.exports = {
  rotateJWTSecret,
  generateStrongSecret
};
