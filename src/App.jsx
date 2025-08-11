import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider } from './context/AuthContext';
import { SlackProvider } from './context/SlackContext';
import { GlobalLoadingProvider } from './context/GlobalLoadingContext';
import ThirdPartyScriptHandler from './components/ThirdPartyScriptHandler';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';

// Import styles
import '@/styles/responsive.css';

// Import theme
import theme from './lib/theme';

// Import layouts
import MainLayout from './layouts/MainLayout';

// Import pages
import LoginPage from './pages/auth/LoginPage';
import OAuthCallbackPage from './pages/auth/OAuthCallbackPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import SlackTestPage from './pages/dashboard/SlackTestPage';
import SendMessagePage from './pages/messages/SendMessagePage';
import ScheduledMessagesPage from './pages/messages/ScheduledMessagesPage';
import ChannelPage from './pages/messages/ChannelPage';
import NotFoundPage from './pages/errors/NotFoundPage';
import ErrorPage from './pages/errors/ErrorPage';
import SupportPage from './pages/support/SupportPage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AuthProvider>
          <GlobalLoadingProvider>
            <SlackProvider>
              {/* This component handles third-party script errors */}
              <ThirdPartyScriptHandler />
              <Toaster position="top-right" />
              <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50">
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<LoginPage />} />
                  <Route path="/oauth-callback" element={
                    <ProtectedRoute>
                      <OAuthCallbackPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/slack-test" element={
                    <ProtectedRoute>
                      <SlackTestPage />
                    </ProtectedRoute>
                  } />
                
                  <Route element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/send-message" element={<SendMessagePage />} />
                    <Route path="/scheduled" element={<ScheduledMessagesPage />} />
                    <Route path="/channel/:channelId" element={<ChannelPage />} />
                    <Route path="/support" element={<SupportPage />} />
                  </Route>
                
                  {/* 404 Page */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </ErrorBoundary>
              </div>
            </SlackProvider>
          </GlobalLoadingProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
