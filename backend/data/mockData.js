const moment = require('moment');

// Mock Users Data
const users = [
  {
    id: 1,
    fullName: "John Anderson",
    email: "superadmin@framtt.com",
    phone: "+1 (555) 123-4567",
    role: "superadmin",
    department: "Engineering",
    status: "active",
    avatar: null,
    bio: "Senior administrator managing the Framtt platform with over 5 years of experience in rental management systems.",
    createdAt: "2023-01-15T00:00:00.000Z",
    lastLogin: "2025-01-08T10:30:00.000Z",
    permissions: ["all"],
    preferences: {
      emailNotifications: true,
      pushNotifications: false,
      weeklyReports: true,
      marketingEmails: false,
      twoFactorAuth: true,
      sessionTimeout: "8",
      language: "en",
      timezone: "America/New_York",
      theme: "light"
    }
  },
  {
    id: 25,
    fullName: "Sarah Johnson",
    email: "admin@framtt.com",
    phone: "+1 (555) 234-5678",
    role: "admin",
    department: "Operations",
    status: "active",
    avatar: null,
    bio: "Operations manager overseeing client relationships and system operations.",
    createdAt: "2023-03-20T00:00:00.000Z",
    lastLogin: "2025-01-07T14:20:00.000Z",
    permissions: ["users", "clients", "monitoring"],
    preferences: {
      emailNotifications: true,
      pushNotifications: true,
      weeklyReports: true,
      marketingEmails: true,
      twoFactorAuth: false,
      sessionTimeout: "4",
      language: "en",
      timezone: "America/New_York",
      theme: "light"
    }
  },
  {
    id: 26,
    fullName: "Sarah Wilson",
    email: "csm1@framtt.com",
    phone: "+1 (555) 345-6789",
    role: "csm",
    department: "Customer Success",
    status: "active",
    avatar: null,
    bio: "Customer Success Manager handling assigned accounts and ensuring client satisfaction.",
    createdAt: "2023-06-10T00:00:00.000Z",
    lastLogin: "2025-01-07T16:45:00.000Z",
    permissions: ["assigned_accounts"],
    preferences: {
      emailNotifications: true,
      pushNotifications: true,
      weeklyReports: false,
      marketingEmails: false,
      twoFactorAuth: false,
      sessionTimeout: "6",
      language: "en",
      timezone: "America/New_York",
      theme: "light"
    }
  },
  {
    id: 27,
    fullName: "Mike Johnson",
    email: "user2@framtt.com",
    phone: "+1 (555) 456-7890",
    role: "user",
    department: "General",
    status: "active",
    avatar: null,
    bio: "Regular platform user focusing on daily operations.",
    createdAt: "2023-08-15T00:00:00.000Z",
    lastLogin: "2025-01-06T09:30:00.000Z",
    permissions: ["read_own"],
    preferences: {
      emailNotifications: true,
      pushNotifications: false,
      weeklyReports: false,
      marketingEmails: true,
      twoFactorAuth: false,
      sessionTimeout: "4",
      language: "en",
      timezone: "America/New_York",
      theme: "dark"
    }
  },
  {
    id: 28,
    fullName: "John Smith",
    email: "user1@framtt.com",
    phone: "+1 (555) 567-8901",
    role: "user",
    department: "General",
    status: "active",
    avatar: null,
    bio: "Regular platform user with access to assigned account data.",
    createdAt: "2023-09-20T00:00:00.000Z",
    lastLogin: "2025-01-05T11:15:00.000Z",
    permissions: ["read_own"],
    preferences: {
      emailNotifications: false,
      pushNotifications: true,
      weeklyReports: false,
      marketingEmails: false,
      twoFactorAuth: false,
      sessionTimeout: "2",
      language: "en",
      timezone: "America/New_York",
      theme: "light"
    }
  }
];

