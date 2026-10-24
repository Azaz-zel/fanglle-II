import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { api, errorText, weekQuery } from './api.js';
import {
  clock, dayLabel, dayParts, earliest, gelOf, guestNames, headliners, idr, laneOf, mmss, nightMinutes, others, ROLES, secondsLeft,
  tableState, ZONES,
} from './night.js';
import { Dialog, Mark } from './ui.jsx';
import { Dot, Lit, Room, useMedia } from './stage.jsx';
import './public.css';

// The guestlist's one-QR-each success screen draws its QRs with the pass page's code, so qrcode still loads only with Pass.jsx.
const QrSheet = lazy(() => import('./Pass.jsx').then((m) => ({ default: m.QrSheet })));

// Public region in the Sorot design (DESIGN.md): Home (/), a night (/events/:date), table booking (/book/:date, /booking/:code),
// guestlist (/guestlist/:date), Gallery, About, Find my QR. The QR page (/p/:id) is its own chunk, Pass.jsx.
// Every page is lit by its night's gel (gelOf): the colour follows the date, never a name.

// "This week" opens the nearest night's own page; until the week has loaded, the night picker on Home.
function ThisWeek() {
  const next = useQuery(weekQuery).data?.events[0];
  return next ? <NavLink to={`/events/${next.date}`} className="navlink">This week</NavLink> : <Link to="/#week" className="navlink">This week</Link>;
}

const NavLinks = () => (
  <>
    <ThisWeek />
    <NavLink to="/gallery" className="navlink">Gallery</NavLink>
    <NavLink to="/about" className="navlink">About</NavLink>
    <NavLink to="/qr" className="navlink">Find my QR</NavLink>
  </>
);

// A page when there is one, else an anchor on this page.
const Go = ({ to, ...rest }) => (!to || to.startsWith('#') ? <a href={to || '#ways-in'} {...rest} /> : <Link to={to} {...rest} />);

const Burger = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M2 6h14M2 12h14" />
  </svg>
);

// flow: the booking pages, which trade the menu and footer for one way back. book: where "Book a table" goes; list: where
// "Guestlist" goes. gel: the night lighting the page. The header sits over the first room of every page.
function Site({ gel = 'thu', flow, book = '/#ways-in', list, className = '', children }) {
  return (
    <MotionConfig reducedMotion="user">
      <div className={`site gel-${gel} ${className}`}>
        <Dot />
        <a className="skip" href="#main">Skip to content</a>
        <header className="masthead">
          <Link to="/" className="mark">
            <Mark />
          </Link>
          {flow ? (
            <Link to="/" className="go back">
              Back to this week
            </Link>
          ) : (
            <>
              <nav className="links" aria-label="Main">
                <NavLinks />
              </nav>
              <div className="pair">
                {list && (
                  <Go className="btn quiet" to={list}>
                    Guestlist
                  </Go>
                )}
                <Go className="btn solid" to={book}>
                  Book a table
                </Go>
              </div>
              {/* Below 900px the links fold into a full-screen sheet. A link to the page already open would leave it open, so any
                  link closes it. */}
              <details
                className="menu"
                onClick={(x) => x.target.closest('a') && (x.currentTarget.open = false)}
                onKeyDown={(x) => {
                  if (x.key !== 'Escape' || !x.currentTarget.open) return;
                  x.currentTarget.open = false;
                  x.currentTarget.querySelector('summary').focus();
                }}
              >
                <summary aria-label="Menu">
                  <Burger />
                </summary>
                <div className="sheet">
                  <nav aria-label="Main">
                    <NavLinks />
                  </nav>
                  <Go className="btn solid" to={book}>
                    Book a table
                  </Go>
                </div>
              </details>
            </>
          )}
        </header>
        <main id="main">{children}</main>
        {!flow && (
          <footer className="foot">
            <Link to="/" className="mark">
              <Mark />
            </Link>
            <nav aria-label="Footer">
              <NavLinks />
            </nav>
            <p className="label fine">A fictional venue. Portfolio concept by Ralph de Vinca Group.</p>
          </footer>
        )}
      </div>
    </MotionConfig>
  );
}

// Loading, error and data states for one query. `fail` is the sentence for when the server never answered.
function Wait({ q, loading, fail, children }) {
  if (q.isPending)
    return (
      <div className="loading" role="status">
        <span className="vh">{loading}</span>
        <div className="skel" />
        <div className="skel" />
        <div className="skel" />
      </div>
    );
  if (q.isError)
    return (
      <div className="fail" role="alert">
        <p>{q.error.status ? q.error.message : fail}</p>
        <button type="button" className="btn line" onClick={() => q.refetch()}>
          Try again
        </button>
      </div>
    );
  return children(q.data);
}

// The first room of a page while its night loads, or when it didn't.
const RoomSkeleton = ({ label }) => (
  <div className="hero-copy loading" role="status">
    <span className="vh">{label}</span>
    <div className="skel k" />
    <div className="skel t" />
    <div className="skel m" />
  </div>
);
const RoomFail = ({ q, fail }) => (
  <div className="hero-copy">
    <div className="fail" role="alert">
      <p>{q.error.status ? q.error.message : fail}</p>
      <button type="button" className="btn line" onClick={() => q.refetch()}>
        Try again
      </button>
    </div>
  </div>
);

const eventQuery = (date) => ({ queryKey: ['event', date], queryFn: () => api(`/api/events/${encodeURIComponent(date)}`) });
const tablesQuery = (date) => ({ queryKey: ['tables', date], queryFn: () => api(`/api/events/${encodeURIComponent(date)}/tables`) });
// Where "Book a table" goes without a night of its own: the first night with tables left, else the first night.
const firstOpen = (events = []) => (events.find((x) => x.tables.status !== 'sold_out') ?? events[0])?.date;

const who = (e) => headliners(e.lineup).map((s) => s.performer).join(' and ') || 'Line-up to come';
const withWho = (e) => {
  const rest = others(e.lineup);
  return rest.length ? `${who(e)}, with ${rest.join(', ')}` : who(e);
};
const cheapest = (e) => idr(Math.min(...Object.values(e.min_spend)));
const people = (n) => `${n} ${n === 1 ? 'person' : 'people'}`;
const places = (n) => `${n} ${n === 1 ? 'place' : 'places'}`;
const kicker = (iso) => {
  const d = dayParts(iso);
  return `${d.weekday} ${d.date} ${d.month}`;
};

// The short status of a night, as its tab shows it.
const tablesShort = (e) => {
  const t = e.tables.status;
  if (t === 'sold_out') return e.guestlist.status === 'open' ? 'Guestlist only' : 'Fully booked';
  return t === 'few' ? 'Last tables' : `From ${cheapest(e)}`;
};
const tablesLong = (e) => {
  const t = e.tables.status;
  return t === 'sold_out' ? 'Tables sold out' : t === 'few' ? `Last tables, from ${cheapest(e)}` : `Tables from ${cheapest(e)}`;
};
const guestLine = (e) => {
  const g = e.guestlist;
  return g.status === 'full' ? 'Guestlist full' : g.status === 'closed' ? 'Guestlist closed' : `Guestlist open until ${clock(e.guestlist_cutoff)}, ${places(g.places_left)} left`;
};

// The night picker: each night's name in the display face, its gel under the chosen one.
function NightSwatches({ events, current, onPick, compact, label = 'This week', note = tablesShort, off = () => false }) {
  return (
    <div className={`swatches${compact ? ' compact' : ''}`} role="group" aria-label={label}>
      {events.map((x) => {
        const d = dayParts(x.date);
        return (
          <button
            key={x.date}
            type="button"
            className={`swatch gel-${gelOf(x.date)}`}
            aria-pressed={x.date === current}
            aria-label={compact ? `${x.name}, ${d.weekday} ${d.date} ${d.month}` : undefined}
            disabled={off(x)}
            onClick={() => onPick(x)}
          >
            <span className="day tnum">
              {d.day} {d.date}
            </span>
            <span className="nm">{x.name}</span>
            {note && !compact && <span className={`st ${noteClass(x, note)}`}>{note(x)}</span>}
          </button>
        );
      })}
    </div>
  );
}
const noteClass = (x, note) =>
  note === tablesShort ? (x.tables.status === 'few' ? 'st-last' : x.tables.status === 'sold_out' && x.guestlist.status !== 'open' ? 'st-gone' : '') : '';

