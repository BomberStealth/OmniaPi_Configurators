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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await login(email, password);
      if (session) {
        navigate('/', { replace: true });
      } else {
        setError('Email o password non validi');
      }
    } catch {
      setError('Server non raggiungibile. Riprova.');
    } finally {
      setLoading(false);
    }
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
            <label className="form-label">Email o nome utente</label>
            <input className="form-input" type="text" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@esempio.com oppure nome utente"
              autoComplete="username" required autoFocus />
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
