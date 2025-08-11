import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Determine if we're in production mode
  const isProduction = mode === 'production';
  
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Development server proxy configuration (only used during development)
    server: {
      proxy: {
        // Proxy API requests to backend server
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
        // Proxy OAuth callback requests to backend server
        '/oauth/callback': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    // Define environment variables for the client-side code
    define: {
      // In development, this will be undefined, which is what we want for relative paths
      // In production, this will be the URL to the backend
      __BACKEND_URL__: isProduction ? JSON.stringify('https://threadly-32ln.onrender.com') : 'undefined'
    }
  }
})