// Mock Clients Data (Rental Companies)
const clients = [
  {
    id: 1,
    companyName: "Elite Car Rentals",
    email: "admin@elitecarrentals.com",
    phone: "+1 (555) 111-2222",
    status: "active",
    createdAt: "2024-01-15T00:00:00.000Z",
    lastLogin: "2025-01-05T00:00:00.000Z",
    address: "123 Business District, New York, NY 10001",
    integrationCode: "EC789",
    subscription: {
      plan: "enterprise",
      status: "active",
      nextBilling: "2025-02-15T00:00:00.000Z",
      amount: 299
    },
    integrations: {
      aiRecommendation: true,
      whatsapp: true,
      tracking: true,
      marketing: false
    },
    stats: {
      totalBookings: 1247,
      activeVehicles: 45,
      monthlyRevenue: 28500
    }
  },
  {
    id: 2,
    companyName: "Swift Vehicle Solutions",
    email: "contact@swiftvehicle.com",
    phone: "+1 (555) 222-3333",
    status: "active",
    createdAt: "2024-02-22T00:00:00.000Z",
    lastLogin: "2025-01-04T00:00:00.000Z",
    address: "456 Commerce Ave, Los Angeles, CA 90001",
    integrationCode: "SV456",
    subscription: {
      plan: "professional",
      status: "active",
      nextBilling: "2025-02-22T00:00:00.000Z",
      amount: 199
    },
    integrations: {
      aiRecommendation: false,
      whatsapp: true,
      tracking: true,
      marketing: true
    },
    stats: {
      totalBookings: 892,
      activeVehicles: 32,
      monthlyRevenue: 19800
    }
  },
  {
    id: 3,
    companyName: "Urban Mobility Co",
    email: "info@urbanmobility.com",
    phone: "+1 (555) 333-4444",
    status: "inactive",
    createdAt: "2024-01-08T00:00:00.000Z",
    lastLogin: "2024-12-20T00:00:00.000Z",
    address: "789 Downtown Street, Chicago, IL 60601",
    integrationCode: "UM123",
    subscription: {
      plan: "basic",
      status: "cancelled",
      nextBilling: null,
      amount: 99
    },
    integrations: {
      aiRecommendation: false,
      whatsapp: false,
      tracking: true,
      marketing: false
    },
    stats: {
      totalBookings: 234,
      activeVehicles: 8,
      monthlyRevenue: 0
    }
  },
  {
    id: 4,
    companyName: "Premium Fleet Services",
    email: "support@premiumfleet.com",
    phone: "+1 (555) 444-5555",
    status: "active",
    createdAt: "2024-03-10T00:00:00.000Z",
    lastLogin: "2025-01-06T00:00:00.000Z",
    address: "321 Executive Plaza, Miami, FL 33101",
    integrationCode: "PF654",
    subscription: {
      plan: "enterprise",
      status: "active",
      nextBilling: "2025-02-10T00:00:00.000Z",
      amount: 299
    },
    integrations: {
      aiRecommendation: true,
      whatsapp: true,
      tracking: true,
      marketing: true
    },
    stats: {
      totalBookings: 1567,
      activeVehicles: 67,
      monthlyRevenue: 35400
    }
  },
  {
    id: 5,
    companyName: "City Drive Rentals",
    email: "hello@citydriverentals.com",
    phone: "+1 (555) 555-6666",
    status: "pending",
    createdAt: "2025-01-02T00:00:00.000Z",
    lastLogin: null,
    address: "654 Metropolitan Way, Seattle, WA 98101",
    integrationCode: "CD321",
    subscription: {
      plan: "basic",
      status: "trial",
      nextBilling: "2025-02-02T00:00:00.000Z",
      amount: 99
    },
    integrations: {
      aiRecommendation: true,
      whatsapp: false,
      tracking: false,
      marketing: false
    },
    stats: {
      totalBookings: 0,
      activeVehicles: 0,
      monthlyRevenue: 0
    }
  }
];

// Mock Vehicles Data
const vehicles = [
  {
    id: 1,
    clientId: 1,
    make: "Toyota",
    model: "Camry",
    year: 2023,
    licensePlate: "NYC-2023",
    vin: "1HGBH41JXMN109186",
    status: "active",
    category: "sedan",
    dailyRate: 65,
    currentBooking: {
      id: 1001,
      startDate: "2025-01-08",
      endDate: "2025-01-12",
      customer: "John Doe"
    },
    totalBookings: 45,
    totalRevenue: 12750,
    location: "New York Downtown",
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2025-01-08T00:00:00.000Z"
  },
  {
    id: 2,
    clientId: 1,
    make: "Honda",
    model: "Accord",
    year: 2022,
    licensePlate: "NYC-2024",
    vin: "1HGCV1F3XLA123456",
    status: "available",
    category: "sedan",
    dailyRate: 70,
    currentBooking: null,
    totalBookings: 38,
    totalRevenue: 9800,
    location: "New York Midtown",
    createdAt: "2024-01-20T00:00:00.000Z",
    updatedAt: "2025-01-07T00:00:00.000Z"
  },
  {
    id: 3,
    clientId: 2,
    make: "BMW",
    model: "X5",
    year: 2023,
    licensePlate: "LAX-3001",
    vin: "5UXCR6C5XK1234567",
    status: "maintenance",
    category: "suv",
    dailyRate: 120,
    currentBooking: null,
    totalBookings: 62,
    totalRevenue: 28400,
    location: "Los Angeles Airport",
    createdAt: "2024-02-22T00:00:00.000Z",
    updatedAt: "2025-01-06T00:00:00.000Z"
  }
];

