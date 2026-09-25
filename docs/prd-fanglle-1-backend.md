# The Fanglle II · Dokumen 1: PRD Backend

Versi 1.0 · September 2026

> Baca Dokumen 0 lebih dulu. Skema, endpoint, aturan F1 sampai F16 diambil dari sana dan tidak diubah di sini.

---

## 1. Project Summary & Objectives

Laravel melayani API untuk situs publik, pintu, dan panel pengelola, sekaligus menyajikan hasil build React.

**Tujuan backend:**
1. Satu meja tidak pernah terjual dua kali, dan kuota guestlist tidak pernah terlampaui, walau permintaan datang bersamaan
2. Uang hanya bergerak lewat Xendit mode uji, dan status pembayaran hanya berubah dari webhook yang terverifikasi
3. QR tidak bisa dipalsukan, dan bisa diperiksa di pintu tanpa sinyal
4. Demo tetap hidup berbulan-bulan tanpa disentuh

---

## 2. Architecture & Technical Stack

| Bagian | Pilihan |
|---|---|
| Framework | Laravel versi stabil terbaru, PHP 8.3+ |
| Database | MySQL 8, `utf8mb4` |
| Auth staf | Sanctum, sesi cookie SPA (satu domain) |
| Antrean | Driver `database`, untuk email |
| Penjadwal | `schedule:run` tiap menit |
| Pembayaran | Xendit Invoice API lewat Laravel HTTP client, **tanpa SDK** |
| Tanda tangan QR | `openssl` bawaan PHP, ECDSA P-256 |
| Anti-bot | Cloudflare Turnstile, diverifikasi server lewat HTTP |
| Email lokal | Mailpit, atau driver `log` |

Tanpa SDK Xendit: hanya dua panggilan yang dibutuhkan (buat invoice, baca invoice), dan HTTP client Laravel cukup. Satu dependensi lebih sedikit untuk dirawat.

### 2.1 Variabel lingkungan

```dotenv
APP_TIMEZONE=Asia/Makassar
NIGHT_OPENS_AT=15:00
XENDIT_SECRET_KEY=xnd_development_...        # hanya kunci mode uji
XENDIT_CALLBACK_TOKEN=...                    # dari Webhook settings Xendit
QR_PRIVATE_KEY_PATH=storage/app/keys/qr-private.pem
TURNSTILE_SECRET=                            # kosong di lokal = dilewati
DEMO_MODE=true
```

Aplikasi **menolak start** bila `XENDIT_SECRET_KEY` tidak diawali `xnd_development_`. Proyek portofolio tidak boleh bisa menagih uang sungguhan karena salah salin kunci.

### 2.2 Pola inti

**Tahan meja (F4, F5).**
1. Validasi, cek Turnstile, cek kapasitas meja ≥ `party_size`
2. Transaksi: sisipkan booking `held`, `held_until = now + 900 detik`. Pelanggaran indeks unik `(event_id, active_table_id)` → `409` "That table was just taken."
3. **Di luar transaksi:** `POST https://api.xendit.co/v2/invoices` dengan basic auth kunci rahasia, `external_id` = kode booking, `amount` = deposit, `invoice_duration: 840`, `customer.email`, `success_redirect_url` ke halaman konfirmasi
4. Gagal memanggil Xendit → ubah booking jadi `released`, kembalikan `502` "Payment couldn't start. Please try again." Meja tidak boleh tertahan oleh invoice yang tidak pernah ada

**Webhook (F7).** Urutan wajib: cocokkan `x-callback-token` dengan `hash_equals` → `403` tanpa query apa pun bila salah. Lalu cari booking dengan `xendit_invoice_id` **dan** `code = external_id`; tidak ada → `404`, tidak membuat apa pun. Sisipkan `webhook_events (invoice_id, status)`; duplikat → `200` tanpa efek. `PAID` + booking `held` → `paid`, buat pass `table`, antrekan email. `EXPIRED` + booking `held` → `released`.

**Cadangan webhook.** Halaman konfirmasi memanggil `GET /table-bookings/{code}`. Bila booking masih `held` dan invoice sudah ada, backend membaca `GET /v2/invoices/{id}` dari Xendit, dibatasi sekali per 10 detik per booking. Pembayaran tetap tercatat walau webhook terlambat.

