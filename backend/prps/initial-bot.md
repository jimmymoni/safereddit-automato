# Engagement Bot
**Feature**: Search threads, upvote (user-approved), comment (1-2/hour).
**Endpoints**:
- /api/bot/search: Use /r/subreddit/search for keywords.
- /api/bot/upvote: User-approved upvotes (/api/vote).
- /api/bot/comment: Post comments (/api/comment).
**Safety**:
- Max 2 actions/hour.
- Random delays: 1-5 mins.
- Log all to ActivityLog.
**Docs**:
- Reddit API: https://www.reddit.com/dev/api