import { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface ConfirmOpts {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

const Ctx = createContext<(opts: ConfirmOpts) => Promise<boolean>>(async () => false);
export const useConfirm = () => useContext(Ctx);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ opts: ConfirmOpts; resolve: (b: boolean) => void } | null>(null);

  const confirm = useCallback((opts: ConfirmOpts) => new Promise<boolean>(resolve => setState({ opts, resolve })), []);
  const close = (v: boolean) => { state?.resolve(v); setState(null); };

  return (
    <Ctx.Provider value={confirm}>
      {children}
      {state && createPortal(
        <div className="maioli-confirm-ov" onMouseDown={() => close(false)}>
          <div className="maioli-confirm" onMouseDown={e => e.stopPropagation()}>
            {state.opts.title && <div className="maioli-confirm-title">{state.opts.title}</div>}
            <div className="maioli-confirm-msg">{state.opts.message}</div>
            <div className="maioli-confirm-actions">
              <button type="button" className="btn btn-secondary" onClick={() => close(false)}>{state.opts.cancelLabel ?? 'Annulla'}</button>
              <button type="button" className={`btn ${state.opts.danger ? 'maioli-btn-danger' : 'btn-primary'}`} onClick={() => close(true)}>
                {state.opts.confirmLabel ?? 'Conferma'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </Ctx.Provider>
  );
}
