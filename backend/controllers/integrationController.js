const { asyncHandler } = require('../middleware/errorHandler');
const { auditService } = require('../services/database');

// Mock integration snippets data
const mockIntegrationData = {
  snippets: [
    {
      id: 1,
      name: 'API Authentication',
      type: 'api_auth',
      language: 'javascript',
      description: 'Basic API authentication setup for Framtt integration',
      category: 'authentication',
      code: `// Framtt API Authentication
const framttAPI = {
  baseURL: 'https://api.framtt.com/v1',
  apiKey: 'YOUR_API_KEY_HERE',
  
  authenticate: async function() {
    const response = await fetch(\`\${this.baseURL}/auth\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${this.apiKey}\`
      }
    });
    return response.json();
  }
};`,
      usage: 'Replace YOUR_API_KEY_HERE with your actual API key',
      status: 'active',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-15T00:00:00Z'),
      createdBy: 1,
      tags: ['api', 'auth', 'javascript']
    },
    {
      id: 2,
      name: 'Webhook Handler',
      type: 'webhook',
      language: 'javascript',
      description: 'Handle incoming webhooks from Framtt system',
      category: 'webhooks',
      code: `// Framtt Webhook Handler
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const WEBHOOK_SECRET = 'YOUR_WEBHOOK_SECRET';

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return \`sha256=\${expectedSignature}\` === signature;
}

app.post('/webhook/framtt', (req, res) => {
  const signature = req.headers['x-framtt-signature'];
  const payload = JSON.stringify(req.body);
  
  if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process the webhook
  console.log('Received webhook:', req.body);
  
  res.status(200).send('OK');
});`,
      usage: 'Set up an endpoint to receive webhooks from Framtt',
      status: 'active',
      createdAt: new Date('2024-01-05T00:00:00Z'),
      updatedAt: new Date('2024-01-10T00:00:00Z'),
      createdBy: 1,
      tags: ['webhook', 'security', 'express']
    },
    {
      id: 3,
      name: 'Vehicle Data Sync',
      type: 'data_sync',
      language: 'python',
      description: 'Synchronize vehicle data with Framtt platform',
      category: 'integration',
      code: `# Framtt Vehicle Data Sync
import requests
import json

class FramttSync:
    def __init__(self, api_key, base_url='https://api.framtt.com/v1'):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def sync_vehicle(self, vehicle_data):
        """Sync a single vehicle to Framtt"""
        endpoint = f'{self.base_url}/vehicles'
        response = requests.post(endpoint, headers=self.headers, json=vehicle_data)
        return response.json()
    
    def sync_all_vehicles(self, vehicles):
        """Sync multiple vehicles"""
        results = []
        for vehicle in vehicles:
            result = self.sync_vehicle(vehicle)
            results.append(result)
        return results

# Usage
framtt = FramttSync('YOUR_API_KEY')
vehicle_data = {
    'make': 'Toyota',
    'model': 'Camry',
    'year': 2024,
    'license_plate': 'ABC123',
    'status': 'available'
}
result = framtt.sync_vehicle(vehicle_data)`,
      usage: 'Use this to sync vehicle data from your system to Framtt',
      status: 'active',
      createdAt: new Date('2024-01-10T00:00:00Z'),
      updatedAt: new Date('2024-01-20T00:00:00Z'),
      createdBy: 1,
      tags: ['python', 'vehicles', 'sync']
    },
    {
      id: 4,
      name: 'Client Dashboard Widget',
      type: 'widget',
      language: 'html',
      description: 'Embeddable dashboard widget for client websites',
      category: 'frontend',
      code: `<!-- Framtt Dashboard Widget -->
<div id="framtt-dashboard" style="width: 100%; height: 400px; border: 1px solid #ccc; border-radius: 8px;">
  <iframe 
    src="https://app.framtt.com/widget/dashboard?key=YOUR_WIDGET_KEY"
    width="100%" 
    height="100%" 
    frameborder="0"
    style="border-radius: 8px;">
  </iframe>
</div>

<script>
// Optional: Listen for widget events
window.addEventListener('message', function(event) {
  if (event.origin !== 'https://app.framtt.com') return;
  
  if (event.data.type === 'framtt-widget-loaded') {
    console.log('Framtt widget loaded successfully');
  }
});
</script>`,
      usage: 'Embed this widget in your client website to display Framtt dashboard',
      status: 'active',
      createdAt: new Date('2024-01-15T00:00:00Z'),
      updatedAt: new Date('2024-01-25T00:00:00Z'),
      createdBy: 1,
      tags: ['html', 'widget', 'embed']
    }
  ],
  
  templates: [
    {
      id: 1,
      name: 'Basic Integration Template',
      description: 'Complete integration template for new clients',
      type: 'full_integration',
      files: [
        {
          name: 'config.js',
          content: 'module.exports = { apiKey: "YOUR_API_KEY", baseURL: "https://api.framtt.com/v1" };'
        },
        {
          name: 'framtt-client.js',
          content: 'class FramttClient { /* implementation */ }'
        }
      ],
      createdAt: new Date('2024-01-01T00:00:00Z'),
      status: 'active'
    }
  ]
};

