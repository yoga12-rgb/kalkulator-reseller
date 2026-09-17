# Kalkulator Reseller Rajaklana

PWA kalkulator diskon voucher reseller **Rajaklana (Abon Gulung & Bolu Susu)**.
Masukkan jumlah box tiap varian → langsung dapat diskon, total bayar, saran naik tier, dan rincian
order siap dikirim ke WhatsApp.

Mobile-first, instalable (standalone), dan **jalan offline** — cocok dipakai di toko atau pasar.

---

## Fitur

| Fitur | Keterangan |
| --- | --- |
| 3 kategori produk | Floss Roll (8 varian), Bolu Susu (3 varian), Roti (2 varian) |
| Kalkulasi otomatis | Diskon dihitung dari **total harga normal** (sebelum diskon), dibulatkan ke rupiah terdekat |
| Stepper qty | Tombol −/+ besar + input manual (aman untuk angka besar, maks 9999 box) |
| Pencarian varian | Filter cepat di daftar input |
| Saran naik tier | Hitung berapa box lagi (pakai varian termurah) untuk dapat diskon lebih besar |
| Rincian order | Sheet berisi rincian + nama/catatan reseller |
| Salin / kirim | Salin rincian ke clipboard atau langsung buka WhatsApp |
| Riwayat order | Disimpan di localStorage, dikelompokkan per hari, ada pencarian |
| Export / Import | Backup riwayat ke file JSON dan gabungkan kembali (dedupe by id) |
| Draft otomatis | Qty, nama, dan catatan tersimpan tiap perubahan — tidak hilang saat app ditutup |
| PWA | Manifest + service worker: bisa di-install, cache offline, auto-update |
| Tab bar diam | Navigasi bawah tidak bergeser saat pindah tab: halaman dikunci, hanya panel isi yang menggulir (`100dvh`) |
| Tanpa zoom tak sengaja | Double tap tidak lagi men-zoom layar (`touch-action: manipulation`); geser & pinch zoom tetap jalan |
| Tanpa scrollbar | Batang scroll disembunyikan di panel isi maupun panel rincian; gulir tetap jalan |

## Aturan Diskon (Voucher Reseller)

Diskon dihitung dari **total harga normal** seluruh varian (harga satuan × qty), bukan dari harga
setelah diskon. Batas bawah inklusif, batas atas eksklusif.

| Total harga normal | Diskon |
| --- | --- |
| di bawah Rp700.000 | — belum dapat voucher |
| Rp700.000 – di bawah Rp1.000.000 | **20%** |
| Rp1.000.000 – di bawah Rp1.500.000 | **22%** |
| Rp1.500.000 – di bawah Rp2.000.000 | **25%** |
| Rp2.000.000 ke atas | **26%** |

Contoh: 6 × Sapi Ori (Rp89.000) + 4 × Ayam Ori Mini (Rp47.000) = Rp722.000 → diskon 20%
(Rp144.400) → **total bayar Rp577.600**.

## Daftar Harga

| Kategori | Varian | Harga |
| --- | --- | --- |
| Floss Roll | Sapi Ori / Sapi Pedas | Rp89.000 |
| Floss Roll | Ayam Ori / Ayam Pedas | Rp85.000 |
| Floss Roll | Sapi Ori Mini / Sapi Pedas Mini | Rp50.000 |
| Floss Roll | Ayam Ori Mini / Ayam Pedas Mini | Rp47.000 |
| Bolu Susu | Bolu Keju / Bolu Coklat | Rp59.000 |
| Bolu Susu | Bolu Durian | Rp65.000 |
| Roti | Durian Sobek | Rp90.000 |
| Roti | Durian Sobek Mini | Rp50.000 |

Mengubah harga/varian cukup edit satu file: `src/lib/catalog.js`.
Ambang diskon ada di `src/lib/pricing.js` (`TIERS`).

## Struktur Proyek