**Kedaluwarsa.** Perintah `bookings:expire` tiap menit: kunci baris `held` dengan `held_until < now()`, ubah jadi `released`. Idempoten terhadap webhook `EXPIRED` yang datang bersamaan.

**Guestlist (F8, F9).** Transaksi: `SELECT ... FOR UPDATE` baris event → tolak bila lewat `guestlist_cutoff` (aturan F2) → hitung `SUM(party_size)` pendaftar aktif → tolak bila melebihi kuota → sisipkan pendaftar (indeks unik HP aktif menangkap duplikat → `409`) → buat pass: satu `group` berisi N orang, atau N pass `personal`. Antrekan email setelah commit.

**Tanda tangan QR (F10).** Satu kelas `PassSigner`:
```php
openssl_sign($payload, $der, $privateKey, OPENSSL_ALGO_SHA256);
$raw = self::derToRaw($der, 32);   // r dan s, masing-masing dipad kiri ke 32 byte
return 'FNG2.'.$payload.'.'.self::b64url($raw);
```
`derToRaw` membaca struktur `SEQUENCE { INTEGER r, INTEGER s }`, membuang byte `0x00` di depan bila ada, lalu mem-pad kiri ke 32 byte. Salah satu langkah ini = tanda tangan gagal diverifikasi di browser sekitar separuh waktu, dan itu jenis bug yang lolos dari tes kecil.

Perintah `php artisan fanglle:keys` membuat pasangan kunci P-256 (`curve_name => 'prime256v1'`). `GET /door/public-key` mengembalikan kunci publik sebagai JWK.

**Kode masuk (F17).** Dibuat saat pass dibuat: 8 karakter acak dari alfabet Crockford `0123456789ABCDEFGHJKMNPQRSTVWXYZ` memakai `random_int`, diulang bila bentrok dengan indeks unik. Satu fungsi `EntryCode::normalize()` dipakai di semua tempat: huruf besar, buang spasi dan tanda hubung, `O`→`0`, `I` dan `L`→`1`. Manifest mengirim `hash('sha256', $normalized)`. Endpoint `GET /door/{date}/codes/{code}` menormalisasi dulu lalu mencari, dengan rate limit 10 per menit per akun. Kode tampil di email pass dan email konfirmasi meja.

**Check-in (F11, F12). Per item: sisipkan `check_ins` dengan `client_uuid`; duplikat → kembalikan hasil yang sama tanpa menambah hitungan. Kunci baris pass, tambah `inside_count`. Melebihi `people` → tetap disimpan, `conflict = true`. Pass `revoked` → `409` untuk pemindaian online.

**Undangan staf (F15).** Token acak 40 karakter, hanya hash-nya yang disimpan, berlaku 48 jam. Semua aturan (manager terakhir, tidak bisa mengubah diri sendiri) ditegakkan di Policy, bukan hanya di tombol.

### 2.3 Data demo

Portofolio harus tetap hidup lama setelah dibuat. Seeder membuat **empat acara Kamis sampai Minggu terdekat relatif terhadap tanggal hari ini**, bukan tanggal tetap. Perintah `fanglle:demo-reset` terjadwal tiap hari pukul 12:00 menghapus data pesanan lama dan membuat ulang minggu berjalan. Line-up contoh sama dengan mockup, termasuk dua guest star di Second Wave.

Denah 16 meja di-seed dengan koordinat dari `fanglle-pilih-meja-mockup.jsx`.

### 2.4 Pengembangan lokal

Xendit hanya mengirim webhook ke URL publik HTTPS tanpa port, bukan `localhost`. Pakai tunnel (`cloudflared` atau `ngrok`), daftarkan URL-nya di Webhook settings mode Test. Polling cadangan (§2.2) membuat alur tetap bisa dicoba tanpa tunnel.

---

## 3. Actionable Task Breakdown

Format tiap tugas: deskripsi, kriteria lulus, cara verifikasi. Kode potongan mengikuti Dokumen 0.

