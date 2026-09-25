# The Fanglle II · Dokumen 2: PRD Frontend

Versi 1.0 · September 2026

> Baca Dokumen 0 lebih dulu. Nama field dan bentuk JSON diambil dari sana. Delapan file mockup adalah acuan tampilan, teks, dan perilaku yang mengikat.

---

## 1. Project Summary & Objectives

Satu aplikasi React, tiga wilayah dengan kebutuhan berbeda:

| Wilayah | Rute | Kebutuhan utama |
|---|---|---|
| Publik | `/`, `/events/:date`, `/gallery`, `/about`, `/book/:date`, `/guestlist/:date`, `/p/:id` | Kesan mewah, cepat di HP, tanpa akun |
| Pintu | `/door` | Cepat, bisa tanpa sinyal, bisa tanpa mouse |
| Pengelola | `/admin/*`, `/login`, `/invite/:token` | Jelas, padat, semua bisa dengan keyboard |

**Tujuan:**
1. Tampilan sama dengan mockup yang sudah di-ACC
2. Halaman QR dan pemindai tetap bekerja tanpa sinyal
3. Tidak ada jam, harga, atau nama yang ditulis mati; semua dari API

---

## 2. Architecture & Technical Stack

| Bagian | Paket, versi dikunci |
|---|---|
| Build | Vite, versi stabil terbaru |
| UI | React, versi stabil terbaru |
| Routing | `react-router-dom@7.18.4` |
| Data server | `@tanstack/react-query@5.103.2` |
| Render QR | `qrcode@1.5.4` |
| Pindai kamera | `@zxing/browser@0.2.1` |
| Penyimpanan offline | `idb@8.0.3` |
| PWA | `vite-plugin-pwa@1.3.0` |

Semua paket di atas sudah diperiksa ada di npm dengan penerbit yang jelas. Paket lain butuh persetujuan.

**Huruf** Poiret One dan Didact Gothic di-*self-host* di `public/fonts/`, tidak dari Google Fonts CDN, supaya halaman QR dan pemindai tetap tampil tanpa sinyal.

**Lazy load per wilayah:** membuka `/p/:id` di HP tamu tidak memuat kode admin atau pemindai.

**Turnstile** dimuat lewat tag script resminya hanya di halaman pesan meja dan guestlist.

### 2.1 Aturan tampilan (dari mockup)

**Token warna publik dan admin:**
```css
--obsidian:#0C0812; --surface:#150E1F; --raised:#1E1530; --line:#2E2342; --line-soft:#221931;
--amethyst:#563C7A; --amethyst-deep:#3D2A58; --amethyst-soft:#7A5BA6;
--text:#EEE9F3; --soft:#C9BDD9; --muted:#A99DB8;
--garnet:#A3162F; --garnet-hover:#B91C38; --garnet-text:#E5566B; --on-garnet:#FBF7FB;
--held:#F0B55A; --paid:#6FD49A;
```
**Hasil pemindai (hanya di `/door`):** hijau `#0F6B38`/`#F2FFF6`, merah `#A3162F`/`#FBF7FB`, kuning `#C77A12`/`#140A00`. Selalu disertai tulisan besar dan bunyi; warna tidak pernah jadi satu-satunya penanda.

**Tetap:**
- Merah garnet satu aksen: tombol utama, angka **II** di logo, status "last tables", pilihan tamu
- Poiret One dan Didact Gothic hanya punya satu ketebalan dan tanpa miring: jangan pakai `font-weight` di atas 400 atau `font-style: italic`; penekanan lewat warna
- Tanpa em dash di teks antarmuka; huruf kapital semua hanya untuk logo teks dan label kecil
- Kontras teks minimal 4,5:1; semua pasangan di atas sudah diuji
- Semua elemen interaktif bisa dipakai dengan keyboard, fokus terlihat
- `prefers-reduced-motion` dihormati: serpihan kristal tidak jatuh

