import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
  const [form, setForm] = useState({ email: '', password: '' });
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
