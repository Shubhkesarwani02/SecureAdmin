import React from 'react'
import { Alert, AlertDescription, AlertTitle } from './alert'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './button'

interface ErrorAlertProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorAlert({
  title = 'Error Loading Data',
  message,
  onRetry,
  className = ''
}: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">{message}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="bg-background hover:bg-background/80"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
