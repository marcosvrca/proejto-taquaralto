import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import AthleteDetailsModal from '../components/AthleteDetailsModal';
import './AdminDashboard.css';

interface UserMetrics {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  metrics: {
    sleep: {
      averageHours: number;
      totalNights: number;
      score: number;
    };
    workouts: {
      total: number;
      totalMinutes: number;
      score: number;
    };
    nutrition: {
      totalMeals: number;
      cleanMealPercentage: number;
      totalCalories: number;
      score: number;
    };
  };
  overallScore: number;
  rank: string;
}

const AVATAR_COLORS = ['#d4af37', '#2ecc71', '#5dade2', '#e67e22', '#9b59b6', '#1abc9c', '#e74c3c', '#f0d878'];

function getInitials(name?: string, email?: string) {
  const source = (name || email || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function avatarColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i) * (i + 1)) % 997;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserMetrics | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [search, setSearch] = useState('');

  const buildQuery = (selectedPeriod: string, from = customFrom, to = customTo) => {
    if (selectedPeriod === 'custom') {
      const params = new URLSearchParams({ period: 'custom' });
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      return params.toString();
    }
    return `period=${selectedPeriod}`;
  };

  const fetchUsers = async (selectedPeriod: string, from = customFrom, to = customTo) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/api/admin/users?${buildQuery(selectedPeriod, from, to)}`);
      setUsers(res.data.users || []);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error.response?.data || error.message);
      setError('Erro ao carregar usuários: ' + (error.response?.data?.message || error.message));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: number) => {
    try {
      const res = await api.get(`/api/admin/users/${userId}?${buildQuery(period)}`);
      setUserDetails(res.data);
      setShowDetails(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes do usuário:', error);
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      fetchUsers(newPeriod);
    }
  };

  const handleApplyCustom = () => {
    if (!customFrom && !customTo) {
      setError('Informe pelo menos a data inicial ou final.');
      return;
    }
    if (customFrom && customTo && customFrom > customTo) {
      setError('A data inicial não pode ser maior que a final.');
      return;
    }
    setPeriod('custom');
    fetchUsers('custom', customFrom, customTo);
  };

  const handleViewDetails = (user: UserMetrics) => {
    setSelectedUser(user);
    fetchUserDetails(user.id);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedUser(null);
    setUserDetails(null);
  };

  useEffect(() => {
    if (!user?.isAdmin) return;
    if (period === 'custom') return;
    fetchUsers(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.isAdmin, period]);

  const filteredUsers = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${u.name || ''} ${u.email || ''}`.toLowerCase().includes(q);
  });

  if (!user?.isAdmin) {
    return (
      <div className="page-shell">
        <div className="alert alert-danger" role="alert">
          Acesso negado. Apenas administradores podem acessar esta página.
        </div>
      </div>
    );
  }

  if (error && users.length === 0 && !loading) {
    return (
      <div className="page-shell">
        <div className="alert alert-danger" role="alert">
          {error}
          <button
            type="button"
            className="btn btn-sm btn-outline-light ms-3"
            onClick={() => {
              setError('');
              fetchUsers('week');
              setPeriod('week');
            }}
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-header__copy">
          <p className="page-eyebrow">Saúde do atleta</p>
          <h1 className="page-title">O que os atletas estão registrando</h1>
          <p className="page-subtitle">
            Sono, treinos, nutrição e saúde informados pelos atletas — e notas de treino/jogo do staff.
          </p>
          {(period === 'custom' || customFrom || customTo) && (
            <div className="page-custom-dates">
              <div>
                <label className="form-label small mb-1">De</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={customFrom}
                  onChange={(e) => {
                    setCustomFrom(e.target.value);
                    setPeriod('custom');
                  }}
                  max={customTo || undefined}
                />
              </div>
              <div>
                <label className="form-label small mb-1">Até</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={customTo}
                  onChange={(e) => {
                    setCustomTo(e.target.value);
                    setPeriod('custom');
                  }}
                  min={customFrom || undefined}
                />
              </div>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleApplyCustom}
                disabled={!customFrom && !customTo}
              >
                Aplicar
              </button>
            </div>
          )}
          {period === 'custom' && (customFrom || customTo) && (
            <small className="text-muted d-block mt-2">
              Período: {customFrom || '…'} → {customTo || 'hoje'}
            </small>
          )}
          {error && <div className="alert alert-warning py-2 mt-3 mb-0">{error}</div>}
        </div>
        <div className="page-period" role="group" aria-label="Período">
          {[
            { id: 'week', label: 'Semana' },
            { id: 'month', label: 'Mês' },
            { id: 'year', label: 'Ano' },
            { id: 'custom', label: 'Personalizado' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              className={`page-period__btn ${period === p.id ? 'is-active' : ''}`}
              onClick={() => (p.id === 'custom' ? setPeriod('custom') : handlePeriodChange(p.id))}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="text-secondary mt-3">Carregando saúde dos atletas...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          Nenhum usuário encontrado.
        </div>
      ) : (
        <>
          <div className="row g-3">
            <div className="col-sm-6 col-xl-3">
              <div className="page-stat">
                <div className="page-stat__icon" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--accent)' }}>
                  <i className="bi bi-people-fill" />
                </div>
                <div className="page-stat__body">
                  <div className="page-stat__label">Atletas</div>
                  <div className="page-stat__value">{users.length}</div>
                  <div className="page-stat__meta">no período</div>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-xl-3">
              <div className="page-stat">
                <div className="page-stat__icon" style={{ background: 'rgba(93,173,226,0.15)', color: '#5dade2' }}>
                  <i className="bi bi-moon-stars-fill" />
                </div>
                <div className="page-stat__body">
                  <div className="page-stat__label">Média sono</div>
                  <div className="page-stat__value">
                    {users.length
                      ? (
                          users.reduce((acc, u) => acc + (u.metrics.sleep.averageHours || 0), 0) / users.length
                        ).toFixed(1)
                      : '—'}
                  </div>
                  <div className="page-stat__meta">horas / noite</div>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-xl-3">
              <div className="page-stat">
                <div className="page-stat__icon" style={{ background: 'rgba(231,76,60,0.15)', color: 'var(--danger)' }}>
                  <i className="bi bi-fire" />
                </div>
                <div className="page-stat__body">
                  <div className="page-stat__label">Treinos</div>
                  <div className="page-stat__value">
                    {users.reduce((acc, u) => acc + (u.metrics.workouts.total || 0), 0)}
                  </div>
                  <div className="page-stat__meta">sessões somadas</div>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-xl-3">
              <div className="page-stat">
                <div className="page-stat__icon" style={{ background: 'rgba(46,204,113,0.15)', color: 'var(--success)' }}>
                  <i className="bi bi-apple" />
                </div>
                <div className="page-stat__body">
                  <div className="page-stat__label">Score médio</div>
                  <div className="page-stat__value">
                    {users.length
                      ? Math.round(users.reduce((acc, u) => acc + u.overallScore, 0) / users.length)
                      : '—'}
                  </div>
                  <div className="page-stat__meta">geral do elenco</div>
                </div>
              </div>
            </div>
          </div>

          <section className="page-panel">
            <div className="page-panel__toolbar">
              <h2 className="page-panel__title">Ranking de saúde</h2>
              <div className="page-panel__actions">
                <div className="page-search">
                  <i className="bi bi-search" />
                  <input
                    type="search"
                    placeholder="Buscar atleta..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Buscar atleta"
                  />
                </div>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-hover mb-0 page-table">
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>#</th>
                    <th>Atleta</th>
                    <th className="text-center">Sono</th>
                    <th className="text-center">Treinos</th>
                    <th className="text-center">Nutrição</th>
                    <th className="text-center">Score</th>
                    <th className="text-center">Ranking</th>
                    <th className="text-end">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-4">
                        Nenhum atleta encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((athlete, index) => (
                      <tr key={athlete.id} className="align-middle">
                        <td>
                          <div className="page-rank">
                            <span>{index + 1}</span>
                            {index === 0 && <i className="bi bi-award-fill page-medal page-medal--gold" />}
                            {index === 1 && <i className="bi bi-award-fill page-medal page-medal--silver" />}
                            {index === 2 && <i className="bi bi-award-fill page-medal page-medal--bronze" />}
                          </div>
                        </td>
                        <td>
                          <div className="page-person">
                            <div
                              className="page-avatar"
                              style={{ background: avatarColor(athlete.email || athlete.name) }}
                            >
                              {getInitials(athlete.name, athlete.email)}
                            </div>
                            <div className="min-w-0">
                              <div className="page-person__name">{athlete.name || 'Sem nome'}</div>
                              <div className="page-person__meta">{athlete.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className="page-pill">{athlete.metrics.sleep.score}</span>
                          <div className="small text-muted mt-1">{athlete.metrics.sleep.averageHours}h</div>
                        </td>
                        <td className="text-center">
                          <span className="page-pill">{athlete.metrics.workouts.score}</span>
                          <div className="small text-muted mt-1">{athlete.metrics.workouts.total}x</div>
                        </td>
                        <td className="text-center">
                          <span className="page-pill">{athlete.metrics.nutrition.score}</span>
                          <div className="small text-muted mt-1">
                            {athlete.metrics.nutrition.cleanMealPercentage}%
                          </div>
                        </td>
                        <td className="text-center">
                          <span
                            className="page-pill"
                            style={{
                              background: `${getColorByScore(athlete.overallScore)}22`,
                              borderColor: getColorByScore(athlete.overallScore),
                              color: getColorByScore(athlete.overallScore),
                            }}
                          >
                            {athlete.overallScore}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-secondary-subtle text-secondary">{athlete.rank}</span>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="page-details-btn"
                            onClick={() => handleViewDetails(athlete)}
                          >
                            Detalhes <i className="bi bi-chevron-right" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="page-panel__footer">
              <span className="text-muted small">
                Mostrando {filteredUsers.length} de {users.length} atletas
              </span>
            </div>
          </section>

          {showDetails && userDetails && (
            <AthleteDetailsModal
              details={userDetails}
              onClose={handleCloseDetails}
              onRefresh={() => selectedUser && fetchUserDetails(selectedUser.id)}
            />
          )}
        </>
      )}
    </div>
  );
};

function getColorByScore(score: number): string {
  if (score >= 90) return '#2ecc71';
  if (score >= 80) return '#1abc9c';
  if (score >= 70) return '#5dade2';
  if (score >= 60) return '#d4af37';
  if (score >= 40) return '#e67e22';
  return '#e74c3c';
}

export default AdminDashboard;
