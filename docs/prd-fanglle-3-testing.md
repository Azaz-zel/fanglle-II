# The Fanglle II · Dokumen 3: PRD Testing

Versi 1.0 · September 2026

> Setiap aturan F1 sampai F17 di Dokumen 0 punya minimal satu tes di sini. Tes yang lulus tanpa keluaran nyata tidak dianggap lulus.

---

## 1. Project Summary & Objectives

Yang paling mahal kalau salah, jadi paling ketat diuji:

1. **Uang:** meja terjual dua kali, status bayar berubah dari webhook palsu, kunci live terpakai
2. **Pintu:** QR palsu lolos, pass dipakai dua kali tanpa tercatat, check-in hilang saat tanpa sinyal
3. **Kuota:** guestlist melebihi batas karena permintaan bersamaan
4. **Waktu:** set lewat tengah malam terbaca salah urut

---

## 2. Architecture & Technical Stack

| Lapis | Alat | Di mana |
|---|---|---|
| Unit dan fitur backend | PHPUnit bawaan Laravel, **MySQL sungguhan** (bukan SQLite, karena indeks unik virtual dan `FOR UPDATE` harus diuji di mesin aslinya) | `backend/tests/` |
| Unit frontend | Vitest | `frontend/src/**/*.test.js` |
| Lintas bahasa | Fixture JSON dari PHP, diverifikasi WebCrypto di Vitest | `tests/fixtures/` |
| Beban bersamaan | Skrip `xargs -P` atau `k6` yang menembak endpoint sungguhan | `tests/concurrency/` |
| Manual | Daftar periksa §3.6 | Dicentang di `docs/qa-log.md` |

HTTP ke Xendit dan Turnstile di-*fake* dengan `Http::fake()` di tes otomatis. Xendit sungguhan (mode uji) hanya di tes manual.

---

## 3. Actionable Task Breakdown

### 3.1 Aturan waktu (S2)
**T-W1** `nightMinutes` di PHP dan JS memberi hasil sama untuk 12 jam contoh, termasuk `11:59`, `12:00`, `00:00`, `03:30`, `15:00`. Satu file fixture dipakai kedua sisi.
**T-W2** Line-up `00:30`, `22:00`, `23:30` tersimpan berurutan `22:00`, `23:30`, `00:30`.
**T-W3** Jam tutup `14:00` ditolak (sebelum buka 15:00); `04:00` diterima.
**T-W4** Peringatan tabrakan muncul untuk dua set yang tumpang tindih, hilang bila salah satunya `b2b`.

### 3.2 Uang (S3)
**T-U1 Satu meja satu booking.** 20 permintaan tahan meja B5 bersamaan: tepat 1 `201`, 19 `409`. Dijalankan di `tests/concurrency/`, keluaran ditempel.
**T-U2** Booking `released` tidak menghalangi booking baru untuk meja yang sama (indeks virtual NULL).
**T-U3 Webhook token salah** → `403`, dan query log membuktikan **tidak ada** query database dijalankan.
**T-U4** Webhook dengan `external_id` yang tidak cocok dengan `id` invoice → `404`, tidak ada record baru.
**T-U5** Webhook `PAID` dikirim dua kali → satu pass dibuat, satu email diantrekan.
**T-U6** `invoice_duration` yang dikirim ke Xendit = 840, `held_until` = 900 detik setelah dibuat.
**T-U7** `bookings:expire` melepas booking lewat waktu; dijalankan dua kali tanpa efek tambahan; aman bila webhook `EXPIRED` datang bersamaan.
**T-U8** Xendit gagal saat membuat invoice → booking `released`, respons `502`, meja bebas lagi.
**T-U9** Aplikasi menolak start dengan kunci berawalan `xnd_production_`.
**T-U10** No-show: pass dicabut, deposit tidak berubah, tidak ada panggilan refund.

### 3.3 Guestlist (S4)
**T-G1 Kuota bersamaan.** Kuota 40, 50 pendaftaran 1 orang bersamaan: tepat 40 tersimpan. Keluaran ditempel.
**T-G2** Rombongan 8 saat sisa 6 → `422` dengan `places_left: 6`.
**T-G3** HP sama, malam sama → `409`. HP sama, malam lain → diterima. Pendaftar dihapus lalu mendaftar lagi → diterima.
**T-G4** Mode `personal` 4 orang tanpa nama anggota ketiga → `422` pada `guest_names.2`. Mode `group` tanpa nama anggota → diterima.
**T-G5** Mode `personal` 4 orang menghasilkan 4 pass `people=1`; mode `group` menghasilkan 1 pass `people=4`.
**T-G6** Lewat `guestlist_cutoff` → `422`, termasuk cutoff `00:30` diuji pada `00:15` dan `00:45`.
**T-G7** Kirim ulang keempat dalam satu jam → `429`.
**T-G8** Turnstile: `TURNSTILE_SECRET` terisi dan token tidak ada → `422`; kosong → dilewati.

