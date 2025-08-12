import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Input } from "./ui/input"
import { Eye, UserX, LogIn, Search, Filter, MoreVertical, Building2, Plus, Download, Edit, RotateCcw, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "./ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog"
// Simple toast implementation
const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
  console.log(`[${type.toUpperCase()}] ${message}`)
  alert(`${type.toUpperCase()}: ${message}`)
}
import { useState } from "react"

const clientsData = [
  {
    id: 1,
    companyName: "Elite Car Rentals",
    email: "admin@elitecarrentals.com",
    status: "Active",
    createdAt: "2024-01-15",
    lastLogin: "2025-01-05",
    integration: "AI Recommendation",
    tracking: true,
    whatsapp: true,
    marketing: false
  },
  {
    id: 2,
    companyName: "Swift Vehicle Solutions",
    email: "contact@swiftvehicle.com",
    status: "Active",
    createdAt: "2024-02-22",
    lastLogin: "2025-01-04",
    integration: "Connected via WhatsApp",
    tracking: true,
    whatsapp: true,
    marketing: true
  },
  {
    id: 3,
    companyName: "Urban Mobility Co",
    email: "info@urbanmobility.com",
    status: "Inactive",
    createdAt: "2024-01-08",
    lastLogin: "2024-12-20",
    integration: "Tracking Active",
    tracking: true,
    whatsapp: false,
    marketing: false
  },
  {
    id: 4,
    companyName: "Premium Fleet Services",
    email: "support@premiumfleet.com",
    status: "Active",
    createdAt: "2024-03-10",
    lastLogin: "2025-01-06",
    integration: "Marketing Active",
    tracking: true,
    whatsapp: true,
    marketing: true
  },
  {
    id: 5,
    companyName: "City Drive Rentals",
    email: "hello@citydriverentals.com",
    status: "Pending",
    createdAt: "2025-01-02",
    lastLogin: "Never",
    integration: "AI Recommendation",
    tracking: false,
    whatsapp: false,
    marketing: false
  }
]

