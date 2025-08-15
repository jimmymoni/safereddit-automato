const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '../.env' });

const { safetyMiddleware, redditRateLimit } = require('./middleware/safetyMiddleware');

// Import routes
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const aiRoutes = require('./routes/ai');
const autopilotRoutes = require('./routes/autopilot');
const redditRoutes = require('./routes/reddit');
const insightsRoutes = require('./routes/insights');

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
    : ['http://localhost:3000', 'http://localhost:3001'],
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
      insights: '/api/insights/*'
    }
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/autopilot', autopilotRoutes);
app.use('/api/reddit', redditRoutes);
app.use('/api/insights', insightsRoutes);

// User dashboard endpoint with safety middleware
app.get('/api/user/dashboard', safetyMiddleware('dashboard_fetch'), async (req, res) => {
  try {
    // Mock data for now - will be replaced with real user data
    const mockData = {
      user: {
        username: 'u/automator',
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
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          result: 'success',
          karma: '+12'
        },
        {
          id: 2,
          action: 'Commented in r/entrepreneur',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          result: 'success',
          karma: '+5'
        },
        {
          id: 3,
          action: 'Auto-upvoted 3 posts',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          result: 'success',
          karma: '0'
        }
      ]
    };

    res.json({
      success: true,
      data: mockData
    });

  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

// Content management endpoints
app.get('/api/content/vault', (req, res) => {
  // Mock content vault data
  const mockContent = [
    {
      id: 1,
      title: '5 productivity hacks that changed my life',
      content: 'These simple strategies helped me double my output and reduce stress levels significantly...',
      tags: ['productivity', 'life-hacks'],
      status: 'ready',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      type: 'post'
    },
    {
      id: 2,
      title: 'Best tools for entrepreneurs',
      content: 'After trying dozens of tools, here are the ones that actually matter...',
      tags: ['entrepreneurship', 'tools'],
      status: 'ready',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      type: 'post'
    }
  ];

  res.json({
    success: true,
    data: mockContent
  });
});

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
});

module.exports = app;