import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2, AlertCircle, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Alert, AlertDescription } from './ui/alert'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'superadmin' | 'admin'
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = 'admin' 
}) => {
  const { user, userProfile, loading, error, clearError } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Authenticating...</span>
        </div>
      </div>
    )
  }

  // Show error state if there's an authentication error
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-destructive/10 rounded-lg">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-xl">Authentication Error</CardTitle>
            <CardDescription>
              Unable to verify your authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => {
                  clearError()
                  window.location.href = '/login'
                }}
                className="w-full"
              >
                Try Again
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user || !userProfile) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user has required role (in demo mode, we'll be more lenient)
  if (requiredRole === 'superadmin' && userProfile.role !== 'superadmin' && userProfile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-500/10 rounded-lg">
                <Shield className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              Insufficient privileges to access this resource
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                This page requires <strong>{requiredRole}</strong> privileges. Your current role is <strong>{userProfile.role}</strong>.
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Go to Dashboard
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/login'}
                className="w-full"
              >
                Sign in with different account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user account is active (in demo mode, always allow active status)
  if (userProfile.status !== 'active') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-500/10 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <CardTitle className="text-xl">Account Inactive</CardTitle>
            <CardDescription>
              Your account status prevents access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Your account is currently <strong>{userProfile.status}</strong>. Please contact your administrator to restore access.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              Sign in with different account
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
