<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Mirrors Dokumen 0 §2.2 line for line, so the two can be diffed by eye.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id(); $table->date('date')->unique();
            $table->string('name', 80); $table->string('genre', 60)->nullable(); $table->string('blurb', 220)->nullable();
            $table->unsignedSmallInteger('guestlist_quota'); $table->time('guestlist_cutoff'); $table->time('close_time');
            $table->unsignedBigInteger('min_spend_stage'); $table->unsignedBigInteger('min_spend_booth'); $table->unsignedBigInteger('min_spend_bar');
            $table->timestamps();
        });

        Schema::create('lineup_slots', function (Blueprint $table) {
            $table->id(); $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->string('performer', 80);
            $table->string('role', 12);   // headliner | guest_star | support | warm_up | closing | b2b
            $table->time('starts_at'); $table->time('ends_at'); $table->unsignedTinyInteger('position');
        });

        Schema::create('venue_tables', function (Blueprint $table) {
            $table->id(); $table->string('code', 4)->unique();   // S1..S4, B1..B6, T1..T6
            $table->string('zone', 8);                          // stage | booth | bar
            $table->string('shape', 8);                         // round | booth | high
            $table->unsignedTinyInteger('capacity'); $table->unsignedSmallInteger('x'); $table->unsignedSmallInteger('y');
        });

        Schema::create('table_bookings', function (Blueprint $table) {
            $table->id(); $table->string('code', 12)->unique();  // F2-XXXX
            $table->foreignId('event_id')->constrained(); $table->foreignId('venue_table_id')->constrained();
            $table->string('status', 12);                        // held | paid | released | no_show
            $table->string('name', 80); $table->string('phone', 20); $table->string('email');
            $table->unsignedTinyInteger('party_size');
            $table->unsignedBigInteger('min_spend'); $table->unsignedBigInteger('deposit');
            $table->timestamp('held_until'); $table->timestamp('paid_at')->nullable();
            $table->string('xendit_invoice_id')->nullable()->unique(); $table->string('xendit_invoice_url')->nullable();
            $table->timestamps();
            $table->unsignedBigInteger('active_table_id')->nullable()
                ->virtualAs("IF(status IN ('held','paid'), venue_table_id, NULL)");
            $table->unique(['event_id', 'active_table_id']);    // F4: MySQL allows many NULLs
        });

        Schema::create('guestlist_signups', function (Blueprint $table) {
            $table->id(); $table->foreignId('event_id')->constrained();
            $table->string('name', 80); $table->string('phone', 20); $table->string('email');
            $table->unsignedTinyInteger('party_size'); $table->string('qr_mode', 10);   // group | personal
            $table->timestamp('removed_at')->nullable(); $table->unsignedTinyInteger('resend_count_hour')->default(0);
            $table->timestamp('resend_window_at')->nullable(); $table->timestamps();
            $table->string('active_phone')->nullable()->virtualAs('IF(removed_at IS NULL, phone, NULL)');
            $table->unique(['event_id', 'active_phone']);        // F8
        });

        Schema::create('passes', function (Blueprint $table) {
            $table->id(); $table->string('public_id', 26)->unique();   // ULID, in the URL /p/:id
            $table->char('entry_code', 8)->unique();                    // F17, stored without the hyphen
            $table->foreignId('event_id')->constrained();
            $table->string('kind', 10);                         // group | personal | table
            $table->foreignId('guestlist_signup_id')->nullable()->constrained();
            $table->foreignId('table_booking_id')->nullable()->constrained();
            $table->string('holder_name', 80); $table->unsignedTinyInteger('people');
            $table->unsignedTinyInteger('inside_count')->default(0); $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
        });

        Schema::create('check_ins', function (Blueprint $table) {
            $table->id(); $table->uuid('client_uuid')->unique();       // F12
            $table->foreignId('pass_id')->constrained(); $table->foreignId('user_id')->constrained();
            $table->unsignedTinyInteger('count');
            $table->string('method', 10);                       // scan | code | search | override
            $table->boolean('conflict')->default(false); $table->timestamp('scanned_at'); $table->timestamps();
        });

        Schema::create('webhook_events', function (Blueprint $table) {
            $table->id(); $table->string('invoice_id'); $table->string('status', 16);
            $table->unique(['invoice_id', 'status']); $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['webhook_events', 'check_ins', 'passes', 'guestlist_signups', 'table_bookings', 'venue_tables', 'lineup_slots', 'events'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
