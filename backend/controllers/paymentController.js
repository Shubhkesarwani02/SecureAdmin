const { asyncHandler } = require('../middleware/errorHandler');
const { auditService } = require('../services/database');

// Mock payment data - replace with real database integration
const mockPaymentData = {
  transactions: [
    {
      id: 'txn_001',
      clientId: 1,
      clientName: 'Premium Fleet Services',
      amount: 2500.00,
      currency: 'USD',
      status: 'completed',
      type: 'subscription',
      plan: 'enterprise',
      paymentMethod: 'stripe',
      transactionId: 'pi_1OxYz123',
      createdAt: new Date('2024-01-15T10:30:00Z'),
      paidAt: new Date('2024-01-15T10:30:15Z'),
      refundable: true,
      refundAmount: 0
    },
    {
      id: 'txn_002',
      clientId: 2,
      clientName: 'Elite Car Rentals',
      amount: 1200.00,
      currency: 'USD',
      status: 'completed',
      type: 'subscription',
      plan: 'professional',
      paymentMethod: 'stripe',
      transactionId: 'pi_2OxYz456',
      createdAt: new Date('2024-01-14T15:45:00Z'),
      paidAt: new Date('2024-01-14T15:45:10Z'),
      refundable: true,
      refundAmount: 0
    },
    {
      id: 'txn_003',
      clientId: 3,
      clientName: 'Coastal Vehicle Co',
      amount: 799.00,
      currency: 'USD',
      status: 'failed',
      type: 'subscription',
      plan: 'standard',
      paymentMethod: 'stripe',
      transactionId: 'pi_3OxYz789',
      createdAt: new Date('2024-01-13T09:20:00Z'),
      paidAt: null,
      refundable: false,
      refundAmount: 0,
      failureReason: 'insufficient_funds'
    },
    {
      id: 'txn_004',
      clientId: 1,
      clientName: 'Premium Fleet Services',
      amount: 500.00,
      currency: 'USD',
      status: 'refunded',
      type: 'overage',
      plan: 'enterprise',
      paymentMethod: 'stripe',
      transactionId: 'pi_4OxYz012',
      createdAt: new Date('2024-01-12T14:30:00Z'),
      paidAt: new Date('2024-01-12T14:30:05Z'),
      refundable: false,
      refundAmount: 500.00,
      refundedAt: new Date('2024-01-13T10:15:00Z'),
      refundReason: 'billing_error'
    }
  ],
  
  integrationCodes: [
    {
      id: 1,
      code: 'FRAMTT_WEBHOOK_2024_001',
      purpose: 'Stripe Webhook Integration',
      type: 'webhook',
      status: 'active',
      createdBy: 1,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      expiresAt: new Date('2025-01-01T00:00:00Z'),
      lastUsed: new Date('2024-01-15T10:30:00Z'),
      usageCount: 247
    },
    {
      id: 2,
      code: 'FRAMTT_API_2024_002',
      purpose: 'Third-party API Access',
      type: 'api_key',
      status: 'active',
      createdBy: 1,
      createdAt: new Date('2024-01-05T00:00:00Z'),
      expiresAt: new Date('2024-12-31T23:59:59Z'),
      lastUsed: new Date('2024-01-14T16:20:00Z'),
      usageCount: 89
    },
    {
      id: 3,
      code: 'FRAMTT_TEST_2024_003',
      purpose: 'Development Testing',
      type: 'test_key',
      status: 'inactive',
      createdBy: 1,
      createdAt: new Date('2024-01-10T00:00:00Z'),
      expiresAt: new Date('2024-02-10T00:00:00Z'),
      lastUsed: new Date('2024-01-11T12:00:00Z'),
      usageCount: 15
    }
  ]
};

