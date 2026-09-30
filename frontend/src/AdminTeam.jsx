import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorText } from './api.js';
import { Failed, Skel } from './AdminNight.jsx';
import { lastSeen, ROLE_LABEL, STAFF_STATUS } from './tonight.js';
import { Badge, Confirm } from './ui.jsx';

// Team (S8), from the Team page of fanglle-pengelola-mockup.jsx. The server holds every rule (F15, StaffPolicy): not
// yourself, always one active manager. A refusal comes back as a sentence and is shown as it is.

const staffQuery = { queryKey: ['admin', 'staff'], queryFn: () => api('/api/admin/staff') };
const blankInvite = { name: '', email: '', role: 'door' };

// Actions that ask first. The mockup confirms disable and cancel invite; a reset also signs the person out on every
// device at once, so it asks too.
const CONFIRM = {
  disable: {
    title: (s) => `Disable ${s.name}?`,
    text: () => "They're signed out of every device straight away. Their past check-ins stay in the door log.",
    button: 'Disable account',
    call: (s) => api(`/api/admin/staff/${s.id}/disable`, { method: 'POST' }),
    done: (s) => `${s.name} can't sign in any more. Their past check-ins stay in the door log.`,
  },
  uninvite: {
    title: (s) => `Cancel the invite for ${s.name}?`,
    text: () => 'The invite link stops working. You can invite them again later.',
    button: 'Cancel invite',
    call: (s) => api(`/api/admin/staff/${s.id}/invite`, { method: 'DELETE' }),
    done: (s) => `Invite for ${s.name} cancelled. The link no longer works.`,
  },
  reset: {
    title: (s) => `Reset ${s.name}'s password?`,
    text: (s) => `They're signed out of every device straight away. ${s.email} gets a link to set a new password.`,
    button: 'Reset password',
    call: (s) => api(`/api/admin/staff/${s.id}/reset-password`, { method: 'POST' }),
    done: (s) => `Password reset link sent to ${s.email}.`,
  },
};

function InviteForm({ onDone, onCancel }) {
  const [form, setForm] = useState(blankInvite);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    ref.current.querySelector('[aria-invalid="true"], [role="alert"]')?.focus();
  }, [errors, message]);

  async function send(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    setMessage('');
    try {
      await api('/api/admin/staff', { method: 'POST', body: form });
      onDone(form.email);
    } catch (err) {
      setErrors(err.errors ?? {});
      if (!Object.keys(err.errors ?? {}).length) setMessage(errorText(err));
      setBusy(false);
    }
  }

  const field = (key, label, input) => (
    <div className="field">
      <label htmlFor={`i-${key}`}>{label}</label>
      {input({
        id: `i-${key}`,
        value: form[key],
        'aria-invalid': !!errors[key],
        'aria-describedby': errors[key] ? `ie-${key}` : undefined,
        onChange: (e) => setForm({ ...form, [key]: e.target.value }),
      })}
      {errors[key] && (
        <span id={`ie-${key}`} className="err">
          {errors[key].join(' ')}
        </span>
      )}
    </div>
  );

  return (
    <form ref={ref} className="card form invite" onSubmit={send} noValidate>
      <h2 className="head">Invite to the team</h2>
      {field('name', 'Name', (p) => <input {...p} autoFocus autoComplete="off" />)}
      {field('email', 'Email', (p) => <input {...p} type="email" autoComplete="off" />)}
      {field('role', 'Role', (p) => (
        <select {...p}>
          <option value="door">Door staff</option>
          <option value="manager">Manager</option>
        </select>
      ))}
      {message && (
        <p className="err full" role="alert" tabIndex={-1}>
          {message}
        </p>
      )}
      <div className="field full actions">
        <button type="submit" className="btn solid" disabled={busy}>
          {busy ? 'Sending...' : 'Send invite'}
        </button>
        <button type="button" className="btn line" onClick={onCancel}>
          Cancel
        </button>
        <span className="hintline">They set their own password from the email. The link works for 48 hours.</span>
      </div>
    </form>
  );
}