// The cue between nights: copy and object dip to black, the gel changes in the dark, then the new night comes up.
function useNightCue(count) {
  const [i, setI] = useState(0);
  const [out, setOut] = useState(false);
  const t = useRef();
  useEffect(() => () => clearTimeout(t.current), []);
  const go = (k) => {
    if (k === i || out) return;
    setOut(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => {
      setI(k);
      setOut(false);
    }, 240);
  };
  return { i: Math.min(i, Math.max(0, count - 1)), out, go };
}

const sorted = (e) => [...e.lineup].sort((a, b) => nightMinutes(a.starts_at) - nightMinutes(b.starts_at));

// Hour by hour: every set as a block on one hour axis, the headliner lit. pick/sel: blocks are buttons that choose an artist
// (the night's page); without them the lane is a picture of the night. On a phone the same sets read as a list.
function Lane({ e, sel, pick }) {
  if (e.lineup.length === 0) return <p className="sub">Line-up to come.</p>;
  const l = laneOf(e.lineup);
  const span = `Sets, ${clock(l.from)} to ${clock(l.to)}`;
  return (
    <>
      <div className="lane-box">
        <ol className="lane" aria-label={span}>
          {l.sets.map((s) => {
            const body = (
              <>
                <span className="label tnum">
                  {s.starts_at} to {s.ends_at}
                </span>
                <span className="d nm">{s.performer}</span>
                <span className="label role">{ROLES[s.role]}</span>
              </>
            );
            return (
              <li
                key={`${s.starts_at}-${s.performer}`}
                className={`blk${s.role === 'headliner' ? ' lead' : ''}`}
                style={{ left: `${s.left}%`, width: `${s.width}%` }}
              >
                {pick ? (
                  <button type="button" aria-pressed={sel === s.performer} onClick={() => pick(s.performer)}>
                    {body}
                  </button>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ol>
        <div className="axis" style={{ '--n': l.hours.length }} aria-hidden="true">
          {l.hours.map((h) => (
            <span key={h}>{clock(h)}</span>
          ))}
        </div>
      </div>
      <ol className="sets" aria-label={span}>
        {l.sets.map((s) => (
          <li key={`${s.starts_at}-${s.performer}`} className={s.role === 'headliner' ? 'lead' : undefined}>
            <span className="label tnum">
              {s.starts_at} to {s.ends_at}
            </span>
            <span className="d nm">{s.performer}</span>
            <span />
            <span className="label">{ROLES[s.role]}</span>
          </li>
        ))}
      </ol>
    </>
  );
}

// Furniture for one table of the floor plan (venue_tables: code, zone, shape, capacity, x, y on a 1000 x 620 plan).
// k scales it for the small glyph on a phone's table card. Sizes are in the plan's own width (cqw).
function furniture(t, k = 1) {
  const q = (v) => +(v * k).toFixed(2);
  const at = (dx, dy, w, h, extra) => ({ left: `calc(50% + ${q(dx)}cqw)`, top: `calc(50% + ${q(dy)}cqw)`, width: `${q(w)}cqw`, height: `${q(h)}cqw`, ...extra });
  if (t.shape === 'round') {
    const n = t.capacity;
    return {
      box: { width: `${q(10)}cqw`, height: `${q(10)}cqw` },
      top: { width: `${q(5.4)}cqw`, height: `${q(5.4)}cqw`, borderRadius: '50%' },
      seats: Array.from({ length: n }, (_, j) => {
        const a = (j * 2 * Math.PI) / n + Math.PI / n;
        return at(Math.cos(a) * 3.95, Math.sin(a) * 3.95, 1.5, 1.5, { borderRadius: '50%' });
      }),
    };
  }
  if (t.shape === 'booth') {
    const h = t.capacity > 8 ? 11.5 : 9;
    const left = t.x < 500; // booths sit on the walls and face the floor
    return {
      box: { width: `${q(8.4)}cqw`, height: `${q(h)}cqw` },
      top: { width: `${q(3.4)}cqw`, height: `${q(h - 4.6)}cqw`, borderRadius: `${q(0.5)}cqw`, marginLeft: `${left ? q(0.8) : -q(0.8)}cqw` },
      seats: [
        {
          inset: 0,
          transform: 'none',
          background: 'transparent',
          border: `${q(1.4)}cqw solid var(--seat)`,
          ...(left
            ? { borderRightColor: 'transparent', borderRadius: `${q(1.6)}cqw 0 0 ${q(1.6)}cqw` }
            : { borderLeftColor: 'transparent', borderRadius: `0 ${q(1.6)}cqw ${q(1.6)}cqw 0` }),
        },
      ],
    };
  }
  return {
    box: { width: `${q(7)}cqw`, height: `${q(7)}cqw` },
    top: { width: `${q(3.2)}cqw`, height: `${q(3.2)}cqw`, borderRadius: `${q(0.4)}cqw` },
    seats: [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => at(a * 2.5, b * 2.5, 1.3, 1.3, { borderRadius: '50%' })),
  };
}

// Light state of a table: sel (your choice), lit (free), held, small (too small for the group), dark (booked).
const lightOf = (t, party, sel) => (t.code === sel ? 'sel' : { free: 'lit', held: 'held', small: 'small', booked: 'dark' }[tableState(t, party)]);
const stateName = (st, party) => ({ sel: 'Your table', lit: 'Free', held: 'On hold', small: `Too small for ${party}`, dark: 'Taken' })[st];

const Furniture = ({ t, k }) => {
  const fz = furniture(t, k);
  return (
    <>
      {fz.seats.map((s, j) => (
        <span key={j} className="seat" style={s} />
      ))}
      <span className="top" style={fz.top}>
        {!k && (
          <>
            <b>{t.code}</b>
            <small>{t.capacity}</small>
          </>
        )}
      </span>
    </>
  );
};

// The light on the plan: a pool of the gel that slides to the chosen table, and fades when nothing is chosen. In the plan's own
// width (cqw): x runs 0 to 1000 over 100cqw, y 0 to 620 over 62cqw.
const Beam = ({ t }) => (
  <div className="beam" aria-hidden="true" style={{ transform: `translate(${(t?.x ?? 500) / 10}cqw, ${(t?.y ?? 310) / 10}cqw)`, opacity: t ? 1 : 0 }} />
);

// The floor plan. onPick: tables are buttons; without it the plan is a picture (Home, a phone's overview).
function FloorPlan({ tables, party = 1, sel, onPick, locked, mini, e, dimZone }) {
  return (
    <div className={`plan${mini ? ' mini' : ''}`}>
      <div className="zone dj">Stage</div>
      <div className="zone floor">{mini ? 'Floor' : 'Dance floor'}</div>
      <div className="zone bar">Bar</div>
      {!mini && <div className="zone door">Entrance</div>}
      {!mini && <Beam t={tables.find((t) => t.code === sel)} />}
      {tables.map((t) => {
        const st = lightOf(t, party, sel);
        const fz = furniture(t);
        const style = { left: `${t.x / 10}%`, top: `${(t.y / 6.2).toFixed(2)}%`, ...fz.box };
        const cls = `tbl${t.shape === 'high' ? ' high' : ''}${dimZone && t.zone !== dimZone ? ' off' : ''}`;
        if (!onPick)
          return (
            <span key={t.code} className={cls} data-s={st} style={style}>
              <Furniture t={t} />
            </span>
          );
        const open = st === 'lit' || st === 'sel';
        return (
          <button
            key={t.code}
            type="button"
            className={cls}
            data-s={st}
            style={style}
            aria-label={`${t.code}, ${ZONES[t.zone]}, seats ${t.capacity}, ${stateName(st, party).toLowerCase()}${e ? `, minimum spend ${idr(e.min_spend[t.zone])}` : ''}`}
            aria-pressed={st === 'sel'}
            aria-disabled={!open || locked ? 'true' : undefined}
            onClick={() => open && !locked && onPick(t)}
          >
            <Furniture t={t} />
          </button>
        );
      })}
    </div>
  );
}

const Legend = ({ count }) => (
  <div className="legend">
    <span aria-hidden="true">
      <i className="sw lit" />
      Free
    </span>
    <span aria-hidden="true">
      <i className="sw held" />
      On hold
    </span>
    <span aria-hidden="true">
      <i className="sw dark" />
      Taken
    </span>
    {count}
  </div>
);
const freeOf = (tables) => tables.filter((t) => t.status === 'free').length;

// The night's two ways in and what they cost, from the week list and the night's tables. Shared by Home and a night's page.
const tableLine = (e, tables) =>
  e.tables.status === 'sold_out' ? 'Every table is booked for this night' : tables ? `${freeOf(tables)} of ${tables.length} tables free` : tablesLong(e);
const listLine = (e) =>
  e.guestlist.status === 'open' ? `${places(e.guestlist.places_left)} left, until ${clock(e.guestlist_cutoff)}` : guestLine(e);

// The buttons for a night: book, guestlist, or why neither.
function Ctas({ e, short }) {
  const g = e.guestlist.status;
  return (
    <div className="ctas">
      {g === 'open' ? (
        <Link className="btn line" to={`/guestlist/${e.date}`}>
          {short ? 'Guestlist' : 'Join the guestlist'}
        </Link>
      ) : (
        <span className="btn line" aria-disabled="true">
          {g === 'full' ? 'Guestlist full' : 'Guestlist closed'}
        </span>
      )}
      {e.tables.status !== 'sold_out' ? (
        <Link className="btn gel" to={`/book/${e.date}`}>
          Book a table
        </Link>
      ) : (
        <span className="btn line" aria-disabled="true">
          Tables sold out
        </span>
      )}
    </div>
  );
}

const BeforeYouCome = ({ e, children }) => (
  <section className="sec block" aria-labelledby="visit-h">
    <div className="info2">
      <div className="sec-title">
        <h2 id="visit-h" className="d h2">
          Before you come
        </h2>
        <hr className="rule" />
      </div>
      <dl>
        <dt>Age</dt>
        <dd>21 and over. Valid ID, every night.</dd>
        <dt>Dress</dt>
        <dd>Smart. No sportswear, no flip-flops.</dd>
      </dl>
      <dl>
        <dt>Doors</dt>
        <dd>{e ? `From ${clock(e.opens_at)}` : 'From the afternoon'}, Thursday to Sunday. Closing time is on each night's page.</dd>
        <dt>Where</dt>
        <dd>Canggu. The exact location comes with your booking.</dd>
      </dl>
    </div>
    {children}
  </section>
);

// Home (Sorot: Main and HomeMobile).
export function Home() {
  const week = useQuery(weekQuery);
  const { hash } = useLocation();
  const events = week.data?.events ?? [];
  const cue = useNightCue(events.length);
  const e = events[cue.i];
  const tq = useQuery({ ...tablesQuery(e?.date), enabled: !!e });
  const gel = e ? gelOf(e.date) : 'thu';

  // Arriving on /#ways-in from another page: scroll once the page has rendered.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash, week.isSuccess]);

  const pick = (x) => cue.go(events.indexOf(x));
  const book = e && e.tables.status !== 'sold_out' ? `/book/${e.date}` : firstOpen(events) ? `/book/${firstOpen(events)}` : '#ways-in';
  const swap = `swap${cue.out ? ' out' : ''}`;
  const n = events.length;
  const prev = n > 1 && events[(cue.i + n - 1) % n];
  const next = n > 1 && events[(cue.i + 1) % n];

  return (
    <Site gel={gel} book={book} list={e?.guestlist.status === 'open' ? `/guestlist/${e.date}` : undefined} className="home">
      <Room gel={gel} out={cue.out} className="hero" aria-label="This week's nights">
        {week.isPending ? (
          <RoomSkeleton label="Loading this week's nights..." />
        ) : week.isError ? (
          <RoomFail q={week} fail="This week's nights didn't load. Check the connection, then try again." />
        ) : !e ? (
          <div className="hero-mid">
            <h1 className="night">The Fanglle II</h1>
            <p className="body">No nights on sale this week yet. Thursday to Sunday, from the afternoon.</p>
          </div>
        ) : (
          <>
            <div className={`hero-mid ${swap}`}>
              <h1 key={e.date} className="night settle">
                <Link to={`/events/${e.date}`}>{e.name}</Link>
              </h1>
            </div>
            <div className={`hero-row ${swap}`}>
              <div className="info">
                <p className="kicker">{kicker(e.date)}</p>
                <hr className="rule gel" />
                <p className="body">
                  {withWho(e)}.{e.genre && ` ${e.genre}.`} Doors {clock(e.opens_at)}, close {clock(e.close_time)}.
                </p>
              </div>
              <Ctas e={e} />
            </div>
          </>
        )}
        {n > 0 && (
          <div id="week" className="strip">
            <NightSwatches events={events} current={e?.date} onPick={pick} />
          </div>
        )}
      </Room>

      {e && (
        <section className="sec panel" aria-labelledby="hours-h">
          <div className="sec-head">
            <div className={`sec-title ${swap}`}>
              <h2 id="hours-h" className="d h2">
                {e.name}, hour by hour
              </h2>
              <hr className="rule" />
            </div>
            <Link className="go" to={`/events/${e.date}`}>
              The full night
            </Link>
          </div>
          <div className={swap}>
            <Lane key={e.date} e={e} />
          </div>
        </section>
      )}

      <section className="ways" id="ways-in" aria-labelledby="ways-h">
        <div className="crop drift wake">
          <Lit out={cue.out} pose="crown" />
          <h2 id="ways-h" className="d h2">
            Two ways in
          </h2>
        </div>
        <article className={`way ${swap}`}>
          <h3 className="d nm">A table for the night</h3>
          <p className="body">Pick your table on the floor plan. Half the minimum spend holds it as a deposit, and all of it goes toward your bill.</p>
          {e && (
            <>
              <p className="d price tnum">{e.tables.status === 'sold_out' ? 'Sold out' : `From ${cheapest(e)}`}</p>
              <p className="label tnum">{tableLine(e, tq.data?.tables)}</p>
              {e.tables.status !== 'sold_out' && (
                <Link className="btn gel" to={`/book/${e.date}`}>
                  Book a table
                </Link>
              )}
            </>
          )}
        </article>
        <article className={`way ${swap}`}>
          <h3 className="d nm">The guestlist</h3>
          <p className="body">
            {e && `Free entry before ${clock(e.guestlist_cutoff)}. `}Add up to ten names, then take one QR for the group or one for each person.
          </p>
          {e && (
            <>
              <p className="d price">{e.guestlist.status === 'open' ? 'Free entry' : e.guestlist.status === 'full' ? 'Full' : 'Closed'}</p>
              <p className="label tnum">{listLine(e)}</p>
              {e.guestlist.status === 'open' && (
                <Link className="btn line" to={`/guestlist/${e.date}`}>
                  Join the guestlist
                </Link>
              )}
            </>
          )}
        </article>
      </section>

      <BeforeYouCome e={e} />

      {prev && (
        <nav className="ends" aria-label="Other nights">
          {(n === 2 ? [['Night after', next]] : [['Night before', prev], ['Night after', next]]).map(([l, x]) => (
            <button key={l} type="button" className={`end gel-${gelOf(x.date)}`} onClick={() => pick(x)}>
              <span className="label">{l}</span>
              <span className="d h2">{x.name}</span>
            </button>
          ))}
        </nav>
      )}
    </Site>
  );
}

// A night (Sorot: Event).
function Details({ e }) {
  const g = e.guestlist.status;
  const tq = useQuery(tablesQuery(e.date));
  const sets = sorted(e);
  // Who is playing: the headliners first, then everyone else in running order.
  const names = [...new Set([...headliners(sets), ...sets].map((s) => s.performer))];
  const [a, setA] = useState(names[0]);
  const [out, setOut] = useState(false);
  const t = useRef();
  useEffect(() => () => clearTimeout(t.current), []);
  const pickArtist = (x) => {
    if (x === a || out) return;
    setOut(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => {
      setA(x);
      setOut(false);
    }, 240);
  };
  const mine = sets.filter((s) => s.performer === a);
  const roles = [...new Set(mine.map((s) => ROLES[s.role]))];
  const zoneLine = (z) => {
    const list = tq.data?.tables.filter((x) => x.zone === z) ?? [];
    return list.length ? `${freeOf(list)} of ${list.length} free` : null;
  };
  const head = headliners(e.lineup);

  return (
    <>
      <section className="ev-hero" aria-labelledby="ev-h">
        <div className="hero-copy">
          <Link className="go dim" to="/#week">
            This week
          </Link>
          <p className="kicker rise">{kicker(e.date)}</p>
          <h1 id="ev-h" className="night settle">
            {e.name}
          </h1>
          <hr className="rule gel" />
          <p className="body">
            {withWho(e)}.{e.genre && ` ${e.genre}.`} Doors {clock(e.opens_at)}
            {sets[0] && `, music from ${clock(sets[0].starts_at)}`}, close at {clock(e.close_time)}.
          </p>
          <Ctas e={e} />
        </div>
        <Room gel={gelOf(e.date)} pose="side" at={[0.5, 0.32]} className="ev-lit" aria-hidden="true" />
      </section>

      <section className="sec panel" aria-labelledby="hours-h">
        <div className="sec-title">
          <h2 id="hours-h" className="d h2">
            Hour by hour
          </h2>
          <hr className="rule" />
        </div>
        {e.blurb && <p className="body blurb">{e.blurb}</p>}
        <Lane e={e} sel={a} pick={names.length ? pickArtist : undefined} />
      </section>

      {names.length > 0 && (
        <section className="who" aria-labelledby="who-h">
          <div className="who-copy">
            <h2 id="who-h" className="label">
              Who is playing
            </h2>
            <div className="artists" role="group" aria-label="Artists">
              {names.map((x) => (
                <button key={x} type="button" className="d" aria-pressed={x === a} onClick={() => pickArtist(x)}>
                  {x}
                </button>
              ))}
            </div>
            <div className={`swap${out ? ' out' : ''}`} aria-live="polite">
              <p className="body">
                {roles.join(' and ')} on {e.name}.{e.genre && ` ${e.genre}.`}
              </p>
              <p className="label tnum">{mine.map((s) => `${s.starts_at} to ${s.ends_at}`).join(', ')}</p>
            </div>
          </div>
          <div className="crop">
            <Lit out={out} pose={`a${names.indexOf(a) % 4}`} />
          </div>
        </section>
      )}

      <section className="sec block" aria-labelledby="entry-h">
        <div className="sec-title">
          <h2 id="entry-h" className="d h2">
            Getting in
          </h2>
          <hr className="rule" />
        </div>
        <dl className="facts">
          <div>
            <dt>Guestlist</dt>
            <dd>{g === 'open' ? `Free before ${clock(e.guestlist_cutoff)}, ${places(e.guestlist.places_left)} left` : guestLine(e)}</dd>
          </div>
          <div>
            <dt>Tables</dt>
            <dd>{e.tables.status === 'sold_out' ? 'Sold out' : `${tablesLong(e)}${tq.data ? `, ${tableLine(e, tq.data.tables)}` : ''}`}</dd>
          </div>
          <div>
            <dt>Close</dt>
            <dd>{clock(e.close_time)}</dd>
          </div>
          <div>
            <dt>Age</dt>
            <dd>21 and over, valid ID</dd>
          </div>
          <div>
            <dt>Dress</dt>
            <dd>Smart, no sportswear</dd>
          </div>
          <div>
            <dt>Where</dt>
            <dd>Canggu, sent with your booking</dd>
          </div>
        </dl>
        <div className="zones">
          <p className="label">Minimum spend per table. The deposit is half and counts toward it.</p>
          <ul>
            {Object.entries(ZONES).map(([z, name]) => (
              <li key={z}>
                <span>
                  {name}
                  {zoneLine(z) && <small className="tnum">{zoneLine(z)}</small>}
                </span>
                <span className="tnum">{idr(e.min_spend[z])}</span>
              </li>
            ))}
          </ul>
        </div>
        <Ctas e={e} />
        {head[0] && <p className="label">Photo of {head[0].performer} to come.</p>}
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

  const e = ev.data;
  return (
    <Site
      gel={gelOf(date)}
      book={e?.tables.status === 'sold_out' ? undefined : `/book/${date}`}
      list={e?.guestlist.status === 'open' ? `/guestlist/${date}` : undefined}
      className="ev"
    >
      {ev.isSuccess ? (
        <Details key={date} e={e} />
      ) : (
        <Room gel={gelOf(date)} className="hero short">
          {ev.isPending ? (
            <RoomSkeleton label="Loading the night..." />
          ) : ev.error?.status === 404 ? (
            <div className="hero-copy">
              <div className="fail" role="alert">
                <h1 className="d h2">{ev.error.message}</h1>
                <Link className="btn line" to="/">
                  Go to the home page
                </Link>
              </div>
            </div>
          ) : (
            <RoomFail q={ev} fail="This night didn't load. Check the connection, then try again." />
          )}
        </Room>
      )}

      <section className="sec" aria-labelledby="other-h">
        <div className="sec-title">
          <h2 id="other-h" className="d h2">
            {ev.isSuccess ? 'Other nights this week' : 'Nights this week'}
          </h2>
          <hr className="rule" />
        </div>
        <Wait q={week} loading="Loading this week's nights..." fail="This week's nights didn't load. Check the connection, then try again.">
          {(data) => {
            const rest = data.events.filter((x) => x.date !== date);
            if (rest.length === 0) return <p className="sub">No other nights this week.</p>;
            return (
              <ul className="rows">
                {rest.map((x) => (
                  <li key={x.date} className={`gel-${gelOf(x.date)}`}>
                    <Link to={`/events/${x.date}`}>
                      <span className="label tnum">{dayLabel(x.date)}</span>
                      <span className="d nm">
                        <i aria-hidden="true" />
                        {x.name}
                      </span>
                      <span className="label">{[who(x), x.genre].filter(Boolean).join(', ')}</span>
                      <span className={`label ${noteClass(x, tablesShort)}`}>{tablesShort(x)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            );
          }}
        </Wait>
      </section>
    </Site>
  );
}

// Table booking (docs/design/Book.dc.html, BookMobile.dc.html): /book/:date chooses and holds, /booking/:code pays and confirms.

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

const Input = ({ id, label, err, help, ...rest }) => (
  <div className="field">
    <label htmlFor={id}>{label}</label>
    <input
      id={id}
      aria-invalid={!!err}
      aria-describedby={[err && `${id}-e`, help && `${id}-h`].filter(Boolean).join(' ') || undefined}
      {...rest}
    />
    {help && (
      <p id={`${id}-h`} className="help">
        {help}
      </p>
    )}
    {err && (
      <p id={`${id}-e`} className="err">
        {err}
      </p>
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
    <output className="d tnum" aria-live="polite">
      {value}
    </output>
    <button type="button" aria-label="One more person" disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>
      +
    </button>
  </div>
);

const Age = ({ checked, onChange, err, text = 'Everyone in my group is 21 or over and will bring ID' }) => (
  <div className="check">
    <input id="ag" type="checkbox" checked={checked} aria-invalid={!!err} aria-describedby={err ? 'ag-e' : undefined} onChange={onChange} />
    <div>
      <label htmlFor="ag">{text}</label>
      {err && (
        <p id="ag-e" className="err">
          {err}
        </p>
      )}
    </div>
  </div>
);

// A panel that changes step (choose, details, held, paid): the old step leaves quickly, the new one settles in.
const Step2 = ({ k, children }) => (
  <AnimatePresence mode="wait" initial={false}>
    <motion.div
      key={k}
      className="panel-in"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.26, ease: [0.23, 1, 0.32, 1] } }}
      exit={{ opacity: 0, y: -6, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } }}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

// The title of the booking and guestlist pages: a way back to the night, the title with its gel rule, then the page's own controls.
const FlowRoom = ({ date, kicker: k, title, sub, children }) => (
  <div className="flow-head">
    {date && (
      <Link className="go dim" to={`/events/${date}`}>
        The night
      </Link>
    )}
    {k && <p className="kicker">{k}</p>}
    <h1 className="d flow-h">{title}</h1>
    <hr className="rule gel" />
    {sub && <p className="body">{sub}</p>}
    {children}
  </div>
);

// Night swatches, group size, the night's line, floor plan (or list), and the side panel.
// locked: 'held' or 'paid' once this guest has a table; panel(tables, event) fills the side.
function Planner({ date, party, onParty, sel, onPick, onNight, locked, errors = {}, panel, panelRef, panelKey }) {
  const week = useQuery(weekQuery);
  const ev = useQuery(eventQuery(date));
  const tq = useQuery(tablesQuery(date));
  const phone = useMedia('(max-width: 759px)');
  const [view, setView] = useState('plan');
  const [zone, setZone] = useState('stage');
  const nights = week.data?.events ?? [];
  const most = tq.data ? Math.max(...tq.data.tables.map((t) => t.capacity)) : party;

  const desk = (tables, e) => (
    <>
      <div className="plan-head">
        <p className="tnum">
          {freeOf(tables)} of {tables.length} tables free on {e.name}
          {locked === 'held' && '. Release your table to choose a different one.'}
        </p>
        <div className="toggle" role="group" aria-label="View">
          <button type="button" className={`btn sm ${view === 'plan' ? 'solid' : 'line'}`} aria-pressed={view === 'plan'} onClick={() => setView('plan')}>
            Floor plan
          </button>
          <button type="button" className={`btn sm ${view === 'list' ? 'solid' : 'line'}`} aria-pressed={view === 'list'} onClick={() => setView('list')}>
            List
          </button>
        </div>
      </div>
      {view === 'plan' ? (
        <>
          <div className="plan-scroll">
            <FloorPlan tables={tables} party={party} sel={sel} onPick={onPick} locked={locked} e={e} />
          </div>
          <Legend count={<span>Round tables, booths and bar tables. Tables too small for {people(party)} are dimmed.</span>} />
        </>
      ) : (
        <div className="zone-list">
          {Object.entries(ZONES).map(([z, name]) => {
            const list = tables.filter((t) => t.zone === z);
            if (!list.length) return null;
            return (
              <section key={z}>
                <h3 className="zl-h">
                  <span>{name}</span>
                  <span className="tnum">Minimum spend {idr(e.min_spend[z])}</span>
                </h3>
                <ul>
                  {list.map((t) => {
                    const st = lightOf(t, party, sel);
                    const open = st === 'lit' || st === 'sel';
                    return (
                      <li key={t.code}>
                        <span className="d tnum code">{t.code}</span>
                        <span className="zl-what">
                          Seats {t.capacity}
                          <small>{stateName(st, party)}</small>
                        </span>
                        <button
                          type="button"
                          className={`btn sm ${st === 'sel' ? 'solid' : 'line'}`}
                          aria-pressed={st === 'sel'}
                          aria-label={`${st === 'sel' ? 'Chosen' : 'Choose'} ${t.code}`}
                          disabled={!open || (!!locked && st !== 'sel')}
                          onClick={() => open && !locked && onPick(t)}
                        >
                          {st === 'sel' ? 'Chosen' : 'Choose'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );

  // A phone: the whole plan as a small overview with the chosen area lit, then that area's tables as large cards.
  const mobile = (tables, e) => {
    const list = tables.filter((t) => t.zone === zone);
    return (
      <>
        <figure className="mini-wrap">
          <FloorPlan tables={tables} party={party} sel={sel} mini dimZone={zone} />
          <figcaption className="tnum">
            {ZONES[zone]} lit on the plan. {freeOf(tables)} of {tables.length} tables free on {e.name}.
          </figcaption>
        </figure>
        <div className="zone-tabs" role="group" aria-label="Area">
          {Object.entries(ZONES).map(([z, name]) => {
            const zl = tables.filter((t) => t.zone === z);
            if (!zl.length) return null;
            return (
              <button key={z} type="button" aria-pressed={zone === z} onClick={() => setZone(z)}>
                <span>{name}</span>
                <small className="tnum">
                  {freeOf(zl)} of {zl.length} free
                </small>
              </button>
            );
          })}
        </div>
        <p className="tnum zone-min">
          <span>Minimum spend</span>
          <span>{idr(e.min_spend[zone])}</span>
        </p>
        <div className="cards">
          {list.map((t) => {
            const st = lightOf(t, party, sel);
            const open = st === 'lit' || st === 'sel';
            return (
              <button
                key={t.code}
                type="button"
                className="tcard"
                data-s={st}
                aria-pressed={st === 'sel'}
                aria-disabled={!open || locked ? 'true' : undefined}
                aria-label={`${t.code}, seats ${t.capacity}, ${stateName(st, party).toLowerCase()}`}
                onClick={() => open && !locked && onPick(t)}
              >
                <span className="glyph" aria-hidden="true">
                  <span className={`tbl${t.shape === 'high' ? ' high' : ''}`} data-s={st} style={furniture(t, 6).box}>
                    <Furniture t={t} k={6} />
                  </span>
                </span>
                <span className="tc-text">
                  <span className="d tnum tc-code">{t.code}</span>
                  <span>Seats {t.capacity}</span>
                  <small>{stateName(st, party)}</small>
                </span>
              </button>
            );
          })}
        </div>
      </>
    );
  };

  const night = (e, tables) => {
    const next = nights.find((x) => x.date !== date && x.tables.status !== 'sold_out');
    if (!sel && tables.every((t) => t.status !== 'free'))
      return (
        <div className="soldout">
          <h2 className="d">{e.name} is fully booked</h2>
          <p>
            Every table for {dayLabel(e.date)} is taken{e.guestlist.status === 'full' && ', and the guestlist is full too'}. Try another night.
          </p>
          {next && (
            <Link className="btn line" to={`/book/${next.date}`} state={{ party }}>
              See {dayParts(next.date).weekday}, {next.name}
            </Link>
          )}
        </div>
      );
    return (
      <div className="bk-grid">
        <div className="bk-plan">{phone ? mobile(tables, e) : desk(tables, e)}</div>
        <aside className="panel" ref={panelRef} tabIndex={-1} aria-live="polite">
          <Step2 k={panelKey}>{panel(tables, e)}</Step2>
        </aside>
      </div>
    );
  };

  return (
    <>
      <FlowRoom date={date} title="Choose your table" sub="Lit tables are free. Pick one, and we hold it for 15 minutes while you pay the deposit.">
        <div className="flow-bar">
          <div className="bar-nights">
            <span className="label" id="night-l">
              Night
            </span>
            <NightSwatches
              events={nights}
              current={date}
              label="Night"
              onPick={(x) => x.date !== date && onNight(x.date)}
              off={(x) => !!locked || x.tables.status === 'sold_out'}
            />
            <Err id="date-e">{errors.date}</Err>
          </div>
          <div>
            <span className="label" id="party-l">
              Guests
            </span>
            <Step labelledBy="party-l" value={party} max={most} disabled={!!locked} onChange={onParty} />
            <Err id="party-e">{errors.party_size}</Err>
          </div>
        </div>
      </FlowRoom>

      <div className="bk-body">
        {ev.error?.status === 404 ? (
          <div className="fail" role="alert">
            <p>{ev.error.message}</p>
            <Link className="btn line" to="/">
              Go to the home page
            </Link>
          </div>
        ) : (
          <Wait q={ev} loading="Loading the night..." fail="This night didn't load. Check the connection, then try again.">
            {(e) => (
              <>
                <p className="ev-line" aria-live="polite">
                  <span className="d">{e.name}</span> {withWho(e)}
                  {e.genre && ` · ${e.genre}`}. <Link to={`/events/${e.date}`}>See the full night</Link>
                </p>
                <Wait q={tq} loading="Loading the floor plan..." fail="The floor plan didn't load. Check the connection, then try again.">
                  {(d) => night(e, d.tables)}
                </Wait>
              </>
            )}
          </Wait>
        )}
      </div>
    </>
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
          <h2 className="d p-h">No table yet</h2>
          <p className="p-text">Pick a lit table. Minimum spend on {e.name}:</p>
          <ul className="zones">
            {Object.entries(ZONES)
              .filter(([k]) => tables.some((x) => x.zone === k))
              .map(([k, name]) => {
                const list = tables.filter((x) => x.zone === k);
                return (
                  <li key={k}>
                    <span>
                      {name}
                      <small className="tnum">
                        {freeOf(list)} of {list.length} free
                      </small>
                    </span>
                    <span className="tnum">{idr(e.min_spend[k])}</span>
                  </li>
                );
              })}
          </ul>
        </>
      );
    const min = e.min_spend[t.zone];
    return (
      <form onSubmit={hold} noValidate>
        <div>
          <p className="label">
            {ZONES[t.zone]} · seats {t.capacity}
          </p>
          <h2 className="d p-big">Table {t.code}</h2>
        </div>
        <Err id="table-e">{errors.table_code}</Err>
        <dl className="facts">
          <dt>Minimum spend</dt>
          <dd className="tnum">{idr(min)}</dd>
          <dt>Deposit to hold it</dt>
          <dd className="tnum big">{idr(Math.floor(min / 2))}</dd>
        </dl>
        <Input id="nm" label="Name for the booking" type="text" autoComplete="name" value={form.name} onChange={set('name')} err={errors.name} />
        <Input
          id="ph"
          label="Phone number"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="+62 812 3456 7890"
          help="We send your QR here on WhatsApp"
          value={form.phone}
          onChange={set('phone')}
          err={errors.phone}
        />
        <Input id="em" label="Email, for your QR" type="email" autoComplete="email" value={form.email} onChange={set('email')} err={errors.email} />
        <Age checked={form.age} onChange={set('age')} err={errors.age_confirmed} text="Everyone at the table is 21 or over and will bring ID" />
        {ts.widget}
        <Err id="ts-e">{errors.turnstile_token}</Err>
        {alertBox}
        <button type="submit" className="btn gel wide" disabled={busy}>
          {busy ? 'Holding your table...' : `Hold table ${t.code} for 15 minutes`}
        </button>
        <p className="help">Holding is free. You pay the deposit on the next step. Deposits aren't refunded for cancellations or no-shows.</p>
      </form>
    );
  };

  return (
    <Site flow gel={gelOf(date)} className="bk">
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
        panelKey={t ? `t-${t.code}` : 'none'}
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
          <p className="label paid">Deposit received</p>
          <h2 className="d p-big">{e && t ? `Table ${t.code}, ${e.name}` : "You're in"}</h2>
          <dl className="facts">
            <dt>Booking code</dt>
            <dd className="tnum code">{code}</dd>
            {e && (
              <>
                <dt>Night</dt>
                <dd>{dayLabel(e.date)}</dd>
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
                <dd className="tnum">{idr(s.deposit)}</dd>
                <dt>Still to spend at the club</dt>
                <dd className="tnum big">{idr(s.min_spend - s.deposit)}</dd>
              </>
            )}
          </dl>
          <p className="p-text">Your QR is on its way by email. Show it at the door with your ID.</p>
          {q.data.pass_url && (
            <Link className="btn solid wide" to={q.data.pass_url}>
              Open my QR
            </Link>
          )}
        </>
      );
    if (status === 'no_show')
      return (
        <>
          <p className="label">Booking code</p>
          <h2 className="d p-big tnum">{code}</h2>
          <p className="p-text">This booking was marked as a no-show. Deposits aren't refunded.</p>
          <Link className="btn line wide" to="/">
            Go to the home page
          </Link>
        </>
      );
    if (over)
      return (
        <>
          <p className="label">{left === 0 ? 'Hold expired' : 'Table released'}</p>
          <h2 className="d p-big">{s ? `${s.table} was released` : 'Your table was released'}</h2>
          <p className="p-text">
            {left === 0
              ? "The deposit wasn't paid within 15 minutes, so the table is open to other guests again. Nothing was charged."
              : 'The table is open to other guests again. Nothing was charged.'}
          </p>
          {again ? (
            <Link className="btn solid wide" to={`/book/${again}`} state={{ party }}>
              Choose a table again
            </Link>
          ) : (
            <Link className="btn solid wide" to="/">
              Go to the home page
            </Link>
          )}
        </>
      );
    const timer = (label) => (
      <div className="timer" role="timer" aria-live="off" aria-label={`${label} ${mmss(left)}`}>
        <p className="label">{label}</p>
        <p className="d tnum clock">{mmss(left)}</p>
      </div>
    );
    if (!s)
      return (
        <>
          <p className="label">Table held for you</p>
          <h2 className="d p-big tnum">{code}</h2>
          {timer('Held for')}
          <p className="p-text">We're waiting for the payment to be confirmed. This page updates on its own, no need to reload.</p>
        </>
      );
    return (
      <>
        {timer(`Table ${t ? t.code : s.table} is yours for`)}
        {alert && (
          <p className="alert" role="alert">
            {alert}
          </p>
        )}
        <dl className="facts">
          <dt>Minimum spend</dt>
          <dd className="tnum">{idr(s.min_spend)}</dd>
          <dt>Deposit now</dt>
          <dd className="tnum big">{idr(s.deposit)}</dd>
        </dl>
        <p className="p-text">
          Pay the deposit before the time runs out, or the table goes back on the plan. It counts toward your minimum spend and isn't refunded if you
          cancel or don't come. Test mode through Xendit: no real money moves.
        </p>
        <a className="btn gel wide" href={s.payment_url}>
          Pay {idr(s.deposit)}
        </a>
        <button type="button" className="btn line wide" onClick={release} disabled={releasing}>
          Let the table go
        </button>
      </>
    );
  };

  const key = status === 'paid' ? 'paid' : over ? 'over' : status ?? 'wait';

  if (q.isSuccess && s)
    return (
      <Site flow gel={gelOf(s.date)} className="bk">
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
          panelKey={key}
        />
      </Site>
    );

  return (
    <Site flow className="bk">
      <FlowRoom title="Your booking" />
      <div className="bk-body alone">
        {q.error?.status === 404 ? (
          <div className="fail" role="alert">
            <p>{q.error.message}</p>
            <Link className="btn line" to="/">
              Go to the home page
            </Link>
          </div>
        ) : q.isSuccess ? (
          <div className="panel" ref={focusPanel} tabIndex={-1} aria-live="polite">
            <Step2 k={key}>{panel()}</Step2>
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

// Guestlist (docs/design/Guestlist.dc.html, GuestlistDone.dc.html): one sign-up for 1 to 10 people, one QR for the group or one each.

const MODES = [
  ['group', 'One QR for the group', 'Only your name is needed. The door counts people in as they arrive.'],
  ['personal', 'One QR each', 'Friends can arrive on their own. Each QR carries one name.'],
];
const blankList = { ...blank, guests: Array(9).fill('') };
const listState = (g) => (g.status === 'full' ? 'Full' : g.status === 'closed' ? 'Closed' : `${places(g.places_left)} left`);
const ORDINAL = ['Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];

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
      <div className="result-main">
        <p className="p-text">
          We emailed {r.passes.length > 1 ? 'the QRs' : 'your QR'} to {r.email}. {r.passes.length > 1 ? 'They are' : 'It is'} also here.
        </p>
        {r.mode === 'group' || r.passes.length === 1 ? (
          <div className="qr-one">
            <span>
              <span className="d">One QR for {people(r.party)}</span>
              <small>
                Organiser: {r.name}.{r.party > 1 && ' Guests can come in separately; the door counts who has arrived.'}
              </small>
            </span>
            <Link className="btn solid" to={r.passes[0].pass_url}>
              Open my QR
            </Link>
          </div>
        ) : (
          <>
            <p className="help">Screenshot each QR and send it to that person, or share their link. The door checks the name on it against their ID.</p>
            <Suspense fallback={<div className="skel" style={{ height: 320, width: '100%', margin: 0 }} />}>
              <QrSheet passes={r.passes} e={r.e} />
            </Suspense>
          </>
        )}
        <button type="button" className="btn line again" onClick={restart}>
          Sign up for another night
        </button>
      </div>
      <aside className="lost">
        <h3 className="d">Lost the link later?</h3>
        <p>Keep the entry code under your QR. Type it into Find my QR to open your QR again on any phone.</p>
        <Link className="btn line" to="/qr">
          Find my QR
        </Link>
      </aside>
    </div>
  );

  const alreadyIn = (r) => (
    <div className="result" ref={resultRef} tabIndex={-1} role="alert">
      <div className="result-main">
        <p className="label">Already on the list</p>
        <h2 className="d result-h2">This number is already in</h2>
        <p className="p-text">
          {r.phone} already has a guestlist spot for {r.e.name}. Each number can sign up once per night. Your QR is in the email we sent earlier.
        </p>
        {ts.widget}
        <div role="status">{sent?.ok && <p className="p-text">{sent.text}</p>}</div>
        {sent && !sent.ok && (
          <p className="alert" role="alert">
            {sent.text}
          </p>
        )}
        <div className="drow">
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
    </div>
  );

  const signUp = (e) => {
    const g = e.guestlist;
    const open = g.status === 'open';
    const cutoff = clock(e.guestlist_cutoff);
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
      <div className="gl-grid">
        <form onSubmit={submit} noValidate>
          <fieldset className="block">
            <legend className="label">Night</legend>
            <NightSwatches
              events={nights}
              current={date}
              label="Night"
              onPick={(x) => x.date !== date && onNight(x.date)}
              off={(x) => x.guestlist.status !== 'open'}
              note={(x) => listState(x.guestlist)}
            />
            {nightNote && (
              <p id="date-e" className="alert" role="status" tabIndex={-1} data-err={errors.date ? '' : undefined}>
                {nightNote}
              </p>
            )}
          </fieldset>

          <fieldset className="block group">
            <legend className="label">Your group</legend>
            <div className="field">
              <span className="flabel" id="party-l">
                People, including you
              </span>
              <Step labelledBy="party-l" value={party} max={10} onChange={onParty} />
            </div>
            {party > 1 && (
              <div className="modes" role="radiogroup" aria-label="How do you want your QR">
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
            )}
            {partyNote && (
              <p id="party-e" className="alert" role="status" tabIndex={-1} data-err={errors.party_size ? '' : undefined}>
                {partyNote}
              </p>
            )}
            <Err id="qr-e">{errors.qr_mode}</Err>
          </fieldset>

          <fieldset className="block">
            <legend className="label">Your details</legend>
            <div className="fields">
              <Input id="gn" label="Full name" help="As on your ID" type="text" autoComplete="name" value={form.name} onChange={set('name')} err={errors.name} />
              <Input
                id="gp"
                label="Phone number"
                help="One sign-up per phone each night"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+62 812 3456 7890"
                value={form.phone}
                onChange={set('phone')}
                err={errors.phone}
              />
              <Input id="ge" label="Email" help="Your QR comes here too" type="email" autoComplete="email" value={form.email} onChange={set('email')} err={errors.email} />
            </div>
          </fieldset>

          {party > 1 && mode === 'personal' && (
            <fieldset className="block">
              <legend className="label">Names in your group</legend>
              <p className="help">Required: each QR carries the name that will be checked against ID.</p>
              <div className="fields">
                {Array.from({ length: party - 1 }, (_, i) => (
                  <Input
                    key={i}
                    id={`g-${i}`}
                    label={`${ORDINAL[i]} person`}
                    type="text"
                    value={form.guests[i]}
                    onChange={setGuest(i)}
                    err={errors[`guest_names.${i}`]}
                  />
                ))}
              </div>
            </fieldset>
          )}

          <div className="submit">
            <ul className="ticks">
              <li>Valid until {cutoff} on the night.</li>
              <li>Every name is checked against ID at the door.</li>
            </ul>
            <Age checked={form.age} onChange={set('age')} err={errors.age_confirmed} text="Everyone in my group is 21 or over" />
            {ts.widget}
            <Err id="ts-e">{errors.turnstile_token}</Err>
            {alert && (
              <p className="alert" role="alert">
                {alert}
              </p>
            )}
            <button type="submit" className="btn gel" disabled={busy || !open || party > g.places_left}>
              {busy ? 'Adding you to the list...' : `Add ${people(party)} to the list`}
            </button>
            <p className="help">No account needed. Your QR shows on the next screen and arrives by email.</p>
          </div>
        </form>

        <aside className="gl-side" aria-labelledby="night-h">
          <div className={`crop gl-band gel-${gelOf(e.date)}`}>
            <Lit pose="tip" />
            <p className="kicker">{dayLabel(e.date)}</p>
            <h2 id="night-h" className="night" aria-live="polite">
              {e.name}
            </h2>
          </div>
          <div className="gl-body">
            <p className="p-text">{withWho(e)}</p>
            {open ? (
              <p className="big-num">
                <span className="d tnum num">{g.places_left}</span>
                <span>{g.places_left === 1 ? 'place' : 'places'} left</span>
              </p>
            ) : (
              <p className="d big-word">{g.status === 'full' ? 'Full' : 'Closed'}</p>
            )}
            <p className="help">
              Places count per person. Your group of {party} takes {party}.
            </p>
          </div>
        </aside>
      </div>
    );
  };

  const e = ev.data;
  return (
    <Site flow gel={gelOf(date)} className="bk gl">
      {done?.passes ? (
        <FlowRoom
          date={done.e.date}
          kicker="You are on the list"
          title={done.e.name}
          sub={`${people(done.party)} for ${dayLabel(done.e.date)}. Free entry until ${clock(done.e.guestlist_cutoff)}. Each person shows their QR and ID at the door.`}
        />
      ) : (
        <FlowRoom
          date={date}
          title="Join the guestlist"
          sub={`${e ? `Free entry before ${clock(e.guestlist_cutoff)}. ` : ''}Up to ten names, then one QR for the group or one for each person.`}
        />
      )}
      <div className="bk-body">
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

// About (Sorot: About). Every hour on it comes from this week's nights (F3).
export function About() {
  const week = useQuery(weekQuery);
  const next = week.data?.events[0];
  const gel = next ? gelOf(next.date) : 'sun';

  return (
    <Site gel={gel} book={firstOpen(week.data?.events) ? `/book/${firstOpen(week.data.events)}` : '/#ways-in'} className="about">
      <Room gel={gel} pose="about" lamp={false} className="hero ab-hero" aria-labelledby="ab-h">
        <h1 id="ab-h" className="kicker rise">
          About
        </h1>
        <p className="d statement settle">Everyone knows the first fall. It happens to you. The second one you choose.</p>
        <hr className="rule gel" />
        <p className="body rise" style={{ '--i': 6 }}>
          You walk in, the doors close behind you, and the night takes over from there.
        </p>
      </Room>

      <section className="sec panel" aria-labelledby="run-h">
        <div className="sec-title">
          <h2 id="run-h" className="d h2">
            When we open
          </h2>
          <hr className="rule" />
        </div>
        <Wait q={week} loading="Loading this week's nights..." fail="The hours didn't load. Check the connection, then try again.">
          {(data) =>
            data.events.length ? (
              <ul className="rows hours">
                {data.events.map((x) => (
                  <li key={x.date} className={`gel-${gelOf(x.date)}`}>
                    <Link to={`/events/${x.date}`}>
                      <span className="label tnum">{dayParts(x.date).weekday}</span>
                      <span className="d nm">
                        <i aria-hidden="true" />
                        {x.name}
                      </span>
                      <span className="label tnum">Doors {clock(x.opens_at)}</span>
                      <span className="label tnum">Close {clock(x.close_time)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sub">No nights on the calendar this week yet.</p>
            )
          }
        </Wait>
      </section>

      <section className="sec" aria-labelledby="rules-h">
        <div className="sec-title">
          <h2 id="rules-h" className="d h2">
            House rules
          </h2>
          <hr className="rule" />
        </div>
        <ul className="rules">
          <li>
            <span className="d nm">21 and over</span>
            <span className="body">Valid ID for everyone, every night. No exceptions for tables.</span>
          </li>
          <li>
            <span className="d nm">Smart dress</span>
            <span className="body">No sportswear, no flip-flops, no swimwear.</span>
          </li>
          <li>
            <span className="d nm">One QR, one entry</span>
            <span className="body">Each QR works once. Screenshots shared with friends won't get them in.</span>
          </li>
          <li>
            <span className="d nm">Tables have a minimum spend</span>
            <span className="body">Your deposit counts toward it. The rest is spent on the night.</span>
          </li>
        </ul>
      </section>

      <section className="sec block private" aria-labelledby="pv-h">
        <div className="sec-title">
          <h2 id="pv-h" className="d h2">
            Private nights
          </h2>
          <hr className="rule" />
        </div>
        <p className="body">
          The room can be booked for private nights from Monday to Wednesday. Tell us the date, the number of guests, and what you have in mind.
        </p>
        <a className="btn solid" href="mailto:events@thefanglle.example">
          Write to events@thefanglle.example
        </a>
      </section>
    </Site>
  );
}

// Gallery (Sorot: Gallery). No photos yet: each frame is the brief for the real photo, its shape and its alt text, labelled as a
// placeholder so it is never mistaken for the real thing. Replace a frame and the layout stays.
const SHOTS = [
  { cat: 'room', ratio: '16 / 9', shot: 'Main room from the DJ booth, full crowd, lights low', alt: 'The main room seen from the DJ booth, packed dance floor under low coloured light' },
  { cat: 'night', ratio: '3 / 4', shot: 'The Weeknd on stage at Descent', alt: 'The Weeknd performing at Descent, lit from behind' },
  { cat: 'room', ratio: '3 / 2', shot: 'Dance floor from above, beams across the haze', alt: 'Dance floor from above with light beams crossing the haze' },
  { cat: 'tables', ratio: '3 / 2', shot: 'Booth set for twelve, before doors open', alt: 'An empty booth laid out for twelve guests before opening' },
  { cat: 'night', ratio: '3 / 2', shot: 'Hands up at midnight, Second Wave', alt: 'Crowd with hands raised as the headliner starts at Second Wave' },
  { cat: 'detail', ratio: '3 / 4', shot: 'Gel frame on a stage light, close up', alt: 'Close up of a coloured gel filter on a stage light' },
  { cat: 'tables', ratio: '3 / 4', shot: 'Bottle service arriving at a booth', alt: 'Staff carrying bottle service to a booth' },
  { cat: 'room', ratio: '3 / 2', shot: 'The bar at 1 am, bartenders mid-pour', alt: 'Bartenders pouring drinks at the bar late at night' },
  { cat: 'night', ratio: '3 / 4', shot: 'Playboi Carti, close up, Fall Line', alt: 'Playboi Carti performing during Fall Line' },
  { cat: 'detail', ratio: '3 / 2', shot: 'Entrance at doors, door staff scanning a QR', alt: "Door staff scanning a guest's QR at the entrance" },
  { cat: 'tables', ratio: '3 / 2', shot: 'Stage front tables, looking toward the DJ', alt: 'Stage front tables with a clear view of the DJ booth' },
  { cat: 'night', ratio: '3 / 2', shot: 'Afterglow, softer Sunday light at the bar', alt: 'A quieter Sunday night at the bar during Afterglow' },
];
const CATS = [['all', 'All'], ['room', 'The room'], ['night', 'Nights'], ['tables', 'Tables and booths'], ['detail', 'Details']];
const shape = (s) => s.ratio.replace(' / ', ':');
const catName = (k) => CATS.find((c) => c[0] === k)[1];

export function Gallery() {
  const [cat, setCat] = useState('all');
  const [view, setView] = useState(null);
  const shots = SHOTS.filter((s) => cat === 'all' || s.cat === cat);
  const v = view !== null && shots[view];

  return (
    <Site gel="sun" className="gal">
      <section className="sec page-head" aria-labelledby="gal-h">
        <h1 id="gal-h" className="night settle">
          Gallery
        </h1>
        <hr className="rule gel" />
        <p className="body">The room, the nights, and the tables, as they look after doors. Photos arrive soon; each frame says what it will show.</p>
        <div className="filters" role="group" aria-label="Show photos of">
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
              <em className="tnum">{k === 'all' ? SHOTS.length : SHOTS.filter((s) => s.cat === k).length}</em>
            </button>
          ))}
        </div>
        <div className="masonry">
          <AnimatePresence initial={false} mode="popLayout">
            {shots.map((s, i) => (
              <motion.button
                layout
                key={s.shot}
                type="button"
                className="photo slot"
                style={{ aspectRatio: s.ratio }}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1, transition: { duration: 0.32, ease: [0.23, 1, 0.32, 1] } }}
                exit={{ opacity: 0, transition: { duration: 0.14 } }}
                onClick={() => setView(i)}
                aria-label={`Photo to come: ${s.shot}. Open details.`}
              >
                <span className="label tag">{catName(s.cat)}</span>
                <span className="shot">Photo to come: {s.shot}</span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </section>
      {v && (
        <Dialog open onClose={() => setView(null)} className="viewer" aria-labelledby="vw-t">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={v.shot}
              className="vframe photo"
              style={{ aspectRatio: v.ratio }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.24 } }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
            >
              <p id="vw-t" className="d shot">
                Photo to come: {v.shot}
              </p>
            </motion.div>
          </AnimatePresence>
          <dl className="vmeta">
            <dt>Category</dt>
            <dd>{catName(v.cat)}</dd>
            <dt>Shape</dt>
            <dd>{shape(v)}</dd>
            <dt>Alt text</dt>
            <dd>{v.alt}</dd>
          </dl>
          <div className="vbar">
            <button type="button" className="btn line sm" onClick={() => setView((view - 1 + shots.length) % shots.length)} aria-label="Previous photo">
              Previous
            </button>
            <span className="vcount label tnum" aria-live="polite">
              {view + 1} of {shots.length}
            </span>
            <button type="button" className="btn line sm" onClick={() => setView((view + 1) % shots.length)} aria-label="Next photo">
              Next
            </button>
            <button type="button" className="btn solid sm" onClick={() => setView(null)}>
              Close
            </button>
          </div>
        </Dialog>
      )}
    </Site>
  );
}

// Find my QR (/qr, Sorot: FindQr): a guest who closed their QR types the entry code printed under it and lands on that QR again.
export function FindQr() {
  const navigate = useNavigate();
  const next = useQuery(weekQuery).data?.events[0];
  const [code, setCode] = useState('');
  const [err, setErr] = useState(null);
  const [alert, setAlert] = useState(null);
  const [busy, setBusy] = useState(false);
  useFirstError(err);

  async function submit(x) {
    x.preventDefault();
    setBusy(true);
    setErr(null);
    setAlert(null);
    try {
      const r = await api('/api/passes/find', { method: 'POST', guest: true, body: { code } });
      navigate(r.pass_url);
    } catch (e) {
      // A wrong code belongs under the field; too many tries or no signal is about the whole form.
      setErr(e.status === 422 ? fieldErrors(e).code : e.status === 404 ? e.message : null);
      if (e.status !== 422 && e.status !== 404) setAlert(errorText(e));
    }
    setBusy(false);
  }

  return (
    <Site gel={next ? gelOf(next.date) : 'thu'} className="findqr">
      <section className="fq" aria-labelledby="fq-h">
        <div className="halo" aria-hidden="true" />
        <div className="box">
          <p className="kicker rise">Lost the page?</p>
          <h1 id="fq-h" className="night settle">
            Find my QR
          </h1>
          <hr className="rule gel" />
          <p className="body">Closed the page with your QR? Type the entry code from your booking or guestlist to open it again.</p>
          <form className="find-form" onSubmit={submit} noValidate>
            <Input
              id="fc"
              label="Entry code"
              help="Eight letters and numbers, under your QR and in the email we sent you."
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="K7QM-4TXP"
              value={code}
              onChange={(x) => setCode(x.target.value)}
              err={err}
            />
            {alert && (
              <p className="alert" role="alert">
                {alert}
              </p>
            )}
            <button type="submit" className="btn gel wide" disabled={busy}>
              {busy ? 'Finding your QR...' : 'Open my QR'}
            </button>
            <p className="help">The QR opens on this device. Opened once with signal, it keeps working without it.</p>
          </form>
        </div>
      </section>
    </Site>
  );
}