// @desc    Get all integration snippets
// @route   GET /api/integrations/snippets
// @access  Private (Admin/Superadmin)
const getIntegrationSnippets = asyncHandler(async (req, res) => {
  const {
    category,
    language,
    type,
    search,
    limit = 20,
    offset = 0
  } = req.query;

  let filteredSnippets = [...mockIntegrationData.snippets];

  // Apply filters
  if (category && category !== 'all') {
    filteredSnippets = filteredSnippets.filter(snippet => snippet.category === category);
  }

  if (language && language !== 'all') {
    filteredSnippets = filteredSnippets.filter(snippet => snippet.language === language);
  }

  if (type && type !== 'all') {
    filteredSnippets = filteredSnippets.filter(snippet => snippet.type === type);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filteredSnippets = filteredSnippets.filter(snippet =>
      snippet.name.toLowerCase().includes(searchLower) ||
      snippet.description.toLowerCase().includes(searchLower) ||
      snippet.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  // Apply pagination
  const total = filteredSnippets.length;
  const paginatedSnippets = filteredSnippets
    .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      snippets: paginatedSnippets,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// @desc    Get single integration snippet
// @route   GET /api/integrations/snippets/:id
// @access  Private (Admin/Superadmin)
const getIntegrationSnippet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const snippet = mockIntegrationData.snippets.find(s => s.id === parseInt(id));
  
  if (!snippet) {
    return res.status(404).json({
      success: false,
      message: 'Integration snippet not found'
    });
  }

  res.status(200).json({
    success: true,
    data: { snippet }
  });
});

// @desc    Generate new integration code
// @route   POST /api/integrations/snippets
// @access  Private (Admin/Superadmin)
const generateIntegrationCode = asyncHandler(async (req, res) => {
  const {
    name,
    type,
    language,
    description,
    category,
    code,
    usage,
    tags = []
  } = req.body;

  const currentUserId = req.user.id;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  // Validate required fields
  if (!name || !type || !language || !code) {
    return res.status(400).json({
      success: false,
      message: 'Name, type, language, and code are required'
    });
  }

  try {
    // Create new snippet
    const newSnippet = {
      id: Math.max(...mockIntegrationData.snippets.map(s => s.id), 0) + 1,
      name,
      type,
      language,
      description: description || '',
      category: category || 'general',
      code,
      usage: usage || '',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: currentUserId,
      tags: Array.isArray(tags) ? tags : []
    };

    // Add to mock data
    mockIntegrationData.snippets.push(newSnippet);

    // Log the creation
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'INTEGRATION_SNIPPET_CREATED',
      resourceType: 'INTEGRATION_SNIPPET',
      resourceId: newSnippet.id,
      oldValues: null,
      newValues: {
        name: newSnippet.name,
        type: newSnippet.type,
        language: newSnippet.language,
        category: newSnippet.category
      },
      ipAddress,
      userAgent
    });

    res.status(201).json({
      success: true,
      message: 'Integration snippet created successfully',
      data: { snippet: newSnippet }
    });
  } catch (error) {
    console.error('Error creating integration snippet:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating integration snippet'
    });
  }
});

