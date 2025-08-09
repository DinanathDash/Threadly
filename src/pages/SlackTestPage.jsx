import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getSlackOAuthUrl } from '@/services/slackService';

export default function SlackTestPage() {
  const [redirectUri, setRedirectUri] = useState('https://localhost:3443/oauth/callback');
  const [response, setResponse] = useState(null);

  const handleGetOAuthUrl = async () => {
    try {
      // Use the actual implementation (now async) but with our test redirect URI
      const url = await getSlackOAuthUrl();
      
      console.log('Generated Slack OAuth URL with redirect URI:', redirectUri);
      console.log('Full URL:', url);
      
      // Open in a new tab
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error generating OAuth URL:', error);
      setResponse('Error generating OAuth URL: ' + error.message);
    }
  };

  const handleTestExchange = async () => {
    try {
      setResponse('Testing OAuth configuration...');
      
      const response = await fetch('/api/diagnostic/test-oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          redirectUri: redirectUri
        }),
      });
      
      const data = await response.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse('Error: ' + error.message);
    }
  };
  
  const handleTestSSL = async () => {
    try {
      setResponse('Testing SSL certificate...');
      
      const response = await fetch('https://localhost:3443/ssl-verify');
      const data = await response.json();
      
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse('SSL Error: ' + error.message + '\n\nThis might indicate SSL certificate issues. Make sure your browser trusts the development certificate.');
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Slack OAuth Test</CardTitle>
          <CardDescription>Test your Slack OAuth configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="redirectUri" className="text-sm font-medium">Redirect URI</label>
            <Input 
              id="redirectUri"
              value={redirectUri}
              onChange={(e) => setRedirectUri(e.target.value)}
              placeholder="Enter the redirect URI"
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Response:</h3>
            <pre className="p-2 bg-slate-100 rounded-md overflow-auto text-xs">
              {response || 'No response yet'}
            </pre>
          </div>
        </CardContent>
        <CardFooter className="space-x-4">
          <Button onClick={handleGetOAuthUrl}>Get OAuth URL</Button>
          <Button onClick={handleTestExchange} variant="outline">Test Config</Button>
          <Button onClick={handleTestSSL} variant="outline">Test SSL</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
