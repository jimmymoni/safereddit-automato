const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

// Story analysis endpoint 
router.post('/analyze-story', authenticateToken, async (req, res) => {
  try {
    const { story, userProfile } = req.body;
    
    if (!story || story.trim().length < 20) {
      return res.status(400).json({
        success: false,
        error: 'Story must be at least 20 characters long'
      });
    }

    // Analyze the story and generate automation plan
    const analysisResult = await analyzeUserStory(story, userProfile);
    
    // Store the analysis in database for future reference
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (user) {
      await prisma.user.update({
        where: { id: req.user.userId },
        data: {
          currentStory: story,
          lastStoryAnalysis: new Date()
        }
      });
    }

    res.json({
      success: true,
      data: {
        plan: analysisResult,
        analysis: {
          storyLength: story.length,
          detectedTopics: analysisResult.detectedTopics,
          confidenceScore: analysisResult.confidenceScore
        }
      }
    });

  } catch (error) {
    console.error('Story analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze story'
    });
  }
});

// Story analysis endpoint (temporary test version without auth)
router.post('/test-analyze-story', async (req, res) => {
  try {
    const { story, userProfile } = req.body;
    
    if (!story || story.trim().length < 20) {
      return res.status(400).json({
        success: false,
        error: 'Story must be at least 20 characters long'
      });
    }

    // Analyze the story and generate automation plan
    const analysisResult = await analyzeUserStory(story, userProfile);
    
    // Skip database operations for test endpoint

    res.json({
      success: true,
      data: {
        plan: analysisResult,
        analysis: {
          storyLength: story.length,
          detectedTopics: analysisResult.detectedTopics,
          confidenceScore: analysisResult.confidenceScore
        }
      }
    });

  } catch (error) {
    console.error('Story analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze story'
    });
  }
});

// Start automation endpoint
router.post('/start-automation', authenticateToken, async (req, res) => {
  try {
    const { story, plan, settings } = req.body;
    
    if (!story || !plan) {
      return res.status(400).json({
        success: false,
        error: 'Story and plan are required'
      });
    }

    // Validate settings against rulebook
    const validatedSettings = validateSettings(settings);
    
    // Create automation session
    const automationSession = await createAutomationSession(
      req.user.userId, 
      story, 
      plan, 
      validatedSettings
    );

    res.json({
      success: true,
      data: {
        sessionId: automationSession.id,
        status: 'active',
        plan: plan,
        settings: validatedSettings,
        message: 'Reddit Scholar Autopilot started successfully'
      }
    });

  } catch (error) {
    console.error('Start automation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start automation'
    });
  }
});

// Get current status endpoint
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        automationSessions: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        activityLogs: {
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const activeSession = user.automationSessions[0];
    const todayActions = user.activityLogs.length;

    let status = {
      isActive: !!activeSession,
      status: activeSession ? 'active' : 'idle',
      progress: activeSession ? 100 : 0,
      todayActions: todayActions,
      healthScore: 100 // Calculate based on recent activity
    };

    let plan = null;
    if (activeSession && activeSession.automationPlan) {
      plan = JSON.parse(activeSession.automationPlan);
    }

    res.json({
      success: true,
      data: {
        status: status,
        plan: plan,
        sessionId: activeSession?.id
      }
    });

  } catch (error) {
    console.error('Status fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch status'
    });
  }
});

// Pause automation endpoint
router.post('/pause', authenticateToken, async (req, res) => {
  try {
    const activeSession = await prisma.automationSession.findFirst({
      where: {
        userId: req.user.userId,
        isActive: true
      }
    });

    if (!activeSession) {
      return res.status(404).json({
        success: false,
        error: 'No active automation session found'
      });
    }

    await prisma.automationSession.update({
      where: { id: activeSession.id },
      data: {
        status: 'paused',
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: { message: 'Automation paused successfully' }
    });

  } catch (error) {
    console.error('Pause automation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pause automation'
    });
  }
});

