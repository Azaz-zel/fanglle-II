import { useEffect, useRef, useState } from 'react';
import { errorText } from './api.js';

export const Mark = () => (
  <>
    THE FANGLLE <span className="two">II</span>
  </>
);

// Centred card from the "Signed out" screen in fanglle-pengelola-mockup.jsx.
export const Solo = ({ children }) => (
  <main className="center">
    <div className="card solo">
      <div className="brand head">
        <Mark />
      </div>
      {children}
    </div>
  </main>
);

export const Button = ({ variant = 'solid', className = '', ...rest }) => (
  <button className={`btn ${variant} ${className}`} {...rest} />
);

export const Chip = ({ pressed, count, children, ...rest }) => (
  <button type="button" className="chip" aria-pressed={pressed} {...rest}>
    {children}
    {count !== undefined && <em>{count}</em>}
  </button>
);

// tone: held | paid | in | off
export const Badge = ({ tone, children }) => <span className={`badge b-${tone}`}>{children}</span>;

// Native modal <dialog>: Escape closes it (browser "cancel"), focus goes back to whatever opened it.
export function Dialog({ open, onClose, className = '', children, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement;
    ref.current.showModal();
    const d = ref.current;
    return () => {
      if (d.open) d.close();
      trigger?.focus?.();
    };
  }, [open]);

  // A click on the dialog element itself outside its box is a click on the backdrop.
  const onClick = (e) => {
    if (e.target !== e.currentTarget) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose();
  };

  return (
    <dialog ref={ref} className={`dlg ${className}`} onClose={onClose} onClick={onClick} {...rest}>
      {children}
    </dialog>
  );
}

// Yes or no before an action that can't be taken back, from the admin mockup. run: the action. Its error stays in the
// dialog; success closes it.
export function Confirm({ title, text, button, run, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function yes() {
    setBusy(true);
    setError('');
    try {
      await run();
      onClose();
    } catch (e) {
      setError(errorText(e));
      setBusy(false);
    }
  }

  return (
    <Dialog open onClose={onClose} role="alertdialog" aria-labelledby="cf-t" aria-describedby="cf-d">
      <h2 id="cf-t" className="head">
        {title}
      </h2>
      <p id="cf-d">{text}</p>
      {error && (
        <p className="err" role="alert">
          {error}
        </p>
      )}
      <div className="drow">
        <button className="btn solid" disabled={busy} onClick={yes}>
          {busy ? 'Working...' : button}
        </button>
        <button className="btn line" onClick={onClose}>
          Keep it
        </button>
      </div>
    </Dialog>
  );
}