### S1 · Fondasi
**B1.1 Proyek dan skema.** Laravel di `backend/`, semua migrasi Dokumen 0 §2.2, enum PHP untuk semua kolom pilihan.
Lulus: `php artisan migrate:fresh --seed` bersih, 16 meja dan 4 acara relatif hari ini ada.
**B1.2 Login staf.** Sanctum SPA, `POST /api/login`, `/logout`, `GET /api/me`. Registrasi publik tidak ada. Seeder: 1 manager, 2 door.
Lulus: akun `disabled` ditolak `403`; rate limit login 5 per menit.
**B1.3 Pengaman kunci.** Tolak start bila kunci Xendit bukan mode uji; perintah `fanglle:keys`.

### S2 · Acara
**B2.1 Endpoint publik acara.** `GET /events`, `GET /events/{date}` dengan line-up terurut aturan F2 dan status ketersediaan.
**B2.2 Admin acara.** `POST/PUT /admin/events` dengan line-up. Validasi: minimal satu `headliner`, jam mulai ≠ jam selesai, `close_time` setelah 15:00 menurut F2, tanggal belum dipakai, kuota ≥ jumlah terdaftar.
Lulus: acara baru langsung muncul di `GET /events`.

### S3 · Pesan meja
**B3.1 Denah dan tahan.** `GET /events/{date}/tables`, `POST /table-bookings` sesuai §2.2.
**B3.2 Xendit dan webhook.** Buat invoice, webhook dengan urutan wajib, polling cadangan.
**B3.3 Kedaluwarsa.** `bookings:expire` terjadwal.
**B3.4 Email konfirmasi.** Berisi tautan pass dan sisa minimum spend.
Lulus: dua permintaan tahan meja yang sama secara bersamaan menghasilkan tepat satu `201` dan satu `409`.

### S4 · Guestlist
**B4.1 Pendaftaran** sesuai §2.2, termasuk mode `personal` yang mewajibkan semua nama.
**B4.2 Kirim ulang** dengan batas 3 per jam.
Lulus: 50 pendaftaran bersamaan pada kuota 40 menghasilkan tepat 40 orang terdaftar.

### S5 · Pass
**B5.1 `PassSigner`, `EntryCode`, `GET /passes/{id}`, `GET /door/public-key`.**
Lulus: tanda tangan dari PHP terverifikasi oleh WebCrypto (tes lintas bahasa di Dokumen 3); `k7qm 4txp`, `K7QM-4TXP`, dan `K7QM4TXP` menemukan pass yang sama.

### S6 · Pintu
**B6.1 Manifest** dengan `since`, HP 4 digit terakhir saja, dan `entry_code_hash`, tidak pernah kode aslinya.
**B6.1b Cari kode** `GET /door/{date}/codes/{code}` dengan rate limit.
**B6.2 Check-in batch** idempoten dengan penanda konflik.

### S7 · Operasional admin
**B7.1** `GET /admin/tonight`, daftar booking dengan filter, lepas meja, tandai no-show (mencabut pass, deposit tetap), daftar guestlist dengan filter `qr_mode` dan `arrival`, hapus pendaftar, riwayat pintu.

### S8 · Tim
**B8.1** Semua endpoint staf dan `POST /invites/{token}/accept`, email undangan dan reset.
Lulus: menonaktifkan manager terakhir ditolak `422`.

### S9 · Konten
**B9.1** `NIGHT_OPENS_AT` ikut di semua respons acara. Tidak ada jam yang ditulis mati di backend.

### S10 · Pengerasan
**B10.1** Rate limit: `POST /table-bookings` 10 per menit per IP, `POST /guestlist` 10 per menit per IP, kirim ulang 3 per jam. Header keamanan, CSP yang mengizinkan Turnstile. `mysqldump` harian, diuji pulih sekali.

---

## 4. Claude Code Execution Prompt (untuk sub-agent backend)

Sesi utama mengirim ini bersama kode potongan.

```text
Kerjakan bagian backend potongan {SN} dari docs/prd-fanglle-1-backend.md.
Kontrak: docs/prd-fanglle-0-kontrak-dan-rencana.md. Hanya ubah file di backend/.

Selesai jika:
- php artisan test lulus, tempel keluarannya
- kriteria "Lulus" tugas potongan ini terbukti dengan keluaran nyata

Dilarang:
- memakai kunci Xendit selain xnd_development_
- membuat record dari webhook
- mengirim nomor HP lengkap di endpoint daftar
- menambah dependensi Composer

Berhenti dan lapor bila kontrak tampak salah atau kurang.
```
