# Graph Report - fanglle II  (2026-09-30)

## Corpus Check
- 148 files · ~87,361 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 32 file(s) not represented in the graph (top: (none) 19, .toml 4, .woff2 4)

## Summary
- 1406 nodes · 3151 edges · 77 communities (51 shown, 26 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `09761a90`
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
- EntryCode
- StaffTest
- AuthController.php
- AdminNight.jsx
- Pass
- AdminEventsTest
- AdminEvents.jsx
- bootstrap/app.php
- PublicEventsTest
- S5 Halaman QR (QR Page Slice)
- S4 Guestlist Slice
- Event
- GuestlistTest
- S2 Acara (Events Slice)
- The Fanglle II
- EventController
- 0001_01_01_000000_create_users_table.php
- fanglle-pilih-meja-mockup.jsx
- HardeningTest
- S7 Operasional Admin Slice
- QA log
- night.js
- S6 Pintu (Door Scanner Slice)
- Night
- fanglle-halaman-depan-mockup.jsx
- KeysCommandTest
- DoorTest
- DatabaseSeeder.php
- GuestlistSignup
- api
- XenditWebhookTest
- PassEndpointTest
- fanglle-event-gallery-about-mockup.jsx
- App
- hold-same-table.sh
- fanglle-guestlist-mockup.jsx
- fanglle-pemindai-pintu-desktop-mockup.jsx
- guestlist-quota.sh
- Illuminate\Database\Eloquent\Model
- Illuminate\Support\Str
- logging.php
- sanctum.php
- restore-check.sh
- SpaTest
- AuthTest
- EventRequest.php
- artisan
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
- `S10 · Audit akhir` --references--> `close()`  [INFERRED]
  docs/qa-log.md → frontend/src/Door.jsx
- `S10 · Audit akhir` --references--> `Confirm()`  [INFERRED]
  docs/qa-log.md → frontend/src/ui.jsx
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

## Communities (77 total, 26 thin omitted)

### Community 0 - "sw.js"
Cohesion: 0.06
Nodes (21): a(), b(), c(), d(), e, f(), h, i (+13 more)

### Community 1 - "The Fanglle II - CLAUDE.md Project Instructions"
Cohesion: 0.15
Nodes (20): Backend README (Laravel Boilerplate), The Fanglle II - CLAUDE.md Project Instructions, Backend Sub-agent Definition, Frontend Sub-agent Definition, QA Sub-agent Definition, antislop Delivery Gate, Design Authority Order (Contract > PRD+mockup > skill), ponytail (minimal code, PRD decisions not simplified) (+12 more)

### Community 2 - "User"
Cohesion: 0.16
Nodes (11): StaffStatus, User, StaffPolicy, UserFactory, Illuminate\Auth\Access\Response, Illuminate\Database\Eloquent\Attributes\Hidden, Illuminate\Database\Eloquent\Attributes\UsePolicy, Illuminate\Database\Eloquent\Factories\Factory (+3 more)

### Community 3 - "PassSigner"
Cohesion: 0.06
Nodes (22): App\Http\Controllers\Admin, App\Http\Controllers\AuthController, App\Http\Controllers\DoorController, App\Http\Controllers\EventController, App\Http\Controllers\GuestlistController, App\Http\Controllers\TableBookingController, App\Http\Controllers\XenditWebhookController, App\Http\Middleware\EnsureActive (+14 more)

### Community 4 - "composer.json"
Cohesion: 0.04
Nodes (47): pestphp/pest-plugin, php-http/discovery, autoload, autoload-dev, psr-4, psr-4, config, allow-plugins (+39 more)

### Community 5 - "package.json"
Cohesion: 0.05
Nodes (35): { jwk, items }, results, dependencies, idb, qrcode, react, react-dom, react-router-dom (+27 more)

### Community 6 - "Public.jsx"
Cohesion: 0.07
Nodes (45): clock(), dayLabel(), latest(), mmss(), nightRun(), others(), ROLES, secondsLeft() (+37 more)

### Community 7 - "TableBooking"
Cohesion: 0.11
Nodes (6): TableBooking, Xendit, TableBookingTest, Illuminate\Database\Eloquent\Relations\HasOne, Illuminate\Http\Client\PendingRequest, self

### Community 8 - "TestCase"
Cohesion: 0.17
Nodes (11): StaffRole, OpeningTimeTest, TestCase, Illuminate\Foundation\Testing\RefreshDatabase, Illuminate\Foundation\Testing\TestCase, Illuminate\Http\Client\Request, Illuminate\Support\Facades\DB, Illuminate\Support\Facades\File (+3 more)

### Community 9 - "AdminOperationsTest"
Cohesion: 0.24
Nodes (5): BookingStatus, CheckInMethod, QrMode, AdminOperationsTest, static

### Community 10 - "main.jsx"
Cohesion: 0.08
Nodes (33): frontend index.html (Vite SPA shell), Web App Manifest link (/manifest.webmanifest, no start_url), #root mount element, theme-color #0C0812, NAV, Shell(), useTick(), tonightQuery (+25 more)

### Community 11 - "fanglle-pengelola-mockup.jsx"
Cohesion: 0.09
Nodes (24): App(), addRow(), applyStart(), saveEvent(), startCreate(), blankEvent(), BOOKINGS, dayLabel() (+16 more)

### Community 12 - "S3 Pesan Meja (Table Booking Slice)"
Cohesion: 0.09
Nodes (31): GET /table-bookings/{code}, POST /table-bookings, POST /webhooks/xendit, F4: One Table, One Active Booking Per Night, F5: Hold 15 Minutes, Invoice 14 Minutes, F6: Deposit 50% of Minimum Spend, Forfeited, F7: Xendit Webhook Never Creates Records, S3 Pesan Meja (Table Booking Slice) (+23 more)

### Community 13 - "Door.jsx"
Cohesion: 0.09
Nodes (54): applyResults(), beep(), Camera(), cameraError(), checkIn(), CodeForm(), submit(), codeHash() (+46 more)

### Community 14 - "Controllers/GuestlistController.php"
Cohesion: 0.14
Nodes (8): GuestlistController, TableBookingController, Turnstile, GuestContact, Illuminate\Contracts\Validation\ValidationRule, Illuminate\Database\UniqueConstraintViolationException, Illuminate\Http\Exceptions\HttpResponseException, Illuminate\Validation\ValidationException

### Community 15 - "Illuminate\Http\JsonResponse"
Cohesion: 0.13
Nodes (11): CheckInController, StaffController, TableBookingController, Controller, DoorController, XenditWebhookController, Illuminate\Http\JsonResponse, Illuminate\Http\Request (+3 more)

### Community 16 - "S10 Pengerasan (Hardening Slice)"
Cohesion: 0.10
Nodes (21): /graphify . trigger after S1, Checkpoint D, S1 Fondasi (Foundation Slice), S10 Pengerasan (Hardening Slice), S8 Tim (Staff Team Slice), B10.1 Rate limit and security headers, B1.1 Proyek dan skema, B1.2 Login staf (+13 more)

### Community 17 - "EntryCode"
Cohesion: 0.10
Nodes (15): GuestlistPasses, StaffInvite, TableBooked, EntryCode, XenditKeyGuardTest, EntryCodeTest, Illuminate\Bus\Queueable, Illuminate\Contracts\Queue\ShouldBeEncrypted (+7 more)

### Community 19 - "AuthController.php"
Cohesion: 0.19
Nodes (4): GuestlistController, AuthController, Illuminate\Http\Response, Illuminate\Support\Facades\Hash

### Community 20 - "AdminNight.jsx"
Cohesion: 0.12
Nodes (37): ARRIVAL_BADGE, ARRIVALS, BOOKING_CHIPS, Bookings(), clubNow(), CONFIRM, DoorLog(), Drawer() (+29 more)

### Community 21 - "Pass"
Cohesion: 0.09
Nodes (11): App\Enums\CheckInMethod, App\Enums\PassKind, App\Support\EntryCode, App\Support\Night, App\Support\PassSigner, Pass, Carbon\CarbonInterface, CheckInMethod (+3 more)

### Community 23 - "AdminEvents.jsx"
Cohesion: 0.23
Nodes (17): blank(), detailQuery(), Events(), addRow(), applyStart(), save(), startCreate(), fromApi() (+9 more)

### Community 24 - "bootstrap/app.php"
Cohesion: 0.13
Nodes (13): EnsureActive, EnsureRole, SecurityHeaders, Closure, Illuminate\Auth\AuthenticationException, Illuminate\Database\Eloquent\ModelNotFoundException, Illuminate\Foundation\Application, Illuminate\Foundation\Configuration\Exceptions (+5 more)

### Community 26 - "S5 Halaman QR (QR Page Slice)"
Cohesion: 0.09
Nodes (33): Checkpoint B, GET /door/{date}/codes/{code}, GET /door/{date}/manifest, GET /door/public-key, GET /passes/{public_id}, POST /door/check-ins, F10: QR Format FNG2 with ECDSA P-256 Signature, F17: Manual Entry Code (Crockford Base32) (+25 more)

### Community 27 - "S4 Guestlist Slice"
Cohesion: 0.14
Nodes (17): F13: QR Delivered via Queued Email, Resend Limited, F16: Anti-bot via Cloudflare Turnstile, F8: Guestlist Quota Locked with SELECT FOR UPDATE, F9: Guestlist QR Modes group/personal, S4 Guestlist Slice, B4.1 Pendaftaran guestlist, B4.2 Kirim ulang, Cloudflare Turnstile (server verification) (+9 more)

### Community 28 - "Event"
Cohesion: 0.17
Nodes (3): Event, SeedTest, Illuminate\Database\Eloquent\Relations\HasMany

### Community 30 - "S2 Acara (Events Slice)"
Cohesion: 0.11
Nodes (19): Checkpoint A, events table, F2: One Timezone, One Night (nightMinutes), F3: Doors Open 15:00, Close Time Per Event, lineup_slots table, S2 Acara (Events Slice), S9 Halaman Konten Slice, B2.1 Endpoint publik acara (+11 more)

### Community 31 - "The Fanglle II"
Cohesion: 0.22
Nodes (8): Aturan yang paling sering dilanggar, Baca sebelum mengerjakan apa pun, Berhenti dan tanya sebelum, Cara kerja, Perintah, Susunan, The Fanglle II, Urutan otoritas desain

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
Cohesion: 0.12
Nodes (14): S10 · Audit akhir, entryCode(), idr(), PASS_KINDS, passOrCopy(), passState(), ev, validUntil() (+6 more)

### Community 39 - "S6 Pintu (Door Scanner Slice)"
Cohesion: 0.22
Nodes (13): check_ins table, F11: Pass Usage inside_count <= people, F12: Check-in Idempotent per client_uuid, S6 Pintu (Door Scanner Slice), B6.1 Manifest, B6.1b Cari kode, B6.2 Check-in batch, M5: Manual test - door phone airplane mode sync (+5 more)

### Community 40 - "Night"
Cohesion: 0.16
Nodes (4): EventController, Night, NightTest, Illuminate\Support\Carbon

### Community 41 - "fanglle-halaman-depan-mockup.jsx"
Cohesion: 0.18
Nodes (5): NIGHTS, SHARDS, App(), TYPES, useQrPattern()

### Community 44 - "DatabaseSeeder.php"
Cohesion: 0.21
Nodes (6): LineupRole, DatabaseSeeder, DemoWeekSeeder, Carbon, Carbon\Carbon, Illuminate\Database\Seeder

### Community 45 - "GuestlistSignup"
Cohesion: 0.15
Nodes (7): PassKind, TonightController, CheckIn, GuestlistSignup, VenueTable, DemoResetTest, Illuminate\Console\Scheduling\Schedule

### Community 46 - "api"
Cohesion: 0.09
Nodes (33): Failed(), Skel(), blankInvite, CONFIRM, InviteForm(), send(), staffQuery, Team() (+25 more)

### Community 48 - "PassEndpointTest"
Cohesion: 0.17
Nodes (5): App\Enums\StaffRole, App\Models\Event, App\Models\User, PassEndpointTest, Tests\TestCase

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

### Community 55 - "Illuminate\Database\Eloquent\Model"
Cohesion: 0.12
Nodes (9): HourMinute, TableShape, Zone, LineupSlot, Illuminate\Contracts\Database\Eloquent\CastsAttributes, Illuminate\Database\Eloquent\Attributes\Fillable, Illuminate\Database\Eloquent\Attributes\Unguarded, Illuminate\Database\Eloquent\Model (+1 more)

### Community 56 - "Illuminate\Support\Str"
Cohesion: 0.18
Nodes (6): Illuminate\Support\Facades\Artisan, Illuminate\Support\Facades\Schedule, Illuminate\Support\Str, Pdo\Mysql, Symfony\Component\Process\ExecutableFinder, Symfony\Component\Process\Process

### Community 57 - "logging.php"
Cohesion: 0.40
Nodes (4): Monolog\Handler\NullHandler, Monolog\Handler\StreamHandler, Monolog\Handler\SyslogUdpHandler, Monolog\Processor\PsrLogMessageProcessor

### Community 58 - "sanctum.php"
Cohesion: 0.40
Nodes (4): Illuminate\Cookie\Middleware\EncryptCookies, Illuminate\Foundation\Http\Middleware\ValidateCsrfToken, Laravel\Sanctum\Http\Middleware\AuthenticateSession, Laravel\Sanctum\Sanctum

### Community 59 - "restore-check.sh"
Cohesion: 0.60
Nodes (4): cleanup(), DB_DATABASE, mysql_(), restore-check.sh script

## Knowledge Gaps
- **209 isolated node(s):** `h`, `q`, `S6 · Pintu`, `Checkpoint C · satu malam dari pesanan sampai laporan`, `S8 · Tim dan undangan` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 450 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `main.jsx` to `fanglle-pilih-meja-mockup.jsx`, `package.json`, `night.js`, `Public.jsx`, `fanglle-halaman-depan-mockup.jsx`, `fanglle-pengelola-mockup.jsx`, `Door.jsx`, `api`, `fanglle-event-gallery-about-mockup.jsx`, `App`, `fanglle-guestlist-mockup.jsx`, `fanglle-pemindai-pintu-desktop-mockup.jsx`, `AdminNight.jsx`, `AdminEvents.jsx`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `s()` connect `sw.js` to `Door.jsx`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `TestCase`, `AdminOperationsTest`, `DoorTest`, `DatabaseSeeder.php`, `GuestlistSignup`, `Illuminate\Http\JsonResponse`, `PassEndpointTest`, `StaffTest`, `AuthController.php`, `Pass`, `AdminEventsTest`, `bootstrap/app.php`, `Event`, `AuthTest`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `h`, `q`, `S6 · Pintu` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `sw.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0590990990990991 - nodes in this community are weakly interconnected._
- **Should `PassSigner` be split into smaller, more focused modules?**
  _Cohesion score 0.058693244739756366 - nodes in this community are weakly interconnected._
- **Should `composer.json` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._