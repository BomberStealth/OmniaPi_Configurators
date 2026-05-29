export default function InfoPage() {
  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, color: 'var(--text)' }}>
        OmniaPi Configuratori
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, maxWidth: 560 }}>
        Piattaforma interna per la configurazione di impianti fotovoltaici, inverter e strutture.
        Genera automaticamente distinte materiali e macro AS400.
      </p>
    </div>
  );
}
