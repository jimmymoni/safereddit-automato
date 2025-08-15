# SafeReddit Automator

A comprehensive Reddit automation tool designed for organic growth while strictly adhering to Reddit's Terms of Service. Built with React frontend and Node.js backend.

## Features

- **Reddit OAuth Integration**: Secure authentication with Reddit API
- **Content Management**: Upload and schedule posts across multiple subreddits
- **Engagement Bot**: Automated upvoting and commenting with user approval
- **Activity Logging**: Complete audit trail of all automation activities
- **Safety First**: Built-in rate limiting and randomized delays
- **Modern UI**: Clean React interface with Tailwind CSS

## Tech Stack

**Frontend:**
- React 19 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Axios for API communication

**Backend:**
- Node.js with Express
- Prisma ORM with PostgreSQL
- Passport.js for Reddit OAuth
- JWT authentication
- node-cron for scheduling

## Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL database
- Reddit API credentials

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd safereddit
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Reddit API credentials and database URL
   ```

3. **Setup database:**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   npx prisma generate
   ```

4. **Start the application:**
   ```bash
   # From root directory
   npm start
   ```

The application will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## Reddit API Compliance

This tool strictly follows Reddit's Terms of Service:
- Maximum 100 API queries per minute
- 1 post per 10-15 minutes per subreddit
- User-approved upvotes only
- Randomized delays (1-5 minutes) between actions
- Complete activity logging

## Project Structure

```
safereddit/
├── frontend/          # React application
│   ├── src/
│   └── prps/         # Planning Request Proposals
├── backend/          # Express server
│   ├── prisma/       # Database schema
│   └── prps/         # Backend feature specs
├── prps/             # Global PRPs
├── .claude/          # Claude configuration
│   ├── commands/     # Slash commands
│   └── agents/       # Specialized agents
└── README.md
```

## Development

### Frontend Development
```bash
cd frontend
npm start           # Development server
npm test            # Run tests
npm run build       # Production build
```

### Backend Development
```bash
cd backend
node server.js      # Start server
npm test            # Run tests
```

### Using Claude Commands
- `/primer` - Map codebase and summarize project
- `/generate-prp <path>` - Create comprehensive PRP from feature spec
- `/execute-prp <path>` - Implement code from PRP

## Safety Features

- **Rate Limiting**: Automatic API request throttling
- **Random Delays**: 1-5 minute randomized waits between actions
- **Activity Logging**: Every action logged to database
- **User Approval**: All engagement requires user authorization
- **Error Handling**: Graceful failure recovery

## Testing

Run all tests:
```bash
npm test
```

Individual component testing:
```bash
# Frontend tests
cd frontend && npm test

# Backend tests  
cd backend && npm test
```

## License

MIT License - see LICENSE file for details.

## Disclaimer

This tool is designed for legitimate Reddit engagement. Users are responsible for ensuring compliance with Reddit's Terms of Service and community guidelines.