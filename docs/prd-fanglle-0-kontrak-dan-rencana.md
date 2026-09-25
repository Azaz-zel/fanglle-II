# The Fanglle II · Dokumen 0: Kontrak Data dan Rencana Eksekusi

Versi 1.0 · September 2026 · Proyek portofolio Ralph de Vinca Group

> Dokumen ini sumber kebenaran untuk nama tabel, kolom, endpoint, bentuk JSON, dan urutan kerja. PRD Backend (1), Frontend (2), dan Testing (3) merujuk ke sini. **Kalau ada perbedaan, dokumen ini yang menang.**

---

## 1. Project Summary & Objectives

Web nightclub fiktif bergaya superclub di Canggu. Tamu melihat acara dan memesan tanpa akun; staf mengelola dari panel dan memindai QR di pintu.

| Antarmuka | Pengguna | Autentikasi |
|---|---|---|
| Situs publik: Home, Event, Gallery, About | Tamu | Tidak ada |
| Pesan meja, Guestlist | Tamu | Tidak ada, anti-bot |
| Halaman QR (`/p/:id`) | Tamu | Tautan rahasia |
| Pemindai pintu (`/door`) | Door staff, Manager | Login |
| Panel pengelola (`/admin`) | Manager | Login |

**Berhasil jika:** siapa pun bisa membuka demo, memesan meja dengan deposit mode uji Xendit, mendaftar guestlist 1 sampai 10 orang, lalu QR-nya terpindai di pintu, termasuk saat tanpa sinyal.

**Mockup yang mengikat** (tampilan, teks, perilaku): `fanglle-halaman-depan-mockup.jsx`, `fanglle-event-gallery-about-mockup.jsx`, `fanglle-pilih-meja-mockup.jsx`, `fanglle-guestlist-mockup.jsx`, `fanglle-qr-tamu-mockup.jsx`, `fanglle-pemindai-pintu-mockup.jsx`, `fanglle-pemindai-pintu-desktop-mockup.jsx`, `fanglle-pengelola-mockup.jsx`. Panel "Kontrol pratinjau" di mockup tidak dibangun.

**Penamaan:** tabel, kolom, endpoint, JSON, enum dalam bahasa Inggris `snake_case`. Teks antarmuka dalam bahasa Inggris, sesuai mockup.

---

## 2. Architecture & Technical Stack

Laravel (API + penyaji hasil build) · React + Vite · MySQL 8 · Sanctum sesi cookie · Xendit Invoice API mode uji · Laravel Mail lewat antrean · Cloudflare Turnstile. Detail ada di Dokumen 1 dan 2.

### 2.1 Aturan yang mengikat semua sisi

**F1. Tamu tidak pernah login.** Tidak ada akun tamu di versi ini.

**F2. Satu zona waktu, satu malam.** `APP_TIMEZONE=Asia/Makassar`. Sebuah "malam" diwakili tanggal acara. Jam sebelum 12:00 milik malam sebelumnya: set 01:00 pada acara 24 Sep terjadi 25 Sep dini hari, tetap acara 24 Sep. Fungsi pembanding waktu malam wajib memakai aturan ini di backend dan frontend.

**F3. Pintu buka 15:00 setiap malam** (`NIGHT_OPENS_AT=15:00`, konfigurasi, bukan per acara). **Jam tutup diatur per acara** (`close_time`), boleh lewat tengah malam sampai 12:00. Halaman publik tidak lagi menulis "10 pm" atau "last entry 2 am"; semua jam dibaca dari data.

**F4. Satu meja, satu booking aktif per malam.** Ditegakkan database lewat kolom virtual unik (lihat §2.2), bukan hanya di kode.

**F5. Tahan 15 menit, invoice 14 menit.** Booking ditahan 900 detik, tapi invoice Xendit dibuat dengan `invoice_duration: 840`. Invoice selalu mati satu menit sebelum meja dilepas, jadi pembayaran tidak mungkin masuk untuk meja yang sudah diberikan ke tamu lain. Meja lepas saat webhook `EXPIRED` atau penjadwal menemukan `held_until` lewat, mana yang lebih dulu. Keduanya idempoten.

**F6. Deposit = 50% minimum spend zona malam itu,** dipotong dari minimum spend. **Deposit hangus** bila batal atau tidak datang. Tidak ada endpoint refund.

**F7. Webhook Xendit:** cocokkan header `x-callback-token` sebelum menyentuh database. Cocokkan `id` invoice **dan** `external_id` ke booking yang ada. Webhook tidak pernah membuat record baru. Pemrosesan idempoten per pasangan (invoice, status).

