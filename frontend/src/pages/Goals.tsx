import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

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

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchGoals = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/goals`, { headers });
      setGoals(res.data);
    } catch (error) {
      console.error('Erro ao buscar metas');
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingGoal) {
        await axios.put(`${API_BASE_URL}/api/goals/${editingGoal.id}`, {
          title, description, targetDate
        }, { headers });
        setMessage('✅ Meta atualizada!');
      } else {
        await axios.post(`${API_BASE_URL}/api/goals`, {
          title, description, targetDate
        }, { headers });
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
      await axios.put(`${API_BASE_URL}/api/goals/${goal.id}`, {
        ...goal,
        isCompleted: !goal.isCompleted
      }, { headers });
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
      await axios.delete(`${API_BASE_URL}/api/goals/${id}`, { headers });
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
    <div className="container py-5 mt-5">
      <div className="row align-items-center mb-5">
        <div className="col-lg-8">
          <h1 className="fw-black text-dark mb-1">
            <i className="bi bi-trophy text-info me-2"></i>
            Metas & Objetivos
          </h1>
          <p className="text-secondary lead fs-6">Defina onde quer chegar e acompanhe sua evolução para bater seus recordes.</p>
        </div>
        <div className="col-lg-4 text-lg-end">
           <div className="bg-white p-3 rounded-4 shadow-sm d-inline-block border-0">
              <div className="d-flex align-items-center gap-3">
                 <div className="text-start">
                    <p className="text-uppercase small fw-bold text-secondary mb-0">Progresso Geral</p>
                    <p className="h4 fw-black mb-0 text-info">{progressPercent}%</p>
                 </div>
                 <div className="spinner-border text-info" role="status" style={{width: '40px', height: '40px'}}>
                    <span className="visually-hidden">Loading...</span>
                 </div>
              </div>
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

      <div className="row g-5">
        <div className="col-lg-4">
          <div className="card p-4 border-0 shadow-sm sticky-top" style={{top: '100px'}}>
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
          <div className="d-flex align-items-center justify-content-between mb-4">
             <h2 className="h5 fw-bold text-dark mb-0">Suas Conquistas</h2>
             <span className="badge bg-info text-white shadow-sm px-3 py-2 rounded-3">{completedCount}/{goals.length} concluídas</span>
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
        </div>
      </div>
    </div>
  );
};

export default Goals;