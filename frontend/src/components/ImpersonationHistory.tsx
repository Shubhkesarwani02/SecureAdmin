import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table'
import { 
  Calendar,
  Clock,
  UserCheck,
  Search,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { apiClient } from '../lib/api'

interface ImpersonationLog {
  id: string
  impersonator_id: string
  impersonated_id: string
  start_time: string
  end_time?: string
  reason?: string
  session_id: string
  is_active: boolean
  impersonator_name: string
  impersonator_email: string
  impersonated_name: string
  impersonated_email: string
}

export const ImpersonationHistory: React.FC = () => {
  const [logs, setLogs] = useState<ImpersonationLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)

  const loadHistory = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.getImpersonationHistory({
        page,
        limit: 20,
        ...(searchTerm && { search: searchTerm })
      })
      
      if (response.success && response.data) {
        setLogs(response.data.logs)
        setTotalLogs(response.data.total)
      } else {
        // Fallback data for demo
        setLogs([
          {
            id: '1',
            impersonator_id: 'admin1',
            impersonated_id: 'user1',
            start_time: '2024-01-20T10:30:00Z',
            end_time: '2024-01-20T11:15:00Z',
            reason: 'Customer support assistance',
            session_id: 'session_1',
            is_active: false,
            impersonator_name: 'John Anderson',
            impersonator_email: 'john@framtt.com',
            impersonated_name: 'TechCorp User',
            impersonated_email: 'user@techcorp.com'
          },
          {
            id: '2',
            impersonator_id: 'admin2',
            impersonated_id: 'user2',
            start_time: '2024-01-20T14:20:00Z',
            reason: 'Account verification',
            session_id: 'session_2',
            is_active: true,
            impersonator_name: 'Sarah Chen',
            impersonator_email: 'sarah@framtt.com',
            impersonated_name: 'Digital Solutions User',
            impersonated_email: 'user@digitalsolutions.com'
          }
        ])
        setTotalLogs(2)
        setError(response.message || 'Failed to load data')
      }
    } catch (err) {
      console.error('Error loading impersonation history:', err)
      setError('Failed to load impersonation history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [page])

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const diff = end.getTime() - start.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString()
  }

  const getStatusBadge = (log: ImpersonationLog) => {
    if (log.is_active) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
    } else if (log.end_time) {
      return <Badge variant="secondary">Completed</Badge>
    } else {
      return <Badge variant="destructive">Expired</Badge>
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadHistory()
  }

  const handleRefresh = () => {
    loadHistory()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Impersonation History
        </CardTitle>
        <CardDescription>
          View and track all impersonation sessions for security and audit purposes.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search and Controls */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="search">Search by user name or email</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="Search impersonation logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant="outline" disabled={loading}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button onClick={handleRefresh} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* History Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Impersonator</TableHead>
                <TableHead>Target User</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading impersonation history...
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No impersonation sessions found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{log.impersonator_name}</div>
                        <div className="text-sm text-muted-foreground">{log.impersonator_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{log.impersonated_name}</div>
                        <div className="text-sm text-muted-foreground">{log.impersonated_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDateTime(log.start_time)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDuration(log.start_time, log.end_time)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {log.reason || 'No reason provided'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(log)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalLogs > 20 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, totalLogs)} of {totalLogs} results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page * 20 >= totalLogs || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
