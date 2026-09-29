import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorText, weekQuery } from './api.js';
import { clock, dayLabel, lineupWarnings, nightMinutes, ROLES } from './night.js';

// Admin Events, from the Events page in fanglle-pengelola-mockup.jsx. The server validates; its messages land under the fields.

let seq = 0;
const row = (performer = '', role = 'guest_star', starts_at = '', ends_at = '') => ({ id: ++seq, performer, role, starts_at, ends_at });
const text = (n) => (n == null ? '' : String(n));
const minSpend = (m) => ({ stage: text(m.stage), booth: text(m.booth), bar: text(m.bar) });

// Starting values of the mockup's "A blank event"; every one is an editable input, none is shown as a fact.
const blank = () => ({
  date: '', name: '', genre: '', blurb: '', guestlist_quota: '200', guestlist_cutoff: '23:00', close_time: '04:00',
  min_spend: minSpend({}), lineup: [row('', 'headliner', '00:00', '03:00')], signed: 0,
});
const fromApi = (e) => ({
  ...e, genre: text(e.genre), blurb: text(e.blurb), guestlist_quota: text(e.guestlist_quota), min_spend: minSpend(e.min_spend),
  lineup: e.lineup.map((s) => row(s.performer, s.role, s.starts_at, s.ends_at)),
});
const num = (v) => (v === '' ? null : Number(v));
const toApi = (d, creating) => ({
  ...(creating && { date: d.date }),
  name: d.name, genre: d.genre || null, blurb: d.blurb || null,
  guestlist_quota: num(d.guestlist_quota), guestlist_cutoff: d.guestlist_cutoff, close_time: d.close_time,
  min_spend: { stage: num(d.min_spend.stage), booth: num(d.min_spend.booth), bar: num(d.min_spend.bar) },
  lineup: d.lineup.map(({ performer, role, starts_at, ends_at }) => ({ performer, role, starts_at, ends_at })),
});
// Sorted by night time on save; a row without a valid start goes last.
const startKey = (r) => nightMinutes(r.starts_at) || Infinity;
const detailQuery = (date) => ({ queryKey: ['admin-event', date], queryFn: () => api(`/api/admin/events/${date}`), staleTime: Infinity });
// Error keys that have a field on this form; anything else is shown above the save button.
const PLACED = /^(date|name|genre|blurb|guestlist_quota|guestlist_cutoff|close_time|min_spend\.(stage|booth|bar)|lineup|row-\d+-\w+)$/;
const ZONES = [['stage', 'Stage front'], ['booth', 'Booths'], ['bar', 'Bar tables']];

