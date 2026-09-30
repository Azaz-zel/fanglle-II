import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorText, weekQuery } from './api.js';
import {
  clock, dayLabel, dayParts, earliest, guestNames, headliners, idr, latest, mmss, nightMinutes, nightRun, others, ROLES, secondsLeft,
  tableState, waShare, ZONES,
} from './night.js';
import { Button, Dialog, Mark } from './ui.jsx';

// Public region: Home (/), event detail (/events/:date), table booking (/book/:date, /booking/:code), guestlist (/guestlist/:date).
// Gallery (/gallery) and About (/about) from fanglle-event-gallery-about-mockup.jsx. The QR page (/p/:id) is its own chunk, Pass.jsx.

const SHARDS = [
  { p: '120,-40 210,-40 180,90', f: '#2A1D3D', d: 0 },
  { p: '300,-60 380,-20 330,140', f: '#3D2A58', d: 0.08 },
  { p: '520,-30 600,10 560,60 500,40', f: '#221931', d: 0.16 },
  { p: '700,-50 800,-50 760,120', f: '#563C7A', d: 0.04 },
  { p: '900,-20 980,30 930,190', f: '#2A1D3D', d: 0.2 },
  { p: '1080,-60 1170,-10 1120,110', f: '#3D2A58', d: 0.12 },
  { p: '220,160 260,190 230,270', f: '#563C7A', d: 0.28 },
  { p: '640,150 700,180 660,300 620,230', f: '#7A1024', d: 0.32 },
  { p: '1000,220 1040,250 1015,330', f: '#7A5BA6', d: 0.36 },
  { p: '420,260 450,280 435,340', f: '#7A5BA6', d: 0.4 },
];
const EVENT_SHARDS = SHARDS.filter((_, i) => i !== 6 && i !== 9); // the event mockup drops these two

const Shards = ({ list = SHARDS }) => (
  <svg className="shards" viewBox="0 0 1200 360" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
    {list.map((s) => (
      <polygon key={s.p} points={s.p} fill={s.f} style={{ animationDelay: `${s.d}s` }} />
    ))}
  </svg>
);

const Divider = () => (
  <div className="divider" aria-hidden="true">
    <span className="rule" />
    <svg viewBox="0 0 20 28">
      <polygon points="4,0 16,0 10,28" fill="#7A1024" />
    </svg>
    <span className="rule" />
  </div>
);

// The menus of fanglle-halaman-depan-mockup.jsx (Home: anchors to its own sections) and fanglle-event-gallery-about-mockup.jsx
// (every other page). NavLink marks the page being shown with aria-current.
const NavLinks = ({ home }) =>
  home ? (
    <>
      <a href="#nights">This week</a>
      <a href="#ways-in">Tables</a>
      <a href="#ways-in">Guestlist</a>
      <NavLink to="/gallery">Gallery</NavLink>
      <NavLink to="/about">About</NavLink>
      <a href="#visit">Visit</a>
    </>
  ) : (
    <>
      <Link to="/#nights">This week</Link>
      <NavLink to="/gallery">Gallery</NavLink>
      <NavLink to="/about">About</NavLink>
    </>
  );

// flow: the booking pages, which trade the menu and footer for one way back (fanglle-pilih-meja-mockup.jsx).
// book: where "Book a table" goes; the event page sends it to that night, other pages to the two ways in on Home.
function Site({ home, flow, book = '/#ways-in', className = '', children }) {
  return (
    <div className={`site ${className}`}>
      <header className="nav">
        <div className="navin">
          <Link to="/" className="mark head">
            <Mark />
          </Link>
          {flow ? (
            <Link to="/" className="back">
              Back to home
            </Link>
          ) : (
            <>
              <nav className="links" aria-label="Main">
                <NavLinks home={home} />
              </nav>
              {home ? (
                <a className="btn solid" href="#ways-in">
                  Book a table
                </a>
              ) : (
                <Link className="btn solid" to={book}>
                  Book a table
                </Link>
              )}
            </>
          )}
        </div>
      </header>
      <main>{children}</main>
      {!flow && (
        <footer>
          <div className="wrap">
            <div className="foot">
              <span className="mark head">
                <Mark />
              </span>
              <nav aria-label="Footer">
                <NavLinks home={home} />
              </nav>
            </div>
            <p className="fine">A fictional venue. Portfolio concept by Ralph de Vinca Group.</p>
          </div>
        </footer>
      )}
    </div>
  );
}

// Loading, error and data states for one query. `fail` is the sentence for when the server never answered.
function Wait({ q, loading, fail, children }) {
  if (q.isPending)
    return (
      <p className="sub" role="status">
        {loading}
      </p>
    );
  if (q.isError)
    return (
      <div className="fail" role="alert">
        <p>{q.error.status ? q.error.message : fail}</p>
        <Button variant="line" onClick={() => q.refetch()}>
          Try again
        </Button>
      </div>
    );
  return children(q.data);
}

const eventQuery = (date) => ({ queryKey: ['event', date], queryFn: () => api(`/api/events/${encodeURIComponent(date)}`) });
const tablesQuery = (date) => ({ queryKey: ['tables', date], queryFn: () => api(`/api/events/${encodeURIComponent(date)}/tables`) });
// Where "Choose a table" goes without a night of its own: the first night with tables left, else the first night.
const firstOpen = (events = []) => (events.find((x) => x.tables.status !== 'sold_out') ?? events[0])?.date;

const who = (e) => headliners(e.lineup).map((s) => s.performer).join(' and ') || 'Line-up to come';
const cheapest = (e) => idr(Math.min(...Object.values(e.min_spend)));
const byNight = (a, b) => nightMinutes(a) - nightMinutes(b);

function Night({ e }) {
  const d = dayParts(e.date);
  const rest = others(e.lineup);
  const t = e.tables.status;
  const g = e.guestlist.status;
  return (
    <li className="night">
      <div className="dt">
        <span className="d head">{d.date}</span>
        <span className="m">
          {d.day} · {d.month}
        </span>
      </div>
      <div>
        <Link to={`/events/${e.date}`} className="nm head nmlink">
          {e.name}
        </Link>
        <div className="who">
          {who(e)} <span>{[rest.length > 0 && `with ${rest.join(', ')}`, e.genre].filter(Boolean).join(' · ')}</span>
        </div>
      </div>
      <div className="status">
        <span className={t === 'sold_out' ? 'gone' : t === 'few' ? 'last' : ''}>
          {t === 'sold_out' ? 'Tables sold out' : t === 'few' ? `Last tables · from ${cheapest(e)}` : `Tables from ${cheapest(e)}`}
        </span>
        <span className={g === 'open' ? '' : 'gone'}>
          {g === 'full' ? 'Guestlist full' : g === 'closed' ? 'Guestlist closed' : `Guestlist open until ${clock(e.guestlist_cutoff)}`}
        </span>
      </div>
      <div className="cta">
        {t !== 'sold_out' ? (
          <Link className="btn line" to={`/book/${e.date}`} aria-label={`Reserve a table for ${e.name}`}>
            Reserve
          </Link>
        ) : g === 'open' ? (
          <Link className="btn line" to={`/guestlist/${e.date}`} aria-label={`Join the guestlist for ${e.name}`}>
            Guestlist only
          </Link>
        ) : (
          <button type="button" className="btn line" disabled>
            Fully booked
          </button>
        )}
      </div>
    </li>
  );
}

