# Graph Report - food-exchange  (2026-09-25)

## Corpus Check
- Corpus is ~43,373 words - fits in a single context window. You may not need a graph.

## Summary
- 731 nodes · 1203 edges · 55 communities (39 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Frontend Packages
- Pass And Booking Mail
- Door And QR Contract
- Composer Dependencies
- Staff And Lineup Enums
- Admin Panel Mockup
- Table Booking Money Rules
- Artisan Commands
- Admin Events Tests
- Project Governance Docs
- Enums And Time Casts
- Event Model
- Public Events Tests
- Core Migrations
- Table Picker Mockup
- Staff Roles And Privacy
- Admin Event Controller
- Night Time Rule
- Entry Code
- Table Booking Controller
- Error Handling Bootstrap
- Opening Hours Config
- Accessibility Hardening
- Guestlist Quota Rules
- Staff Auth
- Role And Turnstile Guards
- S1 Foundation Slice
- Event Gallery Mockup
- Door Scanner Mockup
- Public Event Controller
- Event Validation
- Guestlist Mockup
- Desktop Scanner Mockup
- Xendit Key Guard
- Home Page Mockup
- Night Minutes Contract
- Storage Config
- Logging Config
- Sanctum Config
- Guest QR Mockup
- Misc Cluster 40
- Closing Time Tests
- QR Test Mode
- Anti Bot
- Check In Method
- POST /guestlist/resend
- @tanstack/react-query@5.103.2
- react-router-dom@7.18.4

## God Nodes (most connected - your core abstractions)
1. `Event` - 40 edges
2. `TableBooking` - 27 edges
3. `TableBookingTest` - 23 edges
4. `User` - 22 edges
5. `S3 Pesan Meja (Table Booking Slice)` - 21 edges
6. `Night` - 19 edges
7. `AdminEventsTest` - 19 edges
8. `PublicEventsTest` - 19 edges
9. `TestCase` - 18 edges
10. `App()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `ponytail (minimal code, PRD decisions not simplified)` --semantically_similar_to--> `Visual Rules (font-weight, em dash, contrast)`  [INFERRED] [semantically similar]
  CLAUDE.md → docs/prd-fanglle-2-frontend.md
- `Serena Project Configuration` --conceptually_related_to--> `The Fanglle II - CLAUDE.md Project Instructions`  [INFERRED]
  .serena/project.yml → CLAUDE.md
- `fanglle:keys Artisan Command` --references--> `The Fanglle II - CLAUDE.md Project Instructions`  [EXTRACTED]
  docs/prd-fanglle-1-backend.md → CLAUDE.md
- `The Fanglle II - CLAUDE.md Project Instructions` --references--> `F14: Minimal Personal Data, Phone Last 4 Digits Only`  [EXTRACTED]
  CLAUDE.md → docs/prd-fanglle-0-kontrak-dan-rencana.md
- `The Fanglle II - CLAUDE.md Project Instructions` --references--> `F2: One Timezone, One Night (nightMinutes)`  [EXTRACTED]
  CLAUDE.md → docs/prd-fanglle-0-kontrak-dan-rencana.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **S3 Table Booking Vertical Slice** — docs_prd_fanglle_0_kontrak_dan_rencana_s3, docs_prd_fanglle_1_backend_b3_1, docs_prd_fanglle_1_backend_b3_2, docs_prd_fanglle_1_backend_b3_3, docs_prd_fanglle_1_backend_b3_4, docs_prd_fanglle_2_frontend_f3_1 [EXTRACTED 1.00]
- **QR Signature Chain (sign, verify, test)** — docs_prd_fanglle_0_kontrak_dan_rencana_f10, docs_prd_fanglle_1_backend_passsigner, docs_prd_fanglle_1_backend_dertoraw, docs_prd_fanglle_2_frontend_offline_signature_validation, docs_prd_fanglle_3_testing_t_p1 [EXTRACTED 0.95]
- **Design Authority Chain (Contract > PRD+Mockup > Skill)** — docs_prd_fanglle_0_kontrak_dan_rencana, docs_prd_fanglle_2_frontend, claude_antislop_gate, claude_taste_skill, claude_ponytail_rule [EXTRACTED 1.00]

## Communities (55 total, 16 thin omitted)

### Community 0 - "Frontend Packages"
Cohesion: 0.05
Nodes (45): dependencies, react, react-dom, react-router-dom, @tanstack/react-query, devDependencies, vite, vitest (+37 more)

### Community 1 - "Pass And Booking Mail"
Cohesion: 0.06
Nodes (21): PassKind, TableBooked, Pass, TableBooking, Xendit, TableBookingTest, Illuminate\Bus\Queueable, Illuminate\Contracts\Queue\ShouldQueue (+13 more)

### Community 2 - "Door And QR Contract"
Cohesion: 0.06
Nodes (50): check_ins table, Checkpoint B, GET /door/{date}/codes/{code}, GET /door/{date}/manifest, GET /door/public-key, GET /passes/{public_id}, POST /door/check-ins, POST /guestlist (+42 more)

### Community 3 - "Composer Dependencies"
Cohesion: 0.04
Nodes (47): pestphp/pest-plugin, php-http/discovery, autoload, autoload-dev, psr-4, psr-4, config, allow-plugins (+39 more)

### Community 4 - "Staff And Lineup Enums"
Cohesion: 0.09
Nodes (14): LineupRole, StaffRole, StaffStatus, User, UserFactory, DatabaseSeeder, AuthTest, Carbon\Carbon (+6 more)

### Community 5 - "Admin Panel Mockup"
Cohesion: 0.09
Nodes (24): App(), addRow(), applyStart(), saveEvent(), startCreate(), blankEvent(), BOOKINGS, dayLabel() (+16 more)

### Community 6 - "Table Booking Money Rules"
Cohesion: 0.09
Nodes (31): GET /table-bookings/{code}, POST /table-bookings, POST /webhooks/xendit, F4: One Table, One Active Booking Per Night, F5: Hold 15 Minutes, Invoice 14 Minutes, F6: Deposit 50% of Minimum Spend, Forfeited, F7: Xendit Webhook Never Creates Records, S3 Pesan Meja (Table Booking Slice) (+23 more)

### Community 7 - "Artisan Commands"
Cohesion: 0.10
Nodes (10): KeysCommandTest, SpaTest, XenditKeyGuardTest, TestCase, Illuminate\Foundation\Testing\TestCase, Illuminate\Support\Facades\Artisan, Illuminate\Support\Facades\File, Illuminate\Support\Facades\Process (+2 more)

### Community 8 - "Admin Events Tests"
Cohesion: 0.20
Nodes (4): AdminEventsTest, Illuminate\Foundation\Testing\RefreshDatabase, Illuminate\Support\Facades\DB, static

### Community 9 - "Project Governance Docs"
Cohesion: 0.15
Nodes (20): Backend README (Laravel Boilerplate), The Fanglle II - CLAUDE.md Project Instructions, Backend Sub-agent Definition, Frontend Sub-agent Definition, QA Sub-agent Definition, antislop Delivery Gate, Design Authority Order (Contract > PRD+mockup > skill), ponytail (minimal code, PRD decisions not simplified) (+12 more)

### Community 10 - "Enums And Time Casts"
Cohesion: 0.12
Nodes (9): HourMinute, QrMode, TableShape, Zone, GuestlistSignup, LineupSlot, Illuminate\Contracts\Database\Eloquent\CastsAttributes, Illuminate\Database\Eloquent\Attributes\Fillable (+1 more)

### Community 11 - "Event Model"
Cohesion: 0.17
Nodes (4): Event, SeedTest, Illuminate\Database\Eloquent\Builder, Illuminate\Database\Eloquent\Relations\HasMany

### Community 13 - "Core Migrations"
Cohesion: 0.19
Nodes (3): Illuminate\Database\Migrations\Migration, Illuminate\Database\Schema\Blueprint, Illuminate\Support\Facades\Schema

### Community 14 - "Table Picker Mockup"
Cohesion: 0.15
Nodes (8): App(), idr(), MIN, mmss(), NIGHTS, TABLES, TAKEN, ZONES

### Community 15 - "Staff Roles And Privacy"
Cohesion: 0.18
Nodes (14): Checkpoint C, F1: Guests Never Log In, F15: Staff Roles manager/door, Invite Expires 48h, S7 Operasional Admin Slice, users table (staff accounts), B7.1 Operasional admin endpoints, F7.1 Operasional admin UI, T-A1: Door role blocked from admin API test (+6 more)

### Community 16 - "Admin Event Controller"
Cohesion: 0.28
Nodes (4): EventController, Controller, XenditWebhookController, Illuminate\Http\JsonResponse

### Community 17 - "Night Time Rule"
Cohesion: 0.24
Nodes (3): Night, NightTest, Illuminate\Support\Carbon

### Community 18 - "Entry Code"
Cohesion: 0.22
Nodes (3): EntryCode, EntryCodeTest, PHPUnit\Framework\TestCase

### Community 19 - "Table Booking Controller"
Cohesion: 0.22
Nodes (4): App\Http\Controllers\Admin, TableBookingController, Illuminate\Support\Facades\Route, Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful

### Community 20 - "Error Handling Bootstrap"
Cohesion: 0.18
Nodes (7): BookingStatus, Illuminate\Database\Eloquent\ModelNotFoundException, Illuminate\Database\UniqueConstraintViolationException, Illuminate\Foundation\Application, Illuminate\Foundation\Configuration\Exceptions, Illuminate\Foundation\Configuration\Middleware, Symfony\Component\HttpKernel\Exception\HttpExceptionInterface

### Community 21 - "Opening Hours Config"
Cohesion: 0.18
Nodes (11): Checkpoint A, S2 Acara (Events Slice), S9 Halaman Konten Slice, B2.1 Endpoint publik acara, B2.2 Admin acara, B9.1 NIGHT_OPENS_AT in responses, F2.1 Home This Week, F2.2 Detail event (+3 more)

### Community 22 - "Accessibility Hardening"
Cohesion: 0.18
Nodes (11): Checkpoint D, S10 Pengerasan (Hardening Slice), S8 Tim (Staff Team Slice), B10.1 Rate limit and security headers, B8.1 Staff endpoints + invite accept, F10.1 Aksesibilitas keyboard-only, F8.1 Team + invite accept page, M10: Manual test - 360px width no horizontal scroll (+3 more)

### Community 23 - "Guestlist Quota Rules"
Cohesion: 0.24
Nodes (11): F8: Guestlist Quota Locked with SELECT FOR UPDATE, F9: Guestlist QR Modes group/personal, S4 Guestlist Slice, B4.1 Pendaftaran guestlist, B4.2 Kirim ulang, F4.1 Formulir dan halaman sukses guestlist, T-G1: Concurrent guestlist quota test (50 requests, 40 accepted), T-G2: Guestlist party size exceeds remaining places test (+3 more)

### Community 24 - "Staff Auth"
Cohesion: 0.31
Nodes (6): AuthController, Illuminate\Http\Request, Illuminate\Http\Response, Illuminate\Support\Facades\Auth, Illuminate\Support\Facades\Hash, Illuminate\Validation\ValidationException

### Community 25 - "Role And Turnstile Guards"
Cohesion: 0.29
Nodes (5): EnsureRole, Turnstile, Closure, Illuminate\Contracts\Validation\ValidationRule, Symfony\Component\HttpFoundation\Response

### Community 26 - "S1 Foundation Slice"
Cohesion: 0.20
Nodes (10): /graphify . trigger after S1, S1 Fondasi (Foundation Slice), B1.1 Proyek dan skema, B1.2 Login staf, B1.3 Pengaman kunci, Laravel Sanctum SPA Auth, F1.1 Vite + React setup, F1.2 Token warna dan komponen dasar (+2 more)

### Community 27 - "Event Gallery Mockup"
Cohesion: 0.29
Nodes (6): App(), CATS, idr(), NIGHTS, SHARDS, SHOTS

### Community 28 - "Door Scanner Mockup"
Cohesion: 0.32
Nodes (6): App(), beep(), open(), start(), GUESTS, SCANS

### Community 30 - "Event Validation"
Cohesion: 0.33
Nodes (3): EventRequest, Illuminate\Foundation\Http\FormRequest, Illuminate\Validation\Rule

### Community 31 - "Guestlist Mockup"
Cohesion: 0.29
Nodes (3): App(), emptyForm, NIGHTS

### Community 32 - "Desktop Scanner Mockup"
Cohesion: 0.29
Nodes (4): App(), GUESTS, INITIAL_LOG, SIM

### Community 33 - "Xendit Key Guard"
Cohesion: 0.40
Nodes (3): AppServiceProvider, Illuminate\Support\ServiceProvider, RuntimeException

### Community 35 - "Night Minutes Contract"
Cohesion: 0.33
Nodes (6): F2: One Timezone, One Night (nightMinutes), lineup_slots table, nightMinutes("HH:MM") JS Implementation, T-G6: Guestlist cutoff boundary test, T-W1: nightMinutes cross-language parity test, T-W2: Line-up ordering across midnight test

### Community 37 - "Logging Config"
Cohesion: 0.40
Nodes (4): Monolog\Handler\NullHandler, Monolog\Handler\StreamHandler, Monolog\Handler\SyslogUdpHandler, Monolog\Processor\PsrLogMessageProcessor

### Community 38 - "Sanctum Config"
Cohesion: 0.40
Nodes (4): Illuminate\Cookie\Middleware\EncryptCookies, Illuminate\Foundation\Http\Middleware\ValidateCsrfToken, Laravel\Sanctum\Http\Middleware\AuthenticateSession, Laravel\Sanctum\Sanctum

### Community 39 - "Guest QR Mockup"
Cohesion: 0.50
Nodes (3): App(), TYPES, useQrPattern()

### Community 41 - "Closing Time Tests"
Cohesion: 0.67
Nodes (3): events table, F3: Doors Open 15:00, Close Time Per Event, T-W3: Close time validation test (14:00 rejected, 04:00 accepted)

### Community 42 - "QR Test Mode"
Cohesion: 0.67
Nodes (3): F13: QR Delivered via Queued Email, Resend Limited, M1: Manual test - table booking via tunnel, real Xendit test-mode payment, T-G7: Guestlist resend rate limit test

### Community 43 - "Anti Bot"
Cohesion: 0.67
Nodes (3): F16: Anti-bot via Cloudflare Turnstile, Cloudflare Turnstile (server verification), T-G8: Turnstile enforcement test

## Knowledge Gaps
- **146 isolated node(s):** `CheckInMethod`, `$schema`, `name`, `type`, `description` (+141 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 291 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Event` connect `Event Model` to `Staff And Lineup Enums`, `Admin Events Tests`, `Enums And Time Casts`, `Public Events Tests`, `Admin Event Controller`, `Night Time Rule`, `Table Booking Controller`, `Error Handling Bootstrap`, `Public Event Controller`, `Event Validation`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `react` connect `Frontend Packages` to `Desktop Scanner Mockup`, `Home Page Mockup`, `Admin Panel Mockup`, `Guest QR Mockup`, `Table Picker Mockup`, `Event Gallery Mockup`, `Door Scanner Mockup`, `Guestlist Mockup`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `TestCase` connect `Artisan Commands` to `Pass And Booking Mail`, `Staff And Lineup Enums`, `Admin Events Tests`, `Event Model`, `Public Events Tests`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `CheckInMethod`, `$schema`, `name` to the rest of the system?**
  _146 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Packages` be split into smaller, more focused modules?**
  _Cohesion score 0.05285592497868713 - nodes in this community are weakly interconnected._
- **Should `Pass And Booking Mail` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `Door And QR Contract` be split into smaller, more focused modules?**
  _Cohesion score 0.060408163265306125 - nodes in this community are weakly interconnected._