const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { logger } = require('../utils/logger');
const { requireSuperAdmin } = require('../middleware/auth');

// All snippets routes require superadmin access
router.use(requireSuperAdmin);

// GET /api/snippets
router.get('/', async (req, res) => {
  try {
    const { category, type, language, search } = req.query;
    
    // Build WHERE clause based on filters
    const conditions = ['is_active = true'];
    const params = [];
    let paramCount = 1;
    
    if (category) {
      conditions.push(`category = $${paramCount}`);
      params.push(category);
      paramCount++;
    }
    
    if (type) {
      conditions.push(`type = $${paramCount}`);
      params.push(type);
      paramCount++;
    }
    
    if (language) {
      conditions.push(`language = $${paramCount}`);
      params.push(language);
      paramCount++;
    }
    
    if (search) {
      conditions.push(`(name ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Query snippets from database
    const query = `
      SELECT 
        snippet_id as "id",
        name,
        type,
        category,
        description,
        language,
        code,
        integrations,
        version,
        downloads,
        rating,
        documentation_url as "documentation",
        updated_at as "lastUpdated"
      FROM snippets
      ${whereClause}
      ORDER BY downloads DESC, rating DESC
    `;
    
    const result = await pool.query(query, params);
    
    const snippets = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      category: row.category,
      description: row.description,
      language: row.language,
      code: row.code,
      integrations: row.integrations || [],
      version: row.version,
      lastUpdated: row.lastUpdated,
      downloads: row.downloads || 0,
      rating: parseFloat(row.rating) || 0,
      documentation: row.documentation
    }));

    logger.info(`Snippets retrieved: ${snippets.length} snippets`);
    res.json({
      success: true,
      data: snippets
    });
  } catch (error) {
    logger.error('Error fetching snippets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch snippets',
      error: error.message
    });
  }
});

// GET /api/snippets/stats
router.get('/stats', async (req, res) => {
  try {
    // Query snippet statistics from database
    const query = `
      SELECT 
        COUNT(*) as total_snippets,
        COUNT(DISTINCT category) as categories,
        SUM(downloads) as total_downloads,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating >= 4.5 THEN 1 END) as highly_rated
      FROM snippets
      WHERE is_active = true
    `;
    
    const result = await pool.query(query);
    const row = result.rows[0];
    
    // Get category breakdown
    const categoryQuery = `
      SELECT 
        category,
        COUNT(*) as count,
        AVG(rating) as avg_rating,
        SUM(downloads) as total_downloads
      FROM snippets
      WHERE is_active = true
      GROUP BY category
      ORDER BY count DESC
    `;
    
    const categoryResult = await pool.query(categoryQuery);
    
    const stats = {
      totalSnippets: parseInt(row.total_snippets) || 0,
      categories: parseInt(row.categories) || 0,
      totalDownloads: parseInt(row.total_downloads) || 0,
      averageRating: parseFloat(row.average_rating) || 0,
      highlyRated: parseInt(row.highly_rated) || 0,
      categoryBreakdown: categoryResult.rows.map(cat => ({
        category: cat.category,
        count: parseInt(cat.count),
        avgRating: parseFloat(cat.avg_rating) || 0,
        totalDownloads: parseInt(cat.total_downloads) || 0
      }))
    };

    logger.info('Snippet stats retrieved');
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching snippet stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch snippet stats',
      error: error.message
    });
  }
});

// POST /api/snippets
router.post('/', async (req, res) => {
  try {
    const {
      snippet_id,
      name,
      type,
      category,
      description,
      language,
      code,
      integrations,
      version,
      documentation_url
    } = req.body;
    
    // Validate required fields
    if (!snippet_id || !name || !type || !category || !language || !code) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Insert new snippet into database
    const query = `
      INSERT INTO snippets (
        snippet_id, name, type, category, description, language, 
        code, integrations, version, documentation_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING 
        snippet_id as "id",
        name,
        type,
        category,
        description,
        language,
        code,
        integrations,
        version,
        downloads,
        rating,
        documentation_url as "documentation",
        created_at as "createdAt",
        updated_at as "lastUpdated"
    `;
    
    const values = [
      snippet_id,
      name,
      type,
      category,
      description || null,
      language,
      code,
      integrations || [],
      version || '1.0.0',
      documentation_url || null
    ];
    
    const result = await pool.query(query, values);
    const newSnippet = result.rows[0];

    logger.info(`New snippet created: ${snippet_id}`);
    res.status(201).json({
      success: true,
      message: 'Snippet created successfully',
      data: {
        id: newSnippet.id,
        name: newSnippet.name,
        type: newSnippet.type,
        category: newSnippet.category,
        description: newSnippet.description,
        language: newSnippet.language,
        code: newSnippet.code,
        integrations: newSnippet.integrations || [],
        version: newSnippet.version,
        lastUpdated: newSnippet.lastUpdated,
        downloads: newSnippet.downloads || 0,
        rating: parseFloat(newSnippet.rating) || 0,
        documentation: newSnippet.documentation
      }
    });
  } catch (error) {
    logger.error('Error creating snippet:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Snippet with this ID already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create snippet',
      error: error.message
    });
  }
});
  try {
    });
  } catch (error) {
    logger.error('Error fetching snippet stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch snippet stats',
      error: error.message
    });
  }
});

// POST /api/snippets
router.post('/', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      category,
      description,
      language,
      code,
      integrations,
      version,
      documentation_url
    } = req.body;
    
    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    
    if (type) {
      updates.push(`type = $${paramCount}`);
      values.push(type);
      paramCount++;
    }
    
    if (category) {
      updates.push(`category = $${paramCount}`);
      values.push(category);
      paramCount++;
    }
    
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }
    
    if (language) {
      updates.push(`language = $${paramCount}`);
      values.push(language);
      paramCount++;
    }
    
    if (code) {
      updates.push(`code = $${paramCount}`);
      values.push(code);
      paramCount++;
    }
    
    if (integrations) {
      updates.push(`integrations = $${paramCount}`);
      values.push(integrations);
      paramCount++;
    }
    
    if (version) {
      updates.push(`version = $${paramCount}`);
      values.push(version);
      paramCount++;
    }
    
    if (documentation_url !== undefined) {
      updates.push(`documentation_url = $${paramCount}`);
      values.push(documentation_url);
      paramCount++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    // Add updated_at timestamp and snippet_id for WHERE clause
    values.push(id);
    
    const query = `
      UPDATE snippets 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE snippet_id = $${paramCount}
      RETURNING 
        snippet_id as "id",
        name,
        type,
        category,
        description,
        language,
        code,
        integrations,
        version,
        downloads,
        rating,
        documentation_url as "documentation",
        updated_at as "lastUpdated"
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Snippet not found'
      });
    }
    
    const updatedSnippet = result.rows[0];

    logger.info(`Snippet updated: ${id}`);
    res.json({
      success: true,
      message: 'Snippet updated successfully',
      data: {
        id: updatedSnippet.id,
        name: updatedSnippet.name,
        type: updatedSnippet.type,
        category: updatedSnippet.category,
        description: updatedSnippet.description,
        language: updatedSnippet.language,
        code: updatedSnippet.code,
        integrations: updatedSnippet.integrations || [],
        version: updatedSnippet.version,
        lastUpdated: updatedSnippet.lastUpdated,
        downloads: updatedSnippet.downloads || 0,
        rating: parseFloat(updatedSnippet.rating) || 0,
        documentation: updatedSnippet.documentation
      }
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
    
    // Soft delete - set is_active to false
    const query = `
      UPDATE snippets 
      SET is_active = false, updated_at = NOW()
      WHERE snippet_id = $1
      RETURNING snippet_id as "id"
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Snippet not found'
      });
    }

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
