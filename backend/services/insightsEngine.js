const { PrismaClient } = require('@prisma/client');
const RedditAPIService = require('./redditAPI');
const KimiAIService = require('./kimiAI');

const prisma = new PrismaClient();

class InsightsEngine {
  constructor() {
    this.redditAPI = new RedditAPIService();
    this.kimiAI = new KimiAIService();
    this.opportunityCache = new Map();
    this.subredditCache = new Map();
    this.timingCache = new Map();
  }

  /**
   * Detect real-time posting opportunities
   */
  async detectOpportunities(userId, options = {}) {
    try {
      const {
        subreddits = ['all'],
        minScore = 50,
        maxAgeHours = 6,
        maxCommentRatio = 0.1,
        contentTypes = ['post', 'comment'],
        limit = 20
      } = options;

      const cacheKey = `opportunities_${userId}_${JSON.stringify(options)}`;
      
      // Check cache (5 minute expiry)
      if (this.opportunityCache.has(cacheKey)) {
        const cached = this.opportunityCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
          return cached.data;
        }
      }

      // Get trending posts
      const trendingPosts = await this.redditAPI.getTrendingPosts(userId, subreddits, 100);
      
      const now = Date.now() / 1000;
      const opportunities = [];

      for (const post of trendingPosts) {
        const ageHours = (now - post.created) / 3600;
        const commentRatio = post.score > 0 ? post.numComments / post.score : 0;

        // Filter based on criteria
        if (post.score >= minScore && 
            ageHours <= maxAgeHours && 
            commentRatio <= maxCommentRatio) {
          
          const opportunity = await this.analyzeOpportunity(post, contentTypes);
          if (opportunity.score > 60) { // Only high-value opportunities
            opportunities.push(opportunity);
          }
        }
      }

      // Sort by opportunity score
      opportunities.sort((a, b) => b.score - a.score);
      const result = opportunities.slice(0, limit);

      // Cache results
      this.opportunityCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error('Error detecting opportunities:', error);
      throw error;
    }
  }

  /**
   * Analyze a specific opportunity
   */
  async analyzeOpportunity(post, contentTypes) {
    const now = Date.now() / 1000;
    const ageHours = (now - post.created) / 3600;
    
    // Calculate base metrics
    const engagementRate = post.score > 0 ? (post.numComments / post.score) * 100 : 0;
    const velocityScore = ageHours > 0 ? post.score / ageHours : post.score;
    const commentVelocity = ageHours > 0 ? post.numComments / ageHours : post.numComments;
    
    // Engagement potential (0-100)
    let engagementPotential = 0;
    if (engagementRate < 5) engagementPotential = 90; // Low comment ratio = opportunity
    else if (engagementRate < 10) engagementPotential = 70;
    else if (engagementRate < 20) engagementPotential = 50;
    else engagementPotential = 30;

    // Timing score (0-100)
    let timingScore = 0;
    if (ageHours < 1) timingScore = 100; // Fresh posts
    else if (ageHours < 3) timingScore = 80;
    else if (ageHours < 6) timingScore = 60;
    else if (ageHours < 12) timingScore = 40;
    else timingScore = 20;

    // Competition level (inverse of comment density)
    const competitionLevel = Math.min(100, engagementRate * 5);
    const competitionScore = 100 - competitionLevel;

    // Viral potential based on velocity
    let viralPotential = 0;
    if (velocityScore > 100) viralPotential = 90;
    else if (velocityScore > 50) viralPotential = 70;
    else if (velocityScore > 20) viralPotential = 50;
    else viralPotential = 30;

    // Calculate overall opportunity score
    const overallScore = Math.round(
      (engagementPotential * 0.3) +
      (timingScore * 0.25) +
      (competitionScore * 0.25) +
      (viralPotential * 0.2)
    );

    // Determine best action types
    const suggestedActions = [];
    if (contentTypes.includes('comment') && engagementRate < 15) {
      suggestedActions.push({
        type: 'comment',
        priority: 'high',
        reasoning: 'Low comment ratio indicates opportunity for visibility'
      });
    }
    if (contentTypes.includes('post') && post.subreddit && velocityScore > 30) {
      suggestedActions.push({
        type: 'related_post',
        priority: 'medium',
        reasoning: 'High engagement subreddit with trending topic'
      });
    }

    // Risk assessment
    let riskLevel = 'low';
    if (post.score > 10000) riskLevel = 'high'; // Very popular posts = high visibility
    else if (post.score > 1000) riskLevel = 'medium';

    return {
      postId: post.id,
      title: post.title,
      subreddit: post.subreddit,
      url: post.url,
      permalink: post.permalink,
      score: overallScore,
      metrics: {
        postScore: post.score,
        comments: post.numComments,
        ageHours: Math.round(ageHours * 10) / 10,
        engagementRate: Math.round(engagementRate * 10) / 10,
        velocityScore: Math.round(velocityScore),
        commentVelocity: Math.round(commentVelocity * 10) / 10
      },
      analysis: {
        engagementPotential,
        timingScore,
        competitionScore,
        viralPotential,
        riskLevel
      },
      suggestedActions,
      reasoning: `${overallScore}/100 opportunity score based on timing, engagement potential, and competition level`
    };
  }

  /**
   * Analyze and score subreddits
   */
  async analyzeSubreddit(userId, subredditName, options = {}) {
    try {
      const cacheKey = `subreddit_${subredditName}`;
      
      // Check cache (30 minute expiry)
      if (this.subredditCache.has(cacheKey)) {
        const cached = this.subredditCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 30 * 60 * 1000) {
          return cached.data;
        }
      }

      // Get subreddit info
      const subredditInfo = await this.redditAPI.getSubredditInfo(userId, subredditName);
      
      // Calculate subreddit scores
      const activityScore = this.calculateActivityScore(subredditInfo);
      const opportunityScore = this.calculateOpportunityScore(subredditInfo);
      const safetyScore = this.calculateSafetyScore(subredditInfo);
      const growthPotential = this.calculateGrowthPotential(subredditInfo);

      // Overall subreddit score
      const overallScore = Math.round(
        (activityScore * 0.3) +
        (opportunityScore * 0.3) +
        (safetyScore * 0.25) +
        (growthPotential * 0.15)
      );

      // Generate insights with AI
      const aiInsights = await this.generateSubredditInsights(subredditInfo);

      const result = {
        subreddit: subredditName,
        info: subredditInfo,
        scores: {
          overall: overallScore,
          activity: activityScore,
          opportunity: opportunityScore,
          safety: safetyScore,
          growth: growthPotential
        },
        insights: aiInsights,
        recommendations: this.generateSubredditRecommendations(subredditInfo, {
          overall: overallScore,
          activity: activityScore,
          opportunity: opportunityScore,
          safety: safetyScore,
          growth: growthPotential
        }),
        lastAnalyzed: new Date()
      };

      // Cache results
      this.subredditCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error('Error analyzing subreddit:', error);
      throw error;
    }
  }

  /**
   * Predict optimal timing for posts
   */
  async predictOptimalTiming(userId, subredditName, contentType = 'post') {
    try {
      const cacheKey = `timing_${subredditName}_${contentType}`;
      
      // Check cache (1 hour expiry)
      if (this.timingCache.has(cacheKey)) {
        const cached = this.timingCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 60 * 60 * 1000) {
          return cached.data;
        }
      }

      // Get recent posts from subreddit
      const trendingPosts = await this.redditAPI.getTrendingPosts(userId, [subredditName], 100);
      
      // Analyze posting patterns
      const hourlyData = this.analyzeHourlyPatterns(trendingPosts);
      const daylyData = this.analyzeDaylyPatterns(trendingPosts);
      
      // Find optimal windows
      const optimalHours = this.findOptimalHours(hourlyData);
      const optimalDays = this.findOptimalDays(daylyData);

      // Generate predictions for next 7 days
      const predictions = this.generateTimingPredictions(optimalHours, optimalDays);

      const result = {
        subreddit: subredditName,
        contentType,
        analysis: {
          hourlyPatterns: hourlyData,
          dailyPatterns: daylyData,
          optimalHours,
          optimalDays
        },
        predictions,
        nextOptimalSlots: predictions.slice(0, 5), // Next 5 best times
        insights: {
          bestTimeToday: predictions.find(p => this.isToday(p.timestamp)),
          peakHours: optimalHours.slice(0, 3),
          peakDays: optimalDays.slice(0, 3),
          avgEngagement: this.calculateAverageEngagement(trendingPosts)
        },
        lastAnalyzed: new Date()
      };

      // Cache results
      this.timingCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error('Error predicting optimal timing:', error);
      throw error;
    }
  }

  /**
   * Risk assessment for automation activities
   */
  async assessRisk(userId, action, context = {}) {
    try {
      // Get user's recent activity
      const recentActivity = await prisma.activityLog.findMany({
        where: {
          userId,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: { timestamp: 'desc' }
      });

      // Calculate activity metrics
      const actionCounts = this.countActions(recentActivity);
      const successRate = this.calculateSuccessRate(recentActivity);
      const activityPattern = this.analyzeActivityPattern(recentActivity);

      // Risk factors
      const riskFactors = [];
      let riskScore = 0;

      // High activity volume
      if (actionCounts.total > 50) {
        riskFactors.push('High activity volume in last 24h');
        riskScore += 20;
      }

      // Low success rate
      if (successRate < 80) {
        riskFactors.push('Low success rate indicating potential issues');
        riskScore += 15;
      }

      // Unnatural posting pattern
      if (activityPattern.isUnnatural) {
        riskFactors.push('Unnatural activity pattern detected');
        riskScore += 25;
      }

      // Action-specific risks
      switch (action.type) {
        case 'post':
          if (actionCounts.posts > 10) {
            riskFactors.push('High posting frequency');
            riskScore += 15;
          }
          break;
        case 'comment':
          if (actionCounts.comments > 50) {
            riskFactors.push('High commenting frequency');
            riskScore += 10;
          }
          break;
        case 'vote':
          if (actionCounts.votes > 100) {
            riskFactors.push('High voting frequency');
            riskScore += 5;
          }
          break;
      }

      // Context-based risks
      if (context.subreddit) {
        const subredditAnalysis = await this.analyzeSubreddit(userId, context.subreddit);
        if (subredditAnalysis.scores.safety < 50) {
          riskFactors.push('Low safety score for target subreddit');
          riskScore += 10;
        }
      }

      // Calculate final risk level
      let riskLevel = 'low';
      if (riskScore > 50) riskLevel = 'high';
      else if (riskScore > 25) riskLevel = 'medium';

      return {
        riskScore,
        riskLevel,
        riskFactors,
        recommendations: this.generateRiskRecommendations(riskScore, riskFactors),
        safeToProceced: riskScore < 40,
        suggestedDelay: this.calculateSuggestedDelay(riskScore),
        analysis: {
          activityCounts: actionCounts,
          successRate,
          activityPattern
        }
      };

    } catch (error) {
      console.error('Error assessing risk:', error);
      throw error;
    }
  }

  // Helper methods

  calculateActivityScore(subredditInfo) {
    const subscriberRatio = Math.min(100, (subredditInfo.activeUsers / subredditInfo.subscribers) * 1000);
    const postFrequency = Math.min(100, subredditInfo.analysis.postFrequency * 2);
    return Math.round((subscriberRatio + postFrequency) / 2);
  }

  calculateOpportunityScore(subredditInfo) {
    const avgScore = subredditInfo.analysis.avgScore;
    const avgComments = subredditInfo.analysis.avgComments;
    const commentRatio = avgScore > 0 ? (avgComments / avgScore) * 100 : 0;
    
    let score = 50;
    if (commentRatio < 10) score = 90; // Low comment ratio = opportunity
    else if (commentRatio < 20) score = 70;
    else if (commentRatio < 40) score = 50;
    else score = 30;
    
    return score;
  }

  calculateSafetyScore(subredditInfo) {
    let score = 80; // Base safety score
    
    if (subredditInfo.isNsfw) score -= 30;
    if (subredditInfo.rules.length < 3) score -= 10; // Few rules might mean lax moderation
    if (subredditInfo.subscribers < 1000) score -= 20; // Very small subreddits
    
    return Math.max(0, score);
  }

  calculateGrowthPotential(subredditInfo) {
    // Based on subscriber count and activity
    const subscriberScore = Math.min(50, Math.log10(subredditInfo.subscribers) * 10);
    const activityScore = Math.min(50, subredditInfo.activeUsers / 100);
    return Math.round(subscriberScore + activityScore);
  }

  async generateSubredditInsights(subredditInfo) {
    try {
      const prompt = `Analyze this subreddit data and provide insights:
      
Subreddit: r/${subredditInfo.name}
Subscribers: ${subredditInfo.subscribers}
Active Users: ${subredditInfo.activeUsers}
Average Score: ${subredditInfo.analysis.avgScore}
Average Comments: ${subredditInfo.analysis.avgComments}
Popular Keywords: ${subredditInfo.analysis.popularKeywords.map(k => k.word).join(', ')}

Provide 3-4 actionable insights for content strategy.`;

      const aiResponse = await this.kimiAI.generateContent(prompt, {
        type: 'analysis',
        maxTokens: 300
      });

      return aiResponse.content || 'Unable to generate insights at this time.';

    } catch (error) {
      console.error('Error generating AI insights:', error);
      return 'Insights generation temporarily unavailable.';
    }
  }

  generateSubredditRecommendations(subredditInfo, scores) {
    const recommendations = [];

    if (scores.activity < 50) {
      recommendations.push('Consider posting during peak hours to maximize visibility');
    }

    if (scores.opportunity > 70) {
      recommendations.push('High opportunity subreddit - consider increasing posting frequency');
    }

    if (scores.safety < 60) {
      recommendations.push('Review subreddit rules carefully before posting');
    }

    if (subredditInfo.analysis.avgComments < 10) {
      recommendations.push('Low engagement - focus on controversial or discussion-worthy content');
    }

    return recommendations;
  }

  analyzeHourlyPatterns(posts) {
    const hourlyData = new Array(24).fill(0).map((_, hour) => ({
      hour,
      posts: 0,
      totalScore: 0,
      totalComments: 0,
      avgScore: 0,
      avgComments: 0
    }));

    posts.forEach(post => {
      const hour = new Date(post.created * 1000).getHours();
      hourlyData[hour].posts++;
      hourlyData[hour].totalScore += post.score;
      hourlyData[hour].totalComments += post.numComments;
    });

    // Calculate averages
    hourlyData.forEach(data => {
      data.avgScore = data.posts > 0 ? Math.round(data.totalScore / data.posts) : 0;
      data.avgComments = data.posts > 0 ? Math.round(data.totalComments / data.posts) : 0;
    });

    return hourlyData;
  }

  analyzeDaylyPatterns(posts) {
    const dailyData = new Array(7).fill(0).map((_, day) => ({
      day,
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
      posts: 0,
      totalScore: 0,
      totalComments: 0,
      avgScore: 0,
      avgComments: 0
    }));

    posts.forEach(post => {
      const day = new Date(post.created * 1000).getDay();
      dailyData[day].posts++;
      dailyData[day].totalScore += post.score;
      dailyData[day].totalComments += post.numComments;
    });

    // Calculate averages
    dailyData.forEach(data => {
      data.avgScore = data.posts > 0 ? Math.round(data.totalScore / data.posts) : 0;
      data.avgComments = data.posts > 0 ? Math.round(data.totalComments / data.posts) : 0;
    });

    return dailyData;
  }

  findOptimalHours(hourlyData) {
    return hourlyData
      .map(data => ({
        ...data,
        score: (data.avgScore * 0.7) + (data.avgComments * 0.3)
      }))
      .sort((a, b) => b.score - a.score);
  }

  findOptimalDays(dailyData) {
    return dailyData
      .map(data => ({
        ...data,
        score: (data.avgScore * 0.7) + (data.avgComments * 0.3)
      }))
      .sort((a, b) => b.score - a.score);
  }

  generateTimingPredictions(optimalHours, optimalDays) {
    const predictions = [];
    const now = new Date();
    
    // Generate predictions for next 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDate = new Date(now.getTime() + (dayOffset * 24 * 60 * 60 * 1000));
      const dayOfWeek = targetDate.getDay();
      const dayData = optimalDays.find(d => d.day === dayOfWeek);
      
      // Get top 3 hours for this day
      const topHours = optimalHours.slice(0, 3);
      
      topHours.forEach(hourData => {
        const predictionTime = new Date(targetDate);
        predictionTime.setHours(hourData.hour, 0, 0, 0);
        
        if (predictionTime > now) { // Only future times
          predictions.push({
            timestamp: predictionTime,
            day: dayData.dayName,
            hour: hourData.hour,
            score: Math.round((hourData.score + dayData.score) / 2),
            confidence: this.calculateConfidence(hourData, dayData)
          });
        }
      });
    }

    return predictions.sort((a, b) => b.score - a.score);
  }

  calculateConfidence(hourData, dayData) {
    const hourConfidence = Math.min(100, (hourData.posts / 10) * 100);
    const dayConfidence = Math.min(100, (dayData.posts / 50) * 100);
    return Math.round((hourConfidence + dayConfidence) / 2);
  }

  isToday(timestamp) {
    const today = new Date();
    const date = new Date(timestamp);
    return today.toDateString() === date.toDateString();
  }

  calculateAverageEngagement(posts) {
    if (!posts || posts.length === 0) return 0;
    const totalEngagement = posts.reduce((sum, post) => sum + post.score + post.numComments, 0);
    return Math.round(totalEngagement / posts.length);
  }

  countActions(activityLogs) {
    return {
      total: activityLogs.length,
      posts: activityLogs.filter(log => log.action.includes('post')).length,
      comments: activityLogs.filter(log => log.action.includes('comment')).length,
      votes: activityLogs.filter(log => log.action.includes('vote')).length
    };
  }

  calculateSuccessRate(activityLogs) {
    if (activityLogs.length === 0) return 100;
    const successful = activityLogs.filter(log => log.result === 'success').length;
    return Math.round((successful / activityLogs.length) * 100);
  }

  analyzeActivityPattern(activityLogs) {
    // Simple pattern analysis - could be more sophisticated
    const hourCounts = new Array(24).fill(0);
    activityLogs.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      hourCounts[hour]++;
    });

    const activeHours = hourCounts.filter(count => count > 0).length;
    const isUnnatural = activeHours < 4 || activityLogs.length > 30; // Too concentrated or too many

    return {
      activeHours,
      isUnnatural,
      totalActions: activityLogs.length
    };
  }

  generateRiskRecommendations(riskScore, riskFactors) {
    const recommendations = [];

    if (riskScore > 40) {
      recommendations.push('Consider pausing automation for 2-4 hours');
    }

    if (riskFactors.includes('High activity volume in last 24h')) {
      recommendations.push('Reduce action frequency for the next 12 hours');
    }

    if (riskFactors.includes('Unnatural activity pattern detected')) {
      recommendations.push('Vary posting times and add random delays');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue with normal automation schedule');
    }

    return recommendations;
  }

  calculateSuggestedDelay(riskScore) {
    if (riskScore > 50) return 120; // 2 hours
    if (riskScore > 30) return 60;  // 1 hour
    if (riskScore > 15) return 30;  // 30 minutes
    return 10; // 10 minutes (minimum)
  }
}

module.exports = InsightsEngine;