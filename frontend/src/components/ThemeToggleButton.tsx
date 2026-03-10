import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggleButton: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-outline-secondary border-0 shadow-lg rounded-circle position-fixed"
      style={{
        bottom: '20px',
        right: '20px',
        width: '50px',
        height: '50px',
        zIndex: 1050,
        backgroundColor: theme === 'dark' ? '#343a40' : '#ffffff',
        border: '2px solid #dee2e6',
        color: theme === 'dark' ? '#ffffff' : '#6c757d'
      }}
      title={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
    >
      <i className={`bi ${theme === 'light' ? 'bi-moon-fill' : 'bi-sun-fill'} fs-5`}></i>
    </button>
  );
};

export default ThemeToggleButton;