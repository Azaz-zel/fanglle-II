import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorText } from './api.js';
import { dayLabel, headliners, hhmm, idr, nightMinutes, offsetOf, others, wallClock, ZONES } from './night.js';
import { Badge, Chip, Confirm, Dialog } from './ui.jsx';
import {
  arrivalOf, attention, bookingLog, bookingRows, HOW, minsLeft, pickHour, readout, signupLine, signupRows, STATUS, timeline, whatsApp,
} from './tonight.js';

// Manager's night (S7): Overview, Table bookings, Guestlist, Door log and the detail panel, from fanglle-pengelola-mockup.jsx.
// Every number comes from GET /api/admin/tonight and the night's three lists; they refresh every 30 seconds.

export const tonightQuery = { queryKey: ['admin', 'tonight'], queryFn: () => api('/api/admin/tonight'), refetchInterval: 30_000 };
// what: table-bookings | guestlist | check-ins
const listQuery = (date, what) => ({
  queryKey: ['admin', what, date],
  queryFn: () => api(`/api/admin/events/${date}/${what}`),
  enabled: !!date,
  refetchInterval: 30_000,
});
const eventsQuery = { queryKey: ['admin-events'], queryFn: () => api('/api/admin/events') }; // shared with Events
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
    {what} didn't load. {errorText(q.error)}
    <br />
    <button className="act" onClick={() => q.refetch()}>
      Try again
    </button>
  </div>
);

