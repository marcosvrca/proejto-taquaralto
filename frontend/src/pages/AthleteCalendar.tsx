import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

interface CalendarMatch {
  id: number;
  category: 'torneio' | 'amistoso' | 'avulso';
  date: string;
  time?: string;
  opponent: string;
  location: 'casa' | 'fora' | 'neutro';
  venue?: string;
  status: 'agendado' | 'em_andamento' | 'finalizado' | 'cancelado';
  ourScore?: number | null;
  opponentScore?: number | null;
  tournament?: { id: number; name: string; kind?: string } | null;
}

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

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('pt-BR');
}

const AthleteCalendar: React.FC = () => {
  const [matches, setMatches] = useState<CalendarMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<CalendarMatch | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/api/calendar/matches');
        setMatches(res.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar calendário');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (filterCategory && m.category !== filterCategory) return false;
      return String(m.date).startsWith(calendarMonth);
    });
  }, [matches, filterCategory, calendarMonth]);

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
    const cells: Array<{ day: number | null; dateStr: string | null; matches: CalendarMatch[] }> = [];
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
        <p className="text-secondary mt-3">Carregando calendário...</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-header__copy">
          <p className="page-eyebrow">Agenda do time</p>
          <h1 className="page-title">Calendário</h1>
          <p className="page-subtitle">
            Visualize os jogos cadastrados pela comissão técnica. Somente consulta.
          </p>
        </div>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      <section className="page-panel mb-3">
        <div className="page-panel__toolbar">
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => shiftMonth(-1)}>
              ‹
            </button>
            <strong style={{ textTransform: 'capitalize' }}>
              {new Date(`${calendarMonth}-01T12:00:00`).toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric',
              })}
            </strong>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => shiftMonth(1)}>
              ›
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
        </div>
      </section>

      <div className="game-calendar mb-4">
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
              style={{ cursor: cell.day ? 'default' : 'default' }}
            >
              {cell.day && <div className="game-calendar__day-num small">{cell.day}</div>}
              {cell.matches
                .filter((m) => !filterCategory || m.category === filterCategory)
                .slice(0, 3)
                .map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`game-calendar__event text-truncate rounded px-1 mb-1 game-calendar__event--${m.category} border-0 w-100 text-start`}
                    onClick={() => setSelectedMatch(m)}
                    title={`${m.opponent} — ver detalhes`}
                  >
                    {m.time ? String(m.time).slice(0, 5) + ' ' : ''}
                    {m.opponent}
                  </button>
                ))}
            </div>
          ))}
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h5 className="fw-bold mb-3">Jogos do mês</h5>
          {filteredMatches.length === 0 ? (
            <p className="text-muted mb-0">Nenhum jogo neste mês.</p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Categoria</th>
                    <th>Adversário</th>
                    <th>Local</th>
                    <th>Placar</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.map((m) => (
                    <tr
                      key={m.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedMatch(m)}
                    >
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedMatch && (
        <>
          <div className="modal-backdrop fade show" onClick={() => setSelectedMatch(null)} />
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">vs {selectedMatch.opponent}</h5>
                  <button type="button" className="btn-close" onClick={() => setSelectedMatch(null)} />
                </div>
                <div className="modal-body">
                  <dl className="row mb-0">
                    <dt className="col-4 text-muted">Data</dt>
                    <dd className="col-8">
                      {formatDate(selectedMatch.date)}
                      {selectedMatch.time ? ` · ${String(selectedMatch.time).slice(0, 5)}` : ''}
                    </dd>
                    <dt className="col-4 text-muted">Categoria</dt>
                    <dd className="col-8">{categoryLabel[selectedMatch.category]}</dd>
                    {selectedMatch.tournament?.name && (
                      <>
                        <dt className="col-4 text-muted">Torneio</dt>
                        <dd className="col-8">{selectedMatch.tournament.name}</dd>
                      </>
                    )}
                    <dt className="col-4 text-muted">Local</dt>
                    <dd className="col-8">
                      {locationLabel[selectedMatch.location]}
                      {selectedMatch.venue ? ` · ${selectedMatch.venue}` : ''}
                    </dd>
                    <dt className="col-4 text-muted">Status</dt>
                    <dd className="col-8">{statusLabel[selectedMatch.status]}</dd>
                    <dt className="col-4 text-muted">Placar</dt>
                    <dd className="col-8">
                      {selectedMatch.ourScore != null && selectedMatch.opponentScore != null
                        ? `${selectedMatch.ourScore} x ${selectedMatch.opponentScore}`
                        : 'A definir'}
                    </dd>
                  </dl>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedMatch(null)}>
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AthleteCalendar;
