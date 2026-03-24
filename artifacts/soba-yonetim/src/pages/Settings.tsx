import { useState } from 'react';
import { useToast } from '@/components/Toast';
import type { DB } from '@/types';

interface Props { db: DB; save: (fn: (prev: DB) => DB) => void; exportJSON: () => void; importJSON: (f: File) => Promise<boolean>; }

export default function Settings({ db, save, exportJSON, importJSON }: Props) {
  const { showToast } = useToast();
  const [company, setCompany] = useState({ ...db.company });
  const [pellet, setPellet] = useState({ ...db.pelletSettings });
  const [tab, setTab] = useState<'company' | 'pellet' | 'backup'>('company');

  const saveCompany = () => {
    save(prev => ({ ...prev, company: { ...company, id: prev.company.id, createdAt: prev.company.createdAt } }));
    showToast('Şirket bilgileri kaydedildi!', 'success');
  };

  const savePellet = () => {
    save(prev => ({ ...prev, pelletSettings: { ...pellet } }));
    showToast('Pelet ayarları kaydedildi!', 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importJSON(file).then(ok => {
      if (ok) showToast('Veriler yüklendi!', 'success');
      else showToast('Dosya okunamadı!', 'error');
    });
  };

  const clearData = () => {
    if (window.confirm('TÜM VERİLER SİLİNECEK! Emin misiniz?')) {
      localStorage.removeItem('sobaYonetim');
      window.location.reload();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['company', 'pellet', 'backup'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, background: tab === t ? '#ff5722' : '#273548', color: tab === t ? '#fff' : '#94a3b8' }}>
            {t === 'company' ? '🏢 Şirket' : t === 'pellet' ? '🪵 Pelet' : '💾 Yedek'}
          </button>
        ))}
      </div>

      {tab === 'company' && (
        <div style={{ background: '#1e293b', borderRadius: 14, padding: 24, border: '1px solid #334155', maxWidth: 560 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 20, color: '#f1f5f9' }}>🏢 Şirket Bilgileri</h3>
          <div style={{ display: 'grid', gap: 14 }}>
            <FV label="Şirket Adı" value={company.name || ''} onChange={v => setCompany(c => ({ ...c, name: v }))} />
            <FV label="Vergi No" value={company.taxNo || ''} onChange={v => setCompany(c => ({ ...c, taxNo: v }))} />
            <FV label="Telefon" value={company.phone || ''} onChange={v => setCompany(c => ({ ...c, phone: v }))} />
            <FV label="E-posta" type="email" value={company.email || ''} onChange={v => setCompany(c => ({ ...c, email: v }))} />
            <div>
              <label style={lbl}>Adres</label>
              <textarea value={company.address || ''} onChange={e => setCompany(c => ({ ...c, address: e.target.value }))} style={{ ...inp, minHeight: 70 }} />
            </div>
            <button onClick={saveCompany} style={{ background: '#10b981', border: 'none', borderRadius: 10, color: '#fff', padding: '12px 0', fontWeight: 700, cursor: 'pointer' }}>💾 Kaydet</button>
          </div>
        </div>
      )}

      {tab === 'pellet' && (
        <div style={{ background: '#1e293b', borderRadius: 14, padding: 24, border: '1px solid #334155', maxWidth: 480 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 20, color: '#f1f5f9' }}>🪵 Pelet Ayarları</h3>
          <div style={{ display: 'grid', gap: 14 }}>
            <FV label="Gramaj (g/saat)" type="number" value={String(pellet.gramaj)} onChange={v => setPellet(p => ({ ...p, gramaj: parseFloat(v) || 0 }))} />
            <FV label="Kg Fiyatı (₺)" type="number" value={String(pellet.kgFiyat)} onChange={v => setPellet(p => ({ ...p, kgFiyat: parseFloat(v) || 0 }))} />
            <FV label="Çuval Ağırlığı (kg)" type="number" value={String(pellet.cuvalKg)} onChange={v => setPellet(p => ({ ...p, cuvalKg: parseFloat(v) || 0 }))} />
            <FV label="Kritik Gün Sayısı" type="number" value={String(pellet.critDays)} onChange={v => setPellet(p => ({ ...p, critDays: parseInt(v) || 0 }))} />
            <div style={{ background: '#0f172a', borderRadius: 10, padding: '12px 16px' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Saatlik maliyet: <strong style={{ color: '#ff5722' }}>₺{((pellet.gramaj / 1000) * pellet.kgFiyat).toFixed(4)}</strong></p>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>Çuval başına: <strong style={{ color: '#ff5722' }}>₺{(pellet.cuvalKg * pellet.kgFiyat).toFixed(2)}</strong></p>
            </div>
            <button onClick={savePellet} style={{ background: '#10b981', border: 'none', borderRadius: 10, color: '#fff', padding: '12px 0', fontWeight: 700, cursor: 'pointer' }}>💾 Kaydet</button>
          </div>
        </div>
      )}

      {tab === 'backup' && (
        <div style={{ display: 'grid', gap: 16, maxWidth: 560 }}>
          <div style={{ background: '#1e293b', borderRadius: 14, padding: 24, border: '1px solid #334155' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 8, color: '#f1f5f9' }}>💾 Yedek Al</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: 16 }}>Tüm verilerinizi JSON formatında indirin.</p>
            <button onClick={exportJSON} style={{ background: '#3b82f6', border: 'none', borderRadius: 10, color: '#fff', padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}>📥 JSON İndir</button>
          </div>
          <div style={{ background: '#1e293b', borderRadius: 14, padding: 24, border: '1px solid #334155' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 8, color: '#f1f5f9' }}>📤 Yedek Yükle</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: 16 }}>Daha önce aldığınız yedek dosyasını geri yükleyin.</p>
            <label style={{ display: 'inline-block', background: '#f59e0b', borderRadius: 10, color: '#fff', padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}>
              📤 JSON Yükle
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
          </div>
          <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 14, padding: 24, border: '1px solid rgba(239,68,68,0.2)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 8, color: '#ef4444' }}>⚠️ Tüm Verileri Sil</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: 16 }}>Bu işlem geri alınamaz. Önce yedek alın!</p>
            <button onClick={clearData} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#ef4444', padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}>🗑️ Tüm Verileri Sil</button>
          </div>

          <div style={{ background: '#1e293b', borderRadius: 14, padding: 20, border: '1px solid #334155' }}>
            <h4 style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>📊 Veri Özeti</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[
                { label: 'Ürünler', value: db.products.length },
                { label: 'Satışlar', value: db.sales.length },
                { label: 'Tedarikçiler', value: db.suppliers.length },
                { label: 'Cari', value: db.cari.length },
                { label: 'Kasa Kayıtları', value: db.kasa.length },
                { label: 'Stok Hareketleri', value: db.stockMovements.length },
              ].map(s => (
                <div key={s.label} style={{ background: '#0f172a', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ff5722' }}>{s.value}</div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 };
const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'rgba(15,23,42,0.6)', border: '1px solid #334155', borderRadius: 10, color: '#f1f5f9', fontSize: '0.9rem', boxSizing: 'border-box' };

function FV({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inp} />
    </div>
  );
}
