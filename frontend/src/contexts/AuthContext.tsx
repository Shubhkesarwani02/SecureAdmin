import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiClient, type ApiResponse } from '../lib/api'

interface UserProfile {
  id: string
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
  isImpersonationActive?: boolean
  currentImpersonatorId?: string
}

interface ImpersonationSession {
  sessionId: string
  targetUser: UserProfile
  impersonator: UserProfile
  expiresAt: string
  startedAt: string
}

interface AuthContextType {
  user: any
  userProfile: UserProfile | null
  session: any
  loading: boolean
  error: string | null
  isImpersonating: boolean
  impersonationSession: ImpersonationSession | null
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  startImpersonation: (targetUserId: string, reason?: string) => Promise<{ error: any }>
  stopImpersonation: () => Promise<{ error: any }>
  getImpersonationHistory: (params?: any) => Promise<ApiResponse>
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

// Decode JWT token to extract user information
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error decoding JWT:', error)
    return null
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [impersonationSession, setImpersonationSession] = useState<ImpersonationSession | null>(null)

  const clearError = () => setError(null)

  // Initialize authentication on load
  const initializeAuth = async () => {
    setLoading(true)
    const token = apiClient.getToken()
    
    if (token) {
      try {
        // Decode token to check if it's an impersonation token
        const decodedToken = decodeJWT(token)
        
        if (decodedToken) {
          const now = Math.floor(Date.now() / 1000)
          
          // Check if token is expired
          if (decodedToken.exp && decodedToken.exp < now) {
            apiClient.clearToken()
            setLoading(false)
            return
          }

          // Get current user profile
          const response = await apiClient.getMe()
          
          if (response.success) {
            const userData = response.data.user
            setUser(userData)
            setUserProfile(userData)
            
            // Check if this is an impersonation session
            if (decodedToken.is_impersonation) {
              setIsImpersonating(true)
              setImpersonationSession({
                sessionId: decodedToken.session_id,
                targetUser: userData,
                impersonator: {
                  id: decodedToken.impersonator_id,
                  full_name: 'Impersonator', // This would be filled from actual data
                  email: '',
                  role: '',
                  permissions: [],
                  preferences: {},
                  created_at: '',
                  updated_at: '',
                  status: 'active'
                },
                expiresAt: new Date(decodedToken.exp * 1000).toISOString(),
                startedAt: new Date(decodedToken.iat * 1000).toISOString()
              })
            } else {
              setIsImpersonating(false)
              setImpersonationSession(null)
            }
            
            setSession({
              access_token: token,
              user: userData,
              expires_at: decodedToken.exp * 1000
            })
          } else {
            // Invalid token, clear it
            apiClient.clearToken()
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        apiClient.clearToken()
      }
    }
    
    setLoading(false)
  }

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.login(email, password)
      
      if (response.success) {
        const userData = response.data.user
        setUser(userData)
        setUserProfile(userData)
        setSession({
          access_token: response.data.accessToken,
          user: userData,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).getTime() // 1 hour
        })
        setIsImpersonating(false)
        setImpersonationSession(null)
        
        return { error: null }
      } else {
        setError(response.message)
        return { error: { message: response.message } }
      }
    } catch (error) {
      console.error('Sign in error:', error)
      const errorMsg = 'An unexpected error occurred during sign in'
      setError(errorMsg)
      return { error: { message: errorMsg } }
    } finally {
      setLoading(false)
    }
  }

  // Start impersonation
  const startImpersonation = async (targetUserId: string, reason?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.startImpersonation(targetUserId, reason)
      
      if (response.success) {
        // Store the original user as impersonator
        const originalUser = userProfile
        
        // Update session with impersonated user
        setUser(response.data.targetUser)
        setUserProfile(response.data.targetUser)
        setIsImpersonating(true)
        setImpersonationSession({
          sessionId: response.data.sessionId,
          targetUser: response.data.targetUser,
          impersonator: originalUser!,
          expiresAt: response.data.expiresAt,
          startedAt: new Date().toISOString()
        })
        
        setSession({
          access_token: response.data.impersonationToken,
          user: response.data.targetUser,
          expires_at: new Date(response.data.expiresAt).getTime()
        })
        
        return { error: null }
      } else {
        setError(response.message)
        return { error: { message: response.message } }
      }
    } catch (error) {
      console.error('Impersonation error:', error)
      const errorMsg = 'Failed to start impersonation'
      setError(errorMsg)
      return { error: { message: errorMsg } }
    } finally {
      setLoading(false)
    }
  }

  // Stop impersonation
  const stopImpersonation = async () => {
    if (!isImpersonating || !impersonationSession) {
      return { error: { message: 'No active impersonation session' } }
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.stopImpersonation(impersonationSession.sessionId)
      
      if (response.success) {
        // Restore original user session
        const originalUser = impersonationSession.impersonator
        setUser(originalUser)
        setUserProfile(originalUser)
        setIsImpersonating(false)
        setImpersonationSession(null)
        
        // Clear token - user will need to login again or we need to get a fresh token
        apiClient.clearToken()
        setSession(null)
        
        return { error: null }
      } else {
        setError(response.message)
        return { error: { message: response.message } }
      }
    } catch (error) {
      console.error('Stop impersonation error:', error)
      const errorMsg = 'Failed to stop impersonation'
      setError(errorMsg)
      return { error: { message: errorMsg } }
    } finally {
      setLoading(false)
    }
  }

  // Get impersonation history
  const getImpersonationHistory = async (params?: any) => {
    return apiClient.getImpersonationHistory(params)
  }

  const refreshProfile = async () => {
    if (!apiClient.isAuthenticated()) return
    
    try {
      const response = await apiClient.getMe()
      if (response.success) {
        setUser(response.data.user)
        setUserProfile(response.data.user)
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }

  const signOut = async () => {
    setLoading(true)
    setError(null)
    
    try {
      await apiClient.logout()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      // Always clear local state
      setUser(null)
      setUserProfile(null)
      setSession(null)
      setIsImpersonating(false)
      setImpersonationSession(null)
      setLoading(false)
    }
  }

  useEffect(() => {
    initializeAuth()
  }, [])

  const value = {
    user,
    userProfile,
    session,
    loading,
    error,
    isImpersonating,
    impersonationSession,
    signIn,
    signOut,
    refreshProfile,
    startImpersonation,
    stopImpersonation,
    getImpersonationHistory,
    clearError
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