**Jam dari data (F3):** "Doors 3 pm" dari `opens_at`, jam tutup dari `close_time`, batas guestlist dari `guestlist_cutoff`. Tulisan "10 pm" dan "last entry 2 am" di mockup lama diganti mengikuti data.

### 2.2 Aturan waktu malam (F2)

Satu fungsi `nightMinutes("HH:MM")`: jam sebelum 12:00 ditambah 24 jam. Dipakai untuk mengurutkan line-up, peringatan tabrakan di admin, dan membandingkan dengan jam tutup. Tidak ada perbandingan jam malam yang memakai string mentah.

### 2.3 Halaman QR tanpa sinyal

- Service worker (vite-plugin-pwa) menyimpan kerangka halaman `/p/:id` dan huruf
- Respons `GET /passes/:id` terakhir disimpan di IndexedDB; saat offline tampil dengan banner "No signal. Showing the copy saved on this phone"
- String QR dirender di klien dengan `qrcode`, di kartu putih, level koreksi galat `M`
- **Kode masuk** di bawah nama pada kartu putih: label kecil "Can't scan? Give the door this code", lalu `K7QM-4TXP` dalam huruf besar dengan jarak huruf lebar, minimal 28 px. Tetap tampil saat offline
- Tombol "Keep screen on" memakai Screen Wake Lock API; bila tidak didukung, tampilkan penjelasan, bukan tombol mati

### 2.4 Pemindai pintu

**Dua cara masuk kode, satu logika:**
- Kamera lewat `@zxing/browser` (tampilan HP)
- Alat pemindai genggam yang berperilaku seperti keyboard (tampilan desktop): tangkap ketikan lintas halaman, **reset buffer bila jeda antarkarakter > 120 ms**. Kode + Enter = pindaian. **Enter saja = konfirmasi** "Let in". Pindaian baru saat hasil hijau belum dikonfirmasi ditolak dengan pesan, tidak pernah mengonfirmasi rombongan sebelumnya

**Input kode manual (F17)**, cara ketiga bila kamera dan alat pemindai gagal:
- Tampilan HP: tombol "Type a code" di samping "Search by name", membuka layar input
- Tampilan desktop: kolom "Type a code" di panel kanan, di atas pencarian nama. Saat kolom ini fokus, pemindai berhenti mendengarkan dengan indikator kuning, sama seperti kolom cari
- Satu kolom, huruf besar otomatis, tanda hubung disisipkan setelah 4 karakter, `inputmode="text"`, `autocomplete="off"`, `autocapitalize="characters"`. Normalisasi F17 sebelum dicocokkan
- Offline: hash SHA-256 ketikan dengan `crypto.subtle.digest`, cari di manifest. Online: `GET /door/{date}/codes/{code}`
- Hasil memakai layar hijau, merah, kuning yang sama dengan pindaian, dengan `method: "code"`. Penjaga tetap wajib cek KTP
- Kode tidak ditemukan: "No pass with this code tonight. Check the letters, or search by name." Bila offline dan kode tidak ada di manifest: "Can't check this code without signal. Search by name, or wait for signal."
- 10 kode salah dalam semenit: kolom terkunci 60 detik dengan hitung mundur

**Validasi offline:**
1. Pecah `FNG2.payload.sig`, verifikasi `sig` dengan kunci publik JWK memakai `crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" })`
2. Cocokkan `e` dengan tanggal malam ini (F2)
3. Cari `p` di manifest IndexedDB untuk hitungan masuk dan status dicabut
4. Pass valid tapi belum ada di manifest (mendaftar setelah sinkron terakhir): tetap izinkan dan catat, karena tanda tangannya sah

**Antrean check-in:** tiap check-in mendapat `client_uuid` dari `crypto.randomUUID()`, disimpan di IndexedDB, dikirim batch saat online, diulang dengan **UUID yang sama** bila gagal. Status sinkron selalu terlihat.

**Dua tata letak** mengikuti dua mockup pintu: HP (kamera) dan desktop (alat pemindai), dipilih otomatis dari lebar layar. Tombol "Start scanning" wajib diklik sekali untuk mengaktifkan suara.

