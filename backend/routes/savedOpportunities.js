const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// In-memory storage for saved opportunities (replace with database in production)
const savedOpportunities = new Map();

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

/**
 * GET /api/saved-opportunities
 * Get all saved opportunities for authenticated user
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userSavedOpportunities = savedOpportunities.get(userId) || [];
    
    res.json({
      success: true,
      data: {
        opportunities: userSavedOpportunities,
        total: userSavedOpportunities.length
      }
    });

  } catch (error) {
    console.error('Error fetching saved opportunities:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/saved-opportunities
 * Save an opportunity for authenticated user
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { opportunity } = req.body;

    if (!opportunity || !opportunity.id) {
      return res.status(400).json({
        success: false,
        error: 'Opportunity object with id is required'
      });
    }

    // Get user's saved opportunities or create new array
    const userSavedOpportunities = savedOpportunities.get(userId) || [];
    
    // Check if opportunity is already saved
    const existingIndex = userSavedOpportunities.findIndex(saved => saved.id === opportunity.id);
    if (existingIndex !== -1) {
      return res.status(400).json({
        success: false,
        error: 'Opportunity is already saved'
      });
    }

    // Add saved timestamp and metadata
    const savedOpportunity = {
      ...opportunity,
      savedAt: new Date().toISOString(),
      savedBy: userId
    };

    userSavedOpportunities.push(savedOpportunity);
    savedOpportunities.set(userId, userSavedOpportunities);
    
    res.json({
      success: true,
      data: savedOpportunity,
      message: 'Opportunity saved successfully'
    });

  } catch (error) {
    console.error('Error saving opportunity:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/saved-opportunities/:opportunityId
 * Remove a saved opportunity for authenticated user
 */
router.delete('/:opportunityId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { opportunityId } = req.params;

    const userSavedOpportunities = savedOpportunities.get(userId) || [];
    const initialLength = userSavedOpportunities.length;
    
    // Filter out the opportunity to remove
    const updatedOpportunities = userSavedOpportunities.filter(saved => saved.id !== opportunityId);
    
    if (updatedOpportunities.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: 'Saved opportunity not found'
      });
    }

    savedOpportunities.set(userId, updatedOpportunities);
    
    res.json({
      success: true,
      message: 'Opportunity removed from saved list'
    });

  } catch (error) {
    console.error('Error removing saved opportunity:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/saved-opportunities/:opportunityId
 * Check if a specific opportunity is saved by authenticated user
 */
router.get('/:opportunityId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { opportunityId } = req.params;

    const userSavedOpportunities = savedOpportunities.get(userId) || [];
    const isSaved = userSavedOpportunities.some(saved => saved.id === opportunityId);
    
    res.json({
      success: true,
      data: {
        isSaved,
        opportunityId
      }
    });

  } catch (error) {
    console.error('Error checking saved opportunity:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/saved-opportunities/batch-check
 * Check which opportunities are saved from a list
 */
router.post('/batch-check', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { opportunityIds } = req.body;

    if (!Array.isArray(opportunityIds)) {
      return res.status(400).json({
        success: false,
        error: 'opportunityIds must be an array'
      });
    }

    const userSavedOpportunities = savedOpportunities.get(userId) || [];
    const savedIds = new Set(userSavedOpportunities.map(saved => saved.id));
    
    const results = opportunityIds.map(id => ({
      id,
      isSaved: savedIds.has(id)
    }));
    
    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Error batch checking saved opportunities:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;