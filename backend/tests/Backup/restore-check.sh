#!/usr/bin/env bash
# B10.1 / M12 (Dokumen 3): back up the dev database with fanglle:backup, restore the .sql.gz into an empty
# database, and prove nothing was lost: every domain table has the same row count, and the app knows the schema.
#
#   bash tests/Backup/restore-check.sh      (from backend/, or anywhere)
#
# Adds one paid table booking (with its pass and webhook), one guestlist signup and one check-in to the dev database
# `fanglle` first, so no table is empty. At the end fanglle_restore is dropped and `fanglle` goes back to migrate:fresh --seed.
set -u
cd "$(dirname "$0")/../.."

SOURCE=${BACKUP_CHECK_DB:-fanglle} # another database when something else is using the dev one
RESTORE=fanglle_restore
TABLES=(users events lineup_slots venue_tables table_bookings guestlist_signups passes check_ins webhook_events)
mysql_() { mysql -u "${DB_USERNAME:-root}" -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" "$@"; }
export DB_DATABASE=$SOURCE

cleanup() {
  mysql_ -e "DROP DATABASE IF EXISTS $RESTORE" && echo "== $RESTORE dropped"
  DB_DATABASE=$SOURCE php artisan migrate:fresh --seed --no-ansi >/dev/null && echo "== $SOURCE back to migrate:fresh --seed"
}
trap cleanup EXIT

echo "== fresh $SOURCE, plus one of everything"
php artisan migrate:fresh --seed --no-ansi >/dev/null || exit 1
php artisan tinker --execute '
use App\Models\{CheckIn, Event, TableBooking, User};
use App\Support\Night;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

Http::fake(fn ($r) => Http::response(["id" => "inv_".$r["external_id"], "invoice_url" => "https://checkout-staging.xendit.co/x", "status" => "PENDING"]));
config(["services.xendit.callback_token" => "restore-check"]);
$kernel = app(Illuminate\Contracts\Http\Kernel::class);
$post = function (string $uri, array $body, array $server = []) use ($kernel) {
    $res = $kernel->handle(Request::create($uri, "POST", [], [], [], $server + ["CONTENT_TYPE" => "application/json", "HTTP_ACCEPT" => "application/json"], json_encode($body)));
    echo "POST $uri -> {$res->getStatusCode()}\n";
    return json_decode($res->getContent(), true);
};
$open = fn (string $until) => Event::orderBy("date")->get()->first(fn ($e) => now()->lt(Night::at($e->date->toDateString(), $e->{$until})))->date->toDateString();

$code = $post("/api/table-bookings", ["date" => $open("close_time"), "table_code" => "B5", "party_size" => 4, "name" => "Restore Check", "phone" => "081200001111", "email" => "restore@example.com", "age_confirmed" => true])["code"];
$booking = TableBooking::firstWhere("code", $code);
$post("/api/webhooks/xendit", ["id" => $booking->xendit_invoice_id, "external_id" => $code, "status" => "PAID"], ["HTTP_X_CALLBACK_TOKEN" => "restore-check"]);
$post("/api/guestlist", ["date" => $open("guestlist_cutoff"), "party_size" => 2, "qr_mode" => "personal", "name" => "Restore Guest", "phone" => "081200002222", "email" => "guest@example.com", "guest_names" => ["Second Guest"], "age_confirmed" => true]);
$result = CheckIn::record(User::first(), ["client_uuid" => (string) Str::uuid(), "public_id" => $booking->fresh()->pass->public_id, "count" => 2, "method" => "code", "scanned_at" => now()->toIso8601String()]);
echo "check-in -> ".(isset($result["error"]) ? $result["error"] : "recorded")."\n";
' || exit 1

echo "== fanglle:backup"
php artisan fanglle:backup --no-ansi || exit 1
FILE=$(ls -t storage/app/backups/fanglle-*.sql.gz | head -1)
echo "newest dump: $FILE ($(wc -c <"$FILE") bytes gzipped)"

echo "== restore into empty $RESTORE"
mysql_ -e "DROP DATABASE IF EXISTS $RESTORE; CREATE DATABASE $RESTORE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci" || exit 1
gunzip -c "$FILE" | mysql_ "$RESTORE" || exit 1

echo "== row counts ($SOURCE / $RESTORE)"
DIFF=0
for t in "${TABLES[@]}"; do
  a=$(mysql_ -N -e "SELECT COUNT(*) FROM $SOURCE.$t")
  b=$(mysql_ -N -e "SELECT COUNT(*) FROM $RESTORE.$t")
  mark=same; [ "$a" = "$b" ] || { mark=DIFFERENT; DIFF=1; }
  printf '%-18s %4s %4s  %s\n' "$t" "$a" "$b" "$mark"
done

echo "== migrate:status on $RESTORE"
DB_DATABASE=$RESTORE php artisan migrate:status --no-ansi || exit 1
PENDING=$(DB_DATABASE=$RESTORE php artisan migrate:status --no-ansi | grep -c Pending)

if [ "$DIFF" = 0 ] && [ "$PENDING" = 0 ]; then
  echo "PASS: every domain table has the same row count after restore, and no migration is pending"
else
  echo "FAIL: row counts differ or migrations are pending"; exit 1
fi
