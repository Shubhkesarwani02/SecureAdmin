import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Progress } from "./ui/progress"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { Building2, DollarSign, Calendar, Server, AlertCircle, TrendingUp, Users, Activity, FileText, Settings, CreditCard, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { useState } from "react"

// Simple toast implementation
const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
  console.log(`[${type.toUpperCase()}] ${message}`)
  alert(`${type.toUpperCase()}: ${message}`)
}

const monthlyRevenueData = [
  { month: "Jan", revenue: 45000, bookings: 1200 },
  { month: "Feb", revenue: 52000, bookings: 1450 },
  { month: "Mar", revenue: 48000, bookings: 1320 },
  { month: "Apr", revenue: 61000, bookings: 1680 },
  { month: "May", revenue: 55000, bookings: 1520 },
  { month: "Jun", revenue: 67000, bookings: 1890 }
]

const serverUsageData = [
  { name: "API", value: 45, color: "#8884d8" },
  { name: "Database", value: 32, color: "#82ca9d" },
  { name: "Storage", value: 23, color: "#ffc658" }
]

const pendingKycData = [
  { id: 1, company: "Urban Mobility Co", submittedAt: "2025-01-05", status: "Under Review" },
  { id: 2, company: "City Drive Rentals", submittedAt: "2025-01-04", status: "Pending Documents" },
  { id: 3, company: "Metro Car Solutions", submittedAt: "2025-01-03", status: "Under Review" }
]

const paymentIssues = [
  { id: 1, company: "Elite Car Rentals", issue: "Payment method expired", amount: "$299" },
  { id: 2, company: "Swift Vehicle Solutions", issue: "Insufficient funds", amount: "$599" },
  { id: 3, company: "Premium Fleet Services", issue: "Bank verification needed", amount: "$899" }
]

export function OverviewDashboard() {
  const [showKycDialog, setShowKycDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  const handleReviewKyc = () => {
    setShowKycDialog(true)
  }

  const handleProcessPayments = () => {
    setShowPaymentDialog(true)
  }

  const handleUpdateSettings = () => {
    showToast("Redirecting to system settings...", "info")
    // In a real app, this would navigate to settings
  }

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true)
    setShowReportDialog(true)
    
    // Simulate report generation
    setTimeout(() => {
      setIsGeneratingReport(false)
      showToast("Monthly report generated successfully!", "success")
    }, 3000)
  }

  const handleKycAction = (id: number, action: string) => {
    showToast(`KYC ${action} for client ID ${id}`, "success")
    setShowKycDialog(false)
  }

  const handlePaymentAction = (id: number, action: string) => {
    showToast(`Payment ${action} for issue ID ${id}`, "success")
    setShowPaymentDialog(false)
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rental Companies</CardTitle>
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8,923</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+18%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$67,000</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+22%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
            <AlertCircle className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Bookings Trend</CardTitle>
            <CardDescription>Monthly performance over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8884d8" name="Revenue ($)" />
                <Bar dataKey="bookings" fill="#82ca9d" name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Server Usage Distribution</CardTitle>
            <CardDescription>Current resource utilization across services</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serverUsageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {serverUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Overall platform status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Uptime</span>
              <span className="text-sm font-medium">99.8%</span>
            </div>
            <Progress value={99.8} className="h-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Database Health</span>
              <span className="text-sm font-medium">98.5%</span>
            </div>
            <Progress value={98.5} className="h-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Average Response Time</span>
              <span className="text-sm font-medium">120ms</span>
            </div>
            <Progress value={85} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge className="text-xs">AI Recommendation</Badge>
                <span className="text-sm">New client onboarded</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs">Tracking Active</Badge>
                <span className="text-sm">Fleet sync completed</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs">Connected via WhatsApp</Badge>
                <span className="text-sm">Integration updated</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="text-xs bg-green-500">Marketing Active</Badge>
                <span className="text-sm">Campaign launched</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={handleReviewKyc}
            >
              <AlertCircle className="w-4 h-4 text-orange-500" />
              Review Pending KYC (23)
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={handleProcessPayments}
            >
              <CreditCard className="w-4 h-4 text-red-500" />
              Process Payment Issues (5)
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={handleUpdateSettings}
            >
              <Settings className="w-4 h-4" />
              Update System Settings
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={handleGenerateReport}
            >
              <FileText className="w-4 h-4" />
              Generate Monthly Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* KYC Review Dialog */}
      <Dialog open={showKycDialog} onOpenChange={setShowKycDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pending KYC Reviews</DialogTitle>
            <DialogDescription>
              Review and approve or reject KYC submissions from rental companies
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {pendingKycData.map((kyc) => (
              <div key={kyc.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{kyc.company}</h4>
                  <p className="text-sm text-muted-foreground">Submitted: {kyc.submittedAt}</p>
                  <Badge variant="outline" className="mt-1">{kyc.status}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleKycAction(kyc.id, 'approved')}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleKycAction(kyc.id, 'rejected')}>
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Issues Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Issues</DialogTitle>
            <DialogDescription>
              Resolve payment issues and process failed transactions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {paymentIssues.map((issue) => (
              <div key={issue.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{issue.company}</h4>
                  <p className="text-sm text-muted-foreground">{issue.issue}</p>
                  <Badge variant="destructive" className="mt-1">{issue.amount}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handlePaymentAction(issue.id, 'resolved')}>
                    Resolve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handlePaymentAction(issue.id, 'contacted')}>
                    Contact Client
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Generation Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Monthly Report</DialogTitle>
            <DialogDescription>
              {isGeneratingReport 
                ? "Generating comprehensive monthly report..." 
                : "Monthly report has been generated successfully!"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            {isGeneratingReport ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span>Processing data...</span>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-green-600 font-medium">Report Generated!</div>
                <Button onClick={() => setShowReportDialog(false)}>
                  Download Report
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
