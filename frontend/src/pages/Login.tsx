import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

const Login = () => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-primary d-flex align-items-center justify-content-center p-3" style={{minHeight: '100vh', background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)'}}>
      <div className="card shadow-lg border-0 p-4 w-100" style={{maxWidth: '450px', borderRadius: '24px'}}>
        <div className="text-center mb-5 mt-3">
          <div className="bg-primary text-white d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow-sm" style={{width: '64px', height: '64px'}}>
            <i className="bi bi-activity fs-2"></i>
          </div>
          <h1 className="h3 fw-black text-dark tracking-tight mb-1">Bem-vindo de volta</h1>
          <p className="text-secondary small">Entre para continuar sua evolução</p>
        </div>

        {message && (
          <div className="alert alert-danger rounded-4 py-3 px-4 small d-flex align-items-center mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-md-2">
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
            <div className="d-flex justify-content-between">
              <label className="form-label fw-bold text-dark small mb-2">Sua senha</label>
              <a href="#" className="text-primary text-decoration-none fw-bold small">Esqueceu?</a>
            </div>
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
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Acessar Plataforma'}
          </button>
        </form>

        <div className="text-center mt-2 mb-3">
          <p className="text-secondary small">
            Não tem uma conta? <Link to="/register" className="text-primary text-decoration-none fw-bold">Criar conta grátis</Link>
          </p>
          <div className="p-2 bg-light rounded-3 mt-4 small">
            <span className="fw-bold text-dark d-block mb-1">Modo Demo:</span>
            <span className="text-secondary">admin@example.com / admin123</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;