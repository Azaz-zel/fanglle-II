# Graph Report - food-exchange  (2026-09-29)

## Corpus Check
- 64 files · ~69,421 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1265 nodes · 2609 edges · 85 communities (52 shown, 33 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 52 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 81
- Community 82
- Community 83
- Community 84

## God Nodes (most connected - your core abstractions)
1. `User` - 61 edges
2. `Pass` - 48 edges
3. `TableBooking` - 41 edges
4. `TestCase` - 37 edges
5. `Night` - 31 edges
6. `api()` - 28 edges
7. `GuestlistSignup` - 24 edges
8. `StaffTest` - 24 edges
9. `TableBookingTest` - 23 edges
10. `Event` - 23 edges

## Surprising Connections (you probably didn't know these)
- `ponytail (minimal code, PRD decisions not simplified)` --semantically_similar_to--> `Visual Rules (font-weight, em dash, contrast)`  [INFERRED] [semantically similar]
  CLAUDE.md → docs/prd-fanglle-2-frontend.md
- `fanglle:keys Artisan Command` --references--> `The Fanglle II - CLAUDE.md Project Instructions`  [EXTRACTED]
  docs/prd-fanglle-1-backend.md → CLAUDE.md
- `Serena Project Configuration` --conceptually_related_to--> `The Fanglle II - CLAUDE.md Project Instructions`  [INFERRED]
  .serena/project.yml → CLAUDE.md
- `The Fanglle II - CLAUDE.md Project Instructions` --references--> `F14: Minimal Personal Data, Phone Last 4 Digits Only`  [EXTRACTED]
  CLAUDE.md → docs/prd-fanglle-0-kontrak-dan-rencana.md
- `Frontend index.html Entry Point` --references--> `F1.1 Vite + React setup`  [INFERRED]
  frontend/index.html → docs/prd-fanglle-2-frontend.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **QR Signature Chain (sign, verify, test)** — docs_prd_fanglle_0_kontrak_dan_rencana_f10, docs_prd_fanglle_1_backend_passsigner, docs_prd_fanglle_1_backend_dertoraw, docs_prd_fanglle_2_frontend_offline_signature_validation, docs_prd_fanglle_3_testing_t_p1 [EXTRACTED 0.95]
- **Most-often-violated rules (F2, F7, F14, font, em dash, no hardcode)** — agents_night_minutes_f2, agents_tanpa_nilai_hardcode, agents_font_weight_max_400, agents_tanpa_em_dash, agents_hp_lengkap_f14, agents_webhook_tidak_membuat_record_f7 [EXTRACTED 1.00]
- **Design authority chain (contract, PRD + mockup, skills)** — agents_dokumen_0_kontrak, agents_prd_bidang, agents_mockup_jsx, agents_antislop_delivery_gate, claude_taste_skill, claude_ponytail_rule [EXTRACTED 1.00]
- **Design Authority Chain (Contract > PRD+Mockup > Skill)** — docs_prd_fanglle_0_kontrak_dan_rencana, docs_prd_fanglle_2_frontend, claude_antislop_gate, claude_taste_skill, claude_ponytail_rule [EXTRACTED 1.00]
- **S3 Table Booking Vertical Slice** — docs_prd_fanglle_0_kontrak_dan_rencana_s3, docs_prd_fanglle_1_backend_b3_1, docs_prd_fanglle_1_backend_b3_2, docs_prd_fanglle_1_backend_b3_3, docs_prd_fanglle_1_backend_b3_4, docs_prd_fanglle_2_frontend_f3_1 [EXTRACTED 1.00]
- **Signed entry QR flow (keys, guest pass, offline scanner)** — agents_fanglle_keys, agents_qr_masuk, agents_pemindai_pintu_offline, frontend_index_manifest_link [INFERRED 0.75]

## Communities (85 total, 33 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (22): a(), b(), c(), d(), e, f(), h, i (+14 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (49): antislop Delivery Gate (mandatory per screen), Backend Laravel (API + build server), Berhenti dan Tanya Sebelum (stop-and-ask rules), Checkpoint A, B, C, D (wait for 'lanjut'), Dokumen 0: Kontrak dan Rencana (docs/prd-fanglle-0-kontrak-dan-rencana.md), php artisan fanglle:demo-reset (rebuild demo week), php artisan fanglle:keys (QR signing key generation), Poiret One and Didact Gothic: font-weight max 400, no italic (+41 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (18): App\Enums\StaffStatus, StaffRole, StaffStatus, User, StaffRole, StaffPolicy, UserFactory, AuthTest (+10 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (16): AppServiceProvider, EntryCode, PassSigner, QrCrossLanguageTest, XenditKeyGuardTest, EntryCodeTest, PassSignerDerTest, Illuminate\Cache\RateLimiting\Limit (+8 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (47): pestphp/pest-plugin, php-http/discovery, autoload, autoload-dev, psr-4, psr-4, config, allow-plugins (+39 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (33): { jwk, items }, results, NIGHTS, SHARDS, dependencies, idb, qrcode, react (+25 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (28): Pass, clock(), dayLabel(), dayParts(), earliest(), entryCode(), headliners(), idr() (+20 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (6): TableBooking, Xendit, TableBookingTest, Illuminate\Database\Eloquent\Relations\HasOne, Illuminate\Http\Client\PendingRequest, self

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (15): App\Enums\BookingStatus, App\Enums\PassKind, App\Enums\StaffRole, App\Mail\TableBooked, KeysCommandTest, OpeningTimeTest, TestCase, Illuminate\Foundation\Testing\RefreshDatabase (+7 more)

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (8): Night, AdminOperationsTest, CheckInMethod, static, NightTest, BookingStatus, Illuminate\Support\Carbon, QrMode

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (23): errorText(), Login(), submit(), staffPath(), Admin, Book, Booking, Door (+15 more)

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (24): App(), addRow(), applyStart(), saveEvent(), startCreate(), blankEvent(), BOOKINGS, dayLabel() (+16 more)

### Community 12 - "Community 12"
Cohesion: 0.09
Nodes (31): GET /table-bookings/{code}, POST /table-bookings, POST /webhooks/xendit, F4: One Table, One Active Booking Per Night, F5: Hold 15 Minutes, Invoice 14 Minutes, F6: Deposit 50% of Minimum Spend, Forfeited, F7: Xendit Webhook Never Creates Records, S3 Pesan Meja (Table Booking Slice) (+23 more)

### Community 13 - "Community 13"
Cohesion: 0.09
Nodes (21): latest(), mmss(), ROLES, secondsLeft(), blank, blankList, Booking(), release() (+13 more)

### Community 14 - "Community 14"
Cohesion: 0.13
Nodes (14): App\Enums\QrMode, App\Rules\Turnstile, App\Support\Xendit, GuestlistController, GuestlistPasses, GuestlistSignup, GuestContact, Illuminate\Database\Eloquent\Attributes\Unguarded (+6 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (12): App\Http\Controllers\Admin, App\Http\Controllers\EventController, App\Http\Controllers\XenditWebhookController, App\Support\EntryCode, AuthController, DoorController, PassController, XenditWebhookController (+4 more)

### Community 16 - "Community 16"
Cohesion: 0.09
Nodes (24): /graphify . trigger after S1, Checkpoint D, S1 Fondasi (Foundation Slice), S10 Pengerasan (Hardening Slice), S8 Tim (Staff Team Slice), S9 Halaman Konten Slice, B10.1 Rate limit and security headers, B1.1 Proyek dan skema (+16 more)

### Community 17 - "Community 17"
Cohesion: 0.24
Nodes (3): DoorTest, StaffRole, Illuminate\Testing\TestResponse

### Community 19 - "Community 19"
Cohesion: 0.16
Nodes (8): App\Http\Controllers\Controller, CheckInController, GuestlistController, TonightController, CheckIn, Illuminate\Http\Response, Illuminate\Support\Facades\Gate, Illuminate\Validation\Rule

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (10): StaffRole, StaffInvite, TableBooked, Illuminate\Bus\Queueable, Illuminate\Contracts\Queue\ShouldBeEncrypted, Illuminate\Contracts\Queue\ShouldQueue, Illuminate\Mail\Mailable, Illuminate\Mail\Mailables\Content (+2 more)

### Community 21 - "Community 21"
Cohesion: 0.13
Nodes (5): App\Enums\CheckInMethod, Pass, CheckInMethod, Carbon\CarbonInterface, Illuminate\Database\Eloquent\Relations\BelongsTo

### Community 23 - "Community 23"
Cohesion: 0.23
Nodes (17): blank(), detailQuery(), Events(), addRow(), applyStart(), save(), startCreate(), fromApi() (+9 more)

### Community 24 - "Community 24"
Cohesion: 0.19
Nodes (8): EnsureActive, EnsureRole, SecurityHeaders, Turnstile, Closure, Illuminate\Auth\AuthenticationException, Illuminate\Contracts\Validation\ValidationRule, Symfony\Component\HttpFoundation\Response

### Community 26 - "Community 26"
Cohesion: 0.15
Nodes (17): GET /door/{date}/codes/{code}, GET /door/{date}/manifest, POST /door/check-ins, F10: QR Format FNG2 with ECDSA P-256 Signature, passes table (one row per QR), derToRaw DER-to-r-s Conversion, fanglle:keys Artisan Command, PassSigner Class (QR Signing) (+9 more)

### Community 27 - "Community 27"
Cohesion: 0.14
Nodes (17): F13: QR Delivered via Queued Email, Resend Limited, F16: Anti-bot via Cloudflare Turnstile, F8: Guestlist Quota Locked with SELECT FOR UPDATE, F9: Guestlist QR Modes group/personal, S4 Guestlist Slice, B4.1 Pendaftaran guestlist, B4.2 Kirim ulang, Cloudflare Turnstile (server verification) (+9 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (3): Event, SeedTest, Illuminate\Database\Eloquent\Relations\HasMany

### Community 30 - "Community 30"
Cohesion: 0.12
Nodes (16): Checkpoint A, events table, F2: One Timezone, One Night (nightMinutes), F3: Doors Open 15:00, Close Time Per Event, lineup_slots table, S2 Acara (Events Slice), B2.1 Endpoint publik acara, B2.2 Admin acara (+8 more)

### Community 31 - "Community 31"
Cohesion: 0.15
Nodes (16): Checkpoint B, GET /door/public-key, GET /passes/{public_id}, F17: Manual Entry Code (Crockford Base32), S5 Halaman QR (QR Page Slice), B5.1 PassSigner, EntryCode, endpoint pass, EntryCode::normalize(), F5.1 Halaman QR offline (+8 more)

### Community 32 - "Community 32"
Cohesion: 0.23
Nodes (5): App\Enums\LineupRole, App\Models\Event, EventController, EventRequest, Illuminate\Foundation\Http\FormRequest

### Community 33 - "Community 33"
Cohesion: 0.19
Nodes (3): Illuminate\Database\Migrations\Migration, Illuminate\Database\Schema\Blueprint, Illuminate\Support\Facades\Schema

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (8): App(), idr(), MIN, mmss(), NIGHTS, TABLES, TAKEN, ZONES

### Community 36 - "Community 36"
Cohesion: 0.18
Nodes (14): Checkpoint C, F1: Guests Never Log In, F15: Staff Roles manager/door, Invite Expires 48h, S7 Operasional Admin Slice, users table (staff accounts), B7.1 Operasional admin endpoints, F7.1 Operasional admin UI, T-A1: Door role blocked from admin API test (+6 more)

### Community 37 - "Community 37"
Cohesion: 0.20
Nodes (14): guestNames(), Book(), hold(), fieldErrors(), Guestlist(), resend(), submit(), listState() (+6 more)

### Community 38 - "Community 38"
Cohesion: 0.18
Nodes (5): HourMinute, LineupSlot, Illuminate\Contracts\Database\Eloquent\CastsAttributes, Illuminate\Database\Eloquent\Attributes\Fillable, Illuminate\Database\Eloquent\Builder

### Community 39 - "Community 39"
Cohesion: 0.22
Nodes (13): check_ins table, F11: Pass Usage inside_count <= people, F12: Check-in Idempotent per client_uuid, S6 Pintu (Door Scanner Slice), B6.1 Manifest, B6.1b Cari kode, B6.2 Check-in batch, M5: Manual test - door phone airplane mode sync (+5 more)

### Community 40 - "Community 40"
Cohesion: 0.24
Nodes (4): BookingStatus, Controller, EventController, VenueTable

### Community 43 - "Community 43"
Cohesion: 0.20
Nodes (5): Illuminate\Support\Facades\Artisan, Illuminate\Support\Facades\Schedule, Illuminate\Support\Str, Pdo\Mysql, Symfony\Component\Process\Process

### Community 44 - "Community 44"
Cohesion: 0.22
Nodes (7): App\Http\Middleware\EnsureRole, Illuminate\Database\Eloquent\ModelNotFoundException, Illuminate\Foundation\Application, Illuminate\Foundation\Configuration\Exceptions, Illuminate\Foundation\Configuration\Middleware, Illuminate\Routing\Middleware\SubstituteBindings, Symfony\Component\HttpKernel\Exception\HttpExceptionInterface

### Community 45 - "Community 45"
Cohesion: 0.33
Nodes (3): App\Models\VenueTable, TableBookingController, Illuminate\Validation\ValidationException

### Community 46 - "Community 46"
Cohesion: 0.36
Nodes (5): api(), ApiError, csrfCookie(), weekQuery, xsrf()

### Community 47 - "Community 47"
Cohesion: 0.32
Nodes (4): LineupRole, DatabaseSeeder, Carbon\Carbon, Illuminate\Database\Seeder

### Community 49 - "Community 49"
Cohesion: 0.29
Nodes (6): App(), CATS, idr(), NIGHTS, SHARDS, SHOTS

### Community 50 - "Community 50"
Cohesion: 0.32
Nodes (6): App(), beep(), open(), start(), GUESTS, SCANS

### Community 51 - "Community 51"
Cohesion: 0.33
Nodes (6): cleanup(), DB_DATABASE, PUBLIC_POSTS_PER_MINUTE, hold-same-table.sh script, stop_port(), STUB_LOG

### Community 52 - "Community 52"
Cohesion: 0.29
Nodes (3): App(), emptyForm, NIGHTS

### Community 53 - "Community 53"
Cohesion: 0.29
Nodes (4): App(), GUESTS, INITIAL_LOG, SIM

### Community 54 - "Community 54"
Cohesion: 0.40
Nodes (5): cleanup(), DB_DATABASE, PUBLIC_POSTS_PER_MINUTE, guestlist-quota.sh script, stop_port()

### Community 57 - "Community 57"
Cohesion: 0.40
Nodes (4): Monolog\Handler\NullHandler, Monolog\Handler\StreamHandler, Monolog\Handler\SyslogUdpHandler, Monolog\Processor\PsrLogMessageProcessor

### Community 58 - "Community 58"
Cohesion: 0.40
Nodes (4): Illuminate\Cookie\Middleware\EncryptCookies, Illuminate\Foundation\Http\Middleware\ValidateCsrfToken, Laravel\Sanctum\Http\Middleware\AuthenticateSession, Laravel\Sanctum\Sanctum

### Community 59 - "Community 59"
Cohesion: 0.60
Nodes (4): cleanup(), DB_DATABASE, mysql_(), restore-check.sh script

### Community 61 - "Community 61"
Cohesion: 0.50
Nodes (3): App(), TYPES, useQrPattern()

### Community 62 - "Community 62"
Cohesion: 0.40
Nodes (5): POST /guestlist, F14: Minimal Personal Data, Phone Last 4 Digits Only, guestlist_signups table, T-A7: Admin list endpoint phone masking test, T-P5: Manifest excludes raw entry_code and full phone test

## Knowledge Gaps
- **183 isolated node(s):** `PassKind`, `QrMode`, `CheckInMethod`, `SHARDS`, `SHARDS` (+178 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 414 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `frontend index.html (Vite SPA shell)` connect `Community 1` to `Community 10`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **What connects `PassKind`, `QrMode`, `CheckInMethod` to the rest of the system?**
  _183 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0609009009009009 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0563265306122449 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08953900709219859 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.057624113475177305 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._