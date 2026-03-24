import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { genId, formatMoney, formatDate } from '@/lib/utils-tr';
import type { DB, Cari as CariType } from '@/types';

interface Props { db: DB; save: (fn: (prev: DB) => DB) => void; }

const empty: Omit<CariType, 'id' | 'createdAt' | 'updatedAt'> = { name: '', type: 'musteri', taxNo: '', phone: '', email: '', address: '', balance: 0 };

export default function Cari({ db, save }: Props) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'musteri' | 'tedarikci'>('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<Partial<CariType>>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  let cari = db.cari;
  if (filter !== 'all') cari = cari.filter(c => c.type === filter);
  if (search) cari = cari.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search));
  const sorted = [...cari].sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  const totalReceivable = db.cari.filter(c => c.type === 'musteri' && c.balance > 0).reduce((s, c) => s + c.balance, 0);
  const totalPayable = db.cari.filter(c => c.type === 'tedarikci' && c.balance > 0).reduce((s, c) => s + c.balance, 0);

  const openAdd = () => { setForm({ ...empty }); setEditId(null); setModalOpen(true); };
  const openEdit = (c: CariType) => { setForm({ ...c }); setEditId(c.id); setModalOpen(true); };

  const handleSave = () => {
    if (!form.name) { showToast('Ad gerekli!', 'error'); return; }
    const nowIso = new Date().toISOString();
    save(prev => {
      const cari = [...prev.cari];
      if (editId) {
        const i = cari.findIndex(c => c.id === editId);
        if (i >= 0) cari[i] = { ...cari[i], ...form, updatedAt: nowIso } as CariType;
        showToast('Cari güncellendi!', 'success');
      } else {
        cari.push({ id: genId(), createdAt: nowIso, updatedAt: nowIso, name: '', type: 'musteri', balance: 0, ...form } as CariType);
        showToast('Cari eklendi!', 'success');
      }
      return { ...prev, cari };
    });
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    showConfirm('Cari Sil', 'Bu cari kaydını silmek istediğinizden emin misiniz?', () => {
      save(prev => ({ ...prev, cari: prev.cari.filter(c => c.id !== id) }));
      showToast('Cari silindi!', 'success');
    });
  };

  const detail = detailId ? db.cari.find(c => c.id === detailId) : null;
  const detailKasa = detailId ? db.kasa.filter(k => k.cariId === detailId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20) : [];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="Toplam Cari" value={String(db.cari.length)} color="#3b82f6" />
        <StatCard label="Alacak" value={formatMoney(totalReceivable)} color="#10b981" sub="Müşterilerden" />
        <StatCard label="Borç" value={formatMoney(totalPayable)} color="#ef4444" sub="Tedarikçilere" />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={openAdd} style={{ background: '#ff5722', border: 'none', borderRadius: 10, color: '#fff', padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>+ Yeni Cari</button>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Ara..." style={{ flex: 1, padding: '9px 13px', background: '#1e293b', border: '1px solid #334155', borderRadius: 10, color: '#f1f5f9' }} />
        {(['all', 'musteri', 'tedarikci'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '8px 14px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', background: filter === f ? '#ff5722' : '#273548', color: filter === f ? '#fff' : '#94a3b8' }}>
            {f === 'all' ? 'Tümü' : f === 'musteri' ? '👤 Müşteri' : '🏭 Tedarikçi'}
          </button>
        ))}
      </div>

      <div style={{ background: '#1e293b', borderRadius: 14, border: '1px solid #334155', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(15,23,42,0.6)' }}>
              {['Ad', 'Tür', 'Telefon', 'Bakiye', 'Son İşlem', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Cari bulunamadı</td></tr>
            ) : sorted.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }} onClick={() => setDetailId(c.id)}>
                <td style={{ padding: '12px 16px', color: '#f1f5f9', fontWeight: 600 }}>{c.name}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: c.type === 'musteri' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)', color: c.type === 'musteri' ? '#60a5fa' : '#f59e0b', borderRadius: 6, padding: '2px 8px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {c.type === 'musteri' ? '👤 Müşteri' : '🏭 Tedarikçi'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{c.phone || '-'}</td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: c.balance > 0 ? '#10b981' : c.balance < 0 ? '#ef4444' : '#64748b' }}>{formatMoney(Math.abs(c.balance))}{c.balance > 0 ? ' ↑' : c.balance < 0 ? ' ↓' : ''}</td>
                <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.82rem' }}>{c.lastTransaction ? formatDate(c.lastTransaction) : '-'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(c)} style={{ background: 'rgba(59,130,246,0.1)', border: 'none', borderRadius: 6, color: '#60a5fa', padding: '5px 10px', cursor: 'pointer', fontSize: '0.82rem' }}>✏️</button>
                    <button onClick={() => handleDelete(c.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6, color: '#ef4444', padding: '5px 10px', cursor: 'pointer', fontSize: '0.82rem' }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? '✏️ Cari Düzenle' : '➕ Yeni Cari'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Ad *</label>
            <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inp} />
          </div>
          <div>
            <label style={lbl}>Tür</label>
            <select value={form.type || 'musteri'} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'musteri' | 'tedarikci' }))} style={inp}>
              <option value="musteri">👤 Müşteri</option>
              <option value="tedarikci">🏭 Tedarikçi</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Telefon</label>
            <input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inp} />
          </div>
          <div>
            <label style={lbl}>Vergi No</label>
            <input value={form.taxNo || ''} onChange={e => setForm(f => ({ ...f, taxNo: e.target.value }))} style={inp} />
          </div>
          <div>
            <label style={lbl}>E-posta</label>
            <input type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inp} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Adres</label>
            <textarea value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} style={{ ...inp, minHeight: 60 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={handleSave} style={{ flex: 1, background: '#10b981', border: 'none', borderRadius: 10, color: '#fff', padding: '11px 0', fontWeight: 700, cursor: 'pointer' }}>💾 Kaydet</button>
          <button onClick={() => setModalOpen(false)} style={{ background: '#273548', border: '1px solid #334155', borderRadius: 10, color: '#94a3b8', padding: '11px 20px', cursor: 'pointer' }}>İptal</button>
        </div>
      </Modal>

      {detail && (
        <Modal open={!!detailId} onClose={() => setDetailId(null)} title={`📋 ${detail.name}`} maxWidth={640}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <InfoRow label="Tür" value={detail.type === 'musteri' ? 'Müşteri' : 'Tedarikçi'} />
            <InfoRow label="Telefon" value={detail.phone || '-'} />
            <InfoRow label="E-posta" value={detail.email || '-'} />
            <InfoRow label="Vergi No" value={detail.taxNo || '-'} />
            <InfoRow label="Bakiye" value={formatMoney(Math.abs(detail.balance))} color={detail.balance > 0 ? '#10b981' : '#ef4444'} />
          </div>
          <h4 style={{ color: '#94a3b8', marginBottom: 12, fontSize: '0.85rem', fontWeight: 600 }}>Son İşlemler</h4>
          {detailKasa.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>İşlem bulunamadı</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    {['Tarih', 'Açıklama', 'Tutar', 'Tür'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#64748b', fontSize: '0.75rem' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {detailKasa.map(k => (
                    <tr key={k.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '8px 10px', color: '#64748b' }}>{formatDate(k.createdAt)}</td>
                      <td style={{ padding: '8px 10px', color: '#f1f5f9' }}>{k.description || '-'}</td>
                      <td style={{ padding: '8px 10px', color: k.type === 'gelir' ? '#10b981' : '#ef4444', fontWeight: 700 }}>{k.type === 'gelir' ? '+' : '-'}{formatMoney(k.amount)}</td>
                      <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{k.kasa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 };
const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'rgba(15,23,42,0.6)', border: '1px solid #334155', borderRadius: 10, color: '#f1f5f9', fontSize: '0.9rem', boxSizing: 'border-box' };

function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: '16px 18px', border: `1px solid ${color}22` }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ color: '#475569', fontSize: '0.75rem', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{label}</div>
      <div style={{ color: color || '#f1f5f9', fontWeight: 600, fontSize: '0.9rem', marginTop: 2 }}>{value}</div>
    </div>
  );
}
