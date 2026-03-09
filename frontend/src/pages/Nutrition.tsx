import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

interface NutritionRecord {
  id: number;
  date: string;
  time: string;
  mealType: string;
  calories: number;
  consumedSoda: boolean;
  consumedAlcohol: boolean;
  notes: string;
}

const Nutrition: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [mealType, setMealType] = useState('cafe_manha');
  const [calories, setCalories] = useState('');
  const [consumedSoda, setConsumedSoda] = useState(false);
  const [consumedAlcohol, setConsumedAlcohol] = useState(false);
  const [notes, setNotes] = useState('');
  const [nutrition, setNutrition] = useState<NutritionRecord[]>([]);
  const [period, setPeriod] = useState('week');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<NutritionRecord | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [reports, setReports] = useState<any>(null);
  const [reportsPeriod, setReportsPeriod] = useState('week');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const mealTypes = [
    { value: 'cafe_manha', label: 'Café da Manhã', emoji: '🌅' },
    { value: 'almoco', label: 'Almoço', emoji: '🌞' },
    { value: 'lanche_tarde', label: 'Lanche da Tarde', emoji: '🕐' },
    { value: 'jantar', label: 'Jantar', emoji: '🌙' },
    { value: 'outro_horario', label: 'Outro Horário', emoji: '🍽️' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/nutrition`, {
        date,
        time,
        mealType,
        calories: calories ? parseInt(calories) : 0,
        consumedSoda,
        consumedAlcohol,
        notes,
      }, { headers });

      setMessage('✅ Alimentação registrada!');
      fetchNutrition();
      resetForm();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage('❌ ' + (error.response?.data?.message || 'Erro'));
    }
    setLoading(false);
  };

  const handleEdit = (record: NutritionRecord) => {
    setEditingRecord(record);
    setDate(record.date);
    setTime(record.time);
    setMealType(record.mealType);
    setCalories(record.calories.toString());
    setConsumedSoda(record.consumedSoda);
    setConsumedAlcohol(record.consumedAlcohol);
    setNotes(record.notes || '');
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/api/nutrition/${editingRecord.id}`, {
        date,
        time,
        mealType,
        calories: calories ? parseInt(calories) : 0,
        consumedSoda,
        consumedAlcohol,
        notes,
      }, { headers });

      setMessage('✅ Alimentação atualizada!');
      fetchNutrition();
      setShowEditModal(false);
      resetForm();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage('❌ ' + (error.response?.data?.message || 'Erro'));
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este registro de alimentação?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/nutrition/${id}`, { headers });
      setMessage('✅ Registro deletado!');
      fetchNutrition();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage('❌ ' + (error.response?.data?.message || 'Erro'));
    }
  };

  const fetchNutrition = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/nutrition?period=${period}`, { headers });
      setNutrition(res.data.nutrition);
    } catch (error: any) {
      setMessage('❌ Erro ao carregar alimentação');
    }
  };

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/nutrition/reports?period=${reportsPeriod}`, { headers });
      setReports(res.data);
    } catch (error: any) {
      setMessage('❌ Erro ao carregar relatórios');
    }
  };

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setTime(new Date().toTimeString().slice(0, 5));
    setMealType('cafe_manha');
    setCalories('');
    setConsumedSoda(false);
    setConsumedAlcohol(false);
    setNotes('');
    setEditingRecord(null);
  };

  const getMealTypeLabel = (type: string) => {
    const option = mealTypes.find(opt => opt.value === type);
    return option ? `${option.emoji} ${option.label}` : type;
  };

  useEffect(() => {
    fetchNutrition();
  }, [period]);

  useEffect(() => {
    if (showReportsModal) {
      fetchReports();
    }
  }, [showReportsModal, reportsPeriod]);

  return (
    <div className="container-fluid py-4">
      <h1 className="mb-4">🥗 Registro de Alimentação</h1>

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

      {/* Formulário de Registro */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Registrar Refeição</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Data</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="form-control"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Horário</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Tipo de Refeição</label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                    required
                    className="form-control"
                  >
                    {mealTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.emoji} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Calorias</label>
                  <input
                    type="number"
                    placeholder="Calorias aproximadas"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    required
                    min="0"
                    className="form-control"
                  />
                </div>

                <div className="mb-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      id="consumedSoda"
                      checked={consumedSoda}
                      onChange={(e) => setConsumedSoda(e.target.checked)}
                      className="form-check-input"
                    />
                    <label className="form-check-label" htmlFor="consumedSoda">
                      🥤 Fez consumo de refrigerante?
                    </label>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      id="consumedAlcohol"
                      checked={consumedAlcohol}
                      onChange={(e) => setConsumedAlcohol(e.target.checked)}
                      className="form-check-input"
                    />
                    <label className="form-check-label" htmlFor="consumedAlcohol">
                      🍺 Fez consumo de bebida alcoólica?
                    </label>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Observações (opcional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="form-control"
                    rows={3}
                    placeholder="Ex: Salada, frutas, etc."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-100"
                >
                  {loading ? 'Registrando...' : '🍽️ Registrar Refeição'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Histórico */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">📋 Histórico de Alimentação</h5>
              <div className="d-flex gap-2">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="form-select form-select-sm"
                  style={{ width: 'auto' }}
                >
                  <option value="week">Semana</option>
                  <option value="month">Mês</option>
                  <option value="year">Ano</option>
                </select>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setShowReportsModal(true)}
                >
                  📊 Relatórios
                </button>
              </div>
            </div>
            <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {nutrition.length === 0 ? (
                <p className="text-muted text-center">Nenhum registro encontrado</p>
              ) : (
                nutrition.map(record => (
                  <div key={record.id} className="border-bottom mb-3 pb-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1">{getMealTypeLabel(record.mealType)}</h6>
                        <small className="text-muted">
                          📅 {record.date} ⏰ {record.time}
                        </small>
                        <br />
                        <small className="text-muted">
                          🔥 {record.calories} cal
                          {record.consumedSoda && ' 🥤'}
                          {record.consumedAlcohol && ' 🍺'}
                        </small>
                        {record.notes && (
                          <p className="mb-1 mt-1 small">{record.notes}</p>
                        )}
                      </div>
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => handleEdit(record)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDelete(record.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      {showEditModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Editar Refeição</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleUpdate}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Data</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="form-control"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Horário</label>
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                        className="form-control"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Tipo de Refeição</label>
                    <select
                      value={mealType}
                      onChange={(e) => setMealType(e.target.value)}
                      required
                      className="form-control"
                    >
                      {mealTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.emoji} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Calorias</label>
                    <input
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      required
                      min="0"
                      className="form-control"
                    />
                  </div>

                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        id="editConsumedSoda"
                        checked={consumedSoda}
                        onChange={(e) => setConsumedSoda(e.target.checked)}
                        className="form-check-input"
                      />
                      <label className="form-check-label" htmlFor="editConsumedSoda">
                        🥤 Fez consumo de refrigerante?
                      </label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        id="editConsumedAlcohol"
                        checked={consumedAlcohol}
                        onChange={(e) => setConsumedAlcohol(e.target.checked)}
                        className="form-check-input"
                      />
                      <label className="form-check-label" htmlFor="editConsumedAlcohol">
                        🍺 Fez consumo de bebida alcoólica?
                      </label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Observações</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="form-control"
                      rows={3}
                    />
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" disabled={loading} className="btn btn-primary">
                      {loading ? 'Atualizando...' : '💾 Atualizar'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowEditModal(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Relatórios */}
      {showReportsModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">📊 Relatórios de Alimentação</h5>
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
                          <h6 className="card-title">🍽️ Dia com Mais Refeições</h6>
                          <p className="card-text fw-bold">
                            {reports.dayWithMostMeals ? new Date(reports.dayWithMostMeals).toLocaleDateString('pt-BR') : 'Nenhum dado'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card mb-3">
                        <div className="card-body">
                          <h6 className="card-title">📅 Dia com Menos Refeições</h6>
                          <p className="card-text fw-bold">
                            {reports.dayWithLeastMeals ? new Date(reports.dayWithLeastMeals).toLocaleDateString('pt-BR') : 'Nenhum dado'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card mb-3">
                        <div className="card-body">
                          <h6 className="card-title">🔥 Maior Consumo de Calorias</h6>
                          <p className="card-text fw-bold">
                            {reports.dayWithMostCalories ? `${reports.maxCalories} cal` : 'Nenhum dado'}
                          </p>
                          <small className="text-muted">
                            {reports.dayWithMostCalories && `Dia: ${new Date(reports.dayWithMostCalories).toLocaleDateString('pt-BR')}`}
                          </small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card mb-3">
                        <div className="card-body">
                          <h6 className="card-title">📊 Total de Refeições</h6>
                          <p className="card-text fw-bold">{reports.totalMeals}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card mb-3">
                        <div className="card-body">
                          <h6 className="card-title">🥤 Dias com Refrigerante</h6>
                          <p className="card-text fw-bold">{reports.sodaConsumptionDays.length} dias</p>
                          {reports.sodaConsumptionDays.length > 0 && (
                            <small className="text-muted">
                              {reports.sodaConsumptionDays.map((day: string) => new Date(day).toLocaleDateString('pt-BR')).join(', ')}
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card mb-3">
                        <div className="card-body">
                          <h6 className="card-title">🍺 Dias com Bebida Alcoólica</h6>
                          <p className="card-text fw-bold">{reports.alcoholConsumptionDays.length} dias</p>
                          {reports.alcoholConsumptionDays.length > 0 && (
                            <small className="text-muted">
                              {reports.alcoholConsumptionDays.map((day: string) => new Date(day).toLocaleDateString('pt-BR')).join(', ')}
                            </small>
                          )}
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

export default Nutrition;