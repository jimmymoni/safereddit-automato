const express = require('express');
const rateLimit = require('express-rate-limit');
const ContentManagerService = require('../services/contentManager');
const RedditAuthService = require('../services/redditAuth');

const router = express.Router();
const contentService = new ContentManagerService();
const authService = new RedditAuthService();

// Rate limiting for content routes
const contentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 content requests per windowMs
  message: {
    error: 'Too many content requests, please try again later.',
    retryAfter: '15 minutes'
  }
});

// Middleware to authenticate users
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        message: 'Authorization header with Bearer token required'
      });
    }

    const token = authHeader.substring(7);
    const user = await authService.verifyToken(token);
    req.user = user;
    next();

  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: error.message
    });
  }
};

/**
 * @route POST /api/content/items
 * @desc Create new content item
 * @access Private
 */
router.post('/items', contentRateLimit, authenticateUser, async (req, res) => {
  try {
    const { title, content, contentType, tags, subreddits } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Title and content are required'
      });
    }

    const contentItem = await contentService.createContentItem(req.user.id, {
      title,
      content,
      contentType,
      tags,
      subreddits
    });

    res.status(201).json({
      success: true,
      data: contentItem,
      message: 'Content item created successfully'
    });

  } catch (error) {
    console.error('Create content item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create content item',
      message: error.message
    });
  }
});

/**
 * @route GET /api/content/items
 * @desc Get user's content items with filtering
 * @access Private
 */
router.get('/items', contentRateLimit, authenticateUser, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      contentType: req.query.contentType,
      tags: req.query.tags ? req.query.tags.split(',') : undefined,
      search: req.query.search,
      limit: req.query.limit || 50,
      offset: req.query.offset || 0
    };

    const result = await contentService.getUserContent(req.user.id, filters);

    res.json({
      success: true,
      data: result,
      message: 'Content items retrieved successfully'
    });

  } catch (error) {
    console.error('Get content items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content items',
      message: error.message
    });
  }
});

/**
 * @route PUT /api/content/items/:id
 * @desc Update content item
 * @access Private
 */
router.put('/items/:id', contentRateLimit, authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.userId;
    delete updateData.createdAt;

    const updatedContent = await contentService.updateContentItem(
      req.user.id, 
      id, 
      updateData
    );

    res.json({
      success: true,
      data: updatedContent,
      message: 'Content item updated successfully'
    });

  } catch (error) {
    console.error('Update content item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update content item',
      message: error.message
    });
  }
});

/**
 * @route DELETE /api/content/items/:id
 * @desc Delete content item
 * @access Private
 */
router.delete('/items/:id', contentRateLimit, authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await contentService.deleteContentItem(req.user.id, id);

    res.json({
      success: true,
      data: result,
      message: 'Content item deleted successfully'
    });

  } catch (error) {
    console.error('Delete content item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete content item',
      message: error.message
    });
  }
});

/**
 * @route POST /api/content/schedule
 * @desc Schedule a post for later publishing
 * @access Private
 */
router.post('/schedule', contentRateLimit, authenticateUser, async (req, res) => {
  try {
    const { 
      contentItemId, 
      subreddit, 
      title, 
      content, 
      postType, 
      scheduledFor 
    } = req.body;

    if (!subreddit || !title || !content || !scheduledFor) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Subreddit, title, content, and scheduledFor are required'
      });
    }

    const scheduledPost = await contentService.schedulePost(req.user.id, {
      contentItemId,
      subreddit,
      title,
      content,
      postType,
      scheduledFor
    });

    res.status(201).json({
      success: true,
      data: scheduledPost,
      message: 'Post scheduled successfully'
    });

  } catch (error) {
    console.error('Schedule post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule post',
      message: error.message
    });
  }
});

/**
 * @route GET /api/content/scheduled
 * @desc Get user's scheduled posts
 * @access Private
 */
router.get('/scheduled', contentRateLimit, authenticateUser, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      subreddit: req.query.subreddit,
      limit: req.query.limit || 50,
      offset: req.query.offset || 0
    };

    const result = await contentService.getScheduledPosts(req.user.id, filters);

    res.json({
      success: true,
      data: result,
      message: 'Scheduled posts retrieved successfully'
    });

  } catch (error) {
    console.error('Get scheduled posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scheduled posts',
      message: error.message
    });
  }
});

/**
 * @route DELETE /api/content/scheduled/:id
 * @desc Cancel scheduled post
 * @access Private
 */
router.delete('/scheduled/:id', contentRateLimit, authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await contentService.cancelScheduledPost(req.user.id, id);

    res.json({
      success: true,
      data: result,
      message: 'Scheduled post cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel scheduled post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel scheduled post',
      message: error.message
    });
  }
});

/**
 * @route GET /api/content/analytics
 * @desc Get content analytics and performance metrics
 * @access Private
 */
router.get('/analytics', contentRateLimit, authenticateUser, async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';

    const analytics = await contentService.getContentAnalytics(req.user.id, timeRange);

    res.json({
      success: true,
      data: analytics,
      message: 'Content analytics retrieved successfully'
    });

  } catch (error) {
    console.error('Get content analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content analytics',
      message: error.message
    });
  }
});

/**
 * @route GET /api/content/suggestions
 * @desc Get content suggestions based on user's performance
 * @access Private
 */
router.get('/suggestions', contentRateLimit, authenticateUser, async (req, res) => {
  try {
    const suggestions = await contentService.generateContentSuggestions(req.user.id);

    res.json({
      success: true,
      data: suggestions,
      message: 'Content suggestions generated successfully'
    });

  } catch (error) {
    console.error('Get content suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate content suggestions',
      message: error.message
    });
  }
});

/**
 * @route GET /api/content/vault
 * @desc Get content vault (alias for /items with ready status)
 * @access Private
 */
router.get('/vault', contentRateLimit, authenticateUser, async (req, res) => {
  try {
    const filters = {
      status: 'ready',
      contentType: req.query.contentType,
      tags: req.query.tags ? req.query.tags.split(',') : undefined,
      search: req.query.search,
      limit: req.query.limit || 50,
      offset: req.query.offset || 0
    };

    const result = await contentService.getUserContent(req.user.id, filters);

    res.json({
      success: true,
      data: result,
      message: 'Content vault retrieved successfully'
    });

  } catch (error) {
    console.error('Get content vault error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content vault',
      message: error.message
    });
  }
});

module.exports = router;