// @desc    Update integration snippet
// @route   PUT /api/integrations/snippets/:id
// @access  Private (Admin/Superadmin)
const updateIntegrationSnippet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const currentUserId = req.user.id;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  const snippetIndex = mockIntegrationData.snippets.findIndex(s => s.id === parseInt(id));
  
  if (snippetIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Integration snippet not found'
    });
  }

  try {
    const oldSnippet = { ...mockIntegrationData.snippets[snippetIndex] };
    
    // Update snippet data
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'createdBy') {
        mockIntegrationData.snippets[snippetIndex][key] = updates[key];
      }
    });

    mockIntegrationData.snippets[snippetIndex].updatedAt = new Date();

    // Log the update
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'INTEGRATION_SNIPPET_UPDATED',
      resourceType: 'INTEGRATION_SNIPPET',
      resourceId: parseInt(id),
      oldValues: oldSnippet,
      newValues: mockIntegrationData.snippets[snippetIndex],
      ipAddress,
      userAgent
    });

    res.status(200).json({
      success: true,
      message: 'Integration snippet updated successfully',
      data: { snippet: mockIntegrationData.snippets[snippetIndex] }
    });
  } catch (error) {
    console.error('Error updating integration snippet:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating integration snippet'
    });
  }
});

// @desc    Delete integration snippet
// @route   DELETE /api/integrations/snippets/:id
// @access  Private (Superadmin)
const deleteIntegrationSnippet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  const snippetIndex = mockIntegrationData.snippets.findIndex(s => s.id === parseInt(id));
  
  if (snippetIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Integration snippet not found'
    });
  }

  try {
    const deletedSnippet = mockIntegrationData.snippets[snippetIndex];
    
    // Remove snippet
    mockIntegrationData.snippets.splice(snippetIndex, 1);

    // Log the deletion
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'INTEGRATION_SNIPPET_DELETED',
      resourceType: 'INTEGRATION_SNIPPET',
      resourceId: parseInt(id),
      oldValues: deletedSnippet,
      newValues: null,
      ipAddress,
      userAgent
    });

    res.status(200).json({
      success: true,
      message: 'Integration snippet deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting integration snippet:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting integration snippet'
    });
  }
});

// @desc    Get integration templates
// @route   GET /api/integrations/templates
// @access  Private (Admin/Superadmin)
const getIntegrationTemplates = asyncHandler(async (req, res) => {
  const { type, limit = 10, offset = 0 } = req.query;

  let filteredTemplates = [...mockIntegrationData.templates];

  if (type && type !== 'all') {
    filteredTemplates = filteredTemplates.filter(template => template.type === type);
  }

  // Apply pagination
  const total = filteredTemplates.length;
  const paginatedTemplates = filteredTemplates
    .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      templates: paginatedTemplates,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// @desc    Get integration statistics
// @route   GET /api/integrations/stats
// @access  Private (Admin/Superadmin)
const getIntegrationStats = asyncHandler(async (req, res) => {
  const stats = {
    totalSnippets: mockIntegrationData.snippets.length,
    totalTemplates: mockIntegrationData.templates.length,
    byLanguage: mockIntegrationData.snippets.reduce((acc, snippet) => {
      acc[snippet.language] = (acc[snippet.language] || 0) + 1;
      return acc;
    }, {}),
    byCategory: mockIntegrationData.snippets.reduce((acc, snippet) => {
      acc[snippet.category] = (acc[snippet.category] || 0) + 1;
      return acc;
    }, {}),
    byType: mockIntegrationData.snippets.reduce((acc, snippet) => {
      acc[snippet.type] = (acc[snippet.type] || 0) + 1;
      return acc;
    }, {}),
    activeSnippets: mockIntegrationData.snippets.filter(s => s.status === 'active').length
  };

  res.status(200).json({
    success: true,
    data: { stats }
  });
});

module.exports = {
  getIntegrationSnippets,
  getIntegrationSnippet,
  generateIntegrationCode,
  updateIntegrationSnippet,
  deleteIntegrationSnippet,
  getIntegrationTemplates,
  getIntegrationStats
};
