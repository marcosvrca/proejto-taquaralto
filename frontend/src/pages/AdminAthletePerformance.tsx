import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from 'recharts';
import api from '../services/api';

type Tab = 'games' | 'trainings' | 'compare';

interface AthleteRow {
  id: number;
  name: string;
  email: string;
  games: {
    matchesPlayed: number;
    starters: number;
    avgRating: number | null;
    goals: number;
    ownGoals: number;
    ratedMatches: number;
  };
  trainings: {
    sessions: number;
    totalMinutes: number;
    notesCount: number;
    avgNoteRating: number | null;
  };
  gameNotes: {
    count: number;
    avgRating: number | null;
  };
  compare: {
    avgMatchRating: number | null;
    avgTrainingRating: number | null;
    delta: number | null;
    label: string;
  };
}

const PAGE_SIZE = 8;

const compareLabel: Record<string, string> = {
  jogo_acima: 'Melhor em jogo',
  treino_acima: 'Melhor em treino',
  equilibrado: 'Equilibrado',
  sem_dados: 'Sem dados',
};

const compareBadge: Record<string, string> = {
  jogo_acima: 'success',
  treino_acima: 'warning',
  equilibrado: 'primary',
  sem_dados: 'secondary',
};

const AVATAR_COLORS = ['#d4af37', '#2ecc71', '#5dade2', '#e67e22', '#9b59b6', '#1abc9c', '#e74c3c', '#f0d878'];

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('pt-BR');
}

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

function sparkPoints(seed: number, empty = false) {
  if (empty) return '0,28 20,28 40,28 60,28 80,28 100,28';
  const base = 8 + (seed % 12);
  const vals = [base + 4, base + 10, base + 2, base + 14, base + 6, base + 16, base + 8];
  return vals.map((v, i) => `${(i / (vals.length - 1)) * 100},${32 - Math.min(v, 28)}`).join(' ');
}

const Sparkline: React.FC<{ seed: number; color: string; empty?: boolean }> = ({ seed, color, empty }) => (
  <svg className="page-sparkline" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden>
    <polyline
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={empty ? '4 4' : undefined}
      points={sparkPoints(seed, empty)}
      opacity={empty ? 0.45 : 0.9}
    />
  </svg>
);

const emptyNoteForm = {
  type: 'treino' as 'treino' | 'jogo',
  date: new Date().toISOString().split('T')[0],
  opponent: '',
  rating: '7',
  observation: '',
};