### 2.5 Formulir publik

- Pesan meja: denah dengan tombol sungguhan per meja plus tampilan daftar; hitung mundur 15 menit dari `held_until` server; setelah bayar, halaman konfirmasi polling `GET /table-bookings/{code}` tiap 3 detik sampai `paid` atau `released`
- Guestlist: 1 sampai 10 orang, pilihan mode QR, nama anggota wajib hanya untuk `personal`, email wajib
- Keterangan acara malam yang dipilih tampil di kedua formulir
- Galat server (`message`) ditampilkan apa adanya; fokus pindah ke galat pertama

---

## 3. Actionable Task Breakdown

### S1 · Fondasi
**F1.1** Vite + React di `frontend/`, build ke `../backend/public/app`, proxy `/api` saat pengembangan. **F1.2** Token warna, huruf self-host, komponen dasar (tombol, chip, dialog, badge). **F1.3** Kerangka tiga wilayah dengan lazy load, halaman login.
Lulus: `npm run build` bersih; membuka `/p/x` tidak memuat chunk admin (cek di tab Network).

### S2 · Acara
**F2.1** Home sesuai `fanglle-halaman-depan-mockup.jsx`, "This week" dari `GET /events`, nama acara menaut ke detail. **F2.2** Detail event sesuai mockup, line-up dari data. **F2.3** Admin Events dengan editor line-up, peringatan tabrakan dan jam, kolom jam tutup.

### S3 · Pesan meja
**F3.1** Denah, formulir, hitung mundur, alihkan ke `payment_url`, halaman konfirmasi dengan polling. Semua keadaan di mockup tercapai dari data nyata.

### S4 · Guestlist
**F4.1** Formulir dan halaman sukses sesuai mockup, termasuk tombol "Share on WhatsApp" berupa tautan `wa.me`.

### S5 · Halaman QR
**F5.1** Sesuai §2.3, termasuk kode masuk di bawah QR.
Lulus: buka sekali, matikan jaringan, muat ulang: QR tetap tampil dengan banner tanpa sinyal.

### S6 · Pintu
**F6.1** Sesuai §2.4, dua tata letak, dengan input kode manual di keduanya.
Lulus: mode pesawat, pindai 2 QR dan ketik 1 kode, nyalakan jaringan: ketiga check-in tersinkron tanpa duplikat, satu di antaranya bermetode `code`.

### S7 · Operasional admin
**F7.1** Overview, booking meja dengan panel detail, guestlist dengan filter jenis QR dan kedatangan, riwayat pintu, sesuai `fanglle-pengelola-mockup.jsx`.

### S8 · Tim
**F8.1** Halaman Team dan halaman terima undangan `/invite/:token`.

### S9 · Konten
**F9.1** About dan Gallery sesuai mockup; Gallery memakai tempat kosong berlabel berisi brief foto dan teks alternatif. Menu atas dan kaki halaman lengkap di semua halaman.

### S10 · Pengerasan
**F10.1** Periksa keyboard-only di semua wilayah, lebar 360 px tanpa gulir mendatar, tanpa em dash, kontras.

---

## 4. Claude Code Execution Prompt (untuk sub-agent frontend)

```text
Kerjakan bagian frontend potongan {SN} dari docs/prd-fanglle-2-frontend.md.
Kontrak: docs/prd-fanglle-0-kontrak-dan-rencana.md. Acuan tampilan: docs/mockup/.
Hanya ubah file di frontend/.

Salin keputusan visual dari mockup. Jangan menambah warna, ikon, animasi, atau bagian
yang tidak ada di mockup. Panel "Kontrol pratinjau" tidak dibangun.

Selesai jika:
- npm run build lulus, tempel keluarannya
- kriteria "Lulus" potongan ini terbukti
- Delivery Gate antislop dijalankan untuk layar yang disentuh

Dilarang: memasang paket di luar tabel §2, menulis jam atau harga secara mati,
font-weight di atas 400, em dash di teks antarmuka.
```
