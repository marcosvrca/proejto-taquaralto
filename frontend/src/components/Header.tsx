import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg fixed-top py-3">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center fw-bold text-primary" to="/">
          <i className="bi bi-activity me-2"></i>
          <span>Taquaralto Futsal</span>
        </Link>
        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          {user && (
            <div className="d-flex align-items-center mt-3 mt-lg-0">
              <div className="me-3 text-end d-none d-md-block">
                <div className="fw-bold text-dark small">{user.name || 'Usuário'}</div>
                {user.isAdmin && <span className="badge bg-danger-subtle text-danger" style={{fontSize: '10px'}}>ADMIN</span>}
              </div>
              <div className="dropdown">
                <button className="btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center p-0" style={{width: '40px', height: '40px'}} data-bs-toggle="dropdown">
                  <span className="fw-bold text-primary">{(user.name || 'U').charAt(0).toUpperCase()}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 p-2 rounded-3">
                  <li><Link className="dropdown-item rounded-2" to="/"><i className="bi bi-house me-2"></i>Home</Link></li>
                  <li><Link className="dropdown-item rounded-2" to="/dashboard"><i className="bi bi-grid me-2"></i>Dashboard</Link></li>
                  {user.isAdmin && <>
                    <li><hr className="dropdown-divider" /></li>
                    <li><Link className="dropdown-item rounded-2 text-primary fw-bold" to="/admin"><i className="bi bi-shield-lock me-2"></i>Painel Admin</Link></li>
                    <li><Link className="dropdown-item rounded-2 text-primary" to="/admin/users"><i className="bi bi-people me-2"></i>Gerenciar Atletas</Link></li>
                  </>}
                  <li><hr className="dropdown-divider" /></li>
                  <li><button onClick={handleLogout} className="dropdown-item rounded-2 text-danger"><i className="bi bi-box-arrow-right me-2"></i>Sair</button></li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;