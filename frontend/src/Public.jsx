import { Link } from 'react-router-dom';
import { Mark } from './ui.jsx';

// Public region: / and /p/:id. Home arrives in S2, the QR page in S5.
export default function Public() {
  return (
    <div className="site">
      <header className="nav">
        <div className="navin">
          <Link to="/" className="mark head">
            <Mark />
          </Link>
        </div>
      </header>
      <main className="wrap">
        <p className="sub">This page isn't available yet.</p>
      </main>
    </div>
  );
}
