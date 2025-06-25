import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface Props {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { user, loading } = useAuth();

  console.log('ProtectedRoute - user:', user);
  console.log('ProtectedRoute - loading:', loading);

  if (loading) {
    console.log('ProtectedRoute - showing loading state');
    return null; // veya bir loading spinner dönebilir
  }
  
  if (!user) {
    console.log('ProtectedRoute - no user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('ProtectedRoute - user authenticated, showing children');
  return <>{children}</>;
};

export default ProtectedRoute;
