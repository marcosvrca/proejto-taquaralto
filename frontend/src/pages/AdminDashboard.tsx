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

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('week');
  const [selectedUser, setSelectedUser] = useState<UserMetrics | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchUsers = async (selectedPeriod: string) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/api/admin/users?period=${selectedPeriod}`);
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
      const res = await api.get(`/api/admin/users/${userId}?period=${period}`);
      setUserDetails(res.data);
      setShowDetails(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes do usuário:', error);
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    fetchUsers(newPeriod);
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
    fetchUsers(period);
  }, [user?.isAdmin, period]);

  if (!user?.isAdmin) {
    return (
      <div className="w-100">
        <div className="alert alert-danger" role="alert">
          Acesso negado. Apenas administradores podem acessar esta página.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-100">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-100">
      {/* Header */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="p-4 rounded-4 bg-white shadow-sm border-0">
            <p className="text-primary fw-bold text-uppercase small mb-1">Painel Administrativo</p>
            <h1 className="fw-black text-dark mb-3">Ranking de Saúde dos Usuários 📊</h1>
            
            {/* Period Filter */}
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn ${period === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handlePeriodChange('week')}
              >
                Esta Semana
              </button>
              <button
                type="button"
                className={`btn ${period === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handlePeriodChange('month')}
              >
                Este Mês
              </button>
              <button
                type="button"
                className={`btn ${period === 'year' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handlePeriodChange('year')}
              >
                Este Ano
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="mb-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
          <p className="text-secondary">Carregando dashboard administrativo...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          Nenhum usuário encontrado.
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="p-3 rounded-3 bg-light border-0">
                <p className="text-secondary mb-1">Total de Usuários</p>
                <h3 className="fw-bold text-dark">{users.length} 👥</h3>
              </div>
            </div>
          </div>

          {/* Ranking Table */}
          <div className="row">
            <div className="col-12">
              <div className="table-responsive rounded-4 bg-white shadow-sm overflow-hidden">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" className="border-0 ps-4">Posição</th>
                      <th scope="col" className="border-0">Nome</th>
                      <th scope="col" className="border-0">Email</th>
                      <th scope="col" className="border-0 text-center">
                        <span title="Sono">😴 Sono</span>
                      </th>
                      <th scope="col" className="border-0 text-center">
                        <span title="Treinos">🏋️ Treinos</span>
                      </th>
                      <th scope="col" className="border-0 text-center">
                        <span title="Nutrição">🥗 Nutrição</span>
                      </th>
                      <th scope="col" className="border-0 text-center">Score Geral</th>
                      <th scope="col" className="border-0 text-center">Ranking</th>
                      <th scope="col" className="border-0 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr key={user.id} className="align-middle">
                        <td className="ps-4 fw-bold">{index + 1}º</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div
                              className="rounded-circle me-3"
                              style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: getColorByScore(user.overallScore),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 'bold',
                              }}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="fw-500">{user.name || 'Sem nome'}</span>
                          </div>
                        </td>
                        <td>
                          <small className="text-muted">{user.email}</small>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-info-soft text-info">
                            {user.metrics.sleep.score}
                          </span>
                          <br />
                          <small className="text-muted">{user.metrics.sleep.averageHours}h</small>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-danger-soft text-danger">
                            {user.metrics.workouts.score}
                          </span>
                          <br />
                          <small className="text-muted">{user.metrics.workouts.total}x</small>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-success-soft text-success">
                            {user.metrics.nutrition.score}
                          </span>
                          <br />
                          <small className="text-muted">{user.metrics.nutrition.cleanMealPercentage}%</small>
                        </td>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center">
                            <div
                              style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                backgroundColor: getColorByScore(user.overallScore),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '20px',
                                fontWeight: 'bold',
                              }}
                            >
                              {user.overallScore}
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-secondary p-2">
                            {user.rank}
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleViewDetails(user)}
                          >
                            Ver Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* User Details Modal */}
          {showDetails && userDetails && (
            <AthleteDetailsModal details={userDetails} onClose={handleCloseDetails} />
          )}
        </>
      )}
    </div>
  );
};

function getColorByScore(score: number): string {
  if (score >= 90) return '#28a745'; // Green
  if (score >= 80) return '#20c997'; // Teal
  if (score >= 70) return '#17a2b8'; // Cyan
  if (score >= 60) return '#ffc107'; // Yellow
  if (score >= 40) return '#fd7e14'; // Orange
  return '#dc3545'; // Red
}

export default AdminDashboard;
