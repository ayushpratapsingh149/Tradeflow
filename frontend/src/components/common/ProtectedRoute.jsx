import { Navigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { PageSpinner } from './Spinner';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;