export function ClientManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [showAddClient, setShowAddClient] = useState(false)
  const [showEditClient, setShowEditClient] = useState(false)
  const [showViewClient, setShowViewClient] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [isExporting, setIsExporting] = useState(false)

  const filteredClients = clientsData.filter(client => {
    const matchesSearch = client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "All" || client.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-500">{status}</Badge>
      case "Inactive":
        return <Badge variant="secondary">{status}</Badge>
      case "Pending":
        return <Badge className="bg-orange-500">{status}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getIntegrationTags = (client: any) => {
    const tags = []
    if (client.integration === "AI Recommendation") {
      tags.push(<Badge key="ai" className="text-xs">AI Recommendation</Badge>)
    }
    if (client.whatsapp) {
      tags.push(<Badge key="whatsapp" variant="outline" className="text-xs">Connected via WhatsApp</Badge>)
    }
    if (client.tracking) {
      tags.push(<Badge key="tracking" variant="secondary" className="text-xs">Tracking Active</Badge>)
    }
    if (client.marketing) {
      tags.push(<Badge key="marketing" className="text-xs bg-green-500">Marketing Active</Badge>)
    }
    return tags
  }

  const handleExportData = async () => {
    setIsExporting(true)
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false)
      showToast("Client data exported successfully!", "success")
    }, 2000)
  }

  const handleAddClient = () => {
    setShowAddClient(true)
  }

  const handleViewClient = (client: any) => {
    setSelectedClient(client)
    setShowViewClient(true)
  }

  const handleEditClient = (client: any) => {
    setSelectedClient(client)
    setShowEditClient(true)
  }

  const handleImpersonate = (client: any) => {
    showToast(`Impersonating ${client.companyName}...`, "info")
    // In a real app, this would switch to the client's account
  }

  const handleDisableClient = (client: any) => {
    setSelectedClient(client)
    setShowDeleteDialog(true)
  }

  const confirmDisable = () => {
    showToast(`${selectedClient?.companyName} has been disabled`, "success")
    setShowDeleteDialog(false)
    setSelectedClient(null)
  }

  const handleResetPassword = (client: any) => {
    showToast(`Password reset email sent to ${client.email}`, "success")
  }

  const handleSaveClient = () => {
    showToast("Client information saved successfully!", "success")
    setShowAddClient(false)
    setShowEditClient(false)
    setSelectedClient(null)
  }

  return (
    <div className="space-y-6">
      {/* Search, Filter and Action Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by company name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportData}
            disabled={isExporting}
          >
            {isExporting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isExporting ? "Exporting..." : "Export Data"}
          </Button>
          <Button onClick={handleAddClient} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Client Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All registered companies</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {clientsData.filter(c => c.status === "Active").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Currently operational</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {clientsData.filter(c => c.status === "Inactive").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Temporarily disabled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {clientsData.filter(c => c.status === "Pending").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting verification</p>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Client Directory</CardTitle>
              <CardDescription>Complete list of rental companies with management actions</CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {filteredClients.length} of {clientsData.length} clients
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Integration Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{client.companyName}</div>
                          <div className="text-sm text-muted-foreground">ID: #{client.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{getStatusBadge(client.status)}</TableCell>
                    <TableCell className="text-sm">{new Date(client.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm">
                      {client.lastLogin === "Never" ? (
                        <span className="text-muted-foreground">Never</span>
                      ) : (
                        new Date(client.lastLogin).toLocaleDateString()
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-48">
                        {getIntegrationTags(client)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => handleViewClient(client)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleImpersonate(client)}>
                          <LogIn className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClient(client)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Client
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(client)}>
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDisableClient(client)}
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Disable
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Client Dialog */}
      <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Create a new rental company account on the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" placeholder="Enter company name" />
            </div>
            <div>
              <Label htmlFor="email">Contact Email</Label>
              <Input id="email" type="email" placeholder="admin@company.com" />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="+1 (555) 123-4567" />
            </div>
            <div>
              <Label htmlFor="address">Business Address</Label>
              <Textarea id="address" placeholder="Enter full business address" />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveClient} className="flex-1">
                Create Client
              </Button>
              <Button variant="outline" onClick={() => setShowAddClient(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Client Dialog */}
      <Dialog open={showViewClient} onOpenChange={setShowViewClient}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedClient?.companyName}</DialogTitle>
            <DialogDescription>
              Complete client information and integration status
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company Name</Label>
                  <p className="text-sm font-medium">{selectedClient.companyName}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm">{selectedClient.email}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="pt-1">
                    {getStatusBadge(selectedClient.status)}
                  </div>
                </div>
                <div>
                  <Label>Created At</Label>
                  <p className="text-sm">{new Date(selectedClient.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Last Login</Label>
                  <p className="text-sm">{selectedClient.lastLogin === "Never" ? "Never" : new Date(selectedClient.lastLogin).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <Label>Active Integrations</Label>
                <div className="flex flex-wrap gap-2 pt-2">
                  {getIntegrationTags(selectedClient)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={showEditClient} onOpenChange={setShowEditClient}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update client information and settings
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editCompanyName">Company Name</Label>
                <Input id="editCompanyName" defaultValue={selectedClient.companyName} />
              </div>
              <div>
                <Label htmlFor="editEmail">Contact Email</Label>
                <Input id="editEmail" type="email" defaultValue={selectedClient.email} />
              </div>
              <div>
                <Label htmlFor="editStatus">Status</Label>
                <Select defaultValue={selectedClient.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveClient} className="flex-1">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setShowEditClient(false)} className="flex-1">
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
            <AlertDialogTitle>Disable Client Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable {selectedClient?.companyName}? This will prevent them from accessing their account and making new bookings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisable} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Disable Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
