import React, { useEffect } from 'react';
import { setupCorsProxy } from '../services/corsProxy';

/**
 * This component helps handle various third-party script errors that might occur
 * during the Slack OAuth process. Slack loads multiple analytics and tracking scripts
 * that can generate console errors, but don't affect the core functionality.
 */
export function ThirdPartyScriptHandler() {
  useEffect(() => {
    // Set up our CORS and script error handling
    setupCorsProxy();
    
    // Create empty shims for common third-party services used by Slack
    // to prevent console errors from breaking our flow
    if (typeof window !== 'undefined') {
      // Shim for LinkedIn tracking
      window.lintrk = window.lintrk || function() {};
      
      // Shim for analytics services
      window.TD = window.TD || {};
      window.TD.analytics = window.TD.analytics || {
        track: function() {},
        identify: function() {},
        group: function() {}
      };
      
      // Handle OneTrust/Optanon cookie consent
      window.OptanonWrapper = window.OptanonWrapper || function() {};
      
      // Disable source map warnings
      const originalConsoleWarn = console.warn;
      console.warn = (...args) => {
        // Filter out source map warnings
        if (args[0] && typeof args[0] === 'string' && 
            (args[0].includes('Source map') || 
             args[0].includes('.min.js.map'))) {
          return;
        }
        originalConsoleWarn.apply(console, args);
      };
    }
    
    return () => {
      // Clean up any overrides if needed
      if (typeof window !== 'undefined' && console.warn.__originalWarn) {
        console.warn = console.warn.__originalWarn;
      }
    };
  }, []);
  
  // This component doesn't render anything
  return null;
}

export default ThirdPartyScriptHandler;
