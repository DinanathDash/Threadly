import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/error-suppression.css'  // Import error suppression styles
import './styles/slack-inspired.css'     // Import Slack-inspired styles
import './styles/toaster.css'           // Import custom toaster styles
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
