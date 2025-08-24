const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const { requireSuperAdmin } = require('../middleware/auth');

// All snippets routes require superadmin access
router.use(requireSuperAdmin);

// GET /api/snippets
router.get('/', async (req, res) => {
  try {
    // Mock integration snippets data
    const snippets = [
      {
        id: 'snippet_001',
        name: 'Vehicle Tracking API',
        type: 'REST API',
        category: 'tracking',
        description: 'Real-time vehicle location tracking integration',
        language: 'javascript',
        code: `// Vehicle Tracking Integration
const framttAPI = require('@framtt/tracking-sdk');

const tracker = new framttAPI.VehicleTracker({
  apiKey: 'your_api_key_here',
  clientId: 'your_client_id'
});

// Start tracking a vehicle
tracker.startTracking('vehicle_123', {
  interval: 30000, // 30 seconds
  geofencing: true,
  alerts: ['speed_limit', 'route_deviation']
});

// Get real-time location
tracker.getLocation('vehicle_123')
  .then(location => {
    console.log('Current location:', location);
  })
  .catch(err => {
    console.error('Tracking error:', err);
  });`,
        integrations: ['GPS Tracking', 'Geofencing', 'Real-time Updates'],
        version: '2.1.0',
        lastUpdated: '2025-01-05T10:30:00Z',
        downloads: 1250,
        rating: 4.8,
        documentation: 'https://docs.framtt.com/vehicle-tracking'
      },
      {
        id: 'snippet_002',
        name: 'Fleet Management Dashboard',
        type: 'Widget',
        category: 'dashboard',
        description: 'Embeddable fleet management dashboard widget',
        language: 'javascript',
        code: `// Fleet Dashboard Widget
<script src="https://cdn.framtt.com/dashboard-widget.js"></script>

<div id="framtt-dashboard" 
     data-api-key="your_api_key_here"
     data-client-id="your_client_id"
     data-theme="dark"
     data-modules="vehicles,drivers,routes">
</div>

<script>
  FramttDashboard.init({
    container: '#framtt-dashboard',
    config: {
      refreshInterval: 60000,
      showAlerts: true,
      compactMode: false,
      customColors: {
        primary: '#2563eb',
        success: '#16a34a',
        warning: '#d97706',
        danger: '#dc2626'
      }
    }
  });
</script>`,
        integrations: ['Dashboard Widget', 'Real-time Data', 'Custom Theming'],
        version: '1.8.2',
        lastUpdated: '2025-01-03T14:22:00Z',
        downloads: 890,
        rating: 4.6,
        documentation: 'https://docs.framtt.com/dashboard-widget'
      },
      {
        id: 'snippet_003',
        name: 'Driver Authentication',
        type: 'Authentication',
        category: 'security',
        description: 'Secure driver authentication and authorization',
        language: 'javascript',
        code: `// Driver Authentication
const framttAuth = require('@framtt/auth-sdk');

const authClient = new framttAuth.DriverAuth({
  apiKey: 'your_api_key_here',
  endpoint: 'https://api.framtt.com/auth'
});

// Authenticate driver with PIN
async function authenticateDriver(driverId, pin) {
  try {
    const result = await authClient.authenticate({
      driverId: driverId,
      pin: pin,
      deviceId: getDeviceId(),
      location: await getCurrentLocation()
    });
    
    if (result.success) {
      // Driver authenticated successfully
      localStorage.setItem('driver_token', result.token);
      return {
        success: true,
        driver: result.driver,
        permissions: result.permissions
      };
    }
  } catch (error) {
    console.error('Authentication failed:', error);
    return { success: false, error: error.message };
  }
}

// Verify driver session
async function verifySession() {
  const token = localStorage.getItem('driver_token');
  return await authClient.verifyToken(token);
}`,
        integrations: ['PIN Authentication', 'Device Verification', 'Session Management'],
        version: '3.0.1',
        lastUpdated: '2025-01-07T09:15:00Z',
        downloads: 2100,
        rating: 4.9,
        documentation: 'https://docs.framtt.com/driver-auth'
      },
      {
        id: 'snippet_004',
        name: 'Route Optimization',
        type: 'Algorithm',
        category: 'optimization',
        description: 'AI-powered route optimization for fleet efficiency',
        language: 'python',
        code: `# Route Optimization with Framtt AI
import framtt_ai as fai

# Initialize route optimizer
optimizer = fai.RouteOptimizer(
    api_key='your_api_key_here',
    optimization_level='advanced'
)

# Define delivery points
delivery_points = [
    {'id': 'stop_1', 'lat': 40.7128, 'lng': -74.0060, 'priority': 'high'},
    {'id': 'stop_2', 'lat': 40.7589, 'lng': -73.9851, 'priority': 'medium'},
    {'id': 'stop_3', 'lat': 40.6892, 'lng': -74.0445, 'priority': 'low'}
]

# Optimize route considering traffic, fuel efficiency, and time windows
optimized_route = optimizer.optimize(
    start_point={'lat': 40.7282, 'lng': -73.7949},
    end_point={'lat': 40.7282, 'lng': -73.7949},
    stops=delivery_points,
    constraints={
        'max_driving_time': 480,  # 8 hours
        'vehicle_capacity': 1000,  # kg
        'time_windows': True,
        'traffic_optimization': True
    }
)

print(f"Optimized route saves {optimized_route.time_saved} minutes")
print(f"Fuel efficiency improved by {optimized_route.fuel_savings}%")`,
        integrations: ['AI Route Planning', 'Traffic Analysis', 'Fuel Optimization'],
        version: '2.5.0',
        lastUpdated: '2025-01-04T16:45:00Z',
        downloads: 675,
        rating: 4.7,
        documentation: 'https://docs.framtt.com/route-optimization'
      },
      {
        id: 'snippet_005',
        name: 'Webhook Integration',
        type: 'Webhook',
        category: 'integration',
        description: 'Real-time event notifications via webhooks',
        language: 'javascript',
        code: `// Webhook Integration for Real-time Events
const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

// Webhook endpoint to receive Framtt events
app.post('/framtt-webhook', (req, res) => {
  const signature = req.headers['x-framtt-signature'];
  const payload = JSON.stringify(req.body);
  
  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.FRAMTT_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  if (signature !== 'sha256=' + expectedSignature) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process the event
  const event = req.body;
  console.log('Received event:', event.type);
  
  switch (event.type) {
    case 'vehicle.location_updated':
      handleLocationUpdate(event.data);
      break;
    case 'driver.shift_started':
      handleShiftStart(event.data);
      break;
    case 'alert.speed_limit_exceeded':
      handleSpeedAlert(event.data);
      break;
    case 'maintenance.service_due':
      handleMaintenanceAlert(event.data);
      break;
  }
  
  res.status(200).send('OK');
});

function handleLocationUpdate(data) {
  // Update vehicle location in your system
  console.log(\`Vehicle \${data.vehicleId} at \${data.location.lat}, \${data.location.lng}\`);
}

app.listen(3000, () => {
  console.log('Webhook server listening on port 3000');
});`,
        integrations: ['Real-time Events', 'Webhook Security', 'Event Processing'],
        version: '1.4.0',
        lastUpdated: '2025-01-06T11:30:00Z',
        downloads: 1450,
        rating: 4.5,
        documentation: 'https://docs.framtt.com/webhooks'
      }
    ];

    logger.info('Integration snippets requested');
    res.json({
      success: true,
      data: snippets
    });
  } catch (error) {
    logger.error('Error fetching integration snippets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch integration snippets',
      error: error.message
    });
  }
});

