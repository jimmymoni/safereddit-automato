const express = require('express');
const router = express.Router();
const InsightsEngine = require('../services/insightsEngine');
const { safetyMiddleware, redditRateLimit } = require('../middleware/safetyMiddleware');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Initialize insights engine
const insightsEngine = new InsightsEngine();

// Apply rate limiting to insights routes
router.use(rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // Limit each IP to 50 requests per 5 minutes
  message: {
    error: 'Too many insights requests, please try again later.',
    retryAfter: '5 minutes'
  }
}));

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
 * GET /api/insights/opportunities
 * Detect real-time posting opportunities
 */
router.get('/opportunities', verifyToken, async (req, res) => {
  try {
    const {
      subreddits,
      minScore,
      maxAgeHours,
      maxCommentRatio,
      contentTypes,
      limit
    } = req.query;

    const userId = req.user.userId;

    const options = {
      subreddits: subreddits ? subreddits.split(',') : ['all'],
      minScore: parseInt(minScore) || 50,
      maxAgeHours: parseInt(maxAgeHours) || 6,
      maxCommentRatio: parseFloat(maxCommentRatio) || 0.1,
      contentTypes: contentTypes ? contentTypes.split(',') : ['post', 'comment'],
      limit: parseInt(limit) || 20
    };

    // Validate limits
    if (options.limit > 50) {
      return res.status(400).json({
        success: false,
        error: 'Limit cannot exceed 50'
      });
    }

    const opportunities = await insightsEngine.detectOpportunities(userId, options);

    res.json({
      success: true,
      data: {
        opportunities,
        count: opportunities.length,
        options,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error detecting opportunities:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/insights/analyze-opportunity
 * Analyze a specific opportunity in detail
 */
router.post('/analyze-opportunity', verifyToken, async (req, res) => {
  try {
    const { post, contentTypes } = req.body;

    if (!post || !post.id) {
      return res.status(400).json({
        success: false,
        error: 'Post data with ID is required'
      });
    }

    const analysis = await insightsEngine.analyzeOpportunity(
      post,
      contentTypes || ['post', 'comment']
    );

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Error analyzing opportunity:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/insights/subreddit/:name
 * Analyze and score a specific subreddit
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

    const analysis = await insightsEngine.analyzeSubreddit(userId, name);

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Error analyzing subreddit:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/insights/timing/:subreddit
 * Predict optimal timing for posts in a subreddit
 */
router.get('/timing/:subreddit', verifyToken, async (req, res) => {
  try {
    const { subreddit } = req.params;
    const { contentType } = req.query;
    const userId = req.user.userId;

    if (!subreddit) {
      return res.status(400).json({
        success: false,
        error: 'Subreddit name is required'
      });
    }

    const timingAnalysis = await insightsEngine.predictOptimalTiming(
      userId,
      subreddit,
      contentType || 'post'
    );

    res.json({
      success: true,
      data: timingAnalysis
    });

  } catch (error) {
    console.error('Error predicting optimal timing:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/insights/risk-assessment
 * Assess risk for a specific automation action
 */
router.post('/risk-assessment', verifyToken, async (req, res) => {
  try {
    const { action, context } = req.body;
    const userId = req.user.userId;

    if (!action || !action.type) {
      return res.status(400).json({
        success: false,
        error: 'Action with type is required'
      });
    }

    const riskAssessment = await insightsEngine.assessRisk(userId, action, context || {});

    res.json({
      success: true,
      data: riskAssessment
    });

  } catch (error) {
    console.error('Error assessing risk:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/insights/dashboard
 * Get comprehensive insights dashboard
 */
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const { subreddits } = req.query;
    const userId = req.user.userId;

    const targetSubreddits = subreddits ? subreddits.split(',') : ['all'];

    // Get multiple insights in parallel
    const [opportunities, timingPredictions] = await Promise.all([
      insightsEngine.detectOpportunities(userId, {
        subreddits: targetSubreddits,
        limit: 10
      }),
      Promise.all(
        targetSubreddits.slice(0, 3).map(sub => 
          insightsEngine.predictOptimalTiming(userId, sub).catch(() => null)
        )
      )
    ]);

    // Risk assessment for general posting
    const riskAssessment = await insightsEngine.assessRisk(userId, { type: 'post' });

    const dashboard = {
      summary: {
        opportunitiesFound: opportunities.length,
        averageOpportunityScore: opportunities.length > 0 
          ? Math.round(opportunities.reduce((sum, opp) => sum + opp.score, 0) / opportunities.length)
          : 0,
        currentRiskLevel: riskAssessment.riskLevel,
        riskScore: riskAssessment.riskScore,
        safeToProceced: riskAssessment.safeToProceced
      },
      topOpportunities: opportunities.slice(0, 5),
      timingInsights: timingPredictions.filter(Boolean).map(timing => ({
        subreddit: timing.subreddit,
        nextOptimalTime: timing.nextOptimalSlots[0],
        peakHours: timing.insights.peakHours.slice(0, 3),
        avgEngagement: timing.insights.avgEngagement
      })),
      riskAnalysis: {
        level: riskAssessment.riskLevel,
        score: riskAssessment.riskScore,
        factors: riskAssessment.riskFactors,
        recommendations: riskAssessment.recommendations.slice(0, 3)
      },
      recommendations: this.generateDashboardRecommendations(
        opportunities,
        riskAssessment,
        timingPredictions.filter(Boolean)
      ),
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    console.error('Error generating insights dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/insights/trending-topics
 * Get trending topics across specified subreddits
 */
router.get('/trending-topics', verifyToken, async (req, res) => {
  try {
    const { subreddits, limit } = req.query;
    const userId = req.user.userId;

    const targetSubreddits = subreddits ? subreddits.split(',') : ['all'];
    const topicLimit = parseInt(limit) || 20;

    // This would analyze trending topics across subreddits
    // For now, return a structured response
    const trendingTopics = {
      topics: [
        {
          keyword: 'AI automation',
          subreddits: ['r/entrepreneur', 'r/technology'],
          momentum: 85,
          opportunity: 'high',
          posts: 24
        },
        {
          keyword: 'productivity hacks',
          subreddits: ['r/productivity', 'r/getmotivated'],
          momentum: 72,
          opportunity: 'medium',
          posts: 18
        }
      ],
      analysis: {
        totalTopics: 15,
        highOpportunity: 5,
        mediumOpportunity: 7,
        lowOpportunity: 3
      },
      recommendations: [
        'Focus on AI automation content for maximum engagement',
        'Productivity content performs well on weekday mornings'
      ]
    };

    res.json({
      success: true,
      data: trendingTopics,
      message: 'Trending topics analysis (demo data)'
    });

  } catch (error) {
    console.error('Error getting trending topics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/insights/content-strategy
 * Generate content strategy recommendations
 */
router.post('/content-strategy', verifyToken, async (req, res) => {
  try {
    const { targetSubreddits, goals, timeframe } = req.body;
    const userId = req.user.userId;

    if (!targetSubreddits || !Array.isArray(targetSubreddits)) {
      return res.status(400).json({
        success: false,
        error: 'Target subreddits array is required'
      });
    }

    // Analyze each subreddit
    const subredditAnalyses = await Promise.all(
      targetSubreddits.slice(0, 5).map(async (subreddit) => {
        try {
          const analysis = await insightsEngine.analyzeSubreddit(userId, subreddit);
          const timing = await insightsEngine.predictOptimalTiming(userId, subreddit);
          return { subreddit, analysis, timing };
        } catch (error) {
          return { subreddit, error: error.message };
        }
      })
    );

    // Generate strategy recommendations
    const strategy = {
      overview: {
        targetSubreddits: targetSubreddits.length,
        analyzedSuccessfully: subredditAnalyses.filter(s => !s.error).length,
        timeframe: timeframe || '30 days',
        goals: goals || ['engagement', 'karma']
      },
      subredditStrategies: subredditAnalyses.map(s => ({
        subreddit: s.subreddit,
        recommendation: s.error ? 'Analysis failed' : this.generateSubredditStrategy(s),
        priority: s.analysis?.scores?.overall > 70 ? 'high' : s.analysis?.scores?.overall > 50 ? 'medium' : 'low',
        optimalTimes: s.timing?.nextOptimalSlots?.slice(0, 3) || []
      })),
      globalRecommendations: [
        'Focus on subreddits with scores above 70 for maximum ROI',
        'Post during identified peak hours for each subreddit',
        'Maintain consistent engagement patterns to build reputation'
      ]
    };

    res.json({
      success: true,
      data: strategy
    });

  } catch (error) {
    console.error('Error generating content strategy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper methods for the router
router.generateDashboardRecommendations = function(opportunities, riskAssessment, timingPredictions) {
  const recommendations = [];

  if (opportunities.length > 5) {
    recommendations.push('High opportunity environment - consider increasing activity');
  }

  if (riskAssessment.riskLevel === 'high') {
    recommendations.push('High risk detected - reduce activity for next few hours');
  }

  if (timingPredictions.length > 0) {
    const nextOptimal = timingPredictions[0]?.nextOptimalSlots?.[0];
    if (nextOptimal) {
      recommendations.push(`Next optimal posting time: ${new Date(nextOptimal.timestamp).toLocaleString()}`);
    }
  }

  return recommendations;
};

router.generateSubredditStrategy = function(subredditData) {
  const { analysis, timing } = subredditData;
  
  if (analysis.scores.overall > 70) {
    return 'High-value subreddit: Increase posting frequency and focus on engagement';
  } else if (analysis.scores.opportunity > 70) {
    return 'High opportunity: Focus on comment engagement to build presence';
  } else if (analysis.scores.safety < 50) {
    return 'Proceed with caution: Review rules and moderate activity';
  } else {
    return 'Standard approach: Regular posting with quality content';
  }
};

module.exports = router;