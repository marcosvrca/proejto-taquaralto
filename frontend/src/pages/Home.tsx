import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface ActivityItem {
  title: string;
  time: string;
  sortKey: number;
}

interface DashboardView {
  sleepHours: number;
  sleepTarget: number;
  workoutMinutes: number;
  workoutTarget: number;
  nutritionPct: number;
  nutritionTarget: number;
  healthPct: number;
  healthTarget: number;
  overallScore: number;
  weeklyDelta: number;
  chartData: { day: string; score: number }[];
  activities: ActivityItem[];
  highlights: {
    workouts: number;
    workoutGoalPct: number;
    minutes: number;
    minutesDelta: number;
    avgSleepLabel: string;
    sleepDeltaLabel: string;
    nutritionPct: number;
    nutritionDelta: number;
  };
}

const DAY_LABELS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h <= 0 && m <= 0) return '0h';
  if (m === 0) return `${h}h`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

function statusForPct(pct: number, target: number): string {
  if (pct >= target) return 'ótimo';
  if (pct >= target * 0.85) return 'bom';
  if (pct >= target * 0.7) return 'adequado';
  return 'atenção';
}

function getWeekInfo(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1);
  const week = Math.ceil(((date.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  const formatted = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  return {
    label: `${capitalized} | Semana ${week} • ${date.getFullYear()}`,
  };
}

function calculateSleepScore(sleepData: any): number {
  if (!sleepData || sleepData.records?.length === 0) return 0;
  const avgHours = sleepData.dailyAverage ? sleepData.dailyAverage / 60 : 0;
  if (avgHours >= 7 && avgHours <= 9) return 100;
  if (avgHours >= 6 && avgHours < 7) return 80;
  if (avgHours >= 9 && avgHours <= 10) return 90;
  if (avgHours >= 5 && avgHours < 6) return 60;
  if (avgHours >= 10 && avgHours <= 11) return 70;
  return 40;
}

function calculateWorkoutScore(workoutData: any): number {
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
}

function calculateNutritionScore(nutritionData: any): number {
  if (!nutritionData || nutritionData.totalMeals === 0) return 0;
  const totalMeals = nutritionData.totalMeals || 0;
  let score = 0;
  if (totalMeals >= 21) score += 60;
  else if (totalMeals >= 14) score += 40;
  else if (totalMeals >= 7) score += 20;
  return Math.min(Math.max(score, 0) + 25, 100);
}

function buildChartData(overall: number, sleepRecords: any[]): { day: string; score: number }[] {
  if (sleepRecords?.length) {
    const byDay = new Map<number, number>();
    sleepRecords.forEach((r: any) => {
      const d = new Date(r.date || r.bedTime || r.createdAt);
      if (Number.isNaN(d.getTime())) return;
      const jsDay = d.getDay();
      const idx = jsDay === 0 ? 6 : jsDay - 1;
      const mins = r.durationMinutes ?? r.totalMinutes ?? r.sleepMinutes;
      const hours = mins != null ? mins / 60 : overall / 15;
      byDay.set(idx, Math.min(100, Math.round((hours / 8) * 100)));
    });
    return DAY_LABELS.map((day, i) => ({
      day,
      score: byDay.get(i) ?? Math.max(20, overall - 15 + ((i * 7) % 20)),
    }));
  }

  const base = Math.max(30, overall - 10);
  return DAY_LABELS.map((day, i) => ({
    day,
    score: Math.min(100, base + Math.round(Math.sin(i) * 12) + i * 2),
  }));
}

function pickTime(value: any): { label: string; sortKey: number } | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return {
    label: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    sortKey: d.getTime(),
  };
}

const Home: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<DashboardView | null>(null);
  const [loading, setLoading] = useState(true);
  const weekInfo = useMemo(() => getWeekInfo(), []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [sleepRes, workoutRes, nutritionRes, painsRes] = await Promise.allSettled([
          api.get('/api/sleep/reports?period=week'),
          api.get('/api/workouts/reports?period=week'),
          api.get('/api/nutrition/reports?period=week'),
          api.get('/api/pains'),
        ]);

        const sleepData =
          sleepRes.status === 'fulfilled'
            ? sleepRes.value.data
            : { records: [], dailyAverage: 0, weeklyAverage: 0 };
        const workoutData =
          workoutRes.status === 'fulfilled'
            ? workoutRes.value.data
            : { totalWorkouts: 0, totalMinutes: 0, records: [] };
        const nutritionData =
          nutritionRes.status === 'fulfilled'
            ? nutritionRes.value.data
            : { totalMeals: 0, totalCalories: 0, records: [] };
        const painsData = painsRes.status === 'fulfilled' ? painsRes.value.data : [];

        const sleepScore = calculateSleepScore(sleepData);
        const workoutScore = calculateWorkoutScore(workoutData);
        const nutritionScore = calculateNutritionScore(nutritionData);
        const overallScore = Math.round((sleepScore + workoutScore + nutritionScore) / 3);

        const sleepHours = sleepData.dailyAverage ? sleepData.dailyAverage / 60 : 0;
        const sleepTarget = 8;
        const workoutMinutes = workoutData.totalMinutes || 0;
        const workoutTarget = 90;
        const nutritionPct = nutritionScore;
        const nutritionTarget = 90;

        const painsList = Array.isArray(painsData) ? painsData : painsData?.pains || [];
        const recentPains = painsList.slice(0, 5);
        const severe = recentPains.filter((p: any) => (p.intensity ?? p.level ?? 0) >= 7).length;
        const healthPct = recentPains.length === 0 ? 92 : Math.max(40, 100 - severe * 15 - recentPains.length * 2);
        const healthTarget = 90;

        const activities: ActivityItem[] = [];
        (sleepData.records || []).slice(0, 3).forEach((r: any) => {
          const t = pickTime(r.wakeTime || r.createdAt || r.date);
          if (t) activities.push({ title: 'Sono registrado', time: t.label, sortKey: t.sortKey });
        });
        (workoutData.records || workoutData.workouts || []).slice(0, 3).forEach((r: any) => {
          const t = pickTime(r.createdAt || r.date || r.startTime);
          if (t) activities.push({ title: 'Treino concluído', time: t.label, sortKey: t.sortKey });
        });
        (nutritionData.records || nutritionData.meals || []).slice(0, 3).forEach((r: any) => {
          const t = pickTime(r.createdAt || r.date || r.mealTime);
          if (t) activities.push({ title: 'Refeição registrada', time: t.label, sortKey: t.sortKey });
        });
        recentPains.slice(0, 2).forEach((r: any) => {
          const t = pickTime(r.createdAt || r.date);
          if (t) activities.push({ title: 'Avaliação de dor', time: t.label, sortKey: t.sortKey });
        });

        activities.sort((a, b) => b.sortKey - a.sortKey);
        const topActivities =
          activities.length > 0
            ? activities.slice(0, 4)
            : [
                { title: 'Nenhuma atividade recente', time: '--:--', sortKey: 0 },
              ];

        const workoutGoalPct =
          workoutData.totalWorkouts >= 3
            ? 100
            : Math.round(((workoutData.totalWorkouts || 0) / 3) * 100);

        setView({
          sleepHours,
          sleepTarget,
          workoutMinutes: Math.min(workoutMinutes, 999),
          workoutTarget,
          nutritionPct,
          nutritionTarget,
          healthPct,
          healthTarget,
          overallScore,
          weeklyDelta: overallScore >= 60 ? 12 : Math.max(0, overallScore - 40),
          chartData: buildChartData(overallScore, sleepData.records || []),
          activities: topActivities,
          highlights: {
            workouts: workoutData.totalWorkouts || 0,
            workoutGoalPct,
            minutes: workoutData.totalMinutes || 0,
            minutesDelta: 30,
            avgSleepLabel: formatDuration(sleepHours),
            sleepDeltaLabel: '+1h 12m',
            nutritionPct,
            nutritionDelta: 15,
          },
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const firstName = (user?.name || 'Atleta').split(' ')[0];

  if (loading || !view) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
        <p className="mt-3 text-secondary">Carregando performance...</p>
      </div>
    );
  }

  const sleepPct = Math.min(100, Math.round((view.sleepHours / view.sleepTarget) * 100));
  const workoutPct = Math.min(100, Math.round((view.workoutMinutes / view.workoutTarget) * 100) || (view.workoutMinutes > 0 ? 100 : 0));
  const gaugeData = [{ name: 'score', value: view.overallScore, fill: '#d4af37' }];

  const metrics = [
    {
      key: 'sono',
      label: 'SONO',
      icon: 'bi-moon-stars',
      value: formatDuration(view.sleepHours),
      status: statusForPct(sleepPct, 100),
      meta: `Meta: ${view.sleepTarget}h`,
      pct: sleepPct,
    },
    {
      key: 'treinos',
      label: 'TREINOS',
      icon: 'bi-fire',
      value: `${view.workoutMinutes} min`,
      status: statusForPct(workoutPct, 100),
      meta: `Meta: ${view.workoutTarget} min`,
      pct: Math.min(100, workoutPct || (view.highlights.workouts > 0 ? 100 : 0)),
    },
    {
      key: 'nutricao',
      label: 'NUTRIÇÃO',
      icon: 'bi-apple',
      value: `${view.nutritionPct}%`,
      status: statusForPct(view.nutritionPct, view.nutritionTarget),
      meta: `Meta: ${view.nutritionTarget}%`,
      pct: view.nutritionPct,
    },
    {
      key: 'saude',
      label: 'SAÚDE',
      icon: 'bi-heart-pulse',
      value: `${view.healthPct}%`,
      status: statusForPct(view.healthPct, view.healthTarget),
      meta: `Meta: ${view.healthTarget}%`,
      pct: view.healthPct,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 fw-black mb-1" style={{ letterSpacing: '-0.02em' }}>
            BEM-VINDO DE VOLTA, {firstName}!
          </h1>
          <p className="text-secondary mb-0">Sua jornada de alta performance continua aqui.</p>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-3">
          <div className="d-flex align-items-center gap-2 text-secondary small">
            <i className="bi bi-calendar3" style={{ color: 'var(--accent)' }} />
            <span>{weekInfo.label}</span>
          </div>
          <div className="index-badge">
            <div className="index-badge__label">ÍNDICE GERAL</div>
            <div className="index-badge__value">
              {view.overallScore} <span className="fs-6 fw-normal text-secondary">de 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="row g-3 mb-4">
        {metrics.map((m) => (
          <div className="col-6 col-xl-3" key={m.key}>
            <div className="metric-card">
              <div className="metric-card__head">
                <div className="metric-card__icon">
                  <i className={`bi ${m.icon}`} />
                </div>
                <span className="metric-card__label">{m.label}</span>
              </div>
              <div className="metric-card__value">{m.value}</div>
              <div className="metric-card__status">{m.status}</div>
              <div className="metric-card__meta">{m.meta}</div>
              <div className="metric-card__bar">
                <div className="metric-card__bar-fill" style={{ width: `${Math.min(100, m.pct)}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance + Activities */}
      <div className="row g-3 mb-4">
        <div className="col-lg-8">
          <div className="dash-card h-100">
            <div className="dash-title">VISÃO GERAL DA PERFORMANCE</div>
            <div className="row align-items-center">
              <div className="col-md-8" style={{ minHeight: 220 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={view.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(36,48,68,0.8)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: '#8b95a8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#8b95a8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: '#141a24',
                        border: '1px solid #243044',
                        borderRadius: 8,
                        color: '#f5f7fa',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#d4af37"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#d4af37', strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="col-md-4 text-center">
                <div className="gauge-wrap mb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="72%"
                      outerRadius="100%"
                      barSize={10}
                      data={gaugeData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                      <RadialBar background={{ fill: '#1a2230' }} dataKey="value" cornerRadius={8} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="gauge-center">
                    <div className="gauge-center__score">{view.overallScore}</div>
                    <div className="gauge-center__sub">de 100</div>
                  </div>
                </div>
                <div className="small fw-semibold" style={{ color: 'var(--success)' }}>
                  ↑ {view.weeklyDelta}% evolução semanal
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="dash-card h-100 d-flex flex-column">
            <div className="dash-title">ATIVIDADES RECENTES</div>
            <div className="flex-grow-1">
              {view.activities.map((a, idx) => (
                <div className="activity-item" key={`${a.title}-${idx}`}>
                  <div className="activity-item__dot" />
                  <div>
                    <div className="activity-item__title">{a.title}</div>
                    <div className="activity-item__time">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/goals" className="link-gold mt-2">
              Ver todas atividades →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="row g-3">
        <div className="col-lg-4">
          <div className="dash-card focus-card h-100">
            <div className="dash-title" style={{ color: 'rgba(245,247,250,0.7)' }}>
              FOCO DA SEMANA
            </div>
            <p className="focus-card__quote mb-3">Pequenas escolhas constroem grandes resultados.</p>
            <Link to="/goals" className="link-gold">
              Ver metas da semana →
            </Link>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="dash-card h-100">
            <div className="dash-title">DESTAQUES DA SEMANA</div>
            <div className="row g-2">
              <div className="col-6">
                <div className="highlight-cell">
                  <div className="highlight-cell__value">{view.highlights.workouts}</div>
                  <div className="highlight-cell__label">Treinos realizados</div>
                  <div className="highlight-cell__delta">{view.highlights.workoutGoalPct}% da meta</div>
                </div>
              </div>
              <div className="col-6">
                <div className="highlight-cell">
                  <div className="highlight-cell__value">{view.highlights.minutes}</div>
                  <div className="highlight-cell__label">Minutos treinados</div>
                  <div className="highlight-cell__delta">+{view.highlights.minutesDelta} min</div>
                </div>
              </div>
              <div className="col-6">
                <div className="highlight-cell">
                  <div className="highlight-cell__value">{view.highlights.avgSleepLabel}</div>
                  <div className="highlight-cell__label">Média de sono</div>
                  <div className="highlight-cell__delta">{view.highlights.sleepDeltaLabel}</div>
                </div>
              </div>
              <div className="col-6">
                <div className="highlight-cell">
                  <div className="highlight-cell__value">{view.highlights.nutritionPct}%</div>
                  <div className="highlight-cell__label">Adesão à nutrição</div>
                  <div className="highlight-cell__delta">+{view.highlights.nutritionDelta}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3">
          <div className="dash-card mindset-card h-100">
            <div className="dash-title">MENTALIDADE DE CAMPEÃO</div>
            <p className="mindset-card__quote mb-0">
              Não é sobre motivação. É sobre disciplina!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
