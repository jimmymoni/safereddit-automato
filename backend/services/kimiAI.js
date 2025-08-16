const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class KimiAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
    this.defaultModel = 'gpt-3.5-turbo'; // Using GPT-3.5 for cost efficiency
    
    // Initialize axios client
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
  }

  /**
   * Generate Reddit post content using Kimi AI
   */
  async generatePost(prompt, options = {}) {
    try {
      // Check if API key is configured
      if (!this.apiKey || this.apiKey === 'your_openai_api_key_here') {
        console.log('OpenAI API key not configured, using fallback content generation');
        return this.generateFallbackContent(prompt, options);
      }

      const {
        subreddit = '',
        contentType = 'text',
        tone = 'engaging',
        maxTokens = 500,
        model = this.defaultModel
      } = options;

      // Create system message for Reddit post generation
      const systemMessage = `You are an expert Reddit content creator who understands how to create engaging, authentic posts that follow Reddit's community guidelines and Terms of Service. 

Key guidelines:
- Create original, valuable content that adds to the conversation
- Match the tone and culture of the target subreddit
- Use natural, conversational language
- Avoid promotional or spam-like content
- Keep posts concise but engaging
- Include relevant context and details
- Follow Reddit's posting etiquette
- Format as: Title on first line, then content

Target subreddit: ${subreddit || 'general'}
Content type: ${contentType}
Desired tone: ${tone}`;

      const response = await this.client.post('/chat/completions', {
        model: model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
        top_p: 0.9
      });

      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        throw new Error('Invalid response from OpenAI API');
      }

      const generatedContent = response.data.choices[0].message.content.trim();
      
      return {
        content: generatedContent,
        model: model,
        tokensUsed: response.data.usage?.total_tokens || 0,
        promptTokens: response.data.usage?.prompt_tokens || 0,
        completionTokens: response.data.usage?.completion_tokens || 0
      };

    } catch (error) {
      console.error('OpenAI post generation error:', error);
      
      // Fallback to template-based content if API fails
      console.log('Falling back to template-based content generation');
      return this.generateFallbackContent(prompt, options);
    }
  }

  /**
   * Fallback content generation when Kimi AI is unavailable
   */
  async generateFallbackContent(prompt, options = {}) {
    const {
      subreddit = '',
      contentType = 'text',
      tone = 'engaging'
    } = options;

    // Extract key themes from the user prompt
    const themes = this.extractThemes(prompt);
    const templates = this.getContentTemplates(contentType, tone);
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Generate content based on template and themes
    const content = template
      .replace('{theme}', themes[0] || 'productivity')
      .replace('{subreddit}', subreddit)
      .replace('{tone_word}', tone === 'professional' ? 'insights' : tone === 'casual' ? 'tips' : 'strategies');

    return {
      content: content,
      model: 'fallback-template',
      tokensUsed: content.length / 4, // Rough token estimate
      promptTokens: prompt.length / 4,
      completionTokens: content.length / 4
    };
  }

  /**
   * Extract themes from user prompt
   */
  extractThemes(prompt) {
    const commonThemes = [
      'productivity', 'entrepreneurship', 'self-improvement', 'business growth',
      'time management', 'goal setting', 'career development', 'leadership',
      'innovation', 'success habits', 'mindset', 'work-life balance'
    ];
    
    const promptLower = prompt.toLowerCase();
    const foundThemes = commonThemes.filter(theme => 
      promptLower.includes(theme.toLowerCase())
    );
    
    return foundThemes.length > 0 ? foundThemes : ['productivity'];
  }

  /**
   * Get content templates based on type and tone
   */
  getContentTemplates(contentType, tone) {
    const templates = {
      discussion: [
        "What's your experience with {theme}? I've been exploring different approaches and would love to hear what's worked for others in r/{subreddit}.",
        "Quick question for the r/{subreddit} community: What are your top 3 {tone_word} for {theme}? Looking to improve my approach.",
        "Has anyone else noticed how {theme} impacts daily productivity? Curious about your experiences and {tone_word}."
      ],
      advice: [
        "Here are 5 {tone_word} for {theme} that have transformed my approach. What would you add to this list?",
        "After months of experimenting with {theme}, here's what actually works. Hope this helps someone in r/{subreddit}.",
        "Common {theme} mistakes I see people making (and how to avoid them). What other pitfalls should we watch out for?"
      ],
      experience: [
        "My journey with {theme}: What I learned after 6 months of focused effort. Sharing in case it helps others in r/{subreddit}.",
        "How {theme} changed my perspective on productivity. Here's my honest experience and key takeaways.",
        "The {theme} experiment: 30 days of testing different approaches. Here are the surprising results."
      ]
    };

    return templates[contentType] || templates.discussion;
  }

  /**
   * Generate Reddit comment using Kimi AI
   */
  async generateComment(postContent, prompt, options = {}) {
    try {
      const {
        subreddit = '',
        tone = 'helpful',
        maxTokens = 300,
        model = this.defaultModel
      } = options;

      const systemMessage = `You are an expert Reddit user who creates thoughtful, engaging comments that add value to discussions. 

Key guidelines:
- Be genuine and helpful in your responses
- Reference the original post content naturally
- Add new insights or perspectives
- Keep comments concise but meaningful
- Use appropriate Reddit etiquette
- Avoid generic or low-effort responses
- Match the tone of the community

Target subreddit: ${subreddit || 'general'}
Desired tone: ${tone}

Original post content: ${postContent}`;

      const response = await this.client.post('/chat/completions', {
        model: model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
        top_p: 0.9
      });

      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        throw new Error('Invalid response from Kimi API');
      }

      const generatedComment = response.data.choices[0].message.content.trim();
      
      return {
        content: generatedComment,
        model: model,
        tokensUsed: response.data.usage?.total_tokens || 0,
        promptTokens: response.data.usage?.prompt_tokens || 0,
        completionTokens: response.data.usage?.completion_tokens || 0
      };

    } catch (error) {
      console.error('Kimi AI comment generation error:', error);
      throw new Error(`Failed to generate comment: ${error.message}`);
    }
  }

  /**
   * Improve/optimize existing content
   */
  async improveContent(content, improvementType = 'general', options = {}) {
    try {
      const {
        subreddit = '',
        maxTokens = 600,
        model = this.defaultModel
      } = options;

      let systemMessage = '';
      let userPrompt = '';

      switch (improvementType) {
        case 'title':
          systemMessage = `You are an expert at creating compelling Reddit post titles that drive engagement while remaining authentic and following community guidelines.

Guidelines:
- Make titles clear, specific, and attention-grabbing
- Avoid clickbait or misleading titles
- Include relevant keywords naturally
- Keep within optimal length (60-80 characters)
- Match subreddit culture and expectations
- Ensure titles accurately represent content`;
          
          userPrompt = `Improve this Reddit post title for r/${subreddit}: "${content}"

Provide 3-5 improved title options that are more engaging and likely to perform well.`;
          break;

        case 'engagement':
          systemMessage = `You are an expert at optimizing Reddit content for maximum engagement while maintaining authenticity and community guidelines compliance.

Guidelines:
- Improve readability and flow
- Add engaging hooks and questions
- Include relevant details and context
- Format for easy scanning
- Encourage discussion and comments
- Maintain the original message and tone`;
          
          userPrompt = `Optimize this Reddit content for better engagement in r/${subreddit}:

${content}

Make it more engaging while keeping it authentic and valuable.`;
          break;

        case 'compliance':
          systemMessage = `You are an expert at ensuring Reddit content complies with platform guidelines and community rules while maintaining its effectiveness.

Guidelines:
- Remove any promotional or spam-like elements
- Ensure authenticity and genuine value
- Check for proper Reddit etiquette
- Avoid rule violations
- Maintain engagement potential
- Keep the core message intact`;
          
          userPrompt = `Review and improve this Reddit content for compliance with platform guidelines and r/${subreddit} community standards:

${content}

Ensure it follows all rules while remaining effective.`;
          break;

        default:
          systemMessage = `You are an expert Reddit content creator who can improve posts and comments for better performance, engagement, and compliance.

Guidelines:
- Enhance clarity and readability
- Improve engagement potential
- Ensure Reddit etiquette compliance
- Add value and depth where appropriate
- Maintain authentic voice
- Optimize formatting for Reddit`;
          
          userPrompt = `Improve this Reddit content for r/${subreddit}:

${content}

Make it more effective while keeping it authentic and valuable.`;
      }

      const response = await this.client.post('/chat/completions', {
        model: model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.6,
        top_p: 0.85
      });

      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        throw new Error('Invalid response from Kimi API');
      }

      const improvedContent = response.data.choices[0].message.content.trim();
      
      return {
        content: improvedContent,
        improvementType,
        model: model,
        tokensUsed: response.data.usage?.total_tokens || 0
      };

    } catch (error) {
      console.error('Kimi AI content improvement error:', error);
      throw new Error(`Failed to improve content: ${error.message}`);
    }
  }

  /**
   * Analyze content for Reddit suitability
   */
  async analyzeContent(content, subreddit = '', options = {}) {
    try {
      const {
        analysisType = 'general',
        model = this.defaultModel
      } = options;

      const systemMessage = `You are an expert Reddit content analyst who can assess posts and comments for their potential performance, compliance, and suitability.

Analyze the content and provide:
1. Compliance score (0-100) - how well it follows Reddit guidelines
2. Engagement potential (0-100) - likelihood to receive upvotes/comments  
3. Authenticity score (0-100) - how genuine and natural it appears
4. Risk assessment (low/medium/high) - potential for negative reactions
5. Improvement suggestions - specific recommendations
6. Overall recommendation - should post, needs improvement, or avoid

Be objective and provide actionable insights.`;

      const userPrompt = `Analyze this Reddit content for r/${subreddit}:

${content}

Provide detailed analysis including scores, risk assessment, and recommendations.`;

      const response = await this.client.post('/chat/completions', {
        model: model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 400,
        temperature: 0.3,
        top_p: 0.8
      });

      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        throw new Error('Invalid response from Kimi API');
      }

      const analysis = response.data.choices[0].message.content.trim();
      
      return {
        analysis,
        model: model,
        tokensUsed: response.data.usage?.total_tokens || 0,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Kimi AI content analysis error:', error);
      throw new Error(`Failed to analyze content: ${error.message}`);
    }
  }

  /**
   * Generate content ideas based on trending topics
   */
  async generateContentIdeas(topic, subreddit, options = {}) {
    try {
      const {
        count = 5,
        contentType = 'post',
        model = 'moonshot-v1-32k' // Use larger model for more creative ideas
      } = options;

      const systemMessage = `You are a creative Reddit content strategist who generates engaging post and comment ideas based on trending topics and subreddit culture.

Guidelines:
- Create original, valuable content concepts
- Ensure ideas fit the subreddit's community and rules
- Focus on engagement and discussion potential
- Provide diverse angles and approaches
- Include specific details and hooks
- Avoid overused or cliché concepts

Generate ${count} unique content ideas for ${contentType} content.`;

      const userPrompt = `Generate content ideas for r/${subreddit} based on the trending topic: "${topic}"

Provide ${count} unique, engaging ideas that would perform well in this community. Include:
- Title/hook
- Brief content outline
- Why it would resonate with the audience
- Potential discussion points`;

      const response = await this.client.post('/chat/completions', {
        model: model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 800,
        temperature: 0.8,
        top_p: 0.9
      });

      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        throw new Error('Invalid response from Kimi API');
      }

      const ideas = response.data.choices[0].message.content.trim();
      
      return {
        ideas,
        topic,
        subreddit,
        contentType,
        count,
        model: model,
        tokensUsed: response.data.usage?.total_tokens || 0,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Kimi AI content ideas generation error:', error);
      throw new Error(`Failed to generate content ideas: ${error.message}`);
    }
  }

  /**
   * Log AI usage for analytics and billing tracking
   */
  async logUsage(userId, operation, tokensUsed, model) {
    try {
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'ai_generation',
          target: operation,
          result: 'success',
          metadata: {
            aiProvider: 'kimi',
            model: model,
            tokensUsed: tokensUsed,
            operation: operation
          }
        }
      });
    } catch (error) {
      console.error('Error logging AI usage:', error);
      // Don't throw error as this is just logging
    }
  }

  /**
   * Check API availability and key validity
   */
  async healthCheck() {
    try {
      const response = await this.client.post('/chat/completions', {
        model: this.defaultModel,
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        max_tokens: 5
      });

      return {
        status: 'healthy',
        model: this.defaultModel,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Kimi API health check failed:', error);
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = KimiAIService;