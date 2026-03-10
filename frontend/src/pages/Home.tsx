import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';

interface HomeStats {
  sleep: {
    totalNights: number;
    averageSleepHours: number;
  };
  workouts: {
    totalWorkouts: number;
    totalWorkoutMinutes: number;
  };
  nutrition: {
    totalMeals: number;
    totalCalories: number;
  };
  ranking: {
    sleepScore: number;
    workoutScore: number;
    nutritionScore: number;
    overallScore: number;
    rank: string;
  };
}

const Home: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Buscar dados da semana atual com Promise.allSettled
      const [sleepRes, workoutRes, nutritionRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/sleep/reports?period=week`, { headers }),
        axios.get(`${API_BASE_URL}/api/workouts/reports?period=week`, { headers }),
        axios.get(`${API_BASE_URL}/api/nutrition/reports?period=week`, { headers }),
      ]);

      // Extrair dados ou usar valores padrão se falhar
      const sleepData = sleepRes.status === 'fulfilled' ? sleepRes.value.data : { records: [], bestDay: null, worstDay: null, weeklyAverage: 0, dailyAverage: 0 };
      const workoutData = workoutRes.status === 'fulfilled' ? workoutRes.value.data : { totalWorkouts: 0, totalMinutes: 0, mostPracticedType: '', mostActivePeriod: '' };
      const nutritionData = nutritionRes.status === 'fulfilled' ? nutritionRes.value.data : { totalMeals: 0, totalCalories: 0, dayWithMostMeals: null, maxCalories: 0 };

      // Calcular ranking
      const sleepScore = calculateSleepScore(sleepData);
      const workoutScore = calculateWorkoutScore(workoutData);
      const nutritionScore = calculateNutritionScore(nutritionData);
      const overallScore = Math.round((sleepScore + workoutScore + nutritionScore) / 3);

      setStats({
        sleep: {
          totalNights: sleepData.records?.length || 0,
          averageSleepHours: sleepData.dailyAverage ? sleepData.dailyAverage / 60 : 0,
        },
        workouts: {
          totalWorkouts: workoutData.totalWorkouts || 0,
          totalWorkoutMinutes: workoutData.totalMinutes || 0,
        },
        nutrition: {
          totalMeals: nutritionData.totalMeals || 0,
          totalCalories: nutritionData.totalCalories || 0,
        },
        ranking: {
          sleepScore,
          workoutScore,
          nutritionScore,
          overallScore,
          rank: getRank(overallScore)
        }
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSleepScore = (sleepData: any): number => {
    if (!sleepData || sleepData.records?.length === 0) return 0;
    const avgHours = sleepData.dailyAverage ? sleepData.dailyAverage / 60 : 0;
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
    const totalMinutes = workoutData.totalMinutes || 0;
    let score = 0;
    if (totalWorkouts >= 5) score += 50;
    else if (totalWorkouts >= 3) score += 30;
    else if (totalWorkouts >= 1) score += 10;
    if (totalMinutes >= 300) score += 50;
    else if (totalMinutes >= 150) score += 30;
    else if (totalMinutes >= 60) score += 10;
    return Math.min(score, 100);
  };

  const calculateNutritionScore = (nutritionData: any): number => {
    if (!nutritionData || nutritionData.totalMeals === 0) return 0;
    const totalMeals = nutritionData.totalMeals || 0;
    let score = 0;
    if (totalMeals >= 21) score += 60;
    else if (totalMeals >= 14) score += 40;
    else if (totalMeals >= 7) score += 20;
    return Math.max(score, 0);
  };

  const getRank = (score: number): string => {
    if (score >= 90) return '🏆 Mestre';
    if (score >= 80) return '🥇 Especialista';
    if (score >= 70) return '🥈 Avançado';
    if (score >= 60) return '🥉 Intermediário';
    if (score >= 40) return '📈 Iniciante';
    return '🌱 Aprendiz';
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const menus = [
    { title: 'Sono & Repouso', description: 'Otimize sua recuperação diária', icon: 'bi-moon-stars', color: 'primary', link: '/sleep', permission: 'canAccessSleep' },
    { title: 'Treinos', description: 'Monitore sua performance física', icon: 'bi-fire', color: 'danger', link: '/workouts', permission: 'canAccessWorkouts' },
    { title: 'Nutrição', description: 'Mantenha o equilíbrio nutricional', icon: 'bi-apple', color: 'success', link: '/nutrition', permission: 'canAccessNutrition' },
    { title: 'Saúde & Dores', description: 'Previna lesões corporais', icon: 'bi-heart-pulse', color: 'warning', link: '/pains', permission: 'canAccessHealth' },
    { title: 'Metas', description: 'Acompanhe seus objetivos', icon: 'bi-trophy', color: 'info', link: '/goals', permission: 'canAccessGoals' },
  ];

  // Filtrar os menus baseado nas permissões do usuário
  const allowedMenus = menus.filter(menu => {
    const permissionKey = menu.permission as keyof typeof user;
    return user?.[permissionKey] !== false;
  });

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

      {/* Indicadores e Ranking */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="row align-items-center">
                {/* Ranking */}
                <div className="col-lg-4 mb-3 mb-lg-0">
                  <div className="text-center">
                    <h4 className="h3 mb-2">{stats?.ranking.rank || 'Carregando...'}</h4>
                    <div className="d-flex justify-content-center align-items-center mb-3">
                      <div className="progress-circle me-3" style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: `conic-gradient(#6f42c1 0% ${stats?.ranking.overallScore || 0}%, #e9ecef ${stats?.ranking.overallScore || 0}% 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{
                          width: '45px',
                          height: '45px',
                          borderRadius: '50%',
                          background: 'white'
                        }}></div>
                      </div>
                      <div>
                        <div className="h5 mb-0 text-primary">{stats?.ranking.overallScore || 0}%</div>
                        <small className="text-muted">Score Geral</small>
                      </div>
                    </div>
                    <Link to="/dashboard" className="btn btn-outline-primary btn-sm">
                      Ver Dashboard Completo
                    </Link>
                  </div>
                </div>

                {/* Indicadores */}
                <div className="col-lg-8">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <div className="card bg-primary-subtle border-0 h-100">
                        <div className="card-body text-center p-3">
                          <i className="bi bi-moon-stars text-primary fs-2 mb-2"></i>
                          <h6 className="card-title mb-1">Sono</h6>
                          <div className="h5 mb-1">{stats?.sleep.averageSleepHours?.toFixed(1) || '0.0'}h</div>
                          <small className="text-muted">{stats?.sleep.totalNights || 0} noites</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card bg-danger-subtle border-0 h-100">
                        <div className="card-body text-center p-3">
                          <i className="bi bi-fire text-danger fs-2 mb-2"></i>
                          <h6 className="card-title mb-1">Treinos</h6>
                          <div className="h5 mb-1">{stats?.workouts.totalWorkouts || 0}</div>
                          <small className="text-muted">{stats?.workouts.totalWorkoutMinutes || 0} min</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card bg-success-subtle border-0 h-100">
                        <div className="card-body text-center p-3">
                          <i className="bi bi-apple text-success fs-2 mb-2"></i>
                          <h6 className="card-title mb-1">Refeições</h6>
                          <div className="h5 mb-1">{stats?.nutrition.totalMeals || 0}</div>
                          <small className="text-muted">{stats?.nutrition.totalCalories || 0} cal</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {allowedMenus.map((menu, idx) => (
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