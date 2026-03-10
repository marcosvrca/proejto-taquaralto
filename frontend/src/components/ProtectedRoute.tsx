import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
  canAccessSleep?: boolean;
  canAccessWorkouts?: boolean;
  canAccessNutrition?: boolean;
  canAccessHealth?: boolean;
  canAccessGoals?: boolean;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  requiredPermission?: 'sleep' | 'workouts' | 'nutrition' | 'health' | 'goals';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false, requiredPermission }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/" />;
  }

  if (requiredPermission) {
    const permissionMap: Record<string, keyof User> = {
      sleep: 'canAccessSleep',
      workouts: 'canAccessWorkouts',
      nutrition: 'canAccessNutrition',
      health: 'canAccessHealth',
      goals: 'canAccessGoals'
    };
    const permissionKey = permissionMap[requiredPermission];
    if (!user[permissionKey]) {
      const handleGoBack = () => window.history.back();
      return (
        <div className="container py-5 mt-5">
          <div className="alert alert-warning alert-dismissible fade show rounded-4">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>Acesso Limitado</strong> - Voce nao tem acesso a este modulo.
            <button type="button" className="btn-close" onClick={handleGoBack} />
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;