import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

const mockUseAuth = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('redireciona para login se não autenticado', () => {
    mockUseAuth.mockReturnValue({ user: null });
    render(
      <MemoryRouter initialEntries={['/sleep']}>
        <ProtectedRoute>
          <div>Conteudo</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.queryByText('Conteudo')).toBeNull();
  });

  it('mostra conteúdo quando autenticado', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'a@test.com', name: 'A', isAdmin: false, canAccessSleep: true },
    });
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Conteudo</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('Conteudo')).toBeInTheDocument();
  });

  it('bloqueia módulo sem permissão', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'a@test.com', name: 'A', isAdmin: false, canAccessSleep: false },
    });
    render(
      <MemoryRouter>
        <ProtectedRoute requiredPermission="sleep">
          <div>Sono</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.queryByText('Sono')).toBeNull();
    expect(screen.getByText(/Acesso Limitado/i)).toBeInTheDocument();
  });

  it('bloqueia adminOnly para não-admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'a@test.com', name: 'A', isAdmin: false },
    });
    render(
      <MemoryRouter>
        <ProtectedRoute adminOnly>
          <div>Admin</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.queryByText('Admin')).toBeNull();
  });
});
