# Threadly - Slack Connect

A full-stack application that enables users to connect their Slack workspace, send messages immediately, and schedule messages for future delivery.

![Threadly Logo](./src/assets/Logo.svg)

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
- React with React Router for navigation
- Shadcn UI for core components and modern UI elements
- Vite as the build tool for fast development and optimized production builds
- Context API for global state management
- Custom hooks for shared functionality

### Backend
- Node.js with Express.js for RESTful API implementation
- Firebase for authentication and data persistence
- Token management system for secure OAuth 2.0 implementation
- JSON file-based storage for tokens and channel information

## Architecture Overview

### OAuth Flow & Token Management
The application implements the OAuth 2.0 authorization flow to securely connect to a user's Slack workspace:

1. User initiates connection by clicking "Connect with Slack"
2. They are redirected to Slack's authorization page where they approve the requested scopes
3. After approval, Slack redirects back to our application with an authorization code
4. Our backend exchanges this code for access and refresh tokens via Slack's OAuth API
5. Tokens are securely stored using encryption and saved in our JSON-based storage
6. A token refresh mechanism (`tokenRefreshService.js`) automatically obtains new access tokens when needed
7. The token security service (`tokenSecurityService.js`) handles encryption/decryption of sensitive token data

### Scheduled Messages System
The scheduled message system operates through these components:

1. Messages are scheduled through the user interface with specified channel, content, date, and time
2. Scheduled messages are stored in our database with complete metadata and delivery status
3. A background process (`server/services/messageScheduler.js`) runs at regular intervals to check for pending messages
4. When a message's scheduled time arrives, the system retrieves the necessary tokens and authenticates with Slack API
5. The message is sent to the specified channel using Slack's chat.postMessage API
6. After sending, the message status is updated in the database to reflect delivery status and any response from Slack

## Setup Instructions

### Prerequisites
- Node.js (v16 or later)
- npm or yarn
- Firebase account (for authentication and data persistence)
- Slack API credentials (for OAuth integration)

### Installation

1. Clone the repository
```bash
git clone https://github.com/DinanathDash/Threadly.git
cd Threadly
```

2. Install dependencies
```bash
npm install
```

3. Configure Firebase
   - Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication and Firestore services
   - Generate a service account key (Project settings > Service accounts > Generate new private key)
   - Save the service account JSON file to `server/config/keys/service-account.json`
   - Update Firebase configuration in `server/config/firebase.js` with your project details

