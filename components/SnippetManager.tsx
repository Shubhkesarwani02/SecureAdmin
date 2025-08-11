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
import { useState } from "react"

// Simple toast implementation
const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
  console.log(`[${type.toUpperCase()}] ${message}`)
  alert(`${type.toUpperCase()}: ${message}`)
}

const integrationSnippets = [
  {
    id: 1,
    clientCode: "FR001",
    companyName: "Elite Car Rentals",
    platform: "Web",
    status: "Active",
    createdAt: "2024-01-15",
    lastUsed: "2025-01-06",
    integrations: ["AI Recommendation", "Tracking", "WhatsApp"],
    snippet: `<script src="https://cdn.framtt.com/js/embed.js"></script>
<script>
  Framtt.init({
    clientId: 'FR001',
    apiKey: 'pk_live_abc123...',
    features: ['recommendations', 'tracking', 'whatsapp']
  });
</script>`
  },
  {
    id: 2,
    clientCode: "FR002",
    companyName: "Swift Vehicle Solutions",
    platform: "Mobile",
    status: "Active",
    createdAt: "2024-02-22",
    lastUsed: "2025-01-05",
    integrations: ["Marketing", "Tracking"],
    snippet: `import { FramttSDK } from '@framtt/react-native-sdk';

FramttSDK.configure({
  clientId: 'FR002',
  apiKey: 'pk_live_def456...',
  features: ['marketing', 'tracking']
});`
  },
  {
    id: 3,
    clientCode: "FR003",
    companyName: "Urban Mobility Co",
    platform: "API",
    status: "Inactive",
    createdAt: "2024-01-08",
    lastUsed: "2024-12-20",
    integrations: ["Tracking"],
    snippet: `curl -X POST https://api.framtt.com/v1/bookings \\
  -H "Authorization: Bearer sk_live_ghi789..." \\
  -H "Client-ID: FR003" \\
  -d '{"action": "track_booking", "data": {...}}'`
  },
  {
    id: 4,
    clientCode: "FR004",
    companyName: "Premium Fleet Services",
    platform: "Web",
    status: "Active",
    createdAt: "2024-03-10",
    lastUsed: "2025-01-07",
    integrations: ["AI Recommendation", "Marketing", "WhatsApp"],
    snippet: `<script src="https://cdn.framtt.com/js/embed.js"></script>
<script>
  Framtt.init({
    clientId: 'FR004',
    apiKey: 'pk_live_jkl012...',
    features: ['recommendations', 'marketing', 'whatsapp']
  });
</script>`
  }
]

const availableFeatures = [
  { id: "recommendations", name: "AI Recommendation", description: "Intelligent vehicle recommendations" },
  { id: "tracking", name: "Tracking Active", description: "Real-time booking and fleet tracking" },
  { id: "whatsapp", name: "WhatsApp Integration", description: "WhatsApp customer communications" },
  { id: "marketing", name: "Marketing Active", description: "Automated marketing campaigns" },
  { id: "analytics", name: "Analytics", description: "Advanced booking analytics" },
  { id: "payments", name: "Payment Processing", description: "Integrated payment solutions" }
]

