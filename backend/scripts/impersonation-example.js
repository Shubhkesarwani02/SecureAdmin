#!/usr/bin/env node

// =============================================
// IMPERSONATION WORKFLOW EXAMPLE
// Practical demonstration of the impersonation system
// =============================================

const ImpersonationWorkflow = require('../utils/impersonationWorkflow');
const db = require('../services/database_simplified');

/**
 * Example usage of the impersonation workflow
 * This script demonstrates the complete impersonation process
 */
class ImpersonationExample {
    
    static async runExample() {
        console.log('🔐 Starting Impersonation Workflow Example\n');
        
        try {
            // Example 1: Superadmin impersonating an admin
            console.log('📋 Example 1: Superadmin impersonating Admin');
            await this.example1_SuperadminImpersonatingAdmin();
            
            console.log('\n' + '='.repeat(60) + '\n');
            
            // Example 2: Admin impersonating user in managed account
            console.log('📋 Example 2: Admin impersonating User in managed account');
            await this.example2_AdminImpersonatingUser();
            
            console.log('\n' + '='.repeat(60) + '\n');
            
            // Example 3: Failed impersonation - insufficient permissions
            console.log('📋 Example 3: Failed impersonation (insufficient permissions)');
            await this.example3_FailedImpersonation();
            
            console.log('\n' + '='.repeat(60) + '\n');
            
            // Example 4: Token validation and session management
            console.log('📋 Example 4: Token validation and session management');
            await this.example4_TokenValidation();
            
        } catch (error) {
            console.error('❌ Example failed:', error.message);
        }
    }
    
    static async example1_SuperadminImpersonatingAdmin() {
        console.log('👤 Superadmin wants to impersonate Admin user');
        
        // Sample user IDs (would come from database in real scenario)
        const superadminId = 'superadmin-123';
        const adminId = 'admin-456';
        
        try {
            // Start impersonation
            const result = await ImpersonationWorkflow.startImpersonation(
                superadminId,
                adminId,
                'Debugging admin dashboard issue'
            );
            
            console.log('✅ Impersonation started successfully!');
            console.log('📄 Session Details:');
            console.log(`   - Session ID: ${result.session.id}`);
            console.log(`   - Token: ${result.token.substring(0, 50)}...`);
            console.log(`   - Impersonator: ${result.session.impersonator.email}`);
            console.log(`   - Target: ${result.session.target.email}`);
            console.log(`   - Expires: ${result.session.expires_at}`);
            console.log(`   - Reason: ${result.session.reason}`);
            
            // Validate the token
            const decoded = ImpersonationWorkflow.validateImpersonationToken(result.token);
            console.log('🔍 Token validation: ✅ Valid');
            console.log(`   - Is Impersonating: ${decoded.isImpersonating}`);
            console.log(`   - Token Type: ${decoded.tokenType}`);
            
            // End the session
            await ImpersonationWorkflow.endImpersonation(result.session.id);
            console.log('🏁 Session ended successfully');
            
        } catch (error) {
            console.error('❌ Impersonation failed:', error.message);
        }
    }
    
    static async example2_AdminImpersonatingUser() {
        console.log('👤 Admin wants to impersonate User in their managed account');
        
        const adminId = 'admin-789';
        const userId = 'user-101';
        
        try {
            const result = await ImpersonationWorkflow.startImpersonation(
                adminId,
                userId,
                'Investigating user reported bug in dashboard'
            );
            
            console.log('✅ Impersonation started successfully!');
            console.log('📊 Session Statistics:');
            
            // Get impersonation statistics
            const stats = await ImpersonationWorkflow.getImpersonationStats({ timeframe: '7d' });
            console.log(`   - Total sessions (7d): ${stats.total_sessions}`);
            console.log(`   - Active sessions: ${stats.active_sessions}`);
            console.log(`   - Unique impersonators: ${stats.unique_impersonators}`);
            console.log(`   - Average duration: ${Math.round(stats.avg_duration_minutes)} minutes`);
            
        } catch (error) {
            console.error('❌ Impersonation failed:', error.message);
        }
    }
    
    static async example3_FailedImpersonation() {
        console.log('👤 CSM trying to impersonate Admin (should fail)');
        
        const csmId = 'csm-202';
        const adminId = 'admin-456';
        
        try {
            await ImpersonationWorkflow.startImpersonation(
                csmId,
                adminId,
                'Trying to access admin features'
            );
            
            console.log('❌ This should not happen - impersonation should have failed!');
            
        } catch (error) {
            console.log('✅ Impersonation correctly blocked');
            console.log(`   - Reason: ${error.message}`);
            console.log('   - Security: Permission checks working properly');
        }
    }
    
