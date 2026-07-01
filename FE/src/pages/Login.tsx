import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getSession } from '../auth';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getSession()) navigate('/', { replace: true });
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const session = login(email, password);
      setLoading(false);
      if (session) {
        navigate('/', { replace: true });
      } else {
        setError('Email o password non validi');
      }
    }, 350);
  };

  return (
    <div className="login-page">
      <div className="login-bg-anim" aria-hidden="true">
        <span className="login-blob login-blob-1" />
        <span className="login-blob login-blob-2" />
        <span className="login-blob login-blob-3" />
      </div>

      <div className="login-card">
        <div className="login-logo">
          <span className="login-icon-badge">⚙</span>
          <div>
            <div className="login-title-grad">OmniaPi</div>
            <div className="login-logo-sub">Configuratori — Accesso riservato</div>
          </div>
        </div>
        <a href="/" className="login-back-link">← Torna a OmniaPi</a>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@esempio.com" required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required />
          </div>
          {error && <div className="login-error">⚠ {error}</div>}
          <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
            {loading ? 'Accesso in corso…' : 'Accedi'}
          </button>
        </form>

        <div className="login-footnote">🔒 Accesso protetto · dati riservati</div>
      </div>
    </div>
  );
}
