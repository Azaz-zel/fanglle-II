import { SignOut, Staff } from './staff.jsx';
import { Mark } from './ui.jsx';

// Manager region: /admin/*. Door staff are sent to /door by Staff. Pages and the side menu arrive from S2 on.
export default function Admin() {
  return (
    <Staff roles={['manager']}>
      {(me) => (
        <div className="app">
          <header className="side">
            <span className="brand head">
              <Mark />
            </span>
            <span className="spacer" />
            <SignOut role={me.role} />
          </header>
          <div className="main">
            <div className="topbar">
              <span>Signed in as {me.name}</span>
            </div>
            <main className="content">
              <p className="sub">This page isn't available yet.</p>
            </main>
          </div>
        </div>
      )}
    </Staff>
  );
}
