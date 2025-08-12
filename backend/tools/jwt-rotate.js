#!/usr/bin/env node

/**
 * JWT Secret Rotation Script
 * Safely rotates JWT secrets while maintaining existing token validity
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

class JWTRotator {
    constructor() {
        this.envPath = path.join(__dirname, '.env');
        this.backupPath = path.join(__dirname, '.env.backup');
    }

    // Generate a cryptographically secure secret
    generateSecret() {
        return crypto.randomBytes(64).toString('hex');
    }

    // Read current environment configuration
    readEnvConfig() {
        if (!fs.existsSync(this.envPath)) {
            throw new Error('.env file not found');
        }
        return fs.readFileSync(this.envPath, 'utf8');
    }

    // Backup current .env file
    backupEnvFile() {
        const content = this.readEnvConfig();
        fs.writeFileSync(this.backupPath, content);
        console.log(`✅ Backup created: ${this.backupPath}`);
    }

    // Update JWT secrets in .env file
    updateJWTSecrets(newSecret, currentSecret) {
        let content = this.readEnvConfig();

        // Move current secret to previous
        content = content.replace(
            /JWT_PREVIOUS_SECRET=.*/,
            `JWT_PREVIOUS_SECRET=${currentSecret}`
        );

        // Set new secret
        content = content.replace(
            /JWT_SECRET=.*/,
            `JWT_SECRET=${newSecret}`
        );

        // Update rotation timestamp
        const now = new Date().toISOString();
        if (content.includes('JWT_SECRET_LAST_ROTATION=')) {
            content = content.replace(
                /JWT_SECRET_LAST_ROTATION=.*/,
                `JWT_SECRET_LAST_ROTATION=${now}`
            );
        } else {
            content += `\nJWT_SECRET_LAST_ROTATION=${now}`;
        }

        fs.writeFileSync(this.envPath, content);
        console.log('✅ JWT secrets updated in .env file');
    }

    // Extract current JWT secret
    getCurrentSecret() {
        const content = this.readEnvConfig();
        const match = content.match(/JWT_SECRET=(.+)/);
        return match ? match[1].trim() : null;
    }

    // Check if rotation is needed
    checkRotationNeeded() {
        const content = this.readEnvConfig();
        const rotationMatch = content.match(/JWT_SECRET_LAST_ROTATION=(.+)/);
        
        if (!rotationMatch) {
            console.log('⚠️  No rotation timestamp found - rotation recommended');
            return true;
        }

        const lastRotation = new Date(rotationMatch[1].trim());
        const daysSinceRotation = Math.floor((Date.now() - lastRotation.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log(`📅 Last rotation: ${daysSinceRotation} days ago`);
        
        if (daysSinceRotation > 30) {
            console.log('🔄 Rotation recommended (>30 days since last rotation)');
            return true;
        } else if (daysSinceRotation > 21) {
            console.log('⚠️  Rotation due soon (>21 days since last rotation)');
            return false;
        } else {
            console.log('✅ Rotation not needed yet');
            return false;
        }
    }

    // Interactive rotation confirmation
    async confirmRotation() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question('🔄 Proceed with JWT secret rotation? (y/N): ', (answer) => {
                rl.close();
                resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
            });
        });
    }

    // Main rotation process
    async rotateSecrets(force = false) {
        console.log('🔐 JWT Secret Rotation Tool\n');

        try {
            // Check if rotation is needed
            const needsRotation = this.checkRotationNeeded();
            
            if (!needsRotation && !force) {
                const shouldProceed = await this.confirmRotation();
                if (!shouldProceed) {
                    console.log('❌ Rotation cancelled');
                    return;
                }
            }

            // Get current secret
            const currentSecret = this.getCurrentSecret();
            if (!currentSecret) {
                throw new Error('Current JWT_SECRET not found in .env file');
            }

            console.log('📋 Current secret length:', currentSecret.length);

            // Generate new secret
            const newSecret = this.generateSecret();
            console.log('🔑 Generated new secret length:', newSecret.length);

            // Create backup
            this.backupEnvFile();

            // Update secrets
            this.updateJWTSecrets(newSecret, currentSecret);

            console.log('\n✅ JWT Secret Rotation Complete!');
            console.log('\n📝 Next Steps:');
            console.log('   1. Restart your application server');
            console.log('   2. Both old and new tokens will be valid during transition');
            console.log('   3. Monitor logs for any authentication issues');
            console.log('   4. Old tokens will expire based on JWT_EXPIRE setting');
            console.log(`   5. Backup saved to: ${this.backupPath}`);

            // Display rotation schedule
            console.log('\n📅 Rotation Schedule:');
            console.log('   • Recommended: Every 30 days');
            console.log('   • Next rotation due: ' + new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toDateString());

        } catch (error) {
            console.error('❌ Rotation failed:', error.message);
            
            // Restore backup if it exists
            if (fs.existsSync(this.backupPath)) {
                console.log('🔄 Attempting to restore backup...');
                try {
                    const backupContent = fs.readFileSync(this.backupPath, 'utf8');
                    fs.writeFileSync(this.envPath, backupContent);
                    console.log('✅ Backup restored successfully');
                } catch (restoreError) {
                    console.error('❌ Failed to restore backup:', restoreError.message);
                }
            }
        }
    }

    // Display current status
    displayStatus() {
        console.log('🔐 JWT Secret Status\n');

        try {
            const content = this.readEnvConfig();
            
            // Current secret info
            const currentSecret = this.getCurrentSecret();
            if (currentSecret) {
                console.log('🔑 Current JWT Secret:');
                console.log(`   Length: ${currentSecret.length} characters`);
                console.log(`   Preview: ${currentSecret.substring(0, 8)}...${currentSecret.substring(currentSecret.length - 8)}`);
            }

            // Previous secret info
            const prevMatch = content.match(/JWT_PREVIOUS_SECRET=(.+)/);
            if (prevMatch) {
                const prevSecret = prevMatch[1].trim();
                console.log('\n🔑 Previous JWT Secret (for graceful transition):');
                console.log(`   Length: ${prevSecret.length} characters`);
                console.log(`   Preview: ${prevSecret.substring(0, 8)}...${prevSecret.substring(prevSecret.length - 8)}`);
            }

            // Rotation info
            const rotationMatch = content.match(/JWT_SECRET_LAST_ROTATION=(.+)/);
            if (rotationMatch) {
                const lastRotation = new Date(rotationMatch[1].trim());
                const daysSinceRotation = Math.floor((Date.now() - lastRotation.getTime()) / (1000 * 60 * 60 * 24));
                
                console.log('\n📅 Rotation Information:');
                console.log(`   Last rotated: ${lastRotation.toDateString()} (${daysSinceRotation} days ago)`);
                console.log(`   Next recommended: ${new Date(lastRotation.getTime() + 30 * 24 * 60 * 60 * 1000).toDateString()}`);
                
                if (daysSinceRotation > 30) {
                    console.log('   Status: 🔴 Rotation overdue');
                } else if (daysSinceRotation > 21) {
                    console.log('   Status: 🟡 Rotation due soon');
                } else {
                    console.log('   Status: 🟢 Up to date');
                }
            } else {
                console.log('\n📅 Rotation Information: ⚠️  No rotation history found');
            }

        } catch (error) {
            console.error('❌ Failed to read status:', error.message);
        }
    }
}

// CLI interface
if (require.main === module) {
    const rotator = new JWTRotator();
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log('🔐 JWT Secret Rotation Tool\n');
        console.log('Usage:');
        console.log('  node jwt-rotate.js [options]\n');
        console.log('Options:');
        console.log('  --rotate, -r     Rotate JWT secrets');
        console.log('  --force, -f      Force rotation without confirmation');
        console.log('  --status, -s     Show current JWT secret status');
        console.log('  --help, -h       Show this help message\n');
        console.log('Examples:');
        console.log('  node jwt-rotate.js --status');
        console.log('  node jwt-rotate.js --rotate');
        console.log('  node jwt-rotate.js --rotate --force');
    } else if (args.includes('--status') || args.includes('-s')) {
        rotator.displayStatus();
    } else if (args.includes('--rotate') || args.includes('-r')) {
        const force = args.includes('--force') || args.includes('-f');
        rotator.rotateSecrets(force);
    } else {
        rotator.displayStatus();
    }
}

module.exports = JWTRotator;
