import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const AppShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <div
          className="app-shell__overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="app-shell__main">
        <div className="app-shell__mobile-bar">
          <button
            type="button"
            className="app-shell__menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <i className="bi bi-list fs-4" />
          </button>
          <span className="fw-bold" style={{ color: 'var(--accent)', letterSpacing: '0.04em', fontSize: '0.85rem' }}>
            TAQUARALTO FUTSAL
          </span>
        </div>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