export function Home() {
  const week = useQuery(weekQuery);
  const { hash } = useLocation();
  const events = week.data?.events ?? [];

  // Arriving on /#nights from another page: scroll once the list has rendered.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash, week.isSuccess]);

  const opens = events[0]?.opens_at; // one opening time for every night (F3)
  const firstHeadliner = earliest(events.flatMap((e) => headliners(e.lineup).map((s) => s.starts_at)));
  const lastClose = latest(events.map((e) => e.close_time));
  const cutoffs = [...new Set(events.map((e) => e.guestlist_cutoff))].sort(byNight).map(clock).join(' or ');
  const firstList = events.find((e) => e.guestlist.status === 'open')?.date; // no open night, no button

  return (
    <Site home className="home">
      <section className="hero">
        <Shards />
        <div className="heroin">
          <p className="kicker">Canggu, Bali · Thursday to Sunday</p>
          <h1 className="word head">
            <span className="ln">THE</span>
            <span className="ln">
              FANGLLE <span className="two">II</span>
            </span>
          </h1>
          <p className="lede">Named for the second fall: not the one that ends the night, the one that starts it.</p>
          <div className="ctas">
            <a className="btn solid" href="#ways-in">
              Book a table
            </a>
            <a className="btn line" href="#ways-in">
              Join the guestlist
            </a>
          </div>
        </div>
      </section>

      <section id="nights">
        <div className="wrap">
          <h2 className="h2 head">
            This <em>week</em>
          </h2>
          {opens && (
            <p className="sub">
              Doors at {clock(opens)}.{firstHeadliner && ` Headliners on from ${clock(firstHeadliner)}.`}
            </p>
          )}
          <Wait q={week} loading="Loading this week's nights..." fail="This week's nights didn't load. Check the connection, then try again.">
            {() =>
              events.length === 0 ? (
                <p className="sub">No nights on sale this week yet.</p>
              ) : (
                <ol className="nights">
                  {events.map((e) => (
                    <Night key={e.date} e={e} />
                  ))}
                </ol>
              )
            }
          </Wait>
        </div>
      </section>

      <Divider />

      <section id="ways-in">
        <div className="wrap">
          <h2 className="h2 head">
            Two ways <em>in</em>
          </h2>
          <p className="sub">Stay the night at your own table, or walk in early on the list.</p>
          <div className="doors">
            <article className="door main">
              <h3 className="head">Tables and booths</h3>
              <p>Choose your table from the floor plan. A deposit holds it, and the full deposit goes toward your minimum spend on the night.</p>
              <ul>
                <li>Minimum spend set by zone and by night</li>
                <li>Held for 15 minutes while you pay the deposit</li>
                <li>Booths seat up to 12</li>
              </ul>
              {firstOpen(events) && (
                <Link className="btn solid" to={`/book/${firstOpen(events)}`}>
                  Choose a table
                </Link>
              )}
            </article>
            <article className="door">
              <h3 className="head">Guestlist</h3>
              <p>
                {cutoffs && `Free entry before ${cutoffs}. `}Add up to ten names, then take one QR for the group or one for each person.
              </p>
              <ul>
                <li>Limited places each night</li>
                {cutoffs && <li>Valid until {cutoffs} on the night</li>}
                <li>Names checked against ID at the door</li>
              </ul>
              {firstList && (
                <Link className="btn line" to={`/guestlist/${firstList}`}>
                  Join the guestlist
                </Link>
              )}
            </article>
          </div>
        </div>
      </section>

      <Divider />

      <section id="visit">
        <div className="wrap">
          <h2 className="h2 head">
            Before you <em>come</em>
          </h2>
          <div className="info">
            <div className="cell">
              <div className="k">Age</div>
              <div className="v">21 and over</div>
              <div className="n">Valid ID, every night</div>
            </div>
            <div className="cell">
              <div className="k">Dress</div>
              <div className="v">Smart</div>
              <div className="n">No sportswear, no flip-flops</div>
            </div>
            {opens && lastClose && (
              <div className="cell">
                <div className="k">Hours</div>
                <div className="v">
                  {clock(opens)} to {clock(lastClose)}
                </div>
                <div className="n">Thursday to Sunday</div>
              </div>
            )}
            <div className="cell">
              <div className="k">Where</div>
              <div className="v">Canggu, Bali</div>
              <div className="n">Exact location sent with your booking</div>
            </div>
          </div>
        </div>
      </section>

      <section className="story">
        <div className="wrap">
          <p className="q head">Some fall once. The second time, you choose to.</p>
        </div>
      </section>
    </Site>
  );
}

const brief = (x) => {
  const t = x.tables.status;
  const g = x.guestlist.status;
  if (t === 'sold_out') return g === 'open' ? 'Tables sold out' : 'Fully booked';
  if (t === 'few') return 'Last tables';
  if (g === 'full') return 'Guestlist full';
  if (g === 'closed') return 'Guestlist closed';
  return 'Tables and guestlist open';
};

