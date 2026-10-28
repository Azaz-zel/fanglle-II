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

## Redesign "Gel dan Kabut" (7 Okt 2026, cabang `redesign-gel-kabut`, belum di-commit)

- Acuan tampilan sekarang `docs/design/` (board kanvas yang di-ACC pemilik), bukan PRD frontend. Sistemnya dicatat di `DESIGN.md`
- Semua wilayah: publik, halaman QR, pintu, pengelola, login. Logika, API, dan alur tidak berubah
- Satu gel per malam (Kam biru, Jum amber, Sab merah, Min rose) lewat `gelOf()` di `night.js`; kristal geometris per malam dengan cue ganti malam (`stage.jsx`, `stage.css`)
- Huruf baru Big Shoulders Display dan Albert Sans (di-host sendiri). Paket `motion` 14.0.0 ditambahkan atas persetujuan pemilik
- CSS dipecah per wilayah: `styles.css` (dasar), `public.css`, `pass.css`, `door.css`, `admin.css`
- Diperiksa: build, vitest 69/69, tanpa overflow horizontal di 390 dan 1440 untuk semua halaman publik, admin dan pintu dengan data malam ini
- 8 Okt: animasi dioptimalkan. Kristal digambar per kotak pecahan, gerak diamnya lewat Web Animations API (listener `animationiteration` milik React membuat Chrome membangunkan main thread terus), teks ganti malam tanpa `blur()`, crossfade gel hanya di ruangan dan logo, blend `screen` dilepas. Diukur di Chrome headless 1440: frame di atas 25 ms saat ganti malam 25 jadi 1 sampai 5, restyle saat diam 75 per 3 detik jadi 0
- 13 Okt: ganti malam di Home lebih ringan lagi. `dayParts` dan `idr` membuat formatter `Intl` baru di setiap panggilan; di HP (CPU 4x lebih lambat di Chrome headless) itu 342 ms dari satu ganti malam. Sekarang formatter dibuat sekali. Frame per 2,4 detik ganti malam di HP 4x: 45 jadi sekitar 110; frame terburuk di desktop 83 ms jadi 35 sampai 70 ms
- 13 Okt: audit desain (antislop Delivery Gate dan impeccable audit). Diperbaiki: teks di atas ruangan bercahaya diberi halo gelap sehingga kontras tetap 4,5:1 saat kristal terang lewat di belakangnya (diukur per piksel di 46 kombinasi halaman dan lebar), label denah mini di HP keluar dari mejanya dan 9 px (sekarang hanya kode, 11 px), meja zona redup 0,32 jadi 0,6, target sentuh di bawah 44 px (pilihan malam ringkas, logo footer, email About, pilihan malam pengelola), cincin fokus `.panel` dan `.result` kembali untuk keyboard, scrollbar grafik kedatangan menempel di label jam, `TONE` kristal memakai token
- 13 Okt: click-through 39 langkah di Chrome headless lulus semua: navigasi, ganti malam, pilih meja, validasi form kosong, daftar guestlist sampai QR, Find my QR (kode salah dan benar), Gallery (filter, buka, Escape sungguhan menutup), menu HP, login salah dan benar, semua halaman pengelola, pilihan malam, grafik, keluar. Pintu menampilkan "No event tonight" karena hari Senin; alur pindai tetap dicakup `DoorTest` dan `door.test.js`
- 13 Okt, revisi pemilik: guestlist "One QR each" sekarang langsung menampilkan semua QR di layar sukses, satu kartu putih per orang (QR, nama, malam, kode masuk) yang muat satu screenshot HP, supaya pemesan tinggal screenshot dan kirim. Tombol "Share on WhatsApp" (F13) tetap ada di bawah kartu tamu. Kartu memakai `Qr` dan query halaman QR (`QrSheet` di `Pass.jsx`, dimuat lazy), jadi `qrcode` tetap hanya ikut chunk Pass dan tiap pass ikut tersimpan di HP untuk tanpa sinyal. API dan kontrak tidak berubah. Dicek di Chrome headless 390 dan 1440: 3 kartu, kode masuk sama dengan database, tanpa overflow dan tanpa error
- 13 Okt: trusted proxy untuk tunnel: hanya `127.0.0.1` dan `::1` (`bootstrap/app.php`), dengan dua tes di `HardeningTest`. Runbook deploy di `docs/deploy.md`
- 8 Okt: panel pengelola tetap terisi di luar malam acara. Pilihan malam di bilah atas; tanpa pilihan, server memilih malam ini, lalu malam berikutnya, lalu malam terakhir. `GET /api/admin/tonight` menerima `?date=` opsional dan mengirim `tonight`; ini tambahan di luar Dokumen 0 dan belum dicatat di sana

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

13 Okt 2026: `php artisan test` 179 lulus, `npx vitest run` 70 lulus, `npm run build` lulus, `composer audit` dan `npm audit` nol kerentanan (source-map-js di rantai build dinaikkan lewat `npm audit fix`).

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

Langkahnya di `docs/deploy.md`. Yang masih menunggu pemilik:

- Kunci Turnstile (`TURNSTILE_SECRET` dan `VITE_TURNSTILE_SITE_KEY`). Selama kosong, perlindungan bot mati
- Domain, callback token Xendit, dan SMTP
- Ganti kata sandi staf demo
- Foto asli untuk Gallery dan hero (ditunda pemilik, 30 Sep 2026)

## Penyimpangan dari mockup

Dicatat dengan alasannya di `qa-log.md`, bagian "Setelah S10".
