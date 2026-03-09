import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

interface Workout {
  id: number;
  date: string;
  time: string;
  type: string;
  intensity: string;
  notes: string;
  durationMinutes: number;
}

const Workouts: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [type, setType] = useState('musculacao');
  const [intensity, setIntensity] = useState('moderado');
  const [notes, setNotes] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [period, setPeriod] = useState('week');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [reports, setReports] = useState<any>(null);
  const [reportsPeriod, setReportsPeriod] = useState('week');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const workoutTypes = [
    { value: 'futsal', label: 'Futsal', emoji: '⚽' },
    { value: 'futebol', label: 'Futebol', emoji: '⚽' },
    { value: 'terrao', label: 'Terrão', emoji: '🌾' },
    { value: 'society', label: 'Society', emoji: '⚽' },
    { value: 'volei', label: 'Vôlei', emoji: '🏐' },
    { value: 'futevolei', label: 'Futevôlei', emoji: '🏐' },
    { value: 'basquete', label: 'Basquete', emoji: '🏀' },
    { value: 'natacao', label: 'Natação', emoji: '🏊' },
    { value: 'lutas', label: 'Lutas', emoji: '🥊' },
    { value: 'musculacao', label: 'Musculação', emoji: '💪' },
    { value: 'corrida', label: 'Corrida', emoji: '🏃' },
    { value: 'mobilidade', label: 'Mobilidade', emoji: '🧘' },
    { value: 'treino_forca', label: 'Treino de Força', emoji: '🏋️' },
    { value: 'treino_agilidade', label: 'Treino de Agilidade', emoji: '⚡' },
  ];

  const intensityOptions = [
    { value: 'leve', label: 'Leve', emoji: '😌' },
    { value: 'moderado', label: 'Moderado', emoji: '👍' },
    { value: 'intenso', label: 'Intenso', emoji: '🔥' },
    { value: 'pesado', label: 'Pesado', emoji: '💪' },
    { value: 'exaustivo', label: 'Exaustivo', emoji: '😵' },
    { value: 'outros', label: 'Outros', emoji: '🤔' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/workouts`, {
        date,
        time,
        type,
        intensity,
        notes,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
      }, { headers });

      setMessage('✅ Treino registrado!');
      fetchWorkouts();
      resetForm();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage('❌ ' + (error.response?.data?.message || 'Erro'));
    }
    setLoading(false);
  };

  const handleEdit = (workout: Workout) => {
    setEditingWorkout(workout);
    setDate(workout.date);
    setTime(workout.time);
    setType(workout.type);
    setIntensity(workout.intensity);
    setNotes(workout.notes || '');
    setDurationMinutes(workout.durationMinutes?.toString() || '');
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkout) return;

    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/api/workouts/${editingWorkout.id}`, {
        date,
        time,
        type,
        intensity,
        notes,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
      }, { headers });

      setMessage('✅ Treino atualizado!');
      fetchWorkouts();
      setShowEditModal(false);
      resetForm();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage('❌ ' + (error.response?.data?.message || 'Erro'));
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este treino?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/workouts/${id}`, { headers });
      setMessage('✅ Treino deletado!');
      fetchWorkouts();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage('❌ ' + (error.response?.data?.message || 'Erro'));
    }
  };

  const fetchWorkouts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/workouts?period=${period}`, { headers });
      setWorkouts(res.data.workouts);
    } catch (error: any) {
      setMessage('❌ Erro ao carregar treinos');
    }
  };

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/workouts/reports?period=${reportsPeriod}`, { headers });
      setReports(res.data);
    } catch (error: any) {
      setMessage('❌ Erro ao carregar relatórios');
    }
  };

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setTime(new Date().toTimeString().slice(0, 5));
    setType('musculacao');
    setIntensity('moderado');
    setNotes('');
    setDurationMinutes('');
    setEditingWorkout(null);
  };

  const getIntensityLabel = (intensity: string) => {
    const option = intensityOptions.find(opt => opt.value === intensity);
    return option ? `${option.emoji} ${option.label}` : intensity;
  };

  const getTypeLabel = (type: string) => {
    const option = workoutTypes.find(opt => opt.value === type);
    return option ? `${option.emoji} ${option.label}` : type;
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  useEffect(() => {
    fetchWorkouts();
  }, [period]);

  useEffect(() => {
    if (showReportsModal) {
      fetchReports();
    }
  }, [showReportsModal, reportsPeriod]);

  return (
    <div className="container-fluid py-4">
      <h1 className="mb-4">💪 Registro de Treinos</h1>

      {message && (
        <div className="alert alert-info alert-dismissible fade show" role="alert">
          {message}
          <button
            type="button"
            className="btn-close"
            onClick={() => setMessage('')}
          ></button>
        </div>
      )}

      <div className="row">
        {/* Coluna Esquerda - Registro de Treino */}
        <div className="col-lg-5 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">🏋️ Registrar Treino</h5>
            </div>
            <div className="card-body">
              <form onSubmit={showEditModal ? handleUpdate : handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Data</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="form-control"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Hora</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="form-control"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Tipo de Treino</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    required
                    className="form-control"
                  >
                    {workoutTypes.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.emoji} {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Intensidade do Treino</label>
                  <select
                    value={intensity}
                    onChange={(e) => setIntensity(e.target.value)}
                    required
                    className="form-control"
                  >
                    {intensityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.emoji} {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Duração (minutos)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    placeholder="Opcional"
                    className="form-control"
                    min="1"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Observações</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Opcional"
                    className="form-control"
                    rows={3}
                  />
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary flex-fill"
                  >
                    {loading ? 'Salvando...' : showEditModal ? 'Atualizar' : 'Registrar'}
                  </button>
                  {showEditModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        resetForm();
                      }}
                      className="btn btn-secondary"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Coluna Direita - Histórico de Treinos */}
        <div className="col-lg-7">
          <div className="card shadow-sm">
            <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">📋 Histórico de Treinos</h5>
              <div className="d-flex gap-2 align-items-center">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="form-select form-select-sm w-auto"
                >
                  <option value="week">Semanal</option>
                  <option value="month">Mensal</option>
                  <option value="year">Anual</option>
                </select>
                <button
                  onClick={() => setShowReportsModal(true)}
                  className="btn btn-sm btn-outline-light"
                >
                  📊 Relatórios
                </button>
              </div>
            </div>
            <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {workouts.length > 0 ? (
                <div className="list-group">
                  {workouts.map(workout => (
                    <div key={workout.id} className="list-group-item">
                      <div className="d-flex w-100 justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-1 fw-bold">{workout.date} às {workout.time}</h6>
                            <div className="d-flex gap-1">
                              <button
                                onClick={() => handleEdit(workout)}
                                className="btn btn-sm btn-outline-primary"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(workout.id)}
                                className="btn btn-sm btn-outline-danger"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          <p className="mb-1">
                            <span className="fw-semibold">Tipo:</span> {getTypeLabel(workout.type)}
                          </p>
                          <p className="mb-1">
                            <span className="fw-semibold">Intensidade:</span> {getIntensityLabel(workout.intensity)}
                          </p>
                          {workout.durationMinutes && (
                            <p className="mb-1">
                              <span className="fw-semibold">Duração:</span> {formatDuration(workout.durationMinutes)}
                            </p>
                          )}
                          {workout.notes && (
                            <p className="mb-1 small text-muted">
                              <span className="fw-semibold">Obs:</span> {workout.notes}
                            </p>
                          )}
                          <small className="text-muted">ID: #{workout.id}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">(Nenhum treino registrado ainda)</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Relatórios */}
      {showReportsModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">📊 Relatórios de Treinos</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowReportsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Período</label>
                  <select
                    value={reportsPeriod}
                    onChange={(e) => setReportsPeriod(e.target.value)}
                    className="form-control"
                  >
                    <option value="week">Semanal</option>
                    <option value="month">Mensal</option>
                    <option value="year">Anual</option>
                  </select>
                </div>

                {reports && (
                  <div className="row">
                    <div className="col-md-6">
                      <div className="card mb-3">
                        <div className="card-body">
                          <h6 className="card-title">🏆 Tipo Mais Praticado</h6>
                          <p className="card-text fw-bold">{getTypeLabel(reports.mostPracticedType)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card mb-3">
                        <div className="card-body">
                          <h6 className="card-title">🕐 Período Mais Ativo</h6>
                          <p className="card-text fw-bold">
                            {reports.mostActivePeriod === 'manha' ? '🌅 Manhã' :
                             reports.mostActivePeriod === 'tarde' ? '☀️ Tarde' : '🌙 Noite'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card mb-3">
                        <div className="card-body">
                          <h6 className="card-title">⏱️ Total de Minutos</h6>
                          <p className="card-text fw-bold">{reports.totalMinutes} min</p>
                          <small className="text-muted">
                            ≈ {Math.round(reports.totalMinutes / 60 * 10) / 10} horas
                          </small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card mb-3">
                        <div className="card-body">
                          <h6 className="card-title">📈 Total de Treinos</h6>
                          <p className="card-text fw-bold">{reports.totalWorkouts}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card mb-3">
                        <div className="card-body">
                          <h6 className="card-title">💪 Distribuição por Intensidade</h6>
                          {Object.entries(reports.intensityDistribution).map(([intensity, count]: [string, any]) => (
                            <div key={intensity} className="d-flex justify-content-between">
                              <span>{getIntensityLabel(intensity)}</span>
                              <span className="badge bg-secondary">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card mb-3">
                        <div className="card-body">
                          <h6 className="card-title">⚽ Distribuição por Tipo</h6>
                          {Object.entries(reports.typeDistribution).map(([type, count]: [string, any]) => (
                            <div key={type} className="d-flex justify-content-between">
                              <span>{getTypeLabel(type)}</span>
                              <span className="badge bg-primary">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workouts;