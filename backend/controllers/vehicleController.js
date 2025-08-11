const { vehicles, clients } = require('../data/mockData');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Private (Superadmin)
const getVehicles = asyncHandler(async (req, res) => {
  const { 
    status, 
    clientId,
    category,
    search, 
    page = 1, 
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  let filteredVehicles = [...vehicles];

  // Apply filters
  if (status && status !== 'all') {
    filteredVehicles = filteredVehicles.filter(vehicle => vehicle.status === status);
  }

  if (clientId && clientId !== 'all') {
    filteredVehicles = filteredVehicles.filter(vehicle => vehicle.clientId === parseInt(clientId));
  }

  if (category && category !== 'all') {
    filteredVehicles = filteredVehicles.filter(vehicle => vehicle.category === category);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filteredVehicles = filteredVehicles.filter(vehicle => 
      vehicle.make.toLowerCase().includes(searchLower) ||
      vehicle.model.toLowerCase().includes(searchLower) ||
      vehicle.licensePlate.toLowerCase().includes(searchLower) ||
      vehicle.vin.toLowerCase().includes(searchLower)
    );
  }

  // Add client information to each vehicle
  const vehiclesWithClientInfo = filteredVehicles.map(vehicle => {
    const client = clients.find(c => c.id === vehicle.clientId);
    return {
      ...vehicle,
      clientName: client ? client.companyName : 'Unknown Client'
    };
  });

  // Apply sorting
  vehiclesWithClientInfo.sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (sortOrder === 'desc') {
      return bVal > aVal ? 1 : -1;
    } else {
      return aVal > bVal ? 1 : -1;
    }
  });

  // Apply pagination
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedVehicles = vehiclesWithClientInfo.slice(startIndex, endIndex);

  const totalVehicles = vehiclesWithClientInfo.length;
  const totalPages = Math.ceil(totalVehicles / parseInt(limit));

  res.status(200).json({
    success: true,
    data: paginatedVehicles,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: totalVehicles,
      hasNext: endIndex < totalVehicles,
      hasPrev: startIndex > 0
    },
    filters: {
      status: status || 'all',
      clientId: clientId || 'all',
      category: category || 'all',
      search: search || ''
    }
  });
});

// @desc    Get single vehicle
// @route   GET /api/vehicles/:id
// @access  Private (Superadmin)
const getVehicle = asyncHandler(async (req, res) => {
  const vehicle = vehicles.find(v => v.id === parseInt(req.params.id));
  
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  // Add client information
  const client = clients.find(c => c.id === vehicle.clientId);
  const vehicleWithDetails = {
    ...vehicle,
    clientName: client ? client.companyName : 'Unknown Client',
    clientEmail: client ? client.email : null,
    maintenanceHistory: [
      {
        id: 1,
        type: 'Oil Change',
        date: '2024-12-15',
        cost: 45.00,
        description: 'Regular maintenance - oil and filter change'
      },
      {
        id: 2,
        type: 'Tire Rotation',
        date: '2024-11-20',
        cost: 25.00,
        description: 'Tire rotation and pressure check'
      }
    ],
    bookingHistory: [
      {
        id: 1001,
        startDate: '2025-01-08',
        endDate: '2025-01-12',
        customer: 'John Doe',
        status: 'active',
        revenue: 260
      },
      {
        id: 1002,
        startDate: '2025-01-03',
        endDate: '2025-01-07',
        customer: 'Jane Smith',
        status: 'completed',
        revenue: 325
      }
    ]
  };

  res.status(200).json({
    success: true,
    data: vehicleWithDetails
  });
});

