const { PrismaClient } = require('@prisma/client');
const RedditAuthService = require('./redditAuth');
const KimiAIService = require('./kimiAI');
const { getRandomDelay } = require('../middleware/safetyMiddleware');

const prisma = new PrismaClient();

class AutopilotEngine {
  constructor() {
    this.redditAuth = new RedditAuthService();
    this.aiService = new KimiAIService();
    this.isRunning = false;
    this.activeUsers = new Map(); // userId -> autopilot session
    this.actionQueue = new Map(); // userId -> action queue
    this.intervalHandlers = new Map(); // userId -> interval handler
  }

  /**
   * Start autopilot for a user
   */
  async startAutopilot(userId, settings = {}) {
    try {
      if (this.activeUsers.has(userId)) {
        throw new Error('Autopilot already running for this user');
      }

      // Validate user and Reddit authentication
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

      if (!user.redditToken || (user.redditTokenExpiry && user.redditTokenExpiry < new Date())) {
        throw new Error('Reddit authentication required or expired');
      }

      // Check account health before starting
      const healthCheck = await this.redditAuth.checkAccountHealth(userId);
      if (healthCheck.healthScore < 50) {
        throw new Error(`Account health too low (${healthCheck.healthScore}/100). Please wait before resuming automation.`);
      }

      // Create autopilot session
      const autopilotSession = await prisma.autopilotSession.create({
        data: {
          userId,
          mode: settings.riskLevel || 'balanced',
          settings: {
            ...user.autopilotSettings,
            ...settings,
            startedAt: new Date()
          },
          isActive: true
        }
      });

      // Initialize action queue for user
      this.actionQueue.set(userId, []);

      // Store active session
      this.activeUsers.set(userId, {
        sessionId: autopilotSession.id,
        settings: autopilotSession.settings,
        reddit: await this.redditAuth.getRedditInstance(userId),
        lastAction: new Date(),
        healthScore: healthCheck.healthScore
      });

      // Generate initial content actions
      await this.populateActionQueue(userId);

      // Start the autopilot loop
      this.startAutopilotLoop(userId);

      // Log autopilot start
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'autopilot_started',
          result: 'success',
          metadata: {
            sessionId: autopilotSession.id,
            healthScore: healthCheck.healthScore,
            settings: autopilotSession.settings
          }
        }
      });

      return {
        sessionId: autopilotSession.id,
        status: 'active',
        healthScore: healthCheck.healthScore,
        message: 'Autopilot started successfully'
      };

    } catch (error) {
      console.error('Error starting autopilot:', error);
      
      // Log error
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'autopilot_start_failed',
          result: 'failed',
          metadata: { error: error.message }
        }
      });

      throw error;
    }
  }

  /**
   * Stop autopilot for a user
   */
  async stopAutopilot(userId) {
    try {
      if (!this.activeUsers.has(userId)) {
        throw new Error('No active autopilot session for this user');
      }

      const session = this.activeUsers.get(userId);

      // Clear interval handler
      if (this.intervalHandlers.has(userId)) {
        clearInterval(this.intervalHandlers.get(userId));
        this.intervalHandlers.delete(userId);
      }

      // Update session status
      await prisma.autopilotSession.update({
        where: { id: session.sessionId },
        data: {
          isActive: false,
          endedAt: new Date()
        }
      });

      // Clean up active session
      this.activeUsers.delete(userId);
      this.actionQueue.delete(userId);

      // Log autopilot stop
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'autopilot_stopped',
          result: 'success',
          metadata: { sessionId: session.sessionId }
        }
      });

      return {
        message: 'Autopilot stopped successfully'
      };

    } catch (error) {
      console.error('Error stopping autopilot:', error);
      throw error;
    }
  }

  /**
   * Get autopilot status for a user
   */
  async getAutopilotStatus(userId) {
    try {
      const isActive = this.activeUsers.has(userId);
      const queueLength = this.actionQueue.get(userId)?.length || 0;

      // Get latest session
      const latestSession = await prisma.autopilotSession.findFirst({
        where: { userId },
        orderBy: { startedAt: 'desc' }
      });

      // Get recent activity
      const recentActivity = await prisma.activityLog.findMany({
        where: {
          userId,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 10
      });

      // Get account health
      const healthCheck = await this.redditAuth.checkAccountHealth(userId);

      return {
        isActive,
        sessionId: latestSession?.id,
        status: latestSession?.status || 'inactive',
        queueLength,
        healthScore: healthCheck.healthScore,
        riskLevel: healthCheck.riskLevel,
        actionsToday: recentActivity.length,
        lastActivity: latestSession?.lastActivity,
        recommendations: healthCheck.recommendations
      };

    } catch (error) {
      console.error('Error getting autopilot status:', error);
      throw error;
    }
  }

  /**
   * Add action to user's queue
   */
  async addActionToQueue(userId, action) {
    try {
      if (!this.actionQueue.has(userId)) {
        this.actionQueue.set(userId, []);
      }

      const queue = this.actionQueue.get(userId);
      
      // Validate action structure
      const validatedAction = {
        id: Date.now().toString(),
        type: action.type, // 'post', 'comment', 'vote'
        data: action.data,
        priority: action.priority || 'normal',
        scheduledFor: action.scheduledFor || new Date(),
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date()
      };

      queue.push(validatedAction);

      // Sort by priority and scheduled time
      queue.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(a.scheduledFor) - new Date(b.scheduledFor);
      });

      return validatedAction;

    } catch (error) {
      console.error('Error adding action to queue:', error);
      throw error;
    }
  }

  /**
   * Get user's action queue
   */
  getActionQueue(userId) {
    return this.actionQueue.get(userId) || [];
  }

  /**
   * Remove action from queue
   */
  removeActionFromQueue(userId, actionId) {
    if (!this.actionQueue.has(userId)) {
      return false;
    }

    const queue = this.actionQueue.get(userId);
    const index = queue.findIndex(action => action.id === actionId);
    
    if (index > -1) {
      queue.splice(index, 1);
      return true;
    }
    
    return false;
  }

  /**
   * Update autopilot settings
   */
  async updateSettings(userId, newSettings) {
    try {
      // Update settings in user profile
      await prisma.user.update({
        where: { id: userId },
        data: {
          autopilotSettings: newSettings
        }
      });

      // Update active session settings if running
      if (this.activeUsers.has(userId)) {
        const session = this.activeUsers.get(userId);
        session.settings = { ...session.settings, ...newSettings };
        this.activeUsers.set(userId, session);

        // Update session in database
        await prisma.autopilotSession.update({
          where: { id: session.sessionId },
          data: {
            settings: session.settings
          }
        });
      }

      return { message: 'Settings updated successfully' };

    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  /**
   * Main autopilot loop for a user
   */
  startAutopilotLoop(userId) {
    const checkInterval = 30000; // Check every 30 seconds

    const intervalHandler = setInterval(async () => {
      try {
        await this.processUserActions(userId);
      } catch (error) {
        console.error(`Autopilot loop error for user ${userId}:`, error);
        
        // If critical error, stop autopilot
        if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
          console.log(`Stopping autopilot for user ${userId} due to auth error`);
          await this.stopAutopilot(userId);
        }
      }
    }, checkInterval);

    this.intervalHandlers.set(userId, intervalHandler);
  }

  /**
   * Process actions for a specific user
   */
  async processUserActions(userId) {
    if (!this.activeUsers.has(userId)) {
      return;
    }

    const session = this.activeUsers.get(userId);
    
    // First, populate queue with AI-generated content if needed
    await this.populateActionQueue(userId);
    
    const queue = this.actionQueue.get(userId) || [];

    // Check if we should process actions (respect delays)
    const timeSinceLastAction = Date.now() - session.lastAction.getTime();
    const minDelay = 10 * 60 * 1000; // 10 minutes minimum between actions

    if (timeSinceLastAction < minDelay) {
      return; // Too soon since last action
    }

    // Check account health before processing
    const healthCheck = await this.redditAuth.checkAccountHealth(userId);
    if (healthCheck.healthScore < 30) {
      console.log(`Pausing autopilot for user ${userId} - low health score: ${healthCheck.healthScore}`);
      return;
    }

    // Find next action to process
    const now = new Date();
    const actionToProcess = queue.find(action => 
      action.scheduledFor <= now && action.attempts < action.maxAttempts
    );

    if (!actionToProcess) {
      return; // No actions ready to process
    }

    try {
      await this.executeAction(userId, actionToProcess);
      
      // Remove successful action from queue
      this.removeActionFromQueue(userId, actionToProcess.id);
      
      // Update last action time
      session.lastAction = new Date();
      this.activeUsers.set(userId, session);

      // Update session in database  
      await prisma.autopilotSession.update({
        where: { id: session.sessionId },
        data: { 
          settings: {
            ...session.settings,
            lastActivity: new Date()
          }
        }
      });

    } catch (error) {
      console.error(`Error executing action for user ${userId}:`, error);
      
      // Increment attempt count
      actionToProcess.attempts++;
      
      if (actionToProcess.attempts >= actionToProcess.maxAttempts) {
        // Remove failed action after max attempts
        this.removeActionFromQueue(userId, actionToProcess.id);
        
        // Log failed action
        await prisma.activityLog.create({
          data: {
            userId,
            action: `${actionToProcess.type}_failed_final`,
            result: 'failed',
            metadata: {
              actionId: actionToProcess.id,
              error: error.message,
              attempts: actionToProcess.attempts
            }
          }
        });
      }
    }
  }

  /**
   * Execute a specific action
   */
  async executeAction(userId, action) {
    const session = this.activeUsers.get(userId);
    const reddit = session.reddit;

    // Add safety delay before Reddit API call
    const delay = getRandomDelay();
    console.log(`Safety delay: ${delay/1000} seconds for ${action.type}`);
    await new Promise(resolve => setTimeout(resolve, delay));

    let result;

    switch (action.type) {
      case 'post':
        result = await this.submitPost(reddit, action.data);
        break;
      case 'comment':
        result = await this.submitComment(reddit, action.data);
        break;
      case 'vote':
        result = await this.submitVote(reddit, action.data);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }

    // Log successful action
    await prisma.activityLog.create({
      data: {
        userId,
        action: `${action.type}_success`,
        target: result.id || result.url,
        result: 'success',
        metadata: {
          actionId: action.id,
          ...result
        }
      }
    });

    return result;
  }

  /**
   * Submit a post to Reddit
   */
  async submitPost(reddit, postData) {
    const { subreddit, title, text, url } = postData;

    let submission;
    if (url) {
      submission = await reddit.getSubreddit(subreddit).submitLink({
        title,
        url
      });
    } else {
      submission = await reddit.getSubreddit(subreddit).submitSelfpost({
        title,
        text: text || ''
      });
    }

    return {
      id: submission.id,
      url: submission.url,
      permalink: submission.permalink,
      subreddit: submission.subreddit.display_name
    };
  }

  /**
   * Submit a comment to Reddit
   */
  async submitComment(reddit, commentData) {
    const { postId, text } = commentData;

    const comment = await reddit.getSubmission(postId).reply(text);

    return {
      id: comment.id,
      permalink: comment.permalink,
      parent_id: postId
    };
  }

  /**
   * Submit a vote on Reddit
   */
  async submitVote(reddit, voteData) {
    const { itemId, voteType } = voteData; // voteType: 1 (upvote), -1 (downvote), 0 (no vote)

    let item;
    if (itemId.startsWith('t1_')) {
      // Comment
      item = await reddit.getComment(itemId);
    } else if (itemId.startsWith('t3_')) {
      // Submission
      item = await reddit.getSubmission(itemId);
    } else {
      throw new Error('Invalid item ID format');
    }

    if (voteType === 1) {
      await item.upvote();
    } else if (voteType === -1) {
      await item.downvote();
    } else {
      await item.unvote();
    }

    return {
      id: itemId,
      voteType,
      action: voteType === 1 ? 'upvoted' : voteType === -1 ? 'downvoted' : 'unvoted'
    };
  }

  /**
   * Get all active autopilot sessions
   */
  getActiveSessions() {
    const sessions = [];
    for (const [userId, session] of this.activeUsers.entries()) {
      sessions.push({
        userId,
        sessionId: session.sessionId,
        lastAction: session.lastAction,
        healthScore: session.healthScore,
        queueLength: this.actionQueue.get(userId)?.length || 0
      });
    }
    return sessions;
  }

  /**
   * Generate content-based actions using AI
   */
  async generateContentActions(userId, session) {
    try {
      const { settings } = session;
      const contentStrategy = settings.contentStrategy;
      
      if (!contentStrategy || !contentStrategy.userPrompt) {
        console.log(`No content strategy found for user ${userId}`);
        return [];
      }

      const actions = [];
      const targetSubreddits = contentStrategy.targetSubreddits || settings.targetSubreddits || ['productivity'];
      
      // Generate posts based on strategy
      if (settings.autoPost && settings.maxPostsPerDay > 0) {
        for (let i = 0; i < Math.min(2, settings.maxPostsPerDay); i++) {
          const subreddit = targetSubreddits[Math.floor(Math.random() * targetSubreddits.length)];
          
          try {
            // Create AI prompt based on user's content strategy
            const prompt = `${contentStrategy.userPrompt}\n\nTarget audience: ${contentStrategy.targetNiches?.join(', ') || 'general'}\nSubreddit: r/${subreddit}\nContent type: ${contentStrategy.postTypes?.[0] || 'discussion'}\nTone: ${contentStrategy.contentTone || 'engaging'}\n\nCreate a valuable, authentic post that would resonate with this community.`;
            
            const aiResult = await this.aiService.generatePost(prompt, {
              subreddit: subreddit,
              contentType: contentStrategy.postTypes?.[0] || 'text',
              tone: contentStrategy.contentTone || 'engaging',
              maxTokens: 400
            });

            if (aiResult && aiResult.content) {
              // Extract title and content from AI response
              const content = aiResult.content;
              const lines = content.split('\n').filter(line => line.trim());
              const title = lines[0]?.replace(/^(Title:|Post:|#)\s*/i, '').trim() || 'Interesting Discussion';
              const text = lines.slice(1).join('\n').trim() || content;

              actions.push({
                type: 'post',
                data: {
                  subreddit: subreddit,
                  title: title.substring(0, 300), // Reddit title limit
                  text: text.substring(0, 10000), // Reddit text limit
                  contentStrategy: {
                    generatedBy: 'ai',
                    prompt: contentStrategy.userPrompt,
                    tone: contentStrategy.contentTone
                  }
                },
                priority: 'normal',
                scheduledFor: new Date(Date.now() + (i + 1) * settings.postFrequency * 60 * 1000)
              });
            }
          } catch (error) {
            console.error(`Error generating AI content for user ${userId}:`, error);
          }
        }
      }

      // Log AI content generation
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'ai_content_generated',
          result: 'success',
          metadata: {
            actionsGenerated: actions.length,
            strategy: contentStrategy.userPrompt.substring(0, 100)
          }
        }
      });

      return actions;
    } catch (error) {
      console.error(`Error generating content actions for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Populate action queue with AI-generated content
   */
  async populateActionQueue(userId) {
    try {
      if (!this.activeUsers.has(userId)) {
        return;
      }

      const session = this.activeUsers.get(userId);
      const currentQueue = this.actionQueue.get(userId) || [];
      
      // Only generate new content if queue is getting low
      if (currentQueue.length < 2) {
        const newActions = await this.generateContentActions(userId, session);
        
        for (const action of newActions) {
          await this.addActionToQueue(userId, action);
        }
        
        console.log(`Generated ${newActions.length} new actions for user ${userId}`);
      }
    } catch (error) {
      console.error(`Error populating action queue for user ${userId}:`, error);
    }
  }

  /**
   * Emergency stop all autopilot sessions
   */
  async emergencyStopAll() {
    const promises = [];
    for (const userId of this.activeUsers.keys()) {
      promises.push(this.stopAutopilot(userId));
    }
    await Promise.all(promises);
    return { message: 'All autopilot sessions stopped' };
  }
}

module.exports = AutopilotEngine;