**F8. Kuota guestlist dihitung per orang,** dikunci di dalam transaksi dengan `SELECT ... FOR UPDATE` pada baris acara. Satu pendaftaran aktif per nomor HP per malam.

**F9. Mode QR guestlist:** `group` (satu pass untuk N orang) atau `personal` (N pass, masing-masing bernama, nama anggota wajib). Pemesan mengisi nama, HP, email; anggota hanya nama.

**F10. Format QR:** `FNG2.{payload}.{sig}`
- `payload` = base64url dari JSON `{"p":"<pass public_id>","e":"YYYY-MM-DD","k":"group|personal|table"}`
- `sig` = tanda tangan **ECDSA P-256 / SHA-256** atas string `payload`, format **raw r‖s 64 byte** (IEEE P1363), base64url.
- `openssl_sign` di PHP menghasilkan DER. **Wajib dikonversi ke r‖s** sebelum di-encode, karena WebCrypto di browser hanya menerima r‖s. Kunci publik dibagikan ke perangkat pintu; kunci privat tidak pernah keluar dari server.

**F11. Pass dipakai per orang:** `inside_count ≤ people`. Tiap check-in menambah hitungan. Override manajer dicatat dengan tanda.

**F12. Check-in idempoten per `client_uuid`.** Perangkat pintu yang offline mengantre check-in lalu menyinkronkan. Bila sinkron membuat `inside_count > people` (dua perangkat offline memindai pass yang sama), server **menerima** dan menandai `conflict=true`: orangnya sudah masuk secara fisik, jadi yang tepat adalah mencatat, bukan menolak.

**F13. QR dikirim lewat email,** diantrekan. Kirim ulang maksimal 3 kali per jam per pendaftaran. Tidak ada WhatsApp API. Tombol "Share on WhatsApp" di halaman sukses hanya tautan `wa.me` dari HP pemesan.

**F14. Data pribadi minimum:** nama, HP, email. Endpoint daftar untuk pintu dan admin hanya mengirim **4 digit terakhir** HP. Nomor lengkap tidak pernah ada di respons daftar.

**F15. Peran staf:** `manager` dan `door`. Minimal satu manager aktif. Tidak bisa menonaktifkan atau menurunkan peran diri sendiri. Undangan berlaku 48 jam; kata sandi dibuat penerima dari tautan undangan.

**F16. Anti-bot:** token Cloudflare Turnstile wajib di semua POST publik bila `TURNSTILE_SECRET` terisi; kosong di lokal = dilewati. Ditambah rate limit.

**F17. Kode masuk manual.** Setiap pass punya `entry_code` 8 karakter Crockford base32 (tanpa I, L, O, U), ditampilkan sebagai `XXXX-XXXX` di bawah QR dan di email. Dipakai bila kamera atau alat pemindai tidak berfungsi. Normalisasi sebelum dicocokkan: huruf besar, buang spasi dan tanda hubung, `O`→`0`, `I` dan `L`→`1`. Manifest hanya membawa `entry_code_hash` = SHA-256 hex dari kode yang sudah dinormalisasi, bukan kodenya. Percobaan dibatasi 10 kode salah per menit per perangkat; lewat batas, input dikunci 60 detik.

### 2.2 Skema database

