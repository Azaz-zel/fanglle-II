import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorText } from './api.js';
import { Button, Solo } from './ui.jsx';

// Staff-only gate for /door and /admin. children(me) renders once the session is known and the role fits.
export function Staff({ roles, children }) {
  const me = useQuery({ queryKey: ['me'], queryFn: () => api('/api/me'), retry: false });
  const loc = useLocation();

  if (me.isPending)
    return (
      <Solo>
        <p className="sub" role="status">Checking your sign-in...</p>
      </Solo>
    );
  if (me.error?.status === 401)
    return <Navigate replace to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} />;
  if (me.error)
    return (
      <Solo>
        <p role="alert">{errorText(me.error)}</p>
        <Button variant="line" onClick={() => me.refetch()}>Try again</Button>
      </Solo>
    );
  if (!roles.includes(me.data.role)) return <Navigate replace to="/door" />;
  return children(me.data);
}

export function SignOut({ role }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  async function signOut() {
    setError('');
    try {
      await api('/api/logout', { method: 'POST' });
    } catch (e) {
      // 401: the session is already gone, which is what we wanted. Anything else: still signed in, say so.
      if (e.status !== 401) return setError(errorText(e));
    }
    navigate('/login', { replace: true, state: { out: role } });
    qc.clear();
  }

  return (
    <>
      <button className="out" onClick={signOut}>Sign out</button>
      {error && <span className="err" role="alert">{error}</span>}
    </>
  );
}
