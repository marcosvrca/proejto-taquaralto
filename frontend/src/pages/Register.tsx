import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

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
      await api.post('/api/auth/register', { email, password, name });
      setMessage('Cadastro realizado! Redirecionando...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Cadastro falhou');
    }
    setLoading(false);
  };

  const isSuccess = message.includes('Cadastro realizado');

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="text-center mb-4">
          <div className="auth-logo">
            <i className="bi bi-person-plus" />
          </div>
          <div className="small fw-bold mb-2" style={{ color: 'var(--accent)', letterSpacing: '0.12em' }}>
            TAQUARALTO FUTSAL
          </div>
          <h1 className="h3 fw-black mb-1">Crie sua conta</h1>
          <p className="text-secondary small mb-0">Comece hoje sua jornada de evolução</p>
        </div>

        {message && (
          <div
            className={`alert ${isSuccess ? 'alert-success' : 'alert-danger'} rounded-4 py-3 px-4 small d-flex align-items-center mb-4`}
            role="alert"
          >
            <i className={`bi ${isSuccess ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`} />
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-bold small mb-2">Seu nome</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-person" /></span>
              <input
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="form-control py-3"
              />
            </div>
          </div>

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
            Cadastrar agora
          </button>
        </form>

        <div className="text-center">
          <p className="text-secondary small mb-0">
            Já tem uma conta?{' '}
            <Link to="/login" className="link-gold">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
