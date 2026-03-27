# Pelet Web - Replit'ten GitHub + Vercel'e Geçiş

Bu repo, uygulamayı Replit bağımlılıklarından ayrıştırılmış şekilde çalıştırmak ve
Vercel'e deploy etmek için hazırlandı.

## 1) Hedef klasör

Ana web uygulaması:

- `artifacts/soba-yonetim`

## 2) Replit bağımlılıklarından ayrıştırma

Aşağıdaki düzenlemeler yapıldı:

- `vite.config.ts` artık `PORT` ve `BASE_PATH` zorunlu değil.
  - `PORT` yoksa `5173`
  - `BASE_PATH` yoksa `/`
- Replit'e özel Vite plugin'leri kaldırıldı.
- `vercel.json` eklendi.

## 3) Local çalıştırma

```bash
pnpm install
pnpm --filter @workspace/soba-yonetim dev
```

## 4) Build kontrolü

```bash
pnpm --filter @workspace/soba-yonetim build
```

## 5) GitHub'a yeni repo olarak taşıma

`psrs-pelet-web` adlı yeni repo için örnek akış:

```bash
# yeni boş repoyu GitHub'da açtıktan sonra
cd artifacts/soba-yonetim
git init
git add .
git commit -m "Initial import from Financial-Optimizer"
git branch -M main
git remote add origin git@github.com:tski/psrs-pelet-web.git
git push -u origin main
```

> İstersen tüm monorepo yerine sadece `artifacts/soba-yonetim` klasörünü bu repo olarak
> taşıyabilirsin (en temiz yaklaşım).

## 6) Vercel deploy

1. Vercel'de `New Project` > `Import Git Repository`
2. Repo: `tski/psrs-pelet-web`
3. Framework: `Other` veya `Vite`
4. Build Command: `pnpm run build`
5. Output Directory: `dist/public`
6. Deploy

`vercel.json` dosyası bu ayarları otomatikleştirmek için eklendi.

## 7) Opsiyonel environment değişkenleri

Uygulama artık bu iki değişken olmadan da çalışır:

- `PORT`
- `BASE_PATH`

Eğer alt path'e yayınlanacaksa `BASE_PATH` (`/my-path/` gibi) verilebilir.
