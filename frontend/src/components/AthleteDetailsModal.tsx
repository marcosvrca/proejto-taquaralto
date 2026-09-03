import React, { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import api from '../services/api';

const CHART_COLORS = ['#0d6efd', '#dc3545', '#198754', '#fd7e14', '#6f42c1', '#20c997', '#ffc107'];

const intensityLabel: Record<string, string> = {
  leve: 'Leve',
  moderado: 'Moderado',
  intenso: 'Intenso',
  pesado: 'Pesado',
  exaustivo: 'Exaustivo',
  outros: 'Outros',
  Baixa: 'Baixa',
  Média: 'Média',
  Alta: 'Alta',
};

const mealTypeLabel: Record<string, string> = {
  cafe_manha: 'Café da manhã',
  almoco: 'Almoço',
  lanche_tarde: 'Lanche',
  jantar: 'Jantar',
  outro_horario: 'Outro',
};

function scoreColor(score: number): string {
  if (score >= 80) return '#198754';
  if (score >= 60) return '#0d6efd';
  if (score >= 40) return '#fd7e14';
  return '#dc3545';
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('pt-BR');
}

interface AthleteDetailsModalProps {
  details: any;
  onClose: () => void;
  onRefresh?: () => void;
}

const AthleteDetailsModal: React.FC<AthleteDetailsModalProps> = ({ details, onClose, onRefresh }) => {
  const [tab, setTab] = useState<'overview' | 'sleep' | 'workouts' | 'nutrition' | 'health' | 'goals' | 'notes'>('overview');
  const [noteType, setNoteType] = useState<'treino' | 'jogo' | null>(null);
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [opponent, setOpponent] = useState('');
  const [rating, setRating] = useState<number | ''>('');
  const [observation, setObservation] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteMessage, setNoteMessage] = useState('');
  const [notes, setNotes] = useState<any[]>(details.notes?.items || []);

  useEffect(() => {
    setNotes(details.notes?.items || []);
  }, [details.notes?.items]);

  const resetNoteForm = () => {
    setNoteType(null);
    setNoteDate(new Date().toISOString().split('T')[0]);
    setOpponent('');
    setRating('');
    setObservation('');
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteType) return;
    const ratingValue = Number(rating);
    if (Number.isNaN(ratingValue) || ratingValue < 0 || ratingValue > 10) {
      setNoteMessage('Informe uma nota entre 0 e 10.');
      return;
    }
    setSavingNote(true);
    setNoteMessage('');
    try {
      const res = await api.post(`/api/admin/users/${details.user.id}/notes`, {
        type: noteType,
        date: noteDate,
        opponent: noteType === 'jogo' ? opponent : undefined,
        rating: ratingValue,
        observation,
      });
      setNotes((prev) => [res.data.note, ...prev]);
      setNoteMessage('Nota salva com sucesso.');
      resetNoteForm();
      onRefresh?.();
    } catch (error: any) {
      setNoteMessage(error.response?.data?.message || 'Erro ao salvar nota');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('Remover esta nota?')) return;
    try {
      await api.delete(`/api/admin/users/${details.user.id}/notes/${noteId}`);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      onRefresh?.();
    } catch (error: any) {
      setNoteMessage(error.response?.data?.message || 'Erro ao remover nota');
    }
  };

  const radarData = useMemo(
    () => [
      { area: 'Sono', score: details.scores?.sleep || 0 },
      { area: 'Treinos', score: details.scores?.workouts || 0 },
      { area: 'Nutrição', score: details.scores?.nutrition || 0 },
      { area: 'Saúde', score: details.scores?.health || 0 },
    ],
    [details]
  );

  const typeChart = useMemo(
    () =>
      (details.workouts?.byType || []).map((t: any) => ({
        name: String(t.type).replace(/_/g, ' '),
        minutos: t.minutes,
        treinos: t.count,
      })),
    [details]
  );

  const intensityChart = useMemo(
    () =>
      (details.workouts?.byIntensity || []).map((i: any) => ({
        name: intensityLabel[i.intensity] || i.intensity,
        value: i.count,
      })),
    [details]
  );

  const mealTypeChart = useMemo(
    () =>
      (details.nutrition?.byMealType || []).map((m: any) => ({
        name: mealTypeLabel[m.mealType] || m.mealType,
        value: m.count,
        calories: m.calories,
      })),
    [details]
  );

  const habitsChart = useMemo(() => {
    const h = details.nutrition?.habits || {};
    return [
      { name: 'Água', value: h.water || 0 },
      { name: 'Suco natural', value: h.naturalJuice || 0 },
      { name: 'Refrigerante', value: h.soda || 0 },
      { name: 'Álcool', value: h.alcohol || 0 },
      { name: 'Suco industrial', value: h.industrialJuice || 0 },
    ].filter((x) => x.value > 0);
  }, [details]);

  const periodLabel =
    details.period === 'month' ? 'este mês' : details.period === 'year' ? 'este ano' : 'esta semana';

  return (
    <>
      <div className="modal-backdrop fade show d-block" onClick={onClose} />
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable athlete-details-dialog">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header border-0 pb-0">
              <div>
                <p className="text-uppercase small text-primary fw-bold mb-1">Desenvolvimento do atleta</p>
                <h5 className="modal-title fw-bold mb-0">{details.user?.name || 'Atleta'}</h5>
                <small className="text-muted">
                  {details.user?.email} · período: {periodLabel} · desde {formatDate(details.user?.createdAt)}
                </small>
              </div>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Fechar" />
            </div>

            <div className="modal-body pt-3">
              {/* Score strip */}
              <div className="row g-3 mb-4">
                <div className="col-6 col-md-2">
                  <div className="athlete-score-card text-center p-3 rounded-3 h-100" style={{ borderTop: `3px solid ${scoreColor(details.scores?.overall || 0)}` }}>
                    <div className="small text-muted">Geral</div>
                    <div className="fs-3 fw-bold" style={{ color: scoreColor(details.scores?.overall || 0) }}>
                      {details.scores?.overall ?? 0}
                    </div>
                    <div className="small">{details.scores?.rank}</div>
                  </div>
                </div>
                {[
                  { key: 'sleep', label: 'Sono', color: '#0d6efd' },
                  { key: 'workouts', label: 'Treinos', color: '#dc3545' },
                  { key: 'nutrition', label: 'Nutrição', color: '#198754' },
                  { key: 'health', label: 'Saúde', color: '#fd7e14' },
                ].map((s) => (
                  <div className="col-6 col-md-2" key={s.key}>
                    <div className="athlete-score-card text-center p-3 rounded-3 h-100" style={{ borderTop: `3px solid ${s.color}` }}>
                      <div className="small text-muted">{s.label}</div>
                      <div className="fs-3 fw-bold" style={{ color: s.color }}>
                        {details.scores?.[s.key] ?? 0}
                      </div>
                      <div className="small text-muted">/100</div>
                    </div>
                  </div>
                ))}
                <div className="col-12 col-md-2">
                  <div className="athlete-score-card p-3 rounded-3 h-100 d-flex flex-column justify-content-center">
                    <div className="small text-muted mb-1">Metas</div>
                    <div className="fw-bold">{details.goals?.summary?.completionRate ?? 0}% concluídas</div>
                    <div className="small text-muted">
                      {details.goals?.summary?.completed ?? 0}/{details.goals?.summary?.total ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <ul className="nav nav-pills gap-1 mb-4 flex-wrap">
                {[
                  { id: 'overview', label: 'Visão geral' },
                  { id: 'notes', label: 'Notas' },
                  { id: 'sleep', label: 'Sono' },
                  { id: 'workouts', label: 'Treinos' },
                  { id: 'nutrition', label: 'Nutrição' },
                  { id: 'health', label: 'Saúde' },
                  { id: 'goals', label: 'Metas' },
                ].map((t) => (
                  <li className="nav-item" key={t.id}>
                    <button
                      type="button"
                      className={`nav-link ${tab === t.id ? 'active' : ''}`}
                      onClick={() => setTab(t.id as any)}
                    >
                      {t.label}
                    </button>
                  </li>
                ))}
              </ul>

              {tab === 'overview' && (
                <div className="row g-4">
                  <div className="col-lg-5">
                    <h6 className="fw-bold mb-3">Perfil de desempenho</h6>
                    <div style={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer>
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="area" />
                          <PolarRadiusAxis domain={[0, 100]} />
                          <Radar dataKey="score" stroke="#0d6efd" fill="#0d6efd" fillOpacity={0.35} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="col-lg-7">
                    <h6 className="fw-bold mb-3">Evolução no período</h6>
                    <div style={{ width: '100%', height: 280 }}>
                      {(details.evolution || []).length === 0 ? (
                        <div className="text-muted small p-4">Sem dados suficientes para evolução semanal.</div>
                      ) : (
                        <ResponsiveContainer>
                          <LineChart data={details.evolution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                            <XAxis dataKey="label" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="overallScore" name="Score geral" stroke="#0d6efd" strokeWidth={2} />
                            <Line type="monotone" dataKey="sleepHours" name="Sono (h)" stroke="#6f42c1" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                  <div className="col-12">
                    <h6 className="fw-bold mb-3">Insights para o técnico</h6>
                    <div className="row g-2">
                      {(details.insights || []).map((insight: string, idx: number) => (
                        <div className="col-md-6" key={idx}>
                          <div className="p-3 rounded-3 bg-light border-start border-4 border-primary h-100">
                            <small>{insight}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'sleep' && (
                <div className="row g-4">
                  <div className="col-md-3">
                    <Stat label="Média diária" value={`${details.sleep?.summary?.averageHours ?? 0}h`} />
                  </div>
                  <div className="col-md-3">
                    <Stat label="Noites registradas" value={details.sleep?.summary?.totalNights ?? 0} />
                  </div>
                  <div className="col-md-3">
                    <Stat label="Na faixa ideal (7–9h)" value={`${details.sleep?.summary?.idealRangePct ?? 0}%`} />
                  </div>
                  <div className="col-md-3">
                    <Stat label="Consistência de registro" value={`${details.sleep?.summary?.consistencyPct ?? 0}%`} />
                  </div>
                  <div className="col-md-6">
                    <Stat
                      label="Melhor noite"
                      value={
                        details.sleep?.summary?.bestNight
                          ? `${formatDate(details.sleep.summary.bestNight.date)} · ${details.sleep.summary.bestNight.hours}h`
                          : '—'
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <Stat
                      label="Pior noite"
                      value={
                        details.sleep?.summary?.worstNight
                          ? `${formatDate(details.sleep.summary.worstNight.date)} · ${details.sleep.summary.worstNight.hours}h`
                          : '—'
                      }
                    />
                  </div>
                  <div className="col-12">
                    <h6 className="fw-bold mb-3">Horas de sono por dia</h6>
                    <div style={{ width: '100%', height: 260 }}>
                      {(details.sleep?.timeline || []).length === 0 ? (
                        <Empty />
                      ) : (
                        <ResponsiveContainer>
                          <BarChart data={details.sleep.timeline}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="hours" name="Horas" fill="#0d6efd" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                  <div className="col-12">
                    <HistoryTable
                      headers={['Data', 'Dormiu', 'Acordou', 'Duração']}
                      rows={(details.sleep?.records || []).map((r: any) => [
                        formatDate(r.date),
                        r.bedTime || '—',
                        r.wakeTime || '—',
                        `${r.durationMinutes || 0} min`,
                      ])}
                    />
                  </div>
                </div>
              )}

              {tab === 'workouts' && (
                <div className="row g-4">
                  <div className="col-md-3">
                    <Stat label="Treinos" value={details.workouts?.summary?.total ?? 0} />
                  </div>
                  <div className="col-md-3">
                    <Stat label="Minutos totais" value={details.workouts?.summary?.totalMinutes ?? 0} />
                  </div>
                  <div className="col-md-3">
                    <Stat label="Duração média" value={`${details.workouts?.summary?.avgDuration ?? 0} min`} />
                  </div>
                  <div className="col-md-3">
                    <Stat label="Frequência" value={`${details.workouts?.summary?.sessionsPerWeek ?? 0}/sem`} />
                  </div>
                  <div className="col-lg-7">
                    <h6 className="fw-bold mb-3">Volume por tipo</h6>
                    <div style={{ width: '100%', height: 260 }}>
                      {typeChart.length === 0 ? (
                        <Empty />
                      ) : (
                        <ResponsiveContainer>
                          <BarChart data={typeChart}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="minutos" fill="#dc3545" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                  <div className="col-lg-5">
                    <h6 className="fw-bold mb-3">Intensidade</h6>
                    <div style={{ width: '100%', height: 260 }}>
                      {intensityChart.length === 0 ? (
                        <Empty />
                      ) : (
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie data={intensityChart} dataKey="value" nameKey="name" outerRadius={90} label>
                              {intensityChart.map((_: any, i: number) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                  <div className="col-12">
                    <h6 className="fw-bold mb-3">Linha do tempo de treinos</h6>
                    <div style={{ width: '100%', height: 220 }}>
                      {(details.workouts?.timeline || []).length === 0 ? (
                        <Empty />
                      ) : (
                        <ResponsiveContainer>
                          <LineChart data={details.workouts.timeline}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="minutes" name="Minutos" stroke="#dc3545" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                  <div className="col-12">
                    <HistoryTable
                      headers={['Data', 'Tipo', 'Intensidade', 'Duração', 'Obs.']}
                      rows={(details.workouts?.records || []).map((w: any) => [
                        formatDate(w.date),
                        String(w.type || '').replace(/_/g, ' '),
                        intensityLabel[w.intensity] || w.intensity || '—',
                        `${w.durationMinutes || 0} min`,
                        w.notes || '—',
                      ])}
                    />
                  </div>
                </div>
              )}

              {tab === 'nutrition' && (
                <div className="row g-4">
                  <div className="col-md-3">
                    <Stat label="Refeições" value={details.nutrition?.summary?.totalMeals ?? 0} />
                  </div>
                  <div className="col-md-3">
                    <Stat label="Refeições limpas" value={`${details.nutrition?.summary?.cleanMealPercentage ?? 0}%`} />
                  </div>
                  <div className="col-md-3">
                    <Stat label="Calorias totais" value={details.nutrition?.summary?.totalCalories ?? 0} />
                  </div>
                  <div className="col-md-3">
                    <Stat label="Média kcal/dia" value={details.nutrition?.summary?.avgCaloriesPerDay ?? 0} />
                  </div>
                  <div className="col-lg-7">
                    <h6 className="fw-bold mb-3">Calorias por dia</h6>
                    <div style={{ width: '100%', height: 260 }}>
                      {(details.nutrition?.timeline || []).length === 0 ? (
                        <Empty />
                      ) : (
                        <ResponsiveContainer>
                          <BarChart data={details.nutrition.timeline}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="calories" name="kcal" fill="#198754" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                  <div className="col-lg-5">
                    <h6 className="fw-bold mb-3">Hábitos de bebida</h6>
                    <div style={{ width: '100%', height: 260 }}>
                      {habitsChart.length === 0 ? (
                        <Empty />
                      ) : (
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie data={habitsChart} dataKey="value" nameKey="name" outerRadius={90} label>
                              {habitsChart.map((_: any, i: number) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                  <div className="col-12">
                    <h6 className="fw-bold mb-3">Distribuição por tipo de refeição</h6>
                    <div style={{ width: '100%', height: 220 }}>
                      {mealTypeChart.length === 0 ? (
                        <Empty />
                      ) : (
                        <ResponsiveContainer>
                          <BarChart data={mealTypeChart}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" name="Refeições" fill="#20c997" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                  <div className="col-12">
                    <HistoryTable
                      headers={['Data', 'Tipo', 'kcal', 'Hábitos']}
                      rows={(details.nutrition?.records || []).map((n: any) => [
                        formatDate(n.date),
                        mealTypeLabel[n.mealType] || n.mealType,
                        n.calories,
                        [
                          n.consumedWater && 'Água',
                          n.consumedNaturalJuice && 'Suco natural',
                          n.consumedSoda && 'Refri',
                          n.consumedAlcohol && 'Álcool',
                          n.consumedIndustrialJuice && 'Suco ind.',
                        ]
                          .filter(Boolean)
                          .join(', ') || '—',
                      ])}
                    />
                  </div>
                </div>
              )}

              {tab === 'health' && (
                <div className="row g-4">
                  <div className="col-md-4">
                    <Stat label="Registros de dor" value={details.health?.summary?.totalRecords ?? 0} />
                  </div>
                  <div className="col-md-4">
                    <Stat label="Intensidade média" value={`${details.health?.summary?.avgIntensity ?? 0}/10`} />
                  </div>
                  <div className="col-md-4">
                    <Stat label="Região mais afetada" value={details.health?.summary?.mostAffectedArea || '—'} />
                  </div>
                  <div className="col-lg-6">
                    <h6 className="fw-bold mb-3">Intensidade ao longo do tempo</h6>
                    <div style={{ width: '100%', height: 260 }}>
                      {(details.health?.timeline || []).length === 0 ? (
                        <Empty />
                      ) : (
                        <ResponsiveContainer>
                          <LineChart data={details.health.timeline}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis domain={[0, 10]} />
                            <Tooltip />
                            <Line type="monotone" dataKey="intensity" name="Intensidade" stroke="#fd7e14" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <h6 className="fw-bold mb-3">Por região do corpo</h6>
                    <div style={{ width: '100%', height: 260 }}>
                      {(details.health?.byLocation || []).length === 0 ? (
                        <Empty />
                      ) : (
                        <ResponsiveContainer>
                          <BarChart data={details.health.byLocation}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="location" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" name="Ocorrências" fill="#fd7e14" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                  <div className="col-12">
                    <HistoryTable
                      headers={['Data', 'Local', 'Intensidade', 'Descrição']}
                      rows={(details.health?.records || []).map((p: any) => [
                        formatDate(p.date),
                        p.location,
                        `${p.intensity}/10`,
                        p.description || '—',
                      ])}
                    />
                  </div>
                </div>
              )}

              {tab === 'notes' && (
                <div className="row g-4">
                  <div className="col-12">
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <button
                        type="button"
                        className={`btn ${noteType === 'treino' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setNoteType(noteType === 'treino' ? null : 'treino')}
                      >
                        Nota no treino
                      </button>
                      <button
                        type="button"
                        className={`btn ${noteType === 'jogo' ? 'btn-danger' : 'btn-outline-danger'}`}
                        onClick={() => setNoteType(noteType === 'jogo' ? null : 'jogo')}
                      >
                        Nota no jogo
                      </button>
                    </div>

                    {noteType && (
                      <form onSubmit={handleCreateNote} className="p-3 rounded-3 bg-light border mb-4">
                        <h6 className="fw-bold mb-3">
                          {noteType === 'treino' ? 'Nova nota de treino' : 'Nova nota de jogo'}
                        </h6>
                        <div className="row g-3">
                          <div className="col-md-4">
                            <label className="form-label small fw-bold">Data</label>
                            <input
                              type="date"
                              className="form-control"
                              value={noteDate}
                              onChange={(e) => setNoteDate(e.target.value)}
                              required
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small fw-bold">Nota (0 a 10)</label>
                            <input
                              type="number"
                              className="form-control"
                              min={0}
                              max={10}
                              step={0.5}
                              placeholder="Ex: 8"
                              value={rating}
                              onChange={(e) => setRating(e.target.value === '' ? '' : Number(e.target.value))}
                              required
                            />
                          </div>
                          {noteType === 'jogo' && (
                            <div className="col-md-4">
                              <label className="form-label small fw-bold">Adversário</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Ex: Time Rival"
                                value={opponent}
                                onChange={(e) => setOpponent(e.target.value)}
                                required
                              />
                            </div>
                          )}
                          <div className="col-12">
                            <label className="form-label small fw-bold">Observações</label>
                            <textarea
                              className="form-control"
                              rows={4}
                              placeholder={
                                noteType === 'treino'
                                  ? 'Desempenho no treino, postura, intensidade, pontos de atenção...'
                                  : 'Desempenho no jogo, participação, decisões, avaliação geral...'
                              }
                              value={observation}
                              onChange={(e) => setObservation(e.target.value)}
                              required
                            />
                          </div>
                          <div className="col-12 d-flex gap-2">
                            <button type="submit" className="btn btn-primary" disabled={savingNote}>
                              {savingNote ? 'Salvando...' : 'Salvar nota'}
                            </button>
                            <button type="button" className="btn btn-outline-secondary" onClick={resetNoteForm}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    {noteMessage && (
                      <div className="alert alert-info py-2">{noteMessage}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <h6 className="fw-bold mb-3">
                      Notas de treino ({notes.filter((n) => n.type === 'treino').length})
                    </h6>
                    {notes.filter((n) => n.type === 'treino').length === 0 ? (
                      <Empty />
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {notes
                          .filter((n) => n.type === 'treino')
                          .map((n) => (
                            <div key={n.id} className="p-3 rounded-3 bg-light border">
                              <div className="d-flex justify-content-between align-items-start gap-2">
                                <div>
                                  <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <div className="fw-bold">Treino · {formatDate(n.date)}</div>
                                    <span className="badge bg-primary">Nota {Number(n.rating)}</span>
                                  </div>
                                  <div className="mt-2" style={{ whiteSpace: 'pre-wrap' }}>{n.observation}</div>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteNote(n.id)}
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <h6 className="fw-bold mb-3">
                      Notas de jogo ({notes.filter((n) => n.type === 'jogo').length})
                    </h6>
                    {notes.filter((n) => n.type === 'jogo').length === 0 ? (
                      <Empty />
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {notes
                          .filter((n) => n.type === 'jogo')
                          .map((n) => (
                            <div key={n.id} className="p-3 rounded-3 bg-light border">
                              <div className="d-flex justify-content-between align-items-start gap-2">
                                <div>
                                  <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <div className="fw-bold">Jogo · {formatDate(n.date)}</div>
                                    <span className="badge bg-danger">Nota {Number(n.rating)}</span>
                                  </div>
                                  <div className="small text-muted mb-2">Adversário: {n.opponent || '—'}</div>
                                  <div style={{ whiteSpace: 'pre-wrap' }}>{n.observation}</div>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteNote(n.id)}
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === 'goals' && (
                <div className="row g-4">
                  <div className="col-md-4">
                    <Stat label="Total de metas" value={details.goals?.summary?.total ?? 0} />
                  </div>
                  <div className="col-md-4">
                    <Stat label="Concluídas" value={details.goals?.summary?.completed ?? 0} />
                  </div>
                  <div className="col-md-4">
                    <Stat label="Taxa de conclusão" value={`${details.goals?.summary?.completionRate ?? 0}%`} />
                  </div>
                  <div className="col-12">
                    {(details.goals?.items || []).length === 0 ? (
                      <Empty />
                    ) : (
                      <div className="list-group">
                        {details.goals.items.map((g: any) => (
                          <div key={g.id} className="list-group-item d-flex justify-content-between align-items-start">
                            <div>
                              <div className="fw-bold">{g.title}</div>
                              <small className="text-muted d-block">{g.description || 'Sem descrição'}</small>
                              <small className="text-muted">Prazo: {formatDate(g.targetDate)}</small>
                            </div>
                            <span className={`badge ${g.isCompleted ? 'bg-success' : 'bg-secondary'}`}>
                              {g.isCompleted ? 'Concluída' : 'Em andamento'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer border-0">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-3 rounded-3 bg-light h-100">
      <div className="small text-muted mb-1">{label}</div>
      <div className="fw-bold">{value}</div>
    </div>
  );
}

function Empty() {
  return <div className="text-muted small p-4 border rounded-3">Sem registros neste período.</div>;
}

function HistoryTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  if (!rows.length) return <Empty />;
  return (
    <div className="table-responsive rounded-3 border">
      <table className="table table-sm mb-0 align-middle">
        <thead className="table-light">
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AthleteDetailsModal;
