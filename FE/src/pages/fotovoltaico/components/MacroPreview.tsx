import './MacroPreview.css';

interface Props {
  xml: string;
  filename: string;
  previewInfo: string;
  onDownload: () => void;
}

export default function MacroPreview({ xml, filename, previewInfo, onDownload }: Props) {
  return (
    <div className="macro-preview">
      <div className="macro-preview-header">
        <div className="macro-preview-title">
          Macro AS400 — <span className="macro-info">{previewInfo}</span>
        </div>
        <div className="macro-preview-actions">
          <span className="macro-filename">{filename}</span>
          <button className="btn btn-blue btn-sm" onClick={onDownload}>
            ⬇ Scarica .mac
          </button>
        </div>
      </div>
      <pre className="macro-content">{xml}</pre>
    </div>
  );
}
