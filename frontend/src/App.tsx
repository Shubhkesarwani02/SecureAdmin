"use client"

import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger } from "./components/ui/sidebar"
import { BarChart3, Users, Activity, CreditCard, Code, Settings, Shield, Bell, User, LogOut, UserCog, UserCheck, HeartPulse } from "lucide-react"
import { OverviewDashboard } from "./components/OverviewDashboard"
// import VehicleManagement from "./components/VehicleManagement"
// import Dashboard from "./components/Dashboard"
import ClientManagement from "./components/ClientManagement"
// import NotificationCenter from "./components/NotificationCenter"
import { SystemMonitoring } from "./components/SystemMonitoring"
import { AccountHealth } from "./components/AccountHealth"
import { PaymentsBilling } from "./components/PaymentsBilling"
import SnippetManager from "./components/SnippetManager"
import AdminSettings from "./components/AdminSettings"
import { UserManagement } from "./components/UserManagement"
import { ImpersonationHistory } from "./components/ImpersonationHistory"
import { ImpersonationBanner } from "./components/ImpersonationBanner"
import { NotFound } from "./components/NotFound"
import { LoginPage } from "./components/LoginPage"
import OnboardingPage from "./components/OnboardingPage"
import InviteManagement from "./components/InviteManagement"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { BreadcrumbNavigation } from "./components/BreadcrumbNavigation"
import { Separator } from "./components/ui/separator"
import { Button } from "./components/ui/button"
import { Badge } from "./components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./components/ui/dialog"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import { Textarea } from "./components/ui/textarea"
import { Switch } from "./components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./components/ui/alert-dialog"
import { useState, useEffect } from "react"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { toast } from "sonner"

const menuItems = [
  {
    title: "Overview",
    icon: BarChart3,
    path: "/",
    key: "overview",
    description: "Dashboard metrics & analytics"
  },
  {
    title: "Client Management",
    icon: Users,
    path: "/clients",
    key: "clients",
    description: "Manage tenant accounts"
  },
  {
    title: "User Management",
    icon: UserCog,
    path: "/users",
    key: "users",
    description: "Manage users and roles"
  },
  {
    title: "Invite Management", 
    icon: UserCheck,
    path: "/invites",
    key: "invites",
    description: "Send invitations & manage onboarding"
  },
  {
    title: "Account Health",
    icon: HeartPulse,
    path: "/account-health",
    key: "account-health",
    description: "Proactive client health monitoring"
  },
  {
    title: "System Monitoring",
    icon: Activity,
    path: "/monitoring",
    key: "monitoring",
    description: "System health & performance"
  },
  {
    title: "Payments & Billing",
    icon: CreditCard,
    path: "/payments",
    key: "payments",
    description: "Revenue & billing management"
  },
  {
    title: "Integration Snippets",
    icon: Code,
    path: "/snippets",
    key: "snippets",
    description: "Code snippets & API keys"
  },
  {
    title: "Impersonation History",
    icon: UserCheck,
    path: "/impersonation-history",
    key: "impersonation",
    description: "View impersonation logs"
  },
  {
    title: "Admin Settings",
    icon: Settings,
    path: "/settings",
    key: "settings",
    description: "System configuration"
  }
]

const notifications = [
  {
    id: 1,
    title: "New client registration",
    description: "Premium Fleet Services completed KYC verification",
    time: "2 minutes ago",
    unread: true
  },
  {
    id: 2,
    title: "Payment processed",
    description: "Monthly subscription payment received from Elite Car Rentals",
    time: "1 hour ago",
    unread: true
  },
  {
    id: 3,
    title: "System maintenance scheduled",
    description: "Database maintenance planned for tonight at 2:00 AM",
    time: "3 hours ago",
    unread: false
  }
]