// Resume automation endpoint
router.post('/resume', authenticateToken, async (req, res) => {
  try {
    const pausedSession = await prisma.automationSession.findFirst({
      where: {
        userId: req.user.userId,
        isActive: true,
        status: 'paused'
      }
    });

    if (!pausedSession) {
      return res.status(404).json({
        success: false,
        error: 'No paused automation session found'
      });
    }

    await prisma.automationSession.update({
      where: { id: pausedSession.id },
      data: {
        status: 'active',
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: { message: 'Automation resumed successfully' }
    });

  } catch (error) {
    console.error('Resume automation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resume automation'
    });
  }
});

// Emergency stop automation endpoint
router.post('/emergency-stop', authenticateToken, async (req, res) => {
  try {
    // Stop all active automation sessions for this user
    const activeSessions = await prisma.automationSession.updateMany({
      where: {
        userId: req.user.userId,
        isActive: true
      },
      data: {
        isActive: false,
        status: 'stopped',
        updatedAt: new Date()
      }
    });

    // Log the emergency stop action
    await prisma.activityLog.create({
      data: {
        userId: req.user.userId,
        action: 'emergency_stop',
        target: 'all_automation',
        result: 'success',
        metadata: {
          stoppedSessions: activeSessions.count,
          timestamp: new Date().toISOString(),
          reason: 'user_initiated_emergency_stop'
        },
        createdAt: new Date()
      }
    });

    res.json({
      success: true,
      data: { 
        message: 'Emergency stop executed successfully',
        stoppedSessions: activeSessions.count
      }
    });

  } catch (error) {
    console.error('Emergency stop error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute emergency stop'
    });
  }
});

// Emergency stop (test endpoint without auth)
router.post('/test-emergency-stop', async (req, res) => {
  try {
    res.json({
      success: true,
      data: { 
        message: 'Emergency stop executed successfully (test mode)',
        stoppedSessions: 1
      }
    });
  } catch (error) {
    console.error('Emergency stop test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute emergency stop'
    });
  }
});

// Story analysis function
async function analyzeUserStory(story, userProfile) {
  // Extract key information from the story
  const storyLower = story.toLowerCase();
  
  // Detect project type and stage
  const projectIndicators = {
    'saas': ['saas', 'software', 'app', 'platform', 'tool', 'dashboard'],
    'startup': ['startup', 'company', 'business', 'venture', 'launch'],
    'product': ['product', 'mvp', 'beta', 'prototype', 'development'],
    'service': ['service', 'consulting', 'agency', 'freelance', 'client']
  };

  const stageIndicators = {
    'idea': ['idea', 'concept', 'planning', 'thinking about'],
    'building': ['building', 'developing', 'coding', 'working on', '% complete'],
    'beta': ['beta', 'testing', 'feedback', 'users testing'],
    'launched': ['launched', 'live', 'production', 'customers paying']
  };

  const goalIndicators = {
    'visibility': ['visibility', 'awareness', 'exposure', 'reach', 'marketing'],
    'users': ['users', 'customers', 'signups', 'adoption', 'growth'],
    'feedback': ['feedback', 'input', 'validation', 'reviews', 'opinions'],
    'funding': ['funding', 'investment', 'investors', 'capital', 'money']
  };

  // Analyze story content
  let detectedType = 'general';
  let detectedStage = 'building';
  let detectedGoals = [];
  let detectedTopics = [];

  // Detect project type
  for (const [type, keywords] of Object.entries(projectIndicators)) {
    if (keywords.some(keyword => storyLower.includes(keyword))) {
      detectedType = type;
      break;
    }
  }

  // Detect stage
  for (const [stage, keywords] of Object.entries(stageIndicators)) {
    if (keywords.some(keyword => storyLower.includes(keyword))) {
      detectedStage = stage;
      break;
    }
  }

  // Detect goals
  for (const [goal, keywords] of Object.entries(goalIndicators)) {
    if (keywords.some(keyword => storyLower.includes(keyword))) {
      detectedGoals.push(goal);
    }
  }

  // Generate target subreddits based on analysis
  const subredditMapping = {
    'saas': ['SaaS', 'startups', 'entrepreneur', 'software', 'ProductManagement'],
    'startup': ['startups', 'entrepreneur', 'business', 'smallbusiness', 'venturecapital'],
    'product': ['ProductManagement', 'startups', 'entrepreneur', 'technology'],
    'service': ['entrepreneur', 'freelance', 'business', 'consulting']
  };

  const targetSubreddits = subredditMapping[detectedType] || ['entrepreneur', 'startups'];

  // Generate content strategy
  const contentStrategy = generateContentStrategy(detectedType, detectedStage, detectedGoals, story);

  // Create automation plan
  const automationPlan = {
    targetSubreddits: targetSubreddits.slice(0, 3), // Limit to 3 for focus
    contentStrategy: contentStrategy,
    postingSchedule: "3 posts per week maximum, Tuesday/Thursday/Saturday evenings",
    engagementPlan: "Reply to all comments within 2-4 hours, ask follow-up questions, provide helpful insights",
    safetyMeasures: [
      "90% non-promotional content ratio enforced",
      "48-72 hour gaps between posts in same subreddit",
      "Real-time subreddit rule checking before posting",
      "Human-like delays and behavior patterns"
    ],
    detectedTopics: detectedTopics,
    confidenceScore: calculateConfidenceScore(story, detectedType, detectedStage)
  };

  return automationPlan;
}

