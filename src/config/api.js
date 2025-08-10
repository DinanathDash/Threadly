/**
 * API configuration for Threadly
 * This file centralizes API endpoint configuration for both development and production
 */

// For production environment (deployed on Firebase), use the full Render URL
// For development, use relative URLs that will be handled by Vite's proxy
export const getApiUrl = (endpoint) => {
  // __BACKEND_URL__ is defined in vite.config.js
  // In development, it will be undefined, and we'll use relative URLs
  // In production, it will be the URL to the backend
  const baseUrl = typeof __BACKEND_URL__ !== 'undefined' ? __BACKEND_URL__ : '';
  
  return `${baseUrl}${endpoint}`;
};

// Example usage:
// import { getApiUrl } from '@/config/api';
// fetch(getApiUrl('/api/slack/channels'))
