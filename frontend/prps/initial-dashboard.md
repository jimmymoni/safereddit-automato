# Dashboard Feature
**Feature**: React dashboard with Reddit OAuth connect, karma display, activity log.
**Components**:
- AuthButton: Triggers OAuth flow (redirect to /auth/reddit).
- DashboardView: Shows Reddit username, karma, activity log table (fetched from /api/user/dashboard).
**Tech**:
- React, Tailwind CSS (clean, modern UI).
- Axios for API calls.
- React Router for routing.
**Safety**:
- Handle OAuth errors gracefully.
- Display loading states and errors.
**Docs**:
- Reddit API: https://www.reddit.com/dev/api/oauth
- Tailwind: https://tailwindcss.com/docs