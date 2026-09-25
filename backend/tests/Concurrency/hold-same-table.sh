#!/usr/bin/env bash
# F4 / B3 pass criterion: 20 simultaneous holds on table B5 for one night, spread over 10 separate PHP
# servers on the dev MySQL database. Exactly one may win (201); the other 19 get 409.
#
#   bash tests/Concurrency/hold-same-table.sh      (from backend/, or anywhere)
#
# Resets the dev database before and after. Xendit is a local stub, reached through XENDIT_BASE_URL.
# Servers run as `php -S` directly: `php artisan serve` doesn't pass custom env vars to its child.
set -u
cd "$(dirname "$0")/../.."

TABLE=B5
REQUESTS=20
PORTS=(8301 8302 8303 8304 8305 8306 8307 8308 8309 8310)
STUB_PORT=8399
WORK=$(mktemp -d)
export STUB_LOG="$WORK/stub.log"
: >"$STUB_LOG"

stop_port() { # php.exe on Windows ignores the shell's kill, so find it by port there
  local pid
  if command -v taskkill >/dev/null 2>&1; then
    pid=$(netstat -ano | grep "127.0.0.1:$1 .*LISTENING" | awk '{print $5}' | head -1)
    [ -n "$pid" ] && taskkill //PID "$pid" //F >/dev/null 2>&1
  else
    pid=$(lsof -ti "tcp:$1" -sTCP:LISTEN 2>/dev/null) && kill "$pid"
  fi
}
cleanup() {
  for p in "${PORTS[@]}" "$STUB_PORT"; do stop_port "$p"; done
  echo "== reset dev database"
  php artisan migrate:fresh --seed --no-ansi >/dev/null && echo "dev database migrated and seeded"
  rm -rf "$WORK"
}
trap cleanup EXIT

echo "== fresh dev database"
php artisan migrate:fresh --seed --no-ansi >/dev/null && echo "dev database migrated and seeded"
DATE=$(php artisan tinker --execute 'echo App\Models\Event::orderBy("date")->get()->first(fn ($e) => now()->lt(App\Support\Night::at($e->date->toDateString(), $e->close_time)))?->date->toDateString();' | tr -d '\r\n')
[ -n "$DATE" ] || { echo "No seeded night is still open for bookings."; exit 1; }
echo "night: $DATE, table: $TABLE, requests: $REQUESTS, servers: ${#PORTS[@]}"

php -S "127.0.0.1:$STUB_PORT" tests/Concurrency/xendit-stub.php >"$WORK/stub-server.log" 2>&1 &
for p in "${PORTS[@]}"; do
  (cd public && XENDIT_BASE_URL="http://127.0.0.1:$STUB_PORT" exec php -S "127.0.0.1:$p" ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php) >"$WORK/server-$p.log" 2>&1 &
done
for p in "${PORTS[@]}" "$STUB_PORT"; do
  for _ in $(seq 1 40); do curl -s -o /dev/null "http://127.0.0.1:$p/" && break; sleep 0.25; done
done

echo "== firing $REQUESTS holds at once"
export DATE TABLE
seq 1 "$REQUESTS" | xargs -P "$REQUESTS" -I{} sh -c '
  port=$((8301 + {} % 10))
  curl -s -o /dev/null -w "%{http_code}\n" -X POST "http://127.0.0.1:$port/api/table-bookings" \
    -H "Content-Type: application/json" -H "Accept: application/json" \
    -d "{\"date\":\"$DATE\",\"table_code\":\"$TABLE\",\"party_size\":4,\"name\":\"Guest {}\",\"phone\":\"0812000000$(printf %02d {})\",\"email\":\"guest{}@example.com\",\"age_confirmed\":true}"
' >"$WORK/codes.txt"

echo "== responses (count, status)"
sort "$WORK/codes.txt" | uniq -c
ACTIVE=$(php artisan tinker --execute "echo App\Models\TableBooking::where('event_id', App\Models\Event::where('date', '$DATE')->value('id'))->whereRelation('venueTable', 'code', '$TABLE')->whereIn('status', ['held', 'paid'])->count();" | tr -d '\r\n')
INVOICES=$(grep -c "^POST /v2/invoices" "$STUB_LOG")
echo "active bookings for $TABLE on $DATE in MySQL: $ACTIVE"
echo "invoices requested from the stub (proves XENDIT_BASE_URL reached every server): $INVOICES"

CREATED=$(grep -c '^201$' "$WORK/codes.txt")
CONFLICT=$(grep -c '^409$' "$WORK/codes.txt")
if [ "$CREATED" = 1 ] && [ "$CONFLICT" = $((REQUESTS - 1)) ] && [ "$ACTIVE" = 1 ] && [ "$INVOICES" = 1 ]; then
  echo "PASS: exactly one 201, $CONFLICT x 409, one active booking"
else
  echo "FAIL"; for p in "${PORTS[@]}"; do tail -3 "$WORK/server-$p.log"; done; exit 1
fi
