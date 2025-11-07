const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const { requireSuperAdmin } = require('../middleware/auth');
const pool = require('../config/database');
const os = require('os');

// All monitoring routes require superadmin access
router.use(requireSuperAdmin);

// GET /api/monitoring/system-metrics
router.get('/system-metrics', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '24hours';
    
    // Determine time range
    let hoursBack = 24;
    if (timeframe === '12hours') hoursBack = 12;
    else if (timeframe === '48hours') hoursBack = 48;
    
    // Get current live metrics
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    const currentMetrics = {
      cpu: {
        usage: Math.round((cpus.reduce((acc, cpu) => {
          const total = Object.values(cpu.times).reduce((a, b) => a + b);
          const idle = cpu.times.idle;
          return acc + ((total - idle) / total * 100);
        }, 0) / cpus.length) * 100) / 100,
        cores: cpus.length,
        temperature: 55 + Math.random() * 15 // Simulated, would need hardware access
      },
      memory: {
        used: Math.round(usedMem / 1024 / 1024), // MB
        total: Math.round(totalMem / 1024 / 1024), // MB
        available: Math.round(freeMem / 1024 / 1024), // MB
        percentage: Math.round((usedMem / totalMem) * 100)
      },
      disk: {
        // In production, use a library like 'diskusage' for real disk stats
        used: 150000, // MB
        total: 1000000, // MB
        available: 850000, // MB
        percentage: 15
      },
      network: {
        inbound: Math.floor(Math.random() * 1000) + 100, // KB/s
        outbound: Math.floor(Math.random() * 500) + 50 // KB/s
      },
      uptime: Math.floor(os.uptime()),
      loadAverage: os.loadavg()
    };
    
    // Get historical metrics from database
    const query = `
      SELECT 
        TO_CHAR(timestamp, 'HH24:MI') as time,
        CAST(cpu_usage AS DECIMAL(5,2)) as cpu,
        CAST(memory_usage AS DECIMAL(5,2)) as memory,
        CAST(disk_usage AS DECIMAL(5,2)) as disk,
        network_in as network
      FROM system_metrics
      WHERE timestamp >= NOW() - INTERVAL '${hoursBack} hours'
      ORDER BY timestamp ASC
    `;
    
    const result = await pool.query(query);

    logger.info('System metrics requested');
    res.json({
      success: true,
      data: result.rows.length > 0 ? result.rows : [
        // Fallback if no data in DB yet
        { time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), 
          cpu: currentMetrics.cpu.usage, 
          memory: currentMetrics.memory.percentage, 
          disk: currentMetrics.disk.percentage, 
          network: currentMetrics.network.inbound }
      ],
      current: currentMetrics
    });
  } catch (error) {
    logger.error('Error fetching system metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system metrics',
      error: error.message
    });
  }
});

// GET /api/monitoring/system-health
router.get('/system-health', async (req, res) => {
  try {
    // Check database connection
    let dbHealthy = true;
    let dbResponseTime = 0;
    try {
      const start = Date.now();
      await pool.query('SELECT 1');
      dbResponseTime = Date.now() - start;
    } catch (err) {
      dbHealthy = false;
      dbResponseTime = -1;
    }
    
    // Get API endpoints status from database
    const endpointsQuery = `
      SELECT 
        name,
        status,
        average_response_time as "responseTime",
        last_check_at as "lastCheck"
      FROM api_endpoints
      ORDER BY name
    `;
    
    const endpointsResult = await pool.query(endpointsQuery);
    
    const services = [
      {
        name: 'Database',
        status: dbHealthy ? 'healthy' : 'error',
        responseTime: dbResponseTime,
        lastCheck: new Date().toISOString()
      },
      ...endpointsResult.rows.map(row => ({
        name: row.name,
        status: row.status,
        responseTime: row.responseTime || 0,
        lastCheck: row.lastCheck
      }))
    ];
    
    const allHealthy = services.every(s => s.status === 'healthy');
    const anyWarning = services.some(s => s.status === 'warning');
    
    const health = {
      status: allHealthy ? 'healthy' : (anyWarning ? 'warning' : 'error'),
      services,
      alerts: services
        .filter(s => s.status !== 'healthy')
        .map(s => ({
          service: s.name,
          message: `${s.name} is ${s.status}`,
          severity: s.status === 'error' ? 'critical' : 'warning'
        })),
      lastUpdated: new Date().toISOString()
    };

    logger.info('System health requested');
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Error fetching system health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system health',
      error: error.message
    });
  }
});

// GET /api/monitoring/api-endpoints
router.get('/api-endpoints', async (req, res) => {
  try {
    // Query API endpoints from database
    const query = `
      SELECT 
        id,
        name,
        endpoint_path as "path",
        method,
        status,
        uptime_percentage as "uptime",
        average_response_time as "responseTime",
        last_check_at as "lastCheck",
        error_count as "errorCount",
        total_requests as "totalRequests"
      FROM api_endpoints
      ORDER BY name
    `;
    
    const result = await pool.query(query);
    
    const endpoints = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      path: row.path,
      method: row.method,
      status: row.status,
      uptime: row.uptime || 0,
      responseTime: row.responseTime || 0,
      lastCheck: row.lastCheck,
      errorCount: row.errorCount || 0,
      totalRequests: row.totalRequests || 0
    }));

    logger.info('API endpoints status requested');
    res.json({
      success: true,
      data: endpoints
    });
  } catch (error) {
    logger.error('Error fetching API endpoints:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API endpoints',
      error: error.message
    });
  }
});

// GET /api/monitoring/error-logs
router.get('/error-logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Optional filters
    const level = req.query.level; // error, warning, info
    const service = req.query.service;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    
    // Build WHERE clause based on filters
    const conditions = [];
    const params = [];
    let paramCount = 1;
    
    if (level) {
      conditions.push(`level = $${paramCount}`);
      params.push(level);
      paramCount++;
    }
    
    if (service) {
      conditions.push(`service = $${paramCount}`);
      params.push(service);
      paramCount++;
    }
    
    if (startDate) {
      conditions.push(`timestamp >= $${paramCount}`);
      params.push(startDate);
      paramCount++;
    }
    
    if (endDate) {
      conditions.push(`timestamp <= $${paramCount}`);
      params.push(endDate);
      paramCount++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM system_logs
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    // Get logs with pagination
    const logsQuery = `
      SELECT 
        id,
        timestamp,
        level,
        message,
        service,
        user_id as "userId",
        ip_address as "ip",
        user_agent as "userAgent",
        stack_trace as "stackTrace",
        metadata
      FROM system_logs
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const logsResult = await pool.query(logsQuery, [...params, limit, offset]);
    
    const logs = logsResult.rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      level: row.level,
      message: row.message,
      endpoint: row.service || 'Unknown',
      userId: row.userId,
      ip: row.ip || 'N/A',
      userAgent: row.userAgent || 'N/A',
      stackTrace: row.stackTrace || '',
      metadata: row.metadata || {}
    }));

    logger.info(`Error logs requested - page ${page}, limit ${limit}, filters: ${JSON.stringify({level, service, startDate, endDate})}`);
    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching error logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch error logs',
      error: error.message
    });
  }
});

module.exports = router;
