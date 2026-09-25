# The Fanglle II

Web nightclub fiktif untuk portofolio Ralph de Vinca Group. Reservasi meja dengan deposit (Xendit mode uji), guestlist, QR masuk, pemindai pintu yang bisa tanpa sinyal, dan panel pengelola.

## Baca sebelum mengerjakan apa pun

1. `docs/prd-fanglle-0-kontrak-dan-rencana.md`: kontrak dan urutan kerja, **menang atas semua dokumen lain**
2. PRD bidang yang sedang dikerjakan: `-1-backend`, `-2-frontend`, `-3-testing`
3. `docs/mockup/*.jsx`: acuan tampilan, teks, dan perilaku yang mengikat

## Susunan

```
backend/    Laravel, API + penyaji hasil build
frontend/   React + Vite, build ke backend/public/app
docs/       PRD, mockup, qa-log.md
tests/      fixtures/ (lintas bahasa), concurrency/ (beban bersamaan)
```

## Cara kerja

- Satu sesi utama memimpin; sub-agent `backend`, `frontend`, `qa` di `.claude/agents/` mengerjakan bagiannya
- Urutan: potongan vertikal S1 sampai S10, tiap potongan backend → frontend → qa
- Berhenti di checkpoint A, B, C, D dan tunggu "lanjut"
- `/spec` tidak dipakai: spesifikasi sudah ada di PRD
- Setelah S1 selesai: jalankan `/graphify .`

## Urutan otoritas desain

Kontrak (Dokumen 0) → PRD + mockup → skill. Bila skill menyarankan sesuatu yang berbeda dari mockup yang sudah di-ACC, mockup yang menang.

- antislop: **wajib**, Delivery Gate untuk setiap layar
- taste-skill: hanya halaman publik, dan tidak boleh mengubah keputusan mockup
- ponytail: kode minimal, tapi keputusan PRD tidak disederhanakan

## Aturan yang paling sering dilanggar

- Jam malam dibandingkan lewat `nightMinutes`, tidak pernah string mentah (F2)
- Tidak ada jam, harga, atau nama yang ditulis mati; semua dari API
- Poiret One dan Didact Gothic: `font-weight` maksimal 400, tanpa italic
- Tanpa em dash di teks antarmuka
- HP lengkap tidak pernah ada di endpoint daftar (F14)
- Webhook tidak pernah membuat record (F7)

## Berhenti dan tanya sebelum

- Mengubah kontrak
- Menambah dependensi di luar daftar PRD
- Menghapus file yang bukan buatan sesi ini
- Menyentuh kunci Xendit selain `xnd_development_`
- Deploy ke server rumah

## Perintah

```bash
cd backend && php artisan migrate:fresh --seed && php artisan test
cd frontend && npm run build && npx vitest run
php artisan fanglle:keys          # sekali, membuat kunci tanda tangan QR
php artisan fanglle:demo-reset    # membuat ulang minggu demo
```

Klaim "lulus" wajib disertai keluaran nyata perintahnya.