export default function Events() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['admin-events'], queryFn: () => api('/api/admin/events') });
  const opens = useQuery(weekQuery).data?.events[0]?.opens_at; // the admin detail has no opens_at; it is one value for every night (F3)
  const events = list.data?.events ?? [];

  // The Overview and Guestlist send a night here to change its places or closing time.
  const sent = useLocation().state?.date;
  const [pick, setPick] = useState(sent ?? null);
  const [creating, setCreating] = useState(false);
  const [startFrom, setStartFrom] = useState('blank');
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);

  const today = new Date().toLocaleDateString('en-CA');
  const editKey = pick ?? (events.find((e) => e.date >= today) ?? events[events.length - 1])?.date;
  const detail = useQuery({ ...detailQuery(editKey), enabled: !!editKey && !creating });

  useEffect(() => {
    if (creating || !detail.data) return;
    setDraft(fromApi(detail.data));
    setErrors({});
    setFormError('');
  }, [detail.data, creating]);

  // No events yet: the form opens as "New event".
  useEffect(() => {
    if (list.isSuccess && events.length === 0 && !creating) startCreate();
  }, [list.isSuccess, events.length]);

  useEffect(() => {
    formRef.current?.querySelector('[aria-invalid="true"], [role="alert"]')?.focus();
  }, [errors, formError]);

  function startCreate() {
    setCreating(true);
    setStartFrom('blank');
    setDraft(blank());
    setErrors({});
    setFormError('');
    setSaved('');
  }

  function openEvent(date) {
    setCreating(false);
    setPick(date);
    setSaved('');
  }

  async function applyStart(v) {
    setStartFrom(v);
    if (v === 'blank') return setDraft(blank());
    try {
      const src = await qc.fetchQuery(detailQuery(v));
      setDraft({ ...blank(), genre: text(src.genre), guestlist_cutoff: src.guestlist_cutoff, guestlist_quota: text(src.guestlist_quota), min_spend: minSpend(src.min_spend) });
    } catch (e) {
      setFormError(errorText(e));
    }
  }

  const set = (patch) => {
    setDraft((d) => ({ ...d, ...patch }));
    setSaved('');
  };
  const setRow = (id, k, v) => set({ lineup: draft.lineup.map((r) => (r.id === id ? { ...r, [k]: v } : r)) });
  const digits = (v) => v.replace(/\D/g, '');

  function addRow() {
    const last = draft.lineup[draft.lineup.length - 1];
    const start = last?.ends_at || '22:00';
    const endMin = (nightMinutes(start) + 60) % 1440;
    const end = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
    const r = row('', 'guest_star', start, end);
    set({ lineup: [...draft.lineup, r] });
    setTimeout(() => document.getElementById(`f-row-${r.id}-performer`)?.focus(), 0);
  }

  async function save(e) {
    e.preventDefault();
    if (saving) return;
    const sent = { ...draft, lineup: [...draft.lineup].sort((a, b) => startKey(a) - startKey(b)) };
    setDraft(sent);
    setSaving(true);
    setErrors({});
    setFormError('');
    setSaved('');
    try {
      const res = creating
        ? await api('/api/admin/events', { method: 'POST', body: toApi(sent, true) })
        : await api(`/api/admin/events/${sent.date}`, { method: 'PUT', body: toApi(sent, false) });
      qc.setQueryData(['admin-event', res.date], res);
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event', res.date] });
      setSaved(creating ? `${res.name} added for ${dayLabel(res.date)}. It shows on the public site now.` : 'Saved. The public site shows the change now.');
      if (creating) {
        setCreating(false);
        setPick(res.date);
      }
    } catch (err) {
      // lineup.N.field -> row-<id>-field, so a message stays on its row even after rows are removed.
      const errs = Object.fromEntries(
        Object.entries(err.errors ?? {}).map(([k, m]) => {
          const x = k.match(/^lineup\.(\d+)\.(\w+)$/);
          return [x && sent.lineup[x[1]] ? `row-${sent.lineup[x[1]].id}-${x[2]}` : k, m];
        }),
      );
      const unplaced = Object.entries(errs).filter(([k]) => !PLACED.test(k)).flatMap(([, m]) => m);
      setErrors(errs);
      setFormError(Object.keys(errs).length ? unplaced.join(' ') : errorText(err));
    } finally {
      setSaving(false);
    }
  }

  const has = (k) => !!errors[k];
  const ids = (k) => ({ id: `f-${k}`, 'aria-invalid': has(k), 'aria-describedby': has(k) ? `e-${k}` : undefined });
  const err = (k) =>
    errors[k] ? (
      <span id={`e-${k}`} className="err">
        {errors[k].join(' ')}
      </span>
    ) : null;

  let pane;
  if (!creating && detail.isError)
    pane = (
      <div className="card fail" role="alert">
        <p>{detail.error.status ? detail.error.message : "This event didn't load. Check the connection, then try again."}</p>
        <button className="act" onClick={() => detail.refetch()}>
          Try again
        </button>
      </div>
    );

  else if (!draft || (!creating && draft.date !== detail.data?.date))
    pane = (
      <div className="card" role="status" aria-label="Loading the event">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skel" />
        ))}
      </div>
    );
  else {
    const warns = lineupWarnings(draft.lineup, draft.close_time, opens);
    pane = (
      <form ref={formRef} className="card form" onSubmit={save} noValidate>
        <h2 className="head">{creating ? 'New event' : `Edit ${detail.data?.name}`}</h2>
        {creating && (
          <>
            <div className="field">
              <label htmlFor="f-from">Start from</label>
              <select id="f-from" value={startFrom} onChange={(e) => applyStart(e.target.value)}>
                <option value="blank">A blank event</option>
                {events.map((x) => (
                  <option key={x.date} value={x.date}>
                    Copy of {x.name} (prices and places)
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-date">Date</label>
              <input type="date" value={draft.date} onChange={(e) => set({ date: e.target.value })} {...ids('date')} />
              {err('date')}
            </div>
          </>
        )}
        <div className="field">
          <label htmlFor="f-name">Night name</label>
          <input value={draft.name} onChange={(e) => set({ name: e.target.value })} {...ids('name')} />
          {err('name')}
        </div>
        <div className="field">
          <label htmlFor="f-genre">
            Genre<span> (optional)</span>
          </label>
          <input value={draft.genre} onChange={(e) => set({ genre: e.target.value })} {...ids('genre')} />
          {err('genre')}
        </div>
        <div className="field full">
          <label htmlFor="f-blurb">
            Short description <span>(shown on the event page)</span>
          </label>
          <textarea id="f-blurb" rows={2} value={draft.blurb} aria-invalid={has('blurb') || draft.blurb.length > 220} aria-describedby="c-blurb"
            onChange={(e) => set({ blurb: e.target.value })} />
          <span id="c-blurb" className={has('blurb') || draft.blurb.length > 220 ? 'err' : 'hintline'}>
            {errors.blurb?.join(' ') || `${draft.blurb.length} of 220 characters`}
          </span>
        </div>

        <fieldset className="lineup" aria-describedby={has('lineup') ? 'e-lineup' : undefined}>
          <legend>
            Line-up{' '}
            <span>
              ({draft.lineup.length} {draft.lineup.length === 1 ? 'performer' : 'performers'})
            </span>
          </legend>
          {has('lineup') && (
            <span id="e-lineup" className="err" role="alert" tabIndex={-1}>
              {errors.lineup.join(' ')}
            </span>
          )}
          {draft.lineup.map((r, i) => {
            const k = `row-${r.id}`;
            const timeErr = [...new Set([...(errors[`${k}-starts_at`] ?? []), ...(errors[`${k}-ends_at`] ?? [])])];
            const timeProps = { 'aria-invalid': timeErr.length > 0, 'aria-describedby': timeErr.length ? `e-${k}-time` : undefined };
            return (
              <div className="lrow" key={r.id}>
                <div className="field">
                  <label htmlFor={`f-${k}-performer`}>Performer {i + 1}</label>
                  <input value={r.performer} onChange={(e) => setRow(r.id, 'performer', e.target.value)} {...ids(`${k}-performer`)} />
                  {err(`${k}-performer`)}
                </div>
                <div className="field">
                  <label htmlFor={`f-${k}-role`}>Role</label>
                  <select value={r.role} onChange={(e) => setRow(r.id, 'role', e.target.value)} {...ids(`${k}-role`)}>
                    {Object.entries(ROLES).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  {err(`${k}-role`)}
                </div>
                <div className="field">
                  <label htmlFor={`f-${k}-start`}>Start</label>
                  <input id={`f-${k}-start`} type="time" value={r.starts_at} onChange={(e) => setRow(r.id, 'starts_at', e.target.value)} {...timeProps} />
                </div>
                <div className="field">
                  <label htmlFor={`f-${k}-end`}>End</label>
                  <input id={`f-${k}-end`} type="time" value={r.ends_at} onChange={(e) => setRow(r.id, 'ends_at', e.target.value)} {...timeProps} />
                </div>
                <button type="button" className="act" disabled={draft.lineup.length === 1} aria-label={`Remove ${r.performer || `performer ${i + 1}`}`}
                  onClick={() => set({ lineup: draft.lineup.filter((x) => x.id !== r.id) })}>
                  Remove
                </button>
                {timeErr.length > 0 && (
                  <span id={`e-${k}-time`} className="err rowerr">
                    {timeErr.join(' ')}
                  </span>
                )}
              </div>
            );
          })}
          <button type="button" className="btn line addrow" onClick={addRow}>
            + Add performer
          </button>
          {warns.length > 0 && (
            <ul className="warns" role="status">
              {warns.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          <p className="hintline">Sets are sorted by start time when you save. Times after midnight belong to the same night.</p>
        </fieldset>

        <div className="field">
          <label htmlFor="f-guestlist_quota">
            Guestlist places{draft.signed > 0 && <span> ({draft.signed} signed up)</span>}
          </label>
          <input inputMode="numeric" value={draft.guestlist_quota} onChange={(e) => set({ guestlist_quota: digits(e.target.value) })} {...ids('guestlist_quota')} />
          {err('guestlist_quota')}
        </div>
        <div className="field">
          <label htmlFor="f-guestlist_cutoff">Free entry until</label>
          <input type="time" value={draft.guestlist_cutoff} onChange={(e) => set({ guestlist_cutoff: e.target.value })} {...ids('guestlist_cutoff')} />
          {err('guestlist_cutoff')}
        </div>
        <div className="field">
          <label htmlFor="f-close_time">
            Closes at{opens && <span> (doors open at {clock(opens)} every night)</span>}
          </label>
          <input type="time" value={draft.close_time} onChange={(e) => set({ close_time: e.target.value })} {...ids('close_time')} />
          {err('close_time')}
        </div>
        <fieldset className="fs">
          <legend>Minimum spend per table, IDR</legend>
          {ZONES.map(([z, l]) => (
            <div className="field" key={z}>
              <label htmlFor={`f-min_spend.${z}`}>{l}</label>
              <input inputMode="numeric" value={draft.min_spend[z]} onChange={(e) => set({ min_spend: { ...draft.min_spend, [z]: digits(e.target.value) } })}
                {...ids(`min_spend.${z}`)} />
              {err(`min_spend.${z}`)}
            </div>
          ))}
        </fieldset>
        <div className="field full actions">
          {formError && (
            <p className="err" role="alert" tabIndex={-1}>
              {formError}
            </p>
          )}
          <button type="submit" className="btn solid" disabled={saving}>
            {creating ? 'Add event' : `Save ${draft.name || 'event'}`}
          </button>
          {creating && events.length > 0 && (
            <button type="button" className="btn line" onClick={() => openEvent(editKey)}>
              Cancel
            </button>
          )}
          {saved && (
            <span className="ok" role="status">
              {saved}
            </span>
          )}
        </div>
      </form>
    );
  }

  return (
    <>
      <div>
        <h1 className="title head">
          <span className="two">Events</span>
        </h1>
        <p className="sub">Line-up, guestlist places and minimum spend for each night.</p>
      </div>
      <div className="evgrid">
        <div>
          <button className="newbtn" onClick={startCreate} aria-pressed={creating}>
            + New event
          </button>
          {list.isPending ? (
            <div role="status" aria-label="Loading events">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skel" />
              ))}
            </div>
          ) : list.isError ? (
            <div className="fail" role="alert">
              <p>{list.error.status ? list.error.message : "Events didn't load. Check the connection, then try again."}</p>
              <button className="act" onClick={() => list.refetch()}>
                Try again
              </button>
            </div>
          ) : (
            <ul className="evlist">
              {events.map((x) => (
                <li key={x.date}>
                  <button className="evitem" aria-current={!creating && x.date === editKey} onClick={() => openEvent(x.date)}>
                    {x.name}
                    <small>
                      {dayLabel(x.date)} · {x.signed}/{x.guestlist_quota} on list
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {pane}
      </div>
    </>
  );
}
