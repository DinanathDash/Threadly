// Service to verify that we have proper connections to the Slack API
export const verifySlackApiConnection = async () => {
  try {
    // Make a test call to the Slack API status endpoint
    const response = await fetch('https://status.slack.com/api/v2.0.0/current');
    
    if (!response.ok) {
      return {
        success: false,
        message: `Slack API status check failed: ${response.status} ${response.statusText}`
      };
    }
    
    const data = await response.json();
    
    // Check if Slack API is operational
    if (data.status === 'ok' || data.status === 'active') {
      return {
        success: true,
        message: 'Slack API is operational'
      };
    } else {
      return {
        success: false,
        message: `Slack API reports status: ${data.status}`
      };
    }
  } catch (error) {
    console.error('Error checking Slack API status:', error);
    return {
      success: false,
      message: `Error checking Slack API: ${error.message}`
    };
  }
};

// Service to check SSL certificate validity
export const verifyCertificate = async (url) => {
  try {
    // Make a HEAD request to check the certificate
    const response = await fetch(url, { method: 'HEAD' });
    return {
      success: true,
      message: 'SSL certificate is valid'
    };
  } catch (error) {
    console.error(`SSL certificate error for ${url}:`, error);
    return {
      success: false,
      message: `SSL certificate error: ${error.message}`
    };
  }
};