function Details({ e }) {
  const d = dayParts(e.date);
  const hls = headliners(e.lineup);
  const t = e.tables.status;
  const g = e.guestlist.status;
  const left = e.guestlist.places_left;
  return (
    <>
      <section className="hero">
        <Shards list={EVENT_SHARDS} />
        <div className="heroin">
          <p className="kicker">
            {d.weekday} {d.date} {d.month}
            {e.genre && ` · ${e.genre}`}
          </p>
          <h1 className="name head">{e.name}</h1>
          <div className="meta">
            <span>
              <span className="k">Doors</span>{' '}
              {clock(e.opens_at)}
            </span>
            {hls.length > 0 && (
              <span>
                <span className="k">{hls.length > 1 ? 'Headliners' : 'Headliner'}</span>{' '}
                {hls.map((s) => s.performer).join(' and ')} from {clock(earliest(hls.map((s) => s.starts_at)))}
              </span>
            )}
            <span>
              <span className="k">Close</span>{' '}
              {clock(e.close_time)}
            </span>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap cols">
          <div>
            <h2 className="h2 head">
              The <em>night</em>
            </h2>
            {e.blurb && <p className="lede">{e.blurb}</p>}
            <ol className="sets" aria-label="Set times">
              {e.lineup.map((s) => (
                <li key={`${s.starts_at}-${s.performer}`} className={s.role === 'headliner' ? 'hl' : ''}>
                  <span className="t">
                    {s.starts_at} to {s.ends_at}
                  </span>
                  <span>
                    <span className="dj">{s.performer}</span>
                    <span className="role">{ROLES[s.role]}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <aside className="book" aria-labelledby="book-h">
            <h3 id="book-h" className="head">
              Book {e.name}
            </h3>
            <div className="opt">
              <span className={`st ${t === 'sold_out' ? 'gone' : t === 'few' ? 'warn' : ''}`}>
                {t === 'sold_out' ? 'Tables sold out' : t === 'few' ? 'Last tables left' : 'Tables available'}
              </span>
              {t !== 'sold_out' && (
                <ul className="zones" aria-label="Minimum spend per table">
                  <li>
                    Stage front<span>{idr(e.min_spend.stage)}</span>
                  </li>
                  <li>
                    Booths<span>{idr(e.min_spend.booth)}</span>
                  </li>
                  <li>
                    Bar tables<span>{idr(e.min_spend.bar)}</span>
                  </li>
                </ul>
              )}
              {t === 'sold_out' ? (
                <button type="button" className="btn solid" disabled>
                  No tables left
                </button>
              ) : (
                <Link className="btn solid" to={`/book/${e.date}`}>
                  Choose a table
                </Link>
              )}
            </div>
            <div className="opt">
              <span className={`st ${g !== 'open' ? 'gone' : left <= 10 ? 'warn' : ''}`}>
                {g === 'full'
                  ? 'Guestlist full'
                  : g === 'closed'
                    ? `Guestlist closed at ${clock(e.guestlist_cutoff)}`
                    : `Guestlist: ${places(left)} left, free until ${clock(e.guestlist_cutoff)}`}
              </span>
              {g === 'open' ? (
                <Link className="btn line" to={`/guestlist/${e.date}`}>
                  Join the guestlist
                </Link>
              ) : (
                <button type="button" className="btn line" disabled>
                  {g === 'full' ? 'Guestlist full' : 'Guestlist closed'}
                </button>
              )}
            </div>
          </aside>
        </div>
      </section>

      <Divider />

      <section>
        <div className="wrap">
          <h2 className="h2 head">
            Good to <em>know</em>
          </h2>
          <div className="info three">
            <div className="cell">
              <div className="k">Age</div>
              <div className="v">21 and over</div>
              <div className="n">Bring ID, every night</div>
            </div>
            <div className="cell">
              <div className="k">Dress</div>
              <div className="v">Smart</div>
              <div className="n">No sportswear, no flip-flops</div>
            </div>
            <div className="cell">
              <div className="k">Guestlist</div>
              <div className="v">Until {clock(e.guestlist_cutoff)}</div>
              <div className="n">After that, entry at the door</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function EventPage() {
  const { date } = useParams();
  const ev = useQuery(eventQuery(date));
  const week = useQuery(weekQuery);

  // Braces matter: scrollTo returns a promise in current Chrome, and an effect may only return a cleanup function.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [date]);

  return (
    <Site className="ev" book={ev.data?.tables.status === 'sold_out' ? undefined : `/book/${date}`}>
      {ev.error?.status === 404 ? (
        <section>
          <div className="wrap fail" role="alert">
            <h1 className="h2 head">{ev.error.message}</h1>
            <Link className="btn line" to="/">
              Go to the home page
            </Link>
          </div>
        </section>
      ) : ev.isSuccess ? (
        <Details e={ev.data} />
      ) : (
        <section>
          <div className="wrap">
            <Wait q={ev} loading="Loading the night..." fail="This night didn't load. Check the connection, then try again.">
              {() => null}
            </Wait>
          </div>
        </section>
      )}

      <Divider />

      <section>
        <div className="wrap">
          <h2 className="h2 head">
            {ev.isSuccess ? 'Other nights' : 'Nights'} <em>this week</em>
          </h2>
          <Wait q={week} loading="Loading this week's nights..." fail="This week's nights didn't load. Check the connection, then try again.">
            {(data) => {
              const rest = data.events.filter((x) => x.date !== date);
              if (rest.length === 0) return <p className="sub">No other nights this week.</p>;
              return (
                <div className="others">
                  {rest.map((x) => (
                    <Link key={x.date} className="other" to={`/events/${x.date}`}>
                      <span className="d">{dayLabel(x.date)}</span>
                      <span className="nm">{x.name}</span>
                      <span className="s">{[who(x), x.genre].filter(Boolean).join(' · ')}</span>
                      <span className="s">{brief(x)}</span>
                    </Link>
                  ))}
                </div>
              );
            }}
          </Wait>
        </div>
      </section>
    </Site>
  );
}

// Table booking (S3), from fanglle-pilih-meja-mockup.jsx: /book/:date chooses and holds, /booking/:code pays and confirms.

const people = (n) => `${n} ${n === 1 ? 'person' : 'people'}`;
const places = (n) => `${n} ${n === 1 ? 'place' : 'places'}`;

// "Tables for up to 6", "Booths for 8 to 12": seat ranges come from the tables themselves.
function seats(zone, tables) {
  const c = tables.filter((t) => t.zone === zone).map((t) => t.capacity);
  const lo = Math.min(...c);
  const hi = Math.max(...c);
  if (zone === 'booth') return lo === hi ? `Booths for up to ${hi}` : `Booths for ${lo} to ${hi}`;
  return `${zone === 'bar' ? 'High tables' : 'Tables'} for up to ${hi}`;
}

// What the hold response knew, kept for this tab only: the status endpoint returns just status, held_until and pass_url.
const remember = (code, data) => {
  try {
    sessionStorage.setItem(code, JSON.stringify(data));
  } catch {
    // storage off: /booking/:code falls back to the version without details
  }
};
const recall = (code, k) => {
  try {
    const s = JSON.parse(sessionStorage.getItem(code));
    return s?.secret === k ? s : null;
  } catch {
    return null;
  }
};

// Re-renders every second while time is left.
function useSecondsLeft(until) {
  const [, tick] = useState(0);
  const left = until ? secondsLeft(until) : 0;
  const running = left > 0;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  return left;
}

// An error that isn't tied to an input. Focusable so "move focus to the first error" can land on it.
const Err = ({ id, children }) =>
  children ? (
    <p id={id} className="err" tabIndex={-1} data-err>
      {children}
    </p>
  ) : null;

// A 422's errors, first message per field: { name: "...", "guest_names.2": "..." }.
const fieldErrors = (err) => Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]]));

// Server errors: focus the first one on the page, input or message.
const useFirstError = (errors) =>
  useEffect(() => {
    document.querySelector('main [aria-invalid="true"], main [data-err]')?.focus();
  }, [errors]);

const Input = ({ id, label, err, ...rest }) => (
  <div className="field">
    <label htmlFor={id}>{label}</label>
    <input id={id} aria-invalid={!!err} aria-describedby={err ? `${id}-e` : undefined} {...rest} />
    {err && (
      <span id={`${id}-e`} className="err">
        {err}
      </span>
    )}
  </div>
);

const TURNSTILE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const TURNSTILE_JS = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

// F16: Cloudflare's own script, added only when this widget mounts. Remount it (new key) for a fresh token: each is single use.
function Turnstile({ onToken }) {
  const box = useRef(null);
  useEffect(() => {
    let id;
    let gone = false;
    const draw = () => {
      if (gone || id !== undefined) return;
      id = window.turnstile.render(box.current, {
        sitekey: TURNSTILE_KEY,
        theme: 'dark',
        size: box.current.clientWidth < 300 ? 'compact' : 'normal', // the normal widget is 300px wide
        callback: onToken,
        'expired-callback': () => onToken(''),
      });
    };
    let s = document.querySelector(`script[src="${TURNSTILE_JS}"]`);
    if (window.turnstile) draw();
    else {
      if (!s) {
        s = Object.assign(document.createElement('script'), { src: TURNSTILE_JS, async: true });
        document.head.append(s);
      }
      s.addEventListener('load', draw);
    }
    return () => {
      gone = true;
      s?.removeEventListener('load', draw);
      if (id !== undefined) window.turnstile.remove(id);
    };
  }, [onToken]);
  return <div ref={box} className="ts" />;
}

// The widget plus its token for one form. reset() after a failed try: the token was spent, so draw a fresh widget.
function useTurnstile() {
  const [token, setToken] = useState('');
  const [tries, setTries] = useState(0);
  return {
    body: TURNSTILE_KEY ? { turnstile_token: token } : {},
    widget: TURNSTILE_KEY ? <Turnstile key={tries} onToken={setToken} /> : null,
    reset: () => {
      if (!TURNSTILE_KEY) return;
      setToken('');
      setTries((n) => n + 1);
    },
  };
}

// Group size, 1 to max.
const Step = ({ labelledBy, value, max, disabled, onChange }) => (
  <div className="step" role="group" aria-labelledby={labelledBy}>
    <button type="button" aria-label="One fewer person" disabled={disabled || value <= 1} onClick={() => onChange(value - 1)}>
      −
    </button>
    <output aria-live="polite">{value}</output>
    <button type="button" aria-label="One more person" disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>
      +
    </button>
  </div>
);

// Night chips for this week. off(x): can't be chosen; note(x): the small line under the date.
const NightChips = ({ nights, date, onNight, off, note }) => (
  <>
    <span className="lbl" id="night-l">
      Night
    </span>
    <div className="chips" role="group" aria-labelledby="night-l">
      {nights.map((x) => (
        <button
          key={x.date}
          type="button"
          className="chip"
          aria-pressed={x.date === date}
          disabled={off(x)}
          onClick={() => x.date !== date && onNight(x.date)}
        >
          {dayLabel(x.date)}
          {note(x)}
        </button>
      ))}
    </div>
  </>
);

const Age = ({ checked, onChange, err }) => (
  <div className="field check">
    <input id="ag" type="checkbox" checked={checked} aria-invalid={!!err} aria-describedby={err ? 'ag-e' : undefined} onChange={onChange} />
    <div>
      <label htmlFor="ag">Everyone in my group is 21 or over and will bring ID</label>
      {err && (
        <div id="ag-e" className="err">
          {err}
        </div>
      )}
    </div>
  </div>
);

// Night chips, group size, the night's details, floor plan or list, and the side panel.
// locked: 'held' or 'paid' once this guest has a table; panel(tables, event) fills the side.
function Planner({ date, party, onParty, sel, onPick, onNight, locked, errors = {}, panel, panelRef }) {
  const week = useQuery(weekQuery);
  const ev = useQuery(eventQuery(date));
  const tq = useQuery(tablesQuery(date));
  const [view, setView] = useState('plan');
  const nights = week.data?.events ?? [];
  const most = tq.data ? Math.max(...tq.data.tables.map((t) => t.capacity)) : party;

  const floor = (tables, e) => {
    const state = (t) => (t.code === sel ? 'sel' : tableState(t, party));
    const choose = (t) => !locked && tableState(t, party) === 'free' && onPick(t);
    if (view === 'list')
      return (
        <ul className="list">
          {tables.map((t) => {
            const st = state(t);
            return (
              <li key={t.code}>
                <div>
                  {t.code} · {ZONES[t.zone]}
                  <div className="dim">
                    Seats {t.capacity} · {idr(e.min_spend[t.zone])}
                  </div>
                </div>
                {st === 'free' || st === 'sel' ? (
                  <button
                    type="button"
                    className={`btn slim ${st === 'sel' ? 'solid' : 'line'}`}
                    aria-pressed={st === 'sel'}
                    aria-label={`${st === 'sel' ? 'Chosen' : 'Choose'} ${t.code}`}
                    disabled={!!locked && st !== 'sel'}
                    onClick={() => choose(t)}
                  >
                    {st === 'sel' ? 'Chosen' : 'Choose'}
                  </button>
                ) : (
                  <span className="dim">{st === 'booked' ? 'Booked' : st === 'held' ? 'Held' : `Too small for ${party}`}</span>
                )}
              </li>
            );
          })}
        </ul>
      );
    return (
      <>
        <div className="scroller">
          <div className="plan">
            <svg viewBox="0 0 1000 620" aria-hidden="true">
              <rect x="380" y="22" width="240" height="60" />
              <text x="500" y="58" className="big">
                DJ booth
              </text>
              <rect className="floor" x="270" y="105" width="460" height="265" />
              <text x="500" y="245" className="df">
                DANCE FLOOR
              </text>
              <rect x="250" y="545" width="500" height="46" />
              <text x="500" y="575" className="big">
                Bar
              </text>
              <text x="72" y="72">
                Booths
              </text>
              <text x="928" y="72">
                Booths
              </text>
              <text x="500" y="418">
                Bar tables
              </text>
              <text x="60" y="600" className="start">
                Entrance
              </text>
            </svg>
            {tables.map((t) => {
              const st = state(t);
              const label =
                st === 'booked'
                  ? `${t.code}, booked`
                  : st === 'held'
                    ? `${t.code}, held by another guest`
                    : st === 'small'
                      ? `${t.code}, seats ${t.capacity}, too small for ${party}`
                      : `${t.code}, ${ZONES[t.zone]}, seats ${t.capacity}, minimum spend ${idr(e.min_spend[t.zone])}`;
              return (
                <button
                  key={t.code}
                  type="button"
                  className={`tb ${t.shape} ${st}`}
                  style={{ left: `${t.x / 10}%`, top: `${t.y / 6.2}%` }}
                  aria-label={label}
                  aria-pressed={st === 'sel'}
                  aria-disabled={(st !== 'free' && st !== 'sel') || locked ? 'true' : undefined}
                  onClick={() => choose(t)}
                >
                  {t.code}
                  <small>{st === 'booked' ? 'Booked' : st === 'held' ? 'Held' : `Seats ${t.capacity}`}</small>
                </button>
              );
            })}
          </div>
        </div>
        <div className="legend" aria-hidden="true">
          <span>
            <i className="sw" />
            Available
          </span>
          <span>
            <i className="sw sel" />
            Your choice
          </span>
          <span>
            <i className="sw held" />
            Held by another guest
          </span>
          <span>
            <i className="sw booked" />
            Booked or too small
          </span>
        </div>
      </>
    );
  };

  const night = (e, tables) => {
    const next = nights.find((x) => x.date !== date && x.tables.status !== 'sold_out');
    if (!sel && tables.every((t) => t.status !== 'free'))
      return (
        <div className="soldout">
          <h2 className="head">{e.name} is fully booked</h2>
          <p>
            Every table for {dayLabel(e.date)} is taken{e.guestlist.status === 'full' && ', and the guestlist is full too'}. Try another
            night.
          </p>
          {next && (
            <Link className="btn line" to={`/book/${next.date}`} state={{ party }}>
              See {dayParts(next.date).weekday}, {next.name}
            </Link>
          )}
        </div>
      );
    return (
      <div className="grid">
        <div>
          <div className="viewtoggle">
            <p>{locked === 'held' ? 'Release your table to choose a different one.' : 'Stage at the top, bar at the bottom.'}</p>
            <button type="button" className="btn line slim" onClick={() => setView(view === 'plan' ? 'list' : 'plan')}>
              {view === 'plan' ? 'Show as a list' : 'Show the floor plan'}
            </button>
          </div>
          {floor(tables, e)}
        </div>
        <aside className="panel" ref={panelRef} tabIndex={-1} aria-live="polite">
          {panel(tables, e)}
        </aside>
      </div>
    );
  };

  return (
    <div className="wrap bkin">
      <h1 className="h1 head">
        Choose your <em>table</em>
      </h1>
      <p className="sub">Pick the night and your group size, then choose a table on the floor plan.</p>

      <div className="bar">
        <div>
          <NightChips
            nights={nights}
            date={date}
            onNight={onNight}
            off={() => !!locked}
            note={(x) => <small>{x.tables.status === 'sold_out' ? 'Sold out' : x.name}</small>}
          />
          <Err id="date-e">{errors.date}</Err>
        </div>
        <div>
          <span className="lbl" id="party-l">
            Group size
          </span>
          <Step labelledBy="party-l" value={party} max={most} disabled={!!locked} onChange={onParty} />
          <Err id="party-e">{errors.party_size}</Err>
        </div>
      </div>

      {ev.error?.status === 404 ? (
        <div className="fail" role="alert">
          <p>{ev.error.message}</p>
          <Link className="btn line" to="/">
            Go to the home page
          </Link>
        </div>
      ) : (
        <Wait q={ev} loading="Loading the night..." fail="This night didn't load. Check the connection, then try again.">
          {(e) => {
            const rest = others(e.lineup);
            return (
              <>
                <section className="evinfo" aria-live="polite" aria-label="About the selected night">
                  <div>
                    <div className="evname head">{e.name}</div>
                    <div className="evmeta">{[dayLabel(e.date), e.genre].filter(Boolean).join(' · ')}</div>
                  </div>
                  <div>
                    <span className="evhead">{who(e)}</span>
                    {rest.length > 0 && <span className="evwith">with {rest.join(', ')}</span>}
                  </div>
                  <Link className="btn line slim evlink" to={`/events/${e.date}`}>
                    See the full night
                  </Link>
                </section>
                <Wait q={tq} loading="Loading the floor plan..." fail="The floor plan didn't load. Check the connection, then try again.">
                  {(d) => night(e, d.tables)}
                </Wait>
              </>
            );
          }}
        </Wait>
      )}
    </div>
  );
}

const blank = { name: '', phone: '', email: '', age: false };

export function Book() {
  const { date } = useParams();
  const { state } = useLocation(); // { party, sel } when sent back from a released booking
  const navigate = useNavigate();
  const qc = useQueryClient();
  const tq = useQuery(tablesQuery(date));
  const [party, setParty] = useState(state?.party ?? 4);
  const [pick, setPick] = useState(state?.sel ? { date, code: state.sel } : null);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [busy, setBusy] = useState(false);
  const ts = useTurnstile();
  const panelRef = useRef(null);

  // The choice only counts while that table is still free for this group, on this night.
  const t = pick?.date === date ? tq.data?.tables.find((x) => x.code === pick.code && tableState(x, party) === 'free') : undefined;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [date]);

  useFirstError(errors);

  const onPick = (x) => {
    setPick({ date, code: x.code });
    setAlert(null);
    setErrors({});
    setTimeout(() => panelRef.current?.focus(), 0);
  };
  const onNight = (d) => {
    setAlert(null);
    setErrors({});
    navigate(`/book/${d}`);
  };
  const set = (k) => (ev) => setForm({ ...form, [k]: ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value });

  async function hold(ev) {
    ev.preventDefault();
    setBusy(true);
    setAlert(null);
    try {
      const r = await api('/api/table-bookings', {
        method: 'POST',
        guest: true,
        body: {
          date,
          table_code: t.code,
          party_size: party,
          name: form.name,
          phone: form.phone,
          email: form.email,
          age_confirmed: form.age,
          ...ts.body,
        },
      });
      remember(r.code, { secret: r.secret, payment_url: r.payment_url, date, table: t.code, party, deposit: r.deposit, min_spend: r.min_spend });
      navigate(`/booking/${r.code}?k=${encodeURIComponent(r.secret)}`, { replace: true });
    } catch (err) {
      setBusy(false);
      ts.reset();
      if (err.status === 422) {
        setErrors(fieldErrors(err));
      } else if (err.status === 409) {
        // Someone else got it first: fresh plan, same details, choose again.
        setErrors({});
        setPick(null);
        setAlert(err.message);
        qc.invalidateQueries({ queryKey: ['tables', date] });
        panelRef.current?.focus();
      } else {
        setErrors({});
        setAlert(errorText(err));
      }
    }
  }

  const alertBox = alert && (
    <p className="alert" role="alert">
      {alert}
    </p>
  );

  const panel = (tables, e) => {
    if (!t)
      return (
        <>
          {alertBox}
          <div className="lbl">Minimum spend on {e.name}</div>
          <ul className="zones">
            {Object.entries(ZONES)
              .filter(([k]) => tables.some((x) => x.zone === k))
              .map(([k, name]) => (
                <li key={k}>
                  <div>
                    {name}
                    <br />
                    <span>{seats(k, tables)}</span>
                  </div>
                  <div>{idr(e.min_spend[k])}</div>
                </li>
              ))}
          </ul>
          <p className="hint">Choose a table on the plan. Tables too small for {people(party)} are dimmed.</p>
        </>
      );
    const min = e.min_spend[t.zone];
    return (
      <form onSubmit={hold} noValidate>
        <div className="lbl">Your table</div>
        <h2 className="head">
          {t.code} · {ZONES[t.zone]}
        </h2>
        <Err id="table-e">{errors.table_code}</Err>
        <dl className="facts">
          <dt>Seats</dt>
          <dd>Up to {t.capacity}</dd>
          <dt>Minimum spend</dt>
          <dd>{idr(min)}</dd>
          <dt>Deposit to hold it</dt>
          <dd className="big">{idr(Math.floor(min / 2))}</dd>
        </dl>
        <Input id="nm" label="Name for the booking" type="text" autoComplete="name" value={form.name} onChange={set('name')} err={errors.name} />
        <Input
          id="ph"
          label="Phone number"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="+62 812 3456 7890"
          value={form.phone}
          onChange={set('phone')}
          err={errors.phone}
        />
        <Input id="em" label="Email, for your QR" type="email" autoComplete="email" value={form.email} onChange={set('email')} err={errors.email} />
        <Age checked={form.age} onChange={set('age')} err={errors.age_confirmed} />
        {ts.widget}
        <Err id="ts-e">{errors.turnstile_token}</Err>
        {alertBox}
        <button type="submit" className="btn solid" disabled={busy}>
          {busy ? 'Holding your table...' : 'Hold this table for 15 minutes'}
        </button>
        <p className="hint">Holding is free. You pay the deposit on the next step. Deposits aren't refunded for cancellations or no-shows.</p>
      </form>
    );
  };

  return (
    <Site flow className="bk">
      <Planner
        date={date}
        party={party}
        onParty={setParty}
        sel={t?.code}
        onPick={onPick}
        onNight={onNight}
        errors={errors}
        panel={panel}
        panelRef={panelRef}
      />
    </Site>
  );
}

