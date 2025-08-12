import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Alert, AlertDescription } from './ui/alert'
import { Loader2, UserCheck, AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface User {
  id: string
  full_name: string
  email: string
  role: string
  department?: string
  status: string
}

interface ImpersonationDialogProps {
  isOpen: boolean
  onClose: () => void
  targetUser?: User | null
  onSuccess?: () => void
}

export const ImpersonationDialog: React.FC<ImpersonationDialogProps> = ({
  isOpen,
  onClose,
  targetUser,
  onSuccess
}) => {
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { startImpersonation, userProfile } = useAuth()

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setReason('')
      setError(null)
    }
  }, [isOpen])

  const canImpersonate = () => {
    if (!userProfile || !targetUser) return false
    
    // Cannot impersonate yourself
    if (userProfile.id === targetUser.id) return false
    
    // Role-based checks
    if (userProfile.role === 'superadmin') {
      return true // Superadmin can impersonate anyone
    }
    
    if (userProfile.role === 'admin') {
      return ['csm', 'user'].includes(targetUser.role)
    }
    
    if (userProfile.role === 'csm') {
      return targetUser.role === 'user'
    }
    
    return false
  }

  const getImpersonationRuleText = () => {
    if (!userProfile || !targetUser) return ''
    
    if (userProfile.id === targetUser.id) {
      return 'You cannot impersonate yourself.'
    }
    
    if (userProfile.role === 'superadmin') {
      return 'As a Superadmin, you can impersonate any user.'
    }
    
    if (userProfile.role === 'admin') {
      if (['csm', 'user'].includes(targetUser.role)) {
        return 'As an Admin, you can impersonate CSMs and regular users.'
      }
      return 'As an Admin, you cannot impersonate other Admins or Superadmins.'
    }
    
    if (userProfile.role === 'csm') {
      if (targetUser.role === 'user') {
        return 'As a CSM, you can impersonate users in your assigned accounts.'
      }
      return 'As a CSM, you can only impersonate regular users in your assigned accounts.'
    }
    
    return 'You do not have impersonation privileges.'
  }

  const handleStartImpersonation = async () => {
    if (!targetUser) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { error: impersonationError } = await startImpersonation(
        targetUser.id,
        reason.trim() || 'Administrative support'
      )
      
      if (impersonationError) {
        setError(impersonationError.message)
        return
      }
      
      // Success
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Impersonation error:', err)
      setError('An unexpected error occurred while starting impersonation')
    } finally {
      setIsLoading(false)
    }
  }

  if (!targetUser) {
    return null
  }

  const canPerformImpersonation = canImpersonate()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Impersonate User
          </DialogTitle>
          <DialogDescription>
            You are about to impersonate another user. This action will be logged for security purposes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Target User Info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium">Target User</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium">{targetUser.full_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{targetUser.email}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Role:</span>
                <p className="font-medium capitalize">{targetUser.role}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Department:</span>
                <p className="font-medium">{targetUser.department || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Permission Check */}
          <Alert variant={canPerformImpersonation ? "default" : "destructive"}>
            {canPerformImpersonation ? (
              <UserCheck className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription>
              {getImpersonationRuleText()}
            </AlertDescription>
          </Alert>

          {/* Reason Input */}
          {canPerformImpersonation && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Impersonation</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for impersonation (optional but recommended)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                This reason will be logged for audit purposes.
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Warning */}
          {canPerformImpersonation && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <div className="font-medium">Important:</div>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>You will see the system exactly as the target user sees it</li>
                  <li>All actions will be logged with your identity as the impersonator</li>
                  <li>The session will automatically expire after 1 hour</li>
                  <li>You can stop impersonation at any time</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          {canPerformImpersonation && (
            <Button
              onClick={handleStartImpersonation}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Start Impersonation
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
