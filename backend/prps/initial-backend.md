# Backend Feature
**Feature**: Express server with Reddit OAuth, JWT auth, user dashboard endpoint.
**Endpoints**:
- /auth/reddit: Start OAuth flow (scopes: identity, read, submit, vote).
- /auth/reddit/callback: Save token to DB.
- /api/user/dashboard: Return username, karma, activity logs (JWT-protected).
**Tech**:
- Express, Prisma, passport-reddit, node-cron, express-rate-limit (100 reqs/min).
**Safety**:
- Randomized delays (1-5 mins) for Reddit API calls.
- Log all actions to ActivityLog model.
**Docs**:
- Reddit API: https://www.reddit.com/dev/api
- Passport: http://www.passportjs.org