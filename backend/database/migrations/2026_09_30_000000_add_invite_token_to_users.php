<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// "Copy link" on the Team page (owner's decision, 2026-09-30): a pending invite's link, kept encrypted with APP_KEY so a
// manager can copy it. The hash stays the lookup key; password resets never store the raw token.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('invite_token')->nullable()->after('invite_token_hash');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('invite_token');
        });
    }
};
