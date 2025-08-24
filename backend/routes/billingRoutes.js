const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const { requireSuperAdmin } = require('../middleware/auth');

// All billing routes require superadmin access
router.use(requireSuperAdmin);

// GET /api/billing/revenue
router.get('/revenue', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '6months';
    
    // Mock revenue data based on timeframe
    const generateRevenueData = (period) => {
      const data = [];
      const now = new Date();
      let periods = 6;
      let periodName = 'month';
      
      switch (period) {
        case '3months':
          periods = 3;
          break;
        case '12months':
          periods = 12;
          break;
        case '1year':
          periods = 12;
          break;
        default:
          periods = 6;
      }
      
      for (let i = periods - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const revenue = Math.floor(Math.random() * 50000) + 25000; // $25k-$75k
        
        data.push({
          period: monthName,
          revenue,
          subscriptions: Math.floor(revenue / 100), // Approximate subscription count
          growth: ((Math.random() - 0.5) * 20).toFixed(1) // -10% to +10%
        });
      }
      
      return data;
    };

    const revenueData = generateRevenueData(timeframe);
    const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
    const averageMonthly = Math.floor(totalRevenue / revenueData.length);

    logger.info(`Revenue data requested for timeframe: ${timeframe}`);
    res.json({
      success: true,
      data: {
        timeframe,
        revenue: revenueData,
        summary: {
          total: totalRevenue,
          average: averageMonthly,
          currency: 'USD'
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching revenue data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue data',
      error: error.message
    });
  }
});

// GET /api/billing/subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    // Mock subscription data
    const subscriptions = {
      active: Math.floor(Math.random() * 500) + 200,
      pending: Math.floor(Math.random() * 50) + 10,
      cancelled: Math.floor(Math.random() * 30) + 5,
      expired: Math.floor(Math.random() * 20) + 2,
      planBreakdown: [
        {
          plan: 'Basic',
          count: Math.floor(Math.random() * 150) + 50,
          revenue: Math.floor(Math.random() * 15000) + 5000
        },
        {
          plan: 'Professional',
          count: Math.floor(Math.random() * 200) + 100,
          revenue: Math.floor(Math.random() * 40000) + 20000
        },
        {
          plan: 'Enterprise',
          count: Math.floor(Math.random() * 100) + 30,
          revenue: Math.floor(Math.random() * 30000) + 15000
        }
      ],
      churnRate: (Math.random() * 5 + 2).toFixed(1), // 2-7%
      recentSignups: Math.floor(Math.random() * 20) + 5
    };

    logger.info('Subscription data requested');
    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    logger.error('Error fetching subscription data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription data',
      error: error.message
    });
  }
});

// GET /api/billing/transactions
router.get('/transactions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Mock transaction data
    const transactions = [];
    const statuses = ['completed', 'pending', 'failed', 'refunded'];
    const plans = ['Basic', 'Professional', 'Enterprise'];
    
    for (let i = 0; i < limit; i++) {
      const randomDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const plan = plans[Math.floor(Math.random() * plans.length)];
      const baseAmount = plan === 'Basic' ? 29 : plan === 'Professional' ? 99 : 199;
      
      transactions.push({
        id: `txn_${Date.now()}_${i}`,
        clientId: `client_${Math.floor(Math.random() * 1000)}`,
        clientName: `Company ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
        amount: baseAmount + Math.floor(Math.random() * 50),
        currency: 'USD',
        status: statuses[Math.floor(Math.random() * statuses.length)],
        plan,
        date: randomDate.toISOString(),
        paymentMethod: 'Credit Card',
        transactionId: `stripe_${Math.random().toString(36).substr(2, 9)}`
      });
    }

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    logger.info(`Transaction data requested - page ${page}, limit ${limit}`);
    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total: 500, // Mock total count
          pages: Math.ceil(500 / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching transaction data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction data',
      error: error.message
    });
  }
});

// GET /api/billing/renewals
router.get('/renewals', async (req, res) => {
  try {
    // Mock upcoming renewals data
    const renewals = [];
    
    for (let i = 0; i < 15; i++) {
      const futureDate = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000); // Next 30 days
      const plans = ['Basic', 'Professional', 'Enterprise'];
      const plan = plans[Math.floor(Math.random() * plans.length)];
      const baseAmount = plan === 'Basic' ? 29 : plan === 'Professional' ? 99 : 199;
      
      renewals.push({
        id: `renewal_${Date.now()}_${i}`,
        clientId: `client_${Math.floor(Math.random() * 1000)}`,
        clientName: `Company ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
        plan,
        amount: baseAmount,
        currency: 'USD',
        renewalDate: futureDate.toISOString(),
        status: Math.random() > 0.8 ? 'at_risk' : 'confirmed',
        autoRenewal: Math.random() > 0.2
      });
    }

    // Sort by renewal date ascending
    renewals.sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));

    logger.info('Upcoming renewals requested');
    res.json({
      success: true,
      data: renewals
    });
  } catch (error) {
    logger.error('Error fetching renewals data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch renewals data',
      error: error.message
    });
  }
});

// GET /api/billing/failed-payments
router.get('/failed-payments', async (req, res) => {
  try {
    // Mock failed payments data
    const failedPayments = [];
    const reasons = [
      'Insufficient funds',
      'Card expired',
      'Payment declined',
      'Invalid card number',
      'Card blocked'
    ];
    
    for (let i = 0; i < 8; i++) {
      const failureDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Last 7 days
      const plans = ['Basic', 'Professional', 'Enterprise'];
      const plan = plans[Math.floor(Math.random() * plans.length)];
      const baseAmount = plan === 'Basic' ? 29 : plan === 'Professional' ? 99 : 199;
      
      failedPayments.push({
        id: `failed_${Date.now()}_${i}`,
        clientId: `client_${Math.floor(Math.random() * 1000)}`,
        clientName: `Company ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
        amount: baseAmount,
        currency: 'USD',
        plan,
        failureDate: failureDate.toISOString(),
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        retryAttempts: Math.floor(Math.random() * 3) + 1,
        nextRetry: new Date(failureDate.getTime() + 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Sort by failure date descending
    failedPayments.sort((a, b) => new Date(b.failureDate) - new Date(a.failureDate));

    logger.info('Failed payments requested');
    res.json({
      success: true,
      data: failedPayments
    });
  } catch (error) {
    logger.error('Error fetching failed payments data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch failed payments data',
      error: error.message
    });
  }
});

module.exports = router;
