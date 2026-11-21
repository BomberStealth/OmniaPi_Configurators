import { useState, useEffect, useCallback } from 'react';
import { listAccounts, createAccount, updateAccount } from '../store';
import type { Account as Acc } from '../store';
import { getSession } from '../../../auth';
import { useConfirm } from '../components/ConfirmDialog';
import OperaiManage from './OperaiManage';

const PERMS: { key: string; label: string }[] = [
  { key: 'nuova', label: 'Nuova Bolla' },
  { key: 'storico', label: 'Storico bolle' },
  { key: 'clienti', label: 'Clienti' },
  { key: 'listino', label: 'Listino' },
  { key: 'fatturate', label: 'Segna "Fatturate"' },
];
const SETTORI = [
  { v: 'elettrico', l: '⚡ Elettrico' },
  { v: 'idraulico', l: '💧 Idraulico' },
  { v: 'entrambi', l: 'Entrambi (amministrazione)' },
];

type Row = Acc & { _dirty?: boolean };

export default function Account() {
  const confirm = useConfirm();
  const myEmail = (getSession()?.email || '').toLowerCase();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [nEmail, setNEmail] = useState('');
  const [nPass, setNPass] = useState('');
  const [nPermessi, setNPermessi] = useState<Record<string, boolean>>({ nuova: true, storico: true });
  const [nSettore, setNSettore] = useState('idraulico');

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await listAccounts()); } catch { setRows([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const patch = (id: number, p: Partial<Row>) => setRows(rs => rs.map(r => (r.id === id ? { ...r, ...p, _dirty: true } : r)));
  const togglePerm = (id: number, key: string) =>
    setRows(rs => rs.map(r => (r.id === id ? { ...r, permessi: { ...r.permessi, [key]: !r.permessi[key] }, _dirty: true } : r)));

  const salva = async (r: Row) => {
    try {
      await updateAccount(r.id, { attivo: r.attivo, permessi: r.permessi, role: r.role, settore: r.settore });
      setRows(rs => rs.map(x => (x.id === r.id ? { ...x, _dirty: false } : x)));
    } catch { alert('Salvataggio non riuscito.'); }
  };

  const resetPwd = async (r: Row) => {
    const pwd = prompt(`Nuova password per "${r.email}" (min 6 caratteri):`);
    if (!pwd) return;
    if (pwd.length < 6) { alert('La password deve avere almeno 6 caratteri.'); return; }
    try { await updateAccount(r.id, { password: pwd }); alert('Password aggiornata.'); } catch { alert('Operazione non riuscita.'); }
  };

  const creaNuovo = async () => {
    if (!nEmail.trim() || nPass.length < 6) { alert('Email e password (min 6 caratteri) obbligatorie.'); return; }
    try {
      await createAccount(nEmail.trim(), nPass, nPermessi, 'user', nSettore);
      setNEmail(''); setNPass(''); setNPermessi({ nuova: true, storico: true }); setNSettore('idraulico'); setShowNew(false);
      load();
    } catch { alert('Creazione non riuscita (email già esistente?).'); }
  };

  const confermaDisattiva = async (r: Row, attivo: boolean) => {
    if (!attivo) {
      const ok = await confirm({ title: 'Disattivare l\'account?', message: `"${r.email}" non potrà più accedere finché non lo riattivi.`, confirmLabel: 'Disattiva', danger: true });
      if (!ok) return;
    }
    patch(r.id, { attivo: attivo ? 1 : 0 });
  };

  return (
    <>
    <div className="card maioli-card">
      <div className="maioli-sec-title">
        Account
        <button className="btn btn-primary btn-sm" onClick={() => setShowNew(s => !s)}>+ Nuovo account</button>
      </div>
      <div className="maioli-listino-hint">Attiva/disattiva gli account e scegli a cosa possono accedere. L'ADMIN ha sempre tutti i permessi.</div>

      {showNew && (
        <div className="maioli-acc-new">
          <input placeholder="Email" value={nEmail} onChange={e => setNEmail(e.target.value)} />
          <input placeholder="Password (min 6)" type="text" value={nPass} onChange={e => setNPass(e.target.value)} />
          <select value={nSettore} onChange={e => setNSettore(e.target.value)}>
            {SETTORI.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
          <div className="maioli-acc-perms">
            {PERMS.map(p => (
              <label key={p.key} className="maioli-acc-perm">
                <input type="checkbox" checked={!!nPermessi[p.key]} onChange={e => setNPermessi(v => ({ ...v, [p.key]: e.target.checked }))} />
                <span>{p.label}</span>
              </label>
            ))}
          </div>
          <div className="maioli-acc-actions">
            <button className="btn btn-primary btn-sm" onClick={creaNuovo}>Crea account</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowNew(false)}>Annulla</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="maioli-empty">Caricamento…</div>
      ) : (
        <div className="maioli-acc-list">
          {rows.map(r => {
            const isAdmin = r.role === 'admin';
            const isSelf = r.email.toLowerCase() === myEmail;
            return (
              <div className={`maioli-acc-card${r.attivo ? '' : ' off'}`} key={r.id}>
                <div className="maioli-acc-head2">
                  <div className="maioli-acc-email">{r.email}{isSelf ? ' (tu)' : ''}</div>
                  <label className="maioli-acc-attivo">
                    <input type="checkbox" checked={!!r.attivo} disabled={isSelf}
                      onChange={e => confermaDisattiva(r, e.target.checked)} />
                    <span>{r.attivo ? 'Attivo' : 'Disattivato'}</span>
                  </label>
                </div>

                {isAdmin ? (
                  <div className="maioli-acc-adminbadge">👑 Amministratore — tutti i permessi e settori</div>
                ) : (
                  <>
                  <div className="maioli-acc-settore">
                    <span>Settore:</span>
                    <select value={r.settore} onChange={e => patch(r.id, { settore: e.target.value })}>
                      {SETTORI.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                    </select>
                  </div>
                  <div className="maioli-acc-perms">
                    {PERMS.map(p => (
                      <label key={p.key} className="maioli-acc-perm">
                        <input type="checkbox" checked={!!r.permessi[p.key]} onChange={() => togglePerm(r.id, p.key)} />
                        <span>{p.label}</span>
                      </label>
                    ))}
                    <label className="maioli-acc-perm maioli-acc-adminrole">
                      <input type="checkbox" checked={isAdmin} disabled={isSelf} onChange={e => patch(r.id, { role: e.target.checked ? 'admin' : 'user' })} />
                      <span>Rendi Amministratore</span>
                    </label>
                  </div>
                  </>
                )}

                <div className="maioli-acc-actions">
                  <button className="btn btn-primary btn-sm" disabled={!r._dirty} onClick={() => salva(r)}>Salva</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => resetPwd(r)}>Cambia password</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    <OperaiManage />
    </>
  );
}
