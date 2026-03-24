import { useState, useMemo } from 'react';
import { useDB } from '@/hooks/useDB';
import { ToastProvider } from '@/components/Toast';
import { ConfirmProvider } from '@/components/ConfirmDialog';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Sales from '@/pages/Sales';
import Suppliers from '@/pages/Suppliers';
import Cari from '@/pages/Cari';
import Kasa from '@/pages/Kasa';
import Bank from '@/pages/Bank';
import Reports from '@/pages/Reports';
import Stock from '@/pages/Stock';
import Monitor from '@/pages/Monitor';
import Pelet from '@/pages/Pelet';
import Partners from '@/pages/Partners';
import Settings from '@/pages/Settings';

interface Tab {
  id: string;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'dashboard', label: 'Özet', icon: '📊' },
  { id: 'products', label: 'Ürünler', icon: '📦' },
  { id: 'sales', label: 'Satış', icon: '🛒' },
  { id: 'suppliers', label: 'Tedarikçi', icon: '🏭' },
  { id: 'pelet', label: 'Pelet', icon: '🪵' },
  { id: 'cari', label: 'Cari', icon: '👤' },
  { id: 'kasa', label: 'Kasa', icon: '💰' },
  { id: 'bank', label: 'Banka', icon: '🏦' },
  { id: 'reports', label: 'Raporlar', icon: '📈' },
  { id: 'stock', label: 'Stok', icon: '🔢' },
  { id: 'monitor', label: 'İzleme', icon: '🔔' },
  { id: 'partners', label: 'Ortaklar', icon: '🤝' },
  { id: 'settings', label: 'Ayarlar', icon: '⚙️' },
];

function AppContent() {
  const { db, save, exportJSON, importJSON } = useDB();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const badges = useMemo(() => ({
    products: db.products.filter(p => p.stock === 0).length + db.products.filter(p => p.stock > 0 && p.stock <= p.minStock).length,
    sales: db.sales.filter(s => s.status === 'tamamlandi' && new Date(s.createdAt).toDateString() === new Date().toDateString()).length,
    suppliers: db.orders.filter(o => o.status === 'bekliyor').length,
    bank: db.bankTransactions.filter(t => t.status === 'unmatched').length,
    monitor: (() => {
      let c = 0;
      db.monitorRules.filter(r => r.active).forEach(r => {
        if (r.type === 'stok_sifir' && db.products.some(p => p.stock === 0)) c++;
        else if (r.type === 'stok_min' && db.products.some(p => p.stock > 0 && p.stock <= p.minStock)) c++;
      });
      return c;
    })(),
  }), [db]);

  const title = TABS.find(t => t.id === activeTab);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />
      )}

      <div style={{
        width: 220, minHeight: '100vh', background: '#0a1120', borderRight: '1px solid #1e293b',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
      }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.6rem' }}>🔥</span>
            <div>
              <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.95rem', lineHeight: 1.2 }}>Soba Yönetim</div>
              <div style={{ color: '#475569', fontSize: '0.7rem' }}>Sistemi v2.0</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {TABS.map(tab => {
            const badge = badges[tab.id as keyof typeof badges];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  border: 'none', borderRadius: 10, cursor: 'pointer', textAlign: 'left', marginBottom: 2,
                  background: isActive ? 'rgba(255,87,34,0.12)' : 'transparent',
                  color: isActive ? '#ff5722' : '#94a3b8',
                  fontWeight: isActive ? 700 : 500, fontSize: '0.88rem',
                  transition: 'all 0.15s', position: 'relative',
                }}
              >
                {isActive && <div style={{ position: 'absolute', left: 0, top: '15%', bottom: '15%', width: 3, background: '#ff5722', borderRadius: '0 2px 2px 0' }} />}
                <span style={{ fontSize: '1rem', width: 20, textAlign: 'center', flexShrink: 0 }}>{tab.icon}</span>
                <span style={{ flex: 1 }}>{tab.label}</span>
                {badge ? (
                  <span style={{ background: tab.id === 'products' ? '#ef4444' : '#f59e0b', color: '#fff', borderRadius: '50%', minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800, flexShrink: 0 }}>{badge}</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '1px solid #1e293b' }}>
          <div style={{ color: '#334155', fontSize: '0.72rem', textAlign: 'center' }}>localStorage · Veriler yerel</div>
        </div>
      </div>

      <div style={{ flex: 1, marginLeft: 220, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header style={{ background: '#0a1120', borderBottom: '1px solid #1e293b', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', top: 0, zIndex: 90 }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#f1f5f9', lineHeight: 1, margin: 0 }}>{title?.icon} {title?.label}</h1>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {badges.monitor > 0 && (
              <button onClick={() => setActiveTab('monitor')} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#ef4444', padding: '6px 12px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                🔔 {badges.monitor} uyarı
              </button>
            )}
            <div style={{ color: '#334155', fontSize: '0.78rem' }}>
              {new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: 24, maxWidth: 1400, width: '100%', boxSizing: 'border-box' }}>
          {activeTab === 'dashboard' && <Dashboard db={db} onTabChange={setActiveTab} />}
          {activeTab === 'products' && <Products db={db} save={save} />}
          {activeTab === 'sales' && <Sales db={db} save={save} />}
          {activeTab === 'suppliers' && <Suppliers db={db} save={save} />}
          {activeTab === 'pelet' && <Pelet db={db} save={save} />}
          {activeTab === 'cari' && <Cari db={db} save={save} />}
          {activeTab === 'kasa' && <Kasa db={db} save={save} />}
          {activeTab === 'bank' && <Bank db={db} save={save} />}
          {activeTab === 'reports' && <Reports db={db} />}
          {activeTab === 'stock' && <Stock db={db} save={save} />}
          {activeTab === 'monitor' && <Monitor db={db} save={save} />}
          {activeTab === 'partners' && <Partners db={db} save={save} />}
          {activeTab === 'settings' && <Settings db={db} save={save} exportJSON={exportJSON} importJSON={importJSON} />}
        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; background: #0f172a; }
        input, select, textarea, button { outline: none; font-family: inherit; }
        input:focus, select:focus, textarea:focus { border-color: #ff5722 !important; box-shadow: 0 0 0 2px rgba(255,87,34,0.2); }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AppContent />
      </ConfirmProvider>
    </ToastProvider>
  );
}
