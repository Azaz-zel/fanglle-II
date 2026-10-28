# Graph Report - fanglle II  (2026-10-24)

## Corpus Check
- 168 files · ~197,966 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 83 file(s) not represented in the graph (top: (none) 24, .ttf 19, .woff2 14)

## Summary
- 1436 nodes · 3275 edges · 81 communities (54 shown, 27 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 126 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `57ec4fb8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- sw.js
- The Fanglle II - CLAUDE.md Project Instructions
- User
- PassSigner
- composer.json
- Door.jsx
- Public.jsx
- TableBooking
- GuestlistSignup
- static
- Design System: The Fanglle II
- .night
- S3 Pesan Meja (Table Booking Slice)
- door.test.js
- Night
- Illuminate\Http\Request
- S10 Pengerasan (Hardening Slice)
- EntryCode
- StaffTest
- Controller
- AdminNight.jsx
- Illuminate\Database\Eloquent\Model
- Illuminate\Http\JsonResponse
- AdminEvents.jsx
- Closure
- PublicEventsTest
- S5 Halaman QR (QR Page Slice)
- S4 Guestlist Slice
- Admin.jsx
- GuestlistTest
- S2 Acara (Events Slice)
- The Fanglle II
- AdminOperationsTest
- 0001_01_01_000000_create_users_table.php
- Xendit
- HardeningTest
- S7 Operasional Admin Slice
- Product
- night.js
- S6 Pintu (Door Scanner Slice)
- AdminEventsTest
- Illuminate\Foundation\Testing\RefreshDatabase
- PassEndpointTest
- TestCase
- Progress pengerjaan
- Pass
- api
- Pass.php
- AdminOperationsTest.php
- bootstrap/app.php
- AuthController.php
- hold-same-table.sh
- guestLine
- XenditWebhookTest
- guestlist-quota.sh
- VenueTable.php
- logging.php
- sanctum.php
- restore-check.sh
- QA log
- TableBooking.php
- package.json
- artisan
- Event
- Deploy ke server rumah
- POST /guestlist/resend
- @tanstack/react-query@5.103.2
- react-router-dom@7.18.4
- Carbon
- Surface brief: situs publik (Home sebagai layar pertama)
- static

## God Nodes (most connected - your core abstractions)
1. `Event` - 61 edges
2. `User` - 61 edges
3. `Pass` - 49 edges
4. `TableBooking` - 43 edges
5. `api()` - 41 edges
6. `clock()` - 30 edges
7. `errorText()` - 30 edges
8. `Night` - 28 edges
9. `GuestlistSignup` - 27 edges
10. `StaffTest` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Components` --references--> `laneOf()`  [INFERRED]
  DESIGN.md → frontend/src/night.js
- `Aturan yang paling sering dilanggar` --references--> `nightMinutes()`  [INFERRED]
  AGENTS.md → frontend/src/night.js
- `Operating Context` --references--> `nightMinutes()`  [INFERRED]
  PRODUCT.md → frontend/src/night.js
- `Overview` --references--> `gelOf()`  [INFERRED]
  DESIGN.md → frontend/src/night.js
- `Redesign "Gel dan Kabut" (7 Okt 2026, cabang `redesign-gel-kabut`, belum di-commit)` --references--> `HardeningTest`  [INFERRED]
  docs/progress.md → backend/tests/Feature/HardeningTest.php

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **QR Signature Chain (sign, verify, test)** — docs_prd_fanglle_0_kontrak_dan_rencana_f10, docs_prd_fanglle_1_backend_passsigner, docs_prd_fanglle_1_backend_dertoraw, docs_prd_fanglle_2_frontend_offline_signature_validation, docs_prd_fanglle_3_testing_t_p1 [EXTRACTED 0.95]
- **Design Authority Chain (Contract > PRD+Mockup > Skill)** — docs_prd_fanglle_0_kontrak_dan_rencana, docs_prd_fanglle_2_frontend, claude_antislop_gate, claude_taste_skill, claude_ponytail_rule [EXTRACTED 1.00]
- **S3 Table Booking Vertical Slice** — docs_prd_fanglle_0_kontrak_dan_rencana_s3, docs_prd_fanglle_1_backend_b3_1, docs_prd_fanglle_1_backend_b3_2, docs_prd_fanglle_1_backend_b3_3, docs_prd_fanglle_1_backend_b3_4, docs_prd_fanglle_2_frontend_f3_1 [EXTRACTED 1.00]

## Communities (81 total, 27 thin omitted)

### Community 0 - "sw.js"
Cohesion: 0.06
Nodes (21): b, c(), d(), e, f(), h, i, j (+13 more)

### Community 1 - "The Fanglle II - CLAUDE.md Project Instructions"
Cohesion: 0.17
Nodes (18): Backend README (Laravel Boilerplate), The Fanglle II - CLAUDE.md Project Instructions, Backend Sub-agent Definition, Frontend Sub-agent Definition, QA Sub-agent Definition, antislop Delivery Gate, Design Authority Order (Contract > PRD+mockup > skill), ponytail (minimal code, PRD decisions not simplified) (+10 more)

### Community 2 - "User"
Cohesion: 0.09
Nodes (16): StaffRole, StaffStatus, User, StaffPolicy, UserFactory, DatabaseSeeder, AuthTest, OpeningTimeTest (+8 more)

### Community 3 - "PassSigner"
Cohesion: 0.05
Nodes (24): App\Http\Controllers\Admin, App\Http\Controllers\AuthController, App\Http\Controllers\DoorController, App\Http\Controllers\EventController, App\Http\Controllers\GuestlistController, App\Http\Controllers\TableBookingController, App\Http\Controllers\XenditWebhookController, App\Http\Middleware\EnsureActive (+16 more)

### Community 4 - "composer.json"
Cohesion: 0.04
Nodes (47): pestphp/pest-plugin, php-http/discovery, autoload, autoload-dev, psr-4, psr-4, config, allow-plugins (+39 more)

### Community 5 - "Door.jsx"
Cohesion: 0.16
Nodes (23): beep(), Camera(), cameraError(), Door, judge(), keyAction(), longDay(), pendingBy() (+15 more)

### Community 6 - "Public.jsx"
Cohesion: 0.05
Nodes (58): frontend_src_assets_fang, guestNames(), idr(), mmss(), others(), secondsLeft(), tableState(), blank (+50 more)

### Community 7 - "TableBooking"
Cohesion: 0.18
Nodes (3): TableBooking, TableBookingTest, self

### Community 8 - "GuestlistSignup"
Cohesion: 0.13
Nodes (10): PassKind, QrMode, GuestlistController, GuestlistPasses, GuestlistSignup, Turnstile, GuestContact, Illuminate\Contracts\Validation\ValidationRule (+2 more)

### Community 10 - "Design System: The Fanglle II"
Cohesion: 0.20
Nodes (9): Colors, Components, Design System: The Fanglle II, Do's and Don'ts, Layout, Motion, Overview, Shapes and depth (+1 more)

### Community 11 - ".night"
Cohesion: 0.20
Nodes (6): App\Enums\LineupRole, DemoOrdersSeeder, DemoWeekSeeder, Carbon, Carbon\Carbon, Illuminate\Database\Seeder

### Community 12 - "S3 Pesan Meja (Table Booking Slice)"
Cohesion: 0.09
Nodes (31): GET /table-bookings/{code}, POST /table-bookings, POST /webhooks/xendit, F4: One Table, One Active Booking Per Night, F5: Hold 15 Minutes, Invoice 14 Minutes, F6: Deposit 50% of Minimum Spend, Forfeited, F7: Xendit Webhook Never Creates Records, S3 Pesan Meja (Table Booking Slice) (+23 more)

### Community 13 - "door.test.js"
Cohesion: 0.15
Nodes (24): applyResults(), CodeForm(), submit(), codeHash(), HOW, importKey(), mergePasses(), nightOf() (+16 more)

### Community 14 - "Night"
Cohesion: 0.15
Nodes (5): EventController, TableBookingController, VenueTable, Night, Illuminate\Support\Carbon

### Community 16 - "S10 Pengerasan (Hardening Slice)"
Cohesion: 0.10
Nodes (21): /graphify . trigger after S1, Checkpoint D, S1 Fondasi (Foundation Slice), S10 Pengerasan (Hardening Slice), S8 Tim (Staff Team Slice), B10.1 Rate limit and security headers, B1.1 Proyek dan skema, B1.2 Login staf (+13 more)

### Community 17 - "EntryCode"
Cohesion: 0.09
Nodes (14): StaffInvite, TableBooked, EntryCode, EntryCodeTest, NightTest, Illuminate\Bus\Queueable, Illuminate\Contracts\Queue\ShouldBeEncrypted, Illuminate\Contracts\Queue\ShouldQueue (+6 more)

### Community 19 - "Controller"
Cohesion: 0.17
Nodes (6): CheckInMethod, CheckInController, GuestlistController, Controller, Illuminate\Support\Facades\Gate, Illuminate\Validation\Rule

### Community 20 - "AdminNight.jsx"
Cohesion: 0.09
Nodes (44): ARRIVAL_BADGE, ARRIVALS, BOOKING_CHIPS, Bookings(), clubNow(), CONFIRM, DoorLog(), Drawer() (+36 more)

### Community 21 - "Illuminate\Database\Eloquent\Model"
Cohesion: 0.09
Nodes (11): HourMinute, LineupRole, LineupSlot, Illuminate\Contracts\Database\Eloquent\CastsAttributes, Illuminate\Database\Eloquent\Attributes\Fillable, Illuminate\Database\Eloquent\Attributes\Unguarded, Illuminate\Database\Eloquent\Builder, Illuminate\Database\Eloquent\Model (+3 more)

### Community 22 - "Illuminate\Http\JsonResponse"
Cohesion: 0.20
Nodes (4): TableBookingController, DoorController, XenditWebhookController, Illuminate\Http\JsonResponse

### Community 23 - "AdminEvents.jsx"
Cohesion: 0.24
Nodes (15): blank(), detailQuery(), Events(), addRow(), applyStart(), save(), startCreate(), fromApi() (+7 more)

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
Nodes (31): frontend index.html (Vite SPA shell), Web App Manifest link (/manifest.webmanifest, no start_url), #root mount element, theme-color #0C0812, NAV, Shell(), useTick(), eventsQuery (+23 more)

### Community 30 - "S2 Acara (Events Slice)"
Cohesion: 0.11
Nodes (19): Checkpoint A, events table, F2: One Timezone, One Night (nightMinutes), F3: Doors Open 15:00, Close Time Per Event, lineup_slots table, S2 Acara (Events Slice), S9 Halaman Konten Slice, B2.1 Endpoint publik acara (+11 more)

### Community 31 - "The Fanglle II"
Cohesion: 0.22
Nodes (8): Aturan yang paling sering dilanggar, Baca sebelum mengerjakan apa pun, Berhenti dan tanya sebelum, Cara kerja, Perintah, Susunan, The Fanglle II, Urutan otoritas desain

### Community 32 - "AdminOperationsTest"
Cohesion: 0.28
Nodes (4): AdminOperationsTest, BookingStatus, CheckInMethod, QrMode

### Community 33 - "0001_01_01_000000_create_users_table.php"
Cohesion: 0.16
Nodes (3): Illuminate\Database\Migrations\Migration, Illuminate\Database\Schema\Blueprint, Illuminate\Support\Facades\Schema

### Community 34 - "Xendit"
Cohesion: 0.18
Nodes (3): Xendit, Illuminate\Database\Eloquent\Relations\HasOne, Illuminate\Http\Client\PendingRequest

### Community 36 - "S7 Operasional Admin Slice"
Cohesion: 0.12
Nodes (19): Checkpoint C, POST /guestlist, F1: Guests Never Log In, F14: Minimal Personal Data, Phone Last 4 Digits Only, F15: Staff Roles manager/door, Invite Expires 48h, guestlist_signups table, S7 Operasional Admin Slice, users table (staff accounts) (+11 more)

### Community 37 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 38 - "night.js"
Cohesion: 0.08
Nodes (40): Redesign "Gel dan Kabut" (7 Okt 2026, cabang `redesign-gel-kabut`, belum di-commit), at(), clock(), [DAY, WEEKDAY, MONTH], dayLabel(), dayParts(), entryCode(), gelOf() (+32 more)

### Community 39 - "S6 Pintu (Door Scanner Slice)"
Cohesion: 0.22
Nodes (13): check_ins table, F11: Pass Usage inside_count <= people, F12: Check-in Idempotent per client_uuid, S6 Pintu (Door Scanner Slice), B6.1 Manifest, B6.1b Cari kode, B6.2 Check-in batch, M5: Manual test - door phone airplane mode sync (+5 more)

### Community 41 - "Illuminate\Foundation\Testing\RefreshDatabase"
Cohesion: 0.33
Nodes (6): App\Enums\StaffRole, App\Enums\StaffStatus, App\Models\User, SeedTest, Illuminate\Foundation\Testing\RefreshDatabase, Tests\TestCase

### Community 43 - "TestCase"
Cohesion: 0.09
Nodes (8): DoorTest, KeysCommandTest, SpaTest, XenditKeyGuardTest, TestCase, Illuminate\Foundation\Testing\TestCase, Illuminate\Support\Facades\File, Illuminate\Support\Facades\Process

### Community 44 - "Progress pengerjaan"
Cohesion: 0.25
Nodes (7): Belum, Penyimpangan dari mockup, Progress pengerjaan, Ringkas, Sebelum web dibuka ke publik, Tambahan setelah S10 (30 Sep 2026), Uji terakhir

### Community 45 - "Pass"
Cohesion: 0.13
Nodes (4): CheckIn, Pass, DemoResetTest, Illuminate\Database\Eloquent\Relations\BelongsTo

### Community 46 - "api"
Cohesion: 0.12
Nodes (22): resend(), InviteForm(), send(), Team(), act(), api(), ApiError, csrfCookie() (+14 more)

### Community 47 - "Pass.php"
Cohesion: 0.17
Nodes (6): App\Support\EntryCode, App\Support\PassSigner, Carbon\CarbonInterface, Illuminate\Support\Str, Pdo\Mysql, Symfony\Component\Uid\Ulid

### Community 48 - "AdminOperationsTest.php"
Cohesion: 0.20
Nodes (19): App\Enums\BookingStatus, App\Enums\CheckInMethod, App\Enums\PassKind, App\Enums\QrMode, App\Http\Controllers\Controller, App\Mail\GuestlistPasses, App\Models\CheckIn, App\Models\Event (+11 more)

### Community 49 - "bootstrap/app.php"
Cohesion: 0.20
Nodes (8): App\Http\Middleware\EnsureRole, App\Http\Middleware\SecurityHeaders, Illuminate\Database\Eloquent\ModelNotFoundException, Illuminate\Foundation\Application, Illuminate\Foundation\Configuration\Exceptions, Illuminate\Foundation\Configuration\Middleware, Illuminate\Routing\Middleware\SubstituteBindings, Symfony\Component\HttpKernel\Exception\HttpExceptionInterface

### Community 50 - "AuthController.php"
Cohesion: 0.28
Nodes (3): AuthController, Illuminate\Http\Response, Illuminate\Validation\ValidationException

### Community 51 - "hold-same-table.sh"
Cohesion: 0.33
Nodes (6): cleanup(), DB_DATABASE, PUBLIC_POSTS_PER_MINUTE, hold-same-table.sh script, stop_port(), STUB_LOG

### Community 52 - "guestLine"
Cohesion: 0.40
Nodes (5): guestLine(), kindLabel(), Result(), search(), SearchBox()

### Community 54 - "guestlist-quota.sh"
Cohesion: 0.40
Nodes (5): cleanup(), DB_DATABASE, PUBLIC_POSTS_PER_MINUTE, guestlist-quota.sh script, stop_port()

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
Cohesion: 0.18
Nodes (10): Checkpoint C · satu malam dari pesanan sampai laporan, QA log, S10 · Audit akhir, S6 · Pintu, S8 · Tim dan undangan, S9 · About dan Gallery, Setelah S10 · Audit taste-skill dan Find my QR, checkIn() (+2 more)

### Community 61 - "TableBooking.php"
Cohesion: 0.33
Nodes (5): BookingStatus, Illuminate\Http\Client\Request, Illuminate\Support\Facades\Http, Illuminate\Support\Facades\Log, Illuminate\Support\Facades\Mail

### Community 62 - "package.json"
Cohesion: 0.05
Nodes (37): { jwk, items }, results, dependencies, idb, motion, qrcode, react, react-dom (+29 more)

### Community 65 - "Event"
Cohesion: 0.15
Nodes (4): EventController, EventRequest, Event, Illuminate\Foundation\Http\FormRequest

### Community 67 - "Deploy ke server rumah"
Cohesion: 0.18
Nodes (10): 1. Kode dan dependensi, 2. `.env` produksi, 3. Sekali saja, 4. Setiap deploy, 5. Proses yang harus selalu jalan, 6. Web server, 7. Webhook Xendit, 8. Cek setelah deploy (+2 more)

## Knowledge Gaps
- **212 isolated node(s):** `Door`, `Web App Manifest link (/manifest.webmanifest, no start_url)`, `#root mount element`, `theme-color #0C0812`, `b` (+207 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 445 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Redesign "Gel dan Kabut" (7 Okt 2026, cabang `redesign-gel-kabut`, belum di-commit)` connect `night.js` to `HardeningTest`, `TestCase`, `Progress pengerjaan`, `Night`?**
  _High betweenness centrality (0.312) - this node is a cross-community bridge._
- **Why does `DoorTest` connect `TestCase` to `GuestlistSignup`, `Illuminate\Foundation\Testing\RefreshDatabase`, `night.js`?**
  _High betweenness centrality (0.177) - this node is a cross-community bridge._
- **Why does `gelOf()` connect `night.js` to `Design System: The Fanglle II`, `Admin.jsx`, `Door.jsx`, `Public.jsx`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Are the 17 inferred relationships involving `Event` (e.g. with `.__invoke()` and `.run()`) actually correct?**
  _`Event` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `User` (e.g. with `.run()` and `.asManager()`) actually correct?**
  _`User` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `Pass` (e.g. with `.__invoke()` and `.record()`) actually correct?**
  _`Pass` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Door`, `Web App Manifest link (/manifest.webmanifest, no start_url)`, `#root mount element` to the rest of the system?**
  _212 weakly-connected nodes found - possible documentation gaps or missing edges._