// Mock Notifications
const notifications = [
  {
    id: 1,
    title: "New client registration",
    description: "Premium Fleet Services completed KYC verification",
    type: "info",
    priority: "medium",
    read: false,
    createdAt: moment().subtract(2, 'minutes').toISOString(),
    userId: null, // Global notification
    actionRequired: false
  },
  {
    id: 2,
    title: "Payment processed",
    description: "Monthly subscription payment received from Elite Car Rentals",
    type: "success",
    priority: "low",
    read: false,
    createdAt: moment().subtract(1, 'hour').toISOString(),
    userId: null,
    actionRequired: false
  },
  {
    id: 3,
    title: "System maintenance scheduled",
    description: "Database maintenance planned for tonight at 2:00 AM",
    type: "warning",
    priority: "high",
    read: true,
    createdAt: moment().subtract(3, 'hours').toISOString(),
    userId: null,
    actionRequired: true
  },
  {
    id: 4,
    title: "High API usage detected",
    description: "Swift Vehicle Solutions has exceeded 80% of their API limit",
    type: "warning",
    priority: "medium",
    read: false,
    createdAt: moment().subtract(6, 'hours').toISOString(),
    userId: null,
    actionRequired: true
  },
  {
    id: 5,
    title: "New feature deployed",
    description: "AI recommendation engine v2.0 has been successfully deployed",
    type: "success",
    priority: "low",
    read: true,
    createdAt: moment().subtract(1, 'day').toISOString(),
    userId: null,
    actionRequired: false
  }
];

// Mock Dashboard Metrics
const dashboardMetrics = {
  overview: {
    totalCompanies: clients.length,
    activeCompanies: clients.filter(c => c.status === 'active').length,
    totalUsers: users.length,
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter(v => v.status === 'active').length,
    totalRevenue: clients.reduce((sum, client) => sum + client.stats.monthlyRevenue, 0),
    monthlyGrowth: {
      companies: 12.5,
      revenue: 8.7,
      bookings: 15.2
    }
  },
  systemHealth: {
    apiStatus: "operational",
    databaseStatus: "operational",
    uptime: "99.9%",
    responseTime: "145ms",
    errorRate: "0.02%"
  },
  recentActivity: [
    {
      id: 1,
      type: "client_registered",
      message: "New client registration: Premium Fleet Services",
      timestamp: moment().subtract(2, 'hours').toISOString()
    },
    {
      id: 2,
      type: "payment_received",
      message: "Payment received from Elite Car Rentals: $299",
      timestamp: moment().subtract(4, 'hours').toISOString()
    },
    {
      id: 3,
      type: "system_maintenance",
      message: "System maintenance completed successfully",
      timestamp: moment().subtract(1, 'day').toISOString()
    }
  ]
};

// Mock Integration Codes
const integrationCodes = [
  {
    id: 1,
    code: "EC789",
    clientId: 1,
    clientName: "Elite Car Rentals",
    status: "active",
    createdAt: "2024-01-15T00:00:00.000Z",
    lastUsed: "2025-01-08T10:30:00.000Z",
    usageCount: 1247
  },
  {
    id: 2,
    code: "SV456",
    clientId: 2,
    clientName: "Swift Vehicle Solutions",
    status: "active",
    createdAt: "2024-02-22T00:00:00.000Z",
    lastUsed: "2025-01-07T15:45:00.000Z",
    usageCount: 892
  },
  {
    id: 3,
    code: "UM123",
    clientId: 3,
    clientName: "Urban Mobility Co",
    status: "inactive",
    createdAt: "2024-01-08T00:00:00.000Z",
    lastUsed: "2024-12-20T08:20:00.000Z",
    usageCount: 234
  }
];

module.exports = {
  users,
  clients,
  vehicles,
  notifications,
  dashboardMetrics,
  integrationCodes
};