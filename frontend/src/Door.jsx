import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { openDB } from 'idb';
import { api, errorText } from './api.js';
import { dayLabel } from './night.js';
import { SignOut, Staff } from './staff.jsx';
import {
  applyResults, checkIn, codeHash, guestLine, HOW, importKey, judge, keyAction, kindLabel, mergePasses, nightOf, normalizeCode,
  notOurs, offsetOf, pendingBy, readQr, remainingOf, search, sendQueue, shiftDate, syncLine, tally, typedCode, wallClock, within,
  wrongCode, wrongNight,
} from './door.js';

// Door scanner (/door, S6): fanglle-pemindai-pintu-mockup.jsx on a phone (camera), fanglle-pemindai-pintu-desktop-mockup.jsx
// on a wide screen (handheld scanner). Both also take a handheld scanner, a typed code and a name search. Rules: door.js.

// Tonight's list, the public key, the log and the check-in queue, for a night without signal. Its own database: raising
// the version of the pass page's 'fanglle' database would lock out a pass page still open on version 1.
let db;
const door = () =>
  (db ??= openDB('fanglle-door', 1, {
    upgrade: (d) => {
      d.createObjectStore('kv');
      d.createObjectStore('queue', { keyPath: 'client_uuid' });
    },
  }));
// Storage off (private mode) only costs the offline copy: every write is allowed to fail.
const saved = {
  get: (k) => door().then((d) => d.get('kv', k)).catch(() => undefined),
  put: (k, v) => door().then((d) => d.put('kv', v, k)).catch(() => {}),
  queue: () => door().then((d) => d.getAll('queue')).catch(() => []),
  add: (c) => door().then((d) => d.put('queue', c)).catch(() => {}),
  drop: (ids) =>
    door()
      .then((d) => {
        const tx = d.transaction('queue', 'readwrite');
        return Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
      })
      .catch(() => {}),
};

const zxing = () => import('@zxing/browser'); // the camera reader, only for the phone layout
const WIDE = '(min-width: 900px)';
const REFRESH_MS = 15_000;

function useWide() {
  const [wide, setWide] = useState(() => matchMedia(WIDE).matches);
  useEffect(() => {
    const m = matchMedia(WIDE);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide;
}

// From the mockups: one high tone for valid, two low ones for stop or check.
function beep(ctx, ok) {
  if (!ctx) return;
  const tones = ok ? [[880, 0, 0.18]] : [[220, 0, 0.16], [220, 0.22, 0.16]];
  for (const [f, d, len] of tones) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = ok ? 'sine' : 'square';
    o.frequency.value = f;
    const t = ctx.currentTime + d;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(ok ? 0.3 : 0.12, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + len + 0.02);
  }
}

const cameraError = (e) =>
  !navigator.mediaDevices
    ? 'The camera needs a secure (https) connection. Use a handheld scanner, a code, or search.'
    : e?.name === 'NotAllowedError'
      ? 'The camera is blocked. Allow it in the browser settings, or use a handheld scanner, a code, or search.'
      : e?.name === 'NotFoundError' || e?.name === 'OverconstrainedError'
        ? 'No camera found on this device. Use a handheld scanner, a code, or search.'
        : "The camera didn't start. Use a handheld scanner, a code, or search.";

function Camera({ onRead }) {
  const video = useRef(null);
  const read = useRef(onRead);
  read.current = onRead;
  const [error, setError] = useState('');

  useEffect(() => {
    let controls;
    let gone = false;
    zxing()
      .then(({ BrowserQRCodeReader }) =>
        new BrowserQRCodeReader().decodeFromConstraints({ video: { facingMode: 'environment' } }, video.current, (res) => {
          if (res) read.current(res.getText());
        }),
      )
      .then(
        (c) => (gone ? c.stop() : (controls = c)),
        (e) => !gone && setError(cameraError(e)),
      );
    return () => {
      gone = true;
      controls?.stop();
    };
  }, []);

  return (
    <div className="cam">
      <video ref={video} muted playsInline aria-hidden="true" />
      {!error && <div className="frame" />}
      <p role={error ? 'alert' : undefined}>{error || 'Hold the QR inside the frame'}</p>
    </div>
  );
}

// F17. lock: { times, lockedUntil } shared across both layouts, so leaving the code screen doesn't reset it.
function CodeForm({ id, label, labelClass, hint, find, lock, autoFocus, onFocus, onBlur }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now);
  const wait = Math.ceil((lock.current.lockedUntil - now) / 1000);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(t);
  }, [now, wait]);

  async function submit(e) {
    e.preventDefault();
    if (normalizeCode(code).length !== 8) return setMsg('Type all 8 characters of the code.');
    const input = e.currentTarget.elements.code;
    setBusy(true);
    const miss = await find(code);
    setBusy(false);
    setNow(Date.now());
    setMsg(miss);
    if (!miss) {
      setCode('');
      input.blur(); // the result screen takes Enter and Esc now, not this field
    }
  }

  return (
    <form className="codef" onSubmit={submit} noValidate>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name="code"
        value={code}
        placeholder="e.g. K7QM-4TXP"
        inputMode="text"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={9}
        autoFocus={autoFocus}
        disabled={wait > 0}
        aria-invalid={Boolean(msg) || undefined}
        aria-describedby={`${id}-m`}
        onChange={(e) => {
          setCode(typedCode(e.target.value));
          setMsg('');
        }}
        onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <p id={`${id}-m`} className={msg || wait > 0 ? 'err' : 'hint'} role="status">
        {wait > 0 ? `Too many wrong codes. Try again in ${wait} seconds.` : msg || hint}
      </p>
      <button className="btn line" disabled={busy || wait > 0}>
        {busy ? 'Checking...' : 'Check code'}
      </button>
    </form>
  );
}

function SearchBox({ id, label, labelClass, hint, placeholder, passes, pending, onPick, autoFocus, onFocus, onBlur }) {
  const [query, setQuery] = useState('');
  const q = query.trim();
  const found = search(passes, q);
  return (
    <>
      <div className="field">
        <label className={labelClass} htmlFor={id}>
          {label}
        </label>
        <input
          id={id}
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          autoFocus={autoFocus}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Escape') return;
            setQuery('');
            e.currentTarget.blur();
          }}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>
      {q.length < 2 ? (
        <p className="hint">{hint}</p>
      ) : !found.length ? (
        <p className="hint">No one on tonight's list matches "{q}".</p>
      ) : (
        <ul className="dlist">
          {found.map((p) => (
            <li key={p.public_id}>
              <button
                onClick={() => {
                  setQuery('');
                  onPick(p);
                }}
              >
                <span>
                  {p.holder_name}
                  <br />
                  <small>
                    {kindLabel(p)}
                    {p.phone_last4 && ` · phone ends ${p.phone_last4}`}
                  </small>
                </span>
                <small>
                  {p.inside_count + (pending[p.public_id] ?? 0)}/{p.people} in
                </small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Log({ items, wide }) {
  if (!items.length) return <p className="hint">No check-ins on this device yet tonight.</p>;
  return (
    <ul className="log" aria-label="Last check-ins">
      {items.map((l) =>
        wide ? (
          <li key={l.id}>
            <span className="at">{l.at}</span>
            <span>
              {l.name}
              <br />
              <span className="how">{l.how}</span>
            </span>
            <span>{l.n} in</span>
          </li>
        ) : (
          <li key={l.id}>
            <span className="at">{l.at}</span>
            <span>
              {l.name} · {l.n} in{l.override ? ' · manager' : ''}
            </span>
          </li>
        ),
      )}
    </ul>
  );
}

function Result({ r, wide, blocked, count, setCount, most, manager, onLetIn, onOverride, onClose, focusRef }) {
  const g = r.guest;
  const n = most > 1 ? count : 1;
  return (
    <div className={`res r-${r.tone}`} ref={focusRef} tabIndex={-1} role="alert">
      <div className="icon">{r.tone === 'ok' ? 'VALID' : r.tone === 'bad' ? 'STOP' : 'CHECK'}</div>
      <h2 className="head">{r.title}</h2>
      {blocked && (
        <p className="blocked" role="status">
          A new QR was scanned. Let {g.holder_name ?? 'this guest'} in or cancel first, then scan again.
        </p>
      )}
      {r.tone === 'ok' ? (
        <>
          <div className="gname">{g.holder_name ?? 'New signup'}</div>
          <div className="gmeta">{guestLine(g)}</div>
          <div className="idcheck">Check ID: name matches and 21 or over</div>
          {most > 1 && (
            <>
              <div className="gmeta">How many are coming in now?</div>
              <div className="cnt" role="group" aria-label="People entering now">
                {Array.from({ length: most }, (_, i) => i + 1).map((k) => (
                  <button key={k} aria-pressed={count === k} onClick={() => setCount(k)}>
                    {k}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="acts">
            <button className="btn go" onClick={() => onLetIn(n)}>
              Let {n} in {wide && <kbd>Enter</kbd>}
            </button>
            <button className="btn plain" onClick={onClose}>
              Cancel {wide && <kbd>Esc</kbd>}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="why">{r.sub}</p>
          {/* The server refuses an override from a door account; a button that can only fail stays out. */}
          {r.override && !manager && <p className="why">Only a manager's sign-in can let them in anyway.</p>}
          <div className="acts">
            {r.override && manager && (
              <button className="btn plain" onClick={onOverride}>
                Let in anyway (manager, logged)
              </button>
            )}
            <button className="btn next" onClick={onClose}>
              Scan next {wide && <kbd>Enter</kbd>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Scanner({ me }) {
  const wide = useWide();
  const [load, setLoad] = useState({ state: 'loading' }); // loading | ready | none | nosignal | error
  const [night, setNight] = useState(null); // { event, names, passes, synced_at }
  const [key, setKey] = useState(null);
  const [queue, setQueue] = useState([]);
  const [log, setLog] = useState([]);
  const [online, setOnline] = useState(true);
  const [trouble, setTrouble] = useState(''); // 'signin', or the server's sentence when it refuses the queue
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState(null);
  const [count, setCount] = useState(1);
  const [blocked, setBlocked] = useState(false);
  const [view, setView] = useState('scan'); // phone: scan | search | code
  const [typing, setTyping] = useState(null); // wide: 'search' | 'code' while that field has focus
  const audio = useRef(null);
  const keys = useRef({ buf: '', at: 0 });
  const lock = useRef({ times: [], lockedUntil: 0 });
  const seen = useRef({ text: '', at: 0 });
  const sending = useRef(false);
  const resRef = useRef(null);
  // Timers and async answers read the latest state here, not the render they were created in.
  const live = useRef({});
  live.current = { night, queue, online };

  const offset = offsetOf(night?.synced_at);
  const clockNow = () => wallClock(Date.now(), offsetOf(live.current.night?.synced_at));
  const pending = pendingBy(queue);

  // Signal or not, the door opens with what this device saved; the server's copy replaces it when it answers.
  async function boot() {
    setLoad({ state: 'loading' });
    const [copy, jwk, lastLog, waiting] = await Promise.all([saved.get('night'), saved.get('key'), saved.get('log'), saved.queue()]);
    setQueue(waiting);
    if (lastLog) setLog(lastLog);
    try {
      // The server decides which night it is (F2); ?days=1 is tonight's event or nothing.
      const [tonight, pub] = await Promise.all([within(api('/api/events?days=1', { guest: true })), within(api('/api/door/public-key'))]);
      setKey(await importKey(pub));
      saved.put('key', pub);
      const event = tonight.events[0];
      if (!event) return setLoad({ state: 'none' });
      const [m, week] = await Promise.all([
        within(api(`/api/door/${event.date}/manifest`)),
        // Names for "Wrong night": the week before and after. Nice to have, so a failure here is ignored.
        within(api(`/api/events?from=${shiftDate(event.date, -6)}&days=14`, { guest: true })).catch(() => null),
      ]);
      const same = copy?.event.date === event.date;
      setNight({
        event,
        names: week ? Object.fromEntries(week.events.map((e) => [e.date, e.name])) : same ? copy.names : {},
        passes: mergePasses(same ? copy.passes : {}, m.passes),
        synced_at: m.synced_at,
      });
      setOnline(true);
      setLoad({ state: 'ready' });
    } catch (e) {
      if (e.status) return setLoad({ state: 'error', error: e });
      setOnline(false);
      if (copy && jwk && nightOf(Date.now(), offsetOf(copy.synced_at)) === copy.event.date) {
        setKey(await importKey(jwk));
        setNight(copy);
        setLoad({ state: 'ready' });
      } else setLoad({ state: 'nosignal' });
    }
  }

  // No answer = offline. A refused sign-in shows in the sync bar; the queue waits on this device either way.
  const failed = (e) => {
    if (!e.status) setOnline(false);
    else if (e.status === 401) setTrouble('signin');
    return e;
  };

  // F12: the oldest waiting check-ins go up; the same client_uuid on every retry.
  async function flush() {
    const { night: n, queue: q } = live.current;
    if (sending.current || !n || !q.length) return;
    sending.current = true;
    try {
      const results = await sendQueue(q, (items) => within(api('/api/door/check-ins', { method: 'POST', body: { items } })));
      const answered = new Set(results.map((r) => r.client_uuid));
      const { revoked } = applyResults(live.current.night.passes, q, results);
      setNight((cur) => ({ ...cur, passes: applyResults(cur.passes, q, results).passes }));
      setQueue((cur) => cur.filter((c) => !answered.has(c.client_uuid)));
      saved.drop([...answered]);
      setOnline(true);
      setTrouble('');
      // Cancelled after this device's last sync, and just let in live: they may still be at the door.
      for (const p of revoked) show(judge({ item: p, kind: p.kind, publicId: p.public_id, inside: p.inside_count, event: n.event, now: clockNow() }));
    } catch (e) {
      if (failed(e).status && e.status !== 401) setTrouble(errorText(e));
    } finally {
      sending.current = false;
    }
  }

  async function refresh() {
    const n = live.current.night;
    if (!n) return;
    if (nightOf(Date.now(), offsetOf(n.synced_at)) !== n.event.date) return boot(); // noon passed: a new night
    flush();
    try {
      // The event too: a manager may move the guestlist cutoff during the night.
      const [m, tonight] = await Promise.all([
        within(api(`/api/door/${n.event.date}/manifest?since=${encodeURIComponent(n.synced_at)}`)),
        within(api(`/api/events/${n.event.date}`, { guest: true })),
      ]);
      setNight((cur) => ({ ...cur, event: tonight, passes: mergePasses(cur.passes, m.passes), synced_at: m.synced_at }));
      setOnline(true);
      setTrouble((t) => (t === 'signin' ? '' : t));
    } catch (e) {
      failed(e);
    }
  }

  useEffect(() => {
    boot();
  }, []);

  useEffect(() => {
    if (night) saved.put('night', night);
  }, [night]);

  // A new check-in goes up at once, and a long queue keeps going 200 at a time.
  useEffect(() => {
    if (load.state === 'ready' && queue.length) flush();
  }, [queue.length, load.state]);

  useEffect(() => {
    if (load.state !== 'ready') return;
    const id = setInterval(refresh, REFRESH_MS);
    const off = () => setOnline(false);
    addEventListener('online', refresh);
    addEventListener('offline', off);
    return () => {
      clearInterval(id);
      removeEventListener('online', refresh);
      removeEventListener('offline', off);
    };
  }, [load.state]);

  // Loaded early, so the camera still starts if the signal drops before "Start scanning".
  useEffect(() => {
    if (!wide) zxing().catch(() => {});
  }, [wide]);

  useEffect(() => {
    if (result && !wide) resRef.current?.focus();
  }, [result, wide]);

  function show(r) {
    setResult(r);
    setBlocked(false);
    setCount(r.guest ? Math.max(1, remainingOf(r.guest) ?? 1) : 1);
    beep(audio.current, r.tone === 'ok');
  }

  function openPass(item, publicId, kind, how) {
    const { night: n, queue: q } = live.current;
    const inside = (item?.inside_count ?? 0) + (pendingBy(q)[publicId] ?? 0);
    show({ ...judge({ item, kind, publicId, inside, event: n.event, now: clockNow() }), how });
  }

  // PRD 2.4: signature, then the night, then tonight's list.
  async function scan(text) {
    const n = live.current.night;
    const qr = await readQr(text, key);
    if (!qr) return show(notOurs);
    if (qr.e !== n.event.date) return show(wrongNight(qr.e, n.names));
    openPass(n.passes[qr.p], qr.p, qr.k, 'scan');
  }

  // The camera reads the same QR many times a second. One held in view stays ignored until it's gone for 2 seconds.
  function camRead(text) {
    const now = Date.now();
    const again = text === seen.current.text && now - seen.current.at < 2000;
    seen.current = { text, at: now };
    if (!again && !result) scan(text);
  }

  // F17: online the server looks it up; without signal, the SHA-256 of the typed code against the saved list.
  // Returns the sentence to show under the field, or '' when a result screen opened.
  async function findCode(typed) {
    const n = live.current.night;
    const code = normalizeCode(typed);
    const miss = (sentence) => {
      lock.current = wrongCode(lock.current.times, Date.now());
      return sentence;
    };
    let item;
    try {
      // Already known to be without signal: the saved list at once, not after a 5 second wait. The refresh finds the signal again.
      if (!live.current.online) throw new TypeError('Offline');
      item = await within(api(`/api/door/${n.event.date}/codes/${code}`), 5000);
      setNight((cur) => ({ ...cur, passes: mergePasses(cur.passes, [item]) }));
      setOnline(true);
    } catch (e) {
      if (e.status === 404) return miss(e.message);
      if (e.status === 429) {
        lock.current = { times: [], lockedUntil: Date.now() + 60_000 };
        return e.message;
      }
      if (failed(e).status) return errorText(e);
      const hash = await codeHash(code);
      item = Object.values(n.passes).find((p) => p.entry_code_hash === hash);
      if (!item) return miss("Can't check this code without signal. Search by name, or wait for signal.");
    }
    openPass(item, item.public_id, item.kind, 'code');
    return '';
  }

  function close() {
    setResult(null);
    setBlocked(false);
  }

  function letIn(n, override = false) {
    const g = result.guest;
    const method = override ? 'override' : result.how;
    const c = checkIn(g.public_id, n, method);
    saved.add(c);
    setQueue((q) => [...q, c]);
    const entry = {
      id: c.client_uuid,
      at: clockNow(),
      name: g.holder_name ?? 'New signup',
      n,
      how: `${HOW[method]}${g.table_code ? ` · table ${g.table_code}` : ''}`,
      override,
    };
    const next = [entry, ...log].slice(0, 10);
    setLog(next);
    saved.put('log', next);
    close();
    setView('scan');
  }

  const g = result?.guest;
  const left = g ? remainingOf(g) : 0; // null: a pass newer than the saved list, the door says how many
  const most = left === null ? 9 : wide ? Math.min(left, 9) : left;

  // Handheld scanner (PRD 2.4): a keyboard that types the QR and presses Enter. Fields pause it.
  useEffect(() => {
    if (!started) return;
    const onKey = (e) => {
      if (e.target.closest?.('input') || e.ctrlKey || e.metaKey || e.altKey) return;
      const out = keyAction(keys.current, e.key, performance.now(), result);
      keys.current = out.state;
      if (!out.act) return;
      // Enter on a focused button, with no scan in the buffer, is that button's own click.
      if (e.key === 'Enter' && !out.text && e.target.closest?.('button, a')) return;
      e.preventDefault();
      if (out.act === 'scan') scan(out.text);
      else if (out.act === 'blocked') {
        setBlocked(true);
        beep(audio.current, false);
      } else if (out.act === 'letIn') letIn(most > 1 ? count : 1);
      else if (out.act === 'close') close();
      else if (out.act === 'count' && out.n <= most) setCount(out.n);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  function start() {
    try {
      audio.current = new (window.AudioContext || window.webkitAudioContext)();
      audio.current.resume();
    } catch {
      audio.current = null;
    }
    setStarted(true);
  }

  const ready = load.state === 'ready';
  const t = ready ? tally(night.passes, pending) : null;
  const nums = ready && (
    <div className="nums" aria-label="Tonight">
      <div>
        <strong>{t.inside}</strong>
        <span>Inside</span>
      </div>
      <div>
        <strong>
          {t.gl}/{t.glOf}
        </strong>
        <span>Guestlist</span>
      </div>
      <div>
        <strong>
          {t.tb}/{t.tbOf}
        </strong>
        <span>Tables</span>
      </div>
    </div>
  );

  const pick = (p) => openPass(p, p.public_id, p.kind, 'search');
  const resultProps = {
    wide,
    blocked,
    count,
    setCount,
    most,
    manager: me.role === 'manager',
    onLetIn: letIn,
    onOverride: () => letIn(left ?? 1, true), // ponytail: a pass newer than the list lets 1 in on override; pick a count if managers ask
    onClose: close,
  };

  let body;
  if (load.state === 'loading')
    body = (
      <div className="startwrap">
        <p role="status">Loading tonight's list...</p>
      </div>
    );
  else if (!ready)
    body = (
      <div className="startwrap">
        <h1 className="head">{{ none: 'No event tonight', nosignal: 'No signal' }[load.state] ?? "The door didn't load"}</h1>
        <p>
          {load.state === 'none'
            ? "There's no night on the calendar for today, so there's nothing to scan."
            : load.state === 'nosignal'
              ? "This device hasn't saved tonight's list yet. Connect once to download it. After that, scanning works without signal."
              : errorText(load.error)}
        </p>
        {load.error?.status === 401 ? (
          <Link className="btn solid" to="/login?next=/door">
            Sign in again
          </Link>
        ) : (
          <button className="btn line" onClick={boot}>
            Try again
          </button>
        )}
      </div>
    );
  else if (!started)
    body = (
      <div className="startwrap">
        <h1 className="head">Start the door</h1>
        <p>
          {wide
            ? 'Turns on scan sounds and starts listening to the handheld scanner. Click once at the start of the night.'
            : 'Allows the camera and the scan sounds. Tap once at the start of the night.'}
        </p>
        <button className="btn solid" onClick={start}>
          Start scanning
        </button>
      </div>
    );
  else if (wide)
    body = (
      <div className="dbody">
        <section className="stage" aria-label="Scan result">
          {result ? (
            <Result r={result} {...resultProps} />
          ) : (
            <div className="idle">
              <h1 className="head">Ready to scan</h1>
              <div className="listen" role="status">
                <span className={`dot${typing ? ' amber' : ''}`} />
                {typing
                  ? `Scanner paused while you type ${typing === 'code' ? 'a code' : 'in search'}. Press Esc to go back.`
                  : 'Scanner listening. Scan any QR.'}
              </div>
              <p>The handheld scanner types the code and presses Enter by itself. Nothing needs to be clicked first.</p>
              <div className="keys">
                <span>
                  <kbd>1–9</kbd>people coming in
                </span>
                <span>
                  <kbd>Enter</kbd>let in
                </span>
                <span>
                  <kbd>Esc</kbd>cancel
                </span>
              </div>
            </div>
          )}
        </section>
        <aside className="aside">
          <div className="panel">
            <CodeForm
              id="code"
              label="Type a code"
              labelClass="ptitle"
              hint="When a QR won't scan. Check ID first."
              find={findCode}
              lock={lock}
              onFocus={() => setTyping('code')}
              onBlur={() => setTyping(null)}
            />
          </div>
          <div className="panel">
            <SearchBox
              id="q"
              label="Search by name or phone"
              labelClass="ptitle"
              placeholder="e.g. Ayu or 1234"
              hint="For a dead phone or a QR that won't scan. Check ID first."
              passes={night.passes}
              pending={pending}
              onPick={(p) => {
                document.activeElement?.blur();
                pick(p);
              }}
              onFocus={() => setTyping('search')}
              onBlur={() => setTyping(null)}
            />
          </div>
          <div className="panel">
            <h3 className="ptitle">Last check-ins</h3>
            <Log items={log} wide />
          </div>
        </aside>
      </div>
    );
  else
    body = (
      <>
        {view === 'search' ? (
          <div className="dmain">
            <SearchBox
              id="q"
              label="Search by name or last 4 digits of phone"
              placeholder="e.g. Ayu or 1234"
              hint="Use this when a phone is dead or a QR won't scan. Check ID before letting anyone in."
              passes={night.passes}
              pending={pending}
              onPick={pick}
              autoFocus
            />
            <button className="btn line" onClick={() => setView('scan')}>
              Back to scanner
            </button>
          </div>
        ) : view === 'code' ? (
          <div className="dmain">
            <CodeForm
              id="code"
              label="Code under the guest's QR"
              hint="8 characters, shown under their QR. Check ID before letting anyone in."
              find={findCode}
              lock={lock}
              autoFocus
            />
            <button className="btn line" onClick={() => setView('scan')}>
              Back to scanner
            </button>
          </div>
        ) : (
          <div className="dmain">
            <Camera onRead={camRead} />
            <div className="pair">
              <button className="btn line" onClick={() => setView('search')}>
                Search by name
              </button>
              <button className="btn line" onClick={() => setView('code')}>
                Type a code
              </button>
            </div>
            <p className="hint">A handheld scanner plugged into this device also works. Scan straight into this screen.</p>
            <Log items={log.slice(0, 5)} />
          </div>
        )}
        {result && <Result r={result} focusRef={resRef} {...resultProps} />}
      </>
    );

  return (
    <div className={`doorapp${wide ? ' wide' : ''}`}>
      <header className="top">
        <div className="ttl">
          <span className="t head">Door</span>
          {night && (
            <span className="n">
              {night.event.name} · {dayLabel(night.event.date)}
            </span>
          )}
        </div>
        {wide && nums}
        <SignOut role={me.role} />
      </header>
      {ready && (
        <div className={`sync${online && !trouble ? '' : ' off'}`} role="status">
          <span className="dot" />
          {trouble === 'signin' ? (
            <span>
              Your sign-in ended. {queue.length} check-in{queue.length === 1 ? '' : 's'} saved on this device.{' '}
              <Link to="/login?next=/door">Sign in again</Link>
            </span>
          ) : (
            syncLine({ online, trouble, waiting: queue.length, savedAt: wallClock(Date.parse(night.synced_at), offset) })
          )}
        </div>
      )}
      {!wide && nums}
      {body}
    </div>
  );
}

export default function Door() {
  return <Staff roles={['door', 'manager']}>{(me) => <Scanner me={me} />}</Staff>;
}