// Generate content strategy based on analysis
function generateContentStrategy(type, stage, goals, story) {
  const strategies = {
    'saas_building': "Share development journey, technical challenges overcome, and lessons learned. Focus on problem-solving discussions and seek community input on features.",
    'startup_beta': "Document beta testing process, share user feedback insights, and build authentic relationships with potential customers through helpful contributions.",
    'product_launched': "Share launch story, metrics (appropriately), and lessons learned. Help others facing similar challenges while building industry credibility."
  };

  const key = `${type}_${stage}`;
  return strategies[key] || strategies[`${type}_building`] || "Share authentic journey, provide valuable insights to community, and build genuine relationships through helpful participation.";
}

// Calculate confidence score for the analysis
function calculateConfidenceScore(story, type, stage) {
  let score = 50; // Base score
  
  // Story length bonus
  if (story.length > 200) score += 20;
  if (story.length > 500) score += 10;
  
  // Specific details bonus
  if (story.includes('%') || /\d+/.test(story)) score += 15; // Contains numbers/percentages
  if (story.includes('month') || story.includes('week')) score += 10; // Timeline details
  
  // Clear goals bonus
  if (story.includes('want') || story.includes('need') || story.includes('goal')) score += 10;
  
  return Math.min(score, 95); // Cap at 95%
}

// Validate settings against rulebook
function validateSettings(settings) {
  const rulebook = {
    maxPostsPerWeek: 3,
    maxCommentsPerDay: 20,
    minDelayBetweenPosts: 5 * 60 * 1000, // 5 minutes
    maxPromotionalRatio: 0.1 // 10%
  };

  return {
    maxPostsPerWeek: Math.min(settings.maxPostsPerWeek || 3, rulebook.maxPostsPerWeek),
    maxCommentsPerDay: Math.min(settings.maxCommentsPerDay || 8, rulebook.maxCommentsPerDay),
    engagementRatio: Math.max(settings.engagementRatio || 0.9, 0.9), // Minimum 90% non-promotional
    safetyChecks: true, // Always enabled
    humanLikeDelays: true, // Always enabled
    respectSubredditRules: true // Always enabled
  };
}

// Create automation session
async function createAutomationSession(userId, story, plan, settings) {
  return await prisma.automationSession.create({
    data: {
      userId: userId,
      story: story,
      automationPlan: JSON.stringify(plan),
      settings: JSON.stringify(settings),
      status: 'active',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
}

module.exports = router;