```
src/
  main.js                     bootstrap + register service worker (virtual:pwa-register)
  App.svelte                  shell aplikasi (halaman terkunci, tinggi `100dvh`) + 3 tab (Hitung / Voucher / Riwayat)
  app.css                     tema skeuomorphik (gradien, emboss, kancing berkilau)
  lib/
    catalog.js                kategori, varian, harga
    pricing.js                TIERS, computeTotals, suggestUpgrade, buildOrderText, formatRupiah
    storage.js                riwayat + draft di localStorage, export/import
  components/
    AppHeader.svelte          header + judul
    CategoryCard.svelte       kartu kategori berisi baris varian
    ProductRow.svelte         satu varian + stepper qty
    SummaryBar.svelte         bar total sticky di bawah
    SummarySheet.svelte       sheet rincian order + simpan/kirim
    VoucherTiers.svelte       papan tier diskon + saran naik tier
    HistoryPanel.svelte       riwayat order, pencarian, export/import
    Toast.svelte              notifikasi kecil
    Icon.svelte               ikon SVG inline (tanpa dependensi ikon eksternal)
scripts/
  generate-icons.mjs          generator ikon PWA (PNG encoder sendiri, pakai node:zlib)
  smoke-test.mjs              uji end-to-end di Chrome/Edge lokal (Playwright core)
tests/
  pricing.test.js             unit test perhitungan diskon
  storage.test.js             unit test riwayat/draft/export-import
public/icons/                 ikon hasil generate (192, 512, maskable, apple-touch)
```

## Menjalankan

```bash
npm install

npm run dev        # server pengembangan
npm run build      # build produksi ke dist/ (+ generate service worker & manifest)
npm run preview    # pratinjau hasil build di http://localhost:4173
```

### Test

```bash
npm test           # unit test (node --test)

npm run build
npm run preview    # terminal lain
npm run smoke      # uji end-to-end di browser asli (butuh Chrome/Edge terpasang)
```

`npm run smoke` memakai `playwright-core` dengan browser Chrome/Edge yang sudah ada di sistem
(tidak mengunduh browser). Hasilnya: 24 pemeriksaan (render, manifest, service worker, anti-zoom
double tap, halaman terkunci + panel isi yang menggulir, tab bar tidak bergeser saat pindah tab,
tab baru selalu mulai dari atas, kalkulasi, localStorage, posisi toast, kredit developer, tab
voucher/riwayat, persistensi setelah reload) dan screenshot ke `tmp/` (`smoke-kalkulator.png`,
`smoke-kredit.png`, `smoke-riwayat.png`, `smoke-voucher.png`).

```bash
npm run icons      # regenerate public/icons/*.png dan public/favicon-64.png
```

## Deploy ke Vercel

1. Push repo ini ke GitHub.
2. Di Vercel: **Add New → Project → Import** repo, framework terdeteksi `Vite`
   (konfigurasi sudah ada di `vercel.json`: build `npm run build`, output `dist`,
   SPA rewrite, cache panjang untuk `/assets/*`, `no-cache` untuk `/sw.js`).
3. Deploy — selesai. Tidak ada environment variable yang dibutuhkan.

Build memakai Node 22 (dipatok via `engines.node` di `package.json`). Rewrite SPA
`/((?!assets/|icons/|.*\.[a-zA-Z0-9]+$).*)` → `/index.html` hanya menyasar path tanpa ekstensi,
sehingga `sw.js`, `manifest.webmanifest`, dan `icons/*.png` tidak pernah ikut ter-rewrite. Vercel
sendiri memeriksa file statis (**File System Routes**) lebih dulu daripada rewrites, jadi aset
tersebut selalu disajikan apa adanya.

Setelah terpasang di HP, aplikasi bisa dipakai offline. Saat ada versi baru,
service worker memakai `registerType: 'autoUpdate'` sehingga update diterapkan
otomatis pada muat ulang berikutnya.