// Where Xendit sends the guest back, paid or not. Polls every 3 seconds while the table is held.
export function Booking() {
  const { code } = useParams();
  const k = useSearchParams()[0].get('k') ?? '';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const week = useQuery(weekQuery);
  const q = useQuery({
    queryKey: ['booking', code, k],
    queryFn: () => api(`/api/table-bookings/${encodeURIComponent(code)}?k=${encodeURIComponent(k)}`),
    refetchInterval: (query) => (query.state.data?.status === 'held' ? 3000 : false),
  });
  const s = recall(code, k); // null on another device or tab: no table, night or amounts to show then
  const left = useSecondsLeft(q.data?.held_until);
  const [party, setParty] = useState(s?.party ?? 1);
  const [releasing, setReleasing] = useState(false);
  const [alert, setAlert] = useState(null);
  const focusPanel = useRef((node) => node?.focus()).current; // once, when the panel first appears

  const status = q.data?.status;
  const over = status === 'released' || (status === 'held' && left === 0);
  const again = s?.date ?? firstOpen(week.data?.events);

  async function release() {
    setReleasing(true);
    setAlert(null);
    try {
      await api(`/api/table-bookings/${encodeURIComponent(code)}/release?k=${encodeURIComponent(k)}`, { method: 'POST', guest: true });
      qc.removeQueries({ queryKey: ['tables', s.date] });
      navigate(`/book/${s.date}`, { replace: true, state: { party: s.party } });
    } catch (err) {
      setReleasing(false);
      setAlert(errorText(err));
      if (err.status === 409) q.refetch(); // already paid: the page moves on to confirmed
    }
  }

  const panel = (tables = [], e = null) => {
    const t = s && tables.find((x) => x.code === s.table);
    if (status === 'paid')
      return (
        <>
          <div className="lbl">Booking confirmed</div>
          <h2 className="head">
            You're <span className="two">in</span>
          </h2>
          <dl className="facts">
            <dt>Booking code</dt>
            <dd className="code">{code}</dd>
            {e && (
              <>
                <dt>Night</dt>
                <dd>
                  {e.name}, {dayLabel(e.date)}
                </dd>
              </>
            )}
            {t && (
              <>
                <dt>Table</dt>
                <dd>
                  {t.code}, {ZONES[t.zone]}
                </dd>
              </>
            )}
            {s && (
              <>
                <dt>Deposit paid</dt>
                <dd>{idr(s.deposit)}</dd>
                <dt>Still to spend at the club</dt>
                <dd className="big">{idr(s.min_spend - s.deposit)}</dd>
              </>
            )}
          </dl>
          <p className="hint">We emailed your QR. Show it at the door with your ID.</p>
          {q.data.pass_url && (
            <Link className="btn solid" to={q.data.pass_url}>
              View your QR
            </Link>
          )}
        </>
      );
    if (status === 'no_show')
      return (
        <>
          <div className="lbl">Booking code</div>
          <h2 className="head code">{code}</h2>
          <p className="hint">This booking was marked as a no-show. Deposits aren't refunded.</p>
          <Link className="btn line" to="/">
            Go to the home page
          </Link>
        </>
      );
    if (over)
      return (
        <>
          <div className="lbl">{left === 0 ? 'Hold expired' : 'Table released'}</div>
          <h2 className="head">{s ? `${s.table} was released` : 'Your table was released'}</h2>
          <p className="hint">
            {left === 0
              ? "The deposit wasn't paid within 15 minutes, so the table is open to other guests again. Nothing was charged."
              : 'The table is open to other guests again. Nothing was charged.'}
          </p>
          {again ? (
            <Link className="btn solid" to={`/book/${again}`} state={{ party }}>
              Choose a table again
            </Link>
          ) : (
            <Link className="btn solid" to="/">
              Go to the home page
            </Link>
          )}
        </>
      );
    if (!s)
      return (
        <>
          <div className="lbl">Table held for you</div>
          <h2 className="head code">{code}</h2>
          <div className="timer" role="timer" aria-live="off">
            <span>Held for</span>
            <strong>{mmss(left)}</strong>
          </div>
          <p className="hint">We're waiting for the payment to be confirmed. This page updates on its own, no need to reload.</p>
        </>
      );
    return (
      <>
        <div className="lbl">Table held for you</div>
        <h2 className="head">{t ? `${t.code} · ${ZONES[t.zone]}` : s.table}</h2>
        <div className="timer" role="timer" aria-live="off">
          <span>Pay the deposit within</span>
          <strong>{mmss(left)}</strong>
        </div>
        {alert && (
          <p className="alert" role="alert">
            {alert}
          </p>
        )}
        <dl className="facts">
          <dt>Minimum spend</dt>
          <dd>{idr(s.min_spend)}</dd>
          <dt>Deposit now</dt>
          <dd className="big">{idr(s.deposit)}</dd>
        </dl>
        <p className="hint">
          The full deposit goes toward your minimum spend. It isn't refunded if you cancel or don't come. Test mode through Xendit: no real money
          moves.
        </p>
        <div className="row">
          <a className="btn solid" href={s.payment_url}>
            Pay {idr(s.deposit)}
          </a>
          <button type="button" className="btn line" onClick={release} disabled={releasing}>
            Release table
          </button>
        </div>
      </>
    );
  };

  if (q.isSuccess && s)
    return (
      <Site flow className="bk">
        <Planner
          date={s.date}
          party={party}
          onParty={setParty}
          sel={s.table}
          locked={over ? false : status === 'held' ? 'held' : 'paid'}
          onPick={(t) => navigate(`/book/${s.date}`, { state: { party, sel: t.code } })}
          onNight={(d) => navigate(`/book/${d}`, { state: { party } })}
          panel={panel}
          panelRef={focusPanel}
        />
      </Site>
    );

  return (
    <Site flow className="bk">
      <div className="wrap bkin alone">
        {q.error?.status === 404 ? (
          <div className="fail" role="alert">
            <p>{q.error.message}</p>
            <Link className="btn line" to="/">
              Go to the home page
            </Link>
          </div>
        ) : q.isSuccess ? (
          <div className="panel" ref={focusPanel} tabIndex={-1} aria-live="polite">
            {panel()}
          </div>
        ) : (
          <Wait q={q} loading="Loading your booking..." fail="Your booking didn't load. Check the connection, then try again.">
            {() => null}
          </Wait>
        )}
      </div>
    </Site>
  );
}

