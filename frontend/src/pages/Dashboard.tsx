import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

interface DashboardData {
  sleep: {
    totalSleepHours: number;
    averageSleepHours: number;
    bestSleepDay: string;
    worstSleepDay: string;
  };
  workouts: {
    totalWorkouts: number;
    totalWorkoutMinutes: number;
    mostPracticedType: string;
    mostActivePeriod: string;
  };
  nutrition: {
    totalMeals: number;
    totalCalories: number;
    dayWithMostMeals: string;
    dayWithMostCalories: number;
  };
  ranking: {
    sleepScore: number;
    workoutScore: number;
    nutritionScore: number;
    overallScore: number;
    rank: string;
  };
}

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Buscar dados de todos os módulos
      const [sleepRes, workoutRes, nutritionRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/sleep/reports?period=${period}`, { headers }),
        axios.get(`${API_BASE_URL}/api/workouts/reports?period=${period}`, { headers }),
        axios.get(`${API_BASE_URL}/api/nutrition/reports?period=${period}`, { headers }),
      ]);

      // Calcular ranking baseado nos dados
      const sleepScore = calculateSleepScore(sleepRes.data);
      const workoutScore = calculateWorkoutScore(workoutRes.data);
      const nutritionScore = calculateNutritionScore(nutritionRes.data);
      const overallScore = Math.round((sleepScore + workoutScore + nutritionScore) / 3);

      const ranking = {
        sleepScore,
        workoutScore,
        nutritionScore,
        overallScore,
        rank: getRank(overallScore)
      };

      setDashboardData({
        sleep: sleepRes.data,
        workouts: workoutRes.data,
        nutrition: nutritionRes.data,
        ranking
      });
    } catch (error: any) {
      setMessage('❌ Erro ao carregar dados do dashboard');
      console.error('Erro no dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSleepScore = (sleepData: any): number => {
    if (!sleepData || sleepData.totalNights === 0) return 0;

    const avgHours = sleepData.averageSleepHours || 0;
    // Score baseado em 7-9 horas sendo ideal
    if (avgHours >= 7 && avgHours <= 9) return 100;
    if (avgHours >= 6 && avgHours < 7) return 80;
    if (avgHours >= 9 && avgHours <= 10) return 90;
    if (avgHours >= 5 && avgHours < 6) return 60;
    if (avgHours >= 10 && avgHours <= 11) return 70;
    return 40;
  };

  const calculateWorkoutScore = (workoutData: any): number => {
    if (!workoutData || workoutData.totalWorkouts === 0) return 0;

    const totalWorkouts = workoutData.totalWorkouts || 0;
    const totalMinutes = workoutData.totalWorkoutMinutes || 0;

    // Score baseado em frequência e duração
    let score = 0;
    if (totalWorkouts >= 5) score += 50; // 5+ treinos na semana
    else if (totalWorkouts >= 3) score += 30;
    else if (totalWorkouts >= 1) score += 10;

    if (totalMinutes >= 300) score += 50; // 5+ horas de treino
    else if (totalMinutes >= 150) score += 30;
    else if (totalMinutes >= 60) score += 10;

    return Math.min(score, 100);
  };

  const calculateNutritionScore = (nutritionData: any): number => {
    if (!nutritionData || nutritionData.totalMeals === 0) return 0;

    const totalMeals = nutritionData.totalMeals || 0;
    const totalCalories = nutritionData.totalCalories || 0;

    // Score baseado em regularidade das refeições
    let score = 0;
    if (totalMeals >= 21) score += 60; // 3 refeições por dia em média
    else if (totalMeals >= 14) score += 40;
    else if (totalMeals >= 7) score += 20;

    // Penalizar se muitas calorias (possível exagero)
    if (totalCalories > 10000) score -= 20;
    else if (totalCalories > 5000) score -= 10;

    return Math.max(score, 0);
  };

  const getRank = (score: number): string => {
    if (score >= 90) return '🏆 Mestre da Saúde';
    if (score >= 80) return '🥇 Especialista';
    if (score >= 70) return '🥈 Avançado';
    if (score >= 60) return '🥉 Intermediário';
    if (score >= 40) return '📈 Iniciante';
    return '🌱 Aprendiz';
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  if (loading) {
    return (
      <div className="container py-5 mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
        <p className="mt-3">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container py-5 mt-5">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="mb-0">📊 Dashboard Completo</h1>
              <p className="text-muted mt-1">Visão geral de todos os seus dados de saúde</p>
            </div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="form-select"
              style={{ width: 'auto' }}
            >
              <option value="week">Semanal</option>
              <option value="month">Mensal</option>
              <option value="year">Anual</option>
            </select>
          </div>
        </div>
      </div>

      {message && (
        <div className="alert alert-info alert-dismissible fade show" role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      {/* Ranking Geral */}
      {dashboardData && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-4">
                <h3 className="h2 mb-3">{dashboardData.ranking.rank}</h3>
                <div className="row">
                  <div className="col-md-3">
                    <div className="p-3">
                      <div className="h4 mb-1">{dashboardData.ranking.overallScore}%</div>
                      <small className="text-muted">Score Geral</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="p-3">
                      <div className="h4 mb-1 text-primary">{dashboardData.ranking.sleepScore}%</div>
                      <small className="text-muted">Sono</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="p-3">
                      <div className="h4 mb-1 text-danger">{dashboardData.ranking.workoutScore}%</div>
                      <small className="text-muted">Treinos</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="p-3">
                      <div className="h4 mb-1 text-success">{dashboardData.ranking.nutritionScore}%</div>
                      <small className="text-muted">Nutrição</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Relatórios por Módulo */}
      <div className="row">
        {/* Sono */}
        <div className="col-lg-4 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-primary-subtle border-0">
              <h5 className="card-title mb-0 d-flex align-items-center">
                <i className="bi bi-moon-stars me-2 text-primary"></i>
                Relatório de Sono
              </h5>
            </div>
            <div className="card-body">
              {dashboardData?.sleep && (
                <div className="space-y-3">
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted small">Total de Horas</span>
                    <span className="fw-bold">{dashboardData.sleep.totalSleepHours}h</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted small">Média Diária</span>
                    <span className="fw-bold">{dashboardData.sleep.averageSleepHours}h</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted small">Melhor Dia</span>
                    <span className="fw-bold small">
                      {dashboardData.sleep.bestSleepDay ? new Date(dashboardData.sleep.bestSleepDay).toLocaleDateString('pt-BR') : 'N/A'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2">
                    <span className="text-muted small">Pior Dia</span>
                    <span className="fw-bold small">
                      {dashboardData.sleep.worstSleepDay ? new Date(dashboardData.sleep.worstSleepDay).toLocaleDateString('pt-BR') : 'N/A'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Treinos */}
        <div className="col-lg-4 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-danger-subtle border-0">
              <h5 className="card-title mb-0 d-flex align-items-center">
                <i className="bi bi-fire me-2 text-danger"></i>
                Relatório de Treinos
              </h5>
            </div>
            <div className="card-body">
              {dashboardData?.workouts && (
                <div className="space-y-3">
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted small">Total de Treinos</span>
                    <span className="fw-bold">{dashboardData.workouts.totalWorkouts}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted small">Total de Minutos</span>
                    <span className="fw-bold">{dashboardData.workouts.totalWorkoutMinutes}min</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted small">Tipo Mais Praticado</span>
                    <span className="fw-bold small">{dashboardData.workouts.mostPracticedType || 'N/A'}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2">
                    <span className="text-muted small">Período Mais Ativo</span>
                    <span className="fw-bold small">
                      {dashboardData.workouts.mostActivePeriod === 'manha' ? '🌅 Manhã' :
                       dashboardData.workouts.mostActivePeriod === 'tarde' ? '☀️ Tarde' : '🌙 Noite'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nutrição */}
        <div className="col-lg-4 mb-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-success-subtle border-0">
              <h5 className="card-title mb-0 d-flex align-items-center">
                <i className="bi bi-apple me-2 text-success"></i>
                Relatório de Nutrição
              </h5>
            </div>
            <div className="card-body">
              {dashboardData?.nutrition && (
                <div className="space-y-3">
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted small">Total de Refeições</span>
                    <span className="fw-bold">{dashboardData.nutrition.totalMeals}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted small">Total de Calorias</span>
                    <span className="fw-bold">{dashboardData.nutrition.totalCalories}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted small">Dia com Mais Refeições</span>
                    <span className="fw-bold small">
                      {dashboardData.nutrition.dayWithMostMeals ? new Date(dashboardData.nutrition.dayWithMostMeals).toLocaleDateString('pt-BR') : 'N/A'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2">
                    <span className="text-muted small">Maior Consumo Calórico</span>
                    <span className="fw-bold small">{dashboardData.nutrition.dayWithMostCalories} cal</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Progresso */}
      {dashboardData && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header border-0">
                <h5 className="card-title mb-0">📈 Progresso por Categoria</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <div className="text-center">
                      <div className="position-relative d-inline-block mb-2">
                        <div className="progress-circle" style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          background: `conic-gradient(#007bff 0% ${dashboardData.ranking.sleepScore}%, #e9ecef ${dashboardData.ranking.sleepScore}% 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: 'white'
                          }}></div>
                        </div>
                        <div className="position-absolute top-50 start-50 translate-middle">
                          <span className="fw-bold text-primary">{dashboardData.ranking.sleepScore}%</span>
                        </div>
                      </div>
                      <h6>Sono</h6>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="text-center">
                      <div className="position-relative d-inline-block mb-2">
                        <div className="progress-circle" style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          background: `conic-gradient(#dc3545 0% ${dashboardData.ranking.workoutScore}%, #e9ecef ${dashboardData.ranking.workoutScore}% 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: 'white'
                          }}></div>
                        </div>
                        <div className="position-absolute top-50 start-50 translate-middle">
                          <span className="fw-bold text-danger">{dashboardData.ranking.workoutScore}%</span>
                        </div>
                      </div>
                      <h6>Treinos</h6>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="text-center">
                      <div className="position-relative d-inline-block mb-2">
                        <div className="progress-circle" style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          background: `conic-gradient(#198754 0% ${dashboardData.ranking.nutritionScore}%, #e9ecef ${dashboardData.ranking.nutritionScore}% 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: 'white'
                          }}></div>
                        </div>
                        <div className="position-absolute top-50 start-50 translate-middle">
                          <span className="fw-bold text-success">{dashboardData.ranking.nutritionScore}%</span>
                        </div>
                      </div>
                      <h6>Nutrição</h6>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;