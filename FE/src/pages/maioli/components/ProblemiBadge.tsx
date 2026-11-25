// Iconcina problemi di una bolla:
//  🔴 rosso = manca almeno un prezzo · 🟡 giallo = solo prezzi cambiati · niente = ok
export default function ProblemiBadge({ senza, mod }: { senza?: number; mod?: number }) {
  const s = Number(senza) || 0;
  const m = Number(mod) || 0;
  if (!s && !m) return null;
  const cls = s > 0 ? 'rosso' : 'giallo';
  const title = [s > 0 ? `${s} senza prezzo` : '', m > 0 ? `${m} prezzo cambiato` : ''].filter(Boolean).join(' · ');
  return <span className={`maioli-prob ${cls}`} title={title}>⚠ {s + m}</span>;
}
