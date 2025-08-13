"use client"

import { useEffect, useMemo, useState } from "react"
import { apiClient } from "../lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Badge } from "./ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Separator } from "./ui/separator"
import { AlertCircle, CheckCircle2, RefreshCw, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

type Overview = {
  totalClients: number
  healthyClients: number
  atRiskClients: number
  criticalClients: number
  averageHealthScore: number
  totalActiveAlerts: number
  criticalAlerts: number
  churnRiskClients: number
  lastUpdated: string
}

type HealthScore = {
  id: number
  clientId: number
  companyName: string
  overallScore: number
  usageScore: number
  engagementScore: number
  financialScore: number
  supportScore: number
  riskLevel: "low" | "medium" | "high" | "critical"
  healthTrend: "improving" | "stable" | "declining" | "critical"
  churnProbability: number
  daysSinceLastActivity: number
  featureAdoptionRate: number
  lastHealthCheck: string
  activeAlerts: number
  criticalAlerts: number
}

type AlertItem = {
  id: number
  clientId: number
  companyName: string
  alertType: string
  severity: "low" | "medium" | "high" | "critical"
  title: string
  description: string
  status: "active" | "acknowledged" | "resolved"
  assignedTo: string
  createdAt: string
}

function ScoreBar({ score }: { score: number }) {
  const width = Math.max(0, Math.min(100, score))
  return (
    <div className="w-32 h-2 bg-muted rounded-full">
      <div className="h-2 bg-primary rounded-full" style={{ width: `${width}%` }} />
    </div>
  )
}

function RiskBadge({ level }: { level: HealthScore["riskLevel"] }) {
  const variant =
    level === "low" ? "secondary" : level === "medium" ? "default" : level === "high" ? "destructive" : "destructive"
  const label = level === "critical" ? "CRITICAL" : `${level.toUpperCase()} RISK`
  return <Badge variant={level === "low" ? "outline" : variant} className={level === "critical" ? "bg-red-600 text-white" : undefined}>{label}</Badge>
}

export function AccountHealth() {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [scores, setScores] = useState<HealthScore[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [riskFilter, setRiskFilter] = useState<string | undefined>(undefined)

  const loadAll = async () => {
    setLoading(true)
    const [ov, sc, al] = await Promise.all([
      apiClient.getAccountHealthOverview(),
      apiClient.getAccountHealthScores(riskFilter ? { riskLevel: riskFilter } : undefined),
      apiClient.getAccountHealthAlerts({ status: "active" })
    ])
    if (ov.success) setOverview(ov.data as Overview)
    if (sc.success) setScores(sc.data as unknown as HealthScore[])
    if (al.success) setAlerts(al.data as unknown as AlertItem[])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskFilter])

  const groupedInsights = useMemo(() => {
    const topRiskFactors: { label: string; count: number }[] = []
    // Simple demo derivation based on mock data
    const lowEng = alerts.filter(a => a.alertType === 'low_engagement' && a.status === 'active').length
    if (lowEng) topRiskFactors.push({ label: 'Low engagement (14+ days inactive)', count: lowEng })
    const churn = (scores || []).filter(s => s.churnProbability > 30).length
    if (churn) topRiskFactors.push({ label: 'High churn probability', count: churn })
    const lowAdopt = alerts.filter(a => a.alertType === 'feature_adoption').length
    if (lowAdopt) topRiskFactors.push({ label: 'Low feature adoption', count: lowAdopt })
    return topRiskFactors
  }, [alerts, scores])

  const refreshScores = async () => {
    const res = await apiClient.refreshAccountHealthScores()
    if (res.success) {
      toast.success("Scores refreshed")
      loadAll()
    } else {
      toast.error(res.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Account Health Monitoring</h2>
          <p className="text-sm text-muted-foreground">Proactive client health tracking and churn prevention</p>
        </div>
        <Button onClick={refreshScores} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh Scores
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardDescription>Healthy Clients</CardDescription>
            <CardTitle className="text-3xl">{overview?.healthyClients ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>At Risk</CardDescription>
            <CardTitle className="text-3xl">{overview?.atRiskClients ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Critical Risk</CardDescription>
            <CardTitle className="text-3xl">{overview?.criticalClients ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Avg Health Score</CardDescription>
            <CardTitle className="text-3xl">{overview?.averageHealthScore ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="scores">
        <TabsList>
          <TabsTrigger value="scores">Health Scores</TabsTrigger>
          <TabsTrigger value="alerts">Alerts {overview?.totalActiveAlerts ? <Badge className="ml-1">{overview.totalActiveAlerts}</Badge> : null}</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="scores" className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter by Risk:</span>
            <div className="flex gap-2">
              {['all','low','medium','high','critical'].map(level => (
                <Button key={level} size="sm" variant={riskFilter === (level === 'all' ? undefined : level) ? 'default' : 'outline'} onClick={() => setRiskFilter(level === 'all' ? undefined : level)}>
                  {level === 'all' ? 'All' : level.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Financial</TableHead>
                    <TableHead>Support</TableHead>
                    <TableHead className="text-right">Health Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scores.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.companyName}</TableCell>
                      <TableCell><RiskBadge level={s.riskLevel} /></TableCell>
                      <TableCell><ScoreBar score={s.usageScore} /></TableCell>
                      <TableCell><ScoreBar score={s.engagementScore} /></TableCell>
                      <TableCell><ScoreBar score={s.financialScore} /></TableCell>
                      <TableCell><ScoreBar score={s.supportScore} /></TableCell>
                      <TableCell className="text-right font-semibold">{s.overallScore}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Alerts</CardTitle>
              <CardDescription>Issues requiring attention</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Alert</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.companyName}</TableCell>
                      <TableCell>{a.title}</TableCell>
                      <TableCell>
                        {a.severity === 'critical' ? (
                          <Badge className="bg-red-600 text-white">CRITICAL</Badge>
                        ) : a.severity === 'high' ? (
                          <Badge variant="destructive">HIGH</Badge>
                        ) : a.severity === 'medium' ? (
                          <Badge>MEDIUM</Badge>
                        ) : (
                          <Badge variant="outline">LOW</Badge>
                        )}
                      </TableCell>
                      <TableCell className="capitalize">{a.status}</TableCell>
                      <TableCell>{a.assignedTo}</TableCell>
                      <TableCell>{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {a.status !== 'acknowledged' && (
                          <Button size="sm" variant="outline" onClick={async () => {
                            const res = await apiClient.acknowledgeAccountHealthAlert(a.id)
                            if (res.success) { toast.success('Alert acknowledged'); loadAll() } else { toast.error(res.message) }
                          }}>Acknowledge</Button>
                        )}
                        {a.status !== 'resolved' && (
                          <Button size="sm" onClick={async () => {
                            const res = await apiClient.resolveAccountHealthAlert(a.id)
                            if (res.success) { toast.success('Alert resolved'); loadAll() } else { toast.error(res.message) }
                          }}>Resolve</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><TriangleAlert className="w-4 h-4" /> Top Risk Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {groupedInsights.length === 0 && (
                    <p className="text-sm text-muted-foreground">No significant risk factors detected.</p>
                  )}
                  {groupedInsights.map(item => (
                    <div key={item.label} className="flex items-center justify-between p-3 rounded-md border">
                      <span>{item.label}</span>
                      <Badge variant="secondary">{item.count} {item.count === 1 ? 'client' : 'clients'}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Action Required</CardTitle>
                <CardDescription>Prioritized follow-ups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.filter(a => a.status === 'active').slice(0, 3).map(a => (
                  <div key={a.id} className="p-3 border rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{a.companyName}</div>
                      {a.severity === 'critical' ? <Badge className="bg-red-600 text-white">CRITICAL</Badge> : <Badge>{a.severity.toUpperCase()}</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">- {a.description}</div>
                  </div>
                ))}
                {alerts.filter(a => a.status === 'active').length === 0 && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> No active actions pending.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Separator />
      <div className="text-xs text-muted-foreground">Last updated: {overview?.lastUpdated ? new Date(overview.lastUpdated).toLocaleString() : '-'}</div>
    </div>
  )
}

export default AccountHealth


