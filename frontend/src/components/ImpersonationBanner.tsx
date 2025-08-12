import React from 'react'
import { Alert, AlertDescription } from './ui/alert'
import { Button } from './ui/button'
import { UserCheck, X, User, Clock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, impersonationSession, stopImpersonation, loading } = useAuth()

  if (!isImpersonating || !impersonationSession) {
    return null
  }

  const handleStopImpersonation = async () => {
    const { error } = await stopImpersonation()
    if (error) {
      console.error('Failed to stop impersonation:', error)
    }
  }

  const formatTimeRemaining = () => {
    const now = new Date()
    const expiresAt = new Date(impersonationSession.expiresAt)
    const diff = expiresAt.getTime() - now.getTime()
    
    if (diff <= 0) {
      return 'Expired'
    }
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m remaining`
    }
    return `${minutes}m remaining`
  }

  return (
    <Alert className="border-orange-200 bg-orange-50 text-orange-800 mb-4">
      <UserCheck className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="font-medium">
              Impersonating: {impersonationSession.targetUser.full_name}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-3 w-3" />
            <span>{formatTimeRemaining()}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleStopImpersonation}
          disabled={loading}
          className="border-orange-300 hover:bg-orange-100"
        >
          <X className="h-3 w-3 mr-1" />
          Stop Impersonation
        </Button>
      </AlertDescription>
    </Alert>
  )
}
