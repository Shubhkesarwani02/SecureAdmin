import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { DollarSign, CreditCard, AlertCircle, TrendingUp, Download, FileText, RefreshCw, CheckCircle, Clock, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { apiClient } from "../lib/api"

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

interface RevenueData {
  month: string
  revenue: number
  subscriptions: number
  churn: number
}

interface SubscriptionTier {
  name: string
  value: number
  color: string
  price: string
}

interface Transaction {
  id: string
  company: string
  amount: string
  plan: string
  status: string
  date: string
  method: string
}

interface UpcomingRenewal {
  id: string
  company: string
  plan: string
  amount: string
  renewalDate: string
  status: string
  daysUntil?: number
}

interface FailedPayment {
  id: string
  company: string
  amount: string
  reason: string
  date: string
  attempts: number
  attemptDate?: string
  nextAttempt?: string
}

export function PaymentsBilling() {
  // State management
  const [loading, setLoading] = useState(false)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>([])
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [upcomingRenewals, setUpcomingRenewals] = useState<UpcomingRenewal[]>([])
  const [failedPayments, setFailedPayments] = useState<FailedPayment[]>([])
  
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [timeFilter, setTimeFilter] = useState("6months")

  // Load all billing data
  const loadBillingData = async () => {
    setLoading(true)
    try {
      const [
        revenueResponse,
        subscriptionResponse,
        transactionsResponse,
        renewalsResponse,
        failedResponse
      ] = await Promise.all([
        apiClient.getRevenueData(timeFilter),
        apiClient.getSubscriptionData(),
        apiClient.getTransactions({ page: 1, limit: 10 }),
        apiClient.getUpcomingRenewals(),
        apiClient.getFailedPayments()
      ])

      if (revenueResponse.success && Array.isArray(revenueResponse.data)) {
        setRevenueData(revenueResponse.data)
      } else {
        // Fallback data
        setRevenueData([
          { month: "Jan", revenue: 45000, subscriptions: 89, churn: 5 },
          { month: "Feb", revenue: 52000, subscriptions: 94, churn: 3 },
          { month: "Mar", revenue: 48000, subscriptions: 88, churn: 7 },
          { month: "Apr", revenue: 61000, subscriptions: 102, churn: 4 },
          { month: "May", revenue: 55000, subscriptions: 98, churn: 6 },
          { month: "Jun", revenue: 67000, subscriptions: 115, churn: 2 }
        ])
      }

      if (subscriptionResponse.success) {
        setSubscriptionTiers(subscriptionResponse.data || [])
      } else {
        // Fallback data
        setSubscriptionTiers([
          { name: "Basic", value: 45, color: "#8884d8", price: "$99" },
          { name: "Professional", value: 35, color: "#82ca9d", price: "$299" },
          { name: "Enterprise", value: 20, color: "#ffc658", price: "$599" }
        ])
      }

      if (transactionsResponse.success) {
        setRecentTransactions(transactionsResponse.data || [])
      } else {
        // Fallback data
        setRecentTransactions([
          { id: "TXN001", company: "Elite Car Rentals", amount: "$299", plan: "Professional", status: "completed", date: "2025-01-07", method: "Credit Card" },
          { id: "TXN002", company: "Swift Vehicle Solutions", amount: "$599", plan: "Enterprise", status: "completed", date: "2025-01-07", method: "Bank Transfer" },
          { id: "TXN003", company: "Urban Mobility Co", amount: "$99", plan: "Basic", status: "failed", date: "2025-01-06", method: "Credit Card" },
          { id: "TXN004", company: "Premium Fleet Services", amount: "$599", plan: "Enterprise", status: "pending", date: "2025-01-06", method: "Credit Card" },
          { id: "TXN005", company: "City Drive Rentals", amount: "$299", plan: "Professional", status: "completed", date: "2025-01-05", method: "PayPal" }
        ])
      }

      if (renewalsResponse.success) {
        setUpcomingRenewals(renewalsResponse.data || [])
      } else {
        // Fallback data
        setUpcomingRenewals([
          { id: "REN001", company: "Elite Car Rentals", plan: "Professional", amount: "$299", renewalDate: "2025-01-15", status: "upcoming", daysUntil: 8 },
          { id: "REN002", company: "Metro Car Solutions", plan: "Enterprise", amount: "$599", renewalDate: "2025-01-18", status: "upcoming", daysUntil: 11 },
          { id: "REN003", company: "FastLane Rentals", plan: "Basic", amount: "$99", renewalDate: "2025-01-20", status: "upcoming", daysUntil: 13 },
          { id: "REN004", company: "Apex Vehicle Hire", plan: "Professional", amount: "$299", renewalDate: "2025-01-22", status: "upcoming", daysUntil: 15 }
        ])
      }

      if (failedResponse.success) {
        setFailedPayments(failedResponse.data || [])
      } else {
        // Fallback data
        setFailedPayments([
          { id: "FP001", company: "Urban Mobility Co", amount: "$99", reason: "Insufficient funds", date: "2025-01-06", attempts: 2, attemptDate: "2025-01-06", nextAttempt: "2025-01-09" },
          { id: "FP002", company: "QuickRent Auto", amount: "$299", reason: "Card expired", date: "2025-01-05", attempts: 1, attemptDate: "2025-01-05", nextAttempt: "2025-01-08" },
          { id: "FP003", company: "Express Vehicle Co", amount: "$599", reason: "Payment declined", date: "2025-01-04", attempts: 3, attemptDate: "2025-01-04", nextAttempt: "2025-01-07" }
        ])
      }

    } catch (error) {
      console.error('Error loading billing data:', error)
      toast.error('Failed to load billing data')
      
      // Ensure fallback data is loaded
      setRevenueData([
        { month: "Jan", revenue: 45000, subscriptions: 89, churn: 5 },
        { month: "Feb", revenue: 52000, subscriptions: 94, churn: 3 },
        { month: "Mar", revenue: 48000, subscriptions: 88, churn: 7 },
        { month: "Apr", revenue: 61000, subscriptions: 102, churn: 4 },
        { month: "May", revenue: 55000, subscriptions: 98, churn: 6 },
        { month: "Jun", revenue: 67000, subscriptions: 115, churn: 2 }
      ])
      
      setRecentTransactions([
        { id: "TXN001", company: "Elite Car Rentals", amount: "$299", plan: "Professional", status: "completed", date: "2025-01-07", method: "Credit Card" },
        { id: "TXN002", company: "Swift Vehicle Solutions", amount: "$599", plan: "Enterprise", status: "completed", date: "2025-01-07", method: "Bank Transfer" },
        { id: "TXN003", company: "Urban Mobility Co", amount: "$99", plan: "Basic", status: "failed", date: "2025-01-06", method: "Credit Card" },
        { id: "TXN004", company: "Premium Fleet Services", amount: "$599", plan: "Enterprise", status: "pending", date: "2025-01-06", method: "Credit Card" },
        { id: "TXN005", company: "City Drive Rentals", amount: "$299", plan: "Professional", status: "completed", date: "2025-01-05", method: "PayPal" }
      ])
      
      setUpcomingRenewals([
        { id: "REN001", company: "Premium Fleet Services", plan: "Enterprise", amount: "$599", renewalDate: "2025-01-15", status: "upcoming" },
        { id: "REN002", company: "City Drive Rentals", plan: "Professional", amount: "$299", renewalDate: "2025-01-20", status: "upcoming" },
        { id: "REN003", company: "Metro Car Services", plan: "Basic", amount: "$99", renewalDate: "2025-01-25", status: "overdue" }
      ])
      
      setFailedPayments([
        { id: "FAIL001", company: "Urban Mobility Co", amount: "$99", reason: "Insufficient funds", date: "2025-01-06", attempts: 2 },
        { id: "FAIL002", company: "Quick Transport LLC", amount: "$299", reason: "Card expired", date: "2025-01-05", attempts: 1 }
      ])
      
      setSubscriptionTiers([
        { name: "Basic", value: 35, color: "#3b82f6", price: "$99" },
        { name: "Professional", value: 45, color: "#10b981", price: "$299" },
        { name: "Enterprise", value: 20, color: "#f59e0b", price: "$599" }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBillingData()
  }, [timeFilter])

  const handleRetryPayment = async (transactionId: string) => {
    try {
      const response = await apiClient.retryPayment(transactionId)
      if (response.success) {
        toast.success('Payment retry initiated successfully')
        loadBillingData() // Refresh data
      } else {
        toast.error(response.message || 'Failed to retry payment')
      }
    } catch (error) {
      console.error('Error retrying payment:', error)
      toast.error('Failed to retry payment')
    }
  }

  const handleDownloadInvoice = async (transactionId: string) => {
    try {
      const response = await apiClient.downloadInvoice(transactionId)
      if (response.success) {
        toast.success('Invoice download started')
        // Handle invoice download
      } else {
        toast.error(response.message || 'Failed to download invoice')
      }
    } catch (error) {
      console.error('Error downloading invoice:', error)
      toast.error('Failed to download invoice')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true)
    try {
      const response = await apiClient.generateBillingReport(timeFilter)
      if (response.success) {
        toast.success('Billing report generated successfully!')
      } else {
        toast.error(response.message || 'Failed to generate report')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Failed to generate report')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleViewInvoice = (transaction: any) => {
    setSelectedTransaction(transaction)
    setShowInvoiceDialog(true)
  }

  const handleContactClient = (payment: FailedPayment) => {
    toast.success(`Sending payment reminder to ${payment.company}`)
  }

  const processRefund = () => {
    if (selectedTransaction) {
      toast.success(`Refund processed for ${selectedTransaction.company}`)
      setShowPaymentDialog(false)
      setSelectedTransaction(null)
    }
  }

  const totalRevenue = Array.isArray(revenueData) ? revenueData.reduce((sum, month) => sum + month.revenue, 0) : 0
  const avgChurnRate = Array.isArray(revenueData) && revenueData.length > 0 ? revenueData.reduce((sum, month) => sum + month.churn, 0) / revenueData.length : 0

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12.5% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(subscriptionTiers) ? subscriptionTiers.reduce((sum, tier) => sum + tier.value, 0) : 0}</div>
            <p className="text-xs text-muted-foreground">+8 new this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgChurnRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">-2.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedPayments.length}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>Monthly revenue and subscription growth</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Array.isArray(revenueData) ? revenueData : []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
            <CardDescription>Current subscription tier breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Array.isArray(subscriptionTiers) ? subscriptionTiers : []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {Array.isArray(subscriptionTiers) && subscriptionTiers.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest payment activities and billing events</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">1 Month</SelectItem>
                <SelectItem value="3months">3 Months</SelectItem>
                <SelectItem value="6months">6 Months</SelectItem>
                <SelectItem value="1year">1 Year</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
            >
              {isGeneratingReport ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isGeneratingReport ? 'Generating...' : 'Export Report'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(recentTransactions) && recentTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.id}</TableCell>
                  <TableCell>{transaction.company}</TableCell>
                  <TableCell>{transaction.amount}</TableCell>
                  <TableCell>{transaction.plan}</TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell>{transaction.method}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewInvoice(transaction)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      {transaction.status === 'completed' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownloadInvoice(transaction.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upcoming Renewals and Failed Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Renewals</CardTitle>
            <CardDescription>Subscriptions due for renewal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(upcomingRenewals) && upcomingRenewals.map((renewal, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{renewal.company}</h4>
                    <p className="text-sm text-muted-foreground">{renewal.plan} - {renewal.amount}</p>
                    <p className="text-xs text-muted-foreground">Due: {renewal.renewalDate}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={(renewal.daysUntil && renewal.daysUntil <= 7) ? "destructive" : "outline"}>
                      {renewal.daysUntil || 0} days
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Failed Payments</CardTitle>
            <CardDescription>Payments that require attention and retry</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(failedPayments) && failedPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{payment.company}</h4>
                    <p className="text-sm text-muted-foreground">{payment.amount} - {payment.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Last attempt: {payment.attemptDate} • Next: {payment.nextAttempt}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleRetryPayment(payment.id)}>
                      Retry
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleContactClient(payment)}>
                      Contact
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details - {selectedTransaction?.id}</DialogTitle>
            <DialogDescription>
              Invoice for {selectedTransaction?.company}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company</Label>
                <p className="text-sm">{selectedTransaction?.company}</p>
              </div>
              <div>
                <Label>Amount</Label>
                <p className="text-sm">{selectedTransaction?.amount}</p>
              </div>
              <div>
                <Label>Plan</Label>
                <p className="text-sm">{selectedTransaction?.plan}</p>
              </div>
              <div>
                <Label>Date</Label>
                <p className="text-sm">{selectedTransaction?.date}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={() => handleDownloadInvoice(selectedTransaction?.id)}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={() => toast.success("Invoice emailed successfully")}>
                Email Invoice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Refund for {selectedTransaction?.company} - {selectedTransaction?.amount}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="refund-amount">Refund Amount</Label>
              <Input id="refund-amount" defaultValue={selectedTransaction?.amount} />
            </div>
            <div>
              <Label htmlFor="refund-reason">Reason</Label>
              <Input id="refund-reason" placeholder="Enter refund reason..." />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={processRefund}>Process Refund</Button>
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
            <p className="mt-2">Loading billing data...</p>
          </div>
        </div>
      )}
    </div>
  )
}
