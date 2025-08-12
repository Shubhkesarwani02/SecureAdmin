import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Switch } from "./ui/switch"
import { Separator } from "./ui/separator"
import { UserPlus, Shield, Settings, Bell, Lock, Eye, Edit, Trash2, Clock, Users, Key, Database } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog"
import { useState } from "react"

// Simple toast implementation
const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
  console.log(`[${type.toUpperCase()}] ${message}`)
  alert(`${type.toUpperCase()}: ${message}`)
}

const adminUsers = [
  {
    id: 1,
    name: "John Anderson",
    email: "john@framtt.com",
    role: "Super Admin",
    status: "Active",
    lastLogin: "2025-01-07 09:30",
    permissions: ["full_access", "user_management", "system_config", "billing_access"]
  },
  {
    id: 2,
    name: "Sarah Chen",
    email: "sarah@framtt.com",
    role: "Admin",
    status: "Active",
    lastLogin: "2025-01-06 14:22",
    permissions: ["user_management", "client_support", "reports_access"]
  },
  {
    id: 3,
    name: "Mike Rodriguez",
    email: "mike@framtt.com",
    role: "Support Lead",
    status: "Active",
    lastLogin: "2025-01-07 08:15",
    permissions: ["client_support", "reports_access"]
  },
  {
    id: 4,
    name: "Emma Wilson",
    email: "emma@framtt.com",
    role: "Developer",
    status: "Inactive",
    lastLogin: "2024-12-20 16:45",
    permissions: ["system_config", "api_access"]
  }
]

const systemSettings = {
  notifications: {
    emailAlerts: true,
    slackIntegration: false,
    smsAlerts: true,
    dailyReports: true
  },
  security: {
    twoFactorAuth: true,
    passwordExpiry: 90,
    sessionTimeout: 8,
    apiRateLimit: 1000
  },
  platform: {
    maintenanceMode: false,
    autoBackups: true,
    logRetention: 30,
    maxClients: 500
  }
}

const auditLogs = [
  { id: 1, user: "John Anderson", action: "Updated system settings", timestamp: "2025-01-07 10:15", ip: "192.168.1.100" },
  { id: 2, user: "Sarah Chen", action: "Created new admin user", timestamp: "2025-01-06 16:30", ip: "192.168.1.105" },
  { id: 3, user: "Mike Rodriguez", action: "Disabled client account", timestamp: "2025-01-06 14:20", ip: "192.168.1.110" },
  { id: 4, user: "John Anderson", action: "Generated system report", timestamp: "2025-01-06 09:45", ip: "192.168.1.100" }
]

