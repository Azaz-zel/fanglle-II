# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Tamu (publik):** orang yang merencanakan malam keluar di Canggu, biasanya dari HP, sering di jalan atau sudah dalam suasana pesta. Mereka melihat acara minggu ini, memesan meja dengan deposit, atau mendaftar guestlist untuk 1 sampai 10 orang, tanpa akun. Di pintu, mereka membuka halaman QR di HP, kadang tanpa sinyal.
- **Door staff:** berdiri di pintu, ruangan gelap dan bising, satu tangan memegang HP atau alat pemindai genggam. Butuh jawaban masuk/tolak dalam sekejap, bisa tanpa sinyal dan tanpa mouse.
- **Manager:** mengelola acara, line-up, booking meja, guestlist, tim, dan riwayat pintu dari laptop, sebelum dan selama malam berjalan.
- **Pembaca portofolio:** calon klien Ralph de Vinca Group yang menilai mutu desain dan rekayasa dari demo ini.

## Product Purpose

The Fanglle II adalah nightclub fiktif bergaya superclub di Canggu, Bali, dibuat sebagai proyek portofolio Ralph de Vinca Group. Web ini menangani seluruh perjalanan satu malam: melihat acara, memesan meja dengan deposit (Xendit mode uji), mendaftar guestlist, menerima QR, dan dipindai di pintu. Berhasil bila siapa pun bisa membuka demo, memesan, mendaftar, lalu QR-nya terpindai di pintu, termasuk saat tanpa sinyal.

## Positioning

Satu sistem utuh dari layar publik sampai pintu: QR bertanda tangan ECDSA yang bisa diverifikasi tanpa sinyal, kode masuk cadangan yang bisa diketik, dan denah meja dengan tombol nyata per meja. Kebanyakan situs klub hanya brosur yang mengarah ke WhatsApp.

## Operating Context

- Klub buka Kamis sampai Minggu. Hari malam berganti pukul 12:00 siang; jam setelah tengah malam milik malam sebelumnya (`nightMinutes`, F2). Zona waktu Asia/Makassar.
- Meja per zona (`stage`, `booth`, `bar`), satu booking aktif per meja per malam, ditahan 15 menit saat membayar deposit 50% minimum spend.
- Guestlist berkuota per orang, mode QR `group` atau `personal`, ditutup pada `guestlist_cutoff`.
- Pintu memakai kamera HP atau alat pemindai USB yang berperilaku seperti keyboard; antrean check-in tersinkron saat sinyal kembali.

## Capabilities and Constraints

- Satu aplikasi React (Vite) dengan tiga wilayah: publik, pintu (`/door`), pengelola (`/admin`). Backend Laravel menyajikan API dan hasil build.
- Jam, harga, nama, dan line-up selalu dari API; tidak ada yang ditulis mati.
- Halaman QR dan pemindai harus tetap bekerja tanpa sinyal (service worker, IndexedDB, huruf di-host sendiri).
- HP lengkap hanya di daftar booking dan guestlist admin; pintu dan ringkasan hanya 4 digit terakhir (F14).
- Paket `motion` disetujui pemilik (7 Okt 2026) di luar daftar PRD §2. Paket lain tetap butuh persetujuan.
- Teks antarmuka berbahasa Inggris.

## Brand Commitments

- Nama: **The Fanglle II**. Angka Romawi **II** adalah bagian nama.
- Cerita nama: "Named for the second fall: not the one that ends the night, the one that starts it." Nada teks: pendek, tenang, percaya diri, sedikit puitis, tanpa hype.
- Identitas visual lama (obsidian, amethyst, garnet, Poiret One, Didact Gothic, serpihan kristal) boleh dirombak total sejak 7 Okt 2026, asal tetap bernuansa dunia malam, mewah, elegan, tidak norak.
- Tanpa em dash di teks antarmuka.
- Situs menyatakan diri sebagai venue fiktif: "A fictional venue. Portfolio concept by Ralph de Vinca Group."

## Evidence on Hand

- Data demo: empat malam (Descent, Second Wave, Fall Line, Afterglow), DJ fiktif, minimum spend per zona, dari seeder dan `php artisan fanglle:demo-reset`.
- Belum ada foto. Pemilik akan menambah folder foto sendiri; sampai itu, desain memakai bingkai foto kosong berlabel brief foto. Jangan mengarang foto, testimoni, pers, atau angka pengunjung.

## Product Principles

1. Satu malam, satu alur: dari melihat acara sampai melewati pintu tidak boleh ada jalan buntu.
2. Pintu menang atas gaya: di `/door`, kecepatan, kontras, dan keterbacaan di ruangan gelap mengalahkan estetika.
3. Data yang jujur: status meja, kuota, dan jam selalu dari server, ditampilkan apa adanya.
4. Mewah lewat kendali, bukan dekorasi: ruang, ritme, dan gerak yang terarah, bukan efek yang ramai.

## Accessibility & Inclusion

- Kontras teks minimal 4,5:1; semua elemen interaktif bisa dipakai dengan keyboard, fokus terlihat.
- `prefers-reduced-motion` dihormati di semua animasi.
- Lebar 360 px tanpa gulir mendatar; target sentuh minimal 44 px.
- Hasil pindai di pintu tidak pernah hanya mengandalkan warna: selalu ada tulisan besar dan bunyi.
