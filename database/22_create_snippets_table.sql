-- Create snippets table for code integration examples
CREATE TABLE IF NOT EXISTS snippets (
  id BIGSERIAL PRIMARY KEY,
  snippet_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- 'REST API', 'Widget', 'Authentication', 'Algorithm', 'Webhook'
  category VARCHAR(100) NOT NULL, -- 'tracking', 'dashboard', 'security', 'optimization', 'analytics'
  description TEXT,
  language VARCHAR(50) NOT NULL, -- 'javascript', 'python', 'java', 'curl', etc.
  code TEXT NOT NULL,
  integrations TEXT[], -- Array of integration features
  version VARCHAR(20) DEFAULT '1.0.0',
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  documentation_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_snippets_snippet_id ON snippets(snippet_id);
CREATE INDEX IF NOT EXISTS idx_snippets_category ON snippets(category);
CREATE INDEX IF NOT EXISTS idx_snippets_type ON snippets(type);
CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_is_active ON snippets(is_active);
CREATE INDEX IF NOT EXISTS idx_snippets_created_at ON snippets(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_snippets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER snippets_updated_at_trigger
BEFORE UPDATE ON snippets
FOR EACH ROW
EXECUTE FUNCTION update_snippets_updated_at();

-- Insert sample snippets
INSERT INTO snippets (
  snippet_id, name, type, category, description, language, code, 
  integrations, version, downloads, rating, documentation_url
) VALUES 
(
  'snippet_001',
  'Vehicle Tracking API',
  'REST API',
  'tracking',
  'Real-time vehicle location tracking integration',
  'javascript',
  '// Vehicle Tracking Integration
const framttAPI = require(''@framtt/tracking-sdk'');

const tracker = new framttAPI.VehicleTracker({
  apiKey: ''your_api_key_here'',
  clientId: ''your_client_id''
});

// Start tracking a vehicle
tracker.startTracking(''vehicle_123'', {
  interval: 30000, // 30 seconds
  geofencing: true,
  alerts: [''speed_limit'', ''route_deviation'']
});

// Get real-time location
tracker.getLocation(''vehicle_123'')
  .then(location => {
    console.log(''Current location:'', location);
  })
  .catch(err => {
    console.error(''Tracking error:'', err);
  });',
  ARRAY['GPS Tracking', 'Geofencing', 'Real-time Updates'],
  '2.1.0',
  1250,
  4.8,
  'https://docs.framtt.com/vehicle-tracking'
),
(
  'snippet_002',
  'Fleet Management Dashboard',
  'Widget',
  'dashboard',
  'Embeddable fleet management dashboard widget',
  'javascript',
  '// Fleet Dashboard Widget
<script src="https://cdn.framtt.com/dashboard-widget.js"></script>

<div id="framtt-dashboard" 
     data-api-key="your_api_key_here"
     data-client-id="your_client_id"
     data-theme="dark"
     data-modules="vehicles,drivers,routes">
</div>

<script>
  FramttDashboard.init({
    container: ''#framtt-dashboard'',
    config: {
      refreshInterval: 60000,
      showAlerts: true,
      compactMode: false,
      customColors: {
        primary: ''#2563eb'',
        success: ''#16a34a'',
        warning: ''#d97706'',
        danger: ''#dc2626''
      }
    }
  });
</script>',
  ARRAY['Dashboard Widget', 'Real-time Data', 'Custom Theming'],
  '1.8.2',
  890,
  4.6,
  'https://docs.framtt.com/dashboard-widget'
),
(
  'snippet_003',
  'Driver Authentication',
  'Authentication',
  'security',
  'Secure driver authentication and authorization',
  'javascript',
  '// Driver Authentication
const framttAuth = require(''@framtt/auth-sdk'');

const authClient = new framttAuth.DriverAuth({
  apiKey: ''your_api_key_here'',
  endpoint: ''https://api.framtt.com/auth''
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
      localStorage.setItem(''driver_token'', result.token);
      return {
        success: true,
        driver: result.driver,
        permissions: result.permissions
      };
    }
  } catch (error) {
    console.error(''Authentication failed:'', error);
    return { success: false, error: error.message };
  }
}

// Verify driver session
async function verifySession() {
  const token = localStorage.getItem(''driver_token'');
  return await authClient.verifyToken(token);
}',
  ARRAY['PIN Authentication', 'Device Verification', 'Session Management'],
  '3.0.1',
  2100,
  4.9,
  'https://docs.framtt.com/driver-auth'
),
(
  'snippet_004',
  'Route Optimization',
  'Algorithm',
  'optimization',
  'AI-powered route optimization for fleet efficiency',
  'python',
  '# Route Optimization with Framtt AI
from framtt_ai import RouteOptimizer

# Initialize optimizer
optimizer = RouteOptimizer(
    api_key="your_api_key_here",
    model="v3-advanced"
)

# Define stops and constraints
stops = [
    {"id": "stop_1", "lat": 40.7128, "lng": -74.0060, "duration": 15},
    {"id": "stop_2", "lat": 40.7614, "lng": -73.9776, "duration": 20},
    {"id": "stop_3", "lat": 40.7489, "lng": -73.9680, "duration": 10}
]

# Optimize route
optimized_route = optimizer.optimize(
    stops=stops,
    start_location={"lat": 40.7589, "lng": -73.9851},
    constraints={
        "max_duration": 180,  # minutes
        "traffic_aware": True,
        "time_windows": True
    }
)

print(f"Optimized route: {optimized_route.sequence}")
print(f"Total distance: {optimized_route.total_distance}km")
print(f"Estimated time: {optimized_route.estimated_time}min")',
  ARRAY['AI Optimization', 'Traffic Analysis', 'Time Windows'],
  '2.5.0',
  1680,
  4.7,
  'https://docs.framtt.com/route-optimization'
),
(
  'snippet_005',
  'Webhook Notifications',
  'Webhook',
  'notifications',
  'Real-time event notifications via webhooks',
  'javascript',
  '// Webhook Setup for Real-time Notifications
const express = require(''express'');
const app = express();

app.use(express.json());

// Webhook endpoint to receive Framtt events
app.post(''/webhooks/framtt'', (req, res) => {
  const event = req.body;
  
  // Verify webhook signature
  const signature = req.headers[''x-framtt-signature''];
  if (!verifySignature(event, signature)) {
    return res.status(401).send(''Invalid signature'');
  }
  
  // Handle different event types
  switch(event.type) {
    case ''vehicle.location_updated'':
      handleLocationUpdate(event.data);
      break;
    case ''vehicle.speed_alert'':
      handleSpeedAlert(event.data);
      break;
    case ''driver.authenticated'':
      handleDriverAuth(event.data);
      break;
    case ''route.completed'':
      handleRouteCompletion(event.data);
      break;
  }
  
  res.status(200).send(''OK'');
});

app.listen(3000, () => {
  console.log(''Webhook server listening on port 3000'');
});',
  ARRAY['Real-time Events', 'Webhook Security', 'Event Processing'],
  '1.4.0',
  750,
  4.5,
  'https://docs.framtt.com/webhooks'
);

-- Add comment to table
COMMENT ON TABLE snippets IS 'Stores code snippets and integration examples for the Framtt platform';
