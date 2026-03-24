import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { formatMoney, formatDate } from '@/lib/utils-tr';
import type { DB } from '@/types';

interface Props {
  db: DB;
  onTabChange: (tab: string) => void;
}

function StatCard({ icon, label, value, color, gradient, sub, onClick, trend }: {
  icon: string; label: string; value: string; color: string; gradient: string; sub?: string; onClick?: () => void; trend?: number;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: `linear-gradient(135deg, ${gradient})`,
        borderRadius: 16, padding: '20px 22px',
        border: `1px solid ${color}22`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => { if (onClick) { const d = e.currentTarget as HTMLDivElement; d.style.transform = 'translateY(-3px)'; d.style.boxShadow = `0 12px 40px ${color}22`; } }}
      onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.transform = ''; d.style.boxShadow = ''; }}
    >
      <div style={{ position: 'absolute', top: -20, right: -14, fontSize: '5rem', opacity: 0.06, pointerEvents: 'none', transform: 'rotate(-10deg)' }}>{icon}</div>
      <div style={{ fontSize: '1.4rem', marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 900, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      {trend !== undefined && (
        <div style={{ fontSize: '0.75rem', color: trend >= 0 ? '#10b981' : '#ef4444', fontWeight: 600, marginTop: 3 }}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}% dün
        </div>
      )}
      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 6 }}>{label}</div>
      {sub && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: 3 }}>{sub}</div>}
      {onClick && <div style={{ position: 'absolute', bottom: 14, right: 16, color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>→</div>}
    </div>
  );
}

const chartStyle = {
  contentStyle: { background: '#0f1e35', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: '0.82rem' },
  labelStyle: { color: '#94a3b8' },
};