export default function Team({ flash }) {
  const qc = useQueryClient();
  const list = useQuery(staffQuery);
  const [inviting, setInviting] = useState(false);
  const [ask, setAsk] = useState(null); // { kind, s }
  const [busy, setBusy] = useState(null); // id of the row whose action is on its way
  const c = ask && CONFIRM[ask.kind];

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'staff'] });

  // Role change, enable, resend: straight away, with the server's answer in the message line.
  async function act(s, call, done) {
    setBusy(s.id);
    try {
      await call();
      flash(done);
    } catch (e) {
      flash(errorText(e));
    }
    await refresh();
    setBusy(null);
  }

  // The mockup's "Copy link": the same link as in the email, sent by the server only while the invite still works.
  function copyLink(s) {
    const shown = () => flash(`Copy failed. The link is ${s.invite_url}`);
    if (!navigator.clipboard?.writeText) return shown();
    navigator.clipboard.writeText(s.invite_url).then(() => flash(`Invite link for ${s.name} copied.`), shown);
  }

  const staff = list.data?.staff ?? [];
  return (
    <>
      <div>
        <h1 className="title head">
          <span className="two">Team</span>
        </h1>
        <p className="sub">Who can sign in, and what they can do.</p>
      </div>
      <div className="roles">
        <div className="card">
          <b>Manager</b>
          <p>Everything in this panel: bookings, guestlist, events and the team.</p>
        </div>
        <div className="card">
          <b>Door staff</b>
          <p>The door scanner only. Every check-in is logged under their name.</p>
        </div>
      </div>
      <div className="toolbar">
        <button className="btn solid" aria-expanded={inviting} onClick={() => setInviting(!inviting)}>
          {inviting ? 'Close invite' : 'Invite someone'}
        </button>
      </div>
      {inviting && (
        <InviteForm
          onCancel={() => setInviting(false)}
          onDone={async (email) => {
            setInviting(false);
            flash(`Invite sent to ${email}. The link works for 48 hours.`);
            await refresh();
          }}
        />
      )}
      <div className="tablewrap">
        {list.isPending ? (
          <Skel label="Loading the team" />
        ) : !list.data ? (
          <Failed q={list} what="The team" />
        ) : !staff.length ? (
          <div className="empty">No one on the team yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Person</th>
                <th>Role</th>
                <th className="c">Status</th>
                <th>Last sign-in</th>
                <th className="c">
                  <span className="vh">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} aria-busy={busy === s.id || undefined}>
                  <td>
                    {s.name}
                    <small>{s.email}</small>
                  </td>
                  <td>
                    {s.you || s.status === 'disabled' ? (
                      ROLE_LABEL[s.role]
                    ) : (
                      <select
                        className="select role"
                        aria-label={`Role for ${s.name}`}
                        value={s.role}
                        disabled={busy === s.id}
                        onChange={(e) => {
                          const role = e.target.value;
                          act(
                            s,
                            () => api(`/api/admin/staff/${s.id}`, { method: 'PATCH', body: { role } }),
                            `${s.name} is now ${ROLE_LABEL[role]}. It applies the next time they sign in.`,
                          );
                        }}
                      >
                        <option value="door">Door staff</option>
                        <option value="manager">Manager</option>
                      </select>
                    )}
                  </td>
                  <td className="c">
                    <Badge tone={STAFF_STATUS[s.status][1]}>{STAFF_STATUS[s.status][0]}</Badge>
                  </td>
                  <td>{lastSeen(s)}</td>
                  <td className="c">
                    <div className="rowacts">
                      {s.you && <span className="hintline">This is you</span>}
                      {!s.you && s.status === 'active' && (
                        <>
                          <button className="act" onClick={() => setAsk({ kind: 'reset', s })}>
                            Reset password
                          </button>
                          <button className="act danger" onClick={() => setAsk({ kind: 'disable', s })}>
                            Disable
                          </button>
                        </>
                      )}
                      {s.status === 'invited' && (
                        <>
                          <button
                            className="act"
                            disabled={busy === s.id}
                            onClick={() => act(s, () => api(`/api/admin/staff/${s.id}/resend-invite`, { method: 'POST' }), `Invite sent again to ${s.email}.`)}
                          >
                            Resend invite
                          </button>
                          {s.invite_url && (
                            <button className="act" onClick={() => copyLink(s)}>
                              Copy link
                            </button>
                          )}
                          <button className="act danger" onClick={() => setAsk({ kind: 'uninvite', s })}>
                            Cancel invite
                          </button>
                        </>
                      )}
                      {s.status === 'disabled' && (
                        <button
                          className="act"
                          disabled={busy === s.id}
                          onClick={() => act(s, () => api(`/api/admin/staff/${s.id}/enable`, { method: 'POST' }), `${s.name} can sign in again.`)}
                        >
                          Enable
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {c && (
        <Confirm
          title={c.title(ask.s)}
          text={c.text(ask.s)}
          button={c.button}
          run={async () => {
            await c.call(ask.s);
            flash(c.done(ask.s));
            await refresh();
          }}
          onClose={() => setAsk(null)}
        />
      )}
    </>
  );
}