// @desc    Create new vehicle
// @route   POST /api/vehicles
// @access  Private (Superadmin)
const createVehicle = asyncHandler(async (req, res) => {
  const { 
    clientId,
    make, 
    model, 
    year,
    licensePlate,
    vin,
    category,
    dailyRate,
    location
  } = req.body;

  // Validate required fields
  if (!clientId || !make || !model || !year || !licensePlate || !vin) {
    return res.status(400).json({
      success: false,
      message: 'Client ID, make, model, year, license plate, and VIN are required'
    });
  }

  // Check if client exists
  const client = clients.find(c => c.id === parseInt(clientId));
  if (!client) {
    return res.status(400).json({
      success: false,
      message: 'Client not found'
    });
  }

  // Check if license plate already exists
  const existingVehicle = vehicles.find(v => 
    v.licensePlate.toLowerCase() === licensePlate.toLowerCase()
  );
  if (existingVehicle) {
    return res.status(400).json({
      success: false,
      message: 'Vehicle with this license plate already exists'
    });
  }

  // Create new vehicle
  const newVehicle = {
    id: Math.max(...vehicles.map(v => v.id)) + 1,
    clientId: parseInt(clientId),
    make,
    model,
    year: parseInt(year),
    licensePlate,
    vin,
    status: 'available',
    category: category || 'sedan',
    dailyRate: parseFloat(dailyRate) || 50,
    currentBooking: null,
    totalBookings: 0,
    totalRevenue: 0,
    location: location || 'Not specified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Add to vehicles array
  vehicles.push(newVehicle);

  // Add client name for response
  const vehicleWithClientName = {
    ...newVehicle,
    clientName: client.companyName
  };

  res.status(201).json({
    success: true,
    message: 'Vehicle created successfully',
    data: vehicleWithClientName
  });
});

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
// @access  Private (Superadmin)
const updateVehicle = asyncHandler(async (req, res) => {
  const vehicleIndex = vehicles.findIndex(v => v.id === parseInt(req.params.id));
  
  if (vehicleIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  const allowedUpdates = [
    'make', 'model', 'year', 'licensePlate', 'vin', 
    'status', 'category', 'dailyRate', 'location'
  ];
  const updates = {};

  // Filter only allowed updates
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // Check if license plate is being updated and already exists
  if (updates.licensePlate) {
    const existingVehicle = vehicles.find((v, index) => 
      index !== vehicleIndex && 
      v.licensePlate.toLowerCase() === updates.licensePlate.toLowerCase()
    );
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle with this license plate already exists'
      });
    }
  }

  // Update vehicle
  vehicles[vehicleIndex] = {
    ...vehicles[vehicleIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Add client name
  const client = clients.find(c => c.id === vehicles[vehicleIndex].clientId);
  const updatedVehicle = {
    ...vehicles[vehicleIndex],
    clientName: client ? client.companyName : 'Unknown Client'
  };

  res.status(200).json({
    success: true,
    message: 'Vehicle updated successfully',
    data: updatedVehicle
  });
});

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private (Superadmin)
const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicleIndex = vehicles.findIndex(v => v.id === parseInt(req.params.id));
  
  if (vehicleIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  // Check if vehicle has active booking
  if (vehicles[vehicleIndex].currentBooking) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete vehicle with active booking'
    });
  }

  // Remove vehicle from array
  vehicles.splice(vehicleIndex, 1);

  res.status(200).json({
    success: true,
    message: 'Vehicle deleted successfully'
  });
});

// @desc    Get vehicle statistics
// @route   GET /api/vehicles/stats
// @access  Private (Superadmin)
const getVehicleStats = asyncHandler(async (req, res) => {
  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'available').length,
    active: vehicles.filter(v => v.status === 'active').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    byCategory: {
      sedan: vehicles.filter(v => v.category === 'sedan').length,
      suv: vehicles.filter(v => v.category === 'suv').length,
      luxury: vehicles.filter(v => v.category === 'luxury').length,
      economy: vehicles.filter(v => v.category === 'economy').length
    },
    revenue: {
      total: vehicles.reduce((sum, vehicle) => sum + vehicle.totalRevenue, 0),
      average: vehicles.length > 0 
        ? vehicles.reduce((sum, vehicle) => sum + vehicle.totalRevenue, 0) / vehicles.length 
        : 0
    },
    utilization: {
      total: vehicles.reduce((sum, vehicle) => sum + vehicle.totalBookings, 0),
      average: vehicles.length > 0 
        ? vehicles.reduce((sum, vehicle) => sum + vehicle.totalBookings, 0) / vehicles.length 
        : 0
    }
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

module.exports = {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleStats
};