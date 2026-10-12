# Graph Report - fanglle II  (2026-09-30)

## Corpus Check
- 149 files · ~87,863 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 32 file(s) not represented in the graph (top: (none) 19, .toml 4, .woff2 4)

## Summary
- 1413 nodes · 3157 edges · 80 communities (55 shown, 25 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `97f46b6c`
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
- TestCase
- AdminOperationsTest
- main.jsx
- fanglle-pengelola-mockup.jsx
- S3 Pesan Meja (Table Booking Slice)
- Door.jsx
- Controllers/GuestlistController.php
- Illuminate\Http\JsonResponse
- S10 Pengerasan (Hardening Slice)
- GuestlistPasses
- StaffTest
- CheckIn
- AdminNight.jsx
- Illuminate\Database\Eloquent\Model
- Scanner
- AdminEvents.jsx
- bootstrap/app.php
- PublicEventsTest
- S5 Halaman QR (QR Page Slice)
- S4 Guestlist Slice
- EntryCode
- GuestlistSignup
- S2 Acara (Events Slice)
- The Fanglle II
- nightMinutes
- 0001_01_01_000000_create_users_table.php
- fanglle-pilih-meja-mockup.jsx
- HardeningTest
- S7 Operasional Admin Slice
- QA log
- night.js
- S6 Pintu (Door Scanner Slice)
- Event
- fanglle-halaman-depan-mockup.jsx
- KeysCommandTest
- DoorTest
- Progress pengerjaan
- VenueTable
- api
- Pass
- PassEndpointTest
- fanglle-event-gallery-about-mockup.jsx
- App
- hold-same-table.sh
- fanglle-guestlist-mockup.jsx
- fanglle-pemindai-pintu-desktop-mockup.jsx
- guestlist-quota.sh
- VenueTable.php
- AppServiceProvider.php
- logging.php
- sanctum.php
- restore-check.sh
- SpaTest
- AuthTest
- XenditKeyGuardTest
- artisan
- AuthController.php
- TableBookingController
- frontend index.html (Vite SPA shell)
- POST /guestlist/resend
- @tanstack/react-query@5.103.2
- react-router-dom@7.18.4

## God Nodes (most connected - your core abstractions)
1. `Event` - 71 edges
2. `User` - 65 edges
3. `Pass` - 54 edges
4. `TableBooking` - 45 edges
5. `api()` - 44 edges
6. `TestCase` - 37 edges
7. `errorText()` - 36 edges
8. `Night` - 30 edges
9. `GuestlistSignup` - 29 edges
10. `StaffTest` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Aturan yang paling sering dilanggar` --references--> `nightMinutes()`  [INFERRED]
  AGENTS.md → frontend/src/night.js
- `S10 · Audit akhir` --references--> `Confirm()`  [INFERRED]
  docs/qa-log.md → frontend/src/ui.jsx
- `S10 · Audit akhir` --references--> `close()`  [INFERRED]
  docs/qa-log.md → frontend/src/Door.jsx
- `S10 · Audit akhir` --references--> `Dialog()`  [INFERRED]
  docs/qa-log.md → frontend/src/ui.jsx
- `ponytail (minimal code, PRD decisions not simplified)` --semantically_similar_to--> `Visual Rules (font-weight, em dash, contrast)`  [INFERRED] [semantically similar]
  CLAUDE.md → docs/prd-fanglle-2-frontend.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **QR Signature Chain (sign, verify, test)** — docs_prd_fanglle_0_kontrak_dan_rencana_f10, docs_prd_fanglle_1_backend_passsigner, docs_prd_fanglle_1_backend_dertoraw, docs_prd_fanglle_2_frontend_offline_signature_validation, docs_prd_fanglle_3_testing_t_p1 [EXTRACTED 0.95]
- **Design Authority Chain (Contract > PRD+Mockup > Skill)** — docs_prd_fanglle_0_kontrak_dan_rencana, docs_prd_fanglle_2_frontend, claude_antislop_gate, claude_taste_skill, claude_ponytail_rule [EXTRACTED 1.00]
- **S3 Table Booking Vertical Slice** — docs_prd_fanglle_0_kontrak_dan_rencana_s3, docs_prd_fanglle_1_backend_b3_1, docs_prd_fanglle_1_backend_b3_2, docs_prd_fanglle_1_backend_b3_3, docs_prd_fanglle_1_backend_b3_4, docs_prd_fanglle_2_frontend_f3_1 [EXTRACTED 1.00]

## Communities (80 total, 25 thin omitted)

### Community 0 - "sw.js"
Cohesion: 0.06
Nodes (21): a(), b(), c(), d(), e, f(), h, i (+13 more)

### Community 1 - "The Fanglle II - CLAUDE.md Project Instructions"
Cohesion: 0.15
Nodes (20): Backend README (Laravel Boilerplate), The Fanglle II - CLAUDE.md Project Instructions, Backend Sub-agent Definition, Frontend Sub-agent Definition, QA Sub-agent Definition, antislop Delivery Gate, Design Authority Order (Contract > PRD+mockup > skill), ponytail (minimal code, PRD decisions not simplified) (+12 more)

### Community 2 - "User"
Cohesion: 0.20
Nodes (9): StaffStatus, User, StaffPolicy, Illuminate\Auth\Access\Response, Illuminate\Database\Eloquent\Attributes\Hidden, Illuminate\Database\Eloquent\Attributes\UsePolicy, Illuminate\Database\Eloquent\Factories\HasFactory, Illuminate\Foundation\Auth\User (+1 more)

### Community 3 - "PassSigner"
Cohesion: 0.13
Nodes (6): PassSigner, QrCrossLanguageTest, PassSignerDerTest, InvalidArgumentException, OpenSSLAsymmetricKey, RuntimeException

### Community 4 - "composer.json"
Cohesion: 0.04
Nodes (47): pestphp/pest-plugin, php-http/discovery, autoload, autoload-dev, psr-4, psr-4, config, allow-plugins (+39 more)

### Community 5 - "package.json"
Cohesion: 0.05
Nodes (34): { jwk, items }, results, dependencies, idb, qrcode, react, react-dom, react-router-dom (+26 more)

### Community 6 - "Public.jsx"
Cohesion: 0.07
Nodes (38): dayParts(), idr(), mmss(), others(), secondsLeft(), tableState(), blank, blankList (+30 more)

### Community 7 - "TableBooking"
Cohesion: 0.10
Nodes (6): TableBooking, Xendit, TableBookingTest, Illuminate\Database\Eloquent\Relations\HasOne, Illuminate\Http\Client\PendingRequest, self

### Community 8 - "TestCase"
Cohesion: 0.13
Nodes (15): StaffRole, OpeningTimeTest, TestCase, Illuminate\Foundation\Testing\RefreshDatabase, Illuminate\Foundation\Testing\TestCase, Illuminate\Http\Client\Request, Illuminate\Support\Facades\Artisan, Illuminate\Support\Facades\DB (+7 more)

### Community 9 - "AdminOperationsTest"
Cohesion: 0.22
Nodes (5): BookingStatus, CheckInMethod, QrMode, AdminOperationsTest, static

### Community 10 - "main.jsx"
Cohesion: 0.10
Nodes (23): About, Admin, Book, Booking, Door, EventPage, FindQr, Gallery (+15 more)

### Community 11 - "fanglle-pengelola-mockup.jsx"
Cohesion: 0.09
Nodes (24): App(), addRow(), applyStart(), saveEvent(), startCreate(), blankEvent(), BOOKINGS, dayLabel() (+16 more)

### Community 12 - "S3 Pesan Meja (Table Booking Slice)"
Cohesion: 0.09
Nodes (31): GET /table-bookings/{code}, POST /table-bookings, POST /webhooks/xendit, F4: One Table, One Active Booking Per Night, F5: Hold 15 Minutes, Invoice 14 Minutes, F6: Deposit 50% of Minimum Spend, Forfeited, F7: Xendit Webhook Never Creates Records, S3 Pesan Meja (Table Booking Slice) (+23 more)

### Community 13 - "Door.jsx"
Cohesion: 0.11
Nodes (37): applyResults(), Camera(), cameraError(), CodeForm(), submit(), codeHash(), Door, guestLine() (+29 more)

### Community 14 - "Controllers/GuestlistController.php"
Cohesion: 0.15
Nodes (8): GuestlistController, TableBookingController, Turnstile, GuestContact, Illuminate\Contracts\Validation\ValidationRule, Illuminate\Database\UniqueConstraintViolationException, Illuminate\Http\Exceptions\HttpResponseException, Illuminate\Validation\ValidationException

### Community 15 - "Illuminate\Http\JsonResponse"
Cohesion: 0.18
Nodes (6): StaffController, AuthController, DoorController, XenditWebhookController, Illuminate\Http\JsonResponse, Illuminate\Http\Request

### Community 16 - "S10 Pengerasan (Hardening Slice)"
Cohesion: 0.10
Nodes (21): /graphify . trigger after S1, Checkpoint D, S1 Fondasi (Foundation Slice), S10 Pengerasan (Hardening Slice), S8 Tim (Staff Team Slice), B10.1 Rate limit and security headers, B1.1 Proyek dan skema, B1.2 Login staf (+13 more)

### Community 17 - "GuestlistPasses"
Cohesion: 0.19
Nodes (10): GuestlistPasses, StaffInvite, TableBooked, Illuminate\Bus\Queueable, Illuminate\Contracts\Queue\ShouldBeEncrypted, Illuminate\Contracts\Queue\ShouldQueue, Illuminate\Mail\Mailable, Illuminate\Mail\Mailables\Content (+2 more)

### Community 19 - "CheckIn"
Cohesion: 0.11
Nodes (8): CheckInController, GuestlistController, TonightController, Controller, CheckIn, Illuminate\Http\Response, Illuminate\Support\Facades\Gate, Illuminate\Validation\Rule

### Community 20 - "AdminNight.jsx"
Cohesion: 0.10
Nodes (39): NAV, Shell(), useTick(), ARRIVAL_BADGE, ARRIVALS, BOOKING_CHIPS, Bookings(), clubNow() (+31 more)

### Community 21 - "Illuminate\Database\Eloquent\Model"
Cohesion: 0.07
Nodes (16): App\Enums\CheckInMethod, App\Support\Night, HourMinute, LineupSlot, Carbon\CarbonInterface, CheckInMethod, Illuminate\Contracts\Database\Eloquent\CastsAttributes, Illuminate\Database\Eloquent\Attributes\Fillable (+8 more)

### Community 22 - "Scanner"
Cohesion: 0.18
Nodes (17): S10 · Audit akhir, beep(), checkIn(), pendingBy(), readQr(), remainingOf(), Scanner(), camRead() (+9 more)

### Community 23 - "AdminEvents.jsx"
Cohesion: 0.19
Nodes (18): blank(), detailQuery(), Events(), addRow(), applyStart(), save(), startCreate(), fromApi() (+10 more)

### Community 24 - "bootstrap/app.php"
Cohesion: 0.14
Nodes (13): EnsureActive, EnsureRole, SecurityHeaders, Closure, Illuminate\Auth\AuthenticationException, Illuminate\Database\Eloquent\ModelNotFoundException, Illuminate\Foundation\Application, Illuminate\Foundation\Configuration\Exceptions (+5 more)

### Community 26 - "S5 Halaman QR (QR Page Slice)"
Cohesion: 0.09
Nodes (33): Checkpoint B, GET /door/{date}/codes/{code}, GET /door/{date}/manifest, GET /door/public-key, GET /passes/{public_id}, POST /door/check-ins, F10: QR Format FNG2 with ECDSA P-256 Signature, F17: Manual Entry Code (Crockford Base32) (+25 more)

### Community 27 - "S4 Guestlist Slice"
Cohesion: 0.14
Nodes (17): F13: QR Delivered via Queued Email, Resend Limited, F16: Anti-bot via Cloudflare Turnstile, F8: Guestlist Quota Locked with SELECT FOR UPDATE, F9: Guestlist QR Modes group/personal, S4 Guestlist Slice, B4.1 Pendaftaran guestlist, B4.2 Kirim ulang, Cloudflare Turnstile (server verification) (+9 more)

### Community 28 - "EntryCode"
Cohesion: 0.22
Nodes (3): EntryCode, EntryCodeTest, PHPUnit\Framework\TestCase

### Community 30 - "S2 Acara (Events Slice)"
Cohesion: 0.11
Nodes (19): Checkpoint A, events table, F2: One Timezone, One Night (nightMinutes), F3: Doors Open 15:00, Close Time Per Event, lineup_slots table, S2 Acara (Events Slice), S9 Halaman Konten Slice, B2.1 Endpoint publik acara (+11 more)

### Community 31 - "The Fanglle II"
Cohesion: 0.22
Nodes (8): Aturan yang paling sering dilanggar, Baca sebelum mengerjakan apa pun, Berhenti dan tanya sebelum, Cara kerja, Perintah, Susunan, The Fanglle II, Urutan otoritas desain

### Community 32 - "nightMinutes"
Cohesion: 0.35
Nodes (11): judge(), clock(), earliest(), headliners(), latest(), nightMinutes(), nightRun(), About() (+3 more)

### Community 33 - "0001_01_01_000000_create_users_table.php"
Cohesion: 0.16
Nodes (3): Illuminate\Database\Migrations\Migration, Illuminate\Database\Schema\Blueprint, Illuminate\Support\Facades\Schema

### Community 34 - "fanglle-pilih-meja-mockup.jsx"
Cohesion: 0.15
Nodes (8): App(), idr(), MIN, mmss(), NIGHTS, TABLES, TAKEN, ZONES

### Community 36 - "S7 Operasional Admin Slice"
Cohesion: 0.12
Nodes (19): Checkpoint C, POST /guestlist, F1: Guests Never Log In, F14: Minimal Personal Data, Phone Last 4 Digits Only, F15: Staff Roles manager/door, Invite Expires 48h, guestlist_signups table, S7 Operasional Admin Slice, users table (staff accounts) (+11 more)

### Community 37 - "QA log"
Cohesion: 0.29
Nodes (6): Checkpoint C · satu malam dari pesanan sampai laporan, QA log, S6 · Pintu, S8 · Tim dan undangan, S9 · About dan Gallery, Setelah S10 · Audit taste-skill dan Find my QR

### Community 38 - "night.js"
Cohesion: 0.13
Nodes (15): dayLabel(), entryCode(), guestNames(), PASS_KINDS, passOrCopy(), passState(), ev, validUntil() (+7 more)

### Community 39 - "S6 Pintu (Door Scanner Slice)"
Cohesion: 0.22
Nodes (13): check_ins table, F11: Pass Usage inside_count <= people, F12: Check-in Idempotent per client_uuid, S6 Pintu (Door Scanner Slice), B6.1 Manifest, B6.1b Cari kode, B6.2 Check-in batch, M5: Manual test - door phone airplane mode sync (+5 more)

### Community 40 - "Event"
Cohesion: 0.05
Nodes (17): LineupRole, EventController, EventController, EventRequest, Event, Night, DatabaseSeeder, DemoWeekSeeder (+9 more)

### Community 41 - "fanglle-halaman-depan-mockup.jsx"
Cohesion: 0.18
Nodes (5): NIGHTS, SHARDS, App(), TYPES, useQrPattern()

### Community 44 - "Progress pengerjaan"
Cohesion: 0.25
Nodes (7): Belum, Penyimpangan dari mockup, Progress pengerjaan, Ringkas, Sebelum web dibuka ke publik, Tambahan setelah S10 (30 Sep 2026), Uji terakhir

### Community 45 - "VenueTable"
Cohesion: 0.16
Nodes (6): PassKind, VenueTable, DemoResetTest, Illuminate\Console\Scheduling\Schedule, Illuminate\Support\Str, Pdo\Mysql

### Community 46 - "api"
Cohesion: 0.10
Nodes (32): resend(), Failed(), Skel(), blankInvite, CONFIRM, InviteForm(), send(), staffQuery (+24 more)

### Community 48 - "PassEndpointTest"
Cohesion: 0.07
Nodes (19): App\Enums\PassKind, App\Enums\StaffRole, App\Http\Controllers\Admin, App\Http\Controllers\AuthController, App\Http\Controllers\DoorController, App\Http\Controllers\EventController, App\Http\Controllers\GuestlistController, App\Http\Controllers\TableBookingController (+11 more)

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

### Community 56 - "AppServiceProvider.php"
Cohesion: 0.33
Nodes (4): AppServiceProvider, Illuminate\Cache\RateLimiting\Limit, Illuminate\Support\Facades\RateLimiter, Illuminate\Support\ServiceProvider

### Community 57 - "logging.php"
Cohesion: 0.40
Nodes (4): Monolog\Handler\NullHandler, Monolog\Handler\StreamHandler, Monolog\Handler\SyslogUdpHandler, Monolog\Processor\PsrLogMessageProcessor

### Community 58 - "sanctum.php"
Cohesion: 0.40
Nodes (4): Illuminate\Cookie\Middleware\EncryptCookies, Illuminate\Foundation\Http\Middleware\ValidateCsrfToken, Laravel\Sanctum\Http\Middleware\AuthenticateSession, Laravel\Sanctum\Sanctum

### Community 59 - "restore-check.sh"
Cohesion: 0.60
Nodes (4): cleanup(), DB_DATABASE, mysql_(), restore-check.sh script

### Community 62 - "XenditKeyGuardTest"
Cohesion: 0.38
Nodes (3): XenditKeyGuardTest, Illuminate\Support\Facades\Process, PHPUnit\Framework\Attributes\TestWith

### Community 64 - "AuthController.php"
Cohesion: 0.40
Nodes (3): UserFactory, Illuminate\Database\Eloquent\Factories\Factory, Illuminate\Support\Facades\Hash

### Community 66 - "frontend index.html (Vite SPA shell)"
Cohesion: 0.50
Nodes (4): frontend index.html (Vite SPA shell), Web App Manifest link (/manifest.webmanifest, no start_url), #root mount element, theme-color #0C0812

## Knowledge Gaps
- **215 isolated node(s):** `Baca sebelum mengerjakan apa pun`, `Susunan`, `Cara kerja`, `Urutan otoritas desain`, `Berhenti dan tanya sebelum` (+210 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 456 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Event` connect `Event` to `TableBookingController`, `TestCase`, `AdminOperationsTest`, `DoorTest`, `VenueTable`, `Controllers/GuestlistController.php`, `Illuminate\Http\JsonResponse`, `Pass`, `PassEndpointTest`, `CheckIn`, `Illuminate\Database\Eloquent\Model`, `bootstrap/app.php`, `PublicEventsTest`, `GuestlistSignup`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `react` connect `main.jsx` to `fanglle-pilih-meja-mockup.jsx`, `package.json`, `night.js`, `Public.jsx`, `fanglle-halaman-depan-mockup.jsx`, `fanglle-pengelola-mockup.jsx`, `Door.jsx`, `api`, `fanglle-event-gallery-about-mockup.jsx`, `App`, `fanglle-guestlist-mockup.jsx`, `fanglle-pemindai-pintu-desktop-mockup.jsx`, `AdminNight.jsx`, `AdminEvents.jsx`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `Pass` connect `Pass` to `TableBooking`, `Event`, `TestCase`, `AdminOperationsTest`, `DoorTest`, `VenueTable`, `Illuminate\Http\JsonResponse`, `PassEndpointTest`, `GuestlistPasses`, `CheckIn`, `Illuminate\Database\Eloquent\Model`, `bootstrap/app.php`, `EntryCode`, `GuestlistSignup`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `Baca sebelum mengerjakan apa pun`, `Susunan`, `Cara kerja` to the rest of the system?**
  _215 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `sw.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0590990990990991 - nodes in this community are weakly interconnected._
- **Should `PassSigner` be split into smaller, more focused modules?**
  _Cohesion score 0.12987012987012986 - nodes in this community are weakly interconnected._
- **Should `composer.json` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._