// GET /api/snippets/stats
router.get('/stats', async (req, res) => {
  try {
    // Mock snippet statistics
    const stats = {
      totalSnippets: 25,
      totalDownloads: 8365,
      averageRating: 4.7,
      categories: [
        { name: 'tracking', count: 8, downloads: 3200 },
        { name: 'dashboard', count: 5, downloads: 1800 },
        { name: 'security', count: 4, downloads: 1500 },
        { name: 'optimization', count: 3, downloads: 900 },
        { name: 'integration', count: 5, downloads: 965 }
      ],
      popularSnippets: [
        { id: 'snippet_003', name: 'Driver Authentication', downloads: 2100 },
        { id: 'snippet_005', name: 'Webhook Integration', downloads: 1450 },
        { id: 'snippet_001', name: 'Vehicle Tracking API', downloads: 1250 }
      ],
      recentActivity: [
        {
          action: 'download',
          snippet: 'Vehicle Tracking API',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        },
        {
          action: 'rating',
          snippet: 'Driver Authentication',
          rating: 5,
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
        },
        {
          action: 'download',
          snippet: 'Route Optimization',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ],
      monthlyDownloads: [
        { month: 'Dec 24', downloads: 1200 },
        { month: 'Jan 25', downloads: 1450 }
      ]
    };

    logger.info('Snippet statistics requested');
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching snippet statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch snippet statistics',
      error: error.message
    });
  }
});

// POST /api/snippets
router.post('/', async (req, res) => {
  try {
    const { name, type, category, description, language, code, integrations } = req.body;

    // Mock creating a new snippet
    const newSnippet = {
      id: `snippet_${Date.now()}`,
      name,
      type,
      category,
      description,
      language,
      code,
      integrations: integrations || [],
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      downloads: 0,
      rating: 0,
      documentation: `https://docs.framtt.com/custom-snippets/${name.toLowerCase().replace(/\s+/g, '-')}`
    };

    logger.info(`New snippet created: ${name}`);
    res.status(201).json({
      success: true,
      message: 'Snippet created successfully',
      data: newSnippet
    });
  } catch (error) {
    logger.error('Error creating snippet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create snippet',
      error: error.message
    });
  }
});

// PUT /api/snippets/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Mock updating a snippet
    const updatedSnippet = {
      id,
      ...updates,
      lastUpdated: new Date().toISOString(),
      version: '1.0.1' // Increment version
    };

    logger.info(`Snippet updated: ${id}`);
    res.json({
      success: true,
      message: 'Snippet updated successfully',
      data: updatedSnippet
    });
  } catch (error) {
    logger.error('Error updating snippet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update snippet',
      error: error.message
    });
  }
});

// DELETE /api/snippets/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Mock deleting a snippet
    logger.info(`Snippet deleted: ${id}`);
    res.json({
      success: true,
      message: 'Snippet deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting snippet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete snippet',
      error: error.message
    });
  }
});

module.exports = router;
