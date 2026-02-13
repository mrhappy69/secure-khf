# Elegant Login + Dashboard (Next.js) — Cloudflare Pages Ready

Template Next.js dengan:
- Halaman **Login** (cantik + disclaimer di atas tombol login)
- Halaman **Dashboard** putih bersih dan elegan
- Auth sederhana via **cookie** (tanpa server) — cocok untuk demo / portal internal ringan

## 1) Jalankan Lokal

```bash
npm install
npm run dev
```

Buka: http://localhost:3000

**Default demo login:** `a / a` (ubah di `app/page.tsx`).

## 2) Build Static (untuk Cloudflare Pages)

```bash
npm run build
```

Hasil static export akan ada di folder:

```
out/
```

## 3) Deploy ke Cloudflare Pages (via GitHub)

1. Push repo ini ke GitHub.
2. Cloudflare Dashboard → **Pages** → **Create a project** → pilih repo.
3. Set:
   - **Framework preset:** Next.js
   - **Build command:** `npm run build`
   - **Build output directory:** `out`

Selesai — Cloudflare akan build & host situsnya.

## Catatan Keamanan
Auth di template ini hanya cookie sederhana untuk kebutuhan demo. Untuk production:
- pakai SSO / API auth,
- gunakan Cloudflare Workers / Pages Functions,
- simpan session/token secara aman.

Enjoy.
