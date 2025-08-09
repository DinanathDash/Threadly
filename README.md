# Slack Connect

A full-stack application that enables users to connect their Slack workspace, send messages immediately, and schedule messages for future delivery.

## Features

- **Secure Slack Connection & Token Management**
  - OAuth 2.0 flow integration with Slack
  - Secure token storage (both access and refresh tokens)
  - Automatic token refresh without user re-authentication

- **Message Sending**
  - Send immediate messages to Slack channels
  - Schedule messages for future dates and times
  - Clean, modern user interface for composing messages

- **Scheduled Message Management**
  - View all currently scheduled messages
  - Cancel scheduled messages before their send time
  - User-friendly dashboard for message management

## Tech Stack

### Frontend
- React (with React Router)
- Shadcn UI for core components
- Material UI for enhanced styling
- Vite as build tool

### Backend
- Node.js with Express
- Firebase for authentication and data persistence
- Token management system for OAuth

## Architecture Overview

### OAuth Flow & Token Management
The application implements the OAuth 2.0 authorization flow to securely connect to a user's Slack workspace:

1. User initiates connection by clicking "Connect with Slack"
2. They are redirected to Slack's authorization page
3. After approving, Slack redirects back with an authorization code
4. Our backend exchanges this code for access and refresh tokens
5. Tokens are securely stored in Firebase Firestore
6. A token refresh mechanism automatically obtains new access tokens when needed

### Scheduled Messages System
The scheduled message system operates through these components:

1. Messages are scheduled through the user interface with specified date/time
2. Scheduled messages are stored in Firebase Firestore with metadata
3. A background process checks for messages due to be sent every minute
4. The system uses the stored tokens to authenticate with Slack API
5. After sending, the message status is updated in the database

## Setup Instructions

### Prerequisites
- Node.js (v16 or later)
- npm or yarn
- Firebase account
- Slack API credentials

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/slack-connect.git
cd slack-connect
```

2. Install dependencies
```bash
npm install
```

3. Create a Firebase project and enable Firestore

4. Create a Slack App in the [Slack API Dashboard](https://api.slack.com/apps)
   - Add the OAuth scopes: `channels:read`, `chat:write`
   - Set the redirect URL to `http://localhost:3000/oauth-callback` (for development)

5. Create a `.env` file based on `.env.example` and add your credentials
```bash
cp .env.example .env
# Edit the .env file with your credentials
```

6. Start the development server
```bash
# In one terminal (frontend)
npm run dev

# In another terminal (backend)
npm run dev:server
```

7. Open your browser to `http://localhost:5173` to see the application

### Building for Production

```bash
npm run build
```

The frontend will be built to the `dist` directory, and the server is configured to serve these files in production mode.

To start the production server:
```bash
npm start
```

## Deployment

This application can be deployed using various services:

- **Frontend**: Firebase Hosting, Vercel, or Netlify
- **Backend**: Render, Heroku, or Firebase Cloud Functions

## Challenges & Learnings

### Token Management
Implementing proper token refresh logic was challenging to ensure users maintain continuous access without requiring re-authentication. The solution involved storing token expiration times and proactively refreshing them before they expire.

### Scheduled Message System
Creating a reliable system for scheduled messages required careful consideration of time zones, database design, and error handling to ensure messages are delivered at the exact scheduled time.

### Firebase Integration
Using Firebase for both authentication and data storage provided a streamlined development experience, but required careful planning for security rules and database schema design.
