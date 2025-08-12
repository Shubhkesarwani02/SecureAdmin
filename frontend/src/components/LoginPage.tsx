import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Shield, Loader2, Users, BarChart3, Settings } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { useAuth } from '../contexts/AuthContext'

export const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  
  const { signIn, user, loading: authLoading, error: authError, clearError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      const from = (location.state as any)?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [user, authLoading, navigate, location.state])

  // Clear errors when component mounts
  useEffect(() => {
    clearError()
  }, [clearError])

  const handleSignIn = async () => {
    setIsLoading(true)

    try {
      const { error: signInError } = await signIn()

      if (signInError) {
        console.error('Sign in error:', signInError)
        return
      }

      // Success - navigation will be handled by useEffect above
    } catch (err) {
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading spinner while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Branding & Info */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-lg">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Framtt Admin</h1>
                <p className="text-muted-foreground">Superadmin Dashboard</p>
              </div>
            </div>
            
            <p className="text-lg text-muted-foreground">
              Comprehensive rental company management platform with real-time analytics, 
              client oversight, and system monitoring capabilities.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Platform Features</h3>
            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
                <BarChart3 className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Analytics Dashboard</p>
                  <p className="text-sm text-muted-foreground">Real-time metrics and insights</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Client Management</p>
                  <p className="text-sm text-muted-foreground">Comprehensive tenant oversight</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
                <Settings className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">System Monitoring</p>
                  <p className="text-sm text-muted-foreground">Performance and health tracking</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Card */}
        <Card className="w-full max-w-md mx-auto shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Access your superadmin dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {authError && (
              <Alert variant="destructive">
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            
            {/* Demo Info */}
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Demo Mode - No login credentials required
                </p>
                <p className="text-xs text-muted-foreground">
                  Click the button below to access the dashboard with full admin privileges
                </p>
              </div>

              <Button 
                onClick={handleSignIn}
                className="w-full h-12 text-base"
                disabled={isLoading || authLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Sign In to Dashboard
                  </>
                )}
              </Button>
            </div>

            {/* Demo user info */}
            <div className="pt-4 border-t border-border">
              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p className="font-medium">Demo User Profile:</p>
                <div className="text-xs bg-muted/50 p-3 rounded-md space-y-1">
                  <p><strong>Name:</strong> John Smith</p>
                  <p><strong>Role:</strong> Superadmin</p>
                  <p><strong>Email:</strong> john@framtt.com</p>
                  <p><strong>Department:</strong> Management</p>
                  <p className="text-muted-foreground pt-1">Full access to all dashboard features</p>
                </div>
              </div>
            </div>

            {/* System status */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-center text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  All Systems Operational
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
