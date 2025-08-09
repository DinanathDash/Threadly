import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider } from './context/AuthContext';
import { SlackProvider } from './context/SlackContext';
import { GlobalLoadingProvider } from './context/GlobalLoadingContext';
import ThirdPartyScriptHandler from './components/ThirdPartyScriptHandler';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from '@/components/ui/sonner';

// Import theme
import theme from './lib/theme';

// Import layouts
import MainLayout from './layouts/MainLayout';

// Import pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import DashboardPage from './pages/DashboardPage';
import SendMessagePage from './pages/SendMessagePage';
import ScheduledMessagesPage from './pages/ScheduledMessagesPage';
import SlackTestPage from './pages/SlackTestPage';

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
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
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
                </Route>
              
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </div>
            </SlackProvider>
          </GlobalLoadingProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
