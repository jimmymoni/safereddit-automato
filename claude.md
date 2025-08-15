# Global Rules for SafeReddit Automator

- Follow Reddit TOS: Max 100 API queries/min, 1 post per 10-15 mins per subreddit, user-approved upvotes only.
- Use Node.js best practices: Async/await, error handling, modular code.
- Frontend: React with Tailwind CSS, clean and modern UI.
- Backend: Express with Prisma, JWT auth, secure Reddit OAuth (scopes: identity, read, submit, vote).
- Use env vars for secrets (process.env.REDDIT_CLIENT_ID, etc.).
- Add clear comments explaining automation logic, especially safety delays (1-5 mins).
- KISS: Simple, maintainable code.
- Validate inputs: Joi for backend, PropTypes for React.
- Write unit tests for all features.