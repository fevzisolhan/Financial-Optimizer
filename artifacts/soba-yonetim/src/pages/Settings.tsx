import { useState, useRef } from 'react';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import type { DB } from '@/types';

interface Props { db: DB; save: (fn: (prev: DB) => DB) => void; exportJSON: () => void; importJSON: (f: File) => Promise<boolean>; }

const TABS_LIST = [
  { id: 'company', icon: '🏢', label: 'Şirket' },
  { id: 'pellet', icon: '🪵', label: 'Pelet' },
  { id: 'backup', icon: '💾', label: 'Yedek & Geri Yükleme' },
  { id: 'shortcuts', icon: '⌨️', label: 'Kısayollar' },
  { id: 'repair', icon: '🔧', label: 'Veri Onarım' },
  { id: 'data', icon: '🗄️', label: 'Veri Yönetimi' },
] as const;

type Tab = typeof TABS_LIST[number]['id'];

export default function Settings({ db, save, exportJSON, importJSON }: Props) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [company, setCompany] = useState({ ...db.company });
  const [pellet, setPellet] = useState({ ...db.pelletSettings });
  const [tab, setTab] = useState<Tab>('company');
  const importRef = useRef<HTMLInputElement>(null);

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
    showConfirm('Veri Yükleme', 'Mevcut verileriniz TAMAMEN silinecek ve yedeğiniz geri yüklenecek. Onaylıyor musunuz?', () => {
      importJSON(file).then(ok => {
        if (ok) { showToast('✅ Veriler başarıyla geri yüklendi!', 'success'); setTimeout(() => window.location.reload(), 800); }
        else showToast('Dosya okunamadı. JSON formatını kontrol edin!', 'error');
      });
    }, true);
    if (importRef.current) importRef.current.value = '';
  };

  const clearData = () => {
    showConfirm('Tüm Verileri Sil', 'TÜM verileriniz kalıcı olarak silinecek! Bu işlem geri alınamaz. Emin misiniz?', () => {
      localStorage.removeItem('sobaYonetim');
      window.location.reload();
    }, true);
  };

  const dataStats = [
    { label: 'Ürünler', count: db.products.length, icon: '📦' },
    { label: 'Satışlar', count: db.sales.length, icon: '🛒' },
    { label: 'Tedarikçiler', count: db.suppliers.length, icon: '🏭' },
    { label: 'Cari Hesaplar', count: db.cari.length, icon: '👤' },
    { label: 'Kasa İşlemleri', count: db.kasa.length, icon: '💰' },
    { label: 'Banka İşlemleri', count: db.bankTransactions.length, icon: '🏦' },
    { label: 'Pelet Tedarikçi', count: db.peletSuppliers.length, icon: '🪵' },
    { label: 'Boru Tedarikçi', count: db.boruSuppliers.length, icon: '🔩' },
  ];

  const totalRecords = dataStats.reduce((s, d) => s + d.count, 0);

  const shortcuts = [
    { key: 'Ctrl + 1', desc: 'Özet (Dashboard)' },
    { key: 'Ctrl + 2', desc: 'Ürünler' },
    { key: 'Ctrl + 3', desc: 'Satış' },
    { key: 'Ctrl + 4', desc: 'Kasa' },
    { key: 'Ctrl + 5', desc: 'Raporlar' },
    { key: '+ Butonu', desc: 'Hızlı Eylem Menüsü (sağ alt)' },
    { key: 'Ctrl + Z', desc: 'Geri Al (tarayıcı düzeyi)' },
  ];

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap', background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 6, width: 'fit-content' }}>
        {TABS_LIST.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 16px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', background: tab === t.id ? 'linear-gradient(135deg, #ff5722, #ff7043)' : 'transparent', color: tab === t.id ? '#fff' : '#64748b', boxShadow: tab === t.id ? '0 4px 12px rgba(255,87,34,0.3)' : 'none', transition: 'all 0.15s' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Şirket Bilgileri */}
      {tab === 'company' && (
        <Card title="🏢 Şirket Bilgileri">
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FV label="Şirket Adı" value={company.name || ''} onChange={v => setCompany(c => ({ ...c, name: v }))} />
              <FV label="Vergi No" value={company.taxNo || ''} onChange={v => setCompany(c => ({ ...c, taxNo: v }))} />
              <FV label="Telefon" value={company.phone || ''} onChange={v => setCompany(c => ({ ...c, phone: v }))} />
              <FV label="E-posta" type="email" value={company.email || ''} onChange={v => setCompany(c => ({ ...c, email: v }))} />
            </div>
            <div><label style={lbl}>Adres</label><textarea value={company.address || ''} onChange={e => setCompany(c => ({ ...c, address: e.target.value }))} style={{ ...inp, minHeight: 70 }} /></div>
            <button onClick={saveCompany} style={btnPrimary}>💾 Şirket Bilgilerini Kaydet</button>
          </div>
        </Card>
      )}

      {/* Pelet Ayarları */}
      {tab === 'pellet' && (
        <Card title="🪵 Pelet Ayarları">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FV label="Gramaj (gr/torba)" type="number" value={String(pellet.gramaj)} onChange={v => setPellet(p => ({ ...p, gramaj: parseFloat(v) || 0 }))} />
            <FV label="Kg Fiyatı (₺)" type="number" value={String(pellet.kgFiyat)} onChange={v => setPellet(p => ({ ...p, kgFiyat: parseFloat(v) || 0 }))} />
            <FV label="Çuval Kg" type="number" value={String(pellet.cuvalKg)} onChange={v => setPellet(p => ({ ...p, cuvalKg: parseFloat(v) || 0 }))} />
            <FV label="Kritik Gün Sayısı" type="number" value={String(pellet.critDays)} onChange={v => setPellet(p => ({ ...p, critDays: parseInt(v) || 0 }))} />
          </div>
          <div style={{ marginTop: 14, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 10, padding: '12px 16px', color: '#94a3b8', fontSize: '0.85rem' }}>
            💡 Mevcut değerler: {pellet.cuvalKg}kg çuval · ₺{pellet.kgFiyat}/kg · {pellet.gramaj}gr/torba
          </div>
          <button onClick={savePellet} style={{ ...btnPrimary, marginTop: 16 }}>💾 Pelet Ayarlarını Kaydet</button>
        </Card>
      )}

      {/* Yedek & Geri Yükleme */}
      {tab === 'backup' && (
        <div style={{ display: 'grid', gap: 14 }}>
          {/* Yedek Al */}
          <Card title="📤 Yedek Al">
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: 16, lineHeight: 1.6 }}>Tüm verilerinizi <strong style={{ color: '#f59e0b' }}>JSON formatında</strong> dışa aktarın. Bu dosyayı bilgisayarınıza kaydedin — yeni bir cihaza veya sonra geri yükleyebilirsiniz.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
              {dataStats.slice(0, 4).map(d => (
                <div key={d.label} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{d.icon}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9' }}>{d.count}</div>
                  <div style={{ color: '#334155', fontSize: '0.72rem' }}>{d.label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
              ✅ Toplam {totalRecords} kayıt yedeklenecek
            </div>
            <button onClick={exportJSON} style={{ ...btnPrimary, background: 'linear-gradient(135deg, #059669, #10b981)' }}>
              📥 Yedeği İndir (.json)
            </button>
          </Card>

          {/* Geri Yükle */}
          <Card title="📂 Yedeği Geri Yükle">
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: 6, lineHeight: 1.6 }}>Daha önce aldığınız <strong style={{ color: '#f59e0b' }}>JSON yedek dosyasını</strong> seçin. Mevcut tüm verileriniz silinecek ve yedeğiniz geri yüklenecektir.</p>
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#fca5a5', fontSize: '0.83rem' }}>
              ⚠️ Bu işlem mevcut verilerinizin <strong>tamamını silecektir</strong>. Önce yedek almayı unutmayın!
            </div>
            <input ref={importRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            <button onClick={() => importRef.current?.click()} style={{ width: '100%', padding: '13px 0', background: 'rgba(59,130,246,0.1)', border: '2px dashed rgba(59,130,246,0.3)', borderRadius: 12, color: '#60a5fa', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.15)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(59,130,246,0.5)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.1)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(59,130,246,0.3)'; }}>
              📂 JSON Dosyası Seç & Geri Yükle
            </button>
          </Card>
        </div>
      )}

      {/* Kısayollar */}
      {tab === 'shortcuts' && (
        <Card title="⌨️ Klavye Kısayolları">
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 16 }}>Uygulamayı daha hızlı kullanmak için aşağıdaki kısayolları kullanabilirsiniz.</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {shortcuts.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                <kbd style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, padding: '4px 10px', fontSize: '0.82rem', fontFamily: 'monospace', color: '#f59e0b', fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 2px 0 rgba(0,0,0,0.4)' }}>{s.key}</kbd>
                <span style={{ color: '#94a3b8', fontSize: '0.88rem' }}>{s.desc}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, background: 'rgba(255,87,34,0.06)', border: '1px solid rgba(255,87,34,0.15)', borderRadius: 10, padding: '12px 16px' }}>
            <p style={{ color: '#ff7043', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>💡 Hızlı Eylem Butonu (FAB)</p>
            <p style={{ color: '#64748b', fontSize: '0.83rem' }}>Ekranın sağ alt köşesindeki <strong style={{ color: '#ff7043' }}>+ turuncu buton</strong>a tıklayarak Hızlı Satış, Ürün Ekle, Gelir/Gider işlemlerini tek tıkla yapabilirsiniz.</p>
          </div>
        </Card>
      )}

      {/* Veri Onarım */}
      {tab === 'repair' && (
        <VeriOnarim db={db} save={save} showToast={showToast} showConfirm={showConfirm as (title: string, msg: string, onOk: () => void, danger?: boolean) => void} />
      )}

      {/* Veri Yönetimi */}
      {tab === 'data' && (
        <div style={{ display: 'grid', gap: 14 }}>
          <Card title="🗄️ Veri İstatistikleri">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {dataStats.map(d => (
                <div key={d.label} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{d.icon}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: d.count > 0 ? '#f1f5f9' : '#334155' }}>{d.count}</div>
                  <div style={{ color: '#334155', fontSize: '0.72rem', marginTop: 2 }}>{d.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>
              Toplam <strong style={{ color: '#f1f5f9' }}>{totalRecords}</strong> kayıt · localStorage'da saklanıyor
            </div>
          </Card>

          <Card title="🗑️ Tehlikeli Alan">
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: 16, lineHeight: 1.6 }}>Aşağıdaki işlemler <strong style={{ color: '#ef4444' }}>geri alınamaz</strong>. Önce yedek almanızı şiddetle tavsiye ederiz.</p>
            <div style={{ display: 'grid', gap: 10 }}>
              <DangerAction
                label="Satış Geçmişini Temizle"
                desc={`${db.sales.length} satış kaydı silinecek`}
                onConfirm={() => {
                  save(prev => ({ ...prev, sales: [] }));
                  showToast('Satış geçmişi temizlendi!');
                }}
              />
              <DangerAction
                label="Kasa İşlemlerini Temizle"
                desc={`${db.kasa.length} kasa kaydı silinecek`}
                onConfirm={() => {
                  save(prev => ({ ...prev, kasa: [] }));
                  showToast('Kasa temizlendi!');
                }}
              />
              <DangerAction
                label="Aktivite Günlüğünü Temizle"
                desc={`${db._activityLog.length} kayıt silinecek`}
                onConfirm={() => {
                  save(prev => ({ ...prev, _activityLog: [] }));
                  showToast('Aktivite günlüğü temizlendi!');
                }}
              />
              <button onClick={clearData} style={{ width: '100%', padding: '14px 0', background: 'linear-gradient(135deg, rgba(220,38,38,0.15), rgba(239,68,68,0.08))', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, color: '#ef4444', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem', transition: 'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(220,38,38,0.25), rgba(239,68,68,0.15))'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(220,38,38,0.15), rgba(239,68,68,0.08))'}>
                ☠️ TÜM VERİLERİ SİL ve Sıfırla
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function VeriOnarim({ db, save, showToast, showConfirm }: { db: DB; save: (fn: (prev: DB) => DB) => void; showToast: (m: string, t?: string) => void; showConfirm: (title: string, msg: string, onOk: () => void, danger?: boolean) => void }) {
  const [results, setResults] = useState<string[]>([]);

  const diagnose = () => {
    const issues: string[] = [];
    // Duplicate sales check
    const saleIds = db.sales.map(s => s.id);
    const dupSales = saleIds.length - new Set(saleIds).size;
    if (dupSales > 0) issues.push(`⚠️ ${dupSales} tekrarlanan satış kaydı`);

    // Negative stock
    const negStock = db.products.filter(p => p.stock < 0).length;
    if (negStock > 0) issues.push(`⚠️ ${negStock} ürünün stok değeri negatif`);

    // Orphaned kasa entries (cariId points to nonexistent cari)
    const cariIds = new Set(db.cari.map(c => c.id));
    const orphanKasa = db.kasa.filter(k => k.cariId && !cariIds.has(k.cariId)).length;
    if (orphanKasa > 0) issues.push(`⚠️ ${orphanKasa} kasa kaydı silinmiş cariye bağlı`);

    // Products with no stock movement but has sales
    const soldProductIds = new Set(db.sales.flatMap(s => s.items?.map((i: { productId: string }) => i.productId) || [s.productId]).filter(Boolean));
    const stocklessProducts = db.products.filter(p => soldProductIds.has(p.id) && p.stock === 0).length;
    if (stocklessProducts > 0) issues.push(`ℹ️ ${stocklessProducts} ürün satıldı ama stok sıfır`);

    // Missing company info
    if (!db.company.name) issues.push('ℹ️ Şirket adı girilmemiş (Fatura/Raporlarda görünür)');

    // localStorage size
    const lsSize = new Blob([localStorage.getItem('sobaYonetim') || '']).size;
    const lsKB = Math.round(lsSize / 1024);
    issues.push(`📊 localStorage boyutu: ${lsKB} KB (limit ~5MB)`);

    // Invoice without cari link
    const orphanInvoices = (db.invoices || []).filter(inv => inv.cariId && !cariIds.has(inv.cariId)).length;
    if (orphanInvoices > 0) issues.push(`⚠️ ${orphanInvoices} fatura silinmiş cariye bağlı`);

    setResults(issues.length === 0 ? ['✅ Veri tutarlılık kontrolü tamam. Sorun bulunamadı!'] : issues);
  };

  const fixNegativeStock = () => {
    showConfirm('Stok Düzelt', 'Negatif stoklar sıfıra çekilecek. Devam edilsin mi?', () => {
      save(prev => ({ ...prev, products: prev.products.map(p => p.stock < 0 ? { ...p, stock: 0 } : p) }));
      showToast('Negatif stoklar düzeltildi!');
      diagnose();
    });
  };

  const fixOrphanKasa = () => {
    showConfirm('Orphan Temizle', 'Silinmiş cariye ait kasa kayıtlarındaki cari bağlantısı kaldırılacak. Devam?', () => {
      const cariIds = new Set(db.cari.map(c => c.id));
      save(prev => ({ ...prev, kasa: prev.kasa.map(k => k.cariId && !cariIds.has(k.cariId) ? { ...k, cariId: undefined } : k) }));
      showToast('Orphan kasa kayıtları düzeltildi!');
      diagnose();
    });
  };

  const recalcCariBalance = () => {
    showConfirm('Bakiye Yeniden Hesapla', 'Tüm cari bakiyeleri kasa işlemlerine göre sıfırdan hesaplanacak. Mevcut bakiyeler SIFIRLANACAK!', () => {
      save(prev => {
        const cari = prev.cari.map(c => {
          const kasaEntries = prev.kasa.filter(k => k.cariId === c.id);
          const newBalance = kasaEntries.reduce((s, k) => s + (k.type === 'gelir' ? k.amount : -k.amount), 0);
          return { ...c, balance: newBalance };
        });
        return { ...prev, cari };
      });
      showToast('Cari bakiyeler yeniden hesaplandı!');
      diagnose();
    }, true);
  };

  const removeDupSales = () => {
    showConfirm('Tekrarları Temizle', 'Aynı ID\'li tekrarlanan satış kayıtları silinecek. Devam edilsin mi?', () => {
      save(prev => {
        const seen = new Set<string>();
        return { ...prev, sales: prev.sales.filter(s => { if (seen.has(s.id)) return false; seen.add(s.id); return true; }) };
      });
      showToast('Tekrarlanan satışlar temizlendi!');
      diagnose();
    });
  };

  const mergeduplicateCari = () => {
    const nameCounts: Record<string, string[]> = {};
    db.cari.forEach(c => { const n = c.name.trim().toLowerCase(); if (!nameCounts[n]) nameCounts[n] = []; nameCounts[n].push(c.id); });
    const dups = Object.entries(nameCounts).filter(([, ids]) => ids.length > 1);
    if (dups.length === 0) { showToast('Tekrarlanan cari bulunamadı!'); return; }
    showConfirm('Cari Birleştir', `${dups.length} isimde tekrar var. Her grup için ilk kaydı koruyup diğerleri silinecek. Devam?`, () => {
      save(prev => {
        const toRemove = new Set<string>();
        dups.forEach(([, ids]) => ids.slice(1).forEach(id => toRemove.add(id)));
        return { ...prev, cari: prev.cari.filter(c => !toRemove.has(c.id)) };
      });
      showToast(`${dups.length} grup birleştirildi!`);
      diagnose();
    }, true);
  };

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <Card title="🔧 Veri Tutarlılık Kontrolü">
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 16, lineHeight: 1.6 }}>
          Veritabanınızı analiz ederek tutarsız, eksik veya hatalı kayıtları tespit edin.
        </p>
        <button onClick={diagnose} style={{ width: '100%', padding: '13px 0', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem', marginBottom: 14 }}>
          🔍 Veriyi Analiz Et
        </button>
        {results.length > 0 && (
          <div style={{ display: 'grid', gap: 6 }}>
            {results.map((r, i) => (
              <div key={i} style={{ padding: '10px 14px', background: r.startsWith('✅') ? 'rgba(16,185,129,0.08)' : r.startsWith('📊') ? 'rgba(59,130,246,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${r.startsWith('✅') ? 'rgba(16,185,129,0.2)' : r.startsWith('📊') ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)'}`, borderRadius: 9, color: '#e2e8f0', fontSize: '0.85rem' }}>
                {r}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="🛠️ Onarım Araçları">
        <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: 16, lineHeight: 1.6 }}>
          Tespit edilen sorunları otomatik düzeltmek için aşağıdaki araçları kullanın. Her işlem onay ister.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            { label: '📦 Negatif Stokları Sıfırla', desc: 'Stok değeri 0\'ın altına düşmüş ürünleri sıfıra çeker', action: fixNegativeStock, color: '#f59e0b' },
            { label: '🔗 Orphan Kasa Bağlantılarını Temizle', desc: 'Silinmiş cariye bağlı kasa kayıtlarındaki bağlantıyı kaldırır', action: fixOrphanKasa, color: '#3b82f6' },
            { label: '⚖️ Cari Bakiyeleri Yeniden Hesapla', desc: 'Tüm bakiyeleri kasa işlemlerine göre baştan hesaplar', action: recalcCariBalance, color: '#8b5cf6' },
            { label: '🗑️ Tekrarlayan Satış Kayıtlarını Temizle', desc: 'Aynı ID ile çift kaydedilmiş satışları siler', action: removeDupSales, color: '#10b981' },
            { label: '🤝 Aynı İsimli Cari Hesapları Birleştir', desc: 'Aynı isimde birden fazla cari varsa tek kayıt bırakır', action: mergeduplicateCari, color: '#ef4444' },
          ].map(t => (
            <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: 10, border: `1px solid ${t.color}15` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.88rem' }}>{t.label}</div>
                <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: 2 }}>{t.desc}</div>
              </div>
              <button onClick={t.action} style={{ background: `${t.color}15`, border: `1px solid ${t.color}30`, borderRadius: 8, color: t.color, padding: '7px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                Uygula
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card title="📋 Sistem Bilgileri">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Toplam Kayıt', value: `${[db.products, db.sales, db.cari, db.kasa, db.invoices || [], db.budgets || []].reduce((s, a) => s + a.length, 0)} kayıt` },
            { label: 'localStorage Boyutu', value: `${Math.round(new Blob([localStorage.getItem('sobaYonetim') || '']).size / 1024)} KB` },
            { label: 'Uygulama Versiyonu', value: `v${db._version || 1}` },
            { label: 'Son Veri Güncellemesi', value: db.kasa.length > 0 ? new Date(Math.max(...db.kasa.map(k => new Date(k.updatedAt || k.createdAt).getTime()))).toLocaleDateString('tr-TR') : '-' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ color: '#475569', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.9rem' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function DangerAction({ label, desc, onConfirm }: { label: string; desc: string; onConfirm: () => void }) {
  const { showConfirm } = useConfirm();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(0,0,0,0.3)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.88rem' }}>{label}</div>
        <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: 2 }}>{desc}</div>
      </div>
      <button onClick={() => showConfirm(label, `${desc}. Bu işlem geri alınamaz!`, onConfirm, true)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#f87171', padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
        Temizle
      </button>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' }}>{title}</h3>
      </div>
      <div style={{ padding: '20px 22px' }}>{children}</div>
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', marginBottom: 6, color: '#64748b', fontSize: '0.82rem', fontWeight: 600 };
const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f1f5f9', fontSize: '0.9rem', boxSizing: 'border-box' };
const btnPrimary: React.CSSProperties = { width: '100%', padding: '13px 0', background: 'linear-gradient(135deg, #ff5722, #ff7043)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem' };

function FV({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inp} />
    </div>
  );
}
