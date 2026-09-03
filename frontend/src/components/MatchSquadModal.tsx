import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

interface MatchSquadModalProps {
  matchId: number;
  onClose: () => void;
  onUpdated?: () => void;
}

const MatchSquadModal: React.FC<MatchSquadModalProps> = ({ matchId, onClose, onUpdated }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<any>(null);
  const [selectedAthletes, setSelectedAthletes] = useState<number[]>([]);
  const [scoreForm, setScoreForm] = useState({ ourScore: '', opponentScore: '', status: 'agendado', notes: '' });
  const [goalForm, setGoalForm] = useState({
    athleteId: '',
    minute: '',
    isOwnGoal: false,
    isOpponentGoal: false,
    description: '',
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/admin/matches/${matchId}`);
      setDetails(res.data);
      setScoreForm({
        ourScore: res.data.match.ourScore != null ? String(res.data.match.ourScore) : '',
        opponentScore: res.data.match.opponentScore != null ? String(res.data.match.opponentScore) : '',
        status: res.data.match.status || 'agendado',
        notes: res.data.match.notes || '',
      });
      setSelectedAthletes([]);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Erro ao carregar partida');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [matchId]);

  const lineupIds = useMemo(
    () => new Set((details?.players || []).map((p: any) => p.athleteId)),
    [details]
  );

  const availableToAdd = useMemo(
    () => (details?.availableAthletes || []).filter((a: any) => !lineupIds.has(a.id)),
    [details, lineupIds]
  );

  const toggleAthlete = (id: number) => {
    setSelectedAthletes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleAddPlayers = async () => {
    if (!selectedAthletes.length) return;
    setSaving(true);
    setMessage('');
    try {
      await api.post(`/api/admin/matches/${matchId}/players`, { athleteIds: selectedAthletes });
      setMessage('Atletas adicionados à partida');
      await load();
      onUpdated?.();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Erro ao adicionar atletas');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRating = async (playerId: number, rating: string) => {
    try {
      await api.put(`/api/admin/matches/${matchId}/players/${playerId}`, {
        rating: rating === '' ? null : Number(rating),
      });
      await load();
      onUpdated?.();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Erro ao salvar nota');
    }
  };

  const handleToggleStarter = async (playerId: number, isStarter: boolean) => {
    try {
      await api.put(`/api/admin/matches/${matchId}/players/${playerId}`, { isStarter });
      await load();
      onUpdated?.();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Erro ao atualizar titular');
    }
  };

  const handleRemovePlayer = async (playerId: number) => {
    if (!confirm('Remover atleta desta partida? Gols dele também serão removidos.')) return;
    try {
      await api.delete(`/api/admin/matches/${matchId}/players/${playerId}`);
      await load();
      onUpdated?.();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Erro ao remover atleta');
    }
  };

  const handleSaveMatchInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.put(`/api/admin/matches/${matchId}`, {
        ourScore: scoreForm.ourScore === '' ? null : Number(scoreForm.ourScore),
        opponentScore: scoreForm.opponentScore === '' ? null : Number(scoreForm.opponentScore),
        status: scoreForm.status,
        notes: scoreForm.notes,
      });
      setMessage('Informações da partida atualizadas');
      await load();
      onUpdated?.();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Erro ao atualizar partida');
    } finally {
      setSaving(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.post(`/api/admin/matches/${matchId}/goals`, {
        athleteId: goalForm.isOpponentGoal ? null : goalForm.athleteId || null,
        minute: goalForm.minute,
        isOwnGoal: goalForm.isOwnGoal,
        isOpponentGoal: goalForm.isOpponentGoal,
        description: goalForm.description,
      });
      setGoalForm({ athleteId: '', minute: '', isOwnGoal: false, isOpponentGoal: false, description: '' });
      setMessage('Gol registrado');
      await load();
      onUpdated?.();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Erro ao registrar gol');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveGoal = async (goalId: number) => {
    if (!confirm('Remover este gol?')) return;
    try {
      await api.delete(`/api/admin/matches/${matchId}/goals/${goalId}`);
      await load();
      onUpdated?.();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Erro ao remover gol');
    }
  };

  const match = details?.match;

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h5 className="modal-title mb-0">
                  {match ? `Partida vs ${match.opponent}` : 'Detalhes da partida'}
                </h5>
                {match && (
                  <small className="text-muted">
                    {new Date(`${match.date}T12:00:00`).toLocaleDateString('pt-BR')}
                    {match.time ? ` · ${String(match.time).slice(0, 5)}` : ''}
                    {` · ${match.status}`}
                  </small>
                )}
              </div>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <div className="modal-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" />
                </div>
              ) : (
                <>
                  {message && <div className="alert alert-info py-2">{message}</div>}

                  {/* Placar / status */}
                  <form onSubmit={handleSaveMatchInfo} className="p-3 rounded-3 border bg-light mb-4">
                    <h6 className="fw-bold mb-3">Resultado da partida</h6>
                    <div className="row g-3 align-items-end">
                      <div className="col-md-2">
                        <label className="form-label small">Gols pró</label>
                        <input
                          type="number"
                          min={0}
                          className="form-control"
                          value={scoreForm.ourScore}
                          onChange={(e) => setScoreForm({ ...scoreForm, ourScore: e.target.value })}
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label small">Gols contra</label>
                        <input
                          type="number"
                          min={0}
                          className="form-control"
                          value={scoreForm.opponentScore}
                          onChange={(e) => setScoreForm({ ...scoreForm, opponentScore: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small">Status</label>
                        <select
                          className="form-select"
                          value={scoreForm.status}
                          onChange={(e) => setScoreForm({ ...scoreForm, status: e.target.value })}
                        >
                          <option value="agendado">Agendado</option>
                          <option value="em_andamento">Em andamento</option>
                          <option value="finalizado">Finalizado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small">Obs. da partida</label>
                        <input
                          className="form-control"
                          value={scoreForm.notes}
                          onChange={(e) => setScoreForm({ ...scoreForm, notes: e.target.value })}
                        />
                      </div>
                      <div className="col-md-2">
                        <button type="submit" className="btn btn-primary w-100" disabled={saving}>
                          Atualizar
                        </button>
                      </div>
                    </div>
                    {details?.summary && (
                      <div className="small text-muted mt-2">
                        Gols registrados: pró {details.summary.ourGoalsLogged}
                        {details.summary.ownGoalsLogged ? ` (+${details.summary.ownGoalsLogged} contra)` : ''}
                        {' · '}adversário {details.summary.opponentGoalsLogged}
                        {details.summary.avgRating != null ? ` · nota média ${details.summary.avgRating}` : ''}
                      </div>
                    )}
                  </form>

                  <div className="row g-4">
                    {/* Escalação */}
                    <div className="col-lg-6">
                      <h6 className="fw-bold mb-3">Escalação / relacionados</h6>

                      {availableToAdd.length > 0 && (
                        <div className="border rounded-3 p-3 mb-3">
                          <div className="small fw-bold mb-2">Adicionar atletas</div>
                          <div className="d-flex flex-wrap gap-2 mb-3" style={{ maxHeight: 140, overflowY: 'auto' }}>
                            {availableToAdd.map((a: any) => (
                              <label key={a.id} className="badge bg-light text-dark border p-2" style={{ cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  className="form-check-input me-1"
                                  checked={selectedAthletes.includes(a.id)}
                                  onChange={() => toggleAthlete(a.id)}
                                />
                                {a.name || a.email}
                              </label>
                            ))}
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            disabled={!selectedAthletes.length || saving}
                            onClick={handleAddPlayers}
                          >
                            Adicionar selecionados ({selectedAthletes.length})
                          </button>
                        </div>
                      )}

                      {(details?.players || []).length === 0 ? (
                        <div className="text-muted small border rounded-3 p-3">Nenhum atleta na partida ainda.</div>
                      ) : (
                        <div className="table-responsive border rounded-3">
                          <table className="table table-sm mb-0 align-middle">
                            <thead className="table-light">
                              <tr>
                                <th>Atleta</th>
                                <th style={{ width: 90 }}>Titular</th>
                                <th style={{ width: 110 }}>Nota</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {details.players.map((p: any) => (
                                <tr key={p.id}>
                                  <td>
                                    <div className="fw-semibold">{p.name}</div>
                                    <small className="text-muted">{p.isStarter ? 'Titular' : 'Relacionado'}</small>
                                  </td>
                                  <td>
                                    <div className="form-check form-switch m-0">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        role="switch"
                                        checked={!!p.isStarter}
                                        title="Marcar como titular"
                                        onChange={(e) => handleToggleStarter(p.id, e.target.checked)}
                                      />
                                    </div>
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="form-control form-control-sm"
                                      min={0}
                                      max={10}
                                      step={0.5}
                                      placeholder="0-10"
                                      defaultValue={p.rating ?? ''}
                                      key={`${p.id}-${p.rating}`}
                                      onBlur={(e) => {
                                        const val = e.target.value;
                                        const current = p.rating != null ? String(p.rating) : '';
                                        if (val !== current) handleUpdateRating(p.id, val);
                                      }}
                                    />
                                  </td>
                                  <td className="text-end">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleRemovePlayer(p.id)}
                                    >
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

                    {/* Gols */}
                    <div className="col-lg-6">
                      <h6 className="fw-bold mb-3">Gols da partida</h6>

                      <form onSubmit={handleAddGoal} className="border rounded-3 p-3 mb-3">
                        <div className="row g-2">
                          <div className="col-12">
                            <div className="form-check form-check-inline">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="oppGoal"
                                checked={goalForm.isOpponentGoal}
                                onChange={(e) =>
                                  setGoalForm({
                                    ...goalForm,
                                    isOpponentGoal: e.target.checked,
                                    isOwnGoal: false,
                                    athleteId: e.target.checked ? '' : goalForm.athleteId,
                                  })
                                }
                              />
                              <label className="form-check-label" htmlFor="oppGoal">
                                Gol do adversário
                              </label>
                            </div>
                            {!goalForm.isOpponentGoal && (
                              <div className="form-check form-check-inline">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="ownGoal"
                                  checked={goalForm.isOwnGoal}
                                  onChange={(e) => setGoalForm({ ...goalForm, isOwnGoal: e.target.checked })}
                                />
                                <label className="form-check-label" htmlFor="ownGoal">
                                  Gol contra
                                </label>
                              </div>
                            )}
                          </div>

                          {!goalForm.isOpponentGoal && (
                            <div className="col-md-7">
                              <label className="form-label small">Atleta</label>
                              <select
                                className="form-select form-select-sm"
                                value={goalForm.athleteId}
                                onChange={(e) => setGoalForm({ ...goalForm, athleteId: e.target.value })}
                                required={!goalForm.isOpponentGoal}
                              >
                                <option value="">Selecione...</option>
                                {(details?.players || []).map((p: any) => (
                                  <option key={p.id} value={p.athleteId}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className="col-md-5">
                            <label className="form-label small">Minuto</label>
                            <input
                              type="number"
                              min={0}
                              max={120}
                              className="form-control form-control-sm"
                              value={goalForm.minute}
                              onChange={(e) => setGoalForm({ ...goalForm, minute: e.target.value })}
                            />
                          </div>
                          <div className="col-12">
                            <input
                              className="form-control form-control-sm"
                              placeholder="Descrição (opcional)"
                              value={goalForm.description}
                              onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                            />
                          </div>
                          <div className="col-12">
                            <button type="submit" className="btn btn-sm btn-success" disabled={saving}>
                              Registrar gol
                            </button>
                          </div>
                        </div>
                      </form>

                      {(details?.goals || []).length === 0 ? (
                        <div className="text-muted small border rounded-3 p-3">Nenhum gol registrado.</div>
                      ) : (
                        <ul className="list-group">
                          {details.goals.map((g: any) => (
                            <li key={g.id} className="list-group-item d-flex justify-content-between align-items-start">
                              <div>
                                <div className="fw-semibold">
                                  {g.isOpponentGoal
                                    ? 'Gol do adversário'
                                    : g.isOwnGoal
                                      ? `Gol contra · ${g.athleteName || '—'}`
                                      : g.athleteName || 'Atleta'}
                                  {g.minute != null ? ` · ${g.minute}'` : ''}
                                </div>
                                {g.description && <small className="text-muted">{g.description}</small>}
                              </div>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleRemoveGoal(g.id)}
                              >
                                Remover
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
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

export default MatchSquadModal;
