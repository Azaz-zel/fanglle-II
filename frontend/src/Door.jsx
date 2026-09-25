import { SignOut, Staff } from './staff.jsx';
import { Mark } from './ui.jsx';

// Door region: /door, door staff and managers. The scanner arrives in S6.
export default function Door() {
  return (
    <Staff roles={['door', 'manager']}>
      {(me) => (
        <div className="doorapp">
          <header className="top">
            <div>
              <div className="brand head">
                <Mark />
              </div>
              <div className="n">Signed in as {me.name}</div>
            </div>
            <SignOut role={me.role} />
          </header>
          <main>
            <p className="sub">This page isn't available yet.</p>
          </main>
        </div>
      )}
    </Staff>
  );
}
