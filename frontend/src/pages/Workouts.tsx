import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

interface Workout {
  id: number;
  date: string;
  time?: string;
  type: string;
  durationMinutes: number;
  intensity: 'Baixa' | 'Média' | 'Alta';
  notes?: string;
}

const Workouts: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().split(' ')[0]);
  const [type, setType] = useState('Musculação');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [intensity, setIntensity] = useState<'Baixa' | 'Média' | 'Alta'>('Média');
  const [notes, setNotes] = useState('');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const workoutTypes = [
    'Musculação', 'Futsal', 'Corrida', 'Caminhada', 
    'Natação', 'Ciclismo', 'Crossfit', 'Outro'
  ];

  const fetchWorkouts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/workouts`, { headers });
      setWorkouts(res.data.workouts || []);
    } catch (error) {
      console.error('Erro ao buscar treinos:', error);
      setWorkouts([]);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingWorkout) {
        await axios.put(`${API_BASE_URL}/api/workouts/${editingWorkout.id}`, {
          date, time, type, durationMinutes, intensity, notes
        }, { headers });
        setMessage('✅ Treino atualizado!');
      } else {
        await axios.post(`${API_BASE_URL}/api/workouts`, {
          date, time, type, durationMinutes, intensity, notes
        }, { headers });
        setMessage('✅ Treino registrado!');
      }
      fetchWorkouts();
      resetForm();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage('❌ ' + (error.response?.data?.message || 'Erro ao processar'));
    }
    setLoading(false);
  };

  const handleEdit = (workout: Workout) => {
    setEditingWorkout(workout);
    setDate(workout.date);
    setTime('12:00');
    setType(workout.type);
    setDurationMinutes(workout.durationMinutes);
    setIntensity(workout.intensity);
    setNotes('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja remover este treino?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/workouts/${id}`, { headers });
      setMessage('✅ Treino removido');
      fetchWorkouts();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Erro ao deletar');
    }
  };

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setTime(new Date().toTimeString().split(' ')[0]);
    setType('Musculação');
    setDurationMinutes(60);
    setIntensity('Média');
    setNotes('');
    setEditingWorkout(null);
  };

  // Stats calculation
  const totalMinutes = workouts.reduce((acc, w) => acc + w.durationMinutes, 0);
  const workoutCount = workouts.length;
  const highIntensityCount = workouts.filter(w => w.intensity === 'Alta').length;

  return (
    <div className="container py-5 mt-5">
      <div className="row align-items-center mb-5">
        <div className="col-12">
          <h1 className="fw-black text-dark mb-1">
            <i className="bi bi-fire text-danger me-2"></i>
            Treinos & Atividade
          </h1>
          <p className="text-secondary lead fs-6">Monitore sua performance e evolução física constante.</p>
        </div>
      </div>

      {message && (
        <div className={`alert alert-dismissible fade show rounded-4 shadow-sm border-0 mb-4 ${message.includes('✅') ? 'alert-success' : 'alert-danger'}`}>
          <div className="d-flex align-items-center">
            <i className={`bi ${message.includes('✅') ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
            {message}
          </div>
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="row g-4 mb-5">
         <div className="col-md-4">
            <div className="card p-4 border-0 h-100 border-start border-danger border-4">
               <p className="text-uppercase small fw-bold text-secondary mb-1">Total de Treinos</p>
               <h3 className="fw-black text-dark mb-0">{workoutCount} sessões</h3>
               <div className="small text-muted mt-2">Histórico acumulado</div>
            </div>
         </div>
         <div className="col-md-4">
            <div className="card p-4 border-0 h-100 border-start border-primary border-4">
               <p className="text-uppercase small fw-bold text-secondary mb-1">Tempo em Atividade</p>
               <h3 className="fw-black text-dark mb-0">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</h3>
               <div className="small text-muted mt-2">Dedicados à sua saúde</div>
            </div>
         </div>
         <div className="col-md-4">
            <div className="card p-4 border-0 h-100 border-start border-warning border-4">
               <p className="text-uppercase small fw-bold text-secondary mb-1">Alta Intensidade</p>
               <h3 className="fw-black text-dark mb-0">{highIntensityCount} treinos</h3>
               <div className="small text-muted mt-2">Esforço máximo registrado</div>
            </div>
         </div>
      </div>

      <div className="row g-5">
        <div className="col-lg-4">
          <div className="card p-4 border-0 shadow-sm sticky-top" style={{top: '100px'}}>
            <h2 className="h5 fw-bold text-dark mb-4">
               <i className={`bi ${editingWorkout ? 'bi-pencil-square' : 'bi-plus-circle-fill'} text-danger me-2`}></i>
               {editingWorkout ? 'Editar Treino' : 'Novo Registro'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">Data</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="form-control bg-light border-0 py-2 rounded-3" />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">Hora</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="form-control bg-light border-0 py-2 rounded-3" />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">Modalidade</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="form-select bg-light border-0 py-2 rounded-3">
                  {workoutTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-bold text-secondary">Duração (min)</label>
                  <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} required className="form-control bg-light border-0 py-2 rounded-3" />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold text-secondary">Intensidade</label>
                  <select value={intensity} onChange={(e) => setIntensity(e.target.value as any)} className="form-select bg-light border-0 py-2 rounded-3">
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label small fw-bold text-secondary">Observações (opcional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="form-control bg-light border-0 py-2 rounded-3" rows={2} placeholder="Ex: Treino de pernas, foco em..."></textarea>
              </div>
              <button type="submit" disabled={loading} className="btn btn-danger w-100 py-2 fw-bold shadow-sm mb-2">
                {loading ? <span className="spinner-border spinner-border-sm"></span> : (editingWorkout ? 'Atualizar Treino' : 'Registrar Treino')}
              </button>
              {editingWorkout && (
                <button type="button" onClick={resetForm} className="btn btn-link w-100 text-secondary text-decoration-none small fw-bold">Cancelar</button>
              )}
            </form>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="d-flex align-items-center justify-content-between mb-4">
             <h2 className="h5 fw-bold text-dark mb-0">Atividades Registradas</h2>
             <span className="badge bg-white text-dark shadow-sm px-3 py-2 rounded-3">{workouts.length} sessões</span>
          </div>

          <div className="list-group list-group-flush bg-transparent">
            {workouts.length > 0 ? (
              workouts.map(workout => (
                <div key={workout.id} className="card border-0 p-3 mb-3 d-flex flex-row align-items-center justify-content-between shadow-sm">
                   <div className="d-flex align-items-center">
                      <div className="bg-danger-subtle text-danger rounded-3 text-center p-2 me-4" style={{minWidth: '60px'}}>
                         <div className="text-uppercase small fw-black" style={{fontSize: '10px'}}>
                            {new Date(workout.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                         </div>
                         <div className="h4 fw-black mb-0">{new Date(workout.date).getDate() + 1}</div>
                      </div>
                      <div>
                         <div className="fw-bold text-dark d-flex align-items-center mb-1">
                            {workout.type}
                            <span className={`badge ms-3 fw-bold ${workout.intensity === 'Alta' ? 'bg-danger-subtle text-danger' : workout.intensity === 'Média' ? 'bg-warning-subtle text-warning' : 'bg-info-subtle text-info'}`} style={{fontSize: '10px'}}>
                               {workout.intensity.toUpperCase()}
                            </span>
                         </div>
                         <p className="text-secondary small mb-0">
                            <i className="bi bi-clock me-1"></i> {workout.durationMinutes} minutos
                            {workout.notes && <span className="ms-2 opacity-75 d-none d-sm-inline">• {workout.notes.substring(0, 30)}...</span>}
                         </p>
                      </div>
                   </div>
                   <div className="d-flex gap-2">
                      <button onClick={() => handleEdit(workout)} className="btn btn-light btn-sm rounded-circle p-2 border-0 shadow-sm"><i className="bi bi-pencil-fill text-primary"></i></button>
                      <button onClick={() => handleDelete(workout.id)} className="btn btn-light btn-sm rounded-circle p-2 border-0 shadow-sm"><i className="bi bi-trash-fill text-danger"></i></button>
                   </div>
                </div>
              ))
            ) : (
              <div className="card p-5 border-0 text-center shadow-sm">
                 <i className="bi bi-activity fs-1 text-muted mb-3"></i>
                 <p className="text-secondary mb-0">Nenhum treino registrado ainda.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workouts;