// @desc    Get payment reports
// @route   GET /api/payments/reports
// @access  Private (Admin/Superadmin)
const getPaymentReports = asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    status,
    clientId,
    type,
    limit = 50,
    offset = 0
  } = req.query;

  let filteredTransactions = [...mockPaymentData.transactions];

  // Apply filters
  if (startDate) {
    const start = new Date(startDate);
    filteredTransactions = filteredTransactions.filter(txn => 
      new Date(txn.createdAt) >= start
    );
  }

  if (endDate) {
    const end = new Date(endDate);
    filteredTransactions = filteredTransactions.filter(txn => 
      new Date(txn.createdAt) <= end
    );
  }

  if (status && status !== 'all') {
    filteredTransactions = filteredTransactions.filter(txn => txn.status === status);
  }

  if (clientId) {
    filteredTransactions = filteredTransactions.filter(txn => 
      txn.clientId === parseInt(clientId)
    );
  }

  if (type && type !== 'all') {
    filteredTransactions = filteredTransactions.filter(txn => txn.type === type);
  }

  // Apply pagination
  const total = filteredTransactions.length;
  const paginatedTransactions = filteredTransactions
    .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  // Calculate summary stats
  const totalAmount = filteredTransactions.reduce((sum, txn) => 
    txn.status === 'completed' ? sum + txn.amount : sum, 0
  );

  const totalRefunded = filteredTransactions.reduce((sum, txn) => 
    sum + (txn.refundAmount || 0), 0
  );

  const statusCounts = filteredTransactions.reduce((counts, txn) => {
    counts[txn.status] = (counts[txn.status] || 0) + 1;
    return counts;
  }, {});

  res.status(200).json({
    success: true,
    data: {
      transactions: paginatedTransactions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limit))
      },
      summary: {
        totalAmount,
        totalRefunded,
        netRevenue: totalAmount - totalRefunded,
        statusCounts
      }
    }
  });
});

// @desc    Export payment data
// @route   GET /api/payments/export
// @access  Private (Admin/Superadmin)
const exportPaymentData = asyncHandler(async (req, res) => {
  const {
    format = 'csv',
    startDate,
    endDate,
    status
  } = req.query;

  let filteredTransactions = [...mockPaymentData.transactions];

  // Apply date filters
  if (startDate) {
    const start = new Date(startDate);
    filteredTransactions = filteredTransactions.filter(txn => 
      new Date(txn.createdAt) >= start
    );
  }

  if (endDate) {
    const end = new Date(endDate);
    filteredTransactions = filteredTransactions.filter(txn => 
      new Date(txn.createdAt) <= end
    );
  }

  if (status && status !== 'all') {
    filteredTransactions = filteredTransactions.filter(txn => txn.status === status);
  }

  if (format === 'csv') {
    // Generate CSV data
    const headers = [
      'Transaction ID', 'Client Name', 'Amount', 'Currency', 'Status', 
      'Type', 'Plan', 'Payment Method', 'Created At', 'Paid At', 'Refund Amount'
    ];
    
    const csvData = [
      headers.join(','),
      ...filteredTransactions.map(txn => [
        txn.id,
        `"${txn.clientName}"`,
        txn.amount,
        txn.currency,
        txn.status,
        txn.type,
        txn.plan,
        txn.paymentMethod,
        txn.createdAt.toISOString(),
        txn.paidAt ? txn.paidAt.toISOString() : '',
        txn.refundAmount || 0
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="payment-report-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvData);
  } else {
    // Return JSON format
    res.status(200).json({
      success: true,
      data: {
        transactions: filteredTransactions,
        exportedAt: new Date().toISOString(),
        totalRecords: filteredTransactions.length
      }
    });
  }
});

// @desc    Process refund
// @route   POST /api/payments/refund
// @access  Private (Admin/Superadmin)
const processRefund = asyncHandler(async (req, res) => {
  const {
    transactionId,
    amount,
    reason,
    notifyClient = true
  } = req.body;

  const currentUserId = req.user.id;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  // Validate input
  if (!transactionId || !amount || !reason) {
    return res.status(400).json({
      success: false,
      message: 'Transaction ID, amount, and reason are required'
    });
  }

  // Find the transaction
  const transaction = mockPaymentData.transactions.find(txn => txn.id === transactionId);
  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  // Validate refund eligibility
  if (!transaction.refundable || transaction.status !== 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Transaction is not eligible for refund'
    });
  }

  if (amount > transaction.amount - (transaction.refundAmount || 0)) {
    return res.status(400).json({
      success: false,
      message: 'Refund amount exceeds refundable amount'
    });
  }

  try {
    // Process refund (mock implementation)
    const refundId = `rf_${Date.now()}`;
    
    // Update transaction
    transaction.refundAmount = (transaction.refundAmount || 0) + parseFloat(amount);
    if (transaction.refundAmount >= transaction.amount) {
      transaction.status = 'refunded';
    } else {
      transaction.status = 'partially_refunded';
    }
    transaction.refundedAt = new Date();
    transaction.refundReason = reason;

    // Log the refund action
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'PAYMENT_REFUNDED',
      resourceType: 'PAYMENT',
      resourceId: transactionId,
      oldValues: {
        status: 'completed',
        refundAmount: transaction.refundAmount - parseFloat(amount)
      },
      newValues: {
        status: transaction.status,
        refundAmount: transaction.refundAmount,
        refundReason: reason
      },
      ipAddress,
      userAgent
    });

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId,
        transactionId,
        refundAmount: parseFloat(amount),
        remainingRefundable: transaction.amount - transaction.refundAmount,
        status: transaction.status
      }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing refund'
    });
  }
});

