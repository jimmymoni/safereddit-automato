const snoowrap = require('snoowrap');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

class RedditAuthService {
  constructor() {
    this.clientId = process.env.REDDIT_CLIENT_ID;
    this.clientSecret = process.env.REDDIT_CLIENT_SECRET;
    this.redirectUri = process.env.REDDIT_REDIRECT_URI || 'http://localhost:8000/api/auth/reddit/callback';
    this.userAgent = 'SafeRedditAutomator/1.0.0 by SafeRedditBot';
  }

  /**
   * Generate Reddit OAuth URL for user authorization
   */
  getAuthorizationUrl() {
    const scopes = ['identity', 'read', 'submit', 'vote', 'edit', 'history', 'mysubreddits'];
    const state = this.generateRandomString(32); // CSRF protection
    
    const authUrl = snoowrap.getAuthUrl({
      clientId: this.clientId,
      scope: scopes,
      redirectUri: this.redirectUri,
      permanent: true, // Request permanent access
      state: state
    });

    return {
      authUrl,
      state
    };
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code, state) {
    try {
      // Verify state parameter (CSRF protection)
      if (!state) {
        throw new Error('Missing state parameter');
      }

      // Create Reddit instance to get access token
      const reddit = await snoowrap.fromAuthCode({
        code: code,
        userAgent: this.userAgent,
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        redirectUri: this.redirectUri
      });

      // Get user information
      const redditUser = await reddit.getMe();
      
      return {
        reddit,
        user: {
          username: redditUser.name,
          id: redditUser.id,
          postKarma: redditUser.link_karma,
          commentKarma: redditUser.comment_karma,
          createdUtc: redditUser.created_utc,
          isGold: redditUser.is_gold,
          hasVerifiedEmail: redditUser.has_verified_email
        },
        accessToken: reddit.accessToken,
        refreshToken: reddit.refreshToken
      };

    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw new Error('Failed to authenticate with Reddit: ' + error.message);
    }
  }

