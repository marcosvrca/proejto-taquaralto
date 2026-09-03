import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasModuleAccess, type ModulePermission } from '../types/user';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  icon: string;
  to?: string;
  soon?: boolean;
  permission?: ModulePermission;
  adminOnly?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    label: 'PERFORMANCE',
    items: [
      { label: 'Início', icon: 'bi-house', to: '/' },
      { label: 'Sono & Repouso', icon: 'bi-moon-stars', to: '/sleep', permission: 'sleep' },
      { label: 'Treinos', icon: 'bi-fire', to: '/workouts', permission: 'workouts' },
      { label: 'Nutrição', icon: 'bi-apple', to: '/nutrition', permission: 'nutrition' },
      { label: 'Metas', icon: 'bi-bullseye', to: '/goals', permission: 'goals' },
      { label: 'Relatórios', icon: 'bi-bar-chart', soon: true },
    ],
  },
  {
    label: 'SAÚDE',
    items: [
      { label: 'Saúde & Dores', icon: 'bi-heart-pulse', to: '/pains', permission: 'health' },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { label: 'Calendário', icon: 'bi-calendar3', to: '/calendar' },
      { label: 'Mensagens', icon: 'bi-chat-dots', soon: true },
      { label: 'Configurações', icon: 'bi-gear', soon: true },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      { label: 'Saúde do atleta', icon: 'bi-heart-pulse-fill', to: '/admin', adminOnly: true },
      { label: 'Métricas de jogos', icon: 'bi-clipboard-data', to: '/admin/athlete-performance', adminOnly: true },
      { label: 'Jogos & Calendário', icon: 'bi-trophy', to: '/admin/games', adminOnly: true },
      { label: 'Gerenciar Atletas', icon: 'bi-people', to: '/admin/users', adminOnly: true },
    ],
  },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleSections = SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.adminOnly) return !!user?.isAdmin;
      if (item.permission && user && !hasModuleAccess(user, item.permission)) return false;
      return true;
    }),
  })).filter((section) => section.items.length > 0);

  return (
    <aside className={`sidebar${open ? ' sidebar--open' : ''}`} aria-label="Navegação principal">
      <div className="sidebar__header">
        <NavLink to="/" className="sidebar__brand" onClick={onClose}>
          <div className="sidebar__logo">
            <i className="bi bi-shield-fill" />
          </div>
          <div className="sidebar__brand-text">
            <span className="sidebar__brand-title">TAQUARALTO</span>
            <span className="sidebar__brand-sub">Futsal</span>
          </div>
        </NavLink>
        <button
          type="button"
          className="sidebar__close-btn"
          onClick={onClose}
          aria-label="Fechar menu"
        >
          <i className="bi bi-x-lg" />
        </button>
      </div>

      <nav>
        {visibleSections.map((section) => (
          <div key={section.label} className="sidebar__section">
            <div className="sidebar__section-label">{section.label}</div>
            <ul className="sidebar__nav">
              {section.items.map((item) => (
                <li key={item.label}>
                  {item.soon || !item.to ? (
                    <span className="sidebar__link sidebar__link--disabled" title="Em breve">
                      <i className={`bi ${item.icon}`} />
                      {item.label}
                      <span className="sidebar__soon">Em breve</span>
                    </span>
                  ) : (
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
                      }
                      onClick={onClose}
                    >
                      <i className={`bi ${item.icon}`} />
                      {item.label}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar">{getInitials(user?.name || 'U')}</div>
          <div className="min-w-0">
            <div className="sidebar__user-name text-truncate">{user?.name || 'Usuário'}</div>
            <div className="sidebar__user-role">{user?.isAdmin ? 'Admin' : 'Atleta'}</div>
          </div>
        </div>
        <button type="button" className="sidebar__link sidebar__logout" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right" />
          Sair
        </button>
        <div className="sidebar__motto">DISCIPLINA HOJE, VITÓRIA SEMPRE!</div>
      </div>
    </aside>
  );
};

export default Sidebar;
