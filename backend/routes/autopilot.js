const express = require('express');
const router = express.Router();
const AutopilotEngine = require('../services/autopilotEngine');
const { safetyMiddleware } = require('../middleware/safetyMiddleware');
const jwt = require('jsonwebtoken');

// Initialize autopilot engine instance
const autopilotEngine = new AutopilotEngine();

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
 * POST /api/autopilot/start
 * Start autopilot session for authenticated user
 */
router.post('/start', verifyToken, safetyMiddleware('autopilot_start'), async (req, res) => {
  try {
    const { settings } = req.body;
    const userId = req.user.userId;

    const result = await autopilotEngine.startAutopilot(userId, settings);
    
    res.json({
      success: true,
      data: result,
      message: 'Autopilot started successfully'
    });

  } catch (error) {
    console.error('Error starting autopilot:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/autopilot/stop
 * Stop autopilot session for authenticated user
 */
router.post('/stop', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await autopilotEngine.stopAutopilot(userId);
    
    res.json({
      success: true,
      data: result,
      message: 'Autopilot stopped successfully'
    });

  } catch (error) {
    console.error('Error stopping autopilot:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/autopilot/status
 * Get current autopilot status for authenticated user
 */
router.get('/status', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const status = await autopilotEngine.getAutopilotStatus(userId);
    
    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Error getting autopilot status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/autopilot/settings
 * Update autopilot settings for authenticated user
 */
router.put('/settings', verifyToken, async (req, res) => {
  try {
    const { settings } = req.body;
    const userId = req.user.userId;

    // Validate settings structure
    const validatedSettings = {
      enabled: settings.enabled || false,
      autoPost: settings.autoPost || false,
      autoComment: settings.autoComment || false,
      autoVote: settings.autoVote || false,
      targetSubreddits: settings.targetSubreddits || [],
      postFrequency: Math.max(10, settings.postFrequency || 60), // Minimum 10 minutes
      commentFrequency: Math.max(5, settings.commentFrequency || 30), // Minimum 5 minutes
      voteFrequency: Math.max(2, settings.voteFrequency || 15), // Minimum 2 minutes
      maxPostsPerDay: Math.min(20, settings.maxPostsPerDay || 5), // Maximum 20 posts per day
      maxCommentsPerDay: Math.min(100, settings.maxCommentsPerDay || 30), // Maximum 100 comments per day
      maxVotesPerDay: Math.min(500, settings.maxVotesPerDay || 100), // Maximum 500 votes per day
      contentStrategy: settings.contentStrategy || 'ai_generated',
      riskLevel: settings.riskLevel || 'conservative', // conservative, moderate, aggressive
      pauseOnLowHealth: settings.pauseOnLowHealth !== false, // Default true
      minHealthScore: Math.max(30, settings.minHealthScore || 50) // Minimum health to continue
    };

    const result = await autopilotEngine.updateSettings(userId, validatedSettings);
    
    res.json({
      success: true,
      data: {
        settings: validatedSettings,
        ...result
      },
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating autopilot settings:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/autopilot/queue
 * Get action queue for authenticated user
 */
router.get('/queue', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const queue = autopilotEngine.getActionQueue(userId);
    
    res.json({
      success: true,
      data: {
        queue,
        count: queue.length
      }
    });

  } catch (error) {
    console.error('Error getting action queue:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/autopilot/queue
 * Add action to queue for authenticated user
 */
router.post('/queue', verifyToken, safetyMiddleware('queue_action'), async (req, res) => {
  try {
    const { action } = req.body;
    const userId = req.user.userId;

    // Validate action structure
    if (!action.type || !action.data) {
      return res.status(400).json({
        success: false,
        error: 'Action must have type and data properties'
      });
    }

    // Validate action type
    const validTypes = ['post', 'comment', 'vote'];
    if (!validTypes.includes(action.type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid action type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate action data based on type
    let validationError = null;
    switch (action.type) {
      case 'post':
        if (!action.data.subreddit || !action.data.title) {
          validationError = 'Post action requires subreddit and title';
        }
        break;
      case 'comment':
        if (!action.data.parentId || !action.data.text) {
          validationError = 'Comment action requires parentId and text';
        }
        break;
      case 'vote':
        if (!action.data.itemId || typeof action.data.voteType !== 'number') {
          validationError = 'Vote action requires itemId and voteType (1, -1, or 0)';
        }
        break;
    }

    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      });
    }

    const queuedAction = await autopilotEngine.addActionToQueue(userId, action);
    
    res.json({
      success: true,
      data: queuedAction,
      message: 'Action added to queue successfully'
    });

  } catch (error) {
    console.error('Error adding action to queue:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/autopilot/queue/:actionId
 * Remove action from queue for authenticated user
 */
router.delete('/queue/:actionId', verifyToken, async (req, res) => {
  try {
    const { actionId } = req.params;
    const userId = req.user.userId;

    const removed = autopilotEngine.removeActionFromQueue(userId, actionId);
    
    if (removed) {
      res.json({
        success: true,
        message: 'Action removed from queue successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Action not found in queue'
      });
    }

  } catch (error) {
    console.error('Error removing action from queue:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/autopilot/sessions
 * Get all active autopilot sessions (admin endpoint)
 */
router.get('/sessions', verifyToken, async (req, res) => {
  try {
    // This endpoint could be restricted to admin users
    const sessions = autopilotEngine.getActiveSessions();
    
    res.json({
      success: true,
      data: {
        sessions,
        count: sessions.length
      }
    });

  } catch (error) {
    console.error('Error getting active sessions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/autopilot/emergency-stop
 * Emergency stop all autopilot sessions (admin endpoint)
 */
router.post('/emergency-stop', verifyToken, async (req, res) => {
  try {
    // This endpoint should be restricted to admin users in production
    const result = await autopilotEngine.emergencyStopAll();
    
    res.json({
      success: true,
      data: result,
      message: 'Emergency stop executed successfully'
    });

  } catch (error) {
    console.error('Error executing emergency stop:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/autopilot/health
 * Get autopilot engine health status
 */
router.get('/health', async (req, res) => {
  try {
    const activeSessions = autopilotEngine.getActiveSessions();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        activeSessions: activeSessions.length,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting autopilot health:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;