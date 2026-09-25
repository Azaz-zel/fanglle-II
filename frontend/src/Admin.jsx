import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import Events from './AdminEvents.jsx';
import { SignOut, Staff } from './staff.jsx';
import { Mark } from './ui.jsx';

// Manager region: /admin/*. Door staff are sent to /door by Staff.
// The side menu lists only pages that exist; Overview (S7) replaces the /admin redirect, the rest join in their slices.
export default function Admin() {
  return (
    <Staff roles={['manager']}>
      {(me) => (
        <div className="app">
          <nav className="side" aria-label="Manager">
            <span className="brand head">
              <Mark />
            </span>
            <div className="grp">Setup</div>
            <NavLink className="navbtn" to="/admin/events">
              Events
            </NavLink>
            <span className="spacer" />
            <SignOut role={me.role} />
          </nav>
          <div className="main">
            <div className="topbar">
              <span>Signed in as {me.name}</span>
            </div>
            <main className="content">
              <Routes>
                <Route index element={<Navigate to="events" replace />} />
                <Route path="events" element={<Events />} />
                <Route path="*" element={<p className="sub">This page isn't available yet.</p>} />
              </Routes>
            </main>
          </div>
        </div>
      )}
    </Staff>
  );
}
