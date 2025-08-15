const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Random delay generator for Reddit API calls (1-5 minutes)
const getRandomDelay = () => {
  return Math.floor(Math.random() * 300000) + 60000; // 1-5 minutes in milliseconds
};

// Safety middleware for Reddit API endpoints
const safetyMiddleware = (action) => {
  return async (req, res, next) => {
    try {
      // Log the action attempt
      await prisma.activityLog.create({
        data: {
          userId: req.user?.id || 1, // Default user ID if not authenticated
          action: `Attempted ${action}`,
          timestamp: new Date()
        }
      });

      // Add random delay (1-5 minutes) for Reddit TOS compliance
      const delay = getRandomDelay();
      console.log(`Safety delay: ${delay/1000} seconds for ${action}`);
      
      setTimeout(() => {
        next();
      }, delay);

    } catch (error) {
      console.error('Safety middleware error:', error);
      
      // Log the error
      try {
        await prisma.activityLog.create({
          data: {
            userId: req.user?.id || 1,
            action: `Error in ${action}: ${error.message}`,
            timestamp: new Date()
          }
        });
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }

      res.status(500).json({ error: 'Safety middleware error' });
    }
  };
};

// Rate limiting configuration for Reddit API compliance (100 requests/minute)
const redditRateLimit = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many Reddit API requests, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
};

module.exports = {
  safetyMiddleware,
  redditRateLimit,
  getRandomDelay
};