// @desc    Get integration codes
// @route   GET /api/payments/integration-codes
// @access  Private (Superadmin)
const getIntegrationCodes = asyncHandler(async (req, res) => {
  const {
    status,
    type,
    limit = 50,
    offset = 0
  } = req.query;

  let filteredCodes = [...mockPaymentData.integrationCodes];

  // Apply filters
  if (status && status !== 'all') {
    filteredCodes = filteredCodes.filter(code => code.status === status);
  }

  if (type && type !== 'all') {
    filteredCodes = filteredCodes.filter(code => code.type === type);
  }

  // Apply pagination
  const total = filteredCodes.length;
  const paginatedCodes = filteredCodes
    .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      integrationCodes: paginatedCodes,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// @desc    Generate integration code
// @route   POST /api/payments/integration-codes
// @access  Private (Superadmin)
const generateIntegrationCode = asyncHandler(async (req, res) => {
  const {
    purpose,
    type,
    expiresIn = 365 // days
  } = req.body;

  const currentUserId = req.user.id;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  // Validate input
  if (!purpose || !type) {
    return res.status(400).json({
      success: false,
      message: 'Purpose and type are required'
    });
  }

  try {
    // Generate new integration code
    const newCode = {
      id: mockPaymentData.integrationCodes.length + 1,
      code: `FRAMTT_${type.toUpperCase()}_${new Date().getFullYear()}_${String(mockPaymentData.integrationCodes.length + 1).padStart(3, '0')}`,
      purpose,
      type,
      status: 'active',
      createdBy: currentUserId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000),
      lastUsed: null,
      usageCount: 0
    };

    // Add to mock data
    mockPaymentData.integrationCodes.push(newCode);

    // Log the creation
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'INTEGRATION_CODE_CREATED',
      resourceType: 'INTEGRATION_CODE',
      resourceId: newCode.id,
      oldValues: null,
      newValues: {
        code: newCode.code,
        purpose: newCode.purpose,
        type: newCode.type
      },
      ipAddress,
      userAgent
    });

    res.status(201).json({
      success: true,
      message: 'Integration code generated successfully',
      data: { integrationCode: newCode }
    });
  } catch (error) {
    console.error('Error generating integration code:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating integration code'
    });
  }
});

// @desc    Delete integration code
// @route   DELETE /api/payments/integration-codes/:id
// @access  Private (Superadmin)
const deleteIntegrationCode = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  // Find the integration code
  const codeIndex = mockPaymentData.integrationCodes.findIndex(code => 
    code.id === parseInt(id)
  );

  if (codeIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Integration code not found'
    });
  }

  const deletedCode = mockPaymentData.integrationCodes[codeIndex];

  try {
    // Remove from mock data
    mockPaymentData.integrationCodes.splice(codeIndex, 1);

    // Log the deletion
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'INTEGRATION_CODE_DELETED',
      resourceType: 'INTEGRATION_CODE',
      resourceId: deletedCode.id,
      oldValues: {
        code: deletedCode.code,
        purpose: deletedCode.purpose,
        status: deletedCode.status
      },
      newValues: null,
      ipAddress,
      userAgent
    });

    res.status(200).json({
      success: true,
      message: 'Integration code deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting integration code:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting integration code'
    });
  }
});

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private (Admin/Superadmin)
const getPaymentStats = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query; // days

  const periodDays = parseInt(period);
  const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
  
  const recentTransactions = mockPaymentData.transactions.filter(txn => 
    new Date(txn.createdAt) >= startDate
  );

  const totalRevenue = recentTransactions
    .filter(txn => txn.status === 'completed')
    .reduce((sum, txn) => sum + txn.amount, 0);

  const totalRefunds = recentTransactions
    .reduce((sum, txn) => sum + (txn.refundAmount || 0), 0);

  const stats = {
    totalTransactions: recentTransactions.length,
    totalRevenue,
    totalRefunds,
    netRevenue: totalRevenue - totalRefunds,
    averageTransactionValue: recentTransactions.length > 0 ? totalRevenue / recentTransactions.length : 0,
    successRate: recentTransactions.length > 0 ? 
      (recentTransactions.filter(txn => txn.status === 'completed').length / recentTransactions.length) * 100 : 0,
    refundRate: totalRevenue > 0 ? (totalRefunds / totalRevenue) * 100 : 0,
    statusBreakdown: recentTransactions.reduce((counts, txn) => {
      counts[txn.status] = (counts[txn.status] || 0) + 1;
      return counts;
    }, {}),
    typeBreakdown: recentTransactions.reduce((counts, txn) => {
      counts[txn.type] = (counts[txn.type] || 0) + 1;
      return counts;
    }, {})
  };

  res.status(200).json({
    success: true,
    data: { stats, period: periodDays }
  });
});

