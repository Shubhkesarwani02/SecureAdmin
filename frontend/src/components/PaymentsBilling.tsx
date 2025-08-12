import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Progress } from "./ui/progress"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { DollarSign, CreditCard, AlertCircle, TrendingUp, Download, FileText, RefreshCw, CheckCircle, Clock, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { useState } from "react"

// Simple toast implementation
const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
  console.log(`[${type.toUpperCase()}] ${message}`)
  alert(`${type.toUpperCase()}: ${message}`)
}

const revenueData = [
  { month: "Jan", revenue: 45000, subscriptions: 89, churn: 5 },
  { month: "Feb", revenue: 52000, subscriptions: 94, churn: 3 },
  { month: "Mar", revenue: 48000, subscriptions: 88, churn: 7 },
  { month: "Apr", revenue: 61000, subscriptions: 102, churn: 4 },
  { month: "May", revenue: 55000, subscriptions: 98, churn: 6 },
  { month: "Jun", revenue: 67000, subscriptions: 115, churn: 2 }
]

const subscriptionTiers = [
  { name: "Basic", value: 45, color: "#8884d8", price: "$99" },
  { name: "Professional", value: 35, color: "#82ca9d", price: "$299" },
  { name: "Enterprise", value: 20, color: "#ffc658", price: "$599" }
]

const recentTransactions = [
  { id: "TXN001", company: "Elite Car Rentals", amount: "$299", plan: "Professional", status: "completed", date: "2025-01-07", method: "Credit Card" },
  { id: "TXN002", company: "Swift Vehicle Solutions", amount: "$599", plan: "Enterprise", status: "completed", date: "2025-01-07", method: "Bank Transfer" },
  { id: "TXN003", company: "Urban Mobility Co", amount: "$99", plan: "Basic", status: "failed", date: "2025-01-06", method: "Credit Card" },
  { id: "TXN004", company: "Premium Fleet Services", amount: "$599", plan: "Enterprise", status: "pending", date: "2025-01-06", method: "Credit Card" },
  { id: "TXN005", company: "City Drive Rentals", amount: "$299", plan: "Professional", status: "completed", date: "2025-01-05", method: "PayPal" }
]

const upcomingRenewals = [
  { company: "Elite Car Rentals", plan: "Professional", amount: "$299", renewalDate: "2025-01-15", daysUntil: 8 },
  { company: "Metro Car Solutions", plan: "Enterprise", amount: "$599", renewalDate: "2025-01-18", daysUntil: 11 },
  { company: "FastLane Rentals", plan: "Basic", amount: "$99", renewalDate: "2025-01-20", daysUntil: 13 },
  { company: "Apex Vehicle Hire", plan: "Professional", amount: "$299", renewalDate: "2025-01-22", daysUntil: 15 }
]

const failedPayments = [
  { id: 1, company: "Urban Mobility Co", amount: "$99", reason: "Expired card", attempts: 2, lastAttempt: "2025-01-06" },
  { id: 2, company: "Budget Car Express", amount: "$299", reason: "Insufficient funds", attempts: 1, lastAttempt: "2025-01-05" },
  { id: 3, company: "Reliable Rentals", amount: "$599", reason: "Bank declined", attempts: 3, lastAttempt: "2025-01-04" }
]

export function PaymentsBilling() {
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [timeFilter, setTimeFilter] = useState("6months")

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
    setTimeout(() => {
      setIsGeneratingReport(false)
      showToast("Revenue report generated successfully!", "success")
    }, 2000)
  }

  const handleViewInvoice = (transaction: any) => {
    setSelectedTransaction(transaction)
    setShowInvoiceDialog(true)
  }

  const handleRetryPayment = (payment: any) => {
    showToast(`Retrying payment for ${payment.company}...`, "info")
  }

  const handleContactClient = (payment: any) => {
    showToast(`Sending payment reminder to ${payment.company}`, "info")
  }

  const handleRefundPayment = (transaction: any) => {
    setSelectedTransaction(transaction)
    setShowPaymentDialog(true)
  }

  const processRefund = () => {
    showToast(`Refund processed for ${selectedTransaction?.company}`, "success")
    setShowPaymentDialog(false)
    setSelectedTransaction(null)
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            {isGeneratingReport ? "Generating..." : "Generate Report"}
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">115</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+17%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-1%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <AlertCircle className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue and subscription growth</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue ($)" />
                <Line type="monotone" dataKey="subscriptions" stroke="#82ca9d" name="Subscriptions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Tiers</CardTitle>
            <CardDescription>Distribution of active subscription plans</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionTiers}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {subscriptionTiers.map((entry, index) => (
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
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest payment activities and subscription renewals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.id}</TableCell>
                    <TableCell>{transaction.company}</TableCell>
                    <TableCell>{transaction.amount}</TableCell>
                    <TableCell>{transaction.plan}</TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.method}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewInvoice(transaction)}>
                          View Invoice
                        </Button>
                        {transaction.status === "completed" && (
                          <Button variant="outline" size="sm" onClick={() => handleRefundPayment(transaction)}>
                            Refund
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Renewals & Failed Payments */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Renewals</CardTitle>
            <CardDescription>Subscriptions renewing in the next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingRenewals.map((renewal, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{renewal.company}</h4>
                    <p className="text-sm text-muted-foreground">{renewal.plan} - {renewal.amount}</p>
                    <p className="text-xs text-muted-foreground">
                      Renews in {renewal.daysUntil} days ({renewal.renewalDate})
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Send Reminder
                  </Button>
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
              {failedPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{payment.company}</h4>
                    <p className="text-sm text-muted-foreground">{payment.amount} - {payment.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {payment.attempts} attempts • Last: {payment.lastAttempt}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleRetryPayment(payment)}>
                      Retry
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleContactClient(payment)}>
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
              Complete invoice information and payment details
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company</Label>
                  <p className="font-medium">{selectedTransaction.company}</p>
                </div>
                <div>
                  <Label>Transaction ID</Label>
                  <p className="font-medium">{selectedTransaction.id}</p>
                </div>
                <div>
                  <Label>Amount</Label>
                  <p className="font-medium">{selectedTransaction.amount}</p>
                </div>
                <div>
                  <Label>Plan</Label>
                  <p className="font-medium">{selectedTransaction.plan}</p>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <p className="font-medium">{selectedTransaction.method}</p>
                </div>
                <div>
                  <Label>Date</Label>
                  <p className="font-medium">{new Date(selectedTransaction.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => showToast("Invoice downloaded", "success")}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Invoice
                </Button>
                <Button variant="outline" onClick={() => showToast("Invoice emailed", "success")}>
                  Email Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Process a refund for {selectedTransaction?.company}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div>
                <Label>Refund Amount</Label>
                <Input defaultValue={selectedTransaction.amount} />
              </div>
              <div>
                <Label>Reason</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select refund reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer_request">Customer Request</SelectItem>
                    <SelectItem value="billing_error">Billing Error</SelectItem>
                    <SelectItem value="service_issue">Service Issue</SelectItem>
                    <SelectItem value="duplicate_charge">Duplicate Charge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={processRefund}>Process Refund</Button>
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
