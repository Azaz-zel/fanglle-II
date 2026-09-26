import { Component, StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Button, Solo } from './ui.jsx';
import './styles.css';

// One chunk per region: /p/:id on a guest's phone never downloads the door scanner or the admin panel.
const publicPage = (name) => lazy(() => import('./Public.jsx').then((m) => ({ default: m[name] })));
const Home = publicPage('Home');
const EventPage = publicPage('EventPage');
const Book = publicPage('Book');
const Booking = publicPage('Booking');
const Guestlist = publicPage('Guestlist');
// The guest's QR page is its own region: qrcode and idb stay out of every other page.
const Pass = lazy(() => import('./Pass.jsx'));
const Login = lazy(() => import('./Login.jsx'));
const Door = lazy(() => import('./Door.jsx'));
const Admin = lazy(() => import('./Admin.jsx'));

const NotFound = () => (
  <Solo>
    <h1 className="head">Page not found</h1>
    <p className="sub">The address may be incomplete or copied wrong.</p>
    <Link className="btn solid" to="/">
      Go to the home page
    </Link>
  </Solo>
);

// A region chunk that fails to download (offline, or replaced by a newer build) lands here, not on a blank page.
class LoadError extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Solo>
        <h1 className="head">This page didn't load</h1>
        <p className="sub">Check the connection, then reload.</p>
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </Solo>
    );
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Retry only when the request never got an answer; a 404 or 422 won't change on its own. */}
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: (n, e) => !e.status && n < 2 } } })}>
      <BrowserRouter>
        <LoadError>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/events/:date" element={<EventPage />} />
              <Route path="/book/:date" element={<Book />} />
              <Route path="/booking/:code" element={<Booking />} />
              <Route path="/guestlist/:date" element={<Guestlist />} />
              <Route path="/p/:id" element={<Pass />} />
              <Route path="/login" element={<Login />} />
              <Route path="/door" element={<Door />} />
              <Route path="/admin/*" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </LoadError>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
