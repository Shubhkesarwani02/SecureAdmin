import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from './info'

// Use the connected Supabase project info, with fallbacks for development
const supabaseUrl = `https://${projectId}.supabase.co`
const supabaseAnonKey = publicAnonKey

// Validate that we have the required configuration
if (!projectId || !publicAnonKey) {
  console.error('Supabase configuration missing. Please ensure you are connected to Supabase.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Auth helper functions
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  } catch (error) {
    console.error('Sign in error:', error)
    return { data: null, error }
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    console.error('Sign out error:', error)
    return { error }
  }
}

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  } catch (error) {
    console.error('Get current user error:', error)
    return { user: null, error }
  }
}

export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  } catch (error) {
    console.error('Get session error:', error)
    return { session: null, error }
  }
}

// Get user profile from users table
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    return { data, error }
  } catch (error) {
    console.error('Get user profile error:', error)
    return { data: null, error }
  }
}

// Update last login timestamp
export const updateLastLogin = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId)
    
    return { error }
  } catch (error) {
    console.error('Update last login error:', error)
    return { error }
  }
}

// Test connection function - simplified to avoid query syntax issues
export const testSupabaseConnection = async () => {
  try {
    // Simple test by trying to select from users table with limit 1
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection test failed:', error)
      return false
    }
    
    console.log('Supabase connection successful')
    return true
  } catch (error) {
    console.error('Supabase connection test error:', error)
    return false
  }
}

// Alternative: Test connection by checking if we can get current user
export const testSupabaseAuth = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    // Even if no user is logged in, this should not error if connection works
    if (error && error.message !== 'JWT expired') {
      console.error('Supabase auth test failed:', error)
      return false
    }
    
    console.log('Supabase auth connection successful')
    return true
  } catch (error) {
    console.error('Supabase auth test error:', error)
    return false
  }
}