import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

interface PainRecord {
  id: number;
  date: string;
  location: string;
  intensity: number;
  description: string;
}

const Pains: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('Costas');
  const [intensity, setIntensity] = useState(5);
  const [description, setDescription] = useState('');
  const [records, setRecords] = useState<PainRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingRecord, setEditingRecord] = useState<PainRecord | null>(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const bodyParts = ['Cabeça', 'Pescoço', 'Ombros', 'Costas', 'Peito', 'Braços', 'Mãos', 'Abdômen', 'Quadril', 'Pernas', 'Joelhos', 'Pés'];

  const fetchRecords = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/pains`, { headers });
      setRecords(res.data);
    } catch (error) {
      console.error('Erro ao buscar registros de dor');
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingRecord) {
        await axios.put(`${API_BASE_URL}/api/pains/${editingRecord.id}`, {
          date, location, intensity, description
        }, { headers });
        setMessage('✅ Registro atualizado!');
      } else {
        await axios.post(`${API_BASE_URL}/api/pains`, {
          date, location, intensity, description
        }, { headers });
        setMessage('✅ Registro de dor salvo!');
      }
      fetchRecords();
      resetForm();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage('❌ ' + (error.response?.data?.message || 'Erro ao processar'));
    }
    setLoading(false);
  };

  const handleEdit = (record: PainRecord) => {
    setEditingRecord(record);
    setDate(record.date);
    setLocation(record.location);
    setIntensity(record.intensity);
    setDescription(record.description);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover este registro?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/pains/${id}`, { headers });
      setMessage('✅ Registro removido');
      fetchRecords();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Erro ao deletar');
    }
  };

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setLocation('Costas');
    setIntensity(5);
    setDescription('');
    setEditingRecord(null);
  };

  return (
    <div className="container py-5 mt-5">
      <div className="row align-items-center mb-5">
        <div className="col-12">
          <h1 className="fw-black text-dark mb-1">
            <i className="bi bi-heart-pulse text-warning me-2"></i>
            Saúde & Dores
          </h1>
          <p className="text-secondary lead fs-6">Acompanhe sinais corporais e desconfortos para prevenir lesões.</p>
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
               <i className={`bi ${editingRecord ? 'bi-pencil-square' : 'bi-plus-circle-fill'} text-warning me-2`}></i>
               {editingRecord ? 'Editar Registro' : 'Indicar Dor'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">Data</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="form-control bg-light border-0 py-2 rounded-3" />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">Local da Dor</label>
                <select value={location} onChange={(e) => setLocation(e.target.value)} className="form-select bg-light border-0 py-2 rounded-3">
                  {bodyParts.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary d-flex justify-content-between">
                   Intensidade <span>{intensity}/10</span>
                </label>
                <input type="range" min="1" max="10" value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="form-range" />
                <div className="d-flex justify-content-between small text-muted">
                   <span>Leve</span>
                   <span>Insuportável</span>
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label small fw-bold text-secondary">Detalhes (opcional)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="form-control bg-light border-0 py-2 rounded-3" rows={3} placeholder="Descreva como se sente..."></textarea>
              </div>
              <button type="submit" disabled={loading} className="btn btn-warning w-100 py-2 fw-bold shadow-sm mb-2 text-dark">
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
             <h2 className="h5 fw-bold text-dark mb-0">Histórico de Sinais</h2>
             <span className="badge bg-white text-dark shadow-sm px-3 py-2 rounded-3">{records.length} registros</span>
          </div>

          <div className="list-group list-group-flush bg-transparent">
            {records.length > 0 ? (
              records.map(record => (
                <div key={record.id} className="card border-0 p-3 mb-3 shadow-sm">
                   <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                         <div className="bg-warning-subtle text-warning rounded-3 text-center p-2 me-4" style={{minWidth: '60px'}}>
                            <div className="text-uppercase small fw-black" style={{fontSize: '10px'}}>
                               {new Date(record.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                            </div>
                            <div className="h4 fw-black mb-0">{new Date(record.date).getDate() + 1}</div>
                         </div>
                         <div>
                            <div className="fw-bold text-dark mb-1">
                               Dor no(a) {record.location}
                               <span className="badge bg-light text-warning ms-2 border border-warning-subtle fw-bold" style={{fontSize: '10px'}}>Nível {record.intensity}</span>
                            </div>
                            <p className="text-secondary small mb-0 pe-4">
                               {record.description || 'Sem detalhes adicionais.'}
                            </p>
                         </div>
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
                 <i className="bi bi-emoji-smile fs-1 text-muted mb-3"></i>
                 <p className="text-secondary mb-0">Nenhum registro de dor. Você está ótimo!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pains;