```php
// users (staf)
$table->id(); $table->string('name'); $table->string('email')->unique();
$table->string('password')->nullable();          // null sampai undangan diterima
$table->string('role', 12);                        // manager | door
$table->string('status', 12)->default('invited'); // invited | active | disabled
$table->string('invite_token_hash')->nullable(); $table->timestamp('invite_expires_at')->nullable();
$table->timestamp('last_active_at')->nullable(); $table->rememberToken(); $table->timestamps();

// events
$table->id(); $table->date('date')->unique();
$table->string('name', 80); $table->string('genre', 60)->nullable(); $table->string('blurb', 220)->nullable();
$table->unsignedSmallInteger('guestlist_quota'); $table->time('guestlist_cutoff'); $table->time('close_time');
$table->unsignedBigInteger('min_spend_stage'); $table->unsignedBigInteger('min_spend_booth'); $table->unsignedBigInteger('min_spend_bar');
$table->timestamps();

// lineup_slots
$table->id(); $table->foreignId('event_id')->constrained()->cascadeOnDelete();
$table->string('performer', 80);
$table->string('role', 12);   // headliner | guest_star | support | warm_up | closing | b2b
$table->time('starts_at'); $table->time('ends_at'); $table->unsignedTinyInteger('position');

// venue_tables (denah tetap, di-seed)
$table->id(); $table->string('code', 4)->unique();   // S1..S4, B1..B6, T1..T6
$table->string('zone', 8);                          // stage | booth | bar
$table->string('shape', 8);                         // round | booth | high
$table->unsignedTinyInteger('capacity'); $table->unsignedSmallInteger('x'); $table->unsignedSmallInteger('y');

// table_bookings
$table->id(); $table->string('code', 12)->unique();  // F2-XXXX
$table->foreignId('event_id')->constrained(); $table->foreignId('venue_table_id')->constrained();
$table->string('status', 12);                        // held | paid | released | no_show
$table->string('name', 80); $table->string('phone', 20); $table->string('email');
$table->unsignedTinyInteger('party_size');
$table->unsignedBigInteger('min_spend'); $table->unsignedBigInteger('deposit');
$table->timestamp('held_until'); $table->timestamp('paid_at')->nullable();
$table->string('xendit_invoice_id')->nullable()->unique(); $table->string('xendit_invoice_url')->nullable();
$table->timestamps();
$table->unsignedBigInteger('active_table_id')->nullable()
      ->virtualAs("IF(status IN ('held','paid'), venue_table_id, NULL)");
$table->unique(['event_id', 'active_table_id']);    // F4: MySQL mengizinkan banyak NULL

// guestlist_signups
$table->id(); $table->foreignId('event_id')->constrained();
$table->string('name', 80); $table->string('phone', 20); $table->string('email');
$table->unsignedTinyInteger('party_size'); $table->string('qr_mode', 10);   // group | personal
$table->timestamp('removed_at')->nullable(); $table->unsignedTinyInteger('resend_count_hour')->default(0);
$table->timestamp('resend_window_at')->nullable(); $table->timestamps();
$table->string('active_phone')->nullable()->virtualAs("IF(removed_at IS NULL, phone, NULL)");
$table->unique(['event_id', 'active_phone']);        // F8

// passes (satu baris per QR)
$table->id(); $table->string('public_id', 26)->unique();   // ULID, ada di URL /p/:id
$table->char('entry_code', 8)->unique();                    // F17, disimpan tanpa tanda hubung
$table->foreignId('event_id')->constrained();
$table->string('kind', 10);                         // group | personal | table
$table->foreignId('guestlist_signup_id')->nullable()->constrained();
$table->foreignId('table_booking_id')->nullable()->constrained();
$table->string('holder_name', 80); $table->unsignedTinyInteger('people');
$table->unsignedTinyInteger('inside_count')->default(0); $table->timestamp('revoked_at')->nullable();
$table->timestamps();

// check_ins
$table->id(); $table->uuid('client_uuid')->unique();       // F12
$table->foreignId('pass_id')->constrained(); $table->foreignId('user_id')->constrained();
$table->unsignedTinyInteger('count');
$table->string('method', 10);                       // scan | code | search | override
$table->boolean('conflict')->default(false); $table->timestamp('scanned_at'); $table->timestamps();

// webhook_events (F7)
$table->id(); $table->string('invoice_id'); $table->string('status', 16);
$table->unique(['invoice_id', 'status']); $table->timestamps();
```

### 2.3 Endpoint

Prefix `/api`. Tanggal `YYYY-MM-DD`, jam `HH:MM`, uang dalam rupiah bulat.

**Publik**

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/events?from=YYYY-MM-DD&days=7` | Daftar acara minggu ini + ketersediaan singkat |
| GET | `/events/{date}` | Detail acara, line-up terurut F2, ketersediaan |
| GET | `/events/{date}/tables` | Denah dan status tiap meja: `free` \| `held` \| `booked` |
| POST | `/table-bookings` | Tahan meja, buat invoice Xendit |
| GET | `/table-bookings/{code}?k={secret}` | Status booking (polling setelah bayar) |
| POST | `/guestlist` | Daftar guestlist |
| POST | `/guestlist/resend` | Kirim ulang email QR |
| GET | `/passes/{public_id}` | Isi halaman QR |
| POST | `/webhooks/xendit` | Webhook invoice |

`GET /events/{date}`:
```json
{
  "date": "2026-09-25", "name": "Second Wave", "genre": "Afro house", "blurb": "…",
  "opens_at": "15:00", "close_time": "04:00", "guestlist_cutoff": "23:00",
  "lineup": [{ "performer": "Marcel Oduya", "role": "headliner", "starts_at": "00:30", "ends_at": "02:30" }],
  "min_spend": { "stage": 16000000, "booth": 24000000, "bar": 8000000 },
  "tables": { "status": "few", "free": 4 },
  "guestlist": { "status": "open", "places_left": 6 }
}
```
`tables.status`: `open` | `few` (≤ 4 bebas) | `sold_out`. `guestlist.status`: `open` | `full` | `closed` (lewat cutoff).

`POST /table-bookings` → `201`:
```json
// request
{ "date": "2026-09-25", "table_code": "B5", "party_size": 7, "name": "…", "phone": "…", "email": "…",
  "age_confirmed": true, "turnstile_token": "…" }
