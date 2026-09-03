import React, { useEffect, useMemo, useState } from 'react';
import {
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
  LineChart,
  Line,
} from 'recharts';
import api from '../services/api';
import MatchSquadModal from '../components/MatchSquadModal';

type Tab = 'calendar' | 'tournaments' | 'metrics';

interface Tournament {
  id: number;
  name: string;
  kind: string;
  season?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

interface Match {
  id: number;
  category: 'torneio' | 'amistoso' | 'avulso';
  tournamentId?: number | null;
  tournament?: Tournament | null;
  date: string;
  time?: string;
  opponent: string;
  location: 'casa' | 'fora' | 'neutro';
  venue?: string;
  status: 'agendado' | 'em_andamento' | 'finalizado' | 'cancelado';
  ourScore?: number | null;
  opponentScore?: number | null;
  notes?: string;
}

const COLORS = ['#198754', '#6c757d', '#dc3545', '#0d6efd', '#fd7e14', '#20c997'];

const categoryLabel: Record<string, string> = {
  torneio: 'Torneio',
  amistoso: 'Amistoso',
  avulso: 'Avulso',
};

const locationLabel: Record<string, string> = {
  casa: 'Casa',
  fora: 'Fora',
  neutro: 'Neutro',
};

const statusLabel: Record<string, string> = {
  agendado: 'Agendado',
  em_andamento: 'Em andamento',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
};

const kindLabel: Record<string, string> = {
  campeonato: 'Campeonato',
  copa: 'Copa',
  liga: 'Liga',
  outro: 'Outro',
};

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('pt-BR');
}

const emptyMatchForm = {
  category: 'avulso' as Match['category'],
  tournamentId: '',
  date: new Date().toISOString().split('T')[0],
  time: '19:00',
  opponent: '',
  location: 'casa' as Match['location'],
  venue: '',
  status: 'agendado' as Match['status'],
  ourScore: '',
  opponentScore: '',
  notes: '',
};

const emptyTournamentForm = {
  name: '',
  kind: 'campeonato',
  season: '',
  startDate: '',
  endDate: '',
  notes: '',
};

