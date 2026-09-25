import { useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, weekQuery } from './api.js';
import { clock, dayLabel, dayParts, earliest, headliners, idr, latest, nightMinutes, others, ROLES } from './night.js';
import { Button, Mark } from './ui.jsx';

// Public region: Home (/), event detail (/events/:date), and the QR page (/p/:id, S5).
// Booking, guestlist, Gallery and About links arrive with their own slices (S3, S4, S9); nothing links to them yet.

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

// Home links are anchors to its own sections; elsewhere only "This week" (back to Home) exists so far.
const NavLinks = ({ home }) =>
  home ? (
    <>
      <a href="#nights">This week</a>
      <a href="#ways-in">Tables</a>
      <a href="#ways-in">Guestlist</a>
      <a href="#visit">Visit</a>
    </>
  ) : (
    <Link to="/#nights">This week</Link>
  );

function Site({ home, className = '', children }) {
  return (
    <div className={`site ${className}`}>
      <header className="nav">
        <div className="navin">
          <Link to="/" className="mark head">
            <Mark />
          </Link>
          <nav className="links" aria-label="Main">
            <NavLinks home={home} />
          </nav>
        </div>
      </header>
      <main>{children}</main>
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
            </div>
            <div className="opt">
              <span className={`st ${g !== 'open' ? 'gone' : left <= 10 ? 'warn' : ''}`}>
                {g === 'full'
                  ? 'Guestlist full'
                  : g === 'closed'
                    ? `Guestlist closed at ${clock(e.guestlist_cutoff)}`
                    : `Guestlist: ${left} ${left === 1 ? 'place' : 'places'} left, free until ${clock(e.guestlist_cutoff)}`}
              </span>
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
  const ev = useQuery({ queryKey: ['event', date], queryFn: () => api(`/api/events/${encodeURIComponent(date)}`) });
  const week = useQuery(weekQuery);

  // Braces matter: scrollTo returns a promise in current Chrome, and an effect may only return a cleanup function.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [date]);

  return (
    <Site className="ev">
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

export function Pass() {
  return (
    <Site>
      <section>
        <div className="wrap">
          <p className="sub">This page isn't available yet.</p>
        </div>
      </section>
    </Site>
  );
}
