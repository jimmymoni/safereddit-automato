const express = require('express');
const rateLimit = require('express-rate-limit');
const KimiAIService = require('../services/kimiAI');
const RedditAuthService = require('../services/redditAuth');
const { safetyMiddleware } = require('../middleware/safetyMiddleware');

const router = express.Router();
const aiService = new KimiAIService();
const authService = new RedditAuthService();

// Rate limiting for AI routes (more restrictive due to API costs)
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 AI requests per windowMs
  message: {
    error: 'Too many AI requests, please try again later.',
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
 * @route POST /api/ai/generate/test
 * @desc Test generate Reddit post content (no auth required for testing)
 * @access Public
 */
router.post('/generate/test', aiRateLimit, async (req, res) => {
  try {
    const { prompt, subreddit, contentType, tone, maxTokens, model } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Prompt is required'
      });
    }

    const result = await aiService.generatePost(prompt, {
      subreddit,
      contentType,
      tone,
      maxTokens,
      model
    });

    res.json({
      success: true,
      data: {
        content: result.content,
        model: result.model,
        tokensUsed: result.tokensUsed
      },
      message: 'Test content generated successfully'
    });

  } catch (error) {
    console.error('Test AI generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Content generation failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/ai/generate/post
 * @desc Generate Reddit post content using OpenAI
 * @access Private
 */
router.post('/generate/post', aiRateLimit, authenticateUser, safetyMiddleware('ai_post_generation'), async (req, res) => {
  try {
    const { prompt, subreddit, contentType, tone, maxTokens, model } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Prompt is required'
      });
    }

    const result = await aiService.generatePost(prompt, {
      subreddit,
      contentType,
      tone,
      maxTokens,
      model
    });

    // Log AI usage
    await aiService.logUsage(req.user.id, 'post_generation', result.tokensUsed, result.model);

    res.json({
      success: true,
      data: {
        content: result.content,
        model: result.model,
        tokensUsed: result.tokensUsed
      },
      message: 'Post content generated successfully'
    });

  } catch (error) {
    console.error('AI post generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate post content',
      message: error.message
    });
  }
});

/**
 * @route POST /api/ai/generate/comment
 * @desc Generate Reddit comment using Kimi AI
 * @access Private
 */
router.post('/generate/comment', aiRateLimit, authenticateUser, safetyMiddleware('ai_comment_generation'), async (req, res) => {
  try {
    const { postContent, prompt, subreddit, tone, maxTokens, model } = req.body;

    if (!postContent || !prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Post content and prompt are required'
      });
    }

    const result = await aiService.generateComment(postContent, prompt, {
      subreddit,
      tone,
      maxTokens,
      model
    });

    // Log AI usage
    await aiService.logUsage(req.user.id, 'comment_generation', result.tokensUsed, result.model);

    res.json({
      success: true,
      data: {
        content: result.content,
        model: result.model,
        tokensUsed: result.tokensUsed
      },
      message: 'Comment generated successfully'
    });

  } catch (error) {
    console.error('AI comment generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate comment',
      message: error.message
    });
  }
});

/**
 * @route POST /api/ai/improve/content
 * @desc Improve existing content using Kimi AI
 * @access Private
 */
router.post('/improve/content', aiRateLimit, authenticateUser, safetyMiddleware('ai_content_improvement'), async (req, res) => {
  try {
    const { content, improvementType, subreddit, maxTokens, model } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Content is required'
      });
    }

    const result = await aiService.improveContent(content, improvementType, {
      subreddit,
      maxTokens,
      model
    });

    // Log AI usage
    await aiService.logUsage(req.user.id, 'content_improvement', result.tokensUsed, result.model);

    res.json({
      success: true,
      data: {
        content: result.content,
        improvementType: result.improvementType,
        model: result.model,
        tokensUsed: result.tokensUsed
      },
      message: 'Content improved successfully'
    });

  } catch (error) {
    console.error('AI content improvement error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to improve content',
      message: error.message
    });
  }
});

