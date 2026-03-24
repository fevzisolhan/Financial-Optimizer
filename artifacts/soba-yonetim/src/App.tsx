import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
import { formatMoney } from '@/lib/utils-tr';

const TABS = [
  { id: 'dashboard', label: 'Özet', icon: '📊', group: 'Ana' },
  { id: 'products', label: 'Ürünler', icon: '📦', group: 'Ana' },
  { id: 'sales', label: 'Satış', icon: '🛒', group: 'Ana' },
  { id: 'suppliers', label: 'Tedarikçi', icon: '🏭', group: 'Tedarik' },
  { id: 'pelet', label: 'Pelet', icon: '🪵', group: 'Tedarik' },
  { id: 'cari', label: 'Cari', icon: '👤', group: 'Finans' },
  { id: 'kasa', label: 'Kasa', icon: '💰', group: 'Finans' },
  { id: 'bank', label: 'Banka', icon: '🏦', group: 'Finans' },
  { id: 'reports', label: 'Raporlar', icon: '📈', group: 'Analiz' },
  { id: 'stock', label: 'Stok', icon: '🔢', group: 'Analiz' },
  { id: 'monitor', label: 'İzleme', icon: '🔔', group: 'Analiz' },
  { id: 'partners', label: 'Ortaklar', icon: '🤝', group: 'Sistem' },
  { id: 'settings', label: 'Ayarlar', icon: '⚙️', group: 'Sistem' },
] as const;

type TabId = typeof TABS[number]['id'];

interface SearchResult { tab: TabId; label: string; icon: string; match: string; }