// Every page is about tonight. Before the answer, after a failed first answer, or with no event tonight, it says so.
function Night({ night, children }) {
  if (night.isPending) return <Skel label="Loading tonight" />;
  if (!night.data) return <Failed q={night} what="Tonight" />;
  if (!night.data.event)
    return (
      <div className="fail">
        <h1 className="title head">
          No event <span className="two">tonight</span>
        </h1>
        <p className="sub">Nights are set up in Events. Once tonight has one, this page fills in.</p>
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

export function Overview({ night, open }) {
  const nav = useNavigate();
  const events = useQuery(eventsQuery);
  const [bar, setBar] = useState(null);

  return (
    <Night night={night}>
      {(t) => {
        const e = t.event;
        const now = clubNow(t);
        const heads = headliners(e.lineup).map((s) => s.performer);
        const rest = others(e.lineup);
        const held = t.held[0];
        const sel = bar ?? pickHour(t.arrivals, now);
        const max = Math.max(1, ...t.arrivals.map((h) => h.total));
        const every = t.arrivals.length > 12 ? 2 : 1; // a long night labels every other hour; each bar still names its hour
        const needs = attention(t, events.data?.events ?? [], now);
        return (
          <>
            <div>
              <h1 className="title head">
                {e.name} <span className="two">tonight</span>
              </h1>
              <p className="sub">
                {dayLabel(e.date)} · {heads.join(' and ') || 'Line-up to come'}
                {rest.length > 0 && ` with ${rest.join(', ')}`}
              </p>
            </div>
            <div className="over">
              <section className="hero" aria-labelledby="h-in">
                <div>
                  <div className="k" id="h-in">
                    Inside right now
                  </div>
                  <div className="bignum">
                    <strong>{t.inside}</strong>
                    <span>of {t.capacity} capacity</span>
                  </div>
                </div>
                <div className="capbar" role="img" aria-label={`${Math.round((t.inside / t.capacity) * 100)} percent full`}>
                  <i style={{ width: `${Math.min(100, (t.inside / t.capacity) * 100)}%` }} />
                </div>
                <div className="tline" aria-label="Tonight's timeline">
                  {timeline(e, now).map((m, i) => (
                    <div key={i} className={`tstep ${m.state}`}>
                      <b>{m.time}</b>
                      {m.label}
                    </div>
                  ))}
                </div>
                {held && (
                  <div className="urgent">
                    <div>
                      Table {held.table_code} is held but not paid
                      <small>
                        {held.name} · released automatically in {minsLeft(held.held_until)} min
                      </small>
                    </div>
                    <button className="act" onClick={() => open({ kind: 'booking', id: held.code })}>
                      Review
                    </button>
                  </div>
                )}
              </section>
              <div className="minis">
                <Link className="mini" to="/admin/guestlist">
                  <span className="k">Guestlist</span>
                  <span className="v">
                    {t.guestlist.arrived} <span className="of">of {t.guestlist.signed} arrived</span>
                  </span>
                  <Meter part={t.guestlist.arrived} of={t.guestlist.signed} />
                  <span className="go">Open guestlist</span>
                </Link>
                <Link className="mini" to="/admin/tables">
                  <span className="k">Tables</span>
                  <span className="v">
                    {t.tables.booked} <span className="of">of {t.tables.total} booked</span>
                  </span>
                  <span className="n">
                    {t.tables.to_arrive} paid {t.tables.to_arrive === 1 ? 'table' : 'tables'} still to arrive
                  </span>
                  <span className="go">Open table bookings</span>
                </Link>
                <Link className="mini" to="/admin/tables">
                  <span className="k">Deposits tonight</span>
                  <span className="v money">{idr(t.deposits)}</span>
                  <span className="n">Test mode, no real payments</span>
                  <span className="go">See who paid</span>
                </Link>
              </div>
            </div>
            <div className="duo">
              <section className="card" aria-labelledby="c-arr">
                <h2 id="c-arr">When did people arrive? Every hour, tonight</h2>
                <div className="chart" role="group" aria-label="Arrivals per hour. Choose a bar for details.">
                  {t.arrivals.map((h, i) => (
                    <button key={h.hour} className="barbtn" aria-pressed={sel === i} aria-label={`${h.hour}: ${h.total} arrived`} onClick={() => setBar(i)}>
                      <b>{h.total || ''}</b>
                      <i style={{ height: `${(h.total / max) * 110}px` }} />
                      <span>{i % every ? '' : h.hour}</span>
                    </button>
                  ))}
                </div>
                <p className="readout" aria-live="polite">
                  {readout(t.arrivals[sel], now)}
                </p>
              </section>
              <section className="card" aria-labelledby="c-att">
                <h2 id="c-att">Needs you</h2>
                {needs.length === 0 ? (
                  <p className="sub">Nothing needs you right now.</p>
                ) : (
                  <ul className="attn">
                    {needs.map((a) => (
                      <li key={a.key}>
                        <div>
                          <span className={a.flag ? 'flag' : undefined}>{a.title}</span>
                          {a.sub && <small>{a.sub}</small>}
                        </div>
                        <button className="act" onClick={() => nav(...a.to)}>
                          {a.action}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        );
      }}
    </Night>
  );
}

const BOOKING_CHIPS = [['all', 'All'], ['held', 'Held, unpaid'], ['paid', 'Paid, not arrived'], ['arrived', 'Arrived'], ['released', 'Released'], ['no_show', 'No-show']];

export function Bookings({ night, open }) {
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
            <div>
              <h1 className="title head">
                Table <span className="two">bookings</span>
              </h1>
              <p className="sub">
                {t.event.name}, {dayLabel(t.event.date)}. Most urgent first.
              </p>
            </div>
            <div className="toolbar">
              <div className="grow">
                <label className="lab" htmlFor="bq">
                  Search
                </label>
                <input id="bq" className="search" placeholder="Guest, table or booking code" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div className="sortby">
                <label className="lab" htmlFor="bs">
                  Sort by
                </label>
                <select id="bs" className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="urgency">Needs action first</option>
                  <option value="table">Table number</option>
                </select>
              </div>
            </div>
            <div className="chips" role="group" aria-label="Filter by status">
              {BOOKING_CHIPS.map(([k, l]) => (
                <Chip key={k} pressed={status === k} count={list.data && (k === 'all' ? all.length : list.data.counts[k])} onClick={() => setStatus(k)}>
                  {l}
                </Chip>
              ))}
            </div>
            <div className="tablewrap">
              {list.isPending ? (
                <Skel label="Loading tonight's table bookings" />
              ) : !list.data ? (
                <Failed q={list} what="Tonight's bookings" />
              ) : all.length === 0 ? (
                <div className="empty">No table bookings for tonight yet.</div>
              ) : rows.length === 0 ? (
                <div className="empty">
                  No bookings match these filters.
                  <br />
                  <button
                    className="act"
                    onClick={() => {
                      setQ('');
                      setStatus('all');
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th className="c">Table</th>
                      <th>Guest</th>
                      <th className="c">Arrived</th>
                      <th>Deposit</th>
                      <th>Booking</th>
                      <th className="c">
                        <span className="vh">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((b) => (
                      <tr key={b.code}>
                        <td>
                          <Badge tone={STATUS[b.status][1]}>
                            {STATUS[b.status][0]}
                            {b.status === 'held' && ` · ${minsLeft(b.held_until)} min`}
                          </Badge>
                        </td>
                        <td className="c">
                          {b.table_code}
                          <small>{ZONES[b.zone]}</small>
                        </td>
                        <td>
                          {b.name}
                          <small>Phone ends {b.phone_last4}</small>
                        </td>
                        <td className="c">{b.status === 'released' || b.status === 'no_show' ? '·' : `${b.inside_count} / ${b.party_size}`}</td>
                        <td>{idr(b.deposit)}</td>
                        <td>{b.code}</td>
                        <td className="c">
                          <button className="act" onClick={() => open({ kind: 'booking', id: b.code })} aria-label={`Details, ${b.name}, table ${b.table_code}`}>
                            Details
                          </button>
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

const MODES = [['all', 'All'], ['group', 'Group QR'], ['personal', 'Personal QR']];
const ARRIVALS = [['any', 'All'], ['none', 'Not yet'], ['part', 'Partly in'], ['all', 'All in']];
const ARRIVAL_BADGE = { all: ['All in', 'in'], part: [null, 'held'], none: ['Not yet', 'off'] };

export function Guestlist({ night, open }) {
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
            <div>
              <h1 className="title head">
                Guest<span className="two">list</span>
              </h1>
              <p className="sub">
                {t.event.name} · free entry {nightMinutes(clubNow(t)) >= nightMinutes(cutoff) ? 'closed at' : 'until'} {cutoff}
              </p>
            </div>
            {s && (
              <div className="summary">
                <span>
                  {s.signed} of {s.quota} places taken
                </span>
                <Meter part={s.signed} of={s.quota} />
                <button className="act" onClick={() => nav('/admin/events', { state: { date: t.event.date } })}>
                  Change places or closing time
                </button>
              </div>
            )}
            <div className="toolbar">
              <div className="grow">
                <label className="lab" htmlFor="gq">
                  Search
                </label>
                <input id="gq" className="search" placeholder="Name or last 4 digits of phone" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>
            <div className="toolbar wide">
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
            </div>
            <div className="tablewrap">
              {list.isPending ? (
                <Skel label="Loading tonight's guestlist" />
              ) : !list.data ? (
                <Failed q={list} what="Tonight's guestlist" />
              ) : all.length === 0 ? (
                <div className="empty">No one has signed up for tonight yet.</div>
              ) : rows.length === 0 ? (
                <div className="empty">
                  No one on tonight's list matches these filters.
                  <br />
                  <button
                    className="act"
                    onClick={() => {
                      setMode('all');
                      setArrival('any');
                      setQ('');
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Arrival</th>
                      <th>Name</th>
                      <th className="c">QR type</th>
                      <th className="c">People</th>
                      <th className="c">
                        <span className="vh">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((g) => {
                      const [label, tone] = ARRIVAL_BADGE[arrivalOf(g)];
                      return (
                        <tr key={g.id}>
                          <td>
                            <Badge tone={tone}>{label ?? `${g.inside} of ${g.party_size} in`}</Badge>
                          </td>
                          <td>
                            {g.name}
                            <small>Phone ends {g.phone_last4}</small>
                          </td>
                          <td className="c">{g.qr_mode === 'group' ? 'Group' : 'Personal'}</td>
                          <td className="c">{g.party_size}</td>
                          <td className="c">
                            <button className="act" onClick={() => open({ kind: 'guest', id: g.id })} aria-label={`Details, ${g.name}`}>
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
            <div>
              <h1 className="title head">
                Door <span className="two">log</span>
              </h1>
              <p className="sub">Every check-in tonight, newest first.</p>
            </div>
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
                <Skel label="Loading tonight's door log" />
              ) : !list.data ? (
                <Failed q={list} what="The door log" />
              ) : rows.length === 0 ? (
                <div className="empty">{show === 'all' ? 'No one has checked in tonight yet.' : 'None tonight.'}</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th className="c">Time</th>
                      <th>Guest</th>
                      <th className="c">People</th>
                      <th>How they got in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => (
                      <tr key={c.id}>
                        <td className="c">{hhmm(c.scanned_at)}</td>
                        <td>{c.holder_name}</td>
                        <td className="c">{c.count}</td>
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
          <div className="sub">{booking ? `Booking ${at.id}` : x ? (x.qr_mode === 'group' ? 'Group QR' : 'Personal QR') : 'Guestlist'}</div>
          <h2 id="dr-t" className="head">
            {booking ? (x ? `Table ${x.table_code}` : 'Booking') : (x?.name ?? 'Guest')}
          </h2>
        </div>
        <button className="act" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="db">
        {list.isPending ? (
          <Skel label="Loading details" />
        ) : !list.data ? (
          <Failed q={list} what="These details" />
        ) : !x ? (
          <p className="sub">{booking ? "This booking isn't on tonight's list any more." : "This guest isn't on tonight's list any more."}</p>
        ) : (
          <>
            {booking ? (
              <dl className="facts">
                <dt>Status</dt>
                <dd>
                  <Badge tone={STATUS[x.status][1]}>{STATUS[x.status][0]}</Badge>
                </dd>
                <dt>Guest</dt>
                <dd>{x.name}</dd>
                <dt>Phone</dt>
                <dd>ends {x.phone_last4}</dd>
                <dt>Zone</dt>
                <dd>{ZONES[x.zone]}</dd>
                <dt>Arrived</dt>
                <dd>
                  {x.inside_count} of {x.party_size}
                </dd>
                <dt>Deposit</dt>
                <dd>{idr(x.deposit)}</dd>
              </dl>
            ) : (
              <dl className="facts">
                <dt>People</dt>
                <dd>{x.party_size}</dd>
                <dt>Arrived</dt>
                <dd>
                  {x.inside} of {x.party_size}
                </dd>
                <dt>Phone</dt>
                <dd>ends {x.phone_last4}</dd>
                {names.length > 0 && (
                  <>
                    <dt>Other names</dt>
                    <dd>{names.join(', ')}</dd>
                  </>
                )}
              </dl>
            )}
            <div>
              <div className="lab">What happened</div>
              <ul className="tl">
                {(booking ? bookingLog(x) : [signupLine(x)]).map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
            <div className="drow">
              {booking && x.status === 'held' && (
                <button className="act danger" onClick={() => setAsk('release')}>
                  Release table now
                </button>
              )}
              {booking && x.status === 'paid' && (
                <button className="act danger" onClick={() => setAsk('noshow')}>
                  Mark no-show
                </button>
              )}
              {!booking && x.inside === 0 && (
                <button className="act danger" onClick={() => setAsk('remove')}>
                  Remove from list
                </button>
              )}
              {/* The full number is only used by WhatsApp, not shown on this screen (the mockup's note). */}
              <a className="act" href={whatsApp(x.phone)} target="_blank" rel="noreferrer">
                Message on WhatsApp
              </a>
              {!booking && (
                <button className="act" onClick={resend}>
                  Resend QR
                </button>
              )}
            </div>
          </>
        )}
      </div>
      {c && <Confirm title={c.title(x)} text={c.text(x)} button={c.button} run={run} onClose={() => setAsk(null)} />}
    </Dialog>
  );
}
