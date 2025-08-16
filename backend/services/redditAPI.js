const { PrismaClient } = require('@prisma/client');
const RedditAuthService = require('./redditAuth');
const { getRandomDelay } = require('../middleware/safetyMiddleware');

const prisma = new PrismaClient();

class RedditAPIService {
  constructor() {
    this.redditAuth = new RedditAuthService();
    this.cache = new Map();
    this.CACHE_TTL = 3 * 60 * 1000; // 3 minutes
  }

  /**
   * Submit a post to Reddit
   */
  async submitPost(userId, postData) {
    try {
      const reddit = await this.redditAuth.getRedditInstance(userId);
      const { subreddit, title, text, url, flair } = postData;

      // Safety delay before Reddit API call
      const delay = getRandomDelay();
      console.log(`Safety delay: ${delay/1000} seconds for post submission`);
      await new Promise(resolve => setTimeout(resolve, delay));

      let submission;
      if (url) {
        // Link post
        submission = await reddit.getSubreddit(subreddit).submitLink({
          title,
          url,
          flair_id: flair?.id,
          flair_text: flair?.text
        });
      } else {
        // Text post
        submission = await reddit.getSubreddit(subreddit).submitSelfpost({
          title,
          text: text || '',
          flair_id: flair?.id,
          flair_text: flair?.text
        });
      }

      const result = {
        id: submission.id,
        fullname: submission.name,
        url: submission.url,
        permalink: `https://reddit.com${submission.permalink}`,
        subreddit: submission.subreddit.display_name,
        title: submission.title,
        created_utc: submission.created_utc,
        score: submission.score
      };

      // Log successful post
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'post_submitted',
          target: `r/${subreddit}`,
          result: 'success',
          metadata: {
            postId: submission.id,
            title: submission.title,
            subreddit: submission.subreddit.display_name,
            url: submission.url
          }
        }
      });

      // Store post in database
      await prisma.contentItem.create({
        data: {
          userId,
          type: 'post',
          title: submission.title,
          content: text || url,
          subreddit: submission.subreddit.display_name,
          redditId: submission.id,
          redditUrl: submission.url,
          status: 'published',
          metadata: {
            score: submission.score,
            permalink: submission.permalink,
            created_utc: submission.created_utc
          }
        }
      });

      return result;

    } catch (error) {
      console.error('Error submitting post:', error);
      
      // Log failed post
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'post_failed',
          target: `r/${postData.subreddit}`,
          result: 'failed',
          metadata: {
            error: error.message,
            title: postData.title
          }
        }
      });

      throw new Error(`Failed to submit post: ${error.message}`);
    }
  }

  /**
   * Add a comment to a Reddit post or comment
   */
  async addComment(userId, commentData) {
    try {
      const reddit = await this.redditAuth.getRedditInstance(userId);
      const { parentId, text } = commentData;

      // Safety delay before Reddit API call
      const delay = getRandomDelay();
      console.log(`Safety delay: ${delay/1000} seconds for comment submission`);
      await new Promise(resolve => setTimeout(resolve, delay));

      let comment;
      if (parentId.startsWith('t1_')) {
        // Reply to comment
        comment = await reddit.getComment(parentId).reply(text);
      } else if (parentId.startsWith('t3_')) {
        // Reply to submission
        comment = await reddit.getSubmission(parentId).reply(text);
      } else {
        throw new Error('Invalid parent ID format');
      }

      const result = {
        id: comment.id,
        fullname: comment.name,
        permalink: `https://reddit.com${comment.permalink}`,
        parent_id: parentId,
        body: comment.body,
        created_utc: comment.created_utc,
        score: comment.score
      };

      // Log successful comment
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'comment_submitted',
          target: parentId,
          result: 'success',
          metadata: {
            commentId: comment.id,
            parentId: parentId,
            text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
          }
        }
      });

      // Store comment in database
      await prisma.contentItem.create({
        data: {
          userId,
          type: 'comment',
          content: text,
          redditId: comment.id,
          redditUrl: comment.permalink,
          status: 'published',
          metadata: {
            parent_id: parentId,
            score: comment.score,
            created_utc: comment.created_utc
          }
        }
      });

      return result;

    } catch (error) {
      console.error('Error adding comment:', error);
      
      // Log failed comment
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'comment_failed',
          target: commentData.parentId,
          result: 'failed',
          metadata: {
            error: error.message,
            parentId: commentData.parentId
          }
        }
      });

      throw new Error(`Failed to add comment: ${error.message}`);
    }
  }

  /**
   * Vote on Reddit content (upvote/downvote)
   */
  async voteOnContent(userId, voteData) {
    try {
      const reddit = await this.redditAuth.getRedditInstance(userId);
      const { itemId, voteType } = voteData; // voteType: 1 (upvote), -1 (downvote), 0 (no vote)

      // Safety delay before Reddit API call
      const delay = getRandomDelay();
      console.log(`Safety delay: ${delay/1000} seconds for voting`);
      await new Promise(resolve => setTimeout(resolve, delay));

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

      let action;
      if (voteType === 1) {
        await item.upvote();
        action = 'upvoted';
      } else if (voteType === -1) {
        await item.downvote();
        action = 'downvoted';
      } else {
        await item.unvote();
        action = 'unvoted';
      }

      const result = {
        id: itemId,
        voteType,
        action
      };

      // Log successful vote
      await prisma.activityLog.create({
        data: {
          userId,
          action: `content_${action}`,
          target: itemId,
          result: 'success',
          metadata: {
            itemId,
            voteType,
            action
          }
        }
      });

      return result;

    } catch (error) {
      console.error('Error voting on content:', error);
      
      // Log failed vote
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'vote_failed',
          target: voteData.itemId,
          result: 'failed',
          metadata: {
            error: error.message,
            itemId: voteData.itemId,
            voteType: voteData.voteType
          }
        }
      });

      throw new Error(`Failed to vote on content: ${error.message}`);
    }
  }

  /**
   * Get subreddit information and analysis
   */
  async getSubredditInfo(userId, subredditName) {
    try {
      const reddit = await this.redditAuth.getRedditInstance(userId);
      
      const subreddit = await reddit.getSubreddit(subredditName);
      const about = await subreddit.fetch();

      // Get recent posts for analysis
      const hotPosts = await subreddit.getHot({ limit: 25 });
      const newPosts = await subreddit.getNew({ limit: 25 });

      const result = {
        name: about.display_name,
        title: about.title,
        description: about.description,
        subscribers: about.subscribers,
        activeUsers: about.active_user_count,
        created: about.created_utc,
        isNsfw: about.over18,
        allowImages: about.allow_images,
        allowVideos: about.allow_videos,
        submitTextPosts: about.submission_type !== 'link',
        rules: about.rules?.map(rule => ({
          shortName: rule.short_name,
          description: rule.description
        })) || [],
        flairs: [],
        analysis: {
          avgScore: this.calculateAverageScore(hotPosts),
          avgComments: this.calculateAverageComments(hotPosts),
          activeHours: this.analyzeActiveHours(newPosts),
          popularKeywords: this.extractKeywords(hotPosts),
          postFrequency: this.calculatePostFrequency(newPosts)
        }
      };

      // Try to get post flairs
      try {
        const flairs = await subreddit.getLinkFlairTemplates();
        result.flairs = flairs.map(flair => ({
          id: flair.flair_template_id,
          text: flair.flair_text,
          type: flair.flair_type
        }));
      } catch (flairError) {
        console.log('Could not fetch flairs:', flairError.message);
      }

      return result;

    } catch (error) {
      console.error('Error getting subreddit info:', error);
      throw new Error(`Failed to get subreddit info: ${error.message}`);
    }
  }

  /**
   * Get trending posts from multiple subreddits (optimized with caching and parallel requests)
   */
  async getTrendingPosts(userId, subreddits = ['all'], limit = 25) {
    try {
      // Check cache first
      const cacheKey = `trending_${userId}_${subreddits.sort().join(',')}_${limit}`;
      const cached = this.cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
        console.log('Returning cached trending posts');
        return cached.data;
      }

      const reddit = await this.redditAuth.getRedditInstance(userId);
      
      // Limit concurrent subreddit requests to avoid overwhelming Reddit API
      const maxConcurrent = Math.min(subreddits.length, 5);
      const batches = [];
      for (let i = 0; i < subreddits.length; i += maxConcurrent) {
        batches.push(subreddits.slice(i, i + maxConcurrent));
      }

      const allTrendingPosts = [];
      
      for (const batch of batches) {
        const batchPromises = batch.map(async (subredditName) => {
          try {
            const subreddit = await reddit.getSubreddit(subredditName);
            const posts = await subreddit.getHot({ limit: Math.ceil(limit / subreddits.length) });
            
            return posts.map(post => ({
              id: post.id,
              fullname: post.name,
              title: post.title,
              url: post.url,
              permalink: `https://reddit.com${post.permalink}`,
              subreddit: post.subreddit.display_name,
              author: post.author.name,
              score: post.score,
              upvoteRatio: post.upvote_ratio,
              numComments: post.num_comments,
              created: post.created_utc,
              isVideo: post.is_video,
              isImage: post.url?.includes('.jpg') || post.url?.includes('.png') || post.url?.includes('.gif'),
              flair: post.link_flair_text,
              gilded: post.gilded,
              analysis: {
                engagement: this.calculateEngagement(post),
                trending: this.calculateTrendingScore(post)
              }
            }));
          } catch (subredditError) {
            console.log(`Error fetching from r/${subredditName}:`, subredditError.message);
            return [];
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        allTrendingPosts.push(...batchResults.flat());
      }

      // Sort by trending score
      allTrendingPosts.sort((a, b) => b.analysis.trending - a.analysis.trending);
      const result = allTrendingPosts.slice(0, limit);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      // Clean old cache entries
      this.cleanCache();

      return result;

    } catch (error) {
      console.error('Error getting trending posts:', error);
      throw new Error(`Failed to get trending posts: ${error.message}`);
    }
  }

  /**
   * Get user's Reddit profile information
   */
  async getUserProfile(userId) {
    try {
      const reddit = await this.redditAuth.getRedditInstance(userId);
      const me = await reddit.getMe();

      const result = {
        username: me.name,
        id: me.id,
        postKarma: me.link_karma,
        commentKarma: me.comment_karma,
        totalKarma: me.link_karma + me.comment_karma,
        created: me.created_utc,
        isGold: me.is_gold,
        hasVerifiedEmail: me.has_verified_email,
        isEmployee: me.is_employee,
        isMod: me.is_mod,
        accountAge: Math.floor((Date.now() / 1000 - me.created_utc) / (60 * 60 * 24)) // days
      };

      return result;

    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }

  /**
   * Get user's subscribed subreddits (with caching)
   */
  async getUserSubscriptions(userId) {
    try {
      // Check cache first
      const cacheKey = `subscriptions_${userId}`;
      const cached = this.cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
        console.log('Returning cached subscriptions');
        return cached.data;
      }

      const reddit = await this.redditAuth.getRedditInstance(userId);
      
      // Get user's subscribed subreddits
      const subscriptions = await reddit.getSubscriptions({ limit: 100 });
      
      const subreddits = subscriptions.map(sub => ({
        name: sub.display_name,
        title: sub.title,
        description: sub.description,
        subscribers: sub.subscribers,
        isNsfw: sub.over18,
        url: sub.url,
        created: sub.created_utc,
        primaryColor: sub.primary_color,
        iconUrl: sub.icon_img
      }));

      // Sort by subscriber count (most popular first)
      subreddits.sort((a, b) => b.subscribers - a.subscribers);

      const result = {
        subreddits,
        count: subreddits.length,
        totalSubscribers: subreddits.reduce((sum, sub) => sum + sub.subscribers, 0)
      };
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      return result;

    } catch (error) {
      console.error('Error getting user subscriptions:', error);
      throw new Error(`Failed to get user subscriptions: ${error.message}`);
    }
  }

  /**
   * Search Reddit for specific content
   */
  async searchReddit(userId, query, options = {}) {
    try {
      const reddit = await this.redditAuth.getRedditInstance(userId);
      
      const searchOptions = {
        query,
        time: options.time || 'week', // hour, day, week, month, year, all
        sort: options.sort || 'relevance', // relevance, hot, top, new, comments
        limit: options.limit || 25,
        subreddit: options.subreddit
      };

      let results;
      if (searchOptions.subreddit) {
        const subreddit = await reddit.getSubreddit(searchOptions.subreddit);
        results = await subreddit.search(searchOptions);
      } else {
        results = await reddit.search(searchOptions);
      }

      const searchResults = results.map(post => ({
        id: post.id,
        title: post.title,
        url: post.url,
        permalink: `https://reddit.com${post.permalink}`,
        subreddit: post.subreddit.display_name,
        author: post.author.name,
        score: post.score,
        numComments: post.num_comments,
        created: post.created_utc,
        flair: post.link_flair_text
      }));

      return searchResults;

    } catch (error) {
      console.error('Error searching Reddit:', error);
      throw new Error(`Failed to search Reddit: ${error.message}`);
    }
  }

  // Helper methods for analysis

  calculateAverageScore(posts) {
    if (!posts || posts.length === 0) return 0;
    const totalScore = posts.reduce((sum, post) => sum + post.score, 0);
    return Math.round(totalScore / posts.length);
  }

  calculateAverageComments(posts) {
    if (!posts || posts.length === 0) return 0;
    const totalComments = posts.reduce((sum, post) => sum + post.num_comments, 0);
    return Math.round(totalComments / posts.length);
  }

  analyzeActiveHours(posts) {
    if (!posts || posts.length === 0) return [];
    
    const hourCounts = new Array(24).fill(0);
    posts.forEach(post => {
      const hour = new Date(post.created_utc * 1000).getHours();
      hourCounts[hour]++;
    });

    const maxCount = Math.max(...hourCounts);
    return hourCounts.map((count, hour) => ({
      hour,
      activity: maxCount > 0 ? Math.round((count / maxCount) * 100) : 0
    }));
  }

  extractKeywords(posts) {
    if (!posts || posts.length === 0) return [];
    
    const words = {};
    posts.forEach(post => {
      const title = post.title.toLowerCase();
      const titleWords = title.match(/\b\w{4,}\b/g) || [];
      titleWords.forEach(word => {
        words[word] = (words[word] || 0) + 1;
      });
    });

    return Object.entries(words)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  }

  calculatePostFrequency(posts) {
    if (!posts || posts.length === 0) return 0;
    
    const now = Date.now() / 1000;
    const hourAgo = now - 3600;
    const recentPosts = posts.filter(post => post.created_utc > hourAgo);
    
    return recentPosts.length;
  }

  calculateEngagement(post) {
    const commentsPerScore = post.score > 0 ? post.num_comments / post.score : 0;
    const timeDecay = Math.max(0, 1 - (Date.now() / 1000 - post.created_utc) / 86400); // Decay over 24 hours
    return Math.round((post.score * 0.7 + post.num_comments * 0.3) * timeDecay);
  }

  calculateTrendingScore(post) {
    const hoursOld = (Date.now() / 1000 - post.created_utc) / 3600;
    const scorePerHour = hoursOld > 0 ? post.score / hoursOld : post.score;
    const commentsPerHour = hoursOld > 0 ? post.num_comments / hoursOld : post.num_comments;
    
    return Math.round(scorePerHour * 0.6 + commentsPerHour * 0.4);
  }
  
  /**
   * Clean expired cache entries
   */
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }
}

module.exports = RedditAPIService;