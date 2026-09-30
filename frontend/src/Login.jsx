import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api, errorText } from './api.js';
import { Button, Solo } from './ui.jsx';

// ?next= is honoured only inside the staff regions; anything else (other hosts, //host, public pages) goes home.
const staffPath = (p) => /^\/(admin|door)(?=[/?#]|$)/.test(p || '');

export default function Login() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const out = useLocation().state?.out; // role that just signed out, if any
  const [form, setForm] = useState({ email: useLocation().state?.email ?? '', password: '' }); // email: from the invite page
  const [fail, setFail] = useState(null);
  const [busy, setBusy] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    if (fail) formRef.current.querySelector('[aria-invalid="true"], [role="alert"]')?.focus();
  }, [fail]);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setFail(null);
    try {
      const me = await api('/api/login', { method: 'POST', body: form });
      qc.setQueryData(['me'], me);
      const next = params.get('next');
      const allowed = staffPath(next) && (me.role === 'manager' || next.startsWith('/door'));
      navigate(allowed ? next : me.role === 'manager' ? '/admin' : '/door', { replace: true });
    } catch (err) {
      const errors = err.errors || {};
      // 422 with field errors shows them under the fields; everything else (403, 419, 429, network) as one sentence.
      setFail({ errors, message: errors.email || errors.password ? '' : errorText(err) });
      setBusy(false);
    }
  }

  const errs = fail?.errors || {};
  const field = (key, label, type, autoComplete) => (
    <div className="field">
      <label htmlFor={`l-${key}`}>{label}</label>
      <input
        id={`l-${key}`}
        type={type}
        autoComplete={autoComplete}
        autoFocus={key === 'email'}
        value={form[key]}
        aria-invalid={!!errs[key]}
        aria-describedby={errs[key] ? `le-${key}` : undefined}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
      {errs[key] && <span id={`le-${key}`} className="err">{errs[key].join(' ')}</span>}
    </div>
  );

  return (
    <Solo>
      <h1 className="head">{out ? 'Signed out' : 'Sign in'}</h1>
      {out === 'manager' && <p className="sub">Door devices use their own account, so scanning at the door keeps working.</p>}
      <form ref={formRef} onSubmit={submit} noValidate>
        {field('email', 'Email', 'email', 'username')}
        {field('password', 'Password', 'password', 'current-password')}
        {fail?.message && (
          <p className="err" role="alert" tabIndex={-1}>
            {fail.message}
          </p>
        )}
        <Button type="submit">{busy ? 'Signing in...' : out ? 'Sign in again' : 'Sign in'}</Button>
      </form>
    </Solo>
  );
}

// /invite/:token (S8, F15): a new team member, or someone a manager reset, sets a password. The link only says whether it
// works once it is used: the server keeps the token's hash and answers on accept (404 unknown, 410 used or expired).
export function Invite() {
  const { token } = useParams();
  const [form, setForm] = useState({ password: '', password_confirmation: '' });
  const [fail, setFail] = useState(null);
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    if (fail) formRef.current?.querySelector('[aria-invalid="true"], [role="alert"]')?.focus();
  }, [fail]);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setFail(null);
    try {
      setDone(await api(`/api/invites/${encodeURIComponent(token)}/accept`, { method: 'POST', body: form, guest: true }));
    } catch (err) {
      setFail({ status: err.status, errors: err.errors || {}, message: err.errors?.password ? '' : errorText(err) });
      setBusy(false);
    }
  }

  if (done)
    return (
      <Solo>
        <h1 className="head">Password set</h1>
        <p className="sub">
          Sign in with {done.email} to open {done.role === 'manager' ? 'the manager panel' : 'the door scanner'}.
        </p>
        <Link className="btn solid" to="/login" state={{ email: done.email }}>
          Sign in
        </Link>
      </Solo>
    );

  // A link that is unknown, used or expired won't work however often it is tried.
  if (fail?.status === 404 || fail?.status === 410)
    return (
      <Solo>
        <h1 className="head">{fail.status === 410 ? 'This link has run out' : "This link doesn't work"}</h1>
        <p className="sub" role="alert">
          {fail.message}
        </p>
        <p className="sub">A manager can send a new one from the Team page.</p>
      </Solo>
    );

  const errs = fail?.errors || {};
  const field = (key, label) => (
    <div className="field">
      <label htmlFor={`v-${key}`}>{label}</label>
      <input
        id={`v-${key}`}
        type="password"
        autoComplete="new-password"
        autoFocus={key === 'password'}
        value={form[key]}
        aria-invalid={!!errs[key]}
        aria-describedby={errs[key] ? `ve-${key}` : key === 'password' ? 'v-hint' : undefined}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
      {errs[key] && (
        <span id={`ve-${key}`} className="err">
          {errs[key].join(' ')}
        </span>
      )}
    </div>
  );

  return (
    <Solo>
      <h1 className="head">Set your password</h1>
      <p className="sub">You'll use it to sign in to The Fanglle II.</p>
      <form ref={formRef} onSubmit={submit} noValidate>
        {field('password', 'New password')}
        <p id="v-hint" className="hintline">
          At least 10 characters.
        </p>
        {field('password_confirmation', 'Type it again')}
        {fail?.message && (
          <p className="err" role="alert" tabIndex={-1}>
            {fail.message}
          </p>
        )}
        <Button type="submit">{busy ? 'Saving...' : 'Set password'}</Button>
      </form>
    </Solo>
  );
}
