# Deploy ke server rumah

Runbook untuk membuka The Fanglle II ke publik lewat tunnel cloudflared. Deploy harus ditanyakan dulu ke pemilik (CLAUDE.md). Semua langkah di bawah dijalankan di server, dari folder proyek.

## Yang harus disiapkan pemilik

| Butuh | Untuk | Diisi di |
|---|---|---|
| Domain di Cloudflare | URL publik dan tunnel | `APP_URL` |
| Kunci Turnstile (site + secret) | Perlindungan bot di form pesan meja dan guestlist. Kosong berarti mati | `VITE_TURNSTILE_SITE_KEY` (saat build), `TURNSTILE_SECRET` |
| Callback token Xendit mode Test | Memverifikasi webhook pembayaran | `XENDIT_CALLBACK_TOKEN` |
| Kunci Xendit `xnd_development_...` | Invoice mode uji. Kunci lain tidak boleh dipakai | `XENDIT_SECRET_KEY` |
| SMTP | Email QR dan undangan tim. Dengan `log`, email hanya masuk log | `MAIL_*` |

## 1. Kode dan dependensi

```bash
git pull
cd backend && composer install --no-dev --optimize-autoloader
cd ../frontend && npm ci && VITE_TURNSTILE_SITE_KEY=<site key> npm run build
```

`npm run build` menulis ke `backend/public/app` dan `backend/public/sw.js`. Kunci site Turnstile tertanam saat build, jadi build ulang bila kuncinya berganti.

## 2. `.env` produksi

Salin `backend/.env.example` ke `backend/.env`, lalu ubah:

```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://<domain>
LOG_LEVEL=warning
SESSION_SECURE_COOKIE=true
DB_PASSWORD=<kata sandi MySQL>
TURNSTILE_SECRET=<secret>
XENDIT_SECRET_KEY=xnd_development_<...>
XENDIT_CALLBACK_TOKEN=<token>
MAIL_MAILER=smtp
```

`APP_URL` harus domain publik: Sanctum memakai host-nya untuk sesi login staf, dan email memakai URL-nya untuk link QR.

## 3. Sekali saja

```bash
cd backend
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force      # staf demo, denah 16 meja, minggu demo
php artisan fanglle:keys         # kunci tanda tangan QR, di storage/app/keys
```

Ganti kata sandi staf demo (`password`) sebelum dibuka, atau undang staf baru dari panel Team lalu nonaktifkan akun demo.

## 4. Setiap deploy

```bash
cd backend
php artisan migrate --force
php artisan optimize             # cache config, route, view
```

Setelah `optimize`, perubahan `.env` baru terbaca sesudah `php artisan optimize` lagi.

## 5. Proses yang harus selalu jalan

| Proses | Perintah | Kenapa |
|---|---|---|
| Penjadwal | `php artisan schedule:work` (atau Task Scheduler tiap menit: `php artisan schedule:run`) | Melepas meja yang tidak dibayar dalam 15 menit, backup 05:00, reset minggu demo 12:00 |
| Antrean | `php artisan queue:work --tries=3` | Email QR guestlist dan undangan tim dikirim lewat antrean |
| Tunnel | `cloudflared tunnel run <nama>` | Meneruskan domain ke web server lokal |

Tunnel harus jalan di mesin yang sama dengan web server. Laravel hanya memercayai `X-Forwarded-For` dari `127.0.0.1` dan `::1` (`bootstrap/app.php`), jadi batas percobaan per tamu tetap terpisah. Bila cloudflared dipindah ke mesin lain, tambahkan alamatnya di sana.

## 6. Web server

Document root hanya `backend/public`, tidak pernah folder `backend` (lihat catatan Laragon di memori proyek: `.env` dan kunci QR pernah terbuka karena itu). Arahkan tunnel ke vhost itu.

## 7. Webhook Xendit

Di dashboard Xendit mode Test, Settings > Webhooks > Invoices paid: `https://<domain>/api/webhooks/xendit`. Token di halaman yang sama diisi ke `XENDIT_CALLBACK_TOKEN`.

## 8. Cek setelah deploy

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<domain>/up            # 200
curl -s -o /dev/null -w "%{http_code}\n" https://<domain>/.env          # 404
curl -sI https://<domain>/ | grep -i "content-security-policy\|strict-transport"
```

Lalu dari HP lewat data seluler: buka beranda, pesan meja sampai halaman bayar Xendit uji, daftar guestlist, buka QR, matikan sinyal dan buka QR lagi. Ini sekaligus uji M1, M2 dan M8 di `progress.md`.