## Catatan Teknis

- **Svelte 5** (runes: `$state`, `$derived`, `$props`) — tanpa store eksternal.
- **Tailwind 4** lewat `@tailwindcss/vite`; token warna/efek didefinisikan di `src/app.css`
  (`cocoa`, `gold`, `leaf` + utilitas `emboss`, `plate-gold`, `flyer`, `chip`).
- **PWA**: `vite-plugin-pwa` (workbox `generateSW`, `navigateFallback: /index.html`) sehingga
  deep link tetap jalan saat offline. Hanya `npm run build` yang menyalakan service worker.
- **Gestur**: `touch-action: manipulation` dipasang di `html`, `body`, dan kontrol form supaya
  **double tap tidak men-zoom**. Sesuai spesifikasi, browser meng-intersect `touch-action` elemen
  yang disentuh dengan leluhurnya, jadi cukup di elemen teratas. Pinch zoom sengaja dibiarkan
  aktif demi aksesibilitas; kalau ingin dikunci total, tambahkan `user-scalable=no` di meta
  viewport (iOS mengabaikannya, jadi `touch-action` tetap yang menentukan).
- **App shell (halaman terkunci)**: `html`/`body` setinggi `100dvh` + `overflow: hidden` di
  `src/app.css` (dibungkus `@supports (height: 100dvh)`, jadi browser lama tetap memakai perilaku
  semula: halaman yang menggulir), lalu `<main>` (`overflow-y-auto overscroll-contain`) jadi
  satu-satunya area gulir. Alasannya: di iOS toolbar Safari berubah tinggi mengikuti gulir
  halaman, dan tinggi viewport yang ikut berubah itulah yang menggeser tab bar — dulu tab bar
  `position: fixed` di dasar viewport, sementara pindah tab meng-clamp posisi gulir halaman
  sehingga toolbar beranimasi lagi tiap pindah tab. Dengan halaman terkunci + tinggi `dvh`,
  toolbar tidak punya alasan berubah dan tab bar ikut mengalir di dalam shell (`sticky`, lebar
  shell yang sudah `max-w-md`). Detail yang menyertainya: setiap ganti tab `main.scrollTop`
  direset lewat `$effect` (tab baru selalu mulai dari atas), padding bawah panel isi
  `calc(10rem + env(safe-area-inset-bottom))` — cukup untuk bar total 68px + tab bar 76px, dan
  tidak lagi menutup konten terakhir di iPhone berponi seperti `pb-40` dulu — `background-attachment:
  fixed` dihapus (halaman tidak digulir lagi), dan batas tinggi sheet rincian pakai `dvh` (`.sheet-max`).
- **Scrollbar**: disembunyikan lewat `scrollbar-width: none` (Firefox) dan `::-webkit-scrollbar
  { display: none }` (Chromium/WebKit) di `src/app.css`, plus utilitas `.scroll-hide` untuk area
  gulir seperti panel rincian order. Scroll-nya sendiri tetap jalan (swipe, roda mouse, keyboard,
  `PageDown`); yang hilang hanya batangnya, sekaligus menghindari konten bergeser saat daftar
  pendek/panjang bergantian.
- **Data**: semua perhitungan & riwayat berjalan lokal di perangkat (localStorage), tidak ada server
  dan tidak ada data yang dikirim keluar.
- **Format angka**: `Intl.NumberFormat('id-ID')` → `Rp577.600`, tanggal `id-ID`.

## Kredit

Dibuat dan dikembangkan oleh **Yoga Septriana** — Instagram
[@mang.agooy](https://www.instagram.com/mang.agooy/).

Kredit ini juga tampil di dalam aplikasi (footer di tiap tab: Hitung / Voucher / Riwayat) dan
tertaut langsung ke Instagram tersebut. Metadata pengarang juga tersimpan di `package.json`
(`author`) dan `index.html` (`meta name="author"`).
