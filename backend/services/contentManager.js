const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ContentManagerService {
  /**
   * Create new content item
   */
  async createContentItem(userId, contentData) {
    try {
      const { title, content, contentType, tags, subreddits } = contentData;
      
      const contentItem = await prisma.contentItem.create({
        data: {
          userId,
          title,
          content,
          contentType: contentType || 'post',
          tags: tags || [],
          subreddits: subreddits || [],
          status: 'draft'
        }
      });

      // Log content creation
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'content_created',
          target: title,
          result: 'success',
          metadata: {
            contentType,
            contentId: contentItem.id
          }
        }
      });

      return contentItem;

    } catch (error) {
      console.error('Error creating content item:', error);
      throw new Error('Failed to create content item: ' + error.message);
    }
  }

  /**
   * Get user's content items with filtering
   */
  async getUserContent(userId, filters = {}) {
    try {
      const { status, contentType, tags, search, limit = 50, offset = 0 } = filters;
      
      const where = {
        userId,
        ...(status && { status }),
        ...(contentType && { contentType }),
        ...(tags && tags.length > 0 && {
          tags: {
            hasSome: tags
          }
        }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } }
          ]
        })
      };

      const contentItems = await prisma.contentItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      });

      const totalCount = await prisma.contentItem.count({ where });

      return {
        items: contentItems,
        totalCount,
        hasMore: offset + limit < totalCount
      };

    } catch (error) {
      console.error('Error getting user content:', error);
      throw new Error('Failed to get content items: ' + error.message);
    }
  }

  /**
   * Update content item
   */
  async updateContentItem(userId, contentId, updateData) {
    try {
      // Verify ownership
      const existingContent = await prisma.contentItem.findFirst({
        where: { id: parseInt(contentId), userId }
      });

      if (!existingContent) {
        throw new Error('Content item not found or access denied');
      }

      const updatedContent = await prisma.contentItem.update({
        where: { id: parseInt(contentId) },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      });

      // Log content update
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'content_updated',
          target: updatedContent.title,
          result: 'success',
          metadata: {
            contentId: updatedContent.id,
            changes: Object.keys(updateData)
          }
        }
      });

      return updatedContent;

    } catch (error) {
      console.error('Error updating content item:', error);
      throw new Error('Failed to update content item: ' + error.message);
    }
  }

  /**
   * Delete content item
   */
  async deleteContentItem(userId, contentId) {
    try {
      // Verify ownership
      const existingContent = await prisma.contentItem.findFirst({
        where: { id: parseInt(contentId), userId }
      });

      if (!existingContent) {
        throw new Error('Content item not found or access denied');
      }

      await prisma.contentItem.delete({
        where: { id: parseInt(contentId) }
      });

      // Log content deletion
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'content_deleted',
          target: existingContent.title,
          result: 'success',
          metadata: {
            contentId: parseInt(contentId)
          }
        }
      });

      return { success: true, message: 'Content item deleted successfully' };

    } catch (error) {
      console.error('Error deleting content item:', error);
      throw new Error('Failed to delete content item: ' + error.message);
    }
  }

  /**
   * Schedule post for later publishing
   */
  async schedulePost(userId, scheduleData) {
    try {
      const { 
        contentItemId, 
        subreddit, 
        title, 
        content, 
        postType = 'text', 
        scheduledFor 
      } = scheduleData;

      // Validate scheduled time
      const scheduledDate = new Date(scheduledFor);
      if (scheduledDate <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }

      const scheduledPost = await prisma.scheduledPost.create({
        data: {
          userId,
          contentItemId: contentItemId || null,
          subreddit,
          title,
          content,
          postType,
          scheduledFor: scheduledDate
        }
      });

      // Log scheduling
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'post_scheduled',
          target: subreddit,
          result: 'success',
          metadata: {
            scheduledPostId: scheduledPost.id,
            scheduledFor: scheduledDate,
            title
          }
        }
      });

      return scheduledPost;

    } catch (error) {
      console.error('Error scheduling post:', error);
      throw new Error('Failed to schedule post: ' + error.message);
    }
  }

  /**
   * Get user's scheduled posts
   */
  async getScheduledPosts(userId, filters = {}) {
    try {
      const { status, subreddit, limit = 50, offset = 0 } = filters;
      
      const where = {
        userId,
        ...(status && { status }),
        ...(subreddit && { subreddit })
      };

      const scheduledPosts = await prisma.scheduledPost.findMany({
        where,
        orderBy: { scheduledFor: 'asc' },
        take: parseInt(limit),
        skip: parseInt(offset),
        include: {
          user: {
            select: {
              redditUsername: true
            }
          }
        }
      });

      const totalCount = await prisma.scheduledPost.count({ where });

      return {
        posts: scheduledPosts,
        totalCount,
        hasMore: offset + limit < totalCount
      };

    } catch (error) {
      console.error('Error getting scheduled posts:', error);
      throw new Error('Failed to get scheduled posts: ' + error.message);
    }
  }

  /**
   * Cancel scheduled post
   */
  async cancelScheduledPost(userId, scheduledPostId) {
    try {
      // Verify ownership
      const scheduledPost = await prisma.scheduledPost.findFirst({
        where: { id: parseInt(scheduledPostId), userId }
      });

      if (!scheduledPost) {
        throw new Error('Scheduled post not found or access denied');
      }

      if (scheduledPost.status === 'posted') {
        throw new Error('Cannot cancel a post that has already been posted');
      }

      await prisma.scheduledPost.update({
        where: { id: parseInt(scheduledPostId) },
        data: { status: 'cancelled' }
      });

      // Log cancellation
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'post_cancelled',
          target: scheduledPost.subreddit,
          result: 'success',
          metadata: {
            scheduledPostId: parseInt(scheduledPostId),
            title: scheduledPost.title
          }
        }
      });

      return { success: true, message: 'Scheduled post cancelled successfully' };

    } catch (error) {
      console.error('Error cancelling scheduled post:', error);
      throw new Error('Failed to cancel scheduled post: ' + error.message);
    }
  }

  /**
   * Get content analytics and performance metrics
   */
  async getContentAnalytics(userId, timeRange = '7d') {
    try {
      const timeRangeHours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720; // 30d
      const startDate = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);

      // Get content performance
      const contentItems = await prisma.contentItem.findMany({
        where: {
          userId,
          createdAt: { gte: startDate },
          status: 'published'
        },
        select: {
          id: true,
          title: true,
          contentType: true,
          tags: true,
          performance: true,
          createdAt: true
        }
      });

      // Get activity logs for the period
      const activityLogs = await prisma.activityLog.findMany({
        where: {
          userId,
          timestamp: { gte: startDate },
          action: { in: ['post_created', 'comment_posted', 'upvote_given'] }
        }
      });

      // Calculate analytics
      const totalKarmaGained = activityLogs.reduce((sum, log) => sum + (log.karmaChange || 0), 0);
      const postActions = activityLogs.filter(log => log.action === 'post_created').length;
      const commentActions = activityLogs.filter(log => log.action === 'comment_posted').length;
      const upvoteActions = activityLogs.filter(log => log.action === 'upvote_given').length;

      // Top performing content
      const topContent = contentItems
        .filter(item => item.performance && item.performance.score)
        .sort((a, b) => (b.performance.score || 0) - (a.performance.score || 0))
        .slice(0, 5);

      // Content type breakdown
      const contentTypeBreakdown = contentItems.reduce((acc, item) => {
        acc[item.contentType] = (acc[item.contentType] || 0) + 1;
        return acc;
      }, {});

      return {
        timeRange,
        summary: {
          totalContent: contentItems.length,
          totalKarmaGained,
          activityBreakdown: {
            posts: postActions,
            comments: commentActions,
            upvotes: upvoteActions
          },
          contentTypeBreakdown
        },
        topPerformingContent: topContent,
        recentActivity: activityLogs.slice(-20)
      };

    } catch (error) {
      console.error('Error getting content analytics:', error);
      throw new Error('Failed to get content analytics: ' + error.message);
    }
  }

  /**
   * Generate content suggestions based on user's successful posts
   */
  async generateContentSuggestions(userId) {
    try {
      // Get user's top performing content
      const topContent = await prisma.contentItem.findMany({
        where: {
          userId,
          status: 'published',
          performance: {
            not: null
          }
        },
        orderBy: [
          { performance: 'desc' }
        ],
        take: 10
      });

      // Analyze patterns
      const tagFrequency = {};
      const subredditFrequency = {};
      const contentTypes = {};

      topContent.forEach(content => {
        // Count tags
        if (content.tags) {
          content.tags.forEach(tag => {
            tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
          });
        }

        // Count subreddits
        if (content.subreddits) {
          content.subreddits.forEach(subreddit => {
            subredditFrequency[subreddit] = (subredditFrequency[subreddit] || 0) + 1;
          });
        }

        // Count content types
        contentTypes[content.contentType] = (contentTypes[content.contentType] || 0) + 1;
      });

      // Generate suggestions
      const suggestions = [
        {
          type: 'trending_topics',
          title: 'Create content about trending topics',
          description: 'Based on your successful posts, consider creating content about current trends',
          priority: 'high'
        },
        {
          type: 'successful_tags',
          title: 'Use your most successful tags',
          description: `Your top performing tags: ${Object.entries(tagFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([tag]) => tag)
            .join(', ')}`,
          priority: 'medium'
        },
        {
          type: 'target_subreddits',
          title: 'Focus on your best subreddits',
          description: `Your most successful subreddits: ${Object.entries(subredditFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([subreddit]) => subreddit)
            .join(', ')}`,
          priority: 'medium'
        }
      ];

      return suggestions;

    } catch (error) {
      console.error('Error generating content suggestions:', error);
      throw new Error('Failed to generate content suggestions: ' + error.message);
    }
  }
}

module.exports = ContentManagerService;