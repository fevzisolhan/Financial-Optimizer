# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains a Turkish stove/heater store management system (Soba Yönetim Sistemi) — a full "Kolay Ön Muhasebe Programı" with Fatura Takibi, Cari, Stok, Gelir/Gider, Nakit Yönetimi, AI Asistan, Entegrasyonlar, and mobile responsiveness. All business data is stored in localStorage. Turkish UI with dark navy theme (#070e1c) and orange (#FF5722) accent.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/soba-yonetim)
- **Charts**: recharts v2.15.2
- **API framework**: Express 5 (artifacts/api-server, port 8080)
- **AI**: OpenAI GPT-5 Mini via Replit AI Integrations proxy
- **Database**: PostgreSQL + Drizzle ORM (for API server; frontend uses localStorage)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.

## Soba Yönetim Sistemi — Feature Log

### Key architecture
- All data in `localStorage` key `sobaYonetim` (no backend DB for UI)
- Dark theme: `#070e1c` bg, `#ff5722` orange accent, inline styles
- API server on port 8080 for AI proxy (`/api/ai`)

### Modules (tab IDs)
`dashboard`, `products`, `sales`, `fatura`, `suppliers`, `pelet`, `boruTed`, `cari`, `kasa`, `butce`, `bank`, `reports`, `stock`, `monitor`, `ai`, `entegrasyon`, `partners`, `settings`

### Recent additions (March 2026)
- **Fatura → Kasa/Cari auto-integration**: `updateStatus` → 'odendi' creates Kasa entry; 'onaylandi' + payment='cari' updates Cari balance; 'iptal' reverses Kasa entry. Tracked via `kasaEntryId` & `cariUpdated` on Invoice type.
- **Cari Müşteri Geçmişi tabs**: Ödemeler / Satışlar / Faturalar tabs in detail modal + 4 stat cards.
- **Bütçe page** (`Butce.tsx`): Monthly category budgets with progress bars, keyword-based kasa matching, bank statement CSV import with auto-categorization, preset categories. Tab `butce` under Finans.
- **Settings → Veri Onarım tab**: Diagnose tool (orphaned records, negative stock, duplicates, localStorage size), 5 repair actions.
- **Types**: `BudgetCategory`, `Budget` in types/index.ts; `budgets: BudgetCategory[]` in DB.
- **Sound Feedback** (`useSoundFeedback.ts`): Web Audio API hook with 3 themes, 5 sound types, volume control.
- **Sonner Toasts**: Replaced custom toast with Sonner; `useToast()` triggers sounds.
- **Excel Export** (`excelExport.ts`): SheetJS/xlsx utility, Turkish headers, date/currency formatting.
- **Dashboard Enhancement**: Horizontal scrollable stat cards with +/- navigation, pointer-drag swipe, scroll snap. Right panel with brightness control, widget management (add/remove/reorder), quick actions. Left side customizable widget area (localStorage persisted via `dashboardPrefs`). Widget options: chart, quickStats, recentSales, tips, stockAlerts, activity, excelBar, categoryChart. Responsive: right panel collapses to single column under 1100px viewport width.
- **App layout fix**: Main content area uses `calc(100vw - 228px)` width (fixed sidebar is position:fixed, 228px wide) so grid layouts and charts are properly constrained.
- **Login Screen**: Password-protected entry with animated dark background (gradient shift, floating particles, glowing orbs). SHA-256 hashed password stored in `sobaYonetim_appPass` localStorage key. Session stored in sessionStorage (8h validity). First visit shows password setup; subsequent visits require login. "Solhan" branding. Password reset available via typing "SIFIRLA".
- **Text-to-Speech (TTS)**: `speakMessage()` and `playSoundWithSpeech()` in useSoundFeedback hook. Uses Web Speech API (`speechSynthesis`) with Turkish voice. Auto-speaks error and warning toasts. Toggle in Settings → Ses → Sesli Konuşma (TTS). `speechEnabled` flag in `soundSettings`.
- **Selective Backup Restore**: Choose which sections to restore from JSON backup (products, sales, cari, kasa, etc.) instead of full overwrite. In Settings → Yedek & Geri Yükleme.
- **Smart Import Multi-format**: SmartImportManager now supports JSON + CSV/TSV/TXT. CSV auto-detects column names (müşteri, tarih, tutar, etc.) with manual correction UI. Target entity selection (cari/products/kasa). Preview table shows first 3 rows.
- **Settings tabs**: company, pellet, sound, backup, excel_export, activity, shortcuts, repair, excel, data.