const AdminGames: React.FC = () => {
  const [tab, setTab] = useState<Tab>('calendar');
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [showTournamentForm, setShowTournamentForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [squadMatchId, setSquadMatchId] = useState<number | null>(null);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [matchForm, setMatchForm] = useState({ ...emptyMatchForm });
  const [tournamentForm, setTournamentForm] = useState({ ...emptyTournamentForm });
  const [filterCategory, setFilterCategory] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const loadAll = async () => {
    try {
      setLoading(true);
      const [mRes, tRes, metRes] = await Promise.all([
        api.get('/api/admin/matches'),
        api.get('/api/admin/tournaments'),
        api.get('/api/admin/matches/metrics'),
      ]);
      setMatches(mRes.data || []);
      setTournaments(tRes.data || []);
      setMetrics(metRes.data || null);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Erro ao carregar módulo de jogos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (filterCategory && m.category !== filterCategory) return false;
      return String(m.date).startsWith(calendarMonth);
    });
  }, [matches, filterCategory, calendarMonth]);

  const openCreateMatch = (preset?: Partial<typeof emptyMatchForm>) => {
    setEditingMatch(null);
    setMatchForm({ ...emptyMatchForm, ...preset });
    setShowMatchForm(true);
  };

  const openEditMatch = (match: Match) => {
    setEditingMatch(match);
    setMatchForm({
      category: match.category,
      tournamentId: match.tournamentId ? String(match.tournamentId) : '',
      date: match.date,
      time: match.time ? String(match.time).slice(0, 5) : '',
      opponent: match.opponent,
      location: match.location,
      venue: match.venue || '',
      status: match.status,
      ourScore: match.ourScore != null ? String(match.ourScore) : '',
      opponentScore: match.opponentScore != null ? String(match.opponentScore) : '',
      notes: match.notes || '',
    });
    setShowMatchForm(true);
  };

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...matchForm,
        tournamentId: matchForm.tournamentId || null,
        ourScore: matchForm.ourScore === '' ? null : Number(matchForm.ourScore),
        opponentScore: matchForm.opponentScore === '' ? null : Number(matchForm.opponentScore),
      };
      if (editingMatch) {
        await api.put(`/api/admin/matches/${editingMatch.id}`, payload);
        setMessage('Jogo atualizado');
      } else {
        await api.post('/api/admin/matches', payload);
        setMessage('Jogo cadastrado');
      }
      setShowMatchForm(false);
      await loadAll();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Erro ao salvar jogo');
    }
  };

  const handleDeleteMatch = async (id: number) => {
    if (!confirm('Remover este jogo?')) return;
    try {
      await api.delete(`/api/admin/matches/${id}`);
      setMessage('Jogo removido');
      await loadAll();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Erro ao remover jogo');
    }
  };

  const openCreateTournament = () => {
    setEditingTournament(null);
    setTournamentForm({ ...emptyTournamentForm });
    setShowTournamentForm(true);
  };

  const openEditTournament = (t: Tournament) => {
    setEditingTournament(t);
    setTournamentForm({
      name: t.name,
      kind: t.kind,
      season: t.season || '',
      startDate: t.startDate || '',
      endDate: t.endDate || '',
      notes: t.notes || '',
    });
    setShowTournamentForm(true);
  };

  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTournament) {
        await api.put(`/api/admin/tournaments/${editingTournament.id}`, tournamentForm);
        setMessage('Torneio atualizado');
      } else {
        await api.post('/api/admin/tournaments', tournamentForm);
        setMessage('Torneio criado');
      }
      setShowTournamentForm(false);
      await loadAll();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Erro ao salvar torneio');
    }
  };

  const handleDeleteTournament = async (id: number) => {
    if (!confirm('Remover este torneio? Os jogos vinculados ficam avulsos/sem torneio.')) return;
    try {
      await api.delete(`/api/admin/tournaments/${id}`);
      setMessage('Torneio removido');
      await loadAll();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Erro ao remover torneio');
    }
  };

  const shiftMonth = (delta: number) => {
    const [y, m] = calendarMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setCalendarMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const calendarDays = useMemo(() => {
    const [y, m] = calendarMonth.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(y, m, 0).getDate();
    const cells: Array<{ day: number | null; dateStr: string | null; matches: Match[] }> = [];
    for (let i = 0; i < startPad; i++) cells.push({ day: null, dateStr: null, matches: [] });
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${calendarMonth}-${String(day).padStart(2, '0')}`;
      cells.push({
        day,
        dateStr,
        matches: matches.filter((x) => x.date === dateStr),
      });
    }
    return cells;
  }, [calendarMonth, matches]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" />
        <p className="text-secondary mt-3">Carregando módulo de jogos...</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-header__copy">
          <p className="page-eyebrow">Administração</p>
          <h1 className="page-title">Jogos & Calendário</h1>
          <p className="page-subtitle">
            Cadastre torneios, amistosos e jogos avulsos, gerencie a agenda do time e acompanhe as métricas.
          </p>
        </div>
      </header>

      <div className="page-tabs" role="tablist">
        {[
          { id: 'calendar' as Tab, label: 'Calendário', icon: 'bi-calendar3' },
          { id: 'tournaments' as Tab, label: 'Torneios', icon: 'bi-trophy' },
          { id: 'metrics' as Tab, label: 'Métricas', icon: 'bi-bar-chart' },
        ].map((t) => (
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
        <div className="alert alert-info alert-dismissible fade show">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')} />
        </div>
      )}

      {tab === 'calendar' && (
        <>
          <section className="page-panel mb-3">
            <div className="page-panel__toolbar">
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <button type="button" className="page-page-btn" onClick={() => shiftMonth(-1)} aria-label="Mês anterior">
                  <i className="bi bi-chevron-left" />
                </button>
                <strong className="page-panel__title" style={{ textTransform: 'capitalize' }}>
                  {new Date(`${calendarMonth}-01T12:00:00`).toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </strong>
                <button type="button" className="page-page-btn" onClick={() => shiftMonth(1)} aria-label="Próximo mês">
                  <i className="bi bi-chevron-right" />
                </button>
                <select
                  className="form-select form-select-sm"
                  style={{ width: 160 }}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">Todas categorias</option>
                  <option value="torneio">Torneio</option>
                  <option value="amistoso">Amistoso</option>
                  <option value="avulso">Avulso</option>
                </select>
              </div>
              <button type="button" className="btn btn-primary" onClick={() => openCreateMatch()}>
                + Novo jogo
              </button>
            </div>
          </section>

          <div className="games-calendar mb-4">
            <div className="game-calendar__weekdays">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                <div key={d} className="small fw-bold text-muted text-center py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="game-calendar__grid">
              {calendarDays.map((cell, idx) => (
                <div
                  key={idx}
                  className={`game-calendar__cell border rounded-3 p-2 ${
                    cell.day ? 'game-calendar__cell--day' : 'game-calendar__cell--empty'
                  }`}
                  onClick={() => cell.dateStr && openCreateMatch({ date: cell.dateStr })}
                >
                  {cell.day && <div className="game-calendar__day-num small">{cell.day}</div>}
                  {cell.matches
                    .filter((m) => !filterCategory || m.category === filterCategory)
                    .slice(0, 3)
                    .map((m) => (
                      <div
                        key={m.id}
                        className={`game-calendar__event text-truncate rounded px-1 mb-1 game-calendar__event--${m.category}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSquadMatchId(m.id);
                        }}
                        title={`${m.opponent} — Escalação, notas e gols`}
                      >
                        {m.time ? String(m.time).slice(0, 5) + ' ' : ''}
                        {m.opponent}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>

          <section className="page-panel">
            <div className="page-panel__toolbar">
              <h2 className="page-panel__title">Jogos do mês</h2>
            </div>
            <div className="page-panel__body">
              {filteredMatches.length === 0 ? (
                <p className="text-muted mb-0">Nenhum jogo neste mês.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle page-table mb-0">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Categoria</th>
                        <th>Adversário</th>
                        <th>Local</th>
                        <th>Placar</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMatches.map((m) => (
                        <tr key={m.id}>
                          <td>
                            {formatDate(m.date)}
                            {m.time ? ` · ${String(m.time).slice(0, 5)}` : ''}
                          </td>
                          <td>
                            <span className="badge bg-secondary-subtle text-dark">{categoryLabel[m.category]}</span>
                            {m.tournament?.name && (
                              <div className="small text-muted">{m.tournament.name}</div>
                            )}
                          </td>
                          <td className="fw-semibold">{m.opponent}</td>
                          <td>
                            {locationLabel[m.location]}
                            {m.venue ? ` · ${m.venue}` : ''}
                          </td>
                          <td>
                            {m.ourScore != null && m.opponentScore != null
                              ? `${m.ourScore} x ${m.opponentScore}`
                              : '—'}
                          </td>
                          <td>{statusLabel[m.status]}</td>
                          <td className="text-end text-nowrap">
                            <button type="button" className="btn btn-sm btn-success me-1" onClick={() => setSquadMatchId(m.id)}>
                              Escalação / Notas
                            </button>
                            <button type="button" className="btn btn-sm btn-outline-primary me-1" onClick={() => openEditMatch(m)}>
                              Editar
                            </button>
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteMatch(m.id)}>
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {tab === 'tournaments' && (
        <>
          <div className="page-panel__toolbar px-0 border-0 mb-3" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <h2 className="page-panel__title">Torneios cadastrados</h2>
            <button type="button" className="btn btn-primary" onClick={openCreateTournament}>
              + Novo torneio
            </button>
          </div>
          <div className="row g-3">
            {tournaments.length === 0 && (
              <div className="col-12">
                <div className="alert alert-light border">Nenhum torneio cadastrado ainda.</div>
              </div>
            )}
            {tournaments.map((t) => (
              <div className="col-md-6 col-lg-4" key={t.id}>
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="badge bg-primary mb-2">{kindLabel[t.kind] || t.kind}</div>
                    <h5 className="fw-bold">{t.name}</h5>
                    <p className="small text-muted mb-2">
                      {t.season || 'Sem temporada'} · {formatDate(t.startDate)} → {formatDate(t.endDate)}
                    </p>
                    {t.notes && <p className="small">{t.notes}</p>}
                    <div className="d-flex gap-2 mt-3">
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openEditTournament(t)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success"
                        onClick={() => {
                          setTab('calendar');
                          openCreateMatch({ category: 'torneio', tournamentId: String(t.id) });
                        }}
                      >
                        + Jogo
                      </button>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteTournament(t.id)}>
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'metrics' && metrics && (
        <>
          <div className="row g-3 mb-4">
            {[
              { label: 'Jogos', value: metrics.summary.total, icon: 'bi-calendar-event', color: 'var(--accent)' },
              { label: 'Disputados', value: metrics.summary.played, icon: 'bi-flag', color: '#5dade2' },
              { label: 'Vitórias', value: metrics.summary.wins, icon: 'bi-trophy', color: 'var(--success)' },
              { label: 'Empates', value: metrics.summary.draws, icon: 'bi-dash-circle', color: '#f0d878' },
              { label: 'Derrotas', value: metrics.summary.losses, icon: 'bi-x-circle', color: 'var(--danger)' },
              { label: 'Aproveitamento', value: `${metrics.summary.winRate}%`, icon: 'bi-percent', color: 'var(--accent)' },
              { label: 'Gols pró', value: metrics.summary.goalsFor, icon: 'bi-bullseye', color: 'var(--success)' },
              { label: 'Gols contra', value: metrics.summary.goalsAgainst, icon: 'bi-shield', color: 'var(--danger)' },
              { label: 'Saldo', value: metrics.summary.goalDiff, icon: 'bi-graph-up-arrow', color: '#5dade2' },
              { label: 'Pontos*', value: metrics.summary.points, icon: 'bi-star', color: 'var(--accent)' },
            ].map((card) => (
              <div className="col-6 col-md-4 col-xl-2" key={card.label}>
                <div className="page-stat" style={{ minHeight: 88 }}>
                  <div
                    className="page-stat__icon"
                    style={{ background: `${card.color}22`, color: card.color, width: 36, height: 36, fontSize: '0.95rem' }}
                  >
                    <i className={`bi ${card.icon}`} />
                  </div>
                  <div className="page-stat__body">
                    <div className="page-stat__label">{card.label}</div>
                    <div className="page-stat__value" style={{ fontSize: '1.25rem' }}>
                      {card.value}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="small text-muted mb-4">*Pontos no critério 3 por vitória / 1 por empate (referência).</p>

          <div className="row g-4 mb-4">
            <div className="col-lg-5">
              <div className="page-panel h-100">
                <div className="page-panel__toolbar">
                  <h2 className="page-panel__title">Resultados</h2>
                </div>
                <div className="page-panel__body">
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={metrics.resultsPie.filter((x: any) => x.value > 0)} dataKey="value" nameKey="name" outerRadius={90} label>
                          {metrics.resultsPie.map((_: any, i: number) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-7">
              <div className="page-panel h-100">
                <div className="page-panel__toolbar">
                  <h2 className="page-panel__title">Evolução mensal</h2>
                </div>
                <div className="page-panel__body">
                  <div style={{ width: '100%', height: 260 }}>
                    {(metrics.monthly || []).length === 0 ? (
                      <p className="text-muted">Sem jogos finalizados para evolução.</p>
                    ) : (
                      <ResponsiveContainer>
                        <LineChart data={metrics.monthly}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="month" stroke="var(--text-muted)" />
                          <YAxis stroke="var(--text-muted)" />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="vitorias" name="Vitórias" stroke="#2ecc71" strokeWidth={2} />
                          <Line type="monotone" dataKey="empates" name="Empates" stroke="#9aa5b8" strokeWidth={2} />
                          <Line type="monotone" dataKey="derrotas" name="Derrotas" stroke="#e74c3c" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="page-panel h-100">
                <div className="page-panel__toolbar">
                  <h2 className="page-panel__title">Gols por mês</h2>
                </div>
                <div className="page-panel__body">
                  <div style={{ width: '100%', height: 260 }}>
                    {(metrics.monthly || []).length === 0 ? (
                      <p className="text-muted">Sem dados.</p>
                    ) : (
                      <ResponsiveContainer>
                        <BarChart data={metrics.monthly}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="month" stroke="var(--text-muted)" />
                          <YAxis stroke="var(--text-muted)" />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="golsPro" name="Gols pró" fill="#d4af37" />
                          <Bar dataKey="golsContra" name="Gols contra" fill="#e67e22" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="page-panel h-100">
                <div className="page-panel__toolbar">
                  <h2 className="page-panel__title">Desempenho por mando</h2>
                </div>
                <div className="page-panel__body">
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <BarChart data={metrics.byLocation}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="name" stroke="var(--text-muted)" />
                        <YAxis stroke="var(--text-muted)" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="v" name="V" fill="#2ecc71" />
                        <Bar dataKey="e" name="E" fill="#9aa5b8" />
                        <Bar dataKey="d" name="D" fill="#e74c3c" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">Próximos jogos</h6>
                  {(metrics.upcoming || []).length === 0 ? (
                    <p className="text-muted mb-0">Nenhum jogo agendado.</p>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {metrics.upcoming.map((m: Match) => (
                        <li key={m.id} className="list-group-item px-0 d-flex justify-content-between">
                          <span>
                            {formatDate(m.date)} · vs {m.opponent}
                          </span>
                          <span className="badge bg-light text-dark">{categoryLabel[m.category]}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">Últimos resultados</h6>
                  {(metrics.recent || []).length === 0 ? (
                    <p className="text-muted mb-0">Nenhum resultado ainda.</p>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {metrics.recent.map((m: Match) => (
                        <li key={m.id} className="list-group-item px-0 d-flex justify-content-between">
                          <span>
                            {formatDate(m.date)} · vs {m.opponent}
                          </span>
                          <strong>
                            {m.ourScore}x{m.opponentScore}
                          </strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Match modal */}
      {showMatchForm && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <form className="modal-content" onSubmit={handleSaveMatch}>
                <div className="modal-header">
                  <h5 className="modal-title">{editingMatch ? 'Editar jogo' : 'Novo jogo'}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowMatchForm(false)} />
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">Categoria</label>
                      <select
                        className="form-select"
                        value={matchForm.category}
                        onChange={(e) => setMatchForm({ ...matchForm, category: e.target.value as Match['category'] })}
                      >
                        <option value="torneio">Torneio</option>
                        <option value="amistoso">Amistoso</option>
                        <option value="avulso">Avulso</option>
                      </select>
                    </div>
                    {matchForm.category === 'torneio' && (
                      <div className="col-md-8">
                        <label className="form-label">Torneio</label>
                        <select
                          className="form-select"
                          value={matchForm.tournamentId}
                          onChange={(e) => setMatchForm({ ...matchForm, tournamentId: e.target.value })}
                          required
                        >
                          <option value="">Selecione...</option>
                          {tournaments.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="col-md-4">
                      <label className="form-label">Data</label>
                      <input
                        type="date"
                        className="form-control"
                        value={matchForm.date}
                        onChange={(e) => setMatchForm({ ...matchForm, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Horário</label>
                      <input
                        type="time"
                        className="form-control"
                        value={matchForm.time}
                        onChange={(e) => setMatchForm({ ...matchForm, time: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={matchForm.status}
                        onChange={(e) => setMatchForm({ ...matchForm, status: e.target.value as Match['status'] })}
                      >
                        <option value="agendado">Agendado</option>
                        <option value="em_andamento">Em andamento</option>
                        <option value="finalizado">Finalizado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Adversário</label>
                      <input
                        className="form-control"
                        value={matchForm.opponent}
                        onChange={(e) => setMatchForm({ ...matchForm, opponent: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Mando</label>
                      <select
                        className="form-select"
                        value={matchForm.location}
                        onChange={(e) => setMatchForm({ ...matchForm, location: e.target.value as Match['location'] })}
                      >
                        <option value="casa">Casa</option>
                        <option value="fora">Fora</option>
                        <option value="neutro">Neutro</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Local/Ginásio</label>
                      <input
                        className="form-control"
                        value={matchForm.venue}
                        onChange={(e) => setMatchForm({ ...matchForm, venue: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Gols (nós)</label>
                      <input
                        type="number"
                        min={0}
                        className="form-control"
                        value={matchForm.ourScore}
                        onChange={(e) => setMatchForm({ ...matchForm, ourScore: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Gols (adversário)</label>
                      <input
                        type="number"
                        min={0}
                        className="form-control"
                        value={matchForm.opponentScore}
                        onChange={(e) => setMatchForm({ ...matchForm, opponentScore: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Observações</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={matchForm.notes}
                        onChange={(e) => setMatchForm({ ...matchForm, notes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowMatchForm(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Tournament modal */}
      {showTournamentForm && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <form className="modal-content" onSubmit={handleSaveTournament}>
                <div className="modal-header">
                  <h5 className="modal-title">{editingTournament ? 'Editar torneio' : 'Novo torneio'}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowTournamentForm(false)} />
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">Nome</label>
                      <input
                        className="form-control"
                        value={tournamentForm.name}
                        onChange={(e) => setTournamentForm({ ...tournamentForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Tipo</label>
                      <select
                        className="form-select"
                        value={tournamentForm.kind}
                        onChange={(e) => setTournamentForm({ ...tournamentForm, kind: e.target.value })}
                      >
                        <option value="campeonato">Campeonato</option>
                        <option value="copa">Copa</option>
                        <option value="liga">Liga</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Temporada</label>
                      <input
                        className="form-control"
                        placeholder="2026"
                        value={tournamentForm.season}
                        onChange={(e) => setTournamentForm({ ...tournamentForm, season: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Início</label>
                      <input
                        type="date"
                        className="form-control"
                        value={tournamentForm.startDate}
                        onChange={(e) => setTournamentForm({ ...tournamentForm, startDate: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Fim</label>
                      <input
                        type="date"
                        className="form-control"
                        value={tournamentForm.endDate}
                        onChange={(e) => setTournamentForm({ ...tournamentForm, endDate: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Observações</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={tournamentForm.notes}
                        onChange={(e) => setTournamentForm({ ...tournamentForm, notes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowTournamentForm(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {squadMatchId != null && (
        <MatchSquadModal
          matchId={squadMatchId}
          onClose={() => setSquadMatchId(null)}
          onUpdated={loadAll}
        />
      )}
    </div>
  );
};

export default AdminGames;
