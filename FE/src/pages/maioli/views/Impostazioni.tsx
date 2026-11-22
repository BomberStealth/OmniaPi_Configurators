import { useState, useEffect } from 'react';
import { getImpostazioni, saveImpostazioni } from '../store';
import { IMPOST_DEFAULT } from '../settings';
import type { Impostazioni as Imp } from '../settings';

export default function Impostazioni() {
  const [v, setV] = useState<Imp>(IMPOST_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    getImpostazioni().then(setV).catch(() => setV(IMPOST_DEFAULT)).finally(() => setLoading(false));
  }, []);

  const num = (k: keyof Imp, val: string) => { setV(s => ({ ...s, [k]: Number(val) || 0 })); setDirty(true); };
  const txt = (k: keyof Imp, val: string) => { setV(s => ({ ...s, [k]: val })); setDirty(true); };

  const salva = async () => {
    setSaving(true);
    try {
      const imp = await saveImpostazioni(v);
      setV(imp); setDirty(false); setFlash(true); setTimeout(() => setFlash(false), 2000);
    } catch { alert('Salvataggio non riuscito.'); } finally { setSaving(false); }
  };

  if (loading) return <div className="card maioli-card"><div className="maioli-empty">Caricamento…</div></div>;

  return (
    <div className="card maioli-card">
      <div className="maioli-sec-title">
        Impostazioni
        <div className="maioli-listino-tools">
          {flash && <span className="maioli-saved-flash">✓ Salvato</span>}
          <button className="btn btn-primary btn-sm" disabled={!dirty || saving} onClick={salva}>
            {saving ? 'Salvo…' : '💾 Salva impostazioni'}
          </button>
        </div>
      </div>
      <div className="maioli-listino-hint">
        Valori comuni a <b>tutte le bolle future</b> (preimpostazioni, sempre modificabili nella singola bolla)
        e dati che compaiono sul <b>foglio di stampa</b>. Non toccano le bolle già salvate.
      </div>

      {/* ───────── Bolle ───────── */}
      <div className="maioli-imp-sec">
        <div className="maioli-imp-sec-tit">🧾 Bolle</div>
        <div className="maioli-imp-grid">
          <label className="maioli-imp-field">
            <span>Diritto di chiamata (€)</span>
            <input type="number" min="0" step="1" inputMode="decimal" value={v.costoChiamata} onChange={e => num('costoChiamata', e.target.value)} />
          </label>
          <label className="maioli-imp-field">
            <span>⚡ Tariffa oraria elettrico (€/h)</span>
            <input type="number" min="0" step="1" inputMode="decimal" value={v.tariffaElettrico} onChange={e => num('tariffaElettrico', e.target.value)} />
          </label>
          <label className="maioli-imp-field">
            <span>💧 Tariffa oraria idraulico (€/h)</span>
            <input type="number" min="0" step="1" inputMode="decimal" value={v.tariffaIdraulico} onChange={e => num('tariffaIdraulico', e.target.value)} />
          </label>
          <label className="maioli-imp-field">
            <span>IVA di default</span>
            <select value={v.ivaDefault} onChange={e => num('ivaDefault', e.target.value)}>
              <option value={0}>Nessuna (0%)</option>
              <option value={10}>10%</option>
              <option value={22}>22%</option>
            </select>
          </label>
          <label className="maioli-imp-check">
            <input type="checkbox" checked={v.costoChiamataDefault === 1}
              onChange={e => { setV(s => ({ ...s, costoChiamataDefault: e.target.checked ? 1 : 0 })); setDirty(true); }} />
            <span>Diritto di chiamata <b>già spuntato</b> nelle nuove bolle</span>
          </label>
        </div>
      </div>

      {/* ───────── Dati azienda ───────── */}
      <div className="maioli-imp-sec">
        <div className="maioli-imp-sec-tit">🏢 Dati azienda (foglio di stampa)</div>
        <div className="maioli-imp-grid">
          <label className="maioli-imp-field maioli-imp-wide"><span>Ragione sociale</span>
            <input value={v.azRagioneSociale} onChange={e => txt('azRagioneSociale', e.target.value)} /></label>
          <label className="maioli-imp-field"><span>Telefono</span>
            <input value={v.azTel} onChange={e => txt('azTel', e.target.value)} /></label>
          <label className="maioli-imp-field"><span>Cellulare</span>
            <input value={v.azCel} onChange={e => txt('azCel', e.target.value)} /></label>
          <label className="maioli-imp-field maioli-imp-wide"><span>Email</span>
            <input value={v.azEmail} onChange={e => txt('azEmail', e.target.value)} /></label>
          <label className="maioli-imp-field"><span>Indirizzo</span>
            <input value={v.azIndirizzo} onChange={e => txt('azIndirizzo', e.target.value)} /></label>
          <label className="maioli-imp-field"><span>CAP e città</span>
            <input value={v.azCapCitta} onChange={e => txt('azCapCitta', e.target.value)} /></label>
          <label className="maioli-imp-field"><span>C.F. / P.IVA</span>
            <input value={v.azPiva} onChange={e => txt('azPiva', e.target.value)} /></label>
          <label className="maioli-imp-field"><span>Certificazione</span>
            <input value={v.azCertificazione} onChange={e => txt('azCertificazione', e.target.value)} /></label>
          <label className="maioli-imp-field"><span>N. Certificato</span>
            <input value={v.azNcert} onChange={e => txt('azNcert', e.target.value)} /></label>
        </div>
      </div>

      {/* ───────── Foglio ───────── */}
      <div className="maioli-imp-sec">
        <div className="maioli-imp-sec-tit">✍️ Foglio di stampa</div>
        <div className="maioli-imp-grid">
          <label className="maioli-imp-field maioli-imp-full"><span>Dichiarazione in fondo al foglio (sopra le firme)</span>
            <textarea rows={2} value={v.bollaDichiarazione} onChange={e => txt('bollaDichiarazione', e.target.value)} /></label>
        </div>
      </div>

      <div className="maioli-acc-actions">
        <button className="btn btn-primary" disabled={!dirty || saving} onClick={salva}>
          {saving ? 'Salvo…' : '💾 Salva impostazioni'}
        </button>
      </div>
    </div>
  );
}
