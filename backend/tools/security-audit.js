#!/usr/bin/env node

/**
 * Security Audit and Monitoring Script
 * Performs ongoing security checks and generates reports
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecurityAuditor {
    constructor() {
        this.findings = [];
        this.recommendations = [];
        this.alerts = [];
    }

    // Check JWT secret strength
    checkJWTSecurity() {
        console.log('🔐 Checking JWT Security...');
        
        const envPath = path.join(__dirname, '.env');
        if (!fs.existsSync(envPath)) {
            this.findings.push('❌ .env file not found');
            return;
        }

        const envContent = fs.readFileSync(envPath, 'utf8');
        const jwtSecretMatch = envContent.match(/JWT_SECRET=(.+)/);
        
        if (!jwtSecretMatch) {
            this.findings.push('❌ JWT_SECRET not found in .env');
            return;
        }

        const jwtSecret = jwtSecretMatch[1].trim();
        
        // Check secret strength
        if (jwtSecret.length < 32) {
            this.findings.push('⚠️ JWT_SECRET is too short (< 32 characters)');
            this.recommendations.push('Generate a stronger JWT secret with at least 32 characters');
        } else if (jwtSecret.length < 64) {
            this.findings.push('⚠️ JWT_SECRET could be stronger (< 64 characters)');
            this.recommendations.push('Consider using a 64+ character JWT secret for maximum security');
        } else {
            this.findings.push('✅ JWT_SECRET length is adequate');
        }

        // Check if using default/weak secrets
        const weakSecrets = [
            'your-super-secret-jwt-key',
            'change-this-in-production',
            'secret',
            'password',
            '123456'
        ];

        if (weakSecrets.some(weak => jwtSecret.toLowerCase().includes(weak.toLowerCase()))) {
            this.findings.push('❌ JWT_SECRET appears to be using default/weak value');
            this.alerts.push('CRITICAL: Change JWT_SECRET immediately');
        }

        // Check rotation date
        const rotationMatch = envContent.match(/JWT_SECRET_LAST_ROTATION=(.+)/);
        if (rotationMatch) {
            const lastRotation = new Date(rotationMatch[1].trim());
            const daysSinceRotation = Math.floor((Date.now() - lastRotation.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysSinceRotation > 30) {
                this.findings.push(`⚠️ JWT secret hasn't been rotated in ${daysSinceRotation} days`);
                this.recommendations.push('Rotate JWT secret (recommended every 30 days)');
            } else {
                this.findings.push(`✅ JWT secret rotated ${daysSinceRotation} days ago`);
            }
        }
    }

    // Check password security
    checkPasswordSecurity() {
        console.log('🔒 Checking Password Security...');

        const authControllerPath = path.join(__dirname, 'controllers', 'authController.js');
        if (fs.existsSync(authControllerPath)) {
            const content = fs.readFileSync(authControllerPath, 'utf8');
            
            if (content.includes('bcrypt')) {
                this.findings.push('✅ bcrypt is being used for password hashing');
                
                // Check bcrypt rounds
                const roundsMatch = content.match(/bcrypt\.hash.*?(\d+)/);
                if (roundsMatch) {
                    const rounds = parseInt(roundsMatch[1]);
                    if (rounds < 10) {
                        this.findings.push(`⚠️ bcrypt rounds too low: ${rounds}`);
                        this.recommendations.push('Use at least 10 bcrypt rounds (12+ recommended)');
                    } else if (rounds < 12) {
                        this.findings.push(`⚠️ bcrypt rounds could be higher: ${rounds}`);
                        this.recommendations.push('Consider using 12+ bcrypt rounds for better security');
                    } else {
                        this.findings.push(`✅ bcrypt rounds are adequate: ${rounds}`);
                    }
                }
            } else {
                this.findings.push('❌ bcrypt not found in auth controller');
                this.alerts.push('CRITICAL: Implement bcrypt for password hashing');
            }
        }
    }

    // Check rate limiting
    checkRateLimiting() {
        console.log('⏱️ Checking Rate Limiting...');

        const rateLimitPath = path.join(__dirname, 'middleware', 'rateLimiting.js');
        if (fs.existsSync(rateLimitPath)) {
            this.findings.push('✅ Rate limiting middleware exists');
            
            const content = fs.readFileSync(rateLimitPath, 'utf8');
            if (content.includes('express-rate-limit') || content.includes('rateLimit')) {
                this.findings.push('✅ Rate limiting implementation found');
            } else {
                this.findings.push('⚠️ Rate limiting implementation not clear');
            }
        } else {
            this.findings.push('❌ Rate limiting middleware not found');
            this.alerts.push('HIGH: Implement rate limiting for authentication endpoints');
        }
    }

    // Check audit logging
    checkAuditLogging() {
        console.log('📝 Checking Audit Logging...');

        const auditControllerPath = path.join(__dirname, 'controllers', 'auditController.js');
        if (fs.existsSync(auditControllerPath)) {
            this.findings.push('✅ Audit controller exists');
            
            const content = fs.readFileSync(auditControllerPath, 'utf8');
            if (content.includes('logAction') || content.includes('audit')) {
                this.findings.push('✅ Audit logging functions found');
            }
        } else {
            this.findings.push('⚠️ Audit controller not found');
        }

        // Check for logs directory
        const logsDir = path.join(__dirname, 'logs');
        if (fs.existsSync(logsDir)) {
            this.findings.push('✅ Logs directory exists');
        } else {
            this.findings.push('⚠️ Logs directory not found');
            this.recommendations.push('Create logs directory for audit trails');
        }
    }

    // Check impersonation security
    checkImpersonationSecurity() {
        console.log('🎭 Checking Impersonation Security...');

        const impersonationPath = path.join(__dirname, 'controllers', 'impersonationController.js');
        if (fs.existsSync(impersonationPath)) {
            this.findings.push('✅ Impersonation controller exists');
            
            const content = fs.readFileSync(impersonationPath, 'utf8');
            
            // Check for token expiration
            if (content.includes('expiresIn') || content.includes('exp')) {
                this.findings.push('✅ Impersonation tokens have expiration');
            } else {
                this.findings.push('❌ Impersonation tokens may not have expiration');
                this.alerts.push('HIGH: Ensure impersonation tokens have limited lifetime');
            }

            // Check for role validation
            if (content.includes('role') && content.includes('hierarchy')) {
                this.findings.push('✅ Role hierarchy validation found');
            } else {
                this.findings.push('⚠️ Role hierarchy validation not clear');
                this.recommendations.push('Implement strict role hierarchy validation');
            }
        } else {
            this.findings.push('⚠️ Impersonation controller not found');
        }
    }

    // Check for security headers
    checkSecurityHeaders() {
        console.log('🛡️ Checking Security Headers...');

        const serverPath = path.join(__dirname, 'server.js');
        if (fs.existsSync(serverPath)) {
            const content = fs.readFileSync(serverPath, 'utf8');
            
            const securityHeaders = [
                'helmet',
                'X-Content-Type-Options',
                'X-Frame-Options', 
                'X-XSS-Protection',
                'Strict-Transport-Security',
                'Content-Security-Policy'
            ];

            let foundHeaders = 0;
            securityHeaders.forEach(header => {
                if (content.includes(header)) {
                    foundHeaders++;
                }
            });

            // Special check for helmet configuration
            if (content.includes('app.use(helmet(') && content.includes('contentSecurityPolicy')) {
                foundHeaders = Math.max(foundHeaders, 5); // Helmet implements most headers
                this.findings.push('✅ Helmet.js configured with CSP');
            }

            if (foundHeaders >= 4) {
                this.findings.push(`✅ Security headers implemented (${foundHeaders}/${securityHeaders.length})`);
            } else {
                this.findings.push(`⚠️ Limited security headers (${foundHeaders}/${securityHeaders.length})`);
                this.recommendations.push('Implement comprehensive security headers (helmet.js recommended)');
            }
        }
    }

    // Check dependencies for vulnerabilities
    checkDependencies() {
        console.log('📦 Checking Dependencies...');

        const packagePath = path.join(__dirname, 'package.json');
        if (fs.existsSync(packagePath)) {
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
            
            // Check for common vulnerable packages
            const vulnerablePackages = {
                'lodash': '< 4.17.21',
                'express': '< 4.18.0',
                'jsonwebtoken': '< 8.5.1',
                'bcrypt': '< 5.0.1'
            };

            Object.entries(vulnerablePackages).forEach(([pkg, version]) => {
                if (dependencies[pkg]) {
                    this.findings.push(`✅ ${pkg} dependency found`);
                    // Note: More sophisticated version checking would be needed for production
                } else if (pkg === 'bcrypt' || pkg === 'jsonwebtoken') {
                    this.findings.push(`⚠️ ${pkg} dependency not found`);
                    if (pkg === 'bcrypt') {
                        this.recommendations.push('Install bcrypt for secure password hashing');
                    }
                }
            });
        }
    }

    // Generate security report
    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('🔒 SECURITY AUDIT REPORT');
        console.log('='.repeat(60));
        console.log(`Generated: ${new Date().toISOString()}`);
        console.log('');

        if (this.alerts.length > 0) {
            console.log('🚨 CRITICAL ALERTS:');
            this.alerts.forEach(alert => console.log(`   ${alert}`));
            console.log('');
        }

        console.log('🔍 SECURITY FINDINGS:');
        this.findings.forEach(finding => console.log(`   ${finding}`));
        console.log('');

        if (this.recommendations.length > 0) {
            console.log('💡 RECOMMENDATIONS:');
            this.recommendations.forEach(rec => console.log(`   • ${rec}`));
            console.log('');
        }

        // Security score
        const totalChecks = this.findings.length;
        const passedChecks = this.findings.filter(f => f.includes('✅')).length;
        const score = Math.round((passedChecks / totalChecks) * 100);

        console.log(`📊 SECURITY SCORE: ${score}%`);
        
        if (score >= 90) {
            console.log('🟢 Excellent security posture');
        } else if (score >= 75) {
            console.log('🟡 Good security, room for improvement');
        } else if (score >= 60) {
            console.log('🟠 Moderate security, attention needed');
        } else {
            console.log('🔴 Poor security, immediate action required');
        }

        console.log('='.repeat(60));
    }

    // Run all security checks
    async runAudit() {
        console.log('🔒 Starting Security Audit...\n');

        this.checkJWTSecurity();
        this.checkPasswordSecurity();
        this.checkRateLimiting();
        this.checkAuditLogging();
        this.checkImpersonationSecurity();
        this.checkSecurityHeaders();
        this.checkDependencies();

        this.generateReport();
    }
}

// Run the audit if this script is executed directly
if (require.main === module) {
    const auditor = new SecurityAuditor();
    auditor.runAudit().catch(console.error);
}

module.exports = SecurityAuditor;
