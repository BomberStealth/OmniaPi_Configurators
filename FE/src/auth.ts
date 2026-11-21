// Autenticazione reale: il login passa dal backend (/api/auth/login), che
// verifica email+password (hash bcrypt nel DB) e restituisce un token JWT +
// i permessi dell'account. Gli account si gestiscono dalla pagina Account
// (admin) o via CLI. Niente password nel bundle del sito.
const TOKEN_KEY = 'omnia_cfg_token_v1';
const SESSION_KEY = 'omnia_cfg_v1';
const AUTH_API = '/api/configuratori/auth';
const ME_API = '/api/configuratori/maioli/me';

export type Permessi = Record<string, boolean>;

export interface Session {
  email: string;
  name: string;
  role: string;
  permessi: Permessi;
}

function displayName(email: string): string {
  const local = (email.split('@')[0] || '').replace(/[^a-zA-Z].*$/, '');
  const base = local || (email.split('@')[0] || email);
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : email;
}

export async function login(email: string, pass: string): Promise<{ session?: Session; error?: string }> {
  try {
    const res = await fetch(`${AUTH_API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password: pass }),
    });
    if (res.status === 403) {
      const j = await res.json().catch(() => ({} as any));
      return { error: j.message || 'Account disattivato' };
    }
    if (!res.ok) return { error: 'Email o password non validi' };
    const data = await res.json() as { token?: string; user?: { email?: string; role?: string; permessi?: Permessi } };
    if (!data?.token) return { error: 'Email o password non validi' };
    const em = data.user?.email ?? email.trim();
    const s: Session = { email: em, name: displayName(em), role: data.user?.role ?? 'user', permessi: data.user?.permessi ?? {} };
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    return { session: s };
  } catch {
    return { error: 'Server non raggiungibile. Riprova.' };
  }
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): Session | null {
  try {
    const r = localStorage.getItem(SESSION_KEY);
    if (!r) return null;
    const s = JSON.parse(r) as Session;
    if (!s.permessi) s.permessi = {};
    return s;
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

export function isAdmin(): boolean {
  return getSession()?.role === 'admin';
}

// permesso per sezione: l'admin ha sempre tutto.
export function can(cap: string): boolean {
  const s = getSession();
  if (!s) return false;
  if (s.role === 'admin') return true;
  return !!s.permessi?.[cap];
}

// Ricarica ruolo+permessi freschi dal server e li salva in sessione.
export async function refreshMe(): Promise<Session | null> {
  const s = getSession();
  if (!s) return null;
  try {
    const res = await fetch(ME_API, { headers: authHeaders() });
    if (res.status === 401 || res.status === 403) { onAuthExpired(); return null; }
    if (!res.ok) return s;
    const j = await res.json() as { role?: string; permessi?: Permessi };
    const ns: Session = { ...s, role: j.role ?? s.role, permessi: j.permessi ?? s.permessi };
    localStorage.setItem(SESSION_KEY, JSON.stringify(ns));
    return ns;
  } catch { return s; }
}

// Token scaduto/non valido (o account disattivato): pulisci e torna al login.
export function onAuthExpired(): void {
  logout();
  if (!window.location.pathname.endsWith('/login')) {
    window.location.href = '/configuratori/login';
  }
}
