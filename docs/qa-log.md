# QA log

Tes manual dari Dokumen 3 §3.6. Tiap baris: tanggal, perangkat, hasil. Yang belum dijalankan manusia ditandai **belum**.

## S6 · Pintu

Data uji: acara malam ini lewat admin, guestlist lewat `POST /api/guestlist`, satu booking meja dibayar. Akun pintu `door.a@thefanglle.example`, manager `manager@thefanglle.example` (kata sandi dev dari seeder).

| # | Langkah | Lulus jika | Hasil |
|---|---|---|---|
| M5 | HP pintu buka `/door`, "Start scanning", mode pesawat. Pindai 2 QR (kamera), ketik 1 kode dari layar tamu, "Let in" ketiganya. Matikan mode pesawat, tunggu paling lama 15 detik. | Bilah sinkron: "Offline. ... 3 check-ins waiting to sync." lalu "Online. All check-ins synced."; di database 3 baris `check_ins` baru, `client_uuid` berbeda, salah satunya `method=code` | **belum** di HP. 2026-09-30, Chrome desktop, jaringan diputus dengan mematikan `php artisan serve`: 2 pindaian alat + 1 kode masuk antrean IndexedDB (`scan 1`, `scan 3`, `code 3`), setelah server hidup: 3 baris, 3 uuid berbeda, `inside_count` sesuai. Kirim ulang uuid yang sama 2 kali: `inside_count` tetap 1 |
| M6 | Laptop, alat pemindai USB. "Start scanning", jangan klik apa pun. Pindai QR grup 4 orang, tekan `2`, `Enter`. | Layar hijau muncul tanpa klik; "Let 2 in"; log "2 in"; pindaian QR lain saat hijau ditolak dengan pesan | **belum** dengan alat asli. 2026-09-30, Chrome desktop, ketikan disimulasikan (`keydown` beruntun + Enter): hijau, `2` mengubah jumlah, Enter meloloskan 2, pindaian baru saat hijau menampilkan "A new QR was scanned..." dan tidak meloloskan siapa pun |
| M7 | HP pintu di ruangan gelap, layar tamu kecerahan penuh, kamera belakang. | Terbaca kurang dari 2 detik | **belum** |
| M8 | Tutup kamera, cabut alat pemindai. Ketik kode dari layar tamu di "Type a code" (HP: tombol di samping "Search by name"). Ulangi dalam mode pesawat. | Hasil sama dengan pindaian, log bertanda "Code"; offline tetap ketemu lewat hash | **belum** di HP. 2026-09-30, Chrome desktop: online `39n9 cq3k` diformat `39N9-CQ3K`, ketemu lewat server; offline ketemu lewat hash manifest, `method=code` tercatat di server setelah sinkron; kode salah: "No pass with this code tonight. Check the letters, or search by name." |

## Checkpoint C · satu malam dari pesanan sampai laporan

2026-09-30, Chrome desktop dan iframe 360/390 px, database dev, malam "Late Hours" (Tue 29 Sep).

| Langkah | Lewat | Hasil |
|---|---|---|
| Guestlist 4 pendaftaran (grup dan personal) | `POST /api/guestlist` | Pass dan kode masuk terbit |
| Meja ditahan, meja dibayar | `TableBooking::create` + `applyInvoiceStatus('PAID')` di tinker (tanpa Xendit) | Pass meja terbit. **Belum**: bayar sungguhan di halaman Xendit mode uji (M1, M2) |
| Pintu: pindai, kode, cari, override, tanpa sinyal | `/door`, akun pintu dan manager | Semua tercatat di `check_ins` dengan metode yang benar |
| Overview | `/admin` | Inside, guestlist datang dari terdaftar, meja, deposit, garis waktu F2, grafik per jam, "Needs you" |
| Lepas meja ditahan, tandai no-show, hapus pendaftar | Panel detail + konfirmasi | Database `released`, `no_show` (pass dicabut), `removed_at` (pass dicabut) |
| Riwayat pintu | `/admin/door` | Semua check-in, filter override, check-in melebihi batas pass tampil (T-P8) |
| Lebar 360 px | iframe | `/admin`, tables, guestlist, door, events tanpa gulir mendatar; tabel bergulir di dalam kotaknya |

## S8 · Tim dan undangan

2026-09-30, Chrome desktop, database dev, akun manager dari seeder.

| Langkah | Hasil |
|---|---|
| Undang tanpa isi, lalu email yang sudah ada | "Add their name.", "Enter a valid email...", "That email already has an account." di bawah kolom, fokus ke kolom pertama yang salah |
| Undang Manager B (manager) | Flash "Invite sent to ... 48 hours", baris "Invite pending", mail antre, link `/invite/{token}` di log mail |
| `/invite/token-salah` | "This link doesn't work" (404) |
| `/invite/{token}` kata sandi pendek, lalu tidak cocok, lalu benar | "Use at least 10 characters.", "The two passwords don't match.", "Password set"; tombol Sign in mengisi email di halaman login |
| Link yang sama dipakai lagi | "This link has run out" (410) |
| Ganti peran, disable (konfirmasi), enable, reset password (konfirmasi, Keep it), resend, cancel invite | Semua flash sesuai; database: peran, status, dan baris undangan terhapus sesuai |

## S9 · About dan Gallery

| Langkah | Hasil |
|---|---|
| `/about` | Jam "How a night runs" dari malam pertama minggu ini (F3), urut malam (F2); tanpa "Last entry" karena tidak ada datanya |
| `/gallery` | 12 bingkai "Photo to come" dengan brief, bentuk, alt text; filter kategori; penampil dengan Previous, Next, Close |
| Menu dan kaki halaman | This week, Gallery, About di semua halaman publik (Home juga Tables, Guestlist, Visit); "Book a table" di menu |

## S10 · Audit akhir

| Pemeriksaan | Hasil |
|---|---|
| 360 px, 12 rute publik, staf, dan 404 | Tanpa gulir mendatar |
| Console dan error runtime, 15 rute | Nol |
| h1 dan landmark `main` | Satu h1 dan satu `main` di setiap halaman (diperbaiki: `/p/:id` tanpa h1, `/door` tanpa `main`) |
| Kontrol tanpa nama, input tanpa label | Nol |
| Otorisasi | Tanpa login: `/api/door/*` 401, `/door` ke login. Akun pintu: `/api/admin/*` 403, `/admin/*` ke `/door` |
| Regresi S6 | Pindai meja hijau, QR palsu merah, Enter menutup |
| Regresi S7 | Panel detail, konfirmasi Keep it dan hapus sukses lewat `Confirm` bersama |
| **Belum** | Escape di penampil Gallery tidak bisa diuji: tab uji tersembunyi, peramban tidak mengirim event `close`. Komponen `Dialog` yang sama lulus uji Escape di S7 |
