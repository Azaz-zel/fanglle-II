import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorText } from './api.js';
import { clock, dayLabel, dayParts, headliners, hhmm, idr, nightMinutes, offsetOf, others, wallClock, ZONES } from './night.js';
import { Badge, Chip, Confirm, Dialog } from './ui.jsx';
import {
  arrivalOf, attention, bookingLog, bookingRows, HOW, minsLeft, nightClock, pickHour, readout, signupLine, signupRows, STATUS, timeline, whatsApp, whenOf,
} from './tonight.js';

// Manager's night (S7): Overview, Table bookings, Guestlist, Door log and the detail panel. Look from the Sorot boards AdminOverview
// and AdminBookings; Guestlist and Door log follow the bookings page. Every number comes from GET /api/admin/tonight and
// the night's three lists; they refresh every 30 seconds.

// date: the night picked in the top bar; null lets the server choose tonight, else the next night, else the last one. The
// night on screen stays up while the next one loads.
export const nightQuery = (date) => ({
  queryKey: ['admin', 'tonight', date],
  queryFn: () => api(`/api/admin/tonight${date ? `?date=${date}` : ''}`),
  refetchInterval: 30_000,
  placeholderData: (prev) => prev,
});
// what: table-bookings | guestlist | check-ins
const listQuery = (date, what) => ({
  queryKey: ['admin', what, date],
  queryFn: () => api(`/api/admin/events/${date}/${what}`),
  enabled: !!date,
  refetchInterval: 30_000,
});
export const eventsQuery = { queryKey: ['admin-events'], queryFn: () => api('/api/admin/events') }; // shared with Events and the night picker
export const clubNow = (t) => wallClock(Date.now(), offsetOf(t.now));

export const Skel = ({ label }) => (
  <div role="status" aria-label={label}>
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="skel" />
    ))}
  </div>
);

export const Failed = ({ q, what }) => (
  <div className="error" role="alert">
    <p>
      {what} didn't load. {errorText(q.error)}
    </p>
    <button className="btn line sm" onClick={() => q.refetch()}>
      Try again
    </button>
  </div>
);

// Every page is about the night picked in the top bar. Before the answer, after a failed first answer, or with no night set up
// at all, it says so.
function Night({ night, children }) {
  if (night.isPending) return <Skel label="Loading the night" />;
  if (!night.data) return <Failed q={night} what="The night" />;
  if (!night.data.event)
    return (
      <div className="nothing">
        <h1 className="d title">No nights yet</h1>
        <p className="sub">Nights are set up in Events. Once there is one, this page fills in.</p>
        <Link className="btn line" to="/admin/events">
          Open Events
        </Link>
      </div>
    );
  return children(night.data);
}

const Meter = ({ part, of }) => (
  <span className="meter">
    <i style={{ width: `${of ? Math.min(100, (part / of) * 100) : 0}%` }} />
  </span>
);

// Page heading: the italic line above when there is one, the display title, and the line under it when there is one.
const Head = ({ kicker, title, children }) => (
  <div className="ph">
    {kicker && <p className="kicker">{kicker}</p>}
    <h1 className="night title">{title}</h1>
    {children && <p className="sub">{children}</p>}
  </div>
);

