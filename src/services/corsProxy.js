// CORS Proxy helper for handling third-party requests
export const setupCorsProxy = () => {
  // Add event listener for unhandled CORS errors
  window.addEventListener('error', (e) => {
    // Check if it's a CORS error from slack.com or third-party scripts
    if (e.message && (
      // Handle Slack tracking URL CORS issues
      (e.message.includes('access control checks') && e.message.includes('slack.com/clog/track')) ||
      // Handle liadm.com tracking URL CORS issues
      (e.message.includes('access control checks') && e.message.includes('rp.liadm.com')) ||
      // Handle source map 403 errors
      (e.message.includes('Failed to load resource') && e.message.includes('.min.js.map')) ||
      // Handle sandboxed iframe errors
      e.message.includes('document\'s frame is sandboxed') ||
      // Handle LinkedIn tracking errors
      e.message.includes('window.lintrk is not a function') ||
      // Handle Optanon/OneTrust errors
      e.message.includes('Error in Optanon wrapper') ||
      // Handle Unhandled Promise Rejection
      e.message.includes('Unhandled Promise Rejection')
    )) {
      console.warn('Intercepted third-party script error - safe to ignore:', e.message.substring(0, 100) + '...');
      // Prevent the error from showing in console
      e.preventDefault();
      return true;
    }
    return false;
  });
  
  // Create a shim for LinkedIn tracking to prevent errors
  if (typeof window !== 'undefined' && !window.lintrk) {
    window.lintrk = function() {
      // No-op function to prevent errors
      console.debug('LinkedIn tracking call intercepted (safe to ignore)');
    };
  }
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && typeof event.reason.message === 'string') {
      // Check if it's a CORS-related error from third-party scripts
      if (
        event.reason.message.includes('access control checks') ||
        event.reason.message.includes('Load failed') ||
        (event.reason.message.includes('Failed to fetch') && 
         (event.reason.message.includes('slack.com') || event.reason.message.includes('liadm.com')))
      ) {
        console.warn('Intercepted third-party unhandled promise rejection - safe to ignore:', 
          event.reason.message.substring(0, 100) + '...');
        event.preventDefault();
        return true;
      }
    }
    return false;
  });
};
