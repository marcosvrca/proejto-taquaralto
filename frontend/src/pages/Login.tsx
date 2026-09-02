import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      login(res.data.token, res.data.user, res.data.refreshToken);
      navigate('/');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="text-center mb-4">
          <div className="auth-logo">
            <i className="bi bi-shield-fill" />
          </div>
          <div className="small fw-bold mb-2" style={{ color: 'var(--accent)', letterSpacing: '0.12em' }}>
            TAQUARALTO FUTSAL
          </div>
          <h1 className="h3 fw-black mb-1">Bem-vindo de volta</h1>
          <p className="text-secondary small mb-0">Entre para continuar sua evolução</p>
        </div>

        {message && (
          <div className="alert alert-danger rounded-4 py-3 px-4 small d-flex align-items-center mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2" />
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-bold small mb-2">Seu e-mail</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-envelope" /></span>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-control py-3"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label fw-bold small mb-2">Sua senha</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-lock" /></span>
              <input
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-control py-3"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-100 py-3 fw-bold mb-3">
            {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
            Acessar Plataforma
          </button>
        </form>

        <div className="text-center">
          <p className="text-secondary small mb-0">
            Não tem uma conta?{' '}
            <Link to="/register" className="link-gold">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
