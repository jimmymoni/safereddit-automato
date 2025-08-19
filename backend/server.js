const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '../.env' });

const { safetyMiddleware, redditRateLimit } = require('./middleware/safetyMiddleware');
const { checkAndRefreshToken, startTokenRefreshScheduler } = require('./middleware/tokenRefreshMiddleware');

// Import routes
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const aiRoutes = require('./routes/ai');
const autopilotRoutes = require('./routes/autopilot');
const redditRoutes = require('./routes/reddit');
const insightsRoutes = require('./routes/insights');
const scholarRoutes = require('./routes/scholar');
const monitoringRoutes = require('./routes/monitoring');
const savedOpportunitiesRoutes = require('./routes/savedOpportunities');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8000;

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));

// Global rate limiting
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalRateLimit);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.get('/api', (req, res) => {
  res.json({
    message: 'SafeReddit Automator API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      user: '/api/user/*',
      content: '/api/content/*',
      ai: '/api/ai/*',
      autopilot: '/api/autopilot/*',
      reddit: '/api/reddit/*',
      insights: '/api/insights/*',
      scholar: '/api/scholar/*'
    }
  });
});

// JWT token verification middleware for protected routes
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return next(); // Let routes handle missing tokens individually
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return next(); // Let routes handle invalid tokens individually
  }
};

// Mount routes with token refresh middleware for Reddit API routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/autopilot', autopilotRoutes);
app.use('/api/reddit', verifyToken, checkAndRefreshToken(), redditRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/scholar', verifyToken, checkAndRefreshToken(), scholarRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/saved-opportunities', savedOpportunitiesRoutes);

// User dashboard endpoint with safety middleware (real data with fallback)
app.get('/api/user/dashboard', safetyMiddleware('dashboard_fetch'), async (req, res) => {
  try {
    // Try to get real user data first
    let dashboardData;
    
    try {
      // Get JWT token from authorization header
      const token = req.header('Authorization')?.replace('Bearer ', '');
      let userId = null;
      
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      }
      
      if (userId) {
        // Fetch real user data from database and Reddit API
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            activityLogs: {
              orderBy: { createdAt: 'desc' },
              take: 10
            },
            contentItems: {
              where: {
                createdAt: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today
                }
              }
            }
          }
        });
        
        if (user && user.redditUsername) {
          // Get Reddit profile data
          const redditAPI = new (require('./services/redditAPI'))();
          let redditProfile = null;
          
          try {
            redditProfile = await redditAPI.getUserProfile(userId);
          } catch (redditError) {
            console.log('Reddit API unavailable, using stored data');
          }
          
          // Calculate today's stats from activity logs
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const todayLogs = user.activityLogs.filter(log => 
            new Date(log.createdAt) >= today
          );
          
          const todayStats = {
            postsScheduled: user.contentItems.filter(item => item.status === 'scheduled').length,
            commentsMade: todayLogs.filter(log => log.action === 'comment_submitted').length,
            upvotesGiven: todayLogs.filter(log => log.action === 'content_upvoted').length,
            karmaGained: redditProfile ? 
              (redditProfile.postKarma + redditProfile.commentKarma) - 
              (user.lastKarmaCheck || 0) : 0
          };
          
          // Format recent activity
          const recentActivity = user.activityLogs.slice(0, 5).map(log => ({
            id: log.id,
            action: formatActivityAction(log.action, log.target),
            timestamp: log.createdAt,
            result: log.result,
            karma: log.metadata?.karma || '0'
          }));
          
          // Calculate account age
          const accountAge = user.createdAt ? 
            Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0;
          
          dashboardData = {
            user: {
              username: `u/${user.redditUsername}`,
              postKarma: redditProfile?.postKarma || 0,
              commentKarma: redditProfile?.commentKarma || 0,
              accountAge: accountAge > 0 ? `${accountAge} months` : 'New account',
              personaHealth: calculatePersonaHealth(user, todayLogs)
            },
            todayStats,
            recentActivity
          };
        }
      }
    } catch (realDataError) {
      console.log('Could not fetch real data, using fallback:', realDataError.message);
    }
    
    // Fallback to mock data if real data fails
    if (!dashboardData) {
      console.log('Using fallback mock data for dashboard');
      dashboardData = {
        user: {
          username: 'u/demo_user',
          postKarma: 1247,
          commentKarma: 892,
          accountAge: '2 months',
          personaHealth: 78
        },
        todayStats: {
          postsScheduled: 3,
          commentsMade: 7,
          upvotesGiven: 24,
          karmaGained: 18
        },
        recentActivity: [
          {
            id: 1,
            action: 'Posted in r/productivity',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            result: 'success',
            karma: '+12'
          },
          {
            id: 2,
            action: 'Commented in r/entrepreneur',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            result: 'success',
            karma: '+5'
          },
          {
            id: 3,
            action: 'Auto-upvoted 3 posts',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
            result: 'success',
            karma: '0'
          }
        ]
      };
    }

    res.json({
      success: true,
      data: dashboardData,
      usingRealData: dashboardData.user.username !== 'u/demo_user'
    });

  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

// Helper function to format activity actions
function formatActivityAction(action, target) {
  switch (action) {
    case 'post_submitted':
      return `Posted in ${target}`;
    case 'comment_submitted':
      return `Commented in ${target}`;
    case 'content_upvoted':
      return `Upvoted content in ${target}`;
    default:
      return action;
  }
}

// Helper function to calculate persona health
function calculatePersonaHealth(user, todayLogs) {
  // Basic calculation based on recent activity and account status
  let health = 50; // Base score
  
  // Bonus for recent activity
  health += Math.min(todayLogs.length * 5, 30);
  
  // Bonus for successful actions
  const successfulActions = todayLogs.filter(log => log.result === 'success').length;
  health += successfulActions * 3;
  
  // Cap at 100
  return Math.min(health, 100);
}

// Note: Content vault endpoint is properly implemented in /routes/content.js
// The real endpoint is at /api/content/vault with proper authentication

// Trending content endpoint
app.get('/api/content/trending', (req, res) => {
  // Mock trending posts
  const mockTrending = [
    {
      id: 1,
      subreddit: 'r/entrepreneur',
      title: 'How I grew my SaaS to $10k MRR in 6 months without paid ads',
      author: 'u/startup_guy',
      score: 387,
      comments: 42,
      engagementScore: 85,
      potential: 'high',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
    },
    {
      id: 2,
      subreddit: 'r/productivity',
      title: 'The 5 AM club changed my life - here\'s what happened',
      author: 'u/early_riser',
      score: 234,
      comments: 28,
      engagementScore: 72,
      potential: 'medium',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
    }
  ];

  res.json({
    success: true,
    data: mockTrending
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SafeReddit Automator API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Frontend URL: http://localhost:3000`);
  console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Start automatic token refresh scheduler
  startTokenRefreshScheduler();
  console.log(`🔄 Token refresh scheduler started`);
});

module.exports = app;