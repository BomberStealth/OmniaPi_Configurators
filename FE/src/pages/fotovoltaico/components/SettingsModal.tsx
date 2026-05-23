import { useState } from 'react';
import type { Catalog, CatalogKey } from '../utils/catalog';
import { ARTICLE_LABELS, DEFAULT_CATALOG, saveCatalog, resetCatalog } from '../utils/catalog';
import './SettingsModal.css';

interface Props {
  catalog: Catalog;
  onSave: (cat: Catalog) => void;
  onClose: () => void;
}

export default function SettingsModal({ catalog, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<Catalog>({ ...catalog });

  const update = (key: CatalogKey, field: 'p' | 'c' | 'd', value: string) => {
    setDraft(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const handleSave = () => {
    saveCatalog(draft);
    onSave(draft);
    onClose();
  };

  const handleReset = () => {
    if (!confirm('Reset di tutti i codici ai valori predefiniti?')) return;
    resetCatalog();
    onSave({ ...DEFAULT_CATALOG });
    onClose();
  };

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal settings-modal">
        <div className="modal-header">
          <span className="modal-title">⚙ Codici Articolo AS400</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="settings-info">Modifica i codici interni. Le modifiche vengono salvate nel browser.</div>

          <div className="settings-table-wrap">
            <table className="settings-table">
              <thead>
                <tr>
                  <th className="th-art">Articolo</th>
                  <th className="th-prec">Prec.</th>
                  <th className="th-code">Codice</th>
                  <th className="th-desc">Descrizione</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(DEFAULT_CATALOG) as CatalogKey[]).map(key => (
                  <tr key={key}>
                    <td className="td-art">{ARTICLE_LABELS[key]}</td>
                    <td>
                      <input
                        className="settings-input input-prec"
                        value={draft[key].p}
                        maxLength={3}
                        onChange={e => update(key, 'p', e.target.value.toUpperCase())}
                      />
                    </td>
                    <td>
                      <input
                        className="settings-input input-code"
                        value={draft[key].c}
                        maxLength={6}
                        onChange={e => update(key, 'c', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="settings-input input-desc"
                        value={draft[key].d}
                        onChange={e => update(key, 'd', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-danger btn-sm" onClick={handleReset}>🔄 Reset</button>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>💾 Salva</button>
        </div>
      </div>
    </div>
  );
}
