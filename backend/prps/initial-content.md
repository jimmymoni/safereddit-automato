# Content Upload Feature
**Feature**: Upload images/text, select subreddits, schedule posts.
**Endpoints**:
- /api/content/upload: Save content to DB, queue with node-cron.
- /api/content/schedule: Post to Reddit (/api/submit).
**Safety**:
- Limit: 1 post/10 mins per subreddit.
- Random delays: 1-5 mins.
- Log actions to ActivityLog.
**Docs**:
- Reddit API: https://www.reddit.com/dev/api#POST_api_submit