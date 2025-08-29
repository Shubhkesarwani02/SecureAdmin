import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Progress } from "./ui/progress"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Building2, DollarSign, Calendar, Server, AlertCircle, Activity, FileText, Settings, CreditCard } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"

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
  alert(`${type.toUpperCase()}: ${message}`)
}

export function OverviewDashboard() {
  // State management
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [quickActions, setQuickActions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<any>({
    email: true,
    push: true,
    sms: false,
    security: true
  });
  const [userPreferences, setUserPreferences] = useState<any>({
    defaultView: 'overview',
    timezone: 'UTC',
    language: 'en',
    darkMode: false
  });
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [showPreferencesDialog, setShowPreferencesDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertCircle className="w-8 h-8 text-red-500" />
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
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              +{dashboardData.growth.clients}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboardData.totalRevenue?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{dashboardData.growth.revenue}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalVehicles}</div>
            <p className="text-xs text-muted-foreground">
              +{dashboardData.growth.vehicles}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.systemHealth?.uptime || '99.9%'}</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant={dashboardData.systemHealth?.status === 'operational' ? 'default' : 'destructive'}>
                {dashboardData.systemHealth?.status || 'operational'}
              </Badge>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used actions based on your role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2"
                onClick={() => handleQuickAction(action)}
              >
                <div className="flex items-center gap-2 w-full">
                  {action.icon === 'AlertCircle' && <AlertCircle className="w-4 h-4" />}
                  {action.icon === 'CreditCard' && <CreditCard className="w-4 h-4" />}
                  {action.icon === 'Settings' && <Settings className="w-4 h-4" />}
                  {action.icon === 'FileText' && <FileText className="w-4 h-4" />}
                  {action.icon === 'Activity' && <Activity className="w-4 h-4" />}
                  <span className="font-medium">{action.title}</span>
                  {action.count > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {action.count}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground text-left">
                  {action.description}
                </p>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest notifications and system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications.slice(0, 5).map((notification) => (
              <div key={notification.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    notification.priority === 'critical' ? 'bg-red-500' :
                    notification.priority === 'high' ? 'bg-orange-500' :
                    notification.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div>
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                  </div>
                </div>
                <Badge variant={notification.is_read ? 'secondary' : 'default'}>
                  {notification.is_read ? 'Read' : 'New'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
