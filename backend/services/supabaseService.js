const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase configuration missing. Some features may not work.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Supabase Service for Backend Operations
 * Provides direct database access and utility functions
 */
class SupabaseService {
  
  /**
   * Test Supabase connection
   */
  static async testConnection() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      return { success: true, message: 'Supabase connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  /**
   * Create new user
   */
  static async createUser(userData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  /**
   * Update user
   */
  static async updateUser(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  /**
   * Get accounts for a user
   */
  static async getUserAccounts(userId) {
    try {
      const { data, error } = await supabase
        .from('user_accounts')
        .select(`
          account_id,
          accounts (
            id,
            name,
            created_at
          )
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  /**
   * Get CSM assignments
   */
  static async getCSMAssignments(csmId) {
    try {
      const { data, error } = await supabase
        .from('csm_assignments')
        .select(`
          account_id,
          accounts (
            id,
            name,
            created_at
          )
        `)
        .eq('csm_id', csmId);
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  /**
   * Create impersonation log
   */
  static async createImpersonationLog(logData) {
    try {
      const { data, error } = await supabase
        .from('impersonation_logs')
        .insert([logData])
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  /**
   * Update impersonation log end time
   */
  static async endImpersonationSession(logId) {
    try {
      const { data, error } = await supabase
        .from('impersonation_logs')
        .update({ end_time: new Date().toISOString() })
        .eq('id', logId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  /**
   * Store refresh token
   */
  static async storeRefreshToken(tokenData) {
    try {
      const { data, error } = await supabase
        .from('refresh_tokens')
        .insert([tokenData])
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  /**
   * Get refresh token by hash
   */
  static async getRefreshToken(tokenHash) {
    try {
      const { data, error } = await supabase
        .from('refresh_tokens')
        .select('*')
        .eq('token_hash', tokenHash)
        .eq('is_revoked', false)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  /**
   * Revoke refresh token
   */
  static async revokeRefreshToken(tokenHash) {
    try {
      const { data, error } = await supabase
        .from('refresh_tokens')
        .update({ is_revoked: true })
        .eq('token_hash', tokenHash)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  /**
   * Clean up expired tokens
   */
  static async cleanupExpiredTokens() {
    try {
      const { data, error } = await supabase
        .from('refresh_tokens')
        .delete()
        .lt('expires_at', new Date().toISOString());
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  /**
   * Get system statistics
   */
  static async getSystemStats() {
    try {
      const [usersCount, accountsCount, activeImpersonations] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('accounts').select('*', { count: 'exact', head: true }),
        supabase.from('impersonation_logs').select('*').is('end_time', null)
      ]);

      return {
        data: {
          totalUsers: usersCount.count || 0,
          totalAccounts: accountsCount.count || 0,
          activeImpersonations: activeImpersonations.data?.length || 0
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }
}

module.exports = SupabaseService;