export function Overview({ night, open }) {
  const nav = useNavigate();
  const events = useQuery(eventsQuery);
  const [bar, setBar] = useState(null);

  return (
    <Night night={night}>
      {(t) => {
        const e = t.event;
        const when = whenOf(t);
        const now = nightClock(t, clubNow(t));
        const day = dayParts(e.date);
        const heads = headliners(e.lineup).map((s) => s.performer);
        const rest = others(e.lineup);
        const held = t.held[0];
        const sel = bar ?? pickHour(t.arrivals, now);
        const max = Math.max(1, ...t.arrivals.map((h) => h.total));
        const every = t.arrivals.length > 12 ? 2 : 1; // a long night labels every other hour; each bar still names its hour
        const needs = attention(t, events.data?.events ?? [], now);
        // From docs/design/AdminOverview.dc.html: the night card under the night's gel, what needs a decision beside it, three
        // tiles, then the arrivals chart. The held table that used to sit in the night card leads "Needs you".
        return (
          <>
            <Head kicker={`${when === 'tonight' ? 'Tonight, ' : ''}${day.weekday} ${day.date} ${day.month}`} title={e.name}>
              {when === 'ahead' ? `Still to come. Doors at ${clock(e.opens_at)}.` : when === 'past' && 'This night is over.'}
            </Head>
            <div className="over">
              <section className="nightcard" aria-labelledby="h-night">
                <div className="band">
                  <h2 id="h-night" className="d">
                    {heads.join(' and ') || 'Line-up to come'}
                  </h2>
                  {rest.length > 0 && <span>with {rest.join(', ')}</span>}
                </div>
                <div className="nbody">
                  <p className="inside">
                    <strong className="d tnum">{t.inside}</strong>
                    <span>
                      {{ tonight: 'inside right now', ahead: 'inside', past: 'came in' }[when]}, of {t.capacity} capacity
                    </span>
                  </p>
                  <div className="capbar" role="img" aria-label={`${Math.round((t.inside / t.capacity) * 100)} percent full`}>
                    <i style={{ width: `${Math.min(100, (t.inside / t.capacity) * 100)}%` }} />
                  </div>
                  <ol className="marks" aria-label="The night's timeline">
                    {timeline(e, now).map((m, i) => (
                      <li key={i} className={m.state || undefined}>
                        <b className="tnum">{clock(m.time)}</b>
                        {m.label}
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
              <section className="box" aria-labelledby="c-att">
                <h2 id="c-att">Needs you</h2>
                {!held && needs.length === 0 ? (
                  <p className="sub">Nothing needs you right now.</p>
                ) : (
                  <ul className="attn">
                    {held && (
                      <li>
                        <div>
                          Table {held.table_code} is held but not paid
                          <small className="hold tnum">
                            {held.name} · released automatically in {minsLeft(held.held_until)} min
                          </small>
                        </div>
                        <button className="btn line sm" onClick={() => open({ kind: 'booking', id: held.code })}>
                          Review
                        </button>
                      </li>
                    )}
                    {needs.map((a) => (
                      <li key={a.key}>
                        <div>
                          <span className={a.flag ? 'flag' : undefined}>{a.title}</span>
                          {a.sub && <small className="tnum">{a.sub}</small>}
                        </div>
                        <button className="btn line sm" onClick={() => nav(...a.to)}>
                          {a.action}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
            <div className="tiles">
              <Link className="tile" to="/admin/tables">
                <span className="k">Tables</span>
                <span className="v d tnum">
                  {t.tables.booked} <span className="of">of {t.tables.total} booked</span>
                </span>
                <span className="n tnum">
                  {t.tables.to_arrive} paid {t.tables.to_arrive === 1 ? 'table' : 'tables'} still to arrive
                </span>
                <span className="go">Open table bookings</span>
              </Link>
              <Link className="tile" to="/admin/guestlist">
                <span className="k">Guestlist</span>
                <span className="v d tnum">
                  {t.guestlist.arrived} <span className="of">of {t.guestlist.signed} arrived</span>
                </span>
                <Meter part={t.guestlist.arrived} of={t.guestlist.signed} />
                <span className="go">Open guestlist</span>
              </Link>
              <Link className="tile" to="/admin/tables">
                <span className="k">Deposits</span>
                <span className="v d tnum money">{idr(t.deposits)}</span>
                <span className="n">Test mode, no real payments</span>
                <span className="go">See who paid</span>
              </Link>
            </div>
            <section className="box" aria-labelledby="c-arr">
              <h2 id="c-arr">When did people arrive? Every hour{when === 'tonight' && ', tonight'}</h2>
              <div className="bars" role="group" aria-label="Arrivals per hour. Choose a bar for details.">
                {t.arrivals.map((h, i) => (
                  <button key={h.hour} className="barbtn" aria-pressed={sel === i} aria-label={`${h.hour}: ${h.total} arrived`} onClick={() => setBar(i)}>
                    <b className="tnum">{h.total || ''}</b>
                    <i style={{ height: `${(h.total / max) * 110}px` }} />
                    <span className="tnum">{i % every ? '' : h.hour}</span>
                  </button>
                ))}
              </div>
              <p className="readout" aria-live="polite">
                {readout(t.arrivals[sel], now)}
              </p>
            </section>
          </>
        );
      }}
    </Night>
  );
}

const BOOKING_CHIPS = [['all', 'All'], ['held', 'Held, unpaid'], ['paid', 'Paid, not arrived'], ['arrived', 'Arrived'], ['released', 'Released'], ['no_show', 'No-show']];

// "Clear filters" under an empty filtered list.
const NoMatch = ({ text, clear }) => (
  <div className="empty">
    <p>{text}</p>
    <button className="btn line sm" onClick={clear}>
      Clear filters
    </button>
  </div>
);

export function Bookings({ night, open, at }) {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? 'all';
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('urgency');
  const list = useQuery(listQuery(night.data?.event?.date, 'table-bookings'));
  const setStatus = (s) => setParams(s === 'all' ? {} : { status: s }, { replace: true });

  return (
    <Night night={night}>
      {(t) => {
        const all = list.data?.bookings ?? [];
        const rows = bookingRows(all, { status, q, sort });
        return (
          <>
            <Head title="Table bookings">
              {t.event.name}, {dayLabel(t.event.date)}. Most urgent first.
            </Head>
            <div className="chips" role="group" aria-label="Filter by status">
              {BOOKING_CHIPS.map(([k, l]) => (
                <Chip key={k} pressed={status === k} count={list.data && (k === 'all' ? all.length : list.data.counts[k])} onClick={() => setStatus(k)}>
                  {l}
                </Chip>
              ))}
            </div>
            <div className="toolbar">
              <div className="fill">
                <label className="lab" htmlFor="bq">
                  Search
                </label>
                <input id="bq" className="input" placeholder="Guest, table or booking code" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div className="sortby">
                <label className="lab" htmlFor="bs">
                  Sort by
                </label>
                <select id="bs" className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="urgency">Needs action first</option>
                  <option value="table">Table number</option>
                </select>
              </div>
            </div>
            <div className="tablewrap">
              {list.isPending ? (
                <Skel label="Loading the table bookings" />
              ) : !list.data ? (
                <Failed q={list} what="The bookings" />
              ) : all.length === 0 ? (
                <div className="empty">No table bookings for this night yet.</div>
              ) : rows.length === 0 ? (
                <NoMatch
                  text="No bookings match these filters."
                  clear={() => {
                    setQ('');
                    setStatus('all');
                  }}
                />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Booking</th>
                      <th>Table</th>
                      <th>Guest</th>
                      <th className="c">Arrived</th>
                      <th className="r">Deposit</th>
                      <th>Status</th>
                      <th>
                        <span className="vh">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((b) => {
                      const gone = b.status === 'released' || b.status === 'no_show';
                      return (
                        <tr key={b.code} className={at?.kind === 'booking' && at.id === b.code ? 'on' : undefined}>
                          <td className="tnum">{b.code}</td>
                          <td>
                            {b.table_code}
                            <small>{ZONES[b.zone]}</small>
                          </td>
                          <td>
                            {b.name}
                            <small className="tnum">Phone ends {b.phone_last4}</small>
                          </td>
                          <td className="c tnum">{gone ? '·' : `${b.inside_count} / ${b.party_size}`}</td>
                          <td className={`r tnum${gone ? ' dim' : ''}`}>{idr(b.deposit)}</td>
                          <td>
                            <Badge tone={STATUS[b.status][1]}>
                              {STATUS[b.status][0]}
                              {b.status === 'held' && ` · ${minsLeft(b.held_until)} min`}
                            </Badge>
                          </td>
                          <td className="r">
                            <button className="btn line sm" onClick={() => open({ kind: 'booking', id: b.code })} aria-label={`Details, ${b.name}, table ${b.table_code}`}>
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        );
      }}
    </Night>
  );
}

const MODES = [['all', 'All'], ['group', 'Group QR'], ['personal', 'Personal QR']];
const ARRIVALS = [['any', 'All'], ['none', 'Not yet'], ['part', 'Partly in'], ['all', 'All in']];
const ARRIVAL_BADGE = { all: ['All in', 'in'], part: [null, 'held'], none: ['Not yet', 'off'] };

export function Guestlist({ night, open, at }) {
  const nav = useNavigate();
  const [mode, setMode] = useState('all');
  const [arrival, setArrival] = useState('any');
  const [q, setQ] = useState('');
  const list = useQuery(listQuery(night.data?.event?.date, 'guestlist'));

  return (
    <Night night={night}>
      {(t) => {
        const all = list.data?.signups ?? [];
        const rows = signupRows(all, { mode, arrival, q });
        const s = list.data?.summary;
        const c = list.data?.counts;
        const cutoff = t.event.guestlist_cutoff;
        return (
          <>
            <Head title="Guestlist">
              {t.event.name} · free entry {nightMinutes(nightClock(t, clubNow(t))) >= nightMinutes(cutoff) ? 'closed at' : 'until'} {clock(cutoff)}
            </Head>
            {s && (
              <div className="summary">
                <span className="tnum">
                  {s.signed} of {s.quota} places taken
                </span>
                <Meter part={s.signed} of={s.quota} />
                <button className="btn line sm" onClick={() => nav('/admin/events', { state: { date: t.event.date } })}>
                  Change places or closing time
                </button>
              </div>
            )}
            <div className="toolbar">
              <div>
                <span className="lab" id="qt">
                  QR type
                </span>
                <div className="chips" role="group" aria-labelledby="qt">
                  {MODES.map(([k, l]) => (
                    <Chip key={k} pressed={mode === k} count={c && (k === 'all' ? all.length : c[k])} onClick={() => setMode(k)}>
                      {l}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <span className="lab" id="ar">
                  Arrival
                </span>
                <div className="chips" role="group" aria-labelledby="ar">
                  {ARRIVALS.map(([k, l]) => (
                    <Chip key={k} pressed={arrival === k} count={c && (k === 'any' ? all.length : c[k])} onClick={() => setArrival(k)}>
                      {l}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="fill">
                <label className="lab" htmlFor="gq">
                  Search
                </label>
                <input id="gq" className="input" placeholder="Name or last 4 digits of phone" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>
            <div className="tablewrap">
              {list.isPending ? (
                <Skel label="Loading the guestlist" />
              ) : !list.data ? (
                <Failed q={list} what="The guestlist" />
              ) : all.length === 0 ? (
                <div className="empty">No one has signed up for this night yet.</div>
              ) : rows.length === 0 ? (
                <NoMatch
                  text="No one on this list matches these filters."
                  clear={() => {
                    setMode('all');
                    setArrival('any');
                    setQ('');
                  }}
                />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>QR type</th>
                      <th className="c">People</th>
                      <th>Arrival</th>
                      <th>
                        <span className="vh">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((g) => {
                      const [label, tone] = ARRIVAL_BADGE[arrivalOf(g)];
                      return (
                        <tr key={g.id} className={at?.kind === 'guest' && at.id === g.id ? 'on' : undefined}>
                          <td>
                            {g.name}
                            <small className="tnum">Phone ends {g.phone_last4}</small>
                          </td>
                          <td>{g.qr_mode === 'group' ? 'Group' : 'Personal'}</td>
                          <td className="c tnum">{g.party_size}</td>
                          <td>
                            <Badge tone={tone}>{label ?? `${g.inside} of ${g.party_size} in`}</Badge>
                          </td>
                          <td className="r">
                            <button className="btn line sm" onClick={() => open({ kind: 'guest', id: g.id })} aria-label={`Details, ${g.name}`}>
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        );
      }}
    </Night>
  );
}

export function DoorLog({ night }) {
  const [params, setParams] = useSearchParams();
  const show = params.get('overrides') ? 'overrides' : params.get('conflicts') ? 'conflicts' : 'all';
  const list = useQuery(listQuery(night.data?.event?.date, 'check-ins'));

  return (
    <Night night={night}>
      {() => {
        const all = list.data?.check_ins ?? [];
        const rows = show === 'overrides' ? all.filter((c) => c.method === 'override') : show === 'conflicts' ? all.filter((c) => c.conflict) : all;
        const n = list.data?.counts;
        return (
          <>
            <Head title="Door log">Every check-in, newest first.</Head>
            <div className="chips" role="group" aria-label="Show">
              <Chip pressed={show === 'all'} count={n?.total} onClick={() => setParams({}, { replace: true })}>
                Everything
              </Chip>
              <Chip pressed={show === 'overrides'} count={n?.overrides} onClick={() => setParams({ overrides: '1' }, { replace: true })}>
                Manager overrides
              </Chip>
              {/* F12: two doors without signal let the same pass in past its limit. Only shown when it happened. */}
              {(n?.conflicts > 0 || show === 'conflicts') && (
                <Chip pressed={show === 'conflicts'} count={n?.conflicts} onClick={() => setParams({ conflicts: '1' }, { replace: true })}>
                  Over the limit
                </Chip>
              )}
            </div>
            <div className="tablewrap">
              {list.isPending ? (
                <Skel label="Loading the door log" />
              ) : !list.data ? (
                <Failed q={list} what="The door log" />
              ) : rows.length === 0 ? (
                <div className="empty">{show === 'all' ? 'No one has checked in yet.' : 'None.'}</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Guest</th>
                      <th className="c">People</th>
                      <th>How they got in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => (
                      <tr key={c.id}>
                        <td className="tnum">{hhmm(c.scanned_at)}</td>
                        <td>{c.holder_name}</td>
                        <td className="c tnum">{c.count}</td>
                        <td className={c.method === 'override' || c.conflict ? 'flag' : undefined}>
                          {HOW[c.method]}
                          {c.table_code && ` · table ${c.table_code}`}
                          {c.conflict && ' · more than the pass allows'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        );
      }}
    </Night>
  );
}

// Release a held table, mark a paid one no-show, or take a signup nobody has come in on off the list.
const CONFIRM = {
  release: {
    title: (x) => `Release table ${x.table_code}?`,
    text: (x) => `${x.name} hasn't paid yet. The table opens for other guests straight away.`,
    button: 'Release table',
    call: (x) => api(`/api/admin/table-bookings/${x.code}/release`, { method: 'POST' }),
    done: (x) => `Table ${x.table_code} is open again.`,
  },
  noshow: {
    title: (x) => `Mark ${x.name} as no-show?`,
    text: (x) => `Table ${x.table_code} opens for walk-ins and the guest's QR stops working. The deposit is kept, as the booking terms say.`,
    button: 'Mark no-show',
    call: (x) => api(`/api/admin/table-bookings/${x.code}/no-show`, { method: 'POST' }),
    done: (x) => `${x.name} marked no-show. Table ${x.table_code} is open for walk-ins.`,
  },
  remove: {
    title: (x) => `Remove ${x.name}?`,
    text: (x) => `${x.party_size} ${x.party_size === 1 ? 'place goes' : 'places go'} back on the list, and their QR stops working.`,
    button: 'Remove from list',
    call: (x) => api(`/api/admin/guestlist/${x.id}`, { method: 'DELETE' }),
    done: (x) => `${x.name} removed. ${x.party_size} ${x.party_size === 1 ? 'place' : 'places'} back on the list.`,
  },
};

// at: { kind: 'booking', id: code } | { kind: 'guest', id }. Read from the night's list, so it shows what the table shows.
export function Drawer({ at, date, onClose, flash }) {
  const qc = useQueryClient();
  const booking = at.kind === 'booking';
  const list = useQuery(listQuery(date, booking ? 'table-bookings' : 'guestlist'));
  const x = booking ? list.data?.bookings.find((b) => b.code === at.id) : list.data?.signups.find((g) => g.id === at.id);
  const [ask, setAsk] = useState(null);
  const c = ask && CONFIRM[ask];

  async function run() {
    await c.call(x);
    await Promise.all([qc.invalidateQueries({ queryKey: ['admin'] }), qc.invalidateQueries({ queryKey: ['admin-events'] })]);
    flash(c.done(x));
    onClose();
  }

  // "Resend QR": the guest's own QR email again, under the same 3-an-hour limit; the server's refusal is shown as it is.
  async function resend() {
    try {
      await api(`/api/admin/guestlist/${x.id}/resend`, { method: 'POST' });
      flash(`${x.name}'s QR sent again to the email they signed up with.`);
    } catch (e) {
      flash(errorText(e));
    }
  }

  const names = x && !booking ? x.passes.map((p) => p.holder_name).filter((n) => n !== x.name) : [];
  return (
    <Dialog open onClose={onClose} className="drawer" aria-labelledby="dr-t">
      <div className="dh">
        <div>
          <p className="label">{booking ? `Booking ${at.id}` : x ? (x.qr_mode === 'group' ? 'Group QR' : 'Personal QR') : 'Guestlist'}</p>
          <h2 id="dr-t" className="d">
            {booking ? (x ? `Table ${x.table_code}` : 'Booking') : (x?.name ?? 'Guest')}
          </h2>
          {booking && x && <Badge tone={STATUS[x.status][1]}>{STATUS[x.status][0]}</Badge>}
        </div>
        <button className="btn line sm" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="db">
        {list.isPending ? (
          <Skel label="Loading details" />
        ) : !list.data ? (
          <Failed q={list} what="These details" />
        ) : !x ? (
          <p className="sub">{booking ? "This booking isn't on this night's list any more." : "This guest isn't on this night's list any more."}</p>
        ) : (
          <>
            {booking ? (
              <dl className="dfacts">
                <dt>Guest</dt>
                <dd>{x.name}</dd>
                <dt>Phone</dt>
                <dd className="tnum">ends {x.phone_last4}</dd>
                <dt>Zone</dt>
                <dd>{ZONES[x.zone]}</dd>
                <dt>Arrived</dt>
                <dd className="tnum">
                  {x.inside_count} of {x.party_size}
                </dd>
                <dt>Deposit</dt>
                <dd className="tnum">{idr(x.deposit)}</dd>
              </dl>
            ) : (
              <dl className="dfacts">
                <dt>People</dt>
                <dd className="tnum">{x.party_size}</dd>
                <dt>Arrived</dt>
                <dd className="tnum">
                  {x.inside} of {x.party_size}
                </dd>
                <dt>Phone</dt>
                <dd className="tnum">ends {x.phone_last4}</dd>
                {names.length > 0 && (
                  <>
                    <dt>Other names</dt>
                    <dd>{names.join(', ')}</dd>
                  </>
                )}
              </dl>
            )}
            <div className="drow">
              {/* The full number is only used by WhatsApp, not shown on this screen (F14). */}
              <a className="btn line" href={whatsApp(x.phone)} target="_blank" rel="noreferrer">
                Message on WhatsApp
              </a>
              {!booking && (
                <button className="btn line" onClick={resend}>
                  Resend QR
                </button>
              )}
            </div>
            <div>
              <p className="label">What happened</p>
              <ol className="hist">
                {/* Every line starts with its "HH:MM", set apart in muted figures as in the design. */}
                {(booking ? bookingLog(x) : [signupLine(x)]).map((l) => (
                  <li key={l}>
                    <span className="tnum">{l.slice(0, 5)}</span>
                    {l.slice(5)}
                  </li>
                ))}
              </ol>
            </div>
            {booking && x.status === 'held' && (
              <button className="btn wide danger" onClick={() => setAsk('release')}>
                Release table now
              </button>
            )}
            {booking && x.status === 'paid' && (
              <button className="btn wide danger" onClick={() => setAsk('noshow')}>
                Mark no-show
              </button>
            )}
            {!booking && x.inside === 0 && (
              <button className="btn wide danger" onClick={() => setAsk('remove')}>
                Remove from list
              </button>
            )}
          </>
        )}
      </div>
      {c && <Confirm title={c.title(x)} text={c.text(x)} button={c.button} run={run} onClose={() => setAsk(null)} />}
    </Dialog>
  );
}
