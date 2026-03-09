import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

interface Meal {
  id: number;
  date: string;
  time?: string;
  description: string;
  calories: number;
  mealType: string;
  consumedSoda?: boolean;
  consumedAlcohol?: boolean;
  consumedWater?: boolean;
  consumedNaturalJuice?: boolean;
  consumedIndustrialJuice?: boolean;
}

const Nutrition: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().split(' ')[0]);
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState(0);
  const [mealType, setMealType] = useState('Almoço');
  const [consumedSoda, setConsumedSoda] = useState(false);
  const [consumedAlcohol, setConsumedAlcohol] = useState(false);
  const [consumedWater, setConsumedWater] = useState(false);
  const [consumedNaturalJuice, setConsumedNaturalJuice] = useState(false);
  const [consumedIndustrialJuice, setConsumedIndustrialJuice] = useState(false);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [activeTab, setActiveTab] = useState<'diary' | 'reports'>('diary');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const mealTypes = ['Café da Manhã', 'Lanche da Manhã', 'Almoço', 'Lanche da Tarde', 'Jantar', 'Ceia', 'Pré-Treino', 'Pós-Treino', 'Outro'];

  const fetchMeals = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/nutrition`, { headers });
      setMeals(res.data.nutrition || []);
    } catch (error) {
      console.error('Erro ao buscar refeições:', error);
      setMeals([]);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingMeal) {
        await axios.put(`${API_BASE_URL}/api/nutrition/${editingMeal.id}`, {
          date, time, mealType, calories, consumedSoda, consumedAlcohol, consumedWater, consumedNaturalJuice, consumedIndustrialJuice, notes: description
        }, { headers });
        setMessage('✅ Refeição atualizada!');
      } else {
        await axios.post(`${API_BASE_URL}/api/nutrition`, {
          date, time, mealType, calories, consumedSoda, consumedAlcohol, consumedWater, consumedNaturalJuice, consumedIndustrialJuice, notes: description
        }, { headers });
        setMessage('✅ Refeição registrada!');
      }
      fetchMeals();
      resetForm();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage('❌ ' + (error.response?.data?.message || 'Erro ao processar'));
    }
    setLoading(false);
  };

  const handleEdit = (meal: Meal) => {
    setEditingMeal(meal);
    setDate(meal.date);
    setTime('12:00');
    setDescription(meal.description);
    setCalories(meal.calories);
    setMealType(meal.mealType);
    setConsumedSoda(meal.consumedSoda || false);
    setConsumedAlcohol(meal.consumedAlcohol || false);
    setConsumedWater(meal.consumedWater || false);
    setConsumedNaturalJuice(meal.consumedNaturalJuice || false);
    setConsumedIndustrialJuice(meal.consumedIndustrialJuice || false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja remover esta refeição?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/nutrition/${id}`, { headers });
      setMessage('✅ Refeição removida');
      fetchMeals();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Erro ao deletar');
    }
  };

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setTime(new Date().toTimeString().split(' ')[0]);
    setDescription('');
    setCalories(0);
    setMealType('Almoço');
    setConsumedSoda(false);
    setConsumedAlcohol(false);
    setConsumedWater(false);
    setConsumedNaturalJuice(false);
    setConsumedIndustrialJuice(false);
    setEditingMeal(null);
  };

  const renderBeverageBadges = (meal: Meal) => {
    const badges = [];
    if (meal.consumedAlcohol) badges.push(<span key="alcohol" className="badge bg-danger me-2 mb-1">🍺 Álcool</span>);
    if (meal.consumedIndustrialJuice) badges.push(<span key="indjuice" className="badge bg-warning me-2 mb-1">🧴 Suco Industrial</span>);
    if (meal.consumedSoda) badges.push(<span key="soda" className="badge bg-warning-subtle text-warning me-2 mb-1">🥤 Refrigerante</span>);
    if (meal.consumedNaturalJuice) badges.push(<span key="natjuice" className="badge bg-info me-2 mb-1">🍊 Suco Natural</span>);
    if (meal.consumedWater) badges.push(<span key="water" className="badge bg-success me-2 mb-1">💧 Água</span>);
    return badges;
  };

  const calculateMealQualityScore = (meal: Meal): number => {
    let score = 10;
    if (meal.consumedAlcohol) score -= 8;
    else if (meal.consumedSoda) score -= 5;
    else if (meal.consumedIndustrialJuice) score -= 2;
    if (meal.consumedWater) score += 3;
    if (meal.consumedNaturalJuice) score += 2;
    return Math.max(0, score);
  };

  const getTimeOfDay = (timeStr?: string | null): string => {
    if (!timeStr) return 'Desconhecido';
    const hour = parseInt(timeStr.split(':')[0]);
    if (hour >= 6 && hour < 12) return 'Manhã';
    if (hour >= 12 && hour < 18) return 'Tarde';
    if (hour >= 18 && hour < 24) return 'Noite';
    return 'Madrugada';
  };

  const getReportData = () => {
    if (meals.length === 0) return null;

    // Agrupar refeições por data
    const mealsByDate: { [key: string]: Meal[] } = {};
    meals.forEach(meal => {
      if (!mealsByDate[meal.date]) mealsByDate[meal.date] = [];
      mealsByDate[meal.date].push(meal);
    });

    // Calcular estatísticas por dia
    const dayStats = Object.entries(mealsByDate).map(([date, dayMeals]) => {
      const totalCals = dayMeals.reduce((sum, m) => sum + m.calories, 0);
      const avgQuality = dayMeals.reduce((sum, m) => sum + calculateMealQualityScore(m), 0) / dayMeals.length;
      return { date, meals: dayMeals, totalCals, avgQuality, count: dayMeals.length };
    });

    // Melhor e pior dia
    const bestDay = dayStats.reduce((best, current) => 
      (current.avgQuality > best.avgQuality) ? current : best
    );
    const worstDay = dayStats.reduce((worst, current) => 
      (current.avgQuality < worst.avgQuality) ? current : worst
    );

    // Distribuição por período do dia
    const periodDistribution: { [key: string]: number } = {
      'Manhã': 0,
      'Tarde': 0,
      'Noite': 0,
      'Madrugada': 0,
      'Desconhecido': 0
    };
    meals.forEach(meal => {
      const period = getTimeOfDay(meal.time);
      periodDistribution[period]++;
    });

    // Total de calorias
    const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);

    // Média diária de refeições
    const avgMealsPerDay = (meals.length / dayStats.length).toFixed(1);

    return {
      bestDay,
      worstDay,
      totalCalories,
      periodDistribution,
      avgMealsPerDay,
      totalDays: dayStats.length,
      dayStats
    };
  };

  const reportData = getReportData();

  const totalCalories = meals.reduce((acc, m) => acc + m.calories, 0);

  return (
    <div className="container py-5 mt-5">
      <div className="row align-items-center mb-5">
        <div className="col-12">
          <h1 className="fw-black text-dark mb-1">
            <i className="bi bi-apple text-success me-2"></i>
            Nutrição & Dieta
          </h1>
          <p className="text-secondary lead fs-6">Gerencie sua ingestão calórica e mantenha o equilíbrio nutricional.</p>
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
         <div className="col-md-6">
            <div className="card p-4 border-0 h-100 border-start border-success border-4 shadow-sm">
               <p className="text-uppercase small fw-bold text-secondary mb-1">Consumo Total Registrado</p>
               <h3 className="fw-black text-dark mb-0">{totalCalories} kcal</h3>
               <div className="small text-muted mt-2">Energia total consumida</div>
            </div>
         </div>
         <div className="col-md-6">
            <div className="card p-4 border-0 h-100 border-start border-primary border-4 shadow-sm">
               <p className="text-uppercase small fw-bold text-secondary mb-1">Refeições Realizadas</p>
               <h3 className="fw-black text-dark mb-0">{meals.length} refeições</h3>
               <div className="small text-muted mt-2">Frequência alimentar</div>
            </div>
         </div>
      </div>

      <div className="row g-5">
        <div className="col-lg-4">
          <div className="card p-4 border-0 shadow-sm sticky-top" style={{top: '100px'}}>
            <h2 className="h5 fw-bold text-dark mb-4">
               <i className={`bi ${editingMeal ? 'bi-pencil-square' : 'bi-plus-circle-fill'} text-success me-2`}></i>
               {editingMeal ? 'Editar Refeição' : 'Novo Registro'}
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
                <label className="form-label small fw-bold text-secondary">Tipo de Refeição</label>
                <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="form-select bg-light border-0 py-2 rounded-3">
                  {mealTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">Calorias (kcal)</label>
                <input type="number" value={calories} onChange={(e) => setCalories(Number(e.target.value))} required className="form-control bg-light border-0 py-2 rounded-3" />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">O que você comeu?</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required className="form-control bg-light border-0 py-2 rounded-3" rows={2} placeholder="Ex: Arroz, feijão, frango grelhado e salada..."></textarea>
              </div>
              <div className="mb-3">
                <div className="form-check">
                  <input 
                    type="checkbox" 
                    className="form-check-input" 
                    id="sodaCheck"
                    checked={consumedSoda}
                    onChange={(e) => setConsumedSoda(e.target.checked)}
                  />
                  <label className="form-check-label small text-secondary" htmlFor="sodaCheck">
                    🥤 Continha refrigerante
                  </label>
                </div>
              </div>
              <div className="mb-3">
                <div className="form-check">
                  <input 
                    type="checkbox" 
                    className="form-check-input" 
                    id="alcoholCheck"
                    checked={consumedAlcohol}
                    onChange={(e) => setConsumedAlcohol(e.target.checked)}
                  />
                  <label className="form-check-label small text-secondary" htmlFor="alcoholCheck">
                    🍺 Continha álcool
                  </label>
                </div>
              </div>
              <div className="mb-3">
                <div className="form-check">
                  <input 
                    type="checkbox" 
                    className="form-check-input" 
                    id="waterCheck"
                    checked={consumedWater}
                    onChange={(e) => setConsumedWater(e.target.checked)}
                  />
                  <label className="form-check-label small text-secondary" htmlFor="waterCheck">
                    💧 Continha água
                  </label>
                </div>
              </div>
              <div className="mb-3">
                <div className="form-check">
                  <input 
                    type="checkbox" 
                    className="form-check-input" 
                    id="naturalJuiceCheck"
                    checked={consumedNaturalJuice}
                    onChange={(e) => setConsumedNaturalJuice(e.target.checked)}
                  />
                  <label className="form-check-label small text-secondary" htmlFor="naturalJuiceCheck">
                    🍊 Continha suco natural
                  </label>
                </div>
              </div>
              <div className="mb-4">
                <div className="form-check">
                  <input 
                    type="checkbox" 
                    className="form-check-input" 
                    id="industrialJuiceCheck"
                    checked={consumedIndustrialJuice}
                    onChange={(e) => setConsumedIndustrialJuice(e.target.checked)}
                  />
                  <label className="form-check-label small text-secondary" htmlFor="industrialJuiceCheck">
                    🧴 Continha suco industrial
                  </label>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn btn-success w-100 py-2 fw-bold shadow-sm mb-2 text-white">
                {loading ? <span className="spinner-border spinner-border-sm"></span> : (editingMeal ? 'Atualizar Refeição' : 'Registrar Refeição')}
              </button>
              {editingMeal && (
                <button type="button" onClick={resetForm} className="btn btn-link w-100 text-secondary text-decoration-none small fw-bold">Cancelar</button>
              )}
            </form>
          </div>
        </div>

        <div className="col-lg-8">
          {/* Abas de Navegação */}
          <ul className="nav nav-tabs mb-4 border-0 gap-2">
            <li className="nav-item">
              <button
                className={`nav-link rounded-top-3 fw-bold px-4 py-2 border-0 ${activeTab === 'diary' ? 'bg-success text-white' : 'bg-light text-secondary'}`}
                onClick={() => setActiveTab('diary')}
              >
                <i className="bi bi-calendar-check me-2"></i>Diário Alimentar
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link rounded-top-3 fw-bold px-4 py-2 border-0 ${activeTab === 'reports' ? 'bg-success text-white' : 'bg-light text-secondary'}`}
                onClick={() => setActiveTab('reports')}
              >
                <i className="bi bi-graph-up me-2"></i>Relatórios
              </button>
            </li>
          </ul>

          {/* Aba Diário Alimentar */}
          {activeTab === 'diary' && (
          <div>
            <div className="d-flex align-items-center justify-content-between mb-4">
               <h2 className="h5 fw-bold text-dark mb-0">Diário Alimentar</h2>
               <span className="badge bg-white text-dark shadow-sm px-3 py-2 rounded-3">{meals.length} itens</span>
            </div>

          <div className="list-group list-group-flush bg-transparent">
            {meals.length > 0 ? (
              meals.map(meal => (
                <div key={meal.id} className="card border-0 p-3 mb-3 shadow-sm">
                   <div className="d-flex align-items-start justify-content-between">
                      <div className="d-flex align-items-center">
                         <div className="bg-success-subtle text-success rounded-3 text-center p-2 me-4" style={{minWidth: '60px'}}>
                            <div className="text-uppercase small fw-black" style={{fontSize: '10px'}}>
                               {new Date(meal.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                            </div>
                            <div className="h4 fw-black mb-0">{new Date(meal.date).getDate() + 1}</div>
                         </div>
                         <div>
                            <div className="fw-bold text-dark mb-2">
                               {meal.mealType}
                               <span className="badge bg-light text-success ms-2 border border-success-subtle fw-bold" style={{fontSize: '11px'}}>{meal.calories} kcal</span>
                            </div>
                            <div className="mb-2">
                              <p className="text-secondary small mb-1"><strong>Refeição:</strong></p>
                              <p className="text-dark small mb-2 ps-2 border-start border-success-subtle">{meal.description}</p>
                            </div>
                            <div className="mt-2">
                              {renderBeverageBadges(meal).length > 0 && renderBeverageBadges(meal)}
                            </div>
                         </div>
                      </div>
                      <div className="d-flex gap-2">
                         <button onClick={() => handleEdit(meal)} className="btn btn-light btn-sm rounded-circle p-2 border-0 shadow-sm"><i className="bi bi-pencil-fill text-primary"></i></button>
                         <button onClick={() => handleDelete(meal.id)} className="btn btn-light btn-sm rounded-circle p-2 border-0 shadow-sm"><i className="bi bi-trash-fill text-danger"></i></button>
                      </div>
                   </div>
                </div>
              ))
            ) : (
              <div className="card p-5 border-0 text-center shadow-sm">
                 <i className="bi bi-egg-fried fs-1 text-muted mb-3"></i>
                 <p className="text-secondary mb-0">Nenhuma refeição registrada ainda.</p>
              </div>
            )}
          </div>
          </div>
          )}

          {/* Aba Relatórios */}
          {activeTab === 'reports' && reportData && (
          <div>
            <h2 className="h5 fw-bold text-dark mb-4">
              <i className="bi bi-graph-up text-info me-2"></i>Relatório Detalhado
            </h2>

            <div className="row g-3 mb-4">
              {/* Total de Calorias */}
              <div className="col-md-6">
                <div className="card p-4 border-0 shadow-sm h-100 bg-light-success">
                  <p className="text-muted small mb-2"><i className="bi bi-fire me-2"></i>Total de Calorias</p>
                  <h3 className="fw-black text-dark mb-0">{reportData.totalCalories} kcal</h3>
                  <small className="text-muted mt-2">Consumidas em {reportData.totalDays} dia(s)</small>
                </div>
              </div>

              {/* Média por Dia */}
              <div className="col-md-6">
                <div className="card p-4 border-0 shadow-sm h-100 bg-light-info">
                  <p className="text-muted small mb-2"><i className="bi bi-bar-chart me-2"></i>Média por Dia</p>
                  <h3 className="fw-black text-dark mb-0">{reportData.avgMealsPerDay}</h3>
                  <small className="text-muted mt-2">Refeições registradas</small>
                </div>
              </div>
            </div>

            {/* Melhor e Pior Dia */}
            <div className="row g-3 mb-4">
              {/* Melhor Dia */}
              <div className="col-md-6">
                <div className="card p-4 border-0 shadow-sm h-100 border-start border-success border-4">
                  <p className="text-muted small mb-2 fw-bold">🏆 Melhor Dia</p>
                  <p className="text-dark fw-bold mb-1">{new Date(reportData.bestDay.date).toLocaleDateString('pt-BR')}</p>
                  <small className="text-muted d-block mb-2">
                    <i className="bi bi-egg-fried me-1"></i>{reportData.bestDay.count} refeição{reportData.bestDay.count !== 1 ? 's' : ''}
                  </small>
                  <small className="text-muted d-block mb-2">
                    <i className="bi bi-fire me-1"></i>{reportData.bestDay.totalCals} kcal
                  </small>
                  <div className="pt-2 border-top">
                    <small className="text-primary fw-bold">Qualidade: {reportData.bestDay.avgQuality.toFixed(1)}/10</small>
                  </div>
                </div>
              </div>

              {/* Pior Dia */}
              <div className="col-md-6">
                <div className="card p-4 border-0 shadow-sm h-100 border-start border-danger border-4">
                  <p className="text-muted small mb-2 fw-bold">⚠️ Pior Dia</p>
                  <p className="text-dark fw-bold mb-1">{new Date(reportData.worstDay.date).toLocaleDateString('pt-BR')}</p>
                  <small className="text-muted d-block mb-2">
                    <i className="bi bi-egg-fried me-1"></i>{reportData.worstDay.count} refeição{reportData.worstDay.count !== 1 ? 's' : ''}
                  </small>
                  <small className="text-muted d-block mb-2">
                    <i className="bi bi-fire me-1"></i>{reportData.worstDay.totalCals} kcal
                  </small>
                  <div className="pt-2 border-top">
                    <small className="text-danger fw-bold">Qualidade: {reportData.worstDay.avgQuality.toFixed(1)}/10</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Distribuição por Período */}
            <div className="card p-4 border-0 shadow-sm">
              <h3 className="h6 fw-bold text-dark mb-4">
                <i className="bi bi-clock-history text-warning me-2"></i>Distribuição por Período do Dia
              </h3>

              <div className="row g-3">
                {/* Manhã */}
                <div className="col-md-6 col-lg-3">
                  <div className="bg-light p-3 rounded-3 text-center">
                    <div className="h4 fw-black text-primary mb-1">🌅</div>
                    <p className="fw-bold text-dark mb-1">Manhã</p>
                    <p className="text-muted small mb-0">06:00 - 12:00</p>
                    <div className="mt-3 pt-3 border-top">
                      <h5 className="fw-black text-primary mb-0">{reportData.periodDistribution['Manhã']}</h5>
                      <small className="text-muted">refeição{reportData.periodDistribution['Manhã'] !== 1 ? 's' : ''}</small>
                    </div>
                  </div>
                </div>

                {/* Tarde */}
                <div className="col-md-6 col-lg-3">
                  <div className="bg-light p-3 rounded-3 text-center">
                    <div className="h4 fw-black text-warning mb-1">☀️</div>
                    <p className="fw-bold text-dark mb-1">Tarde</p>
                    <p className="text-muted small mb-0">12:00 - 18:00</p>
                    <div className="mt-3 pt-3 border-top">
                      <h5 className="fw-black text-warning mb-0">{reportData.periodDistribution['Tarde']}</h5>
                      <small className="text-muted">refeição{reportData.periodDistribution['Tarde'] !== 1 ? 's' : ''}</small>
                    </div>
                  </div>
                </div>

                {/* Noite */}
                <div className="col-md-6 col-lg-3">
                  <div className="bg-light p-3 rounded-3 text-center">
                    <div className="h4 fw-black text-secondary mb-1">🌙</div>
                    <p className="fw-bold text-dark mb-1">Noite</p>
                    <p className="text-muted small mb-0">18:00 - 24:00</p>
                    <div className="mt-3 pt-3 border-top">
                      <h5 className="fw-black text-secondary mb-0">{reportData.periodDistribution['Noite']}</h5>
                      <small className="text-muted">refeição{reportData.periodDistribution['Noite'] !== 1 ? 's' : ''}</small>
                    </div>
                  </div>
                </div>

                {/* Madrugada */}
                <div className="col-md-6 col-lg-3">
                  <div className="bg-light p-3 rounded-3 text-center">
                    <div className="h4 fw-black text-dark mb-1">🌌</div>
                    <p className="fw-bold text-dark mb-1">Madrugada</p>
                    <p className="text-muted small mb-0">00:00 - 06:00</p>
                    <div className="mt-3 pt-3 border-top">
                      <h5 className="fw-black text-dark mb-0">{reportData.periodDistribution['Madrugada']}</h5>
                      <small className="text-muted">refeição{reportData.periodDistribution['Madrugada'] !== 1 ? 's' : ''}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          {activeTab === 'reports' && !reportData && (
          <div className="card p-5 border-0 text-center shadow-sm">
             <i className="bi bi-graph-up fs-1 text-muted mb-3"></i>
             <p className="text-secondary mb-0">Registre refeições para visualizar relatórios detalhados.</p>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Nutrition;