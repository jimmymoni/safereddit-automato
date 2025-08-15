const express = require('express');
const router = express.Router();
const RedditAPIService = require('../services/redditAPI');
const { safetyMiddleware, redditRateLimit } = require('../middleware/safetyMiddleware');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Initialize Reddit API service
const redditAPI = new RedditAPIService();

// Apply rate limiting to all Reddit API routes
router.use(rateLimit(redditRateLimit));

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
 * POST /api/reddit/post
 * Submit a post to Reddit
 */
router.post('/post', verifyToken, safetyMiddleware('reddit_post'), async (req, res) => {
  try {
    const { subreddit, title, text, url, flair } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!subreddit || !title) {
      return res.status(400).json({
        success: false,
        error: 'Subreddit and title are required'
      });
    }

    if (!text && !url) {
      return res.status(400).json({
        success: false,
        error: 'Either text content or URL is required'
      });
    }

    const postData = {
      subreddit,
      title,
      text,
      url,
      flair
    };

    const result = await redditAPI.submitPost(userId, postData);
    
    res.json({
      success: true,
      data: result,
      message: 'Post submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting post:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/reddit/comment
 * Add a comment to Reddit post or comment
 */
router.post('/comment', verifyToken, safetyMiddleware('reddit_comment'), async (req, res) => {
  try {
    const { parentId, text } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!parentId || !text) {
      return res.status(400).json({
        success: false,
        error: 'Parent ID and text are required'
      });
    }

    if (!parentId.startsWith('t1_') && !parentId.startsWith('t3_')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parent ID format'
      });
    }

    const commentData = {
      parentId,
      text
    };

    const result = await redditAPI.addComment(userId, commentData);
    
    res.json({
      success: true,
      data: result,
      message: 'Comment added successfully'
    });

  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/reddit/vote
 * Vote on Reddit content (upvote/downvote)
 */
router.post('/vote', verifyToken, safetyMiddleware('reddit_vote'), async (req, res) => {
  try {
    const { itemId, voteType } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!itemId || typeof voteType !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Item ID and vote type are required'
      });
    }

    if (![-1, 0, 1].includes(voteType)) {
      return res.status(400).json({
        success: false,
        error: 'Vote type must be -1 (downvote), 0 (no vote), or 1 (upvote)'
      });
    }

    if (!itemId.startsWith('t1_') && !itemId.startsWith('t3_')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid item ID format'
      });
    }

    const voteData = {
      itemId,
      voteType
    };

    const result = await redditAPI.voteOnContent(userId, voteData);
    
    res.json({
      success: true,
      data: result,
      message: 'Vote submitted successfully'
    });

  } catch (error) {
    console.error('Error voting on content:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/reddit/subreddit/:name
 * Get subreddit information and analysis
 */
router.get('/subreddit/:name', verifyToken, async (req, res) => {
  try {
    const { name } = req.params;
    const userId = req.user.userId;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Subreddit name is required'
      });
    }

    const result = await redditAPI.getSubredditInfo(userId, name);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error getting subreddit info:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/reddit/trending
 * Get trending posts from specified subreddits
 */
router.get('/trending', verifyToken, async (req, res) => {
  try {
    const { subreddits, limit } = req.query;
    const userId = req.user.userId;

    const subredditList = subreddits ? subreddits.split(',') : ['all'];
    const postLimit = parseInt(limit) || 25;

    if (postLimit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Limit cannot exceed 100'
      });
    }

    const result = await redditAPI.getTrendingPosts(userId, subredditList, postLimit);
    
    res.json({
      success: true,
      data: {
        posts: result,
        count: result.length,
        subreddits: subredditList
      }
    });

  } catch (error) {
    console.error('Error getting trending posts:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/reddit/profile
 * Get user's Reddit profile information
 */
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await redditAPI.getUserProfile(userId);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/reddit/search
 * Search Reddit for specific content
 */
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { q, subreddit, time, sort, limit } = req.query;
    const userId = req.user.userId;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required'
      });
    }

    const searchOptions = {
      subreddit,
      time: time || 'week',
      sort: sort || 'relevance',
      limit: parseInt(limit) || 25
    };

    if (searchOptions.limit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Limit cannot exceed 100'
      });
    }

    const result = await redditAPI.searchReddit(userId, q, searchOptions);
    
    res.json({
      success: true,
      data: {
        results: result,
        count: result.length,
        query: q,
        options: searchOptions
      }
    });

  } catch (error) {
    console.error('Error searching Reddit:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/reddit/opportunities
 * Get posting opportunities based on trending content and user preferences
 */
router.get('/opportunities', verifyToken, async (req, res) => {
  try {
    const { subreddits, minScore, maxAge } = req.query;
    const userId = req.user.userId;

    const subredditList = subreddits ? subreddits.split(',') : ['all'];
    const minimumScore = parseInt(minScore) || 100;
    const maxAgeHours = parseInt(maxAge) || 24;

    // Get trending posts
    const trendingPosts = await redditAPI.getTrendingPosts(userId, subredditList, 50);
    
    // Filter for opportunities
    const now = Date.now() / 1000;
    const opportunities = trendingPosts.filter(post => {
      const ageHours = (now - post.created) / 3600;
      return post.score >= minimumScore && 
             ageHours <= maxAgeHours &&
             post.numComments < post.score * 0.1; // Low comment-to-score ratio = opportunity
    });

    // Sort by opportunity score
    opportunities.sort((a, b) => b.analysis.trending - a.analysis.trending);

    res.json({
      success: true,
      data: {
        opportunities: opportunities.slice(0, 20), // Top 20 opportunities
        criteria: {
          minScore: minimumScore,
          maxAgeHours: maxAgeHours,
          subreddits: subredditList
        },
        totalFound: opportunities.length
      }
    });

  } catch (error) {
    console.error('Error finding opportunities:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/reddit/analyze-post
 * Analyze a specific Reddit post for engagement potential
 */
router.post('/analyze-post', verifyToken, async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.userId;

    if (!postId) {
      return res.status(400).json({
        success: false,
        error: 'Post ID is required'
      });
    }

    // This would integrate with the Reddit API to analyze a specific post
    // For now, return a placeholder response
    res.json({
      success: true,
      data: {
        postId,
        analysis: {
          engagementPotential: 'high',
          commentOpportunity: true,
          riskLevel: 'low',
          suggestedAction: 'comment',
          timing: 'optimal'
        },
        message: 'Post analysis feature coming soon'
      }
    });

  } catch (error) {
    console.error('Error analyzing post:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;