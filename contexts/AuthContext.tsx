import React, { createContext, useContext, useEffect, useState } from 'react'

interface UserProfile {
  id: number
  full_name: string
  email: string
  phone?: string
  role: string
  department?: string
  status: string
  avatar?: string
  bio?: string
  permissions: string[]
  preferences: Record<string, any>
  created_at: string
  updated_at: string
  last_login?: string
}

interface AuthContextType {
  user: any
  userProfile: UserProfile | null
  session: any
  loading: boolean
  error: string | null
  signIn: () => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => setError(null)

  // Demo login function - no authentication required
  const signIn = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Create demo user
      const demoUser = {
        id: 'demo-user-123',
        email: 'john@framtt.com',
        created_at: new Date().toISOString()
      }

      // Create demo profile
      const demoProfile: UserProfile = {
        id: 1,
        full_name: 'John Smith',
        email: 'john@framtt.com',
        phone: '+1 (555) 123-4567',
        role: 'superadmin',
        department: 'Management',
        status: 'active',
        avatar: null,
        bio: 'Superadmin dashboard administrator with full system access.',
        permissions: ['read:all', 'write:all', 'delete:all', 'admin:all'],
        preferences: {
          emailNotifications: true,
          pushNotifications: false,
          weeklyReports: true,
          marketingEmails: false,
          twoFactorAuth: true,
          sessionTimeout: "8",
          language: "en",
          timezone: "America/New_York",
          theme: "light"
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      }

      // Create demo session
      const demoSession = {
        access_token: 'demo-access-token',
        user: demoUser,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).getTime() // 24 hours from now
      }

      // Set all the auth states
      setUser(demoUser)
      setUserProfile(demoProfile)
      setSession(demoSession)

      // Store in localStorage for persistence
      localStorage.setItem('demo-auth', JSON.stringify({
        user: demoUser,
        userProfile: demoProfile,
        session: demoSession
      }))

      return { error: null }
    } catch (error) {
      console.error('Demo login error:', error)
      const errorMsg = 'An unexpected error occurred during sign in'
      setError(errorMsg)
      return { error: { message: errorMsg } }
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    // In demo mode, just keep the current profile
    return
  }

  const signOut = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Clear local state
      setUser(null)
      setUserProfile(null)
      setSession(null)
      
      // Clear localStorage
      localStorage.removeItem('demo-auth')
    } catch (error) {
      console.error('Sign out error:', error)
      setError('Error signing out')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check for existing demo session in localStorage
    const initializeAuth = async () => {
      try {
        setError(null)
        setLoading(true)

        const storedAuth = localStorage.getItem('demo-auth')
        if (storedAuth) {
          const { user: storedUser, userProfile: storedProfile, session: storedSession } = JSON.parse(storedAuth)
          
          // Check if session is still valid (within 24 hours)
          if (storedSession.expires_at > Date.now()) {
            setUser(storedUser)
            setUserProfile(storedProfile)
            setSession(storedSession)
          } else {
            // Session expired, clear it
            localStorage.removeItem('demo-auth')
          }
        }
      } catch (error) {
        console.error('Error initializing demo auth:', error)
        localStorage.removeItem('demo-auth') // Clear invalid stored auth
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const value = {
    user,
    userProfile,
    session,
    loading,
    error,
    signIn,
    signOut,
    refreshProfile,
    clearError
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
