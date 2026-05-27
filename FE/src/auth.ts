const SESSION_KEY = 'omnia_cfg_v1';

export interface Session {
  email: string;
  name: string;
}

const USERS = [
  { email: 'edoardo2846@gmail.com', pass: 'Dcd776c2', name: 'Edoardo' },
];

export function login(email: string, pass: string): Session | null {
  const u = USERS.find(
    x => x.email.toLowerCase() === email.toLowerCase().trim() && x.pass === pass
  );
  if (!u) return null;
  const s: Session = { email: u.email, name: u.name };
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  return s;
}

export function logout(): void {
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