export default function Dashboard({ db, onTabChange }: Props) {
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todaySales = db.sales.filter(s => s.status === 'tamamlandi' && new Date(s.createdAt).toDateString() === today);
    const todayRevenue = todaySales.reduce((s, sale) => s + sale.total, 0);
    const todayProfit = todaySales.reduce((s, sale) => s + sale.profit, 0);

    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yestSales = db.sales.filter(s => s.status === 'tamamlandi' && new Date(s.createdAt).toDateString() === yesterday.toDateString());
    const yestRevenue = yestSales.reduce((s, sale) => s + sale.total, 0);
    const revTrend = yestRevenue > 0 ? ((todayRevenue - yestRevenue) / yestRevenue) * 100 : 0;

    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const monthSales = db.sales.filter(s => s.status === 'tamamlandi' && new Date(s.createdAt) >= monthStart);
    const monthRevenue = monthSales.reduce((s, sale) => s + sale.total, 0);
    const monthProfit = monthSales.reduce((s, sale) => s + sale.profit, 0);

    const outOfStock = db.products.filter(p => p.stock === 0).length;
    const lowStock = db.products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;

    const totalKasa = db.kasa.reduce((s, k) => s + (k.type === 'gelir' ? k.amount : -k.amount), 0);
    const nakit = db.kasa.filter(k => k.kasa === 'nakit').reduce((s, k) => s + (k.type === 'gelir' ? k.amount : -k.amount), 0);
    const banka = db.kasa.filter(k => k.kasa === 'banka').reduce((s, k) => s + (k.type === 'gelir' ? k.amount : -k.amount), 0);

    const pendingOrders = db.orders.filter(o => o.status === 'bekliyor').length;
    const totalReceivable = db.cari.filter(c => c.type === 'musteri' && c.balance > 0).reduce((s, c) => s + c.balance, 0);
    const stokDeger = db.products.reduce((s, p) => s + p.cost * p.stock, 0);

    return { todayRevenue, todayProfit, todaySalesCount: todaySales.length, monthRevenue, monthProfit, outOfStock, lowStock, totalKasa, nakit, banka, pendingOrders, totalReceivable, stokDeger, revTrend };
  }, [db]);

  const chartData = useMemo(() => {
    const days: Record<string, { revenue: number; profit: number; count: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
      days[key] = { revenue: 0, profit: 0, count: 0 };
    }
    db.sales.filter(s => s.status === 'tamamlandi').forEach(s => {
      const diff = Math.floor((Date.now() - new Date(s.createdAt).getTime()) / 86400000);
      if (diff <= 6) {
        const key = new Date(s.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
        if (days[key]) { days[key].revenue += s.total; days[key].profit += s.profit; days[key].count++; }
      }
    });
    return Object.entries(days).map(([date, v]) => ({ date, ...v }));
  }, [db.sales]);

  const categoryRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    db.sales.filter(s => s.status === 'tamamlandi').forEach(s => {
      const cat = s.productCategory || 'Diğer';
      map[cat] = (map[cat] || 0) + s.total;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [db.sales]);

  const recentSales = [...db.sales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);
  const recentActivity = [...db._activityLog].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard icon="💰" label="Bugün Ciro" value={formatMoney(stats.todayRevenue)} color="#10b981" gradient="rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%" sub={`${stats.todaySalesCount} satış`} onClick={() => onTabChange('sales')} trend={stats.revTrend} />
        <StatCard icon="📈" label="Bugün Kâr" value={formatMoney(stats.todayProfit)} color="#3b82f6" gradient="rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.04) 100%" sub={`${stats.todayRevenue > 0 ? ((stats.todayProfit / stats.todayRevenue) * 100).toFixed(1) : 0}% marj`} />
        <StatCard icon="📅" label="Bu Ay Ciro" value={formatMoney(stats.monthRevenue)} color="#8b5cf6" gradient="rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 100%" sub={`Kâr: ${formatMoney(stats.monthProfit)}`} />
        <StatCard icon="📦" label="Stok Değeri" value={formatMoney(stats.stokDeger)} color="#f59e0b" gradient="rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 100%" onClick={() => onTabChange('stock')} sub={`${db.products.length} ürün`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard icon="💵" label="Nakit Kasa" value={formatMoney(stats.nakit)} color="#06b6d4" gradient="rgba(6,182,212,0.12) 0%, rgba(6,182,212,0.04) 100%" onClick={() => onTabChange('kasa')} />
        <StatCard icon="🏦" label="Banka" value={formatMoney(stats.banka)} color="#6366f1" gradient="rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.04) 100%" onClick={() => onTabChange('kasa')} />
        <StatCard icon="📋" label="Alacak" value={formatMoney(stats.totalReceivable)} color="#ff5722" gradient="rgba(255,87,34,0.12) 0%, rgba(255,87,34,0.04) 100%" onClick={() => onTabChange('cari')} />
        <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(245,158,11,0.06) 100%)', borderRadius: 16, padding: '20px 22px', border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer' }} onClick={() => onTabChange('products')}>
          <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>⚠️</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ef4444', letterSpacing: '-0.02em' }}>{stats.outOfStock}</div>
              <div style={{ color: 'rgba(239,68,68,0.6)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bitti</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f59e0b', letterSpacing: '-0.02em' }}>{stats.lowStock}</div>
              <div style={{ color: 'rgba(245,158,11,0.6)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Az Stok</div>
            </div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', marginTop: 8, fontWeight: 500 }}>STOK UYARILARI →</div>
        </div>
      </div>

      {/* CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, marginBottom: 18 }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', borderRadius: 18, padding: '22px 22px 14px', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <h3 style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' }}>Son 7 Günlük Performans</h3>
              <p style={{ color: '#475569', fontSize: '0.78rem', marginTop: 2 }}>Ciro ve kâr trendi</p>
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              <LegendDot color="#ff5722" label="Ciro" />
              <LegendDot color="#10b981" label="Kâr" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="ciroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff5722" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ff5722" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="karGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
              <Tooltip formatter={(v: number, n: string) => [formatMoney(v), n === 'revenue' ? 'Ciro' : 'Kâr']} {...chartStyle} />
              <Area type="monotone" dataKey="revenue" stroke="#ff5722" strokeWidth={2.5} fill="url(#ciroGrad)" dot={false} />
              <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} fill="url(#karGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', borderRadius: 18, padding: '22px', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem', marginBottom: 4 }}>📊 Hızlı Özet</h3>
          <p style={{ color: '#475569', fontSize: '0.78rem', marginBottom: 18 }}>Genel durum</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <QuickStat label="Toplam Ürün" value={String(db.products.length)} color="#3b82f6" icon="📦" />
            <QuickStat label="Toplam Satış" value={String(db.sales.filter(s => s.status === 'tamamlandi').length)} color="#10b981" icon="🛒" />
            <QuickStat label="Tedarikçi" value={String(db.suppliers.length)} color="#f59e0b" icon="🏭" />
            <QuickStat label="Cari Müşteri" value={String(db.cari.filter(c => c.type === 'musteri').length)} color="#8b5cf6" icon="👤" />
            <QuickStat label="Bek. Sipariş" value={String(stats.pendingOrders)} color="#ef4444" icon="📋" />
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Recent Sales */}
        <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' }}>🛒 Son Satışlar</h3>
              <p style={{ color: '#334155', fontSize: '0.75rem', marginTop: 2 }}>{db.sales.length} toplam kayıt</p>
            </div>
            <button onClick={() => onTabChange('sales')} style={{ background: 'rgba(255,87,34,0.1)', border: '1px solid rgba(255,87,34,0.2)', borderRadius: 8, color: '#ff7043', padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}>Tümü →</button>
          </div>
          <div>
            {recentSales.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#1e3a5f' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🛒</div>
                <p style={{ fontSize: '0.85rem' }}>Henüz satış yok</p>
              </div>
            ) : recentSales.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderTop: i === 0 ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
                <div style={{ width: 34, height: 34, background: s.status === 'tamamlandi' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>
                  {s.status === 'tamamlandi' ? '✓' : '↩'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.productName}</div>
                  <div style={{ color: '#334155', fontSize: '0.75rem', marginTop: 1 }}>{formatDate(s.createdAt)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.88rem' }}>{formatMoney(s.total)}</div>
                  <div style={{ color: '#1e3a5f', fontSize: '0.72rem' }}>{s.payment}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity + Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(stats.outOfStock > 0 || stats.lowStock > 0) && (
            <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(245,158,11,0.04) 100%)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: '1rem' }}>⚠️</span>
                <span style={{ fontWeight: 700, color: '#fca5a5', fontSize: '0.9rem' }}>Stok Uyarıları</span>
                <button onClick={() => onTabChange('products')} style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 6, color: '#f87171', padding: '3px 10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>Görüntüle →</button>
              </div>
              {stats.outOfStock > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                  <span style={{ color: '#94a3b8', fontSize: '0.83rem' }}><strong style={{ color: '#f87171' }}>{stats.outOfStock} ürün</strong> stok bitti</span>
                </div>
              )}
              {stats.lowStock > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                  <span style={{ color: '#94a3b8', fontSize: '0.83rem' }}><strong style={{ color: '#fbbf24' }}>{stats.lowStock} üründe</strong> az stok uyarısı</span>
                </div>
              )}
            </div>
          )}

          <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)', flex: 1 }}>
            <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <h3 style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' }}>📋 Son Aktiviteler</h3>
            </div>
            <div style={{ padding: '10px 0' }}>
              {recentActivity.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#1e3a5f', fontSize: '0.83rem' }}>Aktivite bulunamadı</div>
              ) : recentActivity.map((a, i) => (
                <div key={a.id} style={{ display: 'flex', gap: 10, padding: '8px 20px', alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#334155', flexShrink: 0, marginTop: 6 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.83rem', lineHeight: 1.4 }}>{a.action}</div>
                    {a.detail && <div style={{ color: '#334155', fontSize: '0.75rem', marginTop: 1 }}>{a.detail}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      <span style={{ color: '#475569', fontSize: '0.75rem' }}>{label}</span>
    </div>
  );
}

function QuickStat({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 32, height: 32, background: `${color}15`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>{icon}</div>
      <span style={{ flex: 1, color: '#64748b', fontSize: '0.83rem' }}>{label}</span>
      <span style={{ fontWeight: 700, color, fontSize: '0.95rem' }}>{value}</span>
    </div>
  );
}
