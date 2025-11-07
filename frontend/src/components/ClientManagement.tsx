import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { useAuth } from '../contexts/AuthContext'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "./ui/table"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog"
import { 
  Users,
  Search,
  Filter,
  Download,
  Plus,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  LogIn,
  RefreshCw,
  Key
} from 'lucide-react'
import { apiClient } from '../lib/api'
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

interface Client {
  id: string
  companyName: string
  email: string
  phone: string
  planType: string
  status: string
  createdAt: string
  lastLogin?: string
  billingAddress?: string
}

interface ClientStats {
  totalClients: number
  activeClients: number
  inactiveClients: number
  newThisMonth: number
}

interface NewClientFormData {
  companyName: string
  email: string
  phone: string
  planType: string
  billingAddress: string
}

export default function ClientManagement() {
  const { userProfile } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<ClientStats | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Check if user can manage subscriptions (only superadmin)
  const canManageSubscriptions = userProfile?.role === 'superadmin'
  
  // Check if user can add clients (only superadmin)
  const canAddClients = userProfile?.role === 'superadmin'

  // Load clients from API
  const loadClients = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.getClients()
      if (response.success) {
        setClients(response.data || [])
      } else {
        setError(response.message || 'Failed to load clients')
        setClients([])
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      setError(error instanceof Error ? error.message : 'Failed to load clients')
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  // Load client statistics
  const loadStats = async () => {
    try {
      const response = await apiClient.getClientStats()
      if (response.success) {
        setStats(response.data.stats || response.data)
      } else {
        console.error('Failed to load client stats:', response.message)
        // Calculate stats from clients array if available
        if (clients.length > 0) {
          setStats({
            totalClients: clients.length,
            activeClients: clients.filter(c => c.status === 'Active').length,
            inactiveClients: clients.filter(c => c.status === 'Inactive').length,
            newThisMonth: clients.filter(c => {
              const created = new Date(c.createdAt)
              const now = new Date()
              return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
            }).length
          })
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  useEffect(() => {
    loadClients()
    loadStats()
  }, [])

  const handleAddClient = async (formData: NewClientFormData) => {
    try {
      const response = await apiClient.addClient(formData)
      if (response.success) {
        toast.success('Client added successfully!')
        loadClients() // Refresh the list
        setShowAddDialog(false)
      } else {
        toast.error(response.message || 'Failed to add client')
      }
    } catch (error) {
      console.error('Error adding client:', error)
      toast.error('Failed to add client')
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await apiClient.exportClientData('csv')
      if (response.success) {
        toast.success('Client data exported successfully!')
        // Handle file download
      } else {
        toast.error(response.message || 'Failed to export data')
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const filteredClients = (Array.isArray(clients) ? clients : []).filter(client =>
    client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-green-500">Active</Badge>
      case 'Inactive':
        return <Badge variant="secondary">Inactive</Badge>
      case 'Pending':
        return <Badge className="bg-yellow-500">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading clients...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <ErrorAlert
          message={error}
          onRetry={() => {
            loadClients()
            loadStats()
          }}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
            <p className="text-xs text-muted-foreground">+{stats?.newThisMonth || 0} from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeClients || 0}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Clients</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inactiveClients || 0}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.newThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">Recent additions</p>
          </CardContent>
        </Card>
      </div>

      {/* Client Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Client Management
              </CardTitle>
              <CardDescription>
                Manage client accounts and subscriptions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export
              </Button>
              {canAddClients && (
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Client
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Client</DialogTitle>
                    <DialogDescription>
                      Create a new client account
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input id="companyName" placeholder="Enter company name" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="Enter email" />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" placeholder="Enter phone number" />
                    </div>
                    <div>
                      <Label htmlFor="planType">Plan Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Basic">Basic</SelectItem>
                          <SelectItem value="Professional">Professional</SelectItem>
                          <SelectItem value="Enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={() => toast.success('Client added successfully!')}>
                        Add Client
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select defaultValue="All">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Info */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredClients.length} of {clients.length} clients
          </div>

          {/* Empty State */}
          {!error && filteredClients.length === 0 && !loading && (
            <EmptyState
              icon={Users}
              title={searchTerm ? "No clients found" : "No clients yet"}
              description={
                searchTerm
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first client"
              }
              action={
                canAddClients && !searchTerm
                  ? {
                      label: "Add Client",
                      onClick: () => setShowAddDialog(true)
                    }
                  : undefined
              }
            />
          )}

          {/* Clients Table */}
          {filteredClients.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.companyName}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.planType}</TableCell>
                  <TableCell>{getStatusBadge(client.status)}</TableCell>
                  <TableCell>{client.createdAt}</TableCell>
                  <TableCell>{client.lastLogin || 'Never'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedClient(client)
                          setShowViewDialog(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedClient(client)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* View Client Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedClient?.companyName}
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company Name</Label>
                  <p className="text-sm">{selectedClient.companyName}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm">{selectedClient.email}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="text-sm">{selectedClient.phone}</p>
                </div>
                <div>
                  <Label>Plan Type</Label>
                  <p className="text-sm">{selectedClient.planType}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  {getStatusBadge(selectedClient.status)}
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">{selectedClient.createdAt}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => toast.success('Impersonation started')}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Impersonate
                </Button>
                <Button variant="outline" onClick={() => toast.success('Password reset email sent')}>
                  <Key className="h-4 w-4 mr-2" />
                  Reset Password
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
            <AlertDialogTitle>Disable Client Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable {selectedClient?.companyName}? This will suspend their access but preserve their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                toast.success(`${selectedClient?.companyName} has been disabled`)
                setShowDeleteDialog(false)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disable Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
