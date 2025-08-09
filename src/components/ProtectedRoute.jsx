import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  // If auth is still loading, show our full screen loading component
  if (loading) {
    return <LoadingScreen message="Authenticating..." />;
  }

  // If not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If logged in, show the protected content
  return children;
};

export default ProtectedRoute;
