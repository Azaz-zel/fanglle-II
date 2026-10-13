# Graph Report - fanglle II  (2026-10-13)

## Corpus Check
- 155 files · ~124,532 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 42 file(s) not represented in the graph (top: (none) 19, .woff2 8, .css 7)

## Summary
- 1531 nodes · 3351 edges · 88 communities (62 shown, 26 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 72 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4eb2445a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- sw.js
- The Fanglle II - CLAUDE.md Project Instructions
- User
- PassSigner
- composer.json
- package.json
- Public.jsx
- TableBooking
- GuestlistSignup
- static
- Components
- fanglle-pengelola-mockup.jsx
- S3 Pesan Meja (Table Booking Slice)
- Door.jsx
- VenueTable
- Illuminate\Http\Request
- S10 Pengerasan (Hardening Slice)
- StaffRole
- StaffTest
- CheckIn
- AdminNight.jsx
- Illuminate\Database\Eloquent\Model
- stage.jsx
- AdminEvents.jsx
- Closure
- PublicEventsTest
- S5 Halaman QR (QR Page Slice)
- S4 Guestlist Slice
- Admin.jsx
- GuestlistTest
- S2 Acara (Events Slice)
- The Fanglle II
- Night
- 0001_01_01_000000_create_users_table.php
- fanglle-pilih-meja-mockup.jsx
- HardeningTest
- S7 Operasional Admin Slice
- Product
- Pass.jsx
- S6 Pintu (Door Scanner Slice)
- AdminEventsTest
- fanglle-halaman-depan-mockup.jsx
- TestCase
- DoorTest
- Progress pengerjaan
- Event
- api
- Pass
- AdminOperationsTest.php
- fanglle-event-gallery-about-mockup.jsx
- App
- hold-same-table.sh
- fanglle-guestlist-mockup.jsx
- fanglle-pemindai-pintu-desktop-mockup.jsx
- guestlist-quota.sh
- VenueTable.php
- dependencies
- logging.php
- sanctum.php
- restore-check.sh
- QA log
- AuthTest
- vite.config.js
- artisan
- AuthController.php
- Illuminate\Http\JsonResponse
- frontend index.html (Vite SPA shell)
- Deploy ke server rumah
- regions.test.js
- verify-qr.mjs
- devDependencies
- POST /guestlist/resend
- @tanstack/react-query@5.103.2
- react-router-dom@7.18.4
- fanglle-qr-tamu-mockup.jsx
- Surface brief: situs publik (Home sebagai layar pertama)
- scripts
- LoadError

## God Nodes (most connected - your core abstractions)
1. `Event` - 67 edges
2. `User` - 63 edges
3. `Pass` - 50 edges
4. `TableBooking` - 41 edges
5. `api()` - 41 edges
6. `TestCase` - 33 edges
7. `errorText()` - 30 edges
8. `Night` - 28 edges
9. `clock()` - 28 edges
10. `StaffTest` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Aturan yang paling sering dilanggar` --references--> `nightMinutes()`  [INFERRED]
  AGENTS.md → frontend/src/night.js
- `Operating Context` --references--> `nightMinutes()`  [INFERRED]
  PRODUCT.md → frontend/src/night.js
- `Named Rules` --references--> `i`  [INFERRED]
  DESIGN.md → backend/public/sw.js
- `Redesign "Gel dan Kabut" (7 Okt 2026, cabang `redesign-gel-kabut`, belum di-commit)` --references--> `DoorTest`  [INFERRED]
  docs/progress.md → backend/tests/Feature/DoorTest.php
- `Redesign "Gel dan Kabut" (7 Okt 2026, cabang `redesign-gel-kabut`, belum di-commit)` --references--> `HardeningTest`  [INFERRED]
  docs/progress.md → backend/tests/Feature/HardeningTest.php

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **QR Signature Chain (sign, verify, test)** — docs_prd_fanglle_0_kontrak_dan_rencana_f10, docs_prd_fanglle_1_backend_passsigner, docs_prd_fanglle_1_backend_dertoraw, docs_prd_fanglle_2_frontend_offline_signature_validation, docs_prd_fanglle_3_testing_t_p1 [EXTRACTED 0.95]
- **Design Authority Chain (Contract > PRD+Mockup > Skill)** — docs_prd_fanglle_0_kontrak_dan_rencana, docs_prd_fanglle_2_frontend, claude_antislop_gate, claude_taste_skill, claude_ponytail_rule [EXTRACTED 1.00]
- **S3 Table Booking Vertical Slice** — docs_prd_fanglle_0_kontrak_dan_rencana_s3, docs_prd_fanglle_1_backend_b3_1, docs_prd_fanglle_1_backend_b3_2, docs_prd_fanglle_1_backend_b3_3, docs_prd_fanglle_1_backend_b3_4, docs_prd_fanglle_2_frontend_f3_1 [EXTRACTED 1.00]

## Communities (88 total, 26 thin omitted)

### Community 0 - "sw.js"
Cohesion: 0.06
Nodes (25): b, c(), constructor(), d(), e, f(), h, i (+17 more)

### Community 1 - "The Fanglle II - CLAUDE.md Project Instructions"
Cohesion: 0.15
Nodes (20): Backend README (Laravel Boilerplate), The Fanglle II - CLAUDE.md Project Instructions, Backend Sub-agent Definition, Frontend Sub-agent Definition, QA Sub-agent Definition, antislop Delivery Gate, Design Authority Order (Contract > PRD+mockup > skill), ponytail (minimal code, PRD decisions not simplified) (+12 more)

### Community 2 - "User"
Cohesion: 0.20
Nodes (9): StaffStatus, User, StaffPolicy, Illuminate\Auth\Access\Response, Illuminate\Database\Eloquent\Attributes\Hidden, Illuminate\Database\Eloquent\Attributes\UsePolicy, Illuminate\Database\Eloquent\Factories\HasFactory, Illuminate\Foundation\Auth\User (+1 more)

### Community 3 - "PassSigner"
Cohesion: 0.09
Nodes (10): AppServiceProvider, PassSigner, QrCrossLanguageTest, PassSignerDerTest, Illuminate\Cache\RateLimiting\Limit, Illuminate\Support\Facades\RateLimiter, Illuminate\Support\ServiceProvider, InvalidArgumentException (+2 more)

### Community 4 - "composer.json"
Cohesion: 0.04
Nodes (47): pestphp/pest-plugin, php-http/discovery, autoload, autoload-dev, psr-4, psr-4, config, allow-plugins (+39 more)

### Community 5 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, type, idb, motion, qrcode, react-dom, @zxing/browser

### Community 6 - "Public.jsx"
Cohesion: 0.06
Nodes (55): Redesign "Gel dan Kabut" (7 Okt 2026, cabang `redesign-gel-kabut`, belum di-commit), dayParts(), gelOf(), idr(), mmss(), secondsLeft(), tableState(), Qr() (+47 more)

### Community 7 - "TableBooking"
Cohesion: 0.08
Nodes (7): TableBooking, Xendit, TableBookingTest, XenditWebhookTest, Illuminate\Database\Eloquent\Relations\HasOne, Illuminate\Http\Client\PendingRequest, self

### Community 8 - "GuestlistSignup"
Cohesion: 0.12
Nodes (12): CheckInMethod, PassKind, QrMode, GuestlistController, GuestlistPasses, GuestlistSignup, Turnstile, GuestContact (+4 more)

### Community 10 - "Components"
Cohesion: 0.08
Nodes (23): Buttons, Cards and panels, Chips and swatches, Colors, Components, Crystals (signature), Design System: The Fanglle II, Do: (+15 more)

### Community 11 - "fanglle-pengelola-mockup.jsx"
Cohesion: 0.09
Nodes (24): App(), addRow(), applyStart(), saveEvent(), startCreate(), blankEvent(), BOOKINGS, dayLabel() (+16 more)

### Community 12 - "S3 Pesan Meja (Table Booking Slice)"
Cohesion: 0.09
Nodes (31): GET /table-bookings/{code}, POST /table-bookings, POST /webhooks/xendit, F4: One Table, One Active Booking Per Night, F5: Hold 15 Minutes, Invoice 14 Minutes, F6: Deposit 50% of Minimum Spend, Forfeited, F7: Xendit Webhook Never Creates Records, S3 Pesan Meja (Table Booking Slice) (+23 more)

### Community 13 - "Door.jsx"
Cohesion: 0.09
Nodes (55): applyResults(), beep(), Camera(), cameraError(), checkIn(), CodeForm(), submit(), codeHash() (+47 more)

### Community 14 - "VenueTable"
Cohesion: 0.16
Nodes (5): EventController, TableBookingController, VenueTable, DatabaseSeeder, Illuminate\Database\Seeder

### Community 15 - "Illuminate\Http\Request"
Cohesion: 0.30
Nodes (3): StaffController, XenditWebhookController, Illuminate\Http\Request

### Community 16 - "S10 Pengerasan (Hardening Slice)"
Cohesion: 0.10
Nodes (21): /graphify . trigger after S1, Checkpoint D, S1 Fondasi (Foundation Slice), S10 Pengerasan (Hardening Slice), S8 Tim (Staff Team Slice), B10.1 Rate limit and security headers, B1.1 Proyek dan skema, B1.2 Login staf (+13 more)

### Community 17 - "StaffRole"
Cohesion: 0.19
Nodes (10): StaffRole, StaffInvite, TableBooked, Illuminate\Bus\Queueable, Illuminate\Contracts\Queue\ShouldBeEncrypted, Illuminate\Contracts\Queue\ShouldQueue, Illuminate\Mail\Mailable, Illuminate\Mail\Mailables\Content (+2 more)

### Community 19 - "CheckIn"
Cohesion: 0.13
Nodes (7): CheckInController, GuestlistController, Controller, CheckIn, Illuminate\Http\Response, Illuminate\Support\Facades\Gate, Illuminate\Validation\Rule

### Community 20 - "AdminNight.jsx"
Cohesion: 0.10
Nodes (44): ARRIVAL_BADGE, ARRIVALS, BOOKING_CHIPS, Bookings(), CONFIRM, DoorLog(), Drawer(), resend() (+36 more)

### Community 21 - "Illuminate\Database\Eloquent\Model"
Cohesion: 0.14
Nodes (10): HourMinute, BookingStatus, LineupSlot, Illuminate\Contracts\Database\Eloquent\CastsAttributes, Illuminate\Database\Eloquent\Attributes\Fillable, Illuminate\Database\Eloquent\Attributes\Unguarded, Illuminate\Database\Eloquent\Model, Illuminate\Database\UniqueConstraintViolationException (+2 more)

### Community 22 - "stage.jsx"
Cohesion: 0.15
Nodes (18): NIGHT_KEYS, COMP, Crystals(), DESCENT, f(), FALL, GLOW, idle() (+10 more)

### Community 23 - "AdminEvents.jsx"
Cohesion: 0.21
Nodes (17): blank(), detailQuery(), Events(), addRow(), applyStart(), save(), startCreate(), fromApi() (+9 more)

### Community 24 - "Closure"
Cohesion: 0.23
Nodes (7): EnsureActive, EnsureRole, SecurityHeaders, Closure, Illuminate\Auth\AuthenticationException, Illuminate\Support\Facades\Auth, Symfony\Component\HttpFoundation\Response

### Community 26 - "S5 Halaman QR (QR Page Slice)"
Cohesion: 0.09
Nodes (33): Checkpoint B, GET /door/{date}/codes/{code}, GET /door/{date}/manifest, GET /door/public-key, GET /passes/{public_id}, POST /door/check-ins, F10: QR Format FNG2 with ECDSA P-256 Signature, F17: Manual Entry Code (Crockford Base32) (+25 more)

### Community 27 - "S4 Guestlist Slice"
Cohesion: 0.14
Nodes (17): F13: QR Delivered via Queued Email, Resend Limited, F16: Anti-bot via Cloudflare Turnstile, F8: Guestlist Quota Locked with SELECT FOR UPDATE, F9: Guestlist QR Modes group/personal, S4 Guestlist Slice, B4.1 Pendaftaran guestlist, B4.2 Kirim ulang, Cloudflare Turnstile (server verification) (+9 more)

### Community 28 - "Admin.jsx"
Cohesion: 0.08
Nodes (28): longDate(), NAV, Shell(), useTick(), clubNow(), eventsQuery, nightQuery(), Login() (+20 more)

### Community 30 - "S2 Acara (Events Slice)"
Cohesion: 0.11
Nodes (19): Checkpoint A, events table, F2: One Timezone, One Night (nightMinutes), F3: Doors Open 15:00, Close Time Per Event, lineup_slots table, S2 Acara (Events Slice), S9 Halaman Konten Slice, B2.1 Endpoint publik acara (+11 more)

### Community 31 - "The Fanglle II"
Cohesion: 0.22
Nodes (8): Aturan yang paling sering dilanggar, Baca sebelum mengerjakan apa pun, Berhenti dan tanya sebelum, Cara kerja, Perintah, Susunan, The Fanglle II, Urutan otoritas desain

### Community 32 - "Night"
Cohesion: 0.06
Nodes (15): LineupRole, EventRequest, EntryCode, Night, DemoWeekSeeder, Carbon, XenditKeyGuardTest, EntryCodeTest (+7 more)

### Community 33 - "0001_01_01_000000_create_users_table.php"
Cohesion: 0.16
Nodes (3): Illuminate\Database\Migrations\Migration, Illuminate\Database\Schema\Blueprint, Illuminate\Support\Facades\Schema

### Community 34 - "fanglle-pilih-meja-mockup.jsx"
Cohesion: 0.15
Nodes (8): App(), idr(), MIN, mmss(), NIGHTS, TABLES, TAKEN, ZONES

### Community 36 - "S7 Operasional Admin Slice"
Cohesion: 0.12
Nodes (19): Checkpoint C, POST /guestlist, F1: Guests Never Log In, F14: Minimal Personal Data, Phone Last 4 Digits Only, F15: Staff Roles manager/door, Invite Expires 48h, guestlist_signups table, S7 Operasional Admin Slice, users table (staff accounts) (+11 more)

### Community 37 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 38 - "Pass.jsx"
Cohesion: 0.13
Nodes (17): clock(), dayLabel(), entryCode(), PASS_KINDS, passOrCopy(), passState(), ev, validUntil() (+9 more)

### Community 39 - "S6 Pintu (Door Scanner Slice)"
Cohesion: 0.22
Nodes (13): check_ins table, F11: Pass Usage inside_count <= people, F12: Check-in Idempotent per client_uuid, S6 Pintu (Door Scanner Slice), B6.1 Manifest, B6.1b Cari kode, B6.2 Check-in batch, M5: Manual test - door phone airplane mode sync (+5 more)

### Community 42 - "TestCase"
Cohesion: 0.08
Nodes (16): KeysCommandTest, OpeningTimeTest, SpaTest, TestCase, Illuminate\Foundation\Testing\RefreshDatabase, Illuminate\Foundation\Testing\TestCase, Illuminate\Http\Client\Request, Illuminate\Support\Facades\Artisan (+8 more)

### Community 44 - "Progress pengerjaan"
Cohesion: 0.25
Nodes (7): Belum, Penyimpangan dari mockup, Progress pengerjaan, Ringkas, Sebelum web dibuka ke publik, Tambahan setelah S10 (30 Sep 2026), Uji terakhir

### Community 45 - "Event"
Cohesion: 0.14
Nodes (4): Event, DemoResetTest, SeedTest, Illuminate\Database\Eloquent\Relations\HasMany

### Community 46 - "api"
Cohesion: 0.09
Nodes (36): S10 · Audit akhir, Failed(), Skel(), blankInvite, CONFIRM, InviteForm(), send(), staffQuery (+28 more)

### Community 47 - "Pass"
Cohesion: 0.13
Nodes (4): Pass, Illuminate\Database\Eloquent\Builder, Illuminate\Database\Eloquent\Relations\BelongsTo, Symfony\Component\Uid\Ulid

### Community 48 - "AdminOperationsTest.php"
Cohesion: 0.05
Nodes (42): App\Enums\BookingStatus, App\Enums\CheckInMethod, App\Enums\PassKind, App\Enums\QrMode, App\Enums\StaffRole, App\Http\Controllers\Admin, App\Http\Controllers\AuthController, App\Http\Controllers\Controller (+34 more)

### Community 49 - "fanglle-event-gallery-about-mockup.jsx"
Cohesion: 0.29
Nodes (6): App(), CATS, idr(), NIGHTS, SHARDS, SHOTS

### Community 50 - "App"
Cohesion: 0.32
Nodes (6): App(), beep(), open(), start(), GUESTS, SCANS

### Community 51 - "hold-same-table.sh"
Cohesion: 0.33
Nodes (6): cleanup(), DB_DATABASE, PUBLIC_POSTS_PER_MINUTE, hold-same-table.sh script, stop_port(), STUB_LOG

### Community 52 - "fanglle-guestlist-mockup.jsx"
Cohesion: 0.29
Nodes (3): App(), emptyForm, NIGHTS

### Community 53 - "fanglle-pemindai-pintu-desktop-mockup.jsx"
Cohesion: 0.29
Nodes (4): App(), GUESTS, INITIAL_LOG, SIM

### Community 54 - "guestlist-quota.sh"
Cohesion: 0.40
Nodes (5): cleanup(), DB_DATABASE, PUBLIC_POSTS_PER_MINUTE, guestlist-quota.sh script, stop_port()

### Community 56 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, idb, motion, qrcode, react, react-dom, react-router-dom, @tanstack/react-query (+1 more)

### Community 57 - "logging.php"
Cohesion: 0.40
Nodes (4): Monolog\Handler\NullHandler, Monolog\Handler\StreamHandler, Monolog\Handler\SyslogUdpHandler, Monolog\Processor\PsrLogMessageProcessor

### Community 58 - "sanctum.php"
Cohesion: 0.40
Nodes (4): Illuminate\Cookie\Middleware\EncryptCookies, Illuminate\Foundation\Http\Middleware\ValidateCsrfToken, Laravel\Sanctum\Http\Middleware\AuthenticateSession, Laravel\Sanctum\Sanctum

### Community 59 - "restore-check.sh"
Cohesion: 0.60
Nodes (4): cleanup(), DB_DATABASE, mysql_(), restore-check.sh script

### Community 60 - "QA log"
Cohesion: 0.29
Nodes (6): Checkpoint C · satu malam dari pesanan sampai laporan, QA log, S6 · Pintu, S8 · Tim dan undangan, S9 · About dan Gallery, Setelah S10 · Audit taste-skill dan Find my QR

### Community 62 - "vite.config.js"
Cohesion: 0.29
Nodes (4): out, ref_node_url, vite, vite-plugin-pwa

### Community 64 - "AuthController.php"
Cohesion: 0.24
Nodes (4): AuthController, UserFactory, Illuminate\Database\Eloquent\Factories\Factory, Illuminate\Support\Facades\Hash

### Community 65 - "Illuminate\Http\JsonResponse"
Cohesion: 0.12
Nodes (9): App\Support\EntryCode, App\Support\PassSigner, EventController, TableBookingController, DoorController, PassController, Controller, Illuminate\Http\JsonResponse (+1 more)

### Community 66 - "frontend index.html (Vite SPA shell)"
Cohesion: 0.50
Nodes (4): frontend index.html (Vite SPA shell), Web App Manifest link (/manifest.webmanifest, no start_url), #root mount element, theme-color #0C0812

### Community 67 - "Deploy ke server rumah"
Cohesion: 0.18
Nodes (10): 1. Kode dan dependensi, 2. `.env` produksi, 3. Sekali saja, 4. Setiap deploy, 5. Proses yang harus selalu jalan, 6. Web server, 7. Webhook Xendit, 8. Cek setelah deploy (+2 more)

### Community 68 - "regions.test.js"
Cohesion: 0.33
Nodes (4): app, entry, graph(), manifest

### Community 69 - "verify-qr.mjs"
Cohesion: 0.40
Nodes (3): { jwk, items }, results, ref_node_fs

### Community 70 - "devDependencies"
Cohesion: 0.50
Nodes (4): devDependencies, vite, vite-plugin-pwa, vitest

### Community 84 - "fanglle-qr-tamu-mockup.jsx"
Cohesion: 0.50
Nodes (3): App(), TYPES, useQrPattern()

### Community 86 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, test

## Knowledge Gaps
- **262 isolated node(s):** `h`, `b`, `Ringkas`, `Tambahan setelah S10 (30 Sep 2026)`, `Uji terakhir` (+257 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 510 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Redesign "Gel dan Kabut" (7 Okt 2026, cabang `redesign-gel-kabut`, belum di-commit)` connect `Public.jsx` to `Night`, `HardeningTest`, `Pass.jsx`, `DoorTest`, `Progress pengerjaan`?**
  _High betweenness centrality (0.320) - this node is a cross-community bridge._
- **Why does `DoorTest` connect `DoorTest` to `GuestlistSignup`, `TestCase`, `Public.jsx`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **Why does `gelOf()` connect `Public.jsx` to `AdminNight.jsx`, `Admin.jsx`, `Door.jsx`, `Pass.jsx`?**
  _High betweenness centrality (0.161) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Event` (e.g. with `.__invoke()` and `.pass()`) actually correct?**
  _`Event` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `User` (e.g. with `.arrive()` and `.asManager()`) actually correct?**
  _`User` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `Pass` (e.g. with `.__invoke()` and `.record()`) actually correct?**
  _`Pass` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `h`, `b`, `Ringkas` to the rest of the system?**
  _262 weakly-connected nodes found - possible documentation gaps or missing edges._