function GlobalSearch({ onNavigate, db }: { onNavigate: (tab: TabId) => void; db: ReturnType<typeof useDB>['db'] }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    const res: SearchResult[] = [];

    TABS.forEach(t => {
      if (t.label.toLowerCase().includes(q)) res.push({ tab: t.id, label: t.label, icon: t.icon, match: 'Modül' });
    });

    db.products.filter(p => p.name.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q)).slice(0, 3).forEach(p => {
      res.push({ tab: 'products', label: p.name, icon: '📦', match: `${p.brand || ''} · ₺${p.price}` });
    });

    db.cari.filter(c => c.name.toLowerCase().includes(q)).slice(0, 3).forEach(c => {
      res.push({ tab: 'cari', label: c.name, icon: '👤', match: c.type === 'musteri' ? 'Müşteri' : 'Tedarikçi' });
    });

    db.suppliers.filter(s => s.name.toLowerCase().includes(q)).slice(0, 2).forEach(s => {
      res.push({ tab: 'suppliers', label: s.name, icon: '🏭', match: 'Tedarikçi' });
    });

    return res.slice(0, 8);
  }, [query, db]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569', fontSize: '0.9rem', pointerEvents: 'none' }}>🔍</span>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Ürün, müşteri, modül ara... (En az 2 harf)"
          style={{ width: '100%', padding: '9px 12px 9px 36px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f1f5f9', fontSize: '0.88rem', boxSizing: 'border-box', transition: 'all 0.2s' }}
        />
        {query && <button onClick={() => { setQuery(''); setOpen(false); }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>×</button>}
      </div>
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#1e2d44', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, zIndex: 200, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          {results.map((r, i) => (
            <button key={i} onClick={() => { onNavigate(r.tab); setQuery(''); setOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', color: '#f1f5f9', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,87,34,0.1)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'none'}>
              <span style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.06)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>{r.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.match}</div>
              </div>
              <span style={{ color: '#334155', fontSize: '0.8rem' }}>→</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AppContent() {
  const { db, save, exportJSON, importJSON } = useDB();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useCallback((tab: TabId) => { setActiveTab(tab); setSidebarOpen(false); }, []);

  const badges = useMemo(() => ({
    products: db.products.filter(p => p.stock === 0).length + db.products.filter(p => p.stock > 0 && p.stock <= p.minStock).length,
    sales: db.sales.filter(s => s.status === 'tamamlandi' && new Date(s.createdAt).toDateString() === new Date().toDateString()).length,
    suppliers: db.orders.filter(o => o.status === 'bekliyor').length,
    bank: db.bankTransactions.filter(t => t.status === 'unmatched').length,
    monitor: db.monitorRules.filter(r => r.active).reduce((c, r) => {
      if (r.type === 'stok_sifir' && db.products.some(p => p.stock === 0)) return c + 1;
      if (r.type === 'stok_min' && db.products.some(p => p.stock > 0 && p.stock <= p.minStock)) return c + 1;
      return c;
    }, 0),
  }), [db]);

  const totalKasa = useMemo(() => db.kasa.reduce((s, k) => s + (k.type === 'gelir' ? k.amount : -k.amount), 0), [db.kasa]);
  const nakit = useMemo(() => db.kasa.filter(k => k.kasa === 'nakit').reduce((s, k) => s + (k.type === 'gelir' ? k.amount : -k.amount), 0), [db.kasa]);

  const groups = ['Ana', 'Tedarik', 'Finans', 'Analiz', 'Sistem'];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a1120', color: '#f1f5f9', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99, backdropFilter: 'blur(4px)' }} />
      )}

      {/* SIDEBAR */}
      <aside style={{
        width: 232, minHeight: '100vh', background: 'linear-gradient(180deg, #080f1d 0%, #0c1628 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #ff5722, #ff8c42)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 16px rgba(255,87,34,0.4)' }}>🔥</div>
            <div>
              <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.98rem', letterSpacing: '-0.01em' }}>Soba Yönetim</div>
              <div style={{ color: '#334155', fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Sistemi v2.0</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {groups.map(group => {
            const tabs = TABS.filter(t => t.group === group);
            return (
              <div key={group} style={{ marginBottom: 6 }}>
                <div style={{ padding: '6px 10px 4px', color: '#334155', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{group}</div>
                {tabs.map(tab => {
                  const badge = badges[tab.id as keyof typeof badges];
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => navigate(tab.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                        border: 'none', borderRadius: 10, cursor: 'pointer', textAlign: 'left', marginBottom: 2,
                        background: isActive ? 'linear-gradient(90deg, rgba(255,87,34,0.18), rgba(255,87,34,0.06))' : 'transparent',
                        color: isActive ? '#ff7043' : '#64748b',
                        fontWeight: isActive ? 700 : 400, fontSize: '0.87rem',
                        transition: 'all 0.15s', position: 'relative', outline: 'none',
                        borderLeft: isActive ? '2px solid #ff5722' : '2px solid transparent',
                      }}
                      onMouseEnter={e => { if (!isActive) { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(255,255,255,0.04)'; b.style.color = '#94a3b8'; } }}
                      onMouseLeave={e => { if (!isActive) { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'transparent'; b.style.color = '#64748b'; } }}
                    >
                      <span style={{ fontSize: '0.95rem', width: 20, textAlign: 'center', flexShrink: 0, opacity: isActive ? 1 : 0.75 }}>{tab.icon}</span>
                      <span style={{ flex: 1 }}>{tab.label}</span>
                      {badge ? (
                        <span style={{ background: tab.id === 'products' ? '#ef4444' : tab.id === 'monitor' ? '#ef4444' : '#f59e0b', color: '#fff', borderRadius: '10px', minWidth: 20, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800, padding: '0 5px' }}>{badge > 99 ? '99+' : badge}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Kasa Widget */}
        <div style={{ margin: '0 10px 10px', background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.04))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '12px 14px', cursor: 'pointer' }} onClick={() => navigate('kasa')}>
          <div style={{ color: '#475569', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>💰 Toplam Kasa</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: totalKasa >= 0 ? '#10b981' : '#ef4444', letterSpacing: '-0.02em' }}>{formatMoney(totalKasa)}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#334155', fontSize: '0.68rem' }}>💵 Nakit</div>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>{formatMoney(nakit)}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#334155', fontSize: '0.68rem' }}>🏦 Banka</div>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>{formatMoney(totalKasa - nakit)}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '10px 18px 14px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ color: '#1e3a5f', fontSize: '0.68rem', textAlign: 'center' }}>🔒 localStorage · Veriler yerel ve güvenli</div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, marginLeft: 232, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* HEADER */}
        <header style={{ background: 'rgba(10,17,32,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 90, backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
            <span style={{ fontSize: '1.1rem' }}>{TABS.find(t => t.id === activeTab)?.icon}</span>
            <h1 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#f1f5f9', margin: 0, letterSpacing: '-0.01em' }}>{TABS.find(t => t.id === activeTab)?.label}</h1>
          </div>

          <GlobalSearch onNavigate={navigate} db={db} />

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            {badges.monitor > 0 && (
              <button onClick={() => navigate('monitor')} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#f87171', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, animation: 'pulse 2s infinite' }}>
                🔔 <span>{badges.monitor}</span>
              </button>
            )}
            {badges.products > 0 && (
              <button onClick={() => navigate('products')} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#fca5a5', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                📦 {badges.products} stok uyarı
              </button>
            )}
            <div style={{ color: '#1e3a5f', fontSize: '0.78rem', fontWeight: 500 }}>
              {new Date().toLocaleDateString('tr-TR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main style={{ flex: 1, padding: '24px 28px', boxSizing: 'border-box' }}>
          {activeTab === 'dashboard' && <Dashboard db={db} onTabChange={navigate} />}
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
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a1120; }
        input, select, textarea, button { outline: none; font-family: inherit; }
        input:focus, select:focus, textarea:focus { border-color: rgba(255,87,34,0.6) !important; box-shadow: 0 0 0 3px rgba(255,87,34,0.15) !important; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        tr:hover td { background: rgba(255,255,255,0.025) !important; }
        button:active { transform: scale(0.97); }
        nav::-webkit-scrollbar { width: 3px; }
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
