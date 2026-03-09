import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/register`, { email, password, name });
      setMessage('✅ Cadastro realizado! Redirecionando...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error: any) {
      setMessage('❌ ' + (error.response?.data?.message || 'Cadastro falhou'));
    }
    setLoading(false);
  };

  const isSuccess = message.includes('✅');

  return (
    <div className="min-h-screen bg-primary d-flex align-items-center justify-content-center p-3" style={{minHeight: '100vh', background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)'}}>
      <div className="card shadow-lg border-0 p-4 w-100" style={{maxWidth: '450px', borderRadius: '24px'}}>
        <div className="text-center mb-5 mt-3">
          <div className="bg-primary text-white d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow-sm" style={{width: '64px', height: '64px'}}>
            <i className="bi bi-person-plus fs-2"></i>
          </div>
          <h1 className="h3 fw-black text-dark tracking-tight mb-1">Crie sua conta</h1>
          <p className="text-secondary small">Comece hoje sua jornada de evolução</p>
        </div>

        {message && (
          <div className={`alert ${isSuccess ? 'alert-success' : 'alert-danger'} rounded-4 py-3 px-4 small d-flex align-items-center mb-4`} role="alert">
            <i className={`bi ${isSuccess ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-md-2">
          <div className="mb-4">
            <label className="form-label fw-bold text-dark small mb-2">Seu nome</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-0"><i className="bi bi-person text-secondary"></i></span>
              <input
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="form-control bg-light border-0 py-3 rounded-end-3 fs-6"
                style={{fontSize: '15px'}}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-bold text-dark small mb-2">Seu e-mail</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-0"><i className="bi bi-envelope text-secondary"></i></span>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-control bg-light border-0 py-3 rounded-end-3 fs-6"
                style={{fontSize: '15px'}}
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="form-label fw-bold text-dark small mb-2">Sua senha</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-0"><i className="bi bi-lock text-secondary"></i></span>
              <input
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-control bg-light border-0 py-3 rounded-end-3"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-100 py-3 fw-bold rounded-3 shadow-sm mb-4"
          >
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Cadastrar agora'}
          </button>
        </form>

        <div className="text-center mt-2 mb-3">
          <p className="text-secondary small">
            Já tem uma conta? <Link to="/login" className="text-primary text-decoration-none fw-bold">Faça login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
