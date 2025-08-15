# SafeReddit Automator - Complete API Architecture

## 🏗️ Internal APIs (Our Backend)

### **1. Authentication APIs** ✅ *[COMPLETED]*
```
POST   /api/auth/reddit              # Start Reddit OAuth
GET    /api/auth/reddit/callback     # Handle OAuth callback
POST   /api/auth/verify              # Verify JWT token
GET    /api/auth/me                  # Get current user
POST   /api/auth/refresh             # Refresh Reddit token
POST   /api/auth/logout              # Logout user
```

### **2. Content Management APIs** ✅ *[COMPLETED]*
```
# Content CRUD
POST   /api/content/items            # Create content item
GET    /api/content/items            # Get user's content (with filters)
PUT    /api/content/items/:id        # Update content item
DELETE /api/content/items/:id        # Delete content item

# Scheduling
POST   /api/content/schedule         # Schedule post
GET    /api/content/scheduled        # Get scheduled posts
DELETE /api/content/scheduled/:id    # Cancel scheduled post

# Analytics
GET    /api/content/analytics        # Content performance metrics
GET    /api/content/suggestions      # AI content suggestions
GET    /api/content/vault            # Content vault (ready posts)
```

### **3. Reddit Scholar Autopilot APIs** 🔄 *[IN PROGRESS]*
```
# Autopilot Control
POST   /api/autopilot/start          # Start autopilot session
POST   /api/autopilot/stop           # Stop autopilot session
GET    /api/autopilot/status         # Get autopilot status
PUT    /api/autopilot/settings       # Update autopilot settings
GET    /api/autopilot/sessions       # Get autopilot session history

# AI Insights
GET    /api/insights/generate        # Generate AI insights
GET    /api/insights/active          # Get active insights
POST   /api/insights/dismiss         # Dismiss insight
GET    /api/insights/opportunities   # Get detected opportunities

# Queue Management
GET    /api/autopilot/queue          # Get action queue (next 24h)
POST   /api/autopilot/queue          # Add action to queue
DELETE /api/autopilot/queue/:id      # Remove action from queue
PUT    /api/autopilot/queue/:id      # Modify queued action
```

### **4. Reddit Integration APIs** 🔄 *[PENDING]*
```
# Posting
POST   /api/reddit/submit            # Submit post to Reddit
POST   /api/reddit/comment           # Post comment
PUT    /api/reddit/edit              # Edit post/comment
DELETE /api/reddit/delete            # Delete post/comment

# Engagement
POST   /api/reddit/vote              # Upvote/downvote
POST   /api/reddit/save              # Save post
POST   /api/reddit/follow            # Follow user

# Information Gathering
GET    /api/reddit/subreddit/:name   # Get subreddit info
GET    /api/reddit/post/:id          # Get post details
GET    /api/reddit/user/:username    # Get user profile
GET    /api/reddit/trending          # Get trending posts
```

### **5. Analytics & Monitoring APIs** 🔄 *[PENDING]*
```
# User Analytics
GET    /api/analytics/karma          # Karma growth over time
GET    /api/analytics/engagement     # Engagement metrics
GET    /api/analytics/health         # Account health metrics
GET    /api/analytics/performance    # Overall performance

# Subreddit Analytics
GET    /api/analytics/subreddits     # Subreddit performance analysis
GET    /api/analytics/timing         # Best posting times
GET    /api/analytics/competitors    # Competitor analysis

# Safety Monitoring
GET    /api/safety/risks             # Current risk assessment
GET    /api/safety/recommendations   # Safety recommendations
GET    /api/safety/compliance        # TOS compliance status
```

### **6. Trend Analysis APIs** 🔄 *[PENDING]*
```
# Trend Detection
GET    /api/trends/subreddit/:name   # Trending in specific subreddit
GET    /api/trends/keywords          # Trending keywords
GET    /api/trends/hashtags          # Trending hashtags
GET    /api/trends/topics            # Trending topics

# Opportunity Finder
GET    /api/opportunities/posts      # High-potential posts to engage with
GET    /api/opportunities/comments   # Comments to reply to
GET    /api/opportunities/timing     # Optimal posting opportunities
```

---

## 🌐 External APIs (Third-Party)

