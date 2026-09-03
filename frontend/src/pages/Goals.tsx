import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Goal {
  id: number;
  title: string;
  description: string;
  targetDate: string;
  isCompleted: boolean;
}

const Goals: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [activeTab, setActiveTab] = useState<'diary' | 'reports'>('diary');
  const [initialLoading, setInitialLoading] = useState(true);

  const fetchGoals = async () => {
    try {
      const res = await api.get('/api/goals');
      // Ordena metas: não concluídas primeiro, concluídas no final
      const sortedGoals = res.data.sort((a: Goal, b: Goal) => {
        if (a.isCompleted === b.isCompleted) return 0;
        return a.isCompleted ? 1 : -1;
      });
      setGoals(sortedGoals);
    } catch (error) {
      console.error('Erro ao buscar metas');
    }
  };

  useEffect(() => {
    fetchGoals();
    
    // Spinner dinâmico - gira por 3 segundos ao entrar no módulo
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingGoal) {
        await api.put(`/api/goals/${editingGoal.id}`, {
          title, description, targetDate
        });
        setMessage('✅ Meta atualizada!');
      } else {
        await api.post('/api/goals', {
          title, description, targetDate
        });
        setMessage('✅ Nova meta definida!');
      }
      fetchGoals();
      resetForm();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage('❌ ' + (error.response?.data?.message || 'Erro ao processar'));
    }
    setLoading(false);
  };

  const handleToggleComplete = async (goal: Goal) => {
    try {
      await api.put(`/api/goals/${goal.id}`, {
        ...goal,
        isCompleted: !goal.isCompleted
      });
      fetchGoals();
    } catch (error) {
      console.error('Erro ao atualizar status da meta');
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description);
    setTargetDate(goal.targetDate);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta meta?')) return;
    try {
      await api.delete(`/api/goals/${id}`);
      setMessage('✅ Meta removida');
      fetchGoals();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Erro ao deletar');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTargetDate(new Date().toISOString().split('T')[0]);
    setEditingGoal(null);
  };

  const completedCount = goals.filter(g => g.isCompleted).length;
  const progressPercent = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-header__copy">
          <p className="page-eyebrow">Performance</p>
          <h1 className="page-title">Metas & Objetivos</h1>
          <p className="page-subtitle">Defina onde quer chegar e acompanhe sua evolução para bater seus recordes.</p>
        </div>
        <div className="page-stat" style={{ minWidth: 200, minHeight: 72 }}>
          <div className="page-stat__icon" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--accent)' }}>
            <i className="bi bi-bullseye" />
          </div>
          <div className="page-stat__body">
            <div className="page-stat__label">Progresso geral</div>
            <div className="page-stat__value" style={{ fontSize: '1.35rem' }}>
              {initialLoading ? '…' : `${progressPercent}%`}
            </div>
            <div className="page-stat__meta">
              {completedCount}/{goals.length} concluídas
            </div>
          </div>
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

      <div className="page-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className={`page-tab ${activeTab === 'diary' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('diary')}
        >
          <i className="bi bi-calendar-check" />
          <span>Minhas Metas</span>
        </button>
        <button
          type="button"
          role="tab"
          className={`page-tab ${activeTab === 'reports' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <i className="bi bi-bar-chart" />
          <span>Relatórios</span>
        </button>
      </div>

      <div className="row g-5">
        <div className="col-lg-4">
          <div className="dash-card sticky-top" style={{top: '100px'}}>
            <h2 className="h5 fw-bold text-dark mb-4">
               <i className={`bi ${editingGoal ? 'bi-pencil-square' : 'bi-plus-circle-fill'} text-info me-2`}></i>
               {editingGoal ? 'Editar Meta' : 'Nova Meta'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">Título da Meta</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex: Correr 5km em 25min" className="form-control bg-light border-0 py-2 rounded-3" />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">Data Limite (Target)</label>
                <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required className="form-control bg-light border-0 py-2 rounded-3" />
              </div>
              <div className="mb-4">
                <label className="form-label small fw-bold text-secondary">Como você vai chegar lá?</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="form-control bg-light border-0 py-2 rounded-3" rows={3} placeholder="Descreva seu plano de ação..."></textarea>
              </div>
              <button type="submit" disabled={loading} className="btn btn-info w-100 py-2 fw-bold shadow-sm mb-2 text-white">
                {loading ? <span className="spinner-border spinner-border-sm"></span> : (editingGoal ? 'Atualizar Meta' : 'Definir Meta')}
              </button>
              {editingGoal && (
                <button type="button" onClick={resetForm} className="btn btn-link w-100 text-secondary text-decoration-none small fw-bold">Cancelar</button>
              )}
            </form>
          </div>
        </div>

        <div className="col-lg-8">
          {activeTab === 'diary' && (
          <>
          <div className="d-flex align-items-center justify-content-between mb-4">
             <h2 className="h5 fw-bold text-dark mb-0">Suas Conquistas</h2>
             <span className="badge bg-info text-white shadow-sm px-3 py-2 rounded-3">{completedCount}/{goals.length} concluidas</span>
          </div>

          <div className="row g-4">
            {goals.length > 0 ? (
              goals.map(goal => (
                <div key={goal.id} className="col-12">
                   <div className={`card border-0 p-4 shadow-sm ${goal.isCompleted ? 'bg-info-subtle' : 'bg-white'}`}>
                      <div className="d-flex align-items-start justify-content-between">
                         <div className="d-flex align-items-start">
                            <div className="form-check me-3 mt-1">
                               <input 
                                  className="form-check-input border-info" 
                                  type="checkbox" 
                                  checked={goal.isCompleted} 
                                  onChange={() => handleToggleComplete(goal)}
                                  style={{width: '24px', height: '24px', cursor: 'pointer'}}
                               />
                            </div>
                            <div>
                               <h3 className={`h5 fw-bold mb-1 ${goal.isCompleted ? 'text-decoration-line-through text-secondary' : 'text-dark'}`}>
                                  {goal.title}
                               </h3>
                               <p className="text-secondary small mb-2"><i className="bi bi-calendar-event me-1"></i> Prazo: {goal.targetDate}</p>
                               <p className="text-secondary mb-0 small">{goal.description}</p>
                            </div>
                         </div>
                         <div className="d-flex gap-2">
                            <button onClick={() => handleEdit(goal)} className="btn btn-light btn-sm rounded-circle p-2 border-0 shadow-sm"><i className="bi bi-pencil-fill text-primary"></i></button>
                            <button onClick={() => handleDelete(goal.id)} className="btn btn-light btn-sm rounded-circle p-2 border-0 shadow-sm"><i className="bi bi-trash-fill text-danger"></i></button>
                         </div>
                      </div>
                   </div>
                </div>
              ))
            ) : (
              <div className="col-12 text-center p-5">
                 <i className="bi bi-flag fs-1 text-muted mb-3 d-block"></i>
                 <p className="text-secondary mb-0">Nenhuma meta definida. Qual é o seu próximo desafio?</p>
              </div>
            )}
          </div>
          </>
          )}

          {activeTab === 'reports' && (
          <div>
            <h2 className="h5 fw-bold text-dark mb-4">Relatorios de Metas</h2>
            
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="card border-0 p-4 shadow-sm bg-light">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-secondary small mb-1">Total de Metas</p>
                      <h3 className="fw-bold text-dark mb-0">{goals.length}</h3>
                    </div>
                    <i className="bi bi-flag fs-3 text-info"></i>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 p-4 shadow-sm bg-light">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-secondary small mb-1">Metas Concluidas</p>
                      <h3 className="fw-bold text-dark mb-0">{completedCount}</h3>
                    </div>
                    <i className="bi bi-check-circle-fill fs-3 text-success"></i>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 p-4 shadow-sm bg-light">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-secondary small mb-1">Taxa de Conclusao</p>
                      <h3 className="fw-bold text-dark mb-0">{progressPercent}%</h3>
                    </div>
                    <i className="bi bi-percent fs-3 text-warning"></i>
                  </div>
                </div>
              </div>
            </div>

            <h4 className="h6 fw-bold text-dark mb-3">Metas em Aberto</h4>
            <div className="card border-0 p-4 shadow-sm mb-4">
              {goals.filter(g => !g.isCompleted).length > 0 ? (
                <div className="list-group list-group-flush bg-transparent">
                  {goals.filter(g => !g.isCompleted).map(goal => (
                    <div key={goal.id} className="d-flex align-items-start justify-content-between py-3 border-bottom">
                      <div>
                        <p className="text-dark fw-bold mb-1">{goal.title}</p>
                        <small className="text-secondary">Prazo: {goal.targetDate} | {goal.description}</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-secondary text-center mb-0">Nenhuma meta em aberto. Parabens!</p>
              )}
            </div>

            <h4 className="h6 fw-bold text-dark mb-3">Metas Concluidas</h4>
            <div className="card border-0 p-4 shadow-sm bg-success-subtle border-2 border-success">
              {goals.filter(g => g.isCompleted).length > 0 ? (
                <div className="list-group list-group-flush bg-transparent">
                  {goals.filter(g => g.isCompleted).map(goal => (
                    <div key={goal.id} className="d-flex align-items-start justify-content-between py-3 border-bottom">
                      <div>
                        <p className="text-dark fw-bold mb-1 text-decoration-line-through">{goal.title}</p>
                        <small className="text-secondary">Concluida em: {goal.targetDate}</small>
                      </div>
                      <i className="bi bi-check-circle-fill fs-5 text-success"></i>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-secondary text-center mb-0">Nenhuma meta concluida ainda. Vamos la!</p>
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Goals;