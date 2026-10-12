---
version: 1
slug: "frontend-src-public-jsx"
primary_target: "frontend/src/Public.jsx"
related_targets: ["frontend/src/Door.jsx","frontend/src/Admin.jsx"]
---

# Surface brief: situs publik (Home sebagai layar pertama)

Mode: Persuade (publik), Operate (pintu, pengelola). Satu dunia visual untuk semua wilayah.
Audiens: tamu yang merencanakan malam di Canggu, kebanyakan dari HP, malam hari. Aksi utama: pesan meja atau daftar guestlist untuk satu malam tertentu.
Bukti: data malam dari API (nama, line-up, jam, status meja, kuota guestlist). Belum ada foto: bingkai foto berlabel.
Kerja dimulai di Figma (file IYZsfCaMIJuIwKp7kK2uxH); desain Figma yang di-ACC menjadi acuan saat dibangun di kode.

## Direction contract

THESIS: Tiap malam punya cahayanya sendiri. Halaman adalah ruangan berkabut yang disiram gel warna malam terpilih; menolak susunan bawaan kategori (foto kerumunan penuh layar, emas di atas hitam, kartu line-up seragam).

OWN-WORLD: Dasar blackout #0C0A0E dengan permukaan kabut bertingkat; teks putih tungsten #F1ECE4. Empat gel per hari malam (Kam biru Congo, Jum amber, Sab merah, Min rose), satu gel di panggung pada satu waktu. Sorot cahaya volumetrik lembut dari atas. Tombol utama putih tungsten (lampu kerja), bukan warna gel. Huruf tampilan tinggi dan ramping (Big Shoulders Display, tipis) seperti berkas sorot; teks Albert Sans. Sudut tajam 2 px. Tiga keadaan cahaya saja: menyala, redup, gelap.

STORY: Tamu melihat malam terdekat menyala, paham siapa main dan kapan, membandingkan malam lain dengan menyentuh contoh gel di tepi bawah, lalu memesan meja atau masuk guestlist tanpa meninggalkan layar pertama.

FIRST VIEWPORT: Seluruh layar dicuci gel malam terdekat, paling terang di tengah atas (rig) memudar ke blackout di bawah. Kicker hari dan jam pintu, nama malam huruf tipis raksasa rata kiri di sepertiga bawah, line-up satu baris, tombol Book a table (tungsten) dan Join the guestlist (garis) di bawahnya. Strip empat contoh gel selebar konten di tepi bawah layar sebagai pemilih malam.

FORM: Gel dan Kabut, urutan 3 dari daftar sendiri, seed key ec41aa15. Gerak khas (disetujui di board Crystals dan Motion, 7 Okt 2026): ganti malam = cue cahaya. Teks keluar 260 ms; kristal malam lama bergeser jauh keluar 520 ms (lapisan depan paling jauh); gel berganti lewat transisi 900 ms; kristal malam baru masuk 1000 ms (lapisan belakang dulu); nama masuk huruf demi huruf 32 ms. Saat diam kristal mengambang, bergoyang, dan miring pelan sesuai komposisi malamnya. Reduced motion: hanya fade. Urutan masuk setiap halaman: lampu ruangan turun, gel naik, sorot menyala, teks.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
