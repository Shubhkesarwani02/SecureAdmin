import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Progress } from "./ui/progress"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { Building2, DollarSign, Calendar, Server, AlertCircle, TrendingUp, Users, Activity, FileText, Settings, CreditCard, AlertTriangle, Download, Loader } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Label } from "./ui/label"
import { Switch } from "./ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

// API Service
const apiService = {
  async getDashboardSummary() {
    const response = await fetch('/api/dashboard/summary', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  },

  async getQuickActions() {
    const response = await fetch('/api/dashboard/quick-actions', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  },

  async getNotifications() {
    const response = await fetch('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  },

  async getNotificationSettings() {
    const response = await fetch('/api/user/notification-settings', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  },

  async updateNotificationSettings(settings: any) {
    const response = await fetch('/api/user/notification-settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(settings)
    });
    return response.json();
  },

  async getUserPreferences() {
    const response = await fetch('/api/user/preferences', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  },

  async updateUserPreferences(preferences: any) {
    const response = await fetch('/api/user/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ preferences })
    });
    return response.json();
  },

  async generateReport(reportType = 'monthly', format = 'pdf') {
    const response = await fetch('/api/dashboard/generate-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ reportType, format })
    });
    return response.json();
  },

  downloadReport(fileName: string) {
    const link = document.createElement('a');
    link.href = `/api/dashboard/download-report/${fileName}`;
    link.download = fileName;
    link.click();
  }
};

// Simple toast implementation
const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
  console.log(`[${type.toUpperCase()}] ${message}`)
  // You can integrate with a proper toast library here
  alert(`${type.toUpperCase()}: ${message}`)
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export function OverviewDashboard() {
  // State management
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [quickActions, setQuickActions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<any>({});
  const [userPreferences, setUserPreferences] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [showPreferencesDialog, setShowPreferencesDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryRes, actionsRes, notificationsRes, settingsRes, preferencesRes] = await Promise.all([
        apiService.getDashboardSummary(),
        apiService.getQuickActions(),
        apiService.getNotifications(),
        apiService.getNotificationSettings(),
        apiService.getUserPreferences()
      ]);

      if (summaryRes.success) setDashboardData(summaryRes.data);
      if (actionsRes.success) setQuickActions(actionsRes.data);
      if (notificationsRes.success) setNotifications(notificationsRes.data);
      if (settingsRes.success) setNotificationSettings(settingsRes.data);
      if (preferencesRes.success) setUserPreferences(preferencesRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action: any) => {
    if (action.action === 'generate_report') {
      await handleGenerateReport();
    } else if (action.action === 'navigate') {
      showToast(`Navigating to ${action.target}...`, 'info');
      // In a real app, this would navigate to the specified route
      window.location.href = action.target;
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    setShowReportDialog(true);
    
    try {
      const result = await apiService.generateReport('monthly', 'pdf');
      if (result.success) {
        setReportData(result.data);
        showToast('Monthly report generated successfully!', 'success');
        
        // Auto download the report
        if (result.data.fileName) {
          setTimeout(() => {
            apiService.downloadReport(result.data.fileName);
          }, 1000);
        }
      } else {
        showToast('Failed to generate report', 'error');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      showToast('Failed to generate report', 'error');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleNotificationSettingsUpdate = async (newSettings: any) => {
    try {
      const result = await apiService.updateNotificationSettings(newSettings);
      if (result.success) {
        setNotificationSettings(newSettings);
        showToast('Notification settings updated successfully!', 'success');
      } else {
        showToast('Failed to update notification settings', 'error');
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      showToast('Failed to update notification settings', 'error');
    }
  };

  const handlePreferencesUpdate = async (newPreferences: any) => {
    try {
      const result = await apiService.updateUserPreferences(newPreferences);
      if (result.success) {
        setUserPreferences(newPreferences);
        showToast('Preferences updated successfully!', 'success');
      } else {
        showToast('Failed to update preferences', 'error');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      showToast('Failed to update preferences', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <span className="ml-2">Failed to load dashboard data</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Overview Dashboard</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowNotificationDialog(true)}
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Notifications ({notifications.length})
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowPreferencesDialog(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rental Companies</CardTitle>
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.kpis.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{dashboardData.kpis.growth.companiesGrowth}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.kpis.totalBookings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{dashboardData.kpis.growth.bookingsGrowth}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.kpis.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{dashboardData.kpis.growth.revenueGrowth}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
            <Server className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.kpis.activeVehicles}</div>
            <p className="text-xs text-muted-foreground">
              of {dashboardData.kpis.totalVehicles} total vehicles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData.trends.revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Growth</CardTitle>
            <CardDescription>New client registrations per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.trends.clients}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="clients" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* System Health & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Platform status overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Uptime</span>
              <span className="text-sm font-medium">{dashboardData.systemHealth.uptime}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Response Time</span>
              <span className="text-sm font-medium">{dashboardData.systemHealth.apiResponseTime}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Error Rate</span>
              <span className="text-sm font-medium">{dashboardData.systemHealth.errorRate}</span>
            </div>

            <Badge 
              variant={dashboardData.systemHealth.status === 'operational' ? 'default' : 'destructive'}
              className="w-full justify-center"
            >
              {dashboardData.systemHealth.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.recentActivity.slice(0, 4).map((activity: any, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    {activity.type.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm truncate">{activity.title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => (
              <Button 
                key={action.id}
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => handleQuickAction(action)}
              >
                <Activity className="w-4 h-4" />
                {action.title}
                {action.count > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {action.count}
                  </Badge>
                )}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

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

      {/* Notification Settings Dialog */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Notification Settings</DialogTitle>
            <DialogDescription>
              Manage your notification preferences
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Email Notifications</label>
              <input 
                type="checkbox" 
                checked={notificationSettings.email}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  email: e.target.checked
                }))}
                className="rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Push Notifications</label>
              <input 
                type="checkbox" 
                checked={notificationSettings.push}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  push: e.target.checked
                }))}
                className="rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">SMS Notifications</label>
              <input 
                type="checkbox" 
                checked={notificationSettings.sms}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  sms: e.target.checked
                }))}
                className="rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Security Alerts</label>
              <input 
                type="checkbox" 
                checked={notificationSettings.security}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  security: e.target.checked
                }))}
                className="rounded"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowNotificationDialog(false)}>
                Cancel
              </Button>
              <Button onClick={async () => {
                try {
                  await apiService.updateNotificationSettings(notificationSettings);
                  showToast('Notification settings updated!', 'success');
                  setShowNotificationDialog(false);
                } catch (error) {
                  showToast('Failed to update settings', 'error');
                }
              }}>
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Preferences Dialog */}
      <Dialog open={showPreferencesDialog} onOpenChange={setShowPreferencesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Account Preferences</DialogTitle>
            <DialogDescription>
              Customize your account settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Default Dashboard View</label>
              <select 
                value={userPreferences.defaultView}
                onChange={(e) => setUserPreferences(prev => ({
                  ...prev,
                  defaultView: e.target.value
                }))}
                className="w-full mt-1 p-2 border rounded"
              >
                <option value="overview">Overview</option>
                <option value="analytics">Analytics</option>
                <option value="clients">Clients</option>
                <option value="reports">Reports</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Time Zone</label>
              <select 
                value={userPreferences.timezone}
                onChange={(e) => setUserPreferences(prev => ({
                  ...prev,
                  timezone: e.target.value
                }))}
                className="w-full mt-1 p-2 border rounded"
              >
                <option value="UTC">UTC</option>
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Language</label>
              <select 
                value={userPreferences.language}
                onChange={(e) => setUserPreferences(prev => ({
                  ...prev,
                  language: e.target.value
                }))}
                className="w-full mt-1 p-2 border rounded"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="es">Spanish</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Dark Mode</label>
              <input 
                type="checkbox" 
                checked={userPreferences.darkMode}
                onChange={(e) => setUserPreferences(prev => ({
                  ...prev,
                  darkMode: e.target.checked
                }))}
                className="rounded"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowPreferencesDialog(false)}>
                Cancel
              </Button>
              <Button onClick={async () => {
                try {
                  await apiService.updateUserPreferences(userPreferences);
                  showToast('Preferences updated!', 'success');
                  setShowPreferencesDialog(false);
                } catch (error) {
                  showToast('Failed to update preferences', 'error');
                }
              }}>
                Save Preferences
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
