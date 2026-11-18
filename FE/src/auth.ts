// Autenticazione reale: il login passa dal backend (/api/auth/login), che
// verifica email+password (hash bcrypt nel DB) e restituisce un token JWT.
// Gli account si creano SOLO a mano sul server (vedi BE: npm run user:add).
// Niente più password nel bundle del sito.
const TOKEN_KEY = 'omnia_cfg_token_v1';
const SESSION_KEY = 'omnia_cfg_v1';
const AUTH_API = '/api/configuratori/auth';

export interface Session {
  email: string;
  name: string;
  role: string;
}

function displayName(email: string): string {
  const local = (email.split('@')[0] || '').replace(/[^a-zA-Z].*$/, '');
  const base = local || (email.split('@')[0] || email);
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : email;
}

export async function login(email: string, pass: string): Promise<Session | null> {
  try {
    const res = await fetch(`${AUTH_API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password: pass }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { token?: string; user?: { email?: string; role?: string } };
    if (!data?.token) return null;
    const em = data.user?.email ?? email.trim();
    const s: Session = { email: em, name: displayName(em), role: data.user?.role ?? 'user' };
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    return s;
  } catch {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): Session | null {
  try {
    const r = localStorage.getItem(SESSION_KEY);
    return r ? (JSON.parse(r) as Session) : null;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// Token scaduto/non valido: pulisci la sessione e torna al login.
export function onAuthExpired(): void {
  logout();
  if (!window.location.pathname.endsWith('/login')) {
    window.location.href = '/configuratori/login';
  }
}