const AdminAthletePerformance: React.FC = () => {
  const [tab, setTab] = useState<Tab>('games');
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [athletes, setAthletes] = useState<AthleteRow[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [noteForm, setNoteForm] = useState({ ...emptyNoteForm });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [onlyRated, setOnlyRated] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const loadOverview = async () => {
    try {
      setLoading(true);
      setMessage('');
      const res = await api.get(`/api/admin/athlete-performance?period=${period}`);
      setAthletes(res.data.athletes || []);
      setSummary(res.data.summary || null);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (userId: number) => {
    try {
      setDetailLoading(true);
      const res = await api.get(`/api/admin/athlete-performance/${userId}?period=${period}`);
      setDetail(res.data);
      setSelectedId(userId);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Erro ao carregar atleta');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  useEffect(() => {
    setPage(1);
  }, [tab, search, onlyRated, period]);

  const sortedAthletes = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...athletes].filter((a) => {
      if (q) {
        const hay = `${a.name || ''} ${a.email || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (onlyRated) {
        if (tab === 'games' && a.games.avgRating == null) return false;
        if (tab === 'trainings' && a.trainings.avgNoteRating == null) return false;
        if (tab === 'compare' && (a.compare.avgMatchRating == null || a.compare.avgTrainingRating == null)) {
          return false;
        }
      }
      return true;
    });

    if (tab === 'games') {
      list.sort((a, b) => (b.games.avgRating ?? -1) - (a.games.avgRating ?? -1));
    } else if (tab === 'trainings') {
      list.sort((a, b) => (b.trainings.avgNoteRating ?? -1) - (a.trainings.avgNoteRating ?? -1));
    } else {
      list.sort((a, b) => Math.abs(b.compare.delta ?? 0) - Math.abs(a.compare.delta ?? 0));
    }
    return list;
  }, [athletes, tab, search, onlyRated]);

  const totalPages = Math.max(1, Math.ceil(sortedAthletes.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageSlice = sortedAthletes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const fromIdx = sortedAthletes.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const toIdx = Math.min(currentPage * PAGE_SIZE, sortedAthletes.length);

  const compareChartData = useMemo(
    () =>
      athletes
        .filter((a) => a.compare.avgMatchRating != null && a.compare.avgTrainingRating != null)
        .map((a) => ({
          name: a.name?.split(' ')[0] || a.email,
          jogo: a.compare.avgMatchRating,
          treino: a.compare.avgTrainingRating,
          delta: a.compare.delta,
        })),
    [athletes]
  );

  const scatterData = useMemo(
    () =>
      athletes
        .filter((a) => a.compare.avgMatchRating != null && a.compare.avgTrainingRating != null)
        .map((a) => ({
          name: a.name,
          x: a.compare.avgTrainingRating,
          y: a.compare.avgMatchRating,
          z: a.games.matchesPlayed + a.trainings.notesCount,
        })),
    [athletes]
  );

  const handleUpdateMatchRating = async (matchId: number, playerId: number, rating: string) => {
    try {
      await api.put(`/api/admin/matches/${matchId}/players/${playerId}`, {
        rating: rating === '' ? null : Number(rating),
      });
      setMessage('Nota da partida atualizada');
      if (selectedId) await loadDetail(selectedId);
      await loadOverview();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Erro ao salvar nota da partida');
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    try {
      await api.post(`/api/admin/users/${selectedId}/notes`, {
        type: noteForm.type,
        date: noteForm.date,
        opponent: noteForm.opponent,
        rating: Number(noteForm.rating),
        observation: noteForm.observation,
      });
      setNoteForm({ ...emptyNoteForm, type: tab === 'games' ? 'jogo' : 'treino' });
      setMessage('Nota registrada');
      await loadDetail(selectedId);
      await loadOverview();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Erro ao registrar nota');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!selectedId || !confirm('Remover esta nota?')) return;
    try {
      await api.delete(`/api/admin/users/${selectedId}/notes/${noteId}`);
      await loadDetail(selectedId);
      await loadOverview();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Erro ao remover nota');
    }
  };

  const openAthlete = (id: number) => {
    setNoteForm({
      ...emptyNoteForm,
      type: tab === 'games' ? 'jogo' : 'treino',
    });
    loadDetail(id);
  };

  const rankMedal = (rank: number) => {
    if (rank === 1) return <i className="bi bi-award-fill page-medal page-medal--gold" title="1º" />;
    if (rank === 2) return <i className="bi bi-award-fill page-medal page-medal--silver" title="2º" />;
    if (rank === 3) return <i className="bi bi-award-fill page-medal page-medal--bronze" title="3º" />;
    return null;
  };

  return (
    <div className="w-100 page-shell">
      <header className="page-header">
        <div className="page-header__copy">
          <p className="page-eyebrow">Performance</p>
          <h1 className="page-title">Métricas de jogos — Atleta</h1>
          <p className="page-subtitle">
            Acompanhe notas de partida, treinos e o cruzamento entre desempenho em jogo e em treino.
          </p>
        </div>
        <div className="page-period" role="group" aria-label="Período">
          {[
            { id: 'week', label: 'Semana' },
            { id: 'month', label: 'Mês' },
            { id: 'year', label: 'Ano' },
            { id: 'all', label: 'Tudo' },
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

      <div className="page-tabs" role="tablist">
        {(
          [
            { id: 'games' as Tab, label: 'Jogos', icon: 'bi-calendar-event' },
            { id: 'trainings' as Tab, label: 'Treinos', icon: 'bi-activity' },
            { id: 'compare' as Tab, label: 'Jogo × Treino', icon: 'bi-arrow-left-right' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`page-tab ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <i className={`bi ${t.icon}`} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {message && (
        <div className="alert alert-info py-2" role="alert">
          {message}
        </div>
      )}

      {summary && (
        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-xl-3">
            <div className="page-stat">
              <div className="page-stat__icon" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--accent)' }}>
                <i className="bi bi-people-fill" />
              </div>
              <div className="page-stat__body">
                <div className="page-stat__label">Atletas</div>
                <div className="page-stat__value">{summary.totalAthletes}</div>
                <div className="page-stat__meta">cadastrados</div>
              </div>
              <Sparkline seed={summary.totalAthletes || 3} color="var(--accent)" />
            </div>
          </div>
          <div className="col-sm-6 col-xl-3">
            <div className="page-stat">
              <div className="page-stat__icon" style={{ background: 'rgba(46,204,113,0.15)', color: 'var(--success)' }}>
                <i className="bi bi-trophy-fill" />
              </div>
              <div className="page-stat__body">
                <div className="page-stat__label">Com partidas</div>
                <div className="page-stat__value">{summary.athletesWithMatches}</div>
                <div className="page-stat__meta">participaram</div>
              </div>
              <Sparkline seed={(summary.athletesWithMatches || 2) + 5} color="var(--success)" />
            </div>
          </div>
          <div className="col-sm-6 col-xl-3">
            <div className="page-stat">
              <div className="page-stat__icon" style={{ background: 'rgba(240,216,120,0.15)', color: '#f0d878' }}>
                <i className="bi bi-star-fill" />
              </div>
              <div className="page-stat__body">
                <div className="page-stat__label">Média nota jogo</div>
                <div className="page-stat__value">{summary.avgMatchRating ?? '—'}</div>
                <div className="page-stat__meta">
                  {summary.avgMatchRating != null ? 'de 10.0' : 'sem dados'}
                </div>
              </div>
              <Sparkline
                seed={Math.round((summary.avgMatchRating || 0) * 10)}
                color="#f0d878"
                empty={summary.avgMatchRating == null}
              />
            </div>
          </div>
          <div className="col-sm-6 col-xl-3">
            <div className="page-stat">
              <div className="page-stat__icon" style={{ background: 'rgba(155,89,182,0.15)', color: '#c39bd3' }}>
                <i className="bi bi-lightning-charge-fill" />
              </div>
              <div className="page-stat__body">
                <div className="page-stat__label">Média nota treino</div>
                <div className="page-stat__value">{summary.avgTrainingRating ?? '—'}</div>
                <div className="page-stat__meta">
                  {summary.avgTrainingRating != null ? 'de 10.0' : 'sem dados'}
                </div>
              </div>
              <Sparkline
                seed={Math.round((summary.avgTrainingRating || 0) * 10) + 3}
                color="#c39bd3"
                empty={summary.avgTrainingRating == null}
              />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
        </div>
      ) : (
        <div className="row g-4">
          <div className={selectedId ? 'col-lg-7' : 'col-12'}>
            {tab === 'compare' && compareChartData.length > 0 && (
              <div className="dash-card mb-4">
                <h6 className="fw-bold mb-3">Comparativo nota jogo × treino</h6>
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart data={compareChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" stroke="var(--text-muted)" />
                      <YAxis domain={[0, 10]} stroke="var(--text-muted)" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="jogo" name="Jogo" fill="#d4af37" />
                      <Bar dataKey="treino" name="Treino" fill="#2ecc71" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {scatterData.length > 0 && (
                  <div style={{ width: '100%', height: 260 }} className="mt-3">
                    <ResponsiveContainer>
                      <ScatterChart>
                        <CartesianGrid stroke="var(--border)" />
                        <XAxis
                          type="number"
                          dataKey="x"
                          name="Treino"
                          domain={[0, 10]}
                          stroke="var(--text-muted)"
                          label={{ value: 'Treino', position: 'insideBottom', offset: -2 }}
                        />
                        <YAxis
                          type="number"
                          dataKey="y"
                          name="Jogo"
                          domain={[0, 10]}
                          stroke="var(--text-muted)"
                          label={{ value: 'Jogo', angle: -90, position: 'insideLeft' }}
                        />
                        <ZAxis type="number" dataKey="z" range={[60, 200]} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Atletas" data={scatterData} fill="#d4af37">
                          {scatterData.map((_, i) => (
                            <Cell
                              key={i}
                              fill={scatterData[i].y! >= scatterData[i].x! ? '#2ecc71' : '#e74c3c'}
                            />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            <section className="page-panel">
              <div className="page-panel__toolbar">
                <h2 className="page-panel__title">Ranking de atletas</h2>
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
                  <div className="page-filter-wrap">
                    <button
                      type="button"
                      className={`page-filter-btn ${showFilters || onlyRated ? 'is-active' : ''}`}
                      onClick={() => setShowFilters((v) => !v)}
                    >
                      <i className="bi bi-funnel" />
                      Filtros
                    </button>
                    {showFilters && (
                      <div className="page-filter-panel">
                        <label className="page-filter-check">
                          <input
                            type="checkbox"
                            checked={onlyRated}
                            onChange={(e) => setOnlyRated(e.target.checked)}
                          />
                          Somente com nota no período
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 page-table">
                  <thead>
                    <tr>
                      <th style={{ width: 56 }}>#</th>
                      <th>Atleta</th>
                      {tab === 'games' && (
                        <>
                          <th>Jogos</th>
                          <th>Nota média (jogo)</th>
                          <th>Gols</th>
                          <th>Titular</th>
                        </>
                      )}
                      {tab === 'trainings' && (
                        <>
                          <th>Sessões</th>
                          <th>Minutos</th>
                          <th>Notas</th>
                          <th>Nota média</th>
                        </>
                      )}
                      {tab === 'compare' && (
                        <>
                          <th>Nota jogo</th>
                          <th>Nota treino</th>
                          <th>Δ</th>
                          <th>Leitura</th>
                        </>
                      )}
                      <th className="text-end">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageSlice.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted py-5">
                          Nenhum atleta encontrado.
                        </td>
                      </tr>
                    ) : (
                      pageSlice.map((a, idx) => {
                        const rank = (currentPage - 1) * PAGE_SIZE + idx + 1;
                        const color = avatarColor(a.email || a.name || String(a.id));
                        return (
                          <tr key={a.id} className={selectedId === a.id ? 'table-active' : undefined}>
                            <td>
                              <div className="page-rank">
                                <span>{rank}</span>
                                {rankMedal(rank)}
                              </div>
                            </td>
                            <td>
                              <div className="page-person">
                                <div className="page-avatar" style={{ background: color }}>
                                  {getInitials(a.name, a.email)}
                                </div>
                                <div className="min-w-0">
                                  <div className="page-person__name">{a.name || '—'}</div>
                                  <div className="page-person__meta">{a.email}</div>
                                </div>
                              </div>
                            </td>
                            {tab === 'games' && (
                              <>
                                <td>{a.games.matchesPlayed}</td>
                                <td>
                                  {a.games.avgRating != null ? (
                                    <span className="page-pill">{a.games.avgRating}</span>
                                  ) : (
                                    <span className="text-muted">—</span>
                                  )}
                                </td>
                                <td>
                                  {a.games.goals}
                                  {a.games.ownGoals ? (
                                    <small className="text-muted"> (+{a.games.ownGoals} contra)</small>
                                  ) : null}
                                </td>
                                <td>
                                  {a.games.starters > 0 ? (
                                    <span className="page-check" title={`${a.games.starters} como titular`}>
                                      <i className="bi bi-check-lg" />
                                      {a.games.starters > 1 ? (
                                        <span className="page-check__count">{a.games.starters}</span>
                                      ) : null}
                                    </span>
                                  ) : (
                                    <span className="text-muted">—</span>
                                  )}
                                </td>
                              </>
                            )}
                            {tab === 'trainings' && (
                              <>
                                <td>{a.trainings.sessions}</td>
                                <td>{a.trainings.totalMinutes}</td>
                                <td>{a.trainings.notesCount}</td>
                                <td>
                                  {a.trainings.avgNoteRating != null ? (
                                    <span className="page-pill">{a.trainings.avgNoteRating}</span>
                                  ) : (
                                    <span className="text-muted">—</span>
                                  )}
                                </td>
                              </>
                            )}
                            {tab === 'compare' && (
                              <>
                                <td>
                                  {a.compare.avgMatchRating != null ? (
                                    <span className="page-pill">{a.compare.avgMatchRating}</span>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td>
                                  {a.compare.avgTrainingRating != null ? (
                                    <span className="page-pill">{a.compare.avgTrainingRating}</span>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td>
                                  {a.compare.delta == null
                                    ? '—'
                                    : a.compare.delta > 0
                                      ? `+${a.compare.delta}`
                                      : a.compare.delta}
                                </td>
                                <td>
                                  <span className={`badge text-bg-${compareBadge[a.compare.label] || 'secondary'}`}>
                                    {compareLabel[a.compare.label] || a.compare.label}
                                  </span>
                                </td>
                              </>
                            )}
                            <td className="text-end">
                              <button
                                type="button"
                                className="page-details-btn"
                                onClick={() => openAthlete(a.id)}
                              >
                                Detalhes <i className="bi bi-chevron-right" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="page-panel__footer">
                <span className="text-muted small">
                  Mostrando {fromIdx} a {toIdx} de {sortedAthletes.length} atletas
                </span>
                <div className="page-pagination">
                  <button
                    type="button"
                    className="page-shell-btn"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Página anterior"
                  >
                    <i className="bi bi-chevron-left" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`page-shell-btn ${n === currentPage ? 'is-active' : ''}`}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="page-shell-btn"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Próxima página"
                  >
                    <i className="bi bi-chevron-right" />
                  </button>
                </div>
              </div>
            </section>
          </div>

          {selectedId && (
            <div className="col-lg-5">
              <div className="dash-card sticky-top" style={{ top: 16 }}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 className="fw-bold mb-0">{detail?.athlete?.name || 'Atleta'}</h5>
                    <small className="text-muted">{detail?.athlete?.email}</small>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setSelectedId(null);
                      setDetail(null);
                    }}
                  />
                </div>

                {detailLoading || !detail ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="row g-2 mb-3 small">
                      <div className="col-6">
                        <div className="border rounded-3 p-2">
                          <div className="text-muted">Nota jogo</div>
                          <strong>{detail.summary.avgMatchRating ?? '—'}</strong>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="border rounded-3 p-2">
                          <div className="text-muted">Nota treino</div>
                          <strong>{detail.summary.avgTrainingNote ?? '—'}</strong>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleCreateNote} className="border rounded-3 p-3 mb-3" style={{ background: 'var(--surface-2)' }}>
                      <div className="fw-bold small mb-2">Nova nota (treino / jogo)</div>
                      <div className="row g-2">
                        <div className="col-6">
                          <select
                            className="form-select form-select-sm"
                            value={noteForm.type}
                            onChange={(e) =>
                              setNoteForm({ ...noteForm, type: e.target.value as 'treino' | 'jogo' })
                            }
                          >
                            <option value="treino">Treino</option>
                            <option value="jogo">Jogo</option>
                          </select>
                        </div>
                        <div className="col-6">
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={noteForm.date}
                            onChange={(e) => setNoteForm({ ...noteForm, date: e.target.value })}
                            required
                          />
                        </div>
                        {noteForm.type === 'jogo' && (
                          <div className="col-12">
                            <input
                              className="form-control form-control-sm"
                              placeholder="Adversário"
                              value={noteForm.opponent}
                              onChange={(e) => setNoteForm({ ...noteForm, opponent: e.target.value })}
                              required
                            />
                          </div>
                        )}
                        <div className="col-4">
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.5}
                            className="form-control form-control-sm"
                            value={noteForm.rating}
                            onChange={(e) => setNoteForm({ ...noteForm, rating: e.target.value })}
                            required
                          />
                        </div>
                        <div className="col-8">
                          <input
                            className="form-control form-control-sm"
                            placeholder="Observação"
                            value={noteForm.observation}
                            onChange={(e) => setNoteForm({ ...noteForm, observation: e.target.value })}
                            required
                          />
                        </div>
                        <div className="col-12">
                          <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>
                            Salvar nota
                          </button>
                        </div>
                      </div>
                    </form>

                    {(tab === 'games' || tab === 'compare') && (
                      <div className="mb-3">
                        <div className="fw-bold small mb-2">Partidas ({detail.matches.length})</div>
                        {detail.matches.length === 0 ? (
                          <div className="text-muted small">Nenhuma partida no período.</div>
                        ) : (
                          <div
                            className="list-group list-group-flush border rounded-3"
                            style={{ maxHeight: 220, overflowY: 'auto' }}
                          >
                            {detail.matches.map((m: any) => (
                              <div key={m.playerId} className="list-group-item px-2 py-2">
                                <div className="d-flex justify-content-between gap-2 align-items-center">
                                  <div className="min-w-0">
                                    <div className="fw-semibold text-truncate">{m.opponent}</div>
                                    <small className="text-muted">
                                      {formatDate(m.date)}
                                      {m.ourScore != null ? ` · ${m.ourScore}x${m.opponentScore}` : ''}
                                    </small>
                                  </div>
                                  <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    step={0.5}
                                    className="form-control form-control-sm"
                                    style={{ width: 72 }}
                                    defaultValue={m.rating ?? ''}
                                    key={`${m.playerId}-${m.rating}`}
                                    title="Nota da partida"
                                    onBlur={(e) => {
                                      const val = e.target.value;
                                      const cur = m.rating != null ? String(m.rating) : '';
                                      if (val !== cur) handleUpdateMatchRating(m.matchId, m.playerId, val);
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {(tab === 'trainings' || tab === 'compare') && (
                      <div className="mb-3">
                        <div className="fw-bold small mb-2">
                          Notas de treino ({detail.notes.treino.length})
                        </div>
                        {detail.notes.treino.length === 0 ? (
                          <div className="text-muted small">Nenhuma nota de treino.</div>
                        ) : (
                          <ul
                            className="list-group list-group-flush border rounded-3"
                            style={{ maxHeight: 180, overflowY: 'auto' }}
                          >
                            {detail.notes.treino.map((n: any) => (
                              <li key={n.id} className="list-group-item px-2 py-2 d-flex justify-content-between gap-2">
                                <div>
                                  <div className="fw-semibold">
                                    {formatDate(n.date)} · nota {n.rating}
                                  </div>
                                  <small className="text-muted">{n.observation}</small>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteNote(n.id)}
                                >
                                  ×
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {(tab === 'games' || tab === 'compare') && detail.notes.jogo.length > 0 && (
                      <div className="mb-2">
                        <div className="fw-bold small mb-2">Notas de jogo (qualitativas)</div>
                        <ul
                          className="list-group list-group-flush border rounded-3"
                          style={{ maxHeight: 140, overflowY: 'auto' }}
                        >
                          {detail.notes.jogo.map((n: any) => (
                            <li key={n.id} className="list-group-item px-2 py-2 d-flex justify-content-between gap-2">
                              <div>
                                <div className="fw-semibold">
                                  {formatDate(n.date)} · {n.opponent} · {n.rating}
                                </div>
                                <small className="text-muted">{n.observation}</small>
                              </div>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteNote(n.id)}
                              >
                                ×
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAthletePerformance;