export function AdminSettings() {
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false)
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [settings, setSettings] = useState(systemSettings)

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Super Admin":
        return <Badge className="bg-red-500">{role}</Badge>
      case "Admin":
        return <Badge className="bg-blue-500">{role}</Badge>
      case "Support Lead":
        return <Badge className="bg-green-500">{role}</Badge>
      case "Developer":
        return <Badge className="bg-purple-500">{role}</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-500">{status}</Badge>
      case "Inactive":
        return <Badge variant="secondary">{status}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleCreateUser = () => {
    setShowCreateUserDialog(true)
  }

  const handleEditUser = (user: any) => {
    setSelectedUser(user)
    setShowEditUserDialog(true)
  }

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user)
    setShowDeleteDialog(true)
  }

  const confirmDeleteUser = () => {
    showToast(`User ${selectedUser?.name} has been deleted`, "success")
    setShowDeleteDialog(false)
    setSelectedUser(null)
  }

  const handleSaveUser = () => {
    showToast("User information saved successfully!", "success")
    setShowCreateUserDialog(false)
    setShowEditUserDialog(false)
    setSelectedUser(null)
  }

  const handleSettingChange = (category: string, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value
      }
    }))
    showToast(`${setting} updated successfully`, "success")
  }

  const handleSaveSettings = () => {
    showToast("System settings saved successfully!", "success")
  }

  const handleResetSettings = () => {
    setSettings(systemSettings)
    showToast("Settings reset to default values", "info")
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="security">Security Settings</TabsTrigger>
          <TabsTrigger value="system">System Configuration</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Action Bar */}
          <div className="flex items-center justify-end">
            <Button onClick={handleCreateUser}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Admin User
            </Button>
          </div>

          {/* User Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminUsers.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {adminUsers.filter(u => u.status === "Active").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Super Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {adminUsers.filter(u => u.role === "Super Admin").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Last 24h Logins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Administrator Accounts</CardTitle>
              <CardDescription>Manage admin user roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>{user.lastLogin}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.permissions.slice(0, 2).map((perm, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {perm.replace('_', ' ')}
                              </Badge>
                            ))}
                            {user.permissions.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{user.permissions.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Security Settings</h2>
            <p className="text-muted-foreground">Configure security policies and authentication</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Authentication Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>User authentication and access control</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
                  </div>
                  <Switch 
                    checked={settings.security.twoFactorAuth}
                    onCheckedChange={(value) => handleSettingChange('security', 'twoFactorAuth', value)}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Password Expiry (days)</Label>
                  <Input 
                    type="number" 
                    value={settings.security.passwordExpiry}
                    onChange={(e) => handleSettingChange('security', 'passwordExpiry', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Session Timeout (hours)</Label>
                  <Input 
                    type="number" 
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Rate Limit (requests/hour)</Label>
                  <Input 
                    type="number" 
                    value={settings.security.apiRateLimit}
                    onChange={(e) => handleSettingChange('security', 'apiRateLimit', parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Configure system alerts and notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Alerts</Label>
                    <p className="text-sm text-muted-foreground">Send email notifications for critical events</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.emailAlerts}
                    onCheckedChange={(value) => handleSettingChange('notifications', 'emailAlerts', value)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Slack Integration</Label>
                    <p className="text-sm text-muted-foreground">Send alerts to Slack channels</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.slackIntegration}
                    onCheckedChange={(value) => handleSettingChange('notifications', 'slackIntegration', value)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Alerts</Label>
                    <p className="text-sm text-muted-foreground">Send SMS for urgent notifications</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.smsAlerts}
                    onCheckedChange={(value) => handleSettingChange('notifications', 'smsAlerts', value)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Daily Reports</Label>
                    <p className="text-sm text-muted-foreground">Automated daily system reports</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.dailyReports}
                    onCheckedChange={(value) => handleSettingChange('notifications', 'dailyReports', value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveSettings}>
              <Settings className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
            <Button variant="outline" onClick={handleResetSettings}>
              Reset to Defaults
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">System Configuration</h2>
            <p className="text-muted-foreground">Platform settings and maintenance options</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Core platform configuration and limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Put platform in maintenance mode</p>
                </div>
                <Switch 
                  checked={settings.platform.maintenanceMode}
                  onCheckedChange={(value) => handleSettingChange('platform', 'maintenanceMode', value)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Automatic Backups</Label>
                  <p className="text-sm text-muted-foreground">Enable daily automated backups</p>
                </div>
                <Switch 
                  checked={settings.platform.autoBackups}
                  onCheckedChange={(value) => handleSettingChange('platform', 'autoBackups', value)}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Log Retention (days)</Label>
                  <Input 
                    type="number" 
                    value={settings.platform.logRetention}
                    onChange={(e) => handleSettingChange('platform', 'logRetention', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum Clients</Label>
                  <Input 
                    type="number" 
                    value={settings.platform.maxClients}
                    onChange={(e) => handleSettingChange('platform', 'maxClients', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Audit Logs</h2>
            <p className="text-muted-foreground">System activity and user action logs</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest administrative actions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.user}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.timestamp}</TableCell>
                        <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Admin User</DialogTitle>
            <DialogDescription>
              Create a new administrator account with specific permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="userName">Full Name</Label>
              <Input id="userName" placeholder="Enter full name" />
            </div>
            <div>
              <Label htmlFor="userEmail">Email Address</Label>
              <Input id="userEmail" type="email" placeholder="admin@framtt.com" />
            </div>
            <div>
              <Label htmlFor="userRole">Role</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="support">Support Lead</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveUser} className="flex-1">
                Create User
              </Button>
              <Button variant="outline" onClick={() => setShowCreateUserDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Admin User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editUserName">Full Name</Label>
                <Input id="editUserName" defaultValue={selectedUser.name} />
              </div>
              <div>
                <Label htmlFor="editUserEmail">Email Address</Label>
                <Input id="editUserEmail" defaultValue={selectedUser.email} />
              </div>
              <div>
                <Label htmlFor="editUserRole">Role</Label>
                <Select defaultValue={selectedUser.role.toLowerCase().replace(' ', '_')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="support_lead">Support Lead</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editUserStatus">Status</Label>
                <Select defaultValue={selectedUser.status.toLowerCase()}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveUser} className="flex-1">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setShowEditUserDialog(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone and will revoke all access permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