export function SnippetManager() {
  const [searchTerm, setSearchTerm] = useState("")
  const [platformFilter, setPlatformFilter] = useState("All")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedSnippet, setSelectedSnippet] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const filteredSnippets = integrationSnippets.filter(snippet => {
    const matchesSearch = snippet.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         snippet.clientCode.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPlatform = platformFilter === "All" || snippet.platform === platformFilter
    return matchesSearch && matchesPlatform
  })

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

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "Web":
        return <Globe className="w-4 h-4" />
      case "Mobile":
        return <Smartphone className="w-4 h-4" />
      case "API":
        return <Code className="w-4 h-4" />
      default:
        return <Monitor className="w-4 h-4" />
    }
  }

  const getIntegrationBadges = (integrations: string[]) => {
    return integrations.map((integration, index) => (
      <Badge key={index} variant="outline" className="text-xs">
        {integration}
      </Badge>
    ))
  }

  const generateClientCode = () => {
    const codes = integrationSnippets.map(s => s.clientCode)
    let newCode
    do {
      const num = Math.floor(Math.random() * 99999).toString().padStart(5, '0')
      newCode = `FR${num}`
    } while (codes.includes(newCode))
    return newCode
  }

  const handleCreateSnippet = () => {
    setShowCreateDialog(true)
  }

  const handleViewSnippet = (snippet: any) => {
    setSelectedSnippet(snippet)
    setShowViewDialog(true)
  }

  const handleEditSnippet = (snippet: any) => {
    setSelectedSnippet(snippet)
    setShowEditDialog(true)
  }

  const handleCopySnippet = (snippet: any) => {
    navigator.clipboard.writeText(snippet.snippet)
    showToast("Code snippet copied to clipboard!", "success")
  }

  const handleDeleteSnippet = (snippet: any) => {
    showToast(`Integration code for ${snippet.companyName} has been deleted`, "success")
  }

  const handleRegenerateSnippet = (snippet: any) => {
    showToast(`New integration code generated for ${snippet.companyName}`, "success")
  }

  const handleGenerateCode = async () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      showToast("New integration code generated successfully!", "success")
      setShowCreateDialog(false)
    }, 2000)
  }

  const handleSaveSnippet = () => {
    showToast("Integration code updated successfully!", "success")
    setShowEditDialog(false)
    setSelectedSnippet(null)
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by company or client code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Platforms</SelectItem>
              <SelectItem value="Web">Web</SelectItem>
              <SelectItem value="Mobile">Mobile</SelectItem>
              <SelectItem value="API">API</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreateSnippet}>
          <Plus className="w-4 h-4 mr-2" />
          Generate New Code
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Integration Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrationSnippets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {integrationSnippets.filter(s => s.status === "Active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Web Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integrationSnippets.filter(s => s.platform === "Web").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Mobile Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integrationSnippets.filter(s => s.platform === "Mobile").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Codes</CardTitle>
          <CardDescription>Manage client integration codes and API snippets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Code</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Integrations</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSnippets.map((snippet) => (
                  <TableRow key={snippet.id}>
                    <TableCell className="font-medium font-mono">{snippet.clientCode}</TableCell>
                    <TableCell>{snippet.companyName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(snippet.platform)}
                        {snippet.platform}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(snippet.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getIntegrationBadges(snippet.integrations)}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(snippet.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(snippet.lastUsed).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleViewSnippet(snippet)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleCopySnippet(snippet)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditSnippet(snippet)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleRegenerateSnippet(snippet)}>
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteSnippet(snippet)}>
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

      {/* Create New Integration Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate New Integration Code</DialogTitle>
            <DialogDescription>
              Create a new 5-digit integration code for client platform integration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientCode">Client Code</Label>
                <Input id="clientCode" value={generateClientCode()} readOnly className="font-mono" />
              </div>
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" placeholder="Enter company name" />
              </div>
            </div>
            <div>
              <Label htmlFor="platform">Platform</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Web">Web Integration</SelectItem>
                  <SelectItem value="Mobile">Mobile SDK</SelectItem>
                  <SelectItem value="API">REST API</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Features to Enable</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {availableFeatures.map((feature) => (
                  <div key={feature.id} className="flex items-center space-x-2">
                    <input type="checkbox" id={feature.id} className="rounded" />
                    <Label htmlFor={feature.id} className="text-sm">{feature.name}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleGenerateCode}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                ) : (
                  <Code className="w-4 h-4 mr-2" />
                )}
                {isGenerating ? "Generating..." : "Generate Integration Code"}
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
            <DialogTitle>Integration Code - {selectedSnippet?.clientCode}</DialogTitle>
            <DialogDescription>
              Complete integration details and code snippet for {selectedSnippet?.companyName}
            </DialogDescription>
          </DialogHeader>
          {selectedSnippet && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="code">Code Snippet</TabsTrigger>
                <TabsTrigger value="documentation">Documentation</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Client Code</Label>
                    <p className="font-mono font-medium">{selectedSnippet.clientCode}</p>
                  </div>
                  <div>
                    <Label>Company Name</Label>
                    <p className="font-medium">{selectedSnippet.companyName}</p>
                  </div>
                  <div>
                    <Label>Platform</Label>
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(selectedSnippet.platform)}
                      <span>{selectedSnippet.platform}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    {getStatusBadge(selectedSnippet.status)}
                  </div>
                  <div>
                    <Label>Created Date</Label>
                    <p>{new Date(selectedSnippet.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>Last Used</Label>
                    <p>{new Date(selectedSnippet.lastUsed).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <Label>Active Integrations</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getIntegrationBadges(selectedSnippet.integrations)}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="code" className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Integration Code</Label>
                    <Button variant="outline" size="sm" onClick={() => handleCopySnippet(selectedSnippet)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Code
                    </Button>
                  </div>
                  <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                    <code>{selectedSnippet.snippet}</code>
                  </pre>
                </div>
              </TabsContent>
              
              <TabsContent value="documentation" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Integration Guide</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>1. Copy the integration code snippet from the "Code Snippet" tab</p>
                    <p>2. Add the code to your website before the closing &lt;/body&gt; tag</p>
                    <p>3. Replace the placeholder values with your actual configuration</p>
                    <p>4. Test the integration using the provided test endpoints</p>
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
                  <Select defaultValue={selectedSnippet.status}>
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
                        defaultChecked={selectedSnippet.integrations.some((i: string) => i.includes(feature.name.split(' ')[0]))}
                        className="rounded" 
                      />
                      <Label htmlFor={`edit-${feature.id}`} className="text-sm">{feature.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveSnippet} className="flex-1">
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
