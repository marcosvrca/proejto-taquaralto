import React, { useState, useEffect } from 'react';
import api from '../services/api';

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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Buscar dados de todos os módulos com Promise.allSettled para não falhar se um endpoint não funcionar
      const [sleepRes, workoutRes, nutritionRes] = await Promise.allSettled([
        api.get(`/api/sleep/reports?period=${period}`),
        api.get(`/api/workouts/reports?period=${period}`),
        api.get(`/api/nutrition/reports?period=${period}`),
      ]);

      // Extrair dados ou usar valores padrão se falhar
      const sleepData = sleepRes.status === 'fulfilled' ? sleepRes.value.data : { records: [], bestDay: null, worstDay: null, weeklyAverage: 0, dailyAverage: 0 };
      const workoutData = workoutRes.status === 'fulfilled' ? workoutRes.value.data : { totalWorkouts: 0, totalMinutes: 0, mostPracticedType: '', mostActivePeriod: '' };
      const nutritionData = nutritionRes.status === 'fulfilled' ? nutritionRes.value.data : { totalMeals: 0, totalCalories: 0, dayWithMostMeals: null, maxCalories: 0 };

      // Calcular ranking baseado nos dados
      const sleepScore = calculateSleepScore(sleepData);
      const workoutScore = calculateWorkoutScore(workoutData);
      const nutritionScore = calculateNutritionScore(nutritionData);
      const overallScore = Math.round((sleepScore + workoutScore + nutritionScore) / 3);

      const ranking = {
        sleepScore,
        workoutScore,
        nutritionScore,
        overallScore,
        rank: getRank(overallScore)
      };

      // Mapear dados para o formato esperado pelo Dashboard
      const mappedData = {
        sleep: {
          totalSleepHours: sleepData.weeklyAverage ? sleepData.weeklyAverage / 60 : 0, // converter minutos para horas
          averageSleepHours: sleepData.dailyAverage ? sleepData.dailyAverage / 60 : 0, // converter minutos para horas
          bestSleepDay: sleepData.bestDay ? sleepData.bestDay.date : null,
          worstSleepDay: sleepData.worstDay ? sleepData.worstDay.date : null,
        },
        workouts: {
          totalWorkouts: workoutData.totalWorkouts || 0,
          totalWorkoutMinutes: workoutData.totalMinutes || 0,
          mostPracticedType: workoutData.mostPracticedType || '',
          mostActivePeriod: workoutData.mostActivePeriod || '',
        },
        nutrition: {
          totalMeals: nutritionData.totalMeals || 0,
          totalCalories: nutritionData.totalCalories || 0,
          dayWithMostMeals: nutritionData.dayWithMostMeals || null,
          dayWithMostCalories: nutritionData.maxCalories || 0,
        },
        ranking
      };

      setDashboardData(mappedData);
    } catch (error: any) {
      setMessage('❌ Erro ao carregar dados do dashboard');
      console.error('Erro no dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSleepScore = (sleepData: any): number => {
    if (!sleepData || sleepData.records?.length === 0) return 0;

    const avgHours = sleepData.dailyAverage ? sleepData.dailyAverage / 60 : 0; // dailyAverage está em minutos
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
    const totalMinutes = workoutData.totalMinutes || 0; // Campo correto retornado pelo controlador

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
      <div className="page-shell text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
        <p className="mt-3 text-muted">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-header__copy">
          <p className="page-eyebrow">Performance</p>
          <h1 className="page-title">Dashboard Completo</h1>
          <p className="page-subtitle">Visão geral de todos os seus dados de saúde</p>
        </div>
        <div className="page-period" role="group" aria-label="Período">
          {[
            { id: 'week', label: 'Semana' },
            { id: 'month', label: 'Mês' },
            { id: 'year', label: 'Ano' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              className={`page-period__btn ${period === p.id ? 'is-active' : ''}`}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {message && (
        <div className="alert alert-info alert-dismissible fade show mb-0" role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      {dashboardData && (
        <>
          <div className="row g-3">
            <div className="col-sm-6 col-xl-3">
              <div className="page-stat">
                <div className="page-stat__icon" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--accent)' }}>
                  <i className="bi bi-trophy-fill" />
                </div>
                <div className="page-stat__body">
                  <div className="page-stat__label">Score geral</div>
                  <div className="page-stat__value">{dashboardData.ranking.overallScore}%</div>
                  <div className="page-stat__meta">{dashboardData.ranking.rank}</div>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-xl-3">
              <div className="page-stat">
                <div className="page-stat__icon" style={{ background: 'rgba(93,173,226,0.15)', color: '#5dade2' }}>
                  <i className="bi bi-moon-stars-fill" />
                </div>
                <div className="page-stat__body">
                  <div className="page-stat__label">Sono</div>
                  <div className="page-stat__value">{dashboardData.ranking.sleepScore}%</div>
                  <div className="page-stat__meta">qualidade no período</div>
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
                  <div className="page-stat__value">{dashboardData.ranking.workoutScore}%</div>
                  <div className="page-stat__meta">atividade no período</div>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-xl-3">
              <div className="page-stat">
                <div className="page-stat__icon" style={{ background: 'rgba(46,204,113,0.15)', color: 'var(--success)' }}>
                  <i className="bi bi-apple" />
                </div>
                <div className="page-stat__body">
                  <div className="page-stat__label">Nutrição</div>
                  <div className="page-stat__value">{dashboardData.ranking.nutritionScore}%</div>
                  <div className="page-stat__meta">consistência alimentar</div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-4">
              <section className="page-panel h-100">
                <div className="page-panel__toolbar">
                  <h2 className="page-panel__title">
                    <i className="bi bi-moon-stars me-2" style={{ color: 'var(--accent)' }} />
                    Sono
                  </h2>
                </div>
                <div className="page-panel__body">
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
              </section>
            </div>

            <div className="col-lg-4">
              <section className="page-panel h-100">
                <div className="page-panel__toolbar">
                  <h2 className="page-panel__title">
                    <i className="bi bi-fire me-2 text-danger" />
                    Treinos
                  </h2>
                </div>
                <div className="page-panel__body">
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
                      {dashboardData.workouts.mostActivePeriod === 'manha' ? 'Manhã' :
                       dashboardData.workouts.mostActivePeriod === 'tarde' ? 'Tarde' : 'Noite'}
                    </span>
                  </div>
                </div>
              </section>
            </div>

            <div className="col-lg-4">
              <section className="page-panel h-100">
                <div className="page-panel__toolbar">
                  <h2 className="page-panel__title">
                    <i className="bi bi-apple me-2 text-success" />
                    Nutrição
                  </h2>
                </div>
                <div className="page-panel__body">
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
                      {dashboardData.nutrition.dayWithMostMeals
                        ? new Date(dashboardData.nutrition.dayWithMostMeals).toLocaleDateString('pt-BR')
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2">
                    <span className="text-muted small">Maior Consumo Calórico</span>
                    <span className="fw-bold small">{dashboardData.nutrition.dayWithMostCalories} cal</span>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <section className="page-panel">
            <div className="page-panel__toolbar">
              <h2 className="page-panel__title">Progresso por categoria</h2>
            </div>
            <div className="page-panel__body">
              <div className="row g-3">
                {[
                  { label: 'Sono', score: dashboardData.ranking.sleepScore, color: '#5dade2' },
                  { label: 'Treinos', score: dashboardData.ranking.workoutScore, color: '#e74c3c' },
                  { label: 'Nutrição', score: dashboardData.ranking.nutritionScore, color: '#2ecc71' },
                ].map((item) => (
                  <div className="col-md-4" key={item.label}>
                    <div className="text-center">
                      <div
                        className="mx-auto mb-2"
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          background: `conic-gradient(${item.color} 0% ${item.score}%, var(--surface-2) ${item.score}% 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            background: 'var(--surface)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            color: item.color,
                          }}
                        >
                          {item.score}%
                        </div>
                      </div>
                      <h6 className="mb-0">{item.label}</h6>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;