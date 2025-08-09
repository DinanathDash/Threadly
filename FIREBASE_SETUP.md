# Firebase Authentication Setup

## 1. Firebase Setup Instructions

### 1.1. Create a Firebase Project (If you haven't already)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup instructions
3. Give your project a name (e.g., "Threadly")
4. Enable Google Analytics if desired
5. Click "Create project"

### 1.2. Set up Firebase Authentication

1. In your Firebase project, navigate to "Authentication" in the left sidebar
2. Click "Get started"
3. Enable the "Google" sign-in method:
   - Click on "Google" in the list
   - Toggle the "Enable" switch to on
   - Add a "Project support email" (your email)
   - Click "Save"
4. (Optional) Enable other authentication methods as needed

### 1.3. Create Web App Configuration

1. In your Firebase project, click on the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" and click the web icon (</>) to add a web app
4. Register your app with a nickname (e.g., "Threadly Web")
5. Copy the Firebase configuration object (will look like):
```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### 1.4. Generate Service Account Key for Server

1. In your Firebase project settings, go to the "Service accounts" tab
2. Click "Generate new private key" button
3. Save the JSON file securely (DO NOT commit this to version control)
4. Extract the values from the JSON to use in your .env file

## 2. Environment Variable Setup

1. Copy the `.env.template` file to create a new `.env` file:
```bash
cp .env.template .env
```

2. Fill in all the values from your Firebase project:
   - Frontend Firebase config from step 1.3
   - Server-side Firebase admin values from the service account key (step 1.4)
   - Slack API credentials from your Slack app

## 3. Authentication Flow

1. Users sign in with Google on the login page
2. After authentication, users can connect their Slack workspace
3. Slack tokens are stored in Firebase under the user's UID
4. Subsequent logins will retain the Slack connection

## 4. Troubleshooting

If you encounter authentication issues:

1. Check the Firebase console logs for auth errors
2. Verify environment variables are correctly set
3. Ensure the Firebase service account has proper permissions
4. Check Firestore rules to ensure they allow reading/writing user data