### 3.4 Pass dan pintu (S5, S6)
**T-P1 Lintas bahasa.** PHP menandatangani 200 payload acak ke fixture; Vitest memverifikasi semuanya dengan WebCrypto. **200 dari 200 lulus.** Menangkap bug DER ke r‖s yang hanya muncul saat `r` atau `s` diawali byte tinggi.
**T-P2** Satu byte payload diubah → verifikasi gagal → layar "Not a Fanglle QR".
**T-P3** QR tanggal lain → "Wrong night".
**T-P4 Kode masuk (F17).** `k7qm 4txp`, `K7QM-4TXP`, `K7QM4TXP`, dan `K7QM4TXP` dengan `O` di tempat `0` menemukan pass yang sama, di backend dan di pencocokan hash frontend.
**T-P5** Manifest tidak mengandung `entry_code` asli maupun HP lengkap; hanya `entry_code_hash` dan `phone_last4`.
**T-P6** 11 kode salah dalam semenit → kolom terkunci 60 detik; endpoint online membalas `429` setelah 10.
**T-P7 Idempoten.** `client_uuid` sama dikirim tiga kali → `inside_count` bertambah sekali.
**T-P8 Konflik.** Pass `people=2`, dua check-in offline masing-masing 2 disinkronkan → keduanya tersimpan, yang kedua `conflict=true`, muncul di riwayat pintu.
**T-P9 Alat pemindai.** Simulasi ketikan cepat `FNG2…` + Enter → pindaian. Ketikan dengan jeda 200 ms → bukan pindaian. Enter kosong saat hasil hijau → konfirmasi. Pindaian baru saat hasil hijau belum dikonfirmasi → ditolak, rombongan pertama tidak ikut lolos.

### 3.5 Akses dan tim (S7, S8)
**T-A1** Peran `door` membuka `/api/admin/*` → `403`.
**T-A2** Tanpa login membuka `/api/door/*` → `401`.
**T-A3** Menonaktifkan atau menurunkan manager aktif terakhir → `422`.
**T-A4** Manager menonaktifkan diri sendiri → `422`.
**T-A5** Undangan lewat 48 jam → `410`. Token dipakai dua kali → `410`.
**T-A6** Akun `disabled` kehilangan semua sesi aktif saat itu juga.
**T-A7** Endpoint daftar admin tidak pernah mengirim HP lengkap.
**T-A8** Tidak ada rute akun tamu: `POST /api/register` → `404`; halaman publik tidak memuat formulir login.

### 3.6a Cakupan aturan

| Aturan | Tes |
|---|---|
| F1 | T-A8 |
| F2 | T-W1, T-W2, T-G6 |
| F3 | T-W3 |
| F4 | T-U1, T-U2 |
| F5 | T-U6, T-U7, M3 |
| F6 | T-U10 |
| F7 | T-U3, T-U4, T-U5 |
| F8 | T-G1, T-G2, T-G3 |
| F9 | T-G4, T-G5 |
| F10 | T-P1, T-P2, T-P3 |
| F11, F12 | T-P7, T-P8, M5 |
| F13 | T-G7, M1 |
| F14 | T-P5, T-A7 |
| F15 | T-A3 sampai T-A6 |
| F16 | T-G8 |
| F17 | T-P4, T-P6, M8 |

### 3.6 Tes manual

Dicatat di `docs/qa-log.md` dengan tanggal, perangkat, hasil.

| # | Skenario | Lulus jika |
|---|---|---|
| M1 | Pesan meja lewat tunnel, bayar di halaman Xendit mode uji | Status `paid` dari webhook, email QR diterima |
| M2 | Sama, tapi tunnel dimatikan | Status tetap `paid` lewat polling cadangan |
| M3 | Biarkan 15 menit tanpa bayar | Meja bebas lagi di denah |
| M4 | Buka halaman QR, mode pesawat, muat ulang | QR dan kode masuk tetap tampil dengan banner |
| M5 | HP pintu mode pesawat, 2 pindaian + 1 kode, lalu online | 3 check-in tersinkron, tanpa duplikat |
| M6 | Alat pemindai USB di laptop | Pindaian tanpa klik apa pun; angka + Enter meloloskan sebagian rombongan |
| M7 | Kamera HP di ruangan gelap, layar tamu di kecerahan penuh | Terbaca kurang dari 2 detik |
| M8 | Kamera dan alat pemindai dimatikan, ketik kode dari layar tamu | Hasil sama dengan pindaian |
| M9 | Semua wilayah hanya dengan keyboard | Semua aksi tercapai, fokus selalu terlihat |
| M10 | Lebar 360 px | Tanpa gulir mendatar kecuali di dalam tabel dan denah |
| M11 | `fanglle:demo-reset` | Minggu berjalan muncul dengan tanggal yang benar |
| M12 | Pulihkan dari `mysqldump` ke database kosong | Aplikasi berjalan dengan data utuh |

### 3.7 Pemetaan ke potongan

| Potongan | Tes wajib lulus |
|---|---|
| S2 | T-W1 sampai T-W4 |
| S3 | T-U1 sampai T-U10, M1 sampai M3 |
| S4 | T-G1 sampai T-G8 |
| S5 | T-P1, T-P2, T-P4, M4 |
| S6 | T-P3, T-P5 sampai T-P9, M5 sampai M8 |
| S7, S8 | T-A1 sampai T-A8 |
| S10 | Semuanya, M9 sampai M12 |

---

## 4. Claude Code Execution Prompt (untuk sub-agent qa)

```text
Uji potongan {SN} dengan tes dari docs/prd-fanglle-3-testing.md §3.7.
Kontrak: docs/prd-fanglle-0-kontrak-dan-rencana.md.

Tulis tes di backend/tests/, frontend/src/**/*.test.js, tests/fixtures/, tests/concurrency/.
JANGAN mengubah kode aplikasi. Kode salah = laporkan, bukan perbaiki.

Laporan:
- setiap ID tes: LULUS atau GAGAL, dengan keluaran perintah nyata
- setiap GAGAL: file dan baris penyebab, aturan F mana yang dilanggar
- tes manual: tulis langkahnya di docs/qa-log.md untuk dijalankan manusia; jangan mencentangnya sendiri
```
