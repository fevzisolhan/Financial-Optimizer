import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

interface ConfirmContextType {
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const ConfirmContext = createContext<ConfirmContextType>({ showConfirm: () => {} });

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState>({ open: false, title: '', message: '', onConfirm: () => {} });

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    setState({ open: true, title, message, onConfirm });
  }, []);

  const handleConfirm = () => {
    state.onConfirm();
    setState(s => ({ ...s, open: false }));
  };

  const handleCancel = () => setState(s => ({ ...s, open: false }));

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      {state.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 28, maxWidth: 380, width: '100%', border: '1px solid #334155', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 10 }}>{state.title}</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: 24 }}>{state.message}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleConfirm} style={{ flex: 1, padding: '10px 0', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                Evet, Sil
              </button>
              <button onClick={handleCancel} style={{ flex: 1, padding: '10px 0', background: '#273548', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
