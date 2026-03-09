import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

interface SleepRecord {
  id: number;
  date: string;
  bedTime: string;
  wakeTime: string;
  durationMinutes: number;
}

const Sleep: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [bedTime, setBedTime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [period, setPeriod] = useState('week');
  const [records, setRecords] = useState<SleepRecord[]>([]);
  const [bestDay, setBestDay] = useState<SleepRecord | null>(null);
  const [worstDay, setWorstDay] = useState<SleepRecord | null>(null);
  const [weeklyAverage, setWeeklyAverage] = useState(0);
  const [dailyAverage, setDailyAverage] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SleepRecord | null>(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingRecord) {
        await axios.put(`${API_BASE_URL}/api/sleep/${editingRecord.id}`, { date, bedTime, wakeTime }, { headers });
        setMessage('✅ Ciclo de sono atualizado!');
      } else {
        await axios.post(`${API_BASE_URL}/api/sleep/bed`, { date, bedTime, wakeTime }, { headers });
        setMessage('✅ Ciclo de sono registrado!');
      }
      fetchRecords();
      resetForm();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage('❌ ' + (error.response?.data?.message || 'Erro ao processar requisição'));
    }
    setLoading(false);
  };

  const handleEdit = (record: SleepRecord) => {
    setEditingRecord(record);
    setDate(record.date);
    setBedTime(record.bedTime);
    setWakeTime(record.wakeTime);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deletar este registro?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/sleep/${id}`, { headers });
      setMessage('✅ Registro removido');
      fetchRecords();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage('❌ Erro ao deletar');
    }
  };

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setBedTime('22:00');
    setWakeTime('07:00');
    setEditingRecord(null);
  };

  const fetchRecords = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/sleep/reports?period=${period}`, { headers });
      setRecords(res.data.records);
      setBestDay(res.data.bestDay);
      setWorstDay(res.data.worstDay);
      setWeeklyAverage(res.data.weeklyAverage);
      setDailyAverage(res.data.dailyAverage);
    } catch (error: any) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [period]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="container py-5 mt-5">
      <div className="row align-items-center mb-5">
        <div className="col-lg-6">
          <h1 className="fw-black text-dark mb-1">
            <i className="bi bi-moon-stars text-primary me-2"></i>
            Sono & Recuperação
          </h1>
          <p className="text-secondary lead fs-6">Acompanhe seu descanso para otimizar sua performance.</p>
        </div>
        <div className="col-lg-6 d-flex justify-content-lg-end">
          <div className="btn-group bg-white p-1 rounded-3 shadow-sm" role="group">
             {['week', 'month', 'year'].map((p) => (
                <button
                   key={p}
                   onClick={() => setPeriod(p)}
                   className={`btn btn-sm px-3 rounded-2 fw-bold border-0 ${period === p ? 'btn-primary shadow-sm' : 'btn-light text-secondary'}`}
                >
                   {p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Ano'}
                </button>
             ))}
          </div>
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
         <div className="col-md-3">
            <div className="card p-4 border-0 h-100">
               <p className="text-uppercase small fw-bold text-secondary mb-1">Média Diária</p>
               <h3 className="fw-black text-primary mb-0">{formatDuration(Math.round(dailyAverage))}</h3>
               <div className="small text-muted mt-2">No período selecionado</div>
            </div>
         </div>
         <div className="col-md-3">
            <div className="card p-4 border-0 h-100">
               <p className="text-uppercase small fw-bold text-secondary mb-1">Total Semanal</p>
               <h3 className="fw-black text-dark mb-0">{formatDuration(Math.round(weeklyAverage))}</h3>
               <div className="small text-muted mt-2">Total de horas dormidas</div>
            </div>
         </div>
         <div className="col-md-3">
            <div className="card p-4 border-0 h-100">
               <p className="text-uppercase small fw-bold text-secondary mb-1">Melhor Noite</p>
               <h3 className="fw-black text-success mb-0">{bestDay ? formatDuration(bestDay.durationMinutes) : '--'}</h3>
               <div className="small text-muted mt-2">{bestDay?.date || 'Nenhum registro'}</div>
            </div>
         </div>
         <div className="col-md-3">
            <div className="card p-4 border-0 h-100">
               <p className="text-uppercase small fw-bold text-secondary mb-1">Menor Descanso</p>
               <h3 className="fw-black text-danger mb-0">{worstDay ? formatDuration(worstDay.durationMinutes) : '--'}</h3>
               <div className="small text-muted mt-2">{worstDay?.date || 'Nenhum registro'}</div>
            </div>
         </div>
      </div>

      <div className="row g-5">
        <div className="col-lg-4">
          <div className="card p-4 border-0 shadow-sm sticky-top" style={{top: '100px'}}>
            <h2 className="h5 fw-bold text-dark mb-4 d-flex align-items-center">
               <i className={`bi ${editingRecord ? 'bi-pencil-square' : 'bi-plus-circle-fill'} text-primary me-2`}></i>
               {editingRecord ? 'Editar Registro' : 'Novo Registro'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">Data do Descanso</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="form-control bg-light border-0 py-2 rounded-3" />
              </div>
              <div className="row g-3 mb-4">
                <div className="col-6">
                  <label className="form-label small fw-bold text-secondary">Dormiu às</label>
                  <input type="time" value={bedTime} onChange={(e) => setBedTime(e.target.value)} required className="form-control bg-light border-0 py-2 rounded-3" />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold text-secondary">Acordou às</label>
                  <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} required className="form-control bg-light border-0 py-2 rounded-3" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary w-100 py-2 fw-bold shadow-sm mb-2">
                {loading ? <span className="spinner-border spinner-border-sm"></span> : (editingRecord ? 'Atualizar Dados' : 'Salvar Registro')}
              </button>
              {editingRecord && (
                <button type="button" onClick={resetForm} className="btn btn-link w-100 text-secondary text-decoration-none small fw-bold">Cancelar</button>
              )}
            </form>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="d-flex align-items-center justify-content-between mb-4">
             <h2 className="h5 fw-bold text-dark mb-0">Histórico Recente</h2>
             <span className="badge bg-light text-dark px-3 py-2 rounded-3">{records.length} registros</span>
          </div>

          <div className="list-group list-group-flush bg-transparent">
            {records.length > 0 ? (
              records.map(record => (
                <div key={record.id} className="card border-0 p-3 mb-3 d-flex flex-row align-items-center justify-content-between overflow-hidden shadow-sm">
                   <div className="d-flex align-items-center">
                      <div className="bg-primary-subtle text-primary rounded-3 text-center p-2 me-4" style={{minWidth: '60px'}}>
                         <div className="text-uppercase small fw-black" style={{fontSize: '10px'}}>
                            {new Date(record.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                         </div>
                         <div className="h4 fw-black mb-0">{new Date(record.date).getDate() + 1}</div>
                      </div>
                      <div>
                         <div className="fw-bold text-dark d-flex align-items-center mb-1">
                            {record.bedTime} <i className="bi bi-arrow-right mx-2 text-muted small"></i> {record.wakeTime}
                            <span className="badge bg-success-subtle text-success ms-3 fw-bold" style={{fontSize: '10px'}}>COMPLETO</span>
                         </div>
                         <p className="text-secondary small mb-0"><i className="bi bi-clock me-1"></i> Ciclo registrado</p>
                      </div>
                   </div>
                   <div className="d-flex align-items-center gap-4">
                      <div className="text-end d-none d-sm-block">
                         <div className="h5 fw-black text-dark mb-0">{formatDuration(record.durationMinutes)}</div>
                         <div className="small fw-bold text-muted text-uppercase" style={{fontSize: '10px'}}>Duração</div>
                      </div>
                      <div className="d-flex gap-2">
                         <button onClick={() => handleEdit(record)} className="btn btn-light btn-sm rounded-circle p-2 border-0 shadow-sm"><i className="bi bi-pencil-fill text-primary"></i></button>
                         <button onClick={() => handleDelete(record.id)} className="btn btn-light btn-sm rounded-circle p-2 border-0 shadow-sm"><i className="bi bi-trash-fill text-danger"></i></button>
                      </div>
                   </div>
                </div>
              ))
            ) : (
              <div className="card p-5 border-0 text-center shadow-sm">
                 <i className="bi bi-cloud-slash fs-1 text-muted mb-3"></i>
                 <p className="text-secondary mb-0">Nenhum registro encontrado para este período.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sleep;