/**
 * @route POST /api/ai/analyze/content
 * @desc Analyze content for Reddit suitability using Kimi AI
 * @access Private
 */
router.post('/analyze/content', aiRateLimit, authenticateUser, safetyMiddleware('ai_content_analysis'), async (req, res) => {
  try {
    const { content, subreddit, analysisType, model } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Content is required'
      });
    }

    const result = await aiService.analyzeContent(content, subreddit, {
      analysisType,
      model
    });

    // Log AI usage
    await aiService.logUsage(req.user.id, 'content_analysis', result.tokensUsed, result.model);

    res.json({
      success: true,
      data: {
        analysis: result.analysis,
        model: result.model,
        tokensUsed: result.tokensUsed,
        timestamp: result.timestamp
      },
      message: 'Content analyzed successfully'
    });

  } catch (error) {
    console.error('AI content analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze content',
      message: error.message
    });
  }
});

/**
 * @route POST /api/ai/generate/ideas
 * @desc Generate content ideas based on trending topics
 * @access Private
 */
router.post('/generate/ideas', aiRateLimit, authenticateUser, safetyMiddleware('ai_idea_generation'), async (req, res) => {
  try {
    const { topic, subreddit, count, contentType, model } = req.body;

    if (!topic || !subreddit) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Topic and subreddit are required'
      });
    }

    const result = await aiService.generateContentIdeas(topic, subreddit, {
      count,
      contentType,
      model
    });

    // Log AI usage
    await aiService.logUsage(req.user.id, 'idea_generation', result.tokensUsed, result.model);

    res.json({
      success: true,
      data: {
        ideas: result.ideas,
        topic: result.topic,
        subreddit: result.subreddit,
        contentType: result.contentType,
        count: result.count,
        model: result.model,
        tokensUsed: result.tokensUsed,
        generatedAt: result.generatedAt
      },
      message: 'Content ideas generated successfully'
    });

  } catch (error) {
    console.error('AI idea generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate content ideas',
      message: error.message
    });
  }
});

/**
 * @route GET /api/ai/health
 * @desc Check Kimi AI service health
 * @access Private
 */
router.get('/health', aiRateLimit, authenticateUser, async (req, res) => {
  try {
    const healthStatus = await aiService.healthCheck();

    res.json({
      success: true,
      data: healthStatus,
      message: 'AI service health check completed'
    });

  } catch (error) {
    console.error('AI health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check AI service health',
      message: error.message
    });
  }
});

/**
 * @route GET /api/ai/models
 * @desc Get available Kimi AI models and their capabilities
 * @access Private
 */
router.get('/models', authenticateUser, async (req, res) => {
  try {
    const models = [
      {
        id: 'moonshot-v1-8k',
        name: 'Moonshot v1 8K',
        contextWindow: 8192,
        description: 'Fast model for short content generation',
        bestFor: ['posts', 'comments', 'quick improvements'],
        costTier: 'low'
      },
      {
        id: 'moonshot-v1-32k',
        name: 'Moonshot v1 32K',
        contextWindow: 32768,
        description: 'Balanced model for detailed content',
        bestFor: ['detailed posts', 'content analysis', 'multiple ideas'],
        costTier: 'medium'
      },
      {
        id: 'moonshot-v1-128k',
        name: 'Moonshot v1 128K',
        contextWindow: 131072,
        description: 'Large context model for complex tasks',
        bestFor: ['comprehensive analysis', 'bulk content generation', 'detailed research'],
        costTier: 'high'
      }
    ];

    res.json({
      success: true,
      data: {
        models,
        defaultModel: 'moonshot-v1-8k',
        provider: 'Kimi (Moonshot AI)'
      },
      message: 'Available AI models retrieved successfully'
    });

  } catch (error) {
    console.error('AI models info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI models information',
      message: error.message
    });
  }
});

module.exports = router;