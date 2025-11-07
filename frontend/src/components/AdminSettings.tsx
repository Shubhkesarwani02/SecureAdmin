import React, { useState, useEffect } from "react"
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
import { apiClient } from '../lib/api'
import { EmptyState } from './ui/empty-state'
import { ErrorAlert } from './ui/error-alert'

interface AdminUser {
  id: number | string
  name: string
  email: string
  role: string
  status: string
  lastLogin: string
  permissions: string[]
}

interface SystemSettings {
  security: {
    requireTwoFactor: boolean
    sessionTimeout: number
    maxLoginAttempts: number
    passwordMinLength: number
  }
  notifications: {
    systemAlerts: boolean
    emailReports: boolean
    slackIntegration: boolean
    webhooksEnabled: boolean
  }
  system: {
    maintenanceMode: boolean
    debugMode: boolean
    autoBackups: boolean
    dataRetentionDays: number
  }
}

interface AuditLog {
  id: number
  user: string
  action: string
  timestamp: string
  ip: string
}

const AdminSettings: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [settings, setSettings] = useState<SystemSettings>({
    security: {
      requireTwoFactor: true,
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      passwordMinLength: 8
    },
    notifications: {
      systemAlerts: true,
      emailReports: true,
      slackIntegration: false,
      webhooksEnabled: true
    },
    system: {
      maintenanceMode: false,
      debugMode: false,
      autoBackups: true,
      dataRetentionDays: 365
    }
  })
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false)
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  // Custom toast implementation
  const toast = {
    success: (message: string) => console.log('Success:', message),
    error: (message: string) => console.error('Error:', message)
  }

  useEffect(() => {
    loadAdminData()
    loadSettings()
    loadAuditLogs()
  }, [])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getUsers({ role: 'admin' })
      if (response.success && response.data) {
        setAdminUsers(response.data)
      } else {
        setError(response.message || 'Failed to load admin users')
        setAdminUsers([])
      }
    } catch (error) {
      console.error('Error loading admin users:', error)
      setError(error instanceof Error ? error.message : 'Failed to load admin users')
      setAdminUsers([])
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await apiClient.getAdminSettings()
      if (response.success && response.data) {
        setSettings(response.data)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const loadAuditLogs = async () => {
    try {
      const response = await apiClient.getAuditLogs({ limit: 10 })
      if (response.success && response.data) {
        setAuditLogs(response.data.logs || [])
      } else {
        setAuditLogs([])
      }
    } catch (error) {
      console.error('Error loading audit logs:', error)
      setAuditLogs([])
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Super Admin":
        return <Badge className="bg-red-500">{role}</Badge>
      case "Admin":
        return <Badge className="bg-blue-500">{role}</Badge>
      case "Support Lead":
        return <Badge className="bg-green-500">{role}</Badge>
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

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user)
    setShowEditUserDialog(true)
  }

  const handleDeleteUser = (user: AdminUser) => {
    setSelectedUser(user)
    setShowDeleteDialog(true)
  }

  const confirmDeleteUser = async () => {
    if (selectedUser) {
      try {
        const response = await apiClient.deleteUser(String(selectedUser.id))
        if (response.success) {
          toast.success(`User ${selectedUser.name} has been deleted`)
          loadAdminData()
        } else {
          toast.error('Failed to delete user')
        }
      } catch (error) {
        console.error('Error deleting user:', error)
        toast.error('Failed to delete user')
      }
    }
    setShowDeleteDialog(false)
    setSelectedUser(null)
  }

  const handleSaveUser = async () => {
    try {
      if (selectedUser && selectedUser.id) {
        const response = await apiClient.updateUser(String(selectedUser.id), selectedUser)
        if (response.success) {
          toast.success("User information updated successfully!")
          loadAdminData()
        } else {
          toast.error('Failed to update user')
        }
      } else {
        const response = await apiClient.createUser(selectedUser as any)
        if (response.success) {
          toast.success("New user created successfully!")
          loadAdminData()
        } else {
          toast.error('Failed to create user')
        }
      }
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error('Failed to save user')
    }
    setShowCreateUserDialog(false)
    setShowEditUserDialog(false)
    setSelectedUser(null)
  }

  const handleSettingChange = async (category: keyof SystemSettings, setting: string, value: any) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...(settings?.[category] || {}),
        [setting]: value
      }
    }
    setSettings(newSettings)

    try {
      const response = await apiClient.updateAdminSettings(newSettings)
      if (response.success) {
        toast.success("Setting updated successfully!")
      } else {
        toast.error('Failed to update setting')
      }
    } catch (error) {
      console.error('Error updating setting:', error)
      toast.error('Failed to update setting')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Settings className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading admin settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Settings</h2>
        <p className="text-muted-foreground">
          Manage system configuration, user permissions, and security settings
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Admin Users
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System Settings
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        {/* Admin Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Admin Users</CardTitle>
                  <CardDescription>Manage administrator accounts and permissions</CardDescription>
                </div>
                <Button onClick={handleCreateUser} className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Admin User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
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
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="settings">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="system-alerts">System Alerts</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications for critical system events</p>
                  </div>
                  <Switch
                    id="system-alerts"
                    checked={settings?.notifications?.systemAlerts || false}
                    onCheckedChange={(value) => handleSettingChange('notifications', 'systemAlerts', value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-reports">Email Reports</Label>
                    <p className="text-sm text-muted-foreground">Send daily summary reports via email</p>
                  </div>
                  <Switch
                    id="email-reports"
                    checked={settings?.notifications?.emailReports || false}
                    onCheckedChange={(value) => handleSettingChange('notifications', 'emailReports', value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable to temporarily disable system access</p>
                  </div>
                  <Switch
                    id="maintenance-mode"
                    checked={settings?.system?.maintenanceMode || false}
                    onCheckedChange={(value) => handleSettingChange('system', 'maintenanceMode', value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-backups">Auto Backups</Label>
                    <p className="text-sm text-muted-foreground">Automatically backup system data daily</p>
                  </div>
                  <Switch
                    id="auto-backups"
                    checked={settings?.system?.autoBackups || false}
                    onCheckedChange={(value) => handleSettingChange('system', 'autoBackups', value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="two-factor">Require Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Enforce 2FA for all admin accounts</p>
                </div>
                <Switch
                  id="two-factor"
                  checked={settings?.security?.requireTwoFactor || false}
                  onCheckedChange={(value) => handleSettingChange('security', 'requireTwoFactor', value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={settings?.security?.sessionTimeout || 60}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                  <Input
                    id="max-login-attempts"
                    type="number"
                    value={settings?.security?.maxLoginAttempts || 5}
                    onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Audit Logs
              </CardTitle>
              <CardDescription>Recent administrative actions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.user}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.timestamp}</TableCell>
                      <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Admin User</DialogTitle>
            <DialogDescription>Add a new administrator to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Enter full name" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter email address" />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="support">Support Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveUser} className="flex-1">Create User</Button>
              <Button variant="outline" onClick={() => setShowCreateUserDialog(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account for {selectedUser?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default AdminSettings
