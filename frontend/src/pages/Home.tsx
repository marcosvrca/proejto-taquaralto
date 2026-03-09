import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { user } = useAuth();

  const menus = [
    { title: 'Sono & Repouso', description: 'Otimize sua recuperação diária', icon: 'bi-moon-stars', color: 'primary', link: '/sleep' },
    { title: 'Treinos', description: 'Monitore sua performance física', icon: 'bi-fire', color: 'danger', link: '/workouts' },
    { title: 'Nutrição', description: 'Mantenha o equilíbrio nutricional', icon: 'bi-apple', color: 'success', link: '/nutrition' },
    { title: 'Saúde & Dores', description: 'Previna lesões corporais', icon: 'bi-heart-pulse', color: 'warning', link: '/pains' },
    { title: 'Metas', description: 'Acompanhe seus objetivos', icon: 'bi-trophy', color: 'info', link: '/goals' },
  ];

  return (
    <div className="container py-5 mt-5">
      <div className="row mb-5">
        <div className="col-12">
          <div className="p-4 rounded-4 bg-white shadow-sm border-0 position-relative overflow-hidden">
             <div className="position-relative z-1">
                <p className="text-primary fw-bold text-uppercase small mb-1 tracking-wider">Dashboard Principal</p>
                <h1 className="fw-black text-dark mb-0">Olá, {(user?.name || 'Usuário').split(' ')[0]}! 👋</h1>
                <p className="text-secondary mt-1 lead fs-6">Sua jornada de alta performance continua aqui.</p>
             </div>
          </div>
        </div>
      </div>

      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {menus.map((menu, idx) => (
          <div className="col" key={idx}>
            <Link to={menu.link} className="text-decoration-none">
              <div className="card h-100 p-4 border-0">
                <div className={`rounded-4 bg-${menu.color}-subtle text-${menu.color} d-flex align-items-center justify-content-center mb-4`} style={{width: '60px', height: '60px'}}>
                  <i className={`bi ${menu.icon} fs-3`}></i>
                </div>
                <h3 className="h5 fw-bold text-dark mb-2">{menu.title}</h3>
                <p className="text-secondary small mb-0">{menu.description}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {user?.isAdmin && (
        <div className="mt-5 pt-5 border-top border-light-subtle">
          <h2 className="h4 fw-bold mb-4 d-flex align-items-center">
             <span className="bg-danger rounded-circle p-1 me-2" style={{width: '10px', height: '10px'}}></span>
             Área Administrativa
          </h2>
          <div className="col-lg-4">
             <Link to="/admin" className="text-decoration-none">
                <div className="card p-4 border-0">
                   <div className="d-flex align-items-center">
                      <div className="bg-dark rounded-4 p-3 me-3">
                         <i className="bi bi-people text-white fs-4"></i>
                      </div>
                      <div>
                         <h3 className="h6 fw-bold text-dark mb-1">Gerenciar Atletas</h3>
                         <p className="text-secondary small mb-0">Acesso administrativo</p>
                      </div>
                   </div>
                </div>
             </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;