import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Copy, Code, Plus, Search, Edit, Trash2, Eye, RefreshCw, Globe, Smartphone, Monitor } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { apiClient } from '../lib/api'
import { EmptyState } from './ui/empty-state'
import { ErrorAlert } from './ui/error-alert'

interface IntegrationSnippet {
  id: number | string
  clientCode: string
  companyName: string
  platform: string
  status: 'Active' | 'Inactive'
  snippet: string
  integrations: string[]
  createdAt: string
  lastUsed: string
  usageCount: number
}

interface SnippetStats {
  totalSnippets: number
  activeSnippets: number
  totalUsage: number
  topPlatform: string
}

const SnippetManager: React.FC = () => {
  const [snippets, setSnippets] = useState<IntegrationSnippet[]>([])
  const [stats, setStats] = useState<SnippetStats>({
    totalSnippets: 0,
    activeSnippets: 0,
    totalUsage: 0,
    topPlatform: 'Web'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [platformFilter, setPlatformFilter] = useState("All")
  const [selectedSnippet, setSelectedSnippet] = useState<IntegrationSnippet | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Form states for new snippet creation
  const [newSnippet, setNewSnippet] = useState({
    companyName: '',
    platform: 'Web',
    features: [] as string[]
  })

  const platforms = ['Web', 'Mobile', 'Desktop', 'API']
  const availableFeatures = [
    { id: 'tracking', name: 'Event Tracking' },
    { id: 'analytics', name: 'Analytics Dashboard' },
    { id: 'notifications', name: 'Push Notifications' },
    { id: 'auth', name: 'Authentication' },
    { id: 'payments', name: 'Payment Processing' },
    { id: 'chat', name: 'Live Chat Support' }
  ]

  useEffect(() => {
    loadSnippets()
    loadStats()
  }, [])

  const loadSnippets = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getIntegrationSnippets()
      if (response.success && Array.isArray(response.data)) {
        setSnippets(response.data)
      } else {
        setError(response.message || 'Failed to load integration snippets')
        setSnippets([])
      }
    } catch (error) {
      console.error('Error loading snippets:', error)
      setError(error instanceof Error ? error.message : 'Failed to load integration snippets')
      setSnippets([])
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await apiClient.getSnippetStats()
      if (response.success && response.data) {
        setStats(response.data)
      } else {
        // Calculate stats from snippets if available
        if (Array.isArray(snippets) && snippets.length > 0) {
          const platformCounts: Record<string, number> = {}
          snippets.forEach(s => {
            platformCounts[s.platform] = (platformCounts[s.platform] || 0) + 1
          })
          const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Web'
          
          setStats({
            totalSnippets: snippets.length,
            activeSnippets: snippets.filter(s => s.status === 'Active').length,
            totalUsage: snippets.reduce((sum, s) => sum + (s.usageCount || 0), 0),
            topPlatform
          })
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  // Custom toast implementation
  const toast = {
    success: (message: string) => console.log('Success:', message),
    error: (message: string) => console.error('Error:', message)
  }

  const filteredSnippets = Array.isArray(snippets) ? snippets.filter(snippet => {
    const matchesSearch = snippet.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         snippet.clientCode?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPlatform = platformFilter === "All" || snippet.platform === platformFilter
    return matchesSearch && matchesPlatform
  }) : []

  const generateClientCode = () => {
    const codes = Array.isArray(snippets) ? snippets.map(s => s.clientCode) : []
    let newCode
    do {
      const num = Math.floor(Math.random() * 99999).toString().padStart(5, '0')
      newCode = `FR${num}`
    } while (codes.includes(newCode))
    return newCode
  }

  const handleCreateSnippet = () => {
    setNewSnippet({
      companyName: '',
      platform: 'Web',
      features: []
    })
    setShowCreateDialog(true)
  }

  const handleViewSnippet = (snippet: IntegrationSnippet) => {
    setSelectedSnippet(snippet)
    setShowViewDialog(true)
  }

  const handleEditSnippet = (snippet: IntegrationSnippet) => {
    setSelectedSnippet(snippet)
    setShowEditDialog(true)
  }

  const handleCopySnippet = (snippet: IntegrationSnippet) => {
    navigator.clipboard.writeText(snippet.snippet)
    toast.success("Code snippet copied to clipboard!")
  }

  const handleDeleteSnippet = async (snippet: IntegrationSnippet) => {
    try {
      const response = await apiClient.deleteSnippet(String(snippet.id))
      if (response.success) {
        toast.success(`Integration code for ${snippet.companyName} has been deleted`)
        loadSnippets()
      } else {
        toast.error('Failed to delete snippet')
      }
    } catch (error) {
      console.error('Error deleting snippet:', error)
      toast.error('Failed to delete snippet')
    }
  }

  const handleRegenerateSnippet = async (snippet: IntegrationSnippet) => {
    try {
      const response = await apiClient.generateSnippet({
        clientCode: snippet.clientCode,
        platform: snippet.platform,
        features: snippet.integrations
      })
      if (response.success) {
        toast.success(`New integration code generated for ${snippet.companyName}`)
        loadSnippets()
      } else {
        toast.error('Failed to regenerate snippet')
      }
    } catch (error) {
      console.error('Error regenerating snippet:', error)
      toast.error('Failed to regenerate snippet')
    }
  }

  const handleGenerateNew = async () => {
    if (!newSnippet.companyName.trim()) {
      toast.error('Company name is required')
      return
    }

    setIsGenerating(true)
    try {
      const clientCode = generateClientCode()
      const response = await apiClient.generateSnippet({
        clientCode,
        platform: newSnippet.platform,
        features: newSnippet.features,
        companyName: newSnippet.companyName
      })
      
      if (response.success) {
        toast.success("New integration code generated successfully!")
        setShowCreateDialog(false)
        loadSnippets()
      } else {
        toast.error('Failed to generate new snippet')
      }
    } catch (error) {
      console.error('Error generating new snippet:', error)
      toast.error('Failed to generate new snippet')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUpdateSnippet = async () => {
    if (selectedSnippet) {
      try {
        const response = await apiClient.updateSnippet(String(selectedSnippet.id), selectedSnippet)
        if (response.success) {
          toast.success("Integration code updated successfully!")
          setShowEditDialog(false)
          loadSnippets()
        } else {
          toast.error('Failed to update snippet')
        }
      } catch (error) {
        console.error('Error updating snippet:', error)
        toast.error('Failed to update snippet')
      }
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Web': return <Globe className="h-4 w-4" />
      case 'Mobile': return <Smartphone className="h-4 w-4" />
      case 'Desktop': return <Monitor className="h-4 w-4" />
      default: return <Code className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading integration snippets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Integration Code Manager</h2>
          <p className="text-muted-foreground">
            Generate and manage integration snippets for client applications
          </p>
        </div>
        <Button onClick={handleCreateSnippet} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Generate New Code
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <ErrorAlert
          message={error}
          onRetry={() => {
            loadSnippets()
            loadStats()
          }}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Snippets</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSnippets || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Badge variant="secondary" className="h-4 w-4 rounded-full p-0 bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSnippets || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalUsage || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Platform</CardTitle>
            {getPlatformIcon(stats.topPlatform || 'Web')}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topPlatform || 'Web'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by company name or client code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Platforms</SelectItem>
                {platforms.map(platform => (
                  <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Snippets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Snippets</CardTitle>
          <CardDescription>
            Manage all generated integration codes for your clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Empty State */}
          {!error && filteredSnippets.length === 0 && !loading && (
            <EmptyState
              icon={Code}
              title={searchTerm || platformFilter !== "All" ? "No snippets found" : "No integration snippets yet"}
              description={
                searchTerm || platformFilter !== "All"
                  ? "Try adjusting your search or filters"
                  : "Get started by generating your first integration code"
              }
              action={{
                label: "Generate New Code",
                onClick: handleCreateSnippet
              }}
            />
          )}

          {/* Snippets Table */}
          {filteredSnippets.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Code</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Usage Count</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSnippets.map((snippet) => (
                <TableRow key={snippet.id}>
                  <TableCell className="font-mono">{snippet.clientCode}</TableCell>
                  <TableCell className="font-medium">{snippet.companyName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(snippet.platform)}
                      {snippet.platform}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={snippet.status === 'Active' ? 'default' : 'secondary'}>
                      {snippet.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {snippet.integrations.slice(0, 2).map((integration, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {integration}
                        </Badge>
                      ))}
                      {snippet.integrations.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{snippet.integrations.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{snippet.usageCount.toLocaleString()}</TableCell>
                  <TableCell>{new Date(snippet.lastUsed).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewSnippet(snippet)}
                        title="View snippet"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopySnippet(snippet)}
                        title="Copy to clipboard"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSnippet(snippet)}
                        title="Edit snippet"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRegenerateSnippet(snippet)}
                        title="Regenerate snippet"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSnippet(snippet)}
                        title="Delete snippet"
                        className="text-destructive hover:text-destructive"
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

      {/* Create Snippet Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate New Integration Code</DialogTitle>
            <DialogDescription>
              Create a new integration snippet for a client application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={newSnippet.companyName}
                  onChange={(e) => setNewSnippet(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select
                  value={newSnippet.platform}
                  onValueChange={(value) => setNewSnippet(prev => ({ ...prev, platform: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map(platform => (
                      <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Features to Include</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {availableFeatures.map((feature) => (
                  <div key={feature.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={feature.id}
                      checked={newSnippet.features.includes(feature.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewSnippet(prev => ({
                            ...prev,
                            features: [...prev.features, feature.name]
                          }))
                        } else {
                          setNewSnippet(prev => ({
                            ...prev,
                            features: prev.features.filter(f => f !== feature.name)
                          }))
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor={feature.id} className="text-sm">{feature.name}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleGenerateNew} disabled={isGenerating} className="flex-1">
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Code'
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Snippet Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Integration Code - {selectedSnippet?.companyName}</DialogTitle>
            <DialogDescription>
              Client Code: {selectedSnippet?.clientCode}
            </DialogDescription>
          </DialogHeader>
          {selectedSnippet && (
            <Tabs defaultValue="snippet" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="snippet">Code Snippet</TabsTrigger>
                <TabsTrigger value="implementation">Implementation Guide</TabsTrigger>
                <TabsTrigger value="features">Features & Support</TabsTrigger>
              </TabsList>
              <TabsContent value="snippet" className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Integration Code</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopySnippet(selectedSnippet)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Code
                    </Button>
                  </div>
                  <Textarea
                    value={selectedSnippet.snippet}
                    readOnly
                    className="font-mono text-sm min-h-[200px]"
                  />
                </div>
              </TabsContent>
              <TabsContent value="implementation" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Installation</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Follow these steps to integrate Framtt into your {selectedSnippet.platform.toLowerCase()} application:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Copy the integration code above</li>
                    <li>Paste it into your application's main template or entry point</li>
                    <li>Ensure the code is loaded before any tracking events</li>
                    <li>Test the integration using our verification tools</li>
                  </ol>
                </div>
              </TabsContent>
              <TabsContent value="features" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Enabled Features</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSnippet.integrations.map((integration, index) => (
                      <Badge key={index} variant="outline">
                        {integration}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Usage Statistics</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Uses:</span>
                      <span className="ml-2 font-medium">{selectedSnippet.usageCount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Used:</span>
                      <span className="ml-2 font-medium">{new Date(selectedSnippet.lastUsed).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Support</h4>
                  <p className="text-sm text-muted-foreground">
                    For technical support, contact our integration team at support@framtt.com
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Snippet Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Integration Code</DialogTitle>
            <DialogDescription>
              Update integration settings for {selectedSnippet?.companyName}
            </DialogDescription>
          </DialogHeader>
          {selectedSnippet && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editClientCode">Client Code</Label>
                  <Input id="editClientCode" value={selectedSnippet.clientCode} readOnly className="font-mono" />
                </div>
                <div>
                  <Label htmlFor="editStatus">Status</Label>
                  <Select
                    value={selectedSnippet.status}
                    onValueChange={(value: 'Active' | 'Inactive') => 
                      setSelectedSnippet(prev => prev ? { ...prev, status: value } : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Update Features</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {availableFeatures.map((feature) => (
                    <div key={feature.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`edit-${feature.id}`}
                        checked={selectedSnippet.integrations.includes(feature.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSnippet(prev => prev ? {
                              ...prev,
                              integrations: [...prev.integrations, feature.name]
                            } : null)
                          } else {
                            setSelectedSnippet(prev => prev ? {
                              ...prev,
                              integrations: prev.integrations.filter(i => i !== feature.name)
                            } : null)
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={`edit-${feature.id}`} className="text-sm">{feature.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdateSnippet} className="flex-1">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
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

export default SnippetManager
