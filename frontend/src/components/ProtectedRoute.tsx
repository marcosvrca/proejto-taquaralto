import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasModuleAccess, type ModulePermission } from '../types/user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  requiredPermission?: ModulePermission;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false, requiredPermission }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/" />;
  }

  if (requiredPermission && !hasModuleAccess(user, requiredPermission)) {
    const handleGoBack = () => window.history.back();
    return (
      <div>
        <div className="alert alert-warning alert-dismissible fade show rounded-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          <strong>Acesso Limitado</strong> - Voce nao tem acesso a este modulo.
          <button type="button" className="btn-close btn-close-white" onClick={handleGoBack} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