function AppSidebar({ onProfileClick, onAccountPreferences, onLogoutClick }: { 
  onProfileClick: () => void;
  onAccountPreferences: () => void;
  onLogoutClick: () => void;
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const { userProfile } = useAuth()

  const getActiveKey = (pathname: string) => {
    const item = menuItems.find(item => item.path === pathname)
    return item ? item.key : "overview"
  }

  const getFilteredMenuItems = () => {
    if (!userProfile) return menuItems
    
    // Filter menu items based on user role according to the access matrix
    return menuItems.filter(item => {
      switch (item.key) {
        case 'overview':
          // All roles can see overview
          return true
          
        case 'clients':
          // Superadmin: Only superadmin can manage client accounts and subscriptions
          // Admin: No access
          // CSM: No access  
          return userProfile.role === 'superadmin'
          
        case 'users':
          // Superadmin: Can see and manage end user and admins both
          // Admin: Can see and manage all assigned csms, can impersonate csm
          // CSM: Can see all assigned accounts, but cant impersonate
          return ['superadmin', 'admin', 'csm'].includes(userProfile.role)
          
        case 'invites':
          // Superadmin: Can invite admins as well as csms
          // Admin: Can invite csms
          // CSM: No invitation window
          return ['superadmin', 'admin'].includes(userProfile.role)
          
        case 'account-health':
          // Superadmin: All clients
          // Admin: All assigned clients
          // CSM: No access
          return ['superadmin', 'admin'].includes(userProfile.role)
          
        case 'monitoring':
          // Superadmin: All clients
          // Admin: All assigned clients
          // CSM: No access
          return ['superadmin', 'admin'].includes(userProfile.role)
          
        case 'payments':
          // Superadmin: Only SA can manage subscriptions and payments
          // Admin: No access
          // CSM: No access
          return userProfile.role === 'superadmin'
          
        case 'snippets':
          // Superadmin: All clients
          // Admin: All assigned clients
          // CSM: All accounts under them
          return ['superadmin', 'admin', 'csm'].includes(userProfile.role)
          
        case 'impersonation':
          // Superadmin: All impersonations, full control
          // Admin: Can see only his impersonation, not even other admins
          // CSM: No access
          return ['superadmin', 'admin'].includes(userProfile.role)
          
        case 'settings':
          // Superadmin: Only SA can see this settings of admins and actions
          // Admin: No access
          // CSM: No access
          return userProfile.role === 'superadmin'
          
        default:
          return true
      }
    })
  }

  const activeView = getActiveKey(location.pathname)
  const filteredMenuItems = getFilteredMenuItems()

  const handleNavigation = (path: string) => {
    navigate(path)
  }

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b border-sidebar-border">
        <div 
          className="flex items-center gap-3 px-4 py-6 cursor-pointer hover:bg-sidebar-accent/50 transition-colors rounded-md mx-2"
          onClick={() => navigate("/")}
        >
          <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground">Framtt Admin</span>
            <span className="text-xs text-sidebar-foreground/60">Superadmin Dashboard</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 py-2 text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu className="space-y-1">
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton 
                    onClick={() => handleNavigation(item.path)}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 hover:bg-sidebar-accent cursor-pointer ${
                      activeView === item.key 
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" 
                        : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${
                      activeView === item.key ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70"
                    }`} />
                    <span className="font-medium">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Footer */}
      <div className="mt-auto border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 px-0 hover:bg-sidebar-accent">
              <div className="flex items-center justify-center w-8 h-8 bg-sidebar-accent rounded-full">
                <User className="w-4 h-4 text-sidebar-foreground" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-sidebar-foreground">
                  {userProfile?.full_name || 'John Smith'}
                </span>
                <span className="text-xs text-sidebar-foreground/60">
                  {userProfile?.email || 'john@framtt.com'}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={onProfileClick}>
              <UserCog className="w-4 h-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAccountPreferences}>
              <Settings className="w-4 h-4 mr-2" />
              Account Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogoutClick} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <SidebarRail />
    </Sidebar>
  )
}

function DashboardContent() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificationsList, setNotificationsList] = useState(notifications)
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [showAccountPreferences, setShowAccountPreferences] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  
  const { userProfile, signOut } = useAuth()

  // Profile Settings State
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    department: "",
    role: "",
    bio: ""
  })

  // Update profile data when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setProfileData({
        fullName: userProfile.full_name || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
        department: userProfile.department || "",
        role: userProfile.role || "",
        bio: userProfile.bio || ""
      })
    }
  }, [userProfile])

  // Account Preferences State
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    marketingEmails: false,
    twoFactorAuth: true,
    sessionTimeout: "8",
    language: "en",
    timezone: "America/New_York",
    theme: "light"
  })

  // Update preferences when userProfile changes
  useEffect(() => {
    if (userProfile?.preferences) {
      setPreferences({
        emailNotifications: userProfile.preferences.emailNotifications ?? true,
        pushNotifications: userProfile.preferences.pushNotifications ?? false,
        weeklyReports: userProfile.preferences.weeklyReports ?? true,
        marketingEmails: userProfile.preferences.marketingEmails ?? false,
        twoFactorAuth: userProfile.preferences.twoFactorAuth ?? true,
        sessionTimeout: userProfile.preferences.sessionTimeout ?? "8",
        language: userProfile.preferences.language ?? "en",
        timezone: userProfile.preferences.timezone ?? "America/New_York",
        theme: userProfile.preferences.theme ?? "light"
      })
    }
  }, [userProfile])

  const unreadCount = notificationsList.filter(n => n.unread).length

  const markAllAsRead = () => {
    setNotificationsList(prev => prev.map(n => ({ ...n, unread: false })))
    toast.success("All notifications marked as read")
  }

  const handleProfileClick = () => {
    setShowProfileSettings(true)
  }

  const handleAccountPreferences = () => {
    setShowAccountPreferences(true)
  }

  const handleLogoutClick = () => {
    setShowLogoutDialog(true)
  }

  const confirmLogout = async () => {
    try {
      await signOut()
      toast.success("Logged out successfully")
      setShowLogoutDialog(false)
    } catch (error) {
      console.error('Logout error:', error)
      toast.error("Error logging out")
    }
  }

  const handleSaveProfile = () => {
    toast.success("Profile updated successfully!")
    setShowProfileSettings(false)
  }

  const handleSavePreferences = () => {
    toast.success("Preferences saved successfully!")
    setShowAccountPreferences(false)
  }

  // Update document title based on current route
  const location = useLocation()
  useEffect(() => {
    const item = menuItems.find(item => item.path === location.pathname)
    const title = item ? `${item.title} - Framtt Admin` : "Framtt Admin Dashboard"
    document.title = title
  }, [location.pathname])

  return (
    <SidebarProvider>
      <AppSidebar 
        onProfileClick={handleProfileClick}
        onAccountPreferences={handleAccountPreferences}
        onLogoutClick={handleLogoutClick}
      />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <BreadcrumbNavigation />
          
          {/* Header Actions */}
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 border-green-600 hidden sm:flex">
              <Activity className="w-3 h-3 mr-1" />
              All Systems Operational
            </Badge>
            
            {/* Demo Mode Badge */}
            <Badge variant="secondary" className="hidden sm:flex">
              Demo Mode
            </Badge>
            
            {/* Notifications */}
            <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between p-3 border-b">
                  <h3 className="font-medium">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                      Mark all read
                    </Button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notificationsList.map((notification) => (
                    <div key={notification.id} className={`p-3 border-b last:border-b-0 hover:bg-accent cursor-pointer ${notification.unread ? 'bg-accent/50' : ''}`}>
                      <div className="flex items-start gap-2">
                        {notification.unread && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-sm text-muted-foreground">{notification.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <User className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-3 p-3 border-b">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {userProfile?.full_name || 'John Smith'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {userProfile?.email || 'john@framtt.com'}
                    </span>
                  </div>
                </div>
                <DropdownMenuItem onClick={handleProfileClick}>
                  <UserCog className="w-4 h-4 mr-2" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAccountPreferences}>
                  <Settings className="w-4 h-4 mr-2" />
                  Account Preferences
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogoutClick} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <main className="flex-1 p-6">
          <div className="flex-1">
            {/* Impersonation Banner */}
            <ImpersonationBanner />
            
            <Routes>
              <Route path="/" element={<OverviewDashboard />} />
              <Route path="/overview" element={<Navigate to="/" replace />} />
              <Route path="/clients" element={<ClientManagement />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/invites" element={<InviteManagement />} />
              <Route path="/account-health" element={<AccountHealth />} />
              <Route path="/monitoring" element={<SystemMonitoring />} />
              <Route path="/payments" element={<PaymentsBilling />} />
              <Route path="/snippets" element={<SnippetManager />} />
              <Route path="/impersonation-history" element={<ImpersonationHistory />} />
              <Route path="/settings" element={<AdminSettings />} />
              {/* 404 Not Found route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>

        {/* Profile Settings Dialog */}
        <Dialog open={showProfileSettings} onOpenChange={setShowProfileSettings}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Profile Settings</DialogTitle>
              <DialogDescription>
                Update your personal information and profile details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={profileData.department} onValueChange={(value) => setProfileData(prev => ({ ...prev, department: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Support">Support</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Management">Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input 
                    id="role"
                    value={profileData.role}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveProfile} className="flex-1">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setShowProfileSettings(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Account Preferences Dialog */}
        <Dialog open={showAccountPreferences} onOpenChange={setShowAccountPreferences}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Account Preferences</DialogTitle>
              <DialogDescription>
                Customize your account settings and preferences
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="notifications" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="notifications" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>Choose how you want to be notified</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                      </div>
                      <Switch 
                        checked={preferences.emailNotifications}
                        onCheckedChange={(value) => setPreferences(prev => ({ ...prev, emailNotifications: value }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Browser push notifications</p>
                      </div>
                      <Switch 
                        checked={preferences.pushNotifications}
                        onCheckedChange={(value) => setPreferences(prev => ({ ...prev, pushNotifications: value }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Weekly Reports</Label>
                        <p className="text-sm text-muted-foreground">Receive weekly system reports</p>
                      </div>
                      <Switch 
                        checked={preferences.weeklyReports}
                        onCheckedChange={(value) => setPreferences(prev => ({ ...prev, weeklyReports: value }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Marketing Emails</Label>
                        <p className="text-sm text-muted-foreground">Product updates and newsletters</p>
                      </div>
                      <Switch 
                        checked={preferences.marketingEmails}
                        onCheckedChange={(value) => setPreferences(prev => ({ ...prev, marketingEmails: value }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="security" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Manage your account security</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                      </div>
                      <Switch 
                        checked={preferences.twoFactorAuth}
                        onCheckedChange={(value) => setPreferences(prev => ({ ...prev, twoFactorAuth: value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Session Timeout (hours)</Label>
                      <Select value={preferences.sessionTimeout} onValueChange={(value) => setPreferences(prev => ({ ...prev, sessionTimeout: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 hour</SelectItem>
                          <SelectItem value="4">4 hours</SelectItem>
                          <SelectItem value="8">8 hours</SelectItem>
                          <SelectItem value="24">24 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="appearance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance Settings</CardTitle>
                    <CardDescription>Customize the look and feel</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select value={preferences.language} onValueChange={(value) => setPreferences(prev => ({ ...prev, language: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select value={preferences.timezone} onValueChange={(value) => setPreferences(prev => ({ ...prev, timezone: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Theme</Label>
                      <Select value={preferences.theme} onValueChange={(value) => setPreferences(prev => ({ ...prev, theme: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSavePreferences} className="flex-1">
                Save Preferences
              </Button>
              <Button variant="outline" onClick={() => setShowAccountPreferences(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Logout Confirmation Dialog */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign Out</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to sign out? You will need to log in again to access the dashboard.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Sign Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </SidebarInset>
    </SidebarProvider>
  )
}

// Protected Dashboard Routes
function ProtectedDashboard() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardContent />
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          
          {/* Protected Dashboard Routes */}
          <Route path="/*" element={<ProtectedDashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
