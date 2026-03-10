import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
      return (
        <div className="container py-5 mt-5">
          <div className="alert alert-warning alert-dismissible fade show rounded-4" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>Acesso Limitado</strong> - Você não tem permissão para acessar este módulo.
            <button type="button" className="btn-close" onClick={() => window.history.back()}"></button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;