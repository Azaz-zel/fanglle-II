import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Events from './AdminEvents.jsx';
import { Bookings, clubNow, DoorLog, Drawer, eventsQuery, Guestlist, nightQuery, Overview } from './AdminNight.jsx';
import Team from './AdminTeam.jsx';
import { clock, dayParts, gelOf } from './night.js';
import { SignOut, Staff } from './staff.jsx';
import { Mark } from './ui.jsx';
import './admin.css';

// Manager region: /admin/*. Door staff are sent to /door by Staff.
// The side menu lists only pages that exist, in the two groups of the Sorot board AdminOverview.
const NAV = [
  ['Night', [['/admin', 'Overview'], ['/admin/tables', 'Table bookings'], ['/admin/guestlist', 'Guestlist'], ['/admin/door', 'Door log']]],
  ['Planning', [['/admin/events', 'Events'], ['/admin/team', 'Team']]],
];

// Re-render now and then, so the club's clock and the held-table minutes keep moving between refreshes.
function useTick(ms) {
  const [, set] = useState(0);
  useEffect(() => {
    const id = setInterval(() => set((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

function Shell({ me }) {
  const [date, setDate] = useState(null); // the night picked in the top bar; null is the server's choice
  const night = useQuery(nightQuery(date));
  const events = useQuery(eventsQuery);
  const [drawer, setDrawer] = useState(null);
  const [flash, setFlash] = useState('');
  useTick(30_000);

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(''), 4000);
    return () => clearTimeout(id);
  }, [flash]);

  const t = night.data;
  const held = t?.held?.length ?? 0;
  const page = { night, open: setDrawer, at: drawer };

  const nights = events.data?.events ?? (t?.event ? [t.event] : []);

  // The whole panel is lit by the picked night's gel; with no night at all it keeps Thursday's, the default.
  return (
    <div className={`app gel-${t?.event ? gelOf(t.event.date) : 'thu'}`}>
      <nav className="side" aria-label="Manager">
        <span className="mark">
          <Mark />
        </span>
        {NAV.map(([group, items]) => (
          <div key={group} className="navgrp">
            <div className="label grp">{group}</div>
            {items.map(([to, label]) => (
              <NavLink key={to} className="navbtn" to={to} end={to === '/admin'}>
                {label}
                {to === '/admin/tables' && held > 0 && (
                  <span className="count tnum" aria-label={`${held} held`}>
                    {held}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
        <span className="spacer" />
        <SignOut role={me.role} />
      </nav>
      <div className="main">
        <div className="topbar">
          {!t?.event ? (
            <span />
          ) : (
            <div className="nights" role="group" aria-label="Night">
              {nights.map((n) => {
                const d = dayParts(n.date);
                return (
                  <button key={n.date} type="button" className={`gel-${gelOf(n.date)}`} aria-pressed={n.date === (date ?? t.event.date)} onClick={() => setDate(n.date)}>
                    <span className="tnum">
                      {d.day} {d.date} {d.month}
                      {n.date === t.tonight && ', tonight'}
                    </span>
                    <b>{n.name}</b>
                  </button>
                );
              })}
            </div>
          )}
          <span className="tnum">
            Signed in as {me.name}, {me.role}
            {t?.event && ` · ${clock(clubNow(t))}`}
          </span>
        </div>
        <main className="content">
          <div role="status" className="flashbox">
            {flash && <div className="flash">{flash}</div>}
          </div>
          <Routes>
            <Route index element={<Overview {...page} />} />
            <Route path="tables" element={<Bookings {...page} />} />
            <Route path="guestlist" element={<Guestlist {...page} />} />
            <Route path="door" element={<DoorLog {...page} />} />
            <Route path="events" element={<Events />} />
            <Route path="team" element={<Team flash={setFlash} />} />
            <Route
              path="*"
              element={
                <div className="nothing">
                  <h1 className="d title">Page not found</h1>
                  <Link className="btn line" to="/admin">
                    Go to the overview
                  </Link>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
      {drawer && t?.event && <Drawer at={drawer} date={t.event.date} onClose={() => setDrawer(null)} flash={setFlash} />}
    </div>
  );
}

export default function Admin() {
  return <Staff roles={['manager']}>{(me) => <Shell me={me} />}</Staff>;
}
