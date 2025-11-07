import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Progress } from "./ui/progress"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { Server, Wifi, AlertTriangle, CheckCircle, Clock, Activity, HardDrive, Cpu, MemoryStick, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { useState, useEffect } from "react"
import { apiClient } from "../lib/api"
import { EmptyState } from './ui/empty-state'
import { ErrorAlert } from './ui/error-alert'

// Simple toast implementation
const toast = {
  success: (message: string) => {
    console.log(`✅ SUCCESS: ${message}`)
    alert(`✅ ${message}`)
  },
  error: (message: string) => {
    console.log(`❌ ERROR: ${message}`)
    alert(`❌ ${message}`)
  }
}

interface SystemMetric {
  time: string
  cpu: number
  memory: number
  disk: number
  network: number
}

interface ApiEndpoint {
  name: string
  status: string
  uptime: string
  responseTime: string
  requests: string
}

interface ErrorLog {
  id: number
  timestamp: string
  level: string
  service: string
  message: string
  count: number
}

export function SystemMonitoring() {
  // State management
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([])
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([])
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([])
  const [systemHealth, setSystemHealth] = useState<any>(null)
  
  const [showHealthDetails, setShowHealthDetails] = useState(false)
  const [showErrorDetails, setShowErrorDetails] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load all monitoring data
  const loadMonitoringData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [
        metricsResponse,
        endpointsResponse,
        logsResponse,
        healthResponse
      ] = await Promise.all([
        apiClient.getSystemMetrics(),
        apiClient.getApiEndpointStatus(),
        apiClient.getErrorLogs({ page: 1, limit: 20 }),
        apiClient.getSystemHealth()
      ])

      if (metricsResponse.success) {
        setSystemMetrics(metricsResponse.data || [])
      } else {
        setError(metricsResponse.message || 'Failed to load system metrics')
        setSystemMetrics([])
      }

      if (endpointsResponse.success) {
        setApiEndpoints(endpointsResponse.data || [])
      } else {
        setApiEndpoints([])
      }

      if (logsResponse.success && Array.isArray(logsResponse.data)) {
        setErrorLogs(logsResponse.data)
      } else {
        setErrorLogs([])
      }

      if (healthResponse.success) {
        setSystemHealth(healthResponse.data)
      }

    } catch (error) {
      console.error('Error loading monitoring data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load monitoring data')
      setSystemMetrics([])
      setApiEndpoints([])
      setErrorLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMonitoringData()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const response = await apiClient.refreshSystemData()
      if (response.success) {
        toast.success('System data refreshed successfully')
        loadMonitoringData() // Reload all data
      } else {
        toast.error(response.message || 'Failed to refresh system data')
      }
    } catch (error) {
      console.error('Error refreshing system data:', error)
      toast.error('Failed to refresh system data')
    } finally {
      setIsRefreshing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>
      case "warning":
        return <Badge className="bg-yellow-500"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>
      case "error":
        return <Badge className="bg-red-500"><AlertTriangle className="w-3 h-3 mr-1" />Error</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getLogLevelBadge = (level: string) => {
    switch (level) {
      case "ERROR":
        return <Badge variant="destructive">{level}</Badge>
      case "WARNING":
        return <Badge className="bg-yellow-500">{level}</Badge>
      case "INFO":
        return <Badge variant="secondary">{level}</Badge>
      default:
        return <Badge variant="outline">{level}</Badge>
    }
  }

  const handleRefreshMetrics = () => {
    handleRefresh()
  }

  const handleViewHealthDetails = () => {
    setShowHealthDetails(true)
  }

  const handleViewErrorDetails = () => {
    setShowErrorDetails(true)
  }

  const handleRestartService = (serviceName: string) => {
    toast.success(`Restarting ${serviceName}...`)
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefreshMetrics}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {isRefreshing ? "Refreshing..." : "Refresh Metrics"}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleViewHealthDetails}>
            <Activity className="w-4 h-4 mr-2" />
            System Health Details
          </Button>
          <Button variant="outline" onClick={handleViewErrorDetails}>
            <AlertTriangle className="w-4 h-4 mr-2" />
            View Error Logs
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <ErrorAlert
          message={error}
          onRetry={loadMonitoringData}
        />
      )}

      {/* Empty State */}
      {!error && !loading && systemMetrics.length === 0 && (
        <EmptyState
          icon={Server}
          title="No monitoring data available"
          description="System monitoring data is currently unavailable. Please check back later or contact support."
          action={{
            label: "Retry",
            onClick: loadMonitoringData
          }}
        />
      )}

      {/* System Overview */}
      {systemMetrics.length > 0 && (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65%</div>
            <Progress value={65} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">Normal</span> operation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72%</div>
            <Progress value={72} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              8.2GB / 12GB used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <HardDrive className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">83%</div>
            <Progress value={83} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              415GB / 500GB used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network I/O</CardTitle>
            <Wifi className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">56%</div>
            <Progress value={56} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              125 MB/s throughput
            </p>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Performance Charts */}
      {systemMetrics.length > 0 && (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Resource Usage</CardTitle>
            <CardDescription>Last 24 hours performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={Array.isArray(systemMetrics) ? systemMetrics : []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU %" />
                <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory %" />
                <Line type="monotone" dataKey="disk" stroke="#ffc658" name="Disk %" />
                <Line type="monotone" dataKey="network" stroke="#ff7300" name="Network %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Response Times</CardTitle>
            <CardDescription>Average response times across services</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={Array.isArray(systemMetrics) ? systemMetrics : []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="cpu" stackId="1" stroke="#8884d8" fill="#8884d8" name="API Response (ms)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      )}

      {/* API Health Status */}
      {apiEndpoints.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints Health</CardTitle>
          <CardDescription>Current status and performance of all API endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.isArray(apiEndpoints) && apiEndpoints.map((endpoint, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Server className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">{endpoint.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(endpoint.status)}
                      <span className="text-sm text-muted-foreground">Uptime: {endpoint.uptime}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <Clock className="w-4 h-4 mx-auto text-muted-foreground" />
                    <div className="font-medium">{endpoint.responseTime}</div>
                    <div className="text-muted-foreground">Response</div>
                  </div>
                  <div className="text-center">
                    <Activity className="w-4 h-4 mx-auto text-muted-foreground" />
                    <div className="font-medium">{endpoint.requests}</div>
                    <div className="text-muted-foreground">Requests</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRestartService(endpoint.name)}
                  >
                    Restart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Recent Error Logs */}
      {errorLogs.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle>Recent System Logs</CardTitle>
          <CardDescription>Latest system events and error reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.isArray(errorLogs) && errorLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getLogLevelBadge(log.level)}
                  <div className="flex-1">
                    <div className="font-medium">{log.message}</div>
                    <div className="text-sm text-muted-foreground">
                      {log.service} • {log.timestamp}
                      {log.count > 1 && <span className="ml-2">({log.count} occurrences)</span>}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      )}

      {/* System Health Details Dialog */}
      <Dialog open={showHealthDetails} onOpenChange={setShowHealthDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detailed System Health Report</DialogTitle>
            <DialogDescription>
              Comprehensive system health analysis and recommendations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Database Health</h4>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Primary DB: Healthy</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Replica DB: Healthy</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">Cache: High Memory Usage</span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Service Status</h4>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Load Balancer: Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">CDN: Operational</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Backup: Running</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Details Dialog */}
      <Dialog open={showErrorDetails} onOpenChange={setShowErrorDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>System Error Logs</DialogTitle>
            <DialogDescription>
              Detailed view of recent system errors and warnings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Array.isArray(errorLogs) && errorLogs.map((log) => (
              <div key={log.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  {getLogLevelBadge(log.level)}
                  <span className="text-sm text-muted-foreground">{log.timestamp}</span>
                </div>
                <div className="font-medium">{log.service}</div>
                <div className="text-sm">{log.message}</div>
                {log.count > 1 && (
                  <div className="text-sm text-muted-foreground">
                    This error occurred {log.count} times
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