// @desc    Get billing history
// @route   GET /api/payments/billing-history
// @access  Private (Admin/Superadmin)
const getBillingHistory = asyncHandler(async (req, res) => {
  const {
    clientId,
    startDate,
    endDate,
    limit = 50,
    offset = 0
  } = req.query;

  let filteredTransactions = [...mockPaymentData.transactions];

  if (clientId) {
    filteredTransactions = filteredTransactions.filter(txn => 
      txn.clientId === parseInt(clientId)
    );
  }

  if (startDate) {
    const start = new Date(startDate);
    filteredTransactions = filteredTransactions.filter(txn => 
      new Date(txn.createdAt) >= start
    );
  }

  if (endDate) {
    const end = new Date(endDate);
    filteredTransactions = filteredTransactions.filter(txn => 
      new Date(txn.createdAt) <= end
    );
  }

  // Sort by date descending
  filteredTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Apply pagination
  const total = filteredTransactions.length;
  const paginatedTransactions = filteredTransactions
    .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      transactions: paginatedTransactions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// @desc    Get revenue analytics
// @route   GET /api/payments/revenue-analytics
// @access  Private (Admin/Superadmin)
const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const { period = '12' } = req.query; // months

  // Generate monthly revenue data for the specified period
  const monthlyData = [];
  const currentDate = new Date();
  
  for (let i = parseInt(period) - 1; i >= 0; i--) {
    const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
    
    const monthTransactions = mockPaymentData.transactions.filter(txn => {
      const txnDate = new Date(txn.createdAt);
      return txnDate >= month && txnDate < nextMonth && txn.status === 'completed';
    });

    const revenue = monthTransactions.reduce((sum, txn) => sum + txn.amount, 0);
    const refunds = monthTransactions.reduce((sum, txn) => sum + (txn.refundAmount || 0), 0);

    monthlyData.push({
      month: month.toISOString().slice(0, 7), // YYYY-MM format
      revenue,
      refunds,
      netRevenue: revenue - refunds,
      transactionCount: monthTransactions.length
    });
  }

  // Calculate growth rates
  const analyticsData = monthlyData.map((data, index) => {
    if (index === 0) {
      return { ...data, revenueGrowth: 0, transactionGrowth: 0 };
    }
    
    const prevMonth = monthlyData[index - 1];
    const revenueGrowth = prevMonth.revenue > 0 ? 
      ((data.revenue - prevMonth.revenue) / prevMonth.revenue) * 100 : 0;
    const transactionGrowth = prevMonth.transactionCount > 0 ? 
      ((data.transactionCount - prevMonth.transactionCount) / prevMonth.transactionCount) * 100 : 0;
    
    return { ...data, revenueGrowth, transactionGrowth };
  });

  res.status(200).json({
    success: true,
    data: {
      monthlyAnalytics: analyticsData,
      summary: {
        totalRevenue: monthlyData.reduce((sum, data) => sum + data.revenue, 0),
        totalRefunds: monthlyData.reduce((sum, data) => sum + data.refunds, 0),
        totalTransactions: monthlyData.reduce((sum, data) => sum + data.transactionCount, 0),
        averageMonthlyRevenue: monthlyData.reduce((sum, data) => sum + data.revenue, 0) / monthlyData.length
      }
    }
  });
});

module.exports = {
  getPaymentReports,
  exportPaymentData,
  processRefund,
  getIntegrationCodes,
  generateIntegrationCode,
  deleteIntegrationCode,
  getPaymentStats,
  getBillingHistory,
  getRevenueAnalytics
};
