// Slack OAuth Testing Guide with ngrok

## Setup Instructions

1. Run the development server with ngrok:
   ```
   npm run dev:ngrok
   ```

2. When the server starts, note the ngrok URL displayed in the console

3. Update your Slack App's Redirect URL:
   - Go to https://api.slack.com/apps
   - Select your Slack app
   - Go to "OAuth & Permissions"
   - Update the Redirect URL to match the ngrok URL + "/oauth/callback"
   - Example: https://1234-abc-def.ngrok-free.app/oauth/callback
   - Save changes

4. Testing OAuth Flow:
   - Open the ngrok URL in your browser
   - Click on "Connect with Slack"
   - Complete the Slack authorization process

## Troubleshooting

### Firebase Errors
If you encounter Firebase credential errors during development:
- Tokens will automatically fall back to local storage in `server/data/slack_tokens.json`
- This allows testing OAuth flows even when Firebase isn't properly configured

### ngrok Session Limit
If you see "Your account is limited to 1 simultaneous ngrok agent sessions":
- Run `pkill -f ngrok` to kill existing sessions
- Then restart the server with `npm run dev:ngrok`

### SSL Certificate Issues
- ngrok provides a valid SSL certificate automatically
- No need to manage local certificates for development

### Code Already Processed
- Each authorization code can only be used once
- If you see "Code has already been processed", try the flow again from the beginning

## Production Deployment
- For production, configure proper Firebase credentials
- Update redirect URIs to match your production domain