// Guestlist (S4), from fanglle-guestlist-mockup.jsx: one sign-up for 1 to 10 people, one QR for the group or one each.

const MODES = [
  ['group', 'One QR for the group', 'Only your name is needed. The door counts people in as they arrive.'],
  ['personal', 'One QR per person', 'Friends can arrive on their own. Each QR carries one name.'],
];
const blankList = { ...blank, guests: Array(9).fill('') };
const listState = (g) => (g.status === 'full' ? 'Guestlist full' : g.status === 'closed' ? 'Guestlist closed' : `${places(g.places_left)} left`);

export function Guestlist() {
  const { date } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const week = useQuery(weekQuery);
  // The week list carries every field this page reads, so a newly chosen night shows at once, then refreshes.
  const ev = useQuery({ ...eventQuery(date), placeholderData: () => week.data?.events.find((x) => x.date === date) });
  const [party, setParty] = useState(4);
  const [mode, setMode] = useState('group');
  const [form, setForm] = useState(blankList);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // { e, party, mode, name, phone, email, passes }; no passes: the number was already in (409)
  const [sent, setSent] = useState(null); // resend answer: { ok, text }
  const ts = useTurnstile();
  const resultRef = useRef(null);
  const nights = week.data?.events ?? [];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [date]);
  useFirstError(errors);
  useEffect(() => {
    if (done) resultRef.current?.focus();
  }, [done]);

  const set = (k) => (x) => setForm({ ...form, [k]: x.target.type === 'checkbox' ? x.target.checked : x.target.value });
  const setGuest = (i) => (x) => setForm({ ...form, guests: form.guests.map((v, j) => (j === i ? x.target.value : v)) });
  const onNight = (d) => {
    setErrors({});
    setAlert(null);
    navigate(`/guestlist/${d}`);
  };
  const onParty = (n) => {
    setParty(n);
    if (errors.party_size) setErrors(({ party_size, ...rest }) => rest); // the server's answer was for the old size
  };
  const restart = () => {
    setDone(null);
    setSent(null);
    setForm(blankList);
    setErrors({});
  };

  async function submit(x) {
    x.preventDefault();
    const e = ev.data;
    setBusy(true);
    setAlert(null);
    try {
      const r = await api('/api/guestlist', {
        method: 'POST',
        guest: true,
        body: {
          date,
          party_size: party,
          qr_mode: mode,
          name: form.name,
          phone: form.phone,
          email: form.email,
          guest_names: guestNames(mode, party, form.guests),
          age_confirmed: form.age,
          ...ts.body,
        },
      });
      setErrors({});
      setDone({ e, party, mode, name: form.name, email: form.email, passes: r.passes });
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event', date] });
    } catch (err) {
      const f = err.status === 422 ? fieldErrors(err) : {};
      setErrors(f);
      if (err.status === 409) setDone({ e, phone: form.phone });
      else if (err.status !== 422) setAlert(errorText(err));
      // Not enough places: the 422 says how many are left. Show that number everywhere now, not after a refetch.
      const n = err.body?.places_left;
      if (n !== undefined) {
        const patch = (y) => (y.date === date ? { ...y, guestlist: { status: n ? 'open' : 'full', places_left: n } } : y);
        qc.setQueryData(['event', date], (old) => old && patch(old));
        qc.setQueryData(['events'], (old) => old && { ...old, events: old.events.map(patch) });
      }
      if (f.date) {
        qc.invalidateQueries({ queryKey: ['events'] });
        qc.invalidateQueries({ queryKey: ['event', date] });
      }
    }
    setBusy(false);
    ts.reset(); // each token is single use, sent or not
  }

  async function resend() {
    setBusy(true);
    setSent(null);
    try {
      const r = await api('/api/guestlist/resend', { method: 'POST', guest: true, body: { date: done.e.date, phone: done.phone, ...ts.body } });
      setSent({ ok: true, text: r.message });
    } catch (err) {
      setSent({ ok: false, text: errorText(err) });
    }
    setBusy(false);
    ts.reset();
  }

  const signedUp = (r) => (
    <div className="result" ref={resultRef} tabIndex={-1} aria-live="polite">
      <div className="lbl">Signed up</div>
      <h2 className="head">
        You're on the <span className="two">list</span>
      </h2>
      <p className="sub">
        {people(r.party)} for {r.e.name}, {dayLabel(r.e.date)}. Free entry until {clock(r.e.guestlist_cutoff)}. We emailed your QR to {r.email}.
        It's also on this page.
      </p>
      {r.mode === 'group' || r.passes.length === 1 ? (
        <div className="card">
          <div>
            <div className="one">One QR for {people(r.party)}</div>
            <div className="hint">
              Organiser: {r.name}.{r.party > 1 && ' Guests can come in separately; the door counts who has arrived.'}
            </div>
          </div>
          <div className="row">
            <Link className="btn solid" to={r.passes[0].pass_url}>
              View your QR
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="hint lead">Send each guest their own QR. It opens WhatsApp from your phone with the link ready.</p>
          <ul className="qrlist">
            {r.passes.map((p, i) => (
              <li key={p.pass_url}>
                <div className="holder">
                  {p.holder_name}
                  <small>{i === 0 ? 'Your QR' : `Guest ${i + 1}`}</small>
                </div>
                <div className="row">
                  <Link className="btn line slim" to={p.pass_url} aria-label={`View ${p.holder_name}'s QR`}>
                    View
                  </Link>
                  {i > 0 && (
                    <a
                      className="btn line slim"
                      href={waShare(p.holder_name, r.e, window.location.origin + p.pass_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Share on WhatsApp, for ${p.holder_name}`}
                    >
                      Share on WhatsApp
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="row again">
        <button type="button" className="btn line" onClick={restart}>
          Sign up for another night
        </button>
      </div>
    </div>
  );

  const alreadyIn = (r) => (
    <div className="result" ref={resultRef} tabIndex={-1} role="alert">
      <div className="lbl">Already on the list</div>
      <h2 className="head">
        This number is already <span className="two">in</span>
      </h2>
      <p className="sub">
        {r.phone} already has a guestlist spot for {r.e.name}. Each number can sign up once per night. Your QR is in the email we sent earlier.
      </p>
      {ts.widget}
      <div role="status">{sent?.ok && <p className="sub">{sent.text}</p>}</div>
      {sent && !sent.ok && (
        <p className="alert" role="alert">
          {sent.text}
        </p>
      )}
      <div className="row again">
        <button type="button" className="btn solid" disabled={busy} onClick={resend}>
          Send my QR again
        </button>
        <button
          type="button"
          className="btn line"
          onClick={() => {
            setDone(null);
            setSent(null);
          }}
        >
          Choose another night
        </button>
      </div>
    </div>
  );

  const signUp = (e) => {
    const g = e.guestlist;
    const open = g.status === 'open';
    const cutoff = clock(e.guestlist_cutoff);
    const hls = headliners(e.lineup);
    const rest = others(e.lineup);
    // One note per problem: the server's sentence when there is one, else what the night's data says.
    const nightNote =
      errors.date ??
      (errors.party_size
        ? null
        : g.status === 'full'
          ? `The guestlist for ${e.name} is full. Choose another night.`
          : g.status === 'closed'
            ? `The guestlist for ${e.name} closed at ${cutoff}. Choose another night.`
            : null);
    const partyNote =
      errors.party_size ??
      (open && party > g.places_left ? `Only ${places(g.places_left)} left on ${e.name}. Make your group smaller, or choose another night.` : null);
    return (
      <div className="grid">
        <form onSubmit={submit} noValidate>
          <div className="block">
            <NightChips
              nights={nights}
              date={date}
              onNight={onNight}
              off={(x) => x.guestlist.status !== 'open'}
              note={(x) => (
                <small className={x.guestlist.status === 'open' && x.guestlist.places_left <= 10 ? 'low' : undefined}>
                  {listState(x.guestlist)}
                </small>
              )}
            />
            {nightNote && (
              <p id="date-e" className="alert note" role="status" tabIndex={-1} data-err={errors.date ? '' : undefined}>
                {nightNote}
              </p>
            )}
          </div>

          <div className="block">
            <span className="lbl" id="party-l">
              How many people, including you
            </span>
            <Step labelledBy="party-l" value={party} max={10} onChange={onParty} />
            {partyNote && (
              <p id="party-e" className="alert note" role="status" tabIndex={-1} data-err={errors.party_size ? '' : undefined}>
                {partyNote}
              </p>
            )}
          </div>

          {party > 1 && (
            <div className="block">
              <fieldset>
                <legend className="lbl">How do you want your QR</legend>
                <div className="modes">
                  {MODES.map(([k, title, text]) => (
                    <label key={k} className={`mode${mode === k ? ' on' : ''}`}>
                      <input type="radio" name="qr" checked={mode === k} onChange={() => setMode(k)} />
                      <span>
                        <strong>{title}</strong>
                        <span>{text}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <Err id="qr-e">{errors.qr_mode}</Err>
              </fieldset>
            </div>
          )}

          <div className="block">
            <span className="lbl">Your details</span>
            <div className="fields">
              <Input id="gn" label="Full name, as on your ID" type="text" autoComplete="name" value={form.name} onChange={set('name')} err={errors.name} />
              <Input
                id="gp"
                label="Phone number"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+62 812 3456 7890"
                value={form.phone}
                onChange={set('phone')}
                err={errors.phone}
              />
              <Input id="ge" label="Email, for your QR" type="email" autoComplete="email" value={form.email} onChange={set('email')} err={errors.email} />
            </div>
          </div>

          {party > 1 && mode === 'personal' && (
            <div className="block">
              <span className="lbl">Guest names</span>
              <p className="hint lead">Required: each QR carries the name that will be checked against ID.</p>
              <div className="fields">
                {Array.from({ length: party - 1 }, (_, i) => (
                  <Input
                    key={i}
                    id={`g-${i}`}
                    label={`Guest ${i + 2} name`}
                    type="text"
                    value={form.guests[i]}
                    onChange={setGuest(i)}
                    err={errors[`guest_names.${i}`]}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="block">
            <Age checked={form.age} onChange={set('age')} err={errors.age_confirmed} />
          </div>

          <div className="submit">
            {ts.widget}
            <Err id="ts-e">{errors.turnstile_token}</Err>
            {alert && (
              <p className="alert" role="alert">
                {alert}
              </p>
            )}
            <button type="submit" className="btn solid" disabled={busy || !open || party > g.places_left}>
              {busy ? 'Adding you to the list...' : `Add ${people(party)} to the list`}
            </button>
            <p className="hint">No account needed. Your QR shows on the next screen and arrives by email.</p>
          </div>
        </form>

        <aside className="panel" aria-labelledby="night-h">
          <div className="lbl">Your night</div>
          <h2 id="night-h" className="head" aria-live="polite">
            {e.name}
          </h2>
          <dl className="facts">
            <dt>Date</dt>
            <dd>{dayLabel(e.date)}</dd>
            {hls.length > 0 && (
              <>
                <dt>{hls.length > 1 ? 'Headliners' : 'Headliner'}</dt>
                <dd>{who(e)}</dd>
              </>
            )}
            {rest.length > 0 && (
              <>
                <dt>With</dt>
                <dd>{rest.join(', ')}</dd>
              </>
            )}
            {e.genre && (
              <>
                <dt>Sound</dt>
                <dd>{e.genre}</dd>
              </>
            )}
            <dt>Free entry</dt>
            <dd>Until {cutoff}</dd>
            <dt>Places left</dt>
            <dd>{g.status === 'closed' ? 'Closed' : g.places_left || 'None'}</dd>
          </dl>
          <ul className="rules">
            <li>Arrive before {cutoff}. After that, the list closes.</li>
            <li>Bring ID. Names are checked at the door.</li>
            <li>One sign-up per phone number each night.</li>
          </ul>
        </aside>
      </div>
    );
  };

  const e = ev.data;
  return (
    <Site flow className="bk gl">
      <div className="wrap bkin">
        <h1 className="h1 head">
          Join the <em>guestlist</em>
        </h1>
        <p className="sub">
          {e && `Free entry before ${clock(e.guestlist_cutoff)}. `}One sign-up covers up to ten people.
        </p>
        {done?.passes ? (
          signedUp(done)
        ) : done ? (
          alreadyIn(done)
        ) : ev.error?.status === 404 ? (
          <div className="fail" role="alert">
            <p>{ev.error.message}</p>
            <Link className="btn line" to="/">
              Go to the home page
            </Link>
          </div>
        ) : (
          <Wait q={ev} loading="Loading the night..." fail="This night didn't load. Check the connection, then try again.">
            {signUp}
          </Wait>
        )}
      </div>
    </Site>
  );
}

// About (S9), from fanglle-event-gallery-about-mockup.jsx. Every hour on it comes from this week's first night (F3).
export function About() {
  const week = useQuery(weekQuery);
  const next = week.data?.events[0];

  return (
    <Site className="about">
      <section className="hero">
        <Shards list={EVENT_SHARDS} />
        <div className="heroin">
          <p className="kicker">Canggu, Bali · Thursday to Sunday</p>
          <h1 className="name head">About</h1>
        </div>
      </section>

      <section>
        <div className="wrap prose">
          <h2 className="h2 head">
            Why the <em>second fall</em>
          </h2>
          <p>
            Everyone knows the first fall. It happens to you. The second one you choose: you walk in, the doors close behind you, and the
            night takes over from there.
          </p>
          <p>
            The Fanglle II is built around that choice. One room, one sound system, four nights a week, and a door that opens
            {next ? ` at ${clock(next.opens_at)}` : ' every night'} whether the street outside is ready or not.
          </p>
        </div>
      </section>

      <Divider />

      <section>
        <div className="wrap">
          <h2 className="h2 head">
            How a night <em>runs</em>
          </h2>
          <Wait q={week} loading="Loading this week's nights..." fail="The hours didn't load. Check the connection, then try again.">
            {() =>
              next ? (
                <>
                  <p className="sub">
                    <Link to={`/events/${next.date}`}>
                      {next.name}, {dayLabel(next.date)}
                    </Link>
                    . Hours can change from night to night; each night's page has its own.
                  </p>
                  <ol className="run">
                    {nightRun(next).map((step) => (
                      <li key={step.at + step.text} className={step.key ? 'key' : undefined}>
                        <b className="head">{clock(step.at)}</b>
                        <span>{step.text}</span>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <p className="sub">No nights on the calendar this week yet.</p>
              )
            }
          </Wait>
        </div>
      </section>

      <Divider />

      <section>
        <div className="wrap">
          <h2 className="h2 head">
            House <em>rules</em>
          </h2>
          <ul className="house">
            <li>
              <b>21 and over</b>
              <span>Valid ID for everyone, every night. No exceptions for tables.</span>
            </li>
            <li>
              <b>Smart dress</b>
              <span>No sportswear, no flip-flops, no swimwear.</span>
            </li>
            <li>
              <b>One QR, one entry</b>
              <span>Each QR works once. Screenshots shared with friends won't get them in.</span>
            </li>
            <li>
              <b>Tables have a minimum spend</b>
              <span>Your deposit counts toward it. The rest is spent on the night.</span>
            </li>
          </ul>
        </div>
      </section>

      <Divider />

      <section>
        <div className="wrap prose">
          <h2 className="h2 head">
            Private <em>events</em>
          </h2>
          <p>The room can be booked for private nights from Monday to Wednesday. Tell us the date, the number of guests, and what you have in mind.</p>
          <div className="contact">
            <a className="btn line" href="mailto:events@thefanglle.example">
              events@thefanglle.example
            </a>
          </div>
        </div>
      </section>
    </Site>
  );
}

// Gallery (S9): PRD 2.1, F9.1. No photos yet: each frame is the brief for the real photo, its shape and its alt text,
// labelled as a placeholder so it is never mistaken for the real thing. Replace a frame and the layout stays.
const SHOTS = [
  { cat: 'room', ratio: '16 / 9', shot: 'Main room from the DJ booth, full crowd, lights low', alt: 'The main room seen from the DJ booth, packed dance floor under low violet light' },
  { cat: 'night', ratio: '3 / 4', shot: 'Ilse Varga behind the decks at Descent', alt: 'Ilse Varga playing at Descent, lit from behind' },
  { cat: 'room', ratio: '3 / 2', shot: 'Dance floor from above, laser lines across the room', alt: 'Dance floor from above with laser lines crossing the room' },
  { cat: 'tables', ratio: '3 / 2', shot: 'Booth set for ten, before doors open', alt: 'An empty booth laid out for ten guests before opening' },
  { cat: 'night', ratio: '3 / 2', shot: 'Hands up at midnight, Second Wave', alt: 'Crowd with hands raised as the headliner starts at Second Wave' },
  { cat: 'detail', ratio: '3 / 4', shot: 'Faceted glass above the bar, close up', alt: 'Close up of the faceted glass installation above the bar' },
  { cat: 'tables', ratio: '3 / 4', shot: 'Bottle service arriving at a booth', alt: 'Staff carrying bottle service to a booth' },
  { cat: 'room', ratio: '3 / 2', shot: 'The bar at 1 am, bartenders mid-pour', alt: 'Bartenders pouring drinks at the bar late at night' },
  { cat: 'night', ratio: '3 / 4', shot: 'Nadia Sorrel, close up, Fall Line', alt: 'Nadia Sorrel at the decks during Fall Line' },
  { cat: 'detail', ratio: '3 / 2', shot: 'Entrance at 10 pm, door staff scanning a QR', alt: "Door staff scanning a guest's QR at the entrance" },
  { cat: 'tables', ratio: '3 / 2', shot: 'Stage front tables, looking toward the DJ', alt: 'Stage front tables with a clear view of the DJ booth' },
  { cat: 'night', ratio: '3 / 2', shot: 'Afterglow, softer Sunday light at the bar', alt: 'A quieter Sunday night at the bar during Afterglow' },
];
const CATS = [['all', 'All'], ['room', 'The room'], ['night', 'Nights'], ['tables', 'Tables and booths'], ['detail', 'Details']];
const shape = (s) => s.ratio.replace(' / ', ':');

export function Gallery() {
  const [cat, setCat] = useState('all');
  const [view, setView] = useState(null);
  const shots = SHOTS.filter((s) => cat === 'all' || s.cat === cat);
  const v = view !== null && shots[view];

  return (
    <Site className="gal">
      <section className="hero">
        <Shards list={EVENT_SHARDS} />
        <div className="heroin">
          <p className="kicker">The room, the nights, the details</p>
          <h1 className="name head">Gallery</h1>
        </div>
      </section>
      <section>
        <div className="wrap">
          <div className="chips" role="group" aria-label="Show photos of">
            {CATS.map(([k, l]) => (
              <button
                key={k}
                type="button"
                className="chip"
                aria-pressed={cat === k}
                onClick={() => {
                  setCat(k);
                  setView(null);
                }}
              >
                {l}
                <em>{k === 'all' ? SHOTS.length : SHOTS.filter((s) => s.cat === k).length}</em>
              </button>
            ))}
          </div>
          <div className="masonry">
            {shots.map((s, i) => (
              <button
                key={s.shot}
                type="button"
                className="slot"
                style={{ aspectRatio: s.ratio }}
                onClick={() => setView(i)}
                aria-label={`Photo to come: ${s.shot}. Open details.`}
              >
                <span className="in">
                  <span className="tag">Photo to come</span>
                  <span className="shot">{s.shot}</span>
                  <span className="spec">
                    {shape(s)} · {CATS.find((c) => c[0] === s.cat)[1]}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <p className="brief">
            Every frame above is a brief for the real photo: what to shoot, the shape it needs, and the alt text it ships with. Replace a
            frame and the layout stays the same.
          </p>
        </div>
      </section>
      {v && (
        <Dialog open onClose={() => setView(null)} className="viewer" aria-labelledby="vw-t">
          <div className="vframe">
            <p id="vw-t" className="shot head">
              {v.shot}
            </p>
          </div>
          <dl className="vmeta">
            <dt>Status</dt>
            <dd>Photo to come</dd>
            <dt>Shape</dt>
            <dd>{shape(v)}</dd>
            <dt>Alt text</dt>
            <dd>{v.alt}</dd>
          </dl>
          <div className="vbar">
            <button type="button" className="btn line" onClick={() => setView((view - 1 + shots.length) % shots.length)} aria-label="Previous photo">
              Previous
            </button>
            <span className="vcount" aria-live="polite">
              {view + 1} of {shots.length}
            </span>
            <button type="button" className="btn line" onClick={() => setView((view + 1) % shots.length)} aria-label="Next photo">
              Next
            </button>
            <button type="button" className="btn solid" onClick={() => setView(null)}>
              Close
            </button>
          </div>
        </Dialog>
      )}
    </Site>
  );
}
