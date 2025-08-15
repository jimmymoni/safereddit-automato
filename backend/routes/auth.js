const express = require('express');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const RedditAuthService = require('../services/redditAuth');

const router = express.Router();
const prisma = new PrismaClient();
const authService = new RedditAuthService();

// Rate limiting for auth routes
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  }
});

/**
 * @route GET /api/auth/reddit
 * @desc Start Reddit OAuth flow
 * @access Public
 */
router.get('/reddit', authRateLimit, async (req, res) => {
  try {
    const { authUrl, state } = authService.getAuthorizationUrl();
    
    // Store state in session or return it for client-side storage
    res.cookie('reddit_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1000 // 10 minutes
    });

    res.json({
      success: true,
      authUrl,
      message: 'Redirect user to authUrl to complete Reddit authentication'
    });

  } catch (error) {
    console.error('Reddit OAuth initiation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate Reddit authentication',
      message: error.message
    });
  }
});

/**
 * @route GET /api/auth/reddit/callback
 * @desc Handle Reddit OAuth callback
 * @access Public
 */
router.get('/reddit/callback', authRateLimit, async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;

    // Check for OAuth errors
    if (oauthError) {
      return res.status(400).json({
        success: false,
        error: 'Reddit OAuth error',
        message: oauthError === 'access_denied' ? 'User denied access' : oauthError
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Missing authorization code',
        message: 'No authorization code provided by Reddit'
      });
    }

    // Verify state parameter (CSRF protection)
    const expectedState = req.cookies.reddit_oauth_state;
    if (!expectedState || expectedState !== state) {
      return res.status(400).json({
        success: false,
        error: 'Invalid state parameter',
        message: 'CSRF token mismatch'
      });
    }

    // Clear state cookie
    res.clearCookie('reddit_oauth_state');

    // Exchange code for token
    const redditAuthData = await authService.exchangeCodeForToken(code, state);
    
    // For this demo, we'll use the Reddit username as the email
    // In production, you'd want to collect email separately
    const email = `${redditAuthData.user.username}@reddit.local`;
    
    // Store credentials in database
    const user = await authService.storeUserCredentials(email, redditAuthData);
    
    // Create JWT token
    const jwtToken = authService.createJwtToken(user);

    // In production, you'd redirect to frontend with token
    // For now, return JSON response
    res.json({
      success: true,
      message: 'Reddit authentication successful',
      user: {
        id: user.id,
        email: user.email,
        redditUsername: user.redditUsername,
        postKarma: user.postKarma,
        commentKarma: user.commentKarma,
        accountHealth: user.accountHealth
      },
      token: jwtToken,
      redirectUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    });

  } catch (error) {
    console.error('Reddit OAuth callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/auth/verify
 * @desc Verify JWT token and get user info
 * @access Private
 */
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token required',
        message: 'JWT token is required for verification'
      });
    }

    const user = await authService.verifyToken(token);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        redditUsername: user.redditUsername,
        postKarma: user.postKarma,
        commentKarma: user.commentKarma,
        accountHealth: user.accountHealth,
        createdAt: user.createdAt
      },
      message: 'Token verified successfully'
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: error.message
    });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Get current user info (requires authentication)
 * @access Private
 */
router.get('/me', async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        message: 'Authorization header with Bearer token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const user = await authService.verifyToken(token);
    
    // Check account health
    const healthCheck = await authService.checkAccountHealth(user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        redditUsername: user.redditUsername,
        postKarma: user.postKarma,
        commentKarma: user.commentKarma,
        accountHealth: user.accountHealth,
        createdAt: user.createdAt,
        autopilotSettings: user.autopilotSettings
      },
      healthCheck,
      recentActivity: user.activityLogs.map(log => ({
        id: log.id,
        action: log.action,
        target: log.target,
        result: log.result,
        karmaChange: log.karmaChange,
        timestamp: log.timestamp
      }))
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh Reddit access token
 * @access Private
 */
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const user = await authService.verifyToken(token);
    
    const newAccessToken = await authService.refreshRedditToken(user.id);
    
    res.json({
      success: true,
      message: 'Reddit token refreshed successfully',
      redditTokenExpiry: new Date(Date.now() + 60 * 60 * 1000)
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token',
      message: error.message
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user (revoke tokens)
 * @access Private
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const user = await authService.verifyToken(token);
    
    // Clear Reddit tokens from database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        redditToken: null,
        redditRefreshToken: null,
        redditTokenExpiry: null
      }
    });

    // Log logout event
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'logout',
        result: 'success'
      }
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: error.message
    });
  }
});

module.exports = router;