// response
{ "code": "F2-7K4Q", "secret": "…", "held_until": "2026-09-25T20:14:00+08:00",
  "deposit": 12000000, "min_spend": 24000000, "payment_url": "https://checkout-staging.xendit.co/…" }
```
Meja tidak bebas → `409`. Kapasitas < party → `422`.

`GET /table-bookings/{code}?k=` → `{ "status": "held|paid|released|no_show", "held_until": "…", "pass_url": "/p/01J…" | null }`.

`POST /guestlist` → `201`:
```json
// request
{ "date": "2026-09-25", "party_size": 4, "qr_mode": "personal", "name": "…", "phone": "…", "email": "…",
  "guest_names": ["…", "…", "…"], "age_confirmed": true, "turnstile_token": "…" }
// response
{ "passes": [{ "holder_name": "…", "pass_url": "/p/01J…" }] }
```
Kuota kurang → `422` dengan `places_left`. HP sudah terdaftar malam itu → `409`. Lewat cutoff → `422`.

`GET /passes/{public_id}` → `{ "kind", "holder_name", "people", "inside_count", "event": {…}, "qr": "FNG2.…", "entry_code": "K7QM-4TXP", "status": "ready|partial|used|expired|revoked" }`.

**Pintu** (login, peran `door` atau `manager`)

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/door/{date}/manifest?since=` | Semua pass malam itu untuk disimpan di perangkat |
| GET | `/door/public-key` | Kunci publik ECDSA (JWK) |
| GET | `/door/{date}/codes/{code}` | Cari pass lewat kode masuk saat online; `404` bila tidak ada; rate limit 10 per menit per akun |
| POST | `/door/check-ins` | Kirim satu atau banyak check-in (batch) |

Manifest per pass: `{ public_id, kind, holder_name, people, inside_count, phone_last4, table_code, revoked, entry_code_hash }`. `since` mengembalikan hanya yang berubah.

`POST /door/check-ins`: `{ "items": [{ "client_uuid": "…", "public_id": "…", "count": 2, "method": "scan|code|search|override", "scanned_at": "…" }] }` → `{ "results": [{ "client_uuid", "inside_count", "conflict" }] }`.

**Pengelola** (login, peran `manager`)

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/admin/tonight` | Ringkasan kartu besar dan tiga kartu |
| GET | `/admin/events/{date}/table-bookings?status=&q=` | Daftar booking |
| POST | `/admin/table-bookings/{code}/release` | Lepas meja yang ditahan |
| POST | `/admin/table-bookings/{code}/no-show` | Tandai tidak datang, cabut pass |
| GET | `/admin/events/{date}/guestlist?qr_mode=&arrival=&q=` | Daftar guestlist |
| DELETE | `/admin/guestlist/{id}` | Hapus pendaftar yang belum masuk |
| GET | `/admin/events/{date}/check-ins?overrides=1` | Riwayat pintu |
| GET, POST | `/admin/events` | Daftar, buat acara |
| GET, PUT | `/admin/events/{date}` | Baca, ubah acara + line-up |
| GET, POST | `/admin/staff` | Daftar staf, undang |
| PATCH | `/admin/staff/{id}` | Ubah peran |
| POST | `/admin/staff/{id}/disable` · `/enable` · `/reset-password` · `/resend-invite` | Aksi akun |
| DELETE | `/admin/staff/{id}/invite` | Batalkan undangan |
| POST | `/invites/{token}/accept` | Publik: buat kata sandi dari undangan |

### 2.4 Bentuk error

```json
{ "message": "Kalimat bahasa Inggris yang layak ditampilkan.", "errors": { "email": ["Enter your email. Your QR is sent there."] } }
```
`401` belum login · `403` peran tidak berwenang · `404` tidak ditemukan · `409` konflik keadaan · `410` kedaluwarsa · `422` validasi · `429` terlalu banyak.

---

## 3. Actionable Task Breakdown: rencana potongan vertikal

Setiap potongan menghasilkan fitur utuh dari database sampai layar, dikerjakan bergiliran: **backend → frontend → qa**. Rincian tugas per bidang ada di Dokumen 1, 2, 3 dengan kode potongan yang sama.

| Potongan | Hasil | Bergantung pada |
|---|---|---|
| **S1 Fondasi** | Repo, migrasi, seed denah dan 4 acara contoh, login staf, kerangka publik/pintu/admin, token warna dan huruf | · |
| **S2 Acara** | Home "This week", Detail event dengan line-up, admin Events (buat, ubah, line-up, jam tutup) | S1 |
| · *Checkpoint A:* situs publik menampilkan acara dari database; admin bisa membuat acara baru yang langsung tampil | | |
| **S3 Pesan meja** | Denah, tahan 15 menit, invoice Xendit, webhook, kedaluwarsa, email, halaman konfirmasi | S2 |
| **S4 Guestlist** | Formulir 1 sampai 10, kuota, satu per HP, mode QR, email, kirim ulang | S2 |
| **S5 Halaman QR** | `/p/:id` dengan QR bertanda tangan, kode masuk manual, keadaan, simpan untuk tanpa sinyal | S3, S4 |
| · *Checkpoint B:* booking dan guestlist berakhir di halaman QR yang benar dan email terkirim | | |
| **S6 Pintu** | Pemindai kamera dan alat pemindai, input kode manual, hitungan rombongan, cari nama, override, antrean tanpa sinyal | S5 |
| **S7 Operasional admin** | Overview, booking meja, guestlist, riwayat pintu | S6 |
| · *Checkpoint C:* satu malam penuh bisa disimulasikan dari pemesanan sampai laporan | | |
| **S8 Tim** | Undangan, peran, nonaktif, reset kata sandi | S1 |
| **S9 Halaman konten** | About, Gallery tempat kosong berlabel, menu lengkap, jam 15:00 di semua halaman | S2 |
| **S10 Pengerasan** | Rate limit, keamanan, audit aksesibilitas, build produksi, backup | Semua |
| · *Checkpoint D:* seluruh isi Dokumen 3 lulus | | |

**Aman diparalelkan:** S8 dan S9 tidak saling bergantung dengan S3 sampai S7.

### Risiko dan mitigasi

| Risiko | Mitigasi |
|---|---|
| Webhook Xendit tidak bisa dites di `localhost` | Tunnel publik HTTPS saat pengembangan; plus polling status invoice sebagai cadangan |
| Tanda tangan DER tidak terbaca WebCrypto | Konversi ke r‖s di satu fungsi dengan unit test lintas bahasa (Dokumen 3) |
| Dua perangkat pintu offline meloloskan pass yang sama | Diterima dan ditandai `conflict` (F12); versi pertama menyarankan satu perangkat per pintu |
| Kamera HP lambat di ruang gelap | Alat pemindai genggam didukung penuh (versi desktop) |
| Kamera dan alat pemindai sama-sama gagal | Kode masuk 8 karakter bisa diketik (F17), tetap bekerja tanpa sinyal |

### Pertanyaan terbuka

Tidak ada yang memblokir. Keputusan yang sudah diambil: deposit hangus, Xendit, email, buka 15:00.

---

## 4. Claude Code Execution Prompt (sesi utama)

Satu sesi Claude Code sebagai pemimpin proyek. Sub-agent `backend`, `frontend`, `qa` didefinisikan di `.claude/agents/`.

```text
Kamu pemimpin proyek The Fanglle II. Baca CLAUDE.md, lalu docs/prd-fanglle-0-kontrak-dan-rencana.md.

Kerjakan potongan S1 sampai S10 berurutan sesuai tabel §3. Untuk setiap potongan:
1. Delegasikan bagian backend ke sub-agent backend, dengan tugas potongan itu dari Dokumen 1.
2. Setelah backend lulus, delegasikan bagian frontend ke sub-agent frontend, dari Dokumen 2.
3. Setelah frontend lulus, delegasikan pengujian ke sub-agent qa, dari Dokumen 3.
4. Temuan qa dikembalikan ke sub-agent yang bertanggung jawab. Ulangi sampai lulus.
5. Commit: "feat(sN): <ringkasan>".

Di setiap checkpoint (A, B, C, D): BERHENTI dan laporkan ke aku dengan keluaran nyata
perintah test dan build, lalu tunggu "lanjut" sebelum potongan berikutnya.

BERHENTI DAN TANYA sebelum:
- mengubah kontrak di Dokumen 0
- menambah dependensi yang tidak disebut di Dokumen 1 atau 2
- menghapus file yang bukan buatan sesi ini
- apa pun yang menyentuh uang sungguhan atau kunci Xendit mode live

Klaim "lulus" wajib disertai keluaran nyata perintahnya.
```
