# Progress pengerjaan

Diperbarui 30 Sep 2026. Rincian hasil uji per langkah ada di `qa-log.md`.

## Ringkas

Semua potongan S1 sampai S10 sudah selesai dan di-commit. Checkpoint A, B, dan C lulus. Checkpoint D (seluruh isi Dokumen 3 lulus) masih menunggu uji manual di perangkat asli (lihat "Belum").

| Potongan | Status |
|---|---|
| S1 Fondasi | Selesai |
| S2 Acara | Selesai |
| S3 Pesan meja | Selesai, tapi bayar sungguhan di Xendit mode uji belum dicoba (M1, M2) |
| S4 Guestlist | Selesai |
| S5 Halaman QR | Selesai |
| S6 Pintu | Selesai, uji di HP dan alat pemindai asli belum (M5 sampai M8) |
| S7 Operasional admin | Selesai |
| S8 Tim dan undangan | Selesai |
| S9 About dan Gallery | Selesai, Gallery masih berisi tempat foto (F9.1) |
| S10 Pengerasan | Selesai |

## Tambahan setelah S10 (30 Sep 2026)

- Admin: copy link undangan, HP lengkap untuk WhatsApp, kirim ulang QR dari panel, nomor HP tanpa awalan jadi +62
- Menu atas This week, Gallery, About, Find my QR. This week membuka halaman malam terdekat
- Favicon angka Romawi II, ikon layar utama iPhone
- APP_URL jadi `https://thefanglle.test` (Laragon)
- Find my QR (`/qr`): tamu mengetik kode masuk untuk membuka lagi QR yang tertutup. Endpoint `POST /api/passes/find` dicatat di Dokumen 0 §2.3. Halaman QR meminta tamu menyimpan kodenya
- Perbaikan dari audit taste-skill:
  - menu di HP
  - skeleton saat memuat
  - hero `svh`
  - preload huruf logo
  - satu label per tujuan (Book a table, Join the guestlist)
  - efek tekan tombol
  - Other nights jadi baris
  - judul About dan Gallery maks 88 px
- Keamanan:
  - link QR tidak bisa lagi ditebak dari link teman satu grup
  - Laragon hanya menautkan `backend/public`
  - Apache hanya melayani laptop ini (`000-local-only.conf`)
  - `.headroom/` keluar dari git
- Graphify diperbarui otomatis lewat hook git setelah setiap commit

## Uji terakhir

30 Sep 2026: `php artisan test` 177 lulus, `npx vitest run` 68 lulus, `npm run build` lulus, `composer audit` dan `npm audit` nol kerentanan.

## Belum

Uji manual di perangkat asli, semuanya lewat tunnel cloudflared karena HP tidak bisa membuka `thefanglle.test`:

- M1, M2: bayar meja di halaman Xendit mode uji, dengan dan tanpa tunnel
- M5: pintu di HP, mode pesawat, lalu sinkron
- M6: alat pemindai USB asli
- M7: memindai di ruangan gelap
- M8: kode masuk di HP tanpa sinyal
- Menu HP yang baru di HP sungguhan
- Escape di penampil Gallery

## Sebelum web dibuka ke publik

Deploy ke server rumah harus ditanyakan dulu (CLAUDE.md).

- Isi kunci Turnstile (`TURNSTILE_SECRET` dan `VITE_TURNSTILE_SITE_KEY`). Selama kosong, perlindungan bot mati
- `APP_ENV=production`, `APP_DEBUG=false`, `SESSION_SECURE_COOKIE=true`
- Trusted proxy untuk tunnel. Tanpa itu semua pengunjung terlihat dari IP yang sama dan berbagi batas percobaan
- Foto asli untuk Gallery dan hero (ditunda pemilik, 30 Sep 2026)

## Penyimpangan dari mockup

Dicatat dengan alasannya di `qa-log.md`, bagian "Setelah S10".