### **1. Reddit API** 🎯 *[PRIMARY INTEGRATION]*
```
Base URL: https://oauth.reddit.com/api/v1/

# Authentication (OAuth 2.0)
POST   /api/v1/access_token          # Get access token
GET    /api/v1/me                    # Get user info

# Content Submission
POST   /api/submit                   # Submit new post
POST   /api/comment                  # Add comment
POST   /api/editusertext            # Edit post/comment
POST   /api/del                     # Delete post/comment

# Voting & Engagement
POST   /api/vote                     # Vote on post/comment
POST   /api/save                     # Save content
POST   /api/unsave                   # Unsave content
POST   /api/follow                   # Follow user

# Information Retrieval
GET    /r/{subreddit}/about          # Subreddit info
GET    /r/{subreddit}/hot            # Hot posts
GET    /r/{subreddit}/new            # New posts
GET    /r/{subreddit}/top            # Top posts
GET    /r/{subreddit}/rising         # Rising posts
GET    /comments/{article}           # Post comments
GET    /user/{username}/about        # User profile
```

### **2. Kimi API** 🤖 *[AI CONTENT GENERATION - PRIMARY]*
```
Base URL: https://api.moonshot.cn/v1/

# Content Generation
POST   /chat/completions             # Generate posts/comments
POST   /completions                  # Text completion
POST   /embeddings                   # Content similarity analysis

# Models Available
- moonshot-v1-8k                     # 8K context window
- moonshot-v1-32k                    # 32K context window  
- moonshot-v1-128k                   # 128K context window
```

### **3. Alternative AI APIs** (Backup Options)
```
# OpenAI API (Fallback)
POST   /v1/chat/completions          # GPT-4/3.5 completions

# Anthropic Claude API
POST   /v1/complete                  # Claude completions
POST   /v1/messages                  # Claude messages

# Google Gemini API
POST   /v1/models/gemini:generateContent  # Content generation
```

### **4. Social Media Monitoring APIs** 📊 *[TREND ANALYSIS]*
```
# Reddit Metrics (pushshift.io alternative)
GET    /reddit/search/submission     # Search posts
GET    /reddit/search/comment        # Search comments
GET    /reddit/subreddit/{name}/stats # Subreddit statistics

# Social Media Trends
# Brand24 API, Mention.com API, or similar for broader trend analysis
```

### **5. Database APIs** 🗄️ *[DATA STORAGE]*
```
# PostgreSQL (via Prisma)
- User authentication and profiles
- Content storage and scheduling
- Activity logs and analytics
- Autopilot sessions and settings

# Redis (Optional - Caching)
GET/SET Cache trending data, API responses
GET/SET Queue management for autopilot actions
GET/SET Session storage and rate limiting
```

### **6. Email/Notification APIs** 📧 *[USER COMMUNICATION]*
```
# SendGrid API
POST   /v3/mail/send                 # Send email notifications

# Twilio API (SMS)
POST   /2010-04-01/Accounts/{sid}/Messages.json  # Send SMS alerts

# Push Notifications (OneSignal, Firebase)
POST   /api/v1/notifications         # Send push notifications
```

---

## 🔄 API Integration Flow

### **Autopilot Workflow:**
```
1. User starts autopilot → POST /api/autopilot/start
2. AI analyzes trends → GET /api/trends/opportunities
3. Content generated → POST Kimi /chat/completions
4. Post scheduled → POST /api/content/schedule
5. Safety check → GET /api/safety/risks
6. Post to Reddit → POST Reddit /api/submit
7. Log activity → Auto-logged via middleware
8. Update analytics → Background process
```

### **Content Creation Flow:**
```
1. User creates content → POST /api/content/items
2. AI suggests improvements → POST Kimi /chat/completions
3. Schedule optimal time → GET /api/analytics/timing
4. Queue for posting → POST /api/autopilot/queue
5. Execute post → POST Reddit /api/submit
6. Monitor performance → GET Reddit post metrics
7. Learn and adapt → Update AI models
```

---

## 📊 API Rate Limits & Quotas

### **Reddit API Limits:**
- 100 requests per minute per OAuth client
- 1 post per 10-15 minutes per subreddit
- 600 requests per 10 minutes per user

### **Kimi API Limits:**
- Pay-per-use model (more cost effective)
- moonshot-v1-8k: High throughput for short content
- moonshot-v1-32k: Medium throughput for detailed content  
- moonshot-v1-128k: Lower throughput for complex analysis

### **Our API Limits:**
- Authentication: 10 requests per 15 minutes per IP
- Content: 100 requests per 15 minutes per IP
- Autopilot: 50 requests per hour per user

---

## 🛡️ Safety & Compliance

### **Reddit TOS Compliance:**
- All API calls include random delays (1-5 minutes)
- Rate limiting strictly enforced
- User-approved actions only
- Complete activity logging
- Automatic risk assessment

### **Data Privacy:**
- No storing of Reddit passwords
- Encrypted token storage
- User data anonymization options
- GDPR compliance endpoints
- Data export/deletion APIs

This comprehensive API architecture ensures we have everything needed for a full-featured, compliant, and intelligent Reddit automation system!