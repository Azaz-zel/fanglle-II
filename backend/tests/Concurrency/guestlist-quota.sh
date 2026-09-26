#!/usr/bin/env bash
# F8 / B4 pass criterion: a night with a guestlist quota of 40 takes 50 simultaneous one-person signups,
# each with its own phone, spread over 10 separate PHP servers on a MySQL database of their own.
# Exactly 40 may get in (201); the other 10 get 422, and MySQL must hold exactly 40 people.
#
#   bash tests/Concurrency/guestlist-quota.sh      (from backend/, or anywhere)
#
# Uses its own database (fanglle_concurrency), so the dev database and a browser test running at the same time are never touched. Servers run as `php -S` from public/ (Laravel's router uses the cwd).
set -u
cd "$(dirname "$0")/../.."

# Env beats .env for every artisan call and every php -S server below.
export DB_DATABASE=fanglle_concurrency
# Every request comes from 127.0.0.1; the per-IP limit of 10 a minute (B10.1) would turn most of them into 429.
export PUBLIC_POSTS_PER_MINUTE=1000
mysql -u "${DB_USERNAME:-root}" -h 127.0.0.1 -e "CREATE DATABASE IF NOT EXISTS fanglle_concurrency CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

QUOTA=40
REQUESTS=50
PORTS=(8301 8302 8303 8304 8305 8306 8307 8308 8309 8310)
WORK=$(mktemp -d)

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
  for p in "${PORTS[@]}"; do stop_port "$p"; done
  rm -rf "$WORK"
}
trap cleanup EXIT

echo "== fresh concurrency database ($DB_DATABASE)"
php artisan migrate:fresh --seed --no-ansi >/dev/null && echo "$DB_DATABASE migrated and seeded"
# The first seeded night whose guestlist is still open, with its quota set to 40.
DATE=$(php artisan tinker --execute "\$e = App\Models\Event::orderBy('date')->get()->first(fn (\$e) => now()->lt(App\Support\Night::at(\$e->date->toDateString(), \$e->guestlist_cutoff))); \$e?->update(['guestlist_quota' => $QUOTA]); echo \$e?->date->toDateString();" | tr -d '\r\n')
[ -n "$DATE" ] || { echo "No seeded night still takes guestlist signups."; exit 1; }
echo "night: $DATE, quota: $QUOTA, one-person signups: $REQUESTS, servers: ${#PORTS[@]}"

for p in "${PORTS[@]}"; do
  (cd public && exec php -S "127.0.0.1:$p" ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php) >"$WORK/server-$p.log" 2>&1 &
done
for p in "${PORTS[@]}"; do
  for _ in $(seq 1 40); do curl -s -o /dev/null "http://127.0.0.1:$p/" && break; sleep 0.25; done
done

echo "== firing $REQUESTS signups at once"
export DATE
seq 1 "$REQUESTS" | xargs -P "$REQUESTS" -I{} sh -c '
  port=$((8301 + {} % 10))
  curl -s -o /dev/null -w "%{http_code}\n" -X POST "http://127.0.0.1:$port/api/guestlist" \
    -H "Content-Type: application/json" -H "Accept: application/json" \
    -d "{\"date\":\"$DATE\",\"party_size\":1,\"qr_mode\":\"group\",\"name\":\"Guest {}\",\"phone\":\"08120000$(printf %04d {})\",\"email\":\"guest{}@example.com\",\"age_confirmed\":true}"
' >"$WORK/codes.txt"

echo "== responses (count, status)"
sort "$WORK/codes.txt" | uniq -c
PEOPLE=$(php artisan tinker --execute "echo (int) App\Models\Event::where('date', '$DATE')->first()->activeSignups()->sum('party_size');" | tr -d '\r\n')
PASSES=$(php artisan tinker --execute "echo App\Models\Pass::whereRelation('event', 'date', '$DATE')->count();" | tr -d '\r\n')
echo "people on the $DATE guestlist in MySQL: $PEOPLE (quota $QUOTA), passes: $PASSES"

CREATED=$(grep -c '^201$' "$WORK/codes.txt")
REJECTED=$(grep -c '^422$' "$WORK/codes.txt")
if [ "$CREATED" = "$QUOTA" ] && [ "$REJECTED" = $((REQUESTS - QUOTA)) ] && [ "$PEOPLE" = "$QUOTA" ] && [ "$PASSES" = "$QUOTA" ]; then
  echo "PASS: exactly $QUOTA x 201, $REJECTED x 422, $PEOPLE people on the list"
else
  echo "FAIL"; for p in "${PORTS[@]}"; do tail -3 "$WORK/server-$p.log"; done; exit 1
fi