4. Create a Slack App in the [Slack API Dashboard](https://api.slack.com/apps)
   - Create a new app and select "From scratch"
   - Add the following OAuth scopes under "OAuth & Permissions":
     - `channels:read` - To view channel information
     - `chat:write` - To send messages to channels
     - `chat:write.public` - To send messages to channels the app isn't in
     - `chat:write.customize` - To customize message appearance
     - `channels:history` - To view message history
     - `chat:schedule` - To schedule messages
     - `chat:schedule:write` - To write scheduled messages
     - `users:read` - To read user information
     - `users:read.email` - To access user email addresses
     - `team:read` - To read team information
     - `groups:read` - To read private channel information
     - `mpim:read` - To read group direct message information
     - `im:read` - To read direct message information
   - Set the redirect URL to `http://localhost:3000/slack/oauth/callback` (for development)
   - Note your Client ID and Client Secret for the next step

5. Create a `.env` file in the root directory and add your credentials
```bash
# Create .env file
touch .env

# Add the following variables to your .env file
VITE_API_URL=http://localhost:3000
SERVER_PORT=3000
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_REDIRECT_URI=http://localhost:3000/slack/oauth/callback
TOKEN_ENCRYPTION_KEY=a_secure_32_character_encryption_key
```

6. Generate SSL certificates for local HTTPS (optional but recommended)
```bash
mkdir -p server/cert
cd server/cert
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout key.pem -out cert.pem
cd ../..
```

7. Start the development servers
```bash
# In one terminal (for frontend)
npm run dev

# In another terminal (for backend)
npm run dev:server
```

8. For public URL testing with ngrok (optional)
```bash
# In a third terminal
node start-with-ngrok.js
```

9. Open your browser to `http://localhost:5173` to see the application

### Building for Production

```bash
# Build the frontend
npm run build
```

The frontend will be built to the `dist` directory, and the server is configured to serve these static files in production mode.

To start the production server:
```bash
npm start
```

## Deployment

This application can be deployed using various services:

### Option 1: Single Platform Deployment
- **Render**: Deploy both frontend and backend as a single web service
- **Heroku**: Deploy using a Procfile that starts the Node.js server

### Option 2: Split Deployment
- **Frontend**: Firebase Hosting, Vercel, or Netlify
  - Update the `VITE_API_URL` to point to your deployed backend URL
  - Configure build settings to run `npm run build`

- **Backend**: Render, Heroku, or Railway
  - Set all required environment variables in the platform's dashboard
  - Ensure the CORS configuration in the backend allows requests from your frontend domain

### Required Environment Variables for Production
```
NODE_ENV=production
SERVER_PORT=3000 (or as provided by hosting platform)
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_REDIRECT_URI=https://your-domain.com/slack/oauth/callback
TOKEN_ENCRYPTION_KEY=your_secure_encryption_key
```

## Challenges & Learnings

### OAuth Implementation and Token Management
- **Challenge**: Implementing the complete OAuth 2.0 flow with Slack was complex, particularly handling the token exchange and securely storing sensitive credentials.
- **Solution**: We developed a comprehensive token management system with separate services for token storage (`slackTokenService.js`), refresh (`tokenRefreshService.js`), and security (`tokenSecurityService.js`). This modular approach allowed us to securely handle token encryption/decryption and implement automated refresh logic.
- **Learning**: Understanding the OAuth 2.0 protocol in depth and implementing proper security practices for handling tokens is crucial for maintaining secure third-party integrations.

### Scheduled Message System
- **Challenge**: Creating a reliable system for scheduled messages required solving several complex problems:
  - Handling different time zones accurately
  - Ensuring messages are sent at the exact scheduled time, even after server restarts
  - Managing race conditions when multiple messages are scheduled for the same time
- **Solution**: We implemented a robust scheduler that accounts for time zones, uses a queue system to prevent race conditions, and maintains persistent storage of scheduled messages with comprehensive status tracking.
- **Learning**: Time-based operations in distributed systems require careful design and error handling to ensure reliability.

### User Data and Channel Management
- **Challenge**: Retrieving and maintaining an up-to-date list of Slack channels while respecting API rate limits was challenging.
- **Solution**: We implemented a caching system for channel data with periodic refresh, reducing the number of API calls while keeping channel information current.
- **Learning**: Working with third-party APIs requires careful consideration of rate limits and implementing appropriate caching strategies.

### Error Handling and Resilience
- **Challenge**: Ensuring the application remains functional even when Slack API calls fail or return unexpected responses.
- **Solution**: We implemented comprehensive error handling throughout the application, with graceful degradation, automatic retries for transient failures, and clear user feedback.
- **Learning**: Robust error handling is essential for applications that depend on external services, as it ensures a good user experience even when things go wrong.

### UI/UX for Message Composition
- **Challenge**: Creating an intuitive interface for composing messages with advanced features like scheduling.
- **Solution**: We designed a clean, user-friendly message composer with integrated datetime picker and channel selector, with immediate feedback and validation.
- **Learning**: Even complex functionality can be made accessible through thoughtful UI design and clear user feedback.

## Project Structure

```
├── components.json        # Shadcn UI configuration
├── firebase.json          # Firebase configuration
├── package.json           # Project dependencies and scripts
├── server/                # Backend server code
│   ├── index.js           # Express server entry point
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── routes/            # API route definitions
│   ├── services/          # Business logic services
│   └── utils/             # Utility functions
├── src/                   # Frontend React application
│   ├── App.jsx            # Main application component
│   ├── main.jsx           # Entry point
│   ├── components/        # Reusable UI components
│   ├── context/           # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── layouts/           # Page layout components
│   ├── pages/             # Page components
│   └── services/          # API client services
```

## License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2025 Dinanath Dash

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
