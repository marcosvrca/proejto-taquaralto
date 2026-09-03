import React, { useState, useEffect } from 'react';
import api from '../services/api';

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
  const [activeTab, setActiveTab] = useState<'diary' | 'reports'>('diary');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingRecord) {
        await api.put(`/api/sleep/${editingRecord.id}`, { date, bedTime, wakeTime });
        setMessage('✅ Ciclo de sono atualizado!');
      } else {
        await api.post('/api/sleep/bed', { date, bedTime, wakeTime });
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
      await api.delete(`/api/sleep/${id}`);
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
      const res = await api.get(`/api/sleep/reports?period=${period}`);
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
    <div className="page-shell">
      <header className="page-header">
        <div className="page-header__copy">
          <p className="page-eyebrow">Performance</p>
          <h1 className="page-title">Sono & Recuperação</h1>
          <p className="page-subtitle">Acompanhe seu descanso para otimizar sua performance.</p>
        </div>
        <div className="page-period" role="group" aria-label="Período">
          {[
            { id: 'week', label: 'Semana' },
            { id: 'month', label: 'Mês' },
            { id: 'year', label: 'Ano' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`page-period__btn ${period === p.id ? 'is-active' : ''}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {message && (
        <div className={`alert alert-dismissible fade show rounded-4 shadow-sm border-0 mb-0 ${message.includes('✅') ? 'alert-success' : 'alert-danger'}`}>
          <div className="d-flex align-items-center">
            <i className={`bi ${message.includes('✅') ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
            {message}
          </div>
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      <div className="row g-3">
        <div className="col-md-3 col-6">
          <div className="page-stat">
            <div className="page-stat__icon" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--accent)' }}>
              <i className="bi bi-moon-stars-fill" />
            </div>
            <div className="page-stat__body">
              <div className="page-stat__label">Média diária</div>
              <div className="page-stat__value" style={{ fontSize: '1.25rem' }}>{formatDuration(Math.round(dailyAverage))}</div>
              <div className="page-stat__meta">no período</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="page-stat">
            <div className="page-stat__icon" style={{ background: 'rgba(93,173,226,0.15)', color: '#5dade2' }}>
              <i className="bi bi-clock-history" />
            </div>
            <div className="page-stat__body">
              <div className="page-stat__label">Total semanal</div>
              <div className="page-stat__value" style={{ fontSize: '1.25rem' }}>{formatDuration(Math.round(weeklyAverage))}</div>
              <div className="page-stat__meta">horas dormidas</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="page-stat">
            <div className="page-stat__icon" style={{ background: 'rgba(46,204,113,0.15)', color: 'var(--success)' }}>
              <i className="bi bi-emoji-smile" />
            </div>
            <div className="page-stat__body">
              <div className="page-stat__label">Melhor noite</div>
              <div className="page-stat__value" style={{ fontSize: '1.25rem' }}>{bestDay ? formatDuration(bestDay.durationMinutes) : '—'}</div>
              <div className="page-stat__meta">{bestDay?.date || 'Sem dados'}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="page-stat">
            <div className="page-stat__icon" style={{ background: 'rgba(231,76,60,0.15)', color: 'var(--danger)' }}>
              <i className="bi bi-exclamation-triangle" />
            </div>
            <div className="page-stat__body">
              <div className="page-stat__label">Menor descanso</div>
              <div className="page-stat__value" style={{ fontSize: '1.25rem' }}>{worstDay ? formatDuration(worstDay.durationMinutes) : '—'}</div>
              <div className="page-stat__meta">{worstDay?.date || 'Sem dados'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className={`page-tab ${activeTab === 'diary' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('diary')}
        >
          <i className="bi bi-calendar-check" />
          <span>Diário de Sono</span>
        </button>
        <button
          type="button"
          role="tab"
          className={`page-tab ${activeTab === 'reports' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <i className="bi bi-graph-up" />
          <span>Relatórios</span>
        </button>
      </div>

      {activeTab === 'diary' && (
      <div className="row g-5">
        <div className="col-lg-4">
          <div className="dash-card sticky-top" style={{top: '100px'}}>
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
      )}

      {activeTab === 'reports' && (
      <div>
        <h2 className="h5 fw-bold text-dark mb-4">
          <i className="bi bi-graph-up text-primary me-2"></i>Relatorio Detalhado
        </h2>

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="card p-4 border-0 shadow-sm h-100">
              <p className="text-muted small mb-2"><i className="bi bi-moon-stars me-2"></i>Melhor Noite</p>
              <h3 className="fw-black text-dark mb-0">{bestDay ? formatDuration(bestDay.durationMinutes) : '--'}</h3>
              <small className="text-muted mt-2">{bestDay?.date || 'Nenhum registro'}</small>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card p-4 border-0 shadow-sm h-100">
              <p className="text-muted small mb-2"><i className="bi bi-bar-chart me-2"></i>Media de Sono</p>
              <h3 className="fw-black text-dark mb-0">{formatDuration(Math.round(dailyAverage))}</h3>
              <small className="text-muted mt-2">Horas de sono por noite</small>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="card p-4 border-0 shadow-sm h-100 border-start border-success border-4">
              <p className="text-muted small mb-2 fw-bold">🏆 Melhor Dia</p>
              <p className="text-dark fw-bold mb-1">{bestDay ? new Date(bestDay.date).toLocaleDateString('pt-BR') : 'N/A'}</p>
              <small className="text-muted d-block mb-2">
                <i className="bi bi-moon-stars me-1"></i>{bestDay ? formatDuration(bestDay.durationMinutes) : '--'}
              </small>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card p-4 border-0 shadow-sm h-100 border-start border-danger border-4">
              <p className="text-muted small mb-2 fw-bold">⚠️ Pior Dia</p>
              <p className="text-dark fw-bold mb-1">{worstDay ? new Date(worstDay.date).toLocaleDateString('pt-BR') : 'N/A'}</p>
              <small className="text-muted d-block mb-2">
                <i className="bi bi-moon-stars me-1"></i>{worstDay ? formatDuration(worstDay.durationMinutes) : '--'}
              </small>
            </div>
          </div>
        </div>

        <div className="card p-4 border-0 shadow-sm">
          <p className="text-secondary mb-0">
            <i className="bi bi-info-circle me-2"></i>
            Total de {records.length} noites registradas. Qualidade de sono otima quando voce dorme entre 7 e 9 horas.
          </p>
        </div>
      </div>
      )}
    </div>
  );
};

export default Sleep;