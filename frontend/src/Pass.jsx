import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { openDB } from 'idb';
import { api } from './api.js';
import { dayLabel, entryCode, idr, PASS_KINDS, passOrCopy, passState, validUntil, ZONES } from './night.js';
import { Button, Dialog, Mark } from './ui.jsx';

// Guest QR page (/p/:id, S5), from fanglle-qr-tamu-mockup.jsx. Its own chunk: qrcode loads only here, idb only here and at the door.

// The build lives under /app/, the page under /p/. A worker at the site root has scope / without any server header.
if (import.meta.env.PROD) navigator.serviceWorker?.register('/sw.js').catch(() => {});

// The last answer per public_id, for the night the club has no signal.
let db;
const passes = () => (db ??= openDB('fanglle', 1, { upgrade: (d) => d.createObjectStore('passes') }));
const store = {
  get: async (id) => (await passes()).get('passes', id),
  put: async (id, v) => (await passes()).put('passes', v, id),
};

// Drawn from the signed token as one SVG path, error correction M. Two modules of margin as in the mockup; with the
// card's 18px padding the white quiet zone is still over the 4 modules a scanner needs, and the modules stay larger.
function Qr({ text, label }) {
  const { size, d } = useMemo(() => {
    const m = QRCode.create(text, { errorCorrectionLevel: 'M' }).modules;
    let path = '';
    for (let r = 0; r < m.size; r++) for (let c = 0; c < m.size; c++) if (m.get(r, c)) path += `M${c} ${r}h1v1h-1z`;
    return { size: m.size, d: path };
  }, [text]);
  return (
    <svg className="qr" viewBox={`-2 -2 ${size + 4} ${size + 4}`} role="img" aria-label={label} shapeRendering="crispEdges">
      <path d={d} fill="#0C0812" />
    </svg>
  );
}

// Screen Wake Lock. Let go while the page is hidden, asked for again when it is back on screen.
function KeepAwake() {
  const [want, setWant] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!want) return;
    let lock = null;
    let done = false;
    const ask = () =>
      navigator.wakeLock.request('screen').then(
        (l) => {
          if (done) return l.release();
          lock = l;
          // Dropped while still on screen (battery saver): stop promising it stays on.
          l.onrelease = () => !done && document.visibilityState === 'visible' && setWant(false);
        },
        () => {
          if (done) return;
          setWant(false);
          setFailed(true);
        },
      );
    const seen = () => (document.visibilityState === 'visible' ? ask() : lock?.release());
    ask();
    document.addEventListener('visibilitychange', seen);
    return () => {
      done = true;
      document.removeEventListener('visibilitychange', seen);
      lock?.release();
    };
  }, [want]);

  if (!('wakeLock' in navigator))
    return <p className="msg">This phone can't keep the screen on from the browser. Turn up the brightness and keep this page open.</p>;
  return (
    <>
      <p className="hint">At the door, turn your screen brightness up. The scanner reads it faster.</p>
      <Button
        variant="line"
        disabled={want}
        aria-pressed={want}
        onClick={() => {
          setFailed(false);
          setWant(true);
        }}
      >
        {want ? 'Screen will stay on' : 'Keep screen on while I queue'}
      </Button>
      {failed && (
        <p className="msg" role="status">
          This browser can't keep the screen on. Tap the screen now and then so it doesn't lock.
        </p>
      )}
    </>
  );
}

function SaveToHome() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="line" onClick={() => setOpen(true)}>
        Save to home screen
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="save-t">
        <div className="tag">Save to home screen</div>
        <h2 id="save-t" className="head">
          Open it without signal
        </h2>
        <p>Saved to your home screen, this page opens even when the club has no signal.</p>
        <ol>
          <li>Tap your browser's share or menu button</li>
          <li>Choose "Add to Home Screen"</li>
        </ol>
        <Button variant="line" onClick={() => setOpen(false)}>
          Done
        </Button>
      </Dialog>
    </>
  );
}

const savedTime = (ms) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

function Ticket({ p, savedAt }) {
  const { line, stamp } = passState(p);
  const e = p.event;
  const who =
    p.kind === 'group' ? `Group of ${p.people}` : p.kind === 'table' ? `Table for ${p.people}` : p.organiser && `Guest of ${p.organiser}`;
  return (
    <>
      {savedAt && (
        <div className="banner" role="status">
          No signal. Showing the copy saved on this phone at {savedTime(savedAt)}.{!stamp && ' It still works at the door.'}
        </div>
      )}
      <div className="body">
        <p className="state" aria-live="polite">
          {line.map((s, i) => (i % 2 ? <strong key={i}>{s}</strong> : s))}
        </p>

        <div className={`ticket${stamp ? ' off' : ''}`}>
          <Qr text={p.qr} label={stamp ? 'QR no longer valid' : `Entry QR for ${p.holder_name}`} />
          {stamp && (
            <div className="stamp">
              <strong className="head">{stamp[0]}</strong>
              <span>{stamp[1]}</span>
            </div>
          )}
          <div className="who">
            <div className="nm">{p.holder_name}</div>
            {who && <div className="ct">{who}</div>}
          </div>
          {/* A dead code at the door only starts an argument, so it goes with the QR. */}
          {!stamp && (
            <p className="entry">
              <span>Can't scan? Give the door this code</span>
              <strong>{entryCode(p.entry_code)}</strong>
            </p>
          )}
        </div>

        <dl className="facts">
          <dt>Night</dt>
          <dd>
            {e.name}, {dayLabel(e.date)}
          </dd>
          {p.kind === 'table' && (
            <>
              <dt>Table</dt>
              <dd>
                {p.table_code} · {ZONES[p.table_zone]}
              </dd>
              <dt>Booking</dt>
              <dd>{p.booking_code}</dd>
              <dt>Still to spend</dt>
              <dd>{idr(p.left_to_spend)}</dd>
            </>
          )}
          <dt>Entry</dt>
          <dd>{validUntil(p)}</dd>
        </dl>

        {!stamp && (
          <>
            <KeepAwake />
            <SaveToHome />
          </>
        )}
      </div>
    </>
  );
}

function Failed({ q }) {
  const e = q.error;
  if (e.status === 404)
    return (
      <div className="center" role="alert">
        <h1 className="head">This link doesn't open a QR</h1>
        <p>It may be incomplete or copied wrong. Open the link from the email we sent, or ask the organiser to share it again.</p>
      </div>
    );
  return (
    <div className="center" role="alert">
      <h1 className="head">{e.status ? "This QR didn't load" : 'No signal'}</h1>
      <p>{e.status ? e.message : "This phone hasn't saved this QR yet. Open the link again when you have signal."}</p>
      <Button variant="line" onClick={() => q.refetch()}>
        Try again
      </Button>
    </div>
  );
}

export default function Pass() {
  const { id } = useParams();
  const q = useQuery({
    queryKey: ['pass', id],
    queryFn: () => passOrCopy(id, { fetchPass: (i) => api(`/api/passes/${encodeURIComponent(i)}`, { guest: true }), store }),
    networkMode: 'always', // offline is exactly when this query must still run and read the saved copy
  });
  const p = q.data?.pass;

  return (
    <div className="pass">
      <header className="top">
        <span className="mark head">
          <Mark />
        </span>
        {p && <span className="kind">{PASS_KINDS[p.kind]}</span>}
      </header>
      <main>
        {p ? (
          <Ticket p={p} savedAt={q.data.savedAt} />
        ) : q.isError ? (
          <Failed q={q} />
        ) : (
          <div className="body" role="status" aria-label="Loading your QR">
            <div className="skel" style={{ height: 20, width: '60%' }} />
            <div className="skel" style={{ aspectRatio: '1', width: '100%' }} />
            <div className="skel" style={{ height: 20, width: '80%' }} />
          </div>
        )}
      </main>
    </div>
  );
}