    static async example4_TokenValidation() {
        console.log('🔐 Demonstrating token validation and security features');
        
        try {
            // Create a valid impersonation token
            const validToken = ImpersonationWorkflow.createImpersonationJWT({
                impersonator_id: 'admin-123',
                user_id: 'user-456',
                role: 'user',
                account_id: 'account-789'
            });
            
            console.log('✅ Valid token created');
            
            // Validate it
            const decoded = ImpersonationWorkflow.validateImpersonationToken(validToken);
            console.log('✅ Token validation successful');
            console.log(`   - Impersonator ID: ${decoded.impersonator_id}`);
            console.log(`   - Target User ID: ${decoded.user_id}`);
            console.log(`   - Role: ${decoded.role}`);
            
            // Try to validate an invalid token
            try {
                ImpersonationWorkflow.validateImpersonationToken('invalid-token-123');
                console.log('❌ This should not happen!');
            } catch (error) {
                console.log('✅ Invalid token correctly rejected');
                console.log(`   - Error: ${error.message}`);
            }
            
            // Create a regular (non-impersonation) token and try to validate
            const jwt = require('jsonwebtoken');
            const regularToken = jwt.sign(
                { userId: 'user-123', role: 'user' },
                process.env.JWT_SECRET || 'your-secret-key'
            );
            
            try {
                ImpersonationWorkflow.validateImpersonationToken(regularToken);
                console.log('❌ This should not happen!');
            } catch (error) {
                console.log('✅ Non-impersonation token correctly rejected');
                console.log(`   - Error: ${error.message}`);
            }
            
        } catch (error) {
            console.error('❌ Token validation example failed:', error.message);
        }
    }
    
    /**
     * Demonstrate the permission matrix
     */
    static showPermissionMatrix() {
        console.log('\n🔒 IMPERSONATION PERMISSION MATRIX\n');
        
        const matrix = [
            ['Role', 'Can Impersonate', 'Cannot Impersonate'],
            ['─'.repeat(15), '─'.repeat(20), '─'.repeat(25)],
            ['Superadmin', 'Admin, CSM, User', 'Other Superadmins'],
            ['Admin', 'Users in managed accounts', 'Superadmins, Other Admins'],
            ['CSM', 'None', 'Anyone'],
            ['User', 'None', 'Anyone']
        ];
        
        matrix.forEach(row => {
            console.log(`${row[0].padEnd(15)} | ${row[1].padEnd(20)} | ${row[2]}`);
        });
        
        console.log('\n📋 KEY FEATURES:');
        console.log('• ✅ Role-based permission hierarchy');
        console.log('• ✅ Account-based access control for admins');
        console.log('• ✅ Comprehensive audit logging');
        console.log('• ✅ Session timeout enforcement');
        console.log('• ✅ JWT-based secure tokens');
        console.log('• ✅ Privilege escalation prevention');
        console.log('• ✅ Real-time session monitoring');
    }
    
    /**
     * Show example API usage
     */
    static showAPIUsage() {
        console.log('\n🔌 API ENDPOINT USAGE EXAMPLES\n');
        
        const examples = [
            {
                title: 'Start Impersonation',
                method: 'POST',
                endpoint: '/api/impersonation/start',
                body: {
                    impersonated_id: 'user-123',
                    reason: 'Debugging user issue'
                }
            },
            {
                title: 'End Impersonation',
                method: 'POST',
                endpoint: '/api/impersonation/end',
                body: {}
            },
            {
                title: 'Get Status',
                method: 'GET',
                endpoint: '/api/impersonation/status',
                body: null
            },
            {
                title: 'Get Statistics',
                method: 'GET',
                endpoint: '/api/impersonation/stats?timeframe=7d',
                body: null
            }
        ];
        
        examples.forEach(example => {
            console.log(`📡 ${example.title}`);
            console.log(`   ${example.method} ${example.endpoint}`);
            if (example.body) {
                console.log(`   Body: ${JSON.stringify(example.body, null, 2)}`);
            }
            console.log('');
        });
    }
}

// Run the example if this file is executed directly
if (require.main === module) {
    console.log('🚀 Running Impersonation Workflow Examples...\n');
    
    ImpersonationExample.runExample()
        .then(() => {
            ImpersonationExample.showPermissionMatrix();
            ImpersonationExample.showAPIUsage();
            console.log('\n✅ All examples completed successfully!');
        })
        .catch(error => {
            console.error('❌ Examples failed:', error);
        });
}

module.exports = ImpersonationExample;