  /**
   * Store Reddit credentials in database
   */
  async storeUserCredentials(email, redditAuthData) {
    try {
      const { user: redditUser, accessToken, refreshToken } = redditAuthData;
      
      // Calculate token expiry (Reddit tokens typically last 1 hour)
      const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

      const user = await prisma.user.upsert({
        where: { email },
        update: {
          redditUsername: redditUser.username,
          redditToken: accessToken,
          redditRefreshToken: refreshToken,
          redditTokenExpiry: tokenExpiry,
          postKarma: redditUser.postKarma,
          commentKarma: redditUser.commentKarma,
          updatedAt: new Date()
        },
        create: {
          email,
          redditUsername: redditUser.username,
          redditToken: accessToken,
          redditRefreshToken: refreshToken,
          redditTokenExpiry: tokenExpiry,
          postKarma: redditUser.postKarma,
          commentKarma: redditUser.commentKarma,
          settings: {
            redditAccountCreated: redditUser.createdUtc,
            isGold: redditUser.isGold,
            hasVerifiedEmail: redditUser.hasVerifiedEmail
          }
        }
      });

      // Log the authentication event
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'reddit_auth_success',
          target: redditUser.username,
          result: 'success',
          metadata: {
            postKarma: redditUser.postKarma,
            commentKarma: redditUser.commentKarma,
            accountAge: redditUser.createdUtc
          }
        }
      });

      return user;

    } catch (error) {
      console.error('Error storing user credentials:', error);
      throw new Error('Failed to store user credentials: ' + error.message);
    }
  }

  /**
   * Create JWT token for authenticated user
   */
  createJwtToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      redditUsername: user.redditUsername
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });
  }

  /**
   * Refresh Reddit access token
   */
  async refreshRedditToken(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || !user.redditRefreshToken) {
        throw new Error('No refresh token available');
      }

      // Create a new snoowrap instance with refresh token
      // snoowrap will automatically handle token refresh
      const reddit = new snoowrap({
        userAgent: this.userAgent,
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        refreshToken: user.redditRefreshToken
      });

      // Make a simple API call to trigger token refresh if needed
      await reddit.getMe();

      // Update token expiry in database (snoowrap handles the actual token internally)
      const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
      
      await prisma.user.update({
        where: { id: userId },
        data: {
          redditTokenExpiry: tokenExpiry,
          updatedAt: new Date()
        }
      });

      return reddit; // Return the reddit instance instead of just token

    } catch (error) {
      console.error('Error refreshing Reddit token:', error);
      throw new Error('Failed to refresh Reddit token: ' + error.message);
    }
  }

  /**
   * Get authenticated Reddit instance for user
   */
  async getRedditInstance(userId) {
    try {
      console.log('Getting Reddit instance for user ID:', userId);
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        console.log('User not found in database:', userId);
        throw new Error('User not found');
      }

      console.log('User found:', {
        id: user.id,
        email: user.email,
        redditUsername: user.redditUsername,
        hasRedditToken: !!user.redditToken,
        hasRefreshToken: !!user.redditRefreshToken,
        tokenExpiry: user.redditTokenExpiry
      });

      // If user has a refresh token, use that for a more reliable connection
      if (user.redditRefreshToken) {
        const reddit = new snoowrap({
          userAgent: this.userAgent,
          clientId: this.clientId,
          clientSecret: this.clientSecret,
          refreshToken: user.redditRefreshToken
        });

        return reddit;
      }

      // Fallback to access token if no refresh token
      if (!user.redditToken) {
        throw new Error('User not authenticated with Reddit');
      }

      // Check if token is expired
      if (user.redditTokenExpiry && user.redditTokenExpiry < new Date()) {
        throw new Error('Reddit token expired and no refresh token available');
      }

      const reddit = new snoowrap({
        userAgent: this.userAgent,
        accessToken: user.redditToken
      });

      return reddit;

    } catch (error) {
      console.error('Error getting Reddit instance:', error);
      throw new Error('Failed to get Reddit instance: ' + error.message);
    }
  }

  /**
   * Verify JWT token and get user
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          activityLogs: {
            take: 10,
            orderBy: { timestamp: 'desc' }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;

    } catch (error) {
      console.error('Error verifying token:', error);
      throw new Error('Invalid token');
    }
  }

  /**
   * Generate random string for CSRF protection
   */
  generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  /**
   * Check user account health and Reddit compliance
   */
  async checkAccountHealth(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          activityLogs: {
            where: {
              timestamp: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
              }
            },
            orderBy: { timestamp: 'desc' }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate health metrics
      const todayLogs = user.activityLogs;
      const successfulActions = todayLogs.filter(log => log.result === 'success').length;
      const failedActions = todayLogs.filter(log => log.result === 'failed').length;
      const totalActions = todayLogs.length;

      let healthScore = user.accountHealth;

      // Adjust health based on recent activity
      if (totalActions > 0) {
        const successRate = successfulActions / totalActions;
        
        if (successRate > 0.8) {
          healthScore = Math.min(100, healthScore + 2); // Increase health
        } else if (successRate < 0.5) {
          healthScore = Math.max(0, healthScore - 5); // Decrease health
        }
      }

      // Check for potential red flags
      const postActions = todayLogs.filter(log => log.action.includes('post')).length;
      const commentActions = todayLogs.filter(log => log.action.includes('comment')).length;
      
      // Too many posts relative to comments is risky
      if (postActions > 5 && commentActions < postActions) {
        healthScore = Math.max(0, healthScore - 3);
      }

      // Update health score
      if (healthScore !== user.accountHealth) {
        await prisma.user.update({
          where: { id: userId },
          data: { accountHealth: healthScore }
        });
      }

      return {
        healthScore: Math.round(healthScore),
        todayActions: totalActions,
        successRate: totalActions > 0 ? Math.round((successfulActions / totalActions) * 100) : 100,
        riskLevel: healthScore > 80 ? 'low' : healthScore > 60 ? 'medium' : 'high',
        recommendations: this.getHealthRecommendations(healthScore, todayLogs)
      };

    } catch (error) {
      console.error('Error checking account health:', error);
      throw new Error('Failed to check account health: ' + error.message);
    }
  }

  /**
   * Get health-based recommendations
   */
  getHealthRecommendations(healthScore, recentLogs) {
    const recommendations = [];

    if (healthScore < 50) {
      recommendations.push('Account health is low. Consider reducing activity for 24-48 hours.');
    }

    const postCount = recentLogs.filter(log => log.action.includes('post')).length;
    const commentCount = recentLogs.filter(log => log.action.includes('comment')).length;

    if (postCount > commentCount * 2) {
      recommendations.push('Post-to-comment ratio is high. Increase commenting to maintain natural behavior.');
    }

    if (recentLogs.length > 50) {
      recommendations.push('High activity detected. Consider spacing actions further apart.');
    }

    return recommendations;
  }
}

module.exports = RedditAuthService;