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
