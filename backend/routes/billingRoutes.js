const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const { requireSuperAdmin } = require('../middleware/auth');
const pool = require('../config/database');

// All billing routes require superadmin access
router.use(requireSuperAdmin);

// GET /api/billing/revenue
router.get('/revenue', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '6months';
    
    // Calculate period count based on timeframe
    let periods = 6;
    let intervalType = 'month';
    
    switch (timeframe) {
      case '3months':
        periods = 3;
        break;
      case '12months':
      case '1year':
        periods = 12;
        break;
      default:
        periods = 6;
    }
    
    // Query revenue data from transactions table
    const query = `
      WITH monthly_data AS (
        SELECT 
          TO_CHAR(DATE_TRUNC('month', paid_at), 'Mon YY') as period,
          DATE_TRUNC('month', paid_at) as month_date,
          SUM(amount) as revenue,
          COUNT(*) as subscriptions,
          0 as growth
        FROM transactions
        WHERE status = 'completed'
          AND paid_at IS NOT NULL
          AND paid_at >= NOW() - INTERVAL '${periods} months'
        GROUP BY DATE_TRUNC('month', paid_at)
        ORDER BY month_date ASC
      )
      SELECT 
        period,
        CAST(revenue AS DECIMAL(10,2)) as revenue,
        subscriptions,
        growth
      FROM monthly_data
    `;
    
    const result = await pool.query(query);
    
    // Calculate growth percentage
    const revenueData = result.rows.map((row, index, arr) => {
      if (index > 0) {
        const prevRevenue = parseFloat(arr[index - 1].revenue);
        const currentRevenue = parseFloat(row.revenue);
        const growth = prevRevenue > 0 
          ? (((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)
          : '0.0';
        return { ...row, growth: parseFloat(growth) };
      }
      return { ...row, growth: 0 };
    });
    
    const totalRevenue = revenueData.reduce((sum, item) => sum + parseFloat(item.revenue), 0);
    const averageMonthly = revenueData.length > 0 ? Math.floor(totalRevenue / revenueData.length) : 0;

    logger.info(`Revenue data requested for timeframe: ${timeframe}`);
    res.json({
      success: true,
      data: {
        timeframe,
        revenue: revenueData,
        summary: {
          total: totalRevenue.toFixed(2),
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
    // Query subscription data from clients/accounts and transactions
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT c.id) FILTER (WHERE c.subscription_status = 'active') as active,
        COUNT(DISTINCT c.id) FILTER (WHERE c.subscription_status = 'pending') as pending,
        COUNT(DISTINCT c.id) FILTER (WHERE c.subscription_status = 'cancelled') as cancelled,
        COUNT(DISTINCT c.id) FILTER (WHERE c.subscription_status = 'expired') as expired
      FROM clients c
    `;
    
    const planBreakdownQuery = `
      SELECT 
        COALESCE(c.subscription_plan, 'Basic') as plan,
        COUNT(*) as count,
        SUM(COALESCE(c.subscription_amount, 99)) as revenue
      FROM clients c
      WHERE c.subscription_status = 'active'
      GROUP BY c.subscription_plan
    `;
    
    const churnQuery = `
      SELECT 
        CAST(
          (COUNT(*) FILTER (WHERE subscription_status = 'cancelled' 
            AND updated_at >= NOW() - INTERVAL '30 days') * 100.0 / 
          NULLIF(COUNT(*) FILTER (WHERE subscription_status IN ('active', 'cancelled')), 0))
        AS DECIMAL(5,1)) as churn_rate
      FROM clients
    `;
    
    const signupsQuery = `
      SELECT COUNT(*) as recent_signups
      FROM clients
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `;
    
    const [statsResult, planResult, churnResult, signupsResult] = await Promise.all([
      pool.query(statsQuery),
      pool.query(planBreakdownQuery),
      pool.query(churnQuery),
      pool.query(signupsQuery)
    ]);
    
    const subscriptions = {
      active: parseInt(statsResult.rows[0]?.active || 0),
      pending: parseInt(statsResult.rows[0]?.pending || 0),
      cancelled: parseInt(statsResult.rows[0]?.cancelled || 0),
      expired: parseInt(statsResult.rows[0]?.expired || 0),
      planBreakdown: planResult.rows.map(row => ({
        plan: row.plan,
        count: parseInt(row.count),
        revenue: parseFloat(row.revenue || 0)
      })),
      churnRate: parseFloat(churnResult.rows[0]?.churn_rate || 0).toFixed(1),
      recentSignups: parseInt(signupsResult.rows[0]?.recent_signups || 0)
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
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    // Build query with filters
    let whereConditions = ['1=1'];
    const queryParams = [];
    let paramCount = 1;
    
    if (status) {
      whereConditions.push(`t.status = $${paramCount}`);
      queryParams.push(status);
      paramCount++;
    }
    
    if (startDate) {
      whereConditions.push(`t.created_at >= $${paramCount}`);
      queryParams.push(startDate);
      paramCount++;
    }
    
    if (endDate) {
      whereConditions.push(`t.created_at <= $${paramCount}`);
      queryParams.push(endDate);
      paramCount++;
    }

    const query = `
      SELECT 
        t.id,
        t.transaction_id,
        COALESCE(c.company_name, a.company_name, 'Unknown') as client_name,
        t.amount,
        t.currency,
        t.status,
        t.plan_type as plan,
        t.payment_method,
        t.paid_at as date,
        t.created_at
      FROM transactions t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY t.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    queryParams.push(limit, offset);
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactions t
      WHERE ${whereConditions.join(' AND ')}
    `;
    
    const [result, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
    ]);
    
    const transactions = result.rows.map(row => ({
      id: row.transaction_id,
      clientId: row.client_id,
      clientName: row.client_name,
      amount: `$${parseFloat(row.amount).toFixed(2)}`,
      currency: row.currency,
      status: row.status,
      plan: row.plan || 'Basic',
      date: row.date || row.created_at,
      paymentMethod: row.payment_method || 'Credit Card',
      transactionId: row.transaction_id
    }));
    
    const total = parseInt(countResult.rows[0]?.total || 0);

    logger.info(`Transaction data requested - page ${page}, limit ${limit}`);
    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
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
    // Query upcoming renewals from subscription_renewals table
    const query = `
      SELECT 
        sr.id,
        COALESCE(c.company_name, a.company_name, 'Unknown') as company_name,
        c.id as client_id,
        sr.plan_type as plan,
        sr.amount,
        sr.currency,
        sr.renewal_date,
        sr.status,
        sr.auto_renewal,
        EXTRACT(DAY FROM (sr.renewal_date - NOW())) as days_until
      FROM subscription_renewals sr
      LEFT JOIN clients c ON sr.client_id = c.id
      LEFT JOIN accounts a ON sr.account_id = a.id
      WHERE sr.renewal_date >= NOW()
        AND sr.status IN ('upcoming', 'at_risk', 'confirmed')
      ORDER BY sr.renewal_date ASC
      LIMIT 20
    `;
    
    const result = await pool.query(query);
    
    const renewals = result.rows.map(row => ({
      id: `renewal_${row.id}`,
      clientId: row.client_id,
      clientName: row.company_name,
      plan: row.plan,
      amount: `$${parseFloat(row.amount).toFixed(2)}`,
      currency: row.currency,
      renewalDate: row.renewal_date,
      status: row.status,
      autoRenewal: row.auto_renewal,
      daysUntil: Math.ceil(row.days_until)
    }));

    logger.info('Renewal data requested');
    res.json({
      success: true,
      data: renewals
    });
  } catch (error) {
    logger.error('Error fetching renewal data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch renewal data',
      error: error.message
    });
  }
});

// GET /api/billing/failed-payments
router.get('/failed-payments', async (req, res) => {
  try {
    // Query failed payments from failed_payments table
    const query = `
      SELECT 
        fp.id,
        COALESCE(c.company_name, a.company_name, 'Unknown') as company_name,
        c.id as client_id,
        fp.amount,
        fp.currency,
        fp.reason,
        fp.attempt_count as attempts,
        fp.last_attempt_at as attempt_date,
        fp.next_attempt_at as next_attempt,
        fp.created_at as date
      FROM failed_payments fp
      LEFT JOIN clients c ON fp.client_id = c.id
      LEFT JOIN accounts a ON fp.account_id = a.id
      WHERE fp.resolved = false
      ORDER BY fp.last_attempt_at DESC
      LIMIT 20
    `;
    
    const result = await pool.query(query);
    
    const failedPayments = result.rows.map(row => ({
      id: `FP${String(row.id).padStart(3, '0')}`,
      company: row.company_name,
      amount: `$${parseFloat(row.amount).toFixed(2)}`,
      reason: row.reason,
      date: row.date,
      attempts: row.attempts,
      attemptDate: row.attempt_date,
      nextAttempt: row.next_attempt
    }));

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
