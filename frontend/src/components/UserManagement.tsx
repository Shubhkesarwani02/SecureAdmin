import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { 
  Users,
  Search,
  RefreshCw,
  MoreHorizontal,
  UserCheck,
  Edit,
  Trash2,
  AlertCircle,
  Plus
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiClient } from '../lib/api'
import { ImpersonationDialog } from './ImpersonationDialog'

interface User {
  id: string
  full_name: string
  email: string
  phone?: string
  role: string
  department?: string
  status: string
  created_at: string
  last_login?: string
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  // Impersonation state
  const [impersonationDialogOpen, setImpersonationDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  const { userProfile } = useAuth()

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.getUsers({
        page,
        limit: 20,
        ...(searchTerm && { search: searchTerm })
      })
      
      if (response.success) {
        setUsers(response.data.users)
        setTotalUsers(response.data.total)
        setTotalPages(response.data.totalPages)
      } else {
        setError(response.message)
      }
    } catch (err) {
      console.error('Error loading users:', err)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userProfile) {
      loadUsers()
    }
  }, [page, userProfile])

  const canImpersonateUser = (targetUser: User) => {
    if (!userProfile || userProfile.id === targetUser.id) return false
    
    if (userProfile.role === 'superadmin') {
      return true
    }
    
    if (userProfile.role === 'admin') {
      return ['csm', 'user'].includes(targetUser.role)
    }
    
    if (userProfile.role === 'csm') {
      return targetUser.role === 'user'
    }
    
    return false
  }

  const canManageUser = (targetUser: User) => {
    if (!userProfile) return false
    
    if (userProfile.role === 'superadmin') {
      return true
    }
    
    if (userProfile.role === 'admin') {
      return ['csm', 'user'].includes(targetUser.role)
    }
    
    return false
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'destructive'
      case 'admin':
        return 'default'
      case 'csm':
        return 'secondary'
      case 'user':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'suspended':
        return 'destructive'
      case 'pending':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadUsers()
  }

  const handleRefresh = () => {
    loadUsers()
  }

  const handleImpersonate = (user: User) => {
    setSelectedUser(user)
    setImpersonationDialogOpen(true)
  }

  const handleImpersonationSuccess = () => {
    // Refresh the page or redirect after successful impersonation
    window.location.reload()
  }

  const formatDateTime = (dateTime?: string) => {
    if (!dateTime) return 'Never'
    return new Date(dateTime).toLocaleString()
  }

  if (!userProfile) {
    return null
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage users, roles, and permissions. Administrators can impersonate users for support purposes.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Search and Filters */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Search users</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} variant="outline" disabled={loading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleRefresh} variant="outline" disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              
              {userProfile.role === 'superadmin' && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Users Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading users...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{user.department || 'N/A'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatDateTime(user.last_login)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            
                            {canImpersonateUser(user) && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleImpersonate(user)}
                                  className="text-orange-600"
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Impersonate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            
                            {canManageUser(user) && (
                              <>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit User
                                </DropdownMenuItem>
                                
                                {user.status !== 'suspended' && (
                                  <DropdownMenuItem className="text-amber-600">
                                    Suspend User
                                  </DropdownMenuItem>
                                )}
                                
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, totalUsers)} of {totalUsers} users
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Impersonation Dialog */}
      <ImpersonationDialog
        isOpen={impersonationDialogOpen}
        onClose={() => {
          setImpersonationDialogOpen(false)
          setSelectedUser(null)
        }}
        targetUser={selectedUser}
        onSuccess={handleImpersonationSuccess}
      />
    </>
  )
}
