import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatMoney, formatDate } from '@/lib/utils-tr';
import type { DB } from '@/types';

interface Props {
  db: DB;
  onTabChange: (tab: string) => void;
}

export default function Dashboard({ db, onTabChange }: Props) {
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todaySales = db.sales.filter(s => s.status === 'tamamlandi' && new Date(s.createdAt).toDateString() === today);
    const todayRevenue = todaySales.reduce((s, sale) => s + sale.total, 0);
    const todayProfit = todaySales.reduce((s, sale) => s + sale.profit, 0);

    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
    const monthSales = db.sales.filter(s => s.status === 'tamamlandi' && new Date(s.createdAt) >= monthStart);
    const monthRevenue = monthSales.reduce((s, sale) => s + sale.total, 0);

    const outOfStock = db.products.filter(p => p.stock === 0).length;
    const lowStock = db.products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;

    const totalKasa = db.kasa.reduce((s, k) => s + (k.type === 'gelir' ? k.amount : -k.amount), 0);
    const nakit = db.kasa.filter(k => k.kasa === 'nakit').reduce((s, k) => s + (k.type === 'gelir' ? k.amount : -k.amount), 0);
    const banka = db.kasa.filter(k => k.kasa === 'banka').reduce((s, k) => s + (k.type === 'gelir' ? k.amount : -k.amount), 0);

    const pendingOrders = db.orders.filter(o => o.status === 'bekliyor').length;
    const totalReceivable = db.cari.filter(c => c.type === 'musteri' && c.balance > 0).reduce((s, c) => s + c.balance, 0);

    return { todayRevenue, todayProfit, todaySalesCount: todaySales.length, monthRevenue, outOfStock, lowStock, totalKasa, nakit, banka, pendingOrders, totalReceivable };
  }, [db]);

  const chartData = useMemo(() => {
    const days: Record<string, { revenue: number; profit: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
      days[key] = { revenue: 0, profit: 0 };
    }
    db.sales.filter(s => s.status === 'tamamlandi').forEach(s => {
      const d = new Date(s.createdAt);
      const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
      if (diff <= 6) {
        const key = d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
        if (days[key]) { days[key].revenue += s.total; days[key].profit += s.profit; }
      }
    });
    return Object.entries(days).map(([date, v]) => ({ date, ...v }));
  }, [db.sales]);

  const recentSales = [...db.sales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);

  const StatCard = ({ icon, label, value, color, onClick, sub }: { icon: string; label: string; value: string; color: string; onClick?: () => void; sub?: string }) => (
    <div onClick={onClick} style={{ background: '#1e293b', borderRadius: 14, padding: 20, border: `1px solid ${color}33`, cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: color }} />
      <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon="💰" label="Bugün Ciro" value={formatMoney(stats.todayRevenue)} color="#10b981" sub={`${stats.todaySalesCount} satış`} onClick={() => onTabChange('sales')} />
        <StatCard icon="📈" label="Bugün Kâr" value={formatMoney(stats.todayProfit)} color="#3b82f6" />
        <StatCard icon="📅" label="Bu Ay Ciro" value={formatMoney(stats.monthRevenue)} color="#8b5cf6" />
        <StatCard icon="💵" label="Nakit Kasa" value={formatMoney(stats.nakit)} color="#f59e0b" onClick={() => onTabChange('kasa')} />
        <StatCard icon="🏦" label="Banka" value={formatMoney(stats.banka)} color="#06b6d4" onClick={() => onTabChange('kasa')} />
        <StatCard icon="📋" label="Alacak" value={formatMoney(stats.totalReceivable)} color="#ef4444" onClick={() => onTabChange('cari')} />
        <StatCard icon="🔴" label="Biten Stok" value={String(stats.outOfStock)} color="#ef4444" sub={`${stats.lowStock} az stok`} onClick={() => onTabChange('products')} />
        <StatCard icon="📦" label="Bekl. Sipariş" value={String(stats.pendingOrders)} color="#f59e0b" onClick={() => onTabChange('suppliers')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: '#1e293b', borderRadius: 14, padding: 20, border: '1px solid #334155' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#f1f5f9' }}>📊 Son 7 Gün Ciro</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
              <Tooltip formatter={(v: number) => [formatMoney(v), '']} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
              <Bar dataKey="revenue" fill="#ff5722" radius={[4,4,0,0]} name="Ciro" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#1e293b', borderRadius: 14, padding: 20, border: '1px solid #334155' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#f1f5f9' }}>📈 Son 7 Gün Kâr</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
              <Tooltip formatter={(v: number) => [formatMoney(v), '']} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} name="Kâr" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {(stats.outOfStock > 0 || stats.lowStock > 0) && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
          <strong style={{ color: '#ef4444' }}>⚠️ Stok Uyarısı:</strong>
          <span style={{ color: '#94a3b8', marginLeft: 8 }}>
            {stats.outOfStock > 0 && `${stats.outOfStock} ürün bitti`}
            {stats.outOfStock > 0 && stats.lowStock > 0 && ', '}
            {stats.lowStock > 0 && `${stats.lowStock} üründe az stok`}
          </span>
          <button onClick={() => onTabChange('products')} style={{ marginLeft: 16, background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 6, color: '#ef4444', padding: '4px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>Görüntüle</button>
        </div>
      )}

      <div style={{ background: '#1e293b', borderRadius: 14, border: '1px solid #334155' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 700, color: '#f1f5f9' }}>🛒 Son Satışlar</h3>
          <button onClick={() => onTabChange('sales')} style={{ background: 'rgba(255,87,34,0.1)', border: 'none', borderRadius: 8, color: '#ff5722', padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Tümünü Gör</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(15,23,42,0.6)' }}>
                {['Ürün', 'Müşteri', 'Tutar', 'Ödeme', 'Tarih', 'Durum'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentSales.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>Henüz satış yok</td></tr>
              ) : recentSales.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 16px', color: '#f1f5f9', fontSize: '0.9rem' }}>{s.productName}</td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.85rem' }}>{db.cari.find(c => c.id === s.customerId)?.name || '-'}</td>
                  <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 700 }}>{formatMoney(s.total)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderRadius: 6, padding: '2px 8px', fontSize: '0.8rem', fontWeight: 600 }}>{s.payment}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.82rem' }}>{formatDate(s.createdAt)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: s.status === 'tamamlandi' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: s.status === 'tamamlandi' ? '#10b981' : '#ef4444', borderRadius: 6, padding: '2px 8px', fontSize: '0.8rem', fontWeight: 600 }}>
                      {s.status === 'tamamlandi' ? '✓ Tamamlandı' : s.status === 'iade' ? '↩ İade' : '✕ İptal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
