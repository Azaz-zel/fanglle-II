import { useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Events from './AdminEvents.jsx';
import { Bookings, clubNow, DoorLog, Drawer, Guestlist, Overview, tonightQuery } from './AdminNight.jsx';
import { dayLabel } from './night.js';
import { SignOut, Staff } from './staff.jsx';
import { Mark } from './ui.jsx';

// Manager region: /admin/*. Door staff are sent to /door by Staff.
// The side menu lists only pages that exist; Team joins in S8.
const NAV = [
  ['Tonight', [['/admin', 'Overview']]],
  ['Operations', [['/admin/tables', 'Table bookings'], ['/admin/guestlist', 'Guestlist'], ['/admin/door', 'Door log']]],
  ['Setup', [['/admin/events', 'Events']]],
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
  const night = useQuery(tonightQuery);
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
  const page = { night, open: setDrawer };

  return (
    <div className="app">
      <nav className="side" aria-label="Manager">
        <span className="brand head">
          <Mark />
        </span>
        {NAV.map(([group, items]) => (
          <div key={group} className="navgrp">
            <div className="grp">{group}</div>
            {items.map(([to, label]) => (
              <NavLink key={to} className="navbtn" to={to} end={to === '/admin'}>
                {label}
                {to === '/admin/tables' && held > 0 && (
                  <span className="count" aria-label={`${held} held`}>
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
          <span>Signed in as {me.name}</span>
          {t?.event && (
            <span>
              {dayLabel(t.event.date)} · {clubNow(t)}
            </span>
          )}
        </div>
        <main className="content">
          <div role="status">{flash && <div className="flash">{flash}</div>}</div>
          <Routes>
            <Route index element={<Overview {...page} />} />
            <Route path="tables" element={<Bookings {...page} />} />
            <Route path="guestlist" element={<Guestlist {...page} />} />
            <Route path="door" element={<DoorLog {...page} />} />
            <Route path="events" element={<Events />} />
            <Route path="*" element={<p className="sub">This page isn't available yet.</p>} />
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
