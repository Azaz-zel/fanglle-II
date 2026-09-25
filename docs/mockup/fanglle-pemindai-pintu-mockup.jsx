import React, { useState, useEffect, useRef } from "react";

const GUESTS = [
  { id: "g1", kind: "group", name: "Ayu Pratiwi", phone: "1234", people: 4, inside: 0, night: "thu" },
  { id: "g2", kind: "person", name: "Kadek Surya", phone: "8821", people: 1, inside: 0, night: "thu", organiser: "Ayu Pratiwi" },
  { id: "g3", kind: "table", name: "Made Wirawan", phone: "4410", people: 7, inside: 3, night: "thu", table: "B5" },
  { id: "g4", kind: "group", name: "Putu Ananda", phone: "0937", people: 2, inside: 2, night: "thu", usedAt: "22:14" },
  { id: "g5", kind: "group", name: "Nyoman Ari", phone: "5563", people: 3, inside: 0, night: "fri" },
  { id: "g6", kind: "table", name: "Wayan Dharma", phone: "7702", people: 10, inside: 0, night: "thu", table: "B2" },
  { id: "g7", kind: "person", name: "Luh Sari", phone: "3319", people: 1, inside: 0, night: "thu", organiser: "Wayan Dharma" },
];

const SCANS = [
  ["g1", "Grup valid"], ["g2", "Per orang"], ["g3", "Meja"], ["g4", "Sudah dipakai"],
  ["g5", "Malam lain"], ["late", "Lewat jam 11"], ["fake", "QR palsu"],
];

export default function App() {
  const [guests, setGuests] = useState(GUESTS);
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState(null);
  const [count, setCount] = useState(1);
  const [view, setView] = useState("scan");
  const [query, setQuery] = useState("");
  const [offline, setOffline] = useState(false);
  const [pending, setPending] = useState(0);
  const [log, setLog] = useState([{ name: "Putu Ananda", n: 2, at: "22:14" }]);
  const [totals, setTotals] = useState({ in: 148, gl: 96, tb: 14 });
  const audio = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  useEffect(() => {
    if (!offline && pending > 0) {
      const id = setTimeout(() => setPending(0), 1500);
      return () => clearTimeout(id);
    }
  }, [offline, pending]);

  function start() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audio.current = new Ctx();
      audio.current.resume();
    } catch {
      audio.current = null;
    }
    setStarted(true);
  }

  function beep(ok) {
    const ctx = audio.current;
    if (!ctx) return;
    const tones = ok ? [[880, 0, 0.18]] : [[220, 0, 0.16], [220, 0.22, 0.16]];
    tones.forEach(([f, d, len]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = ok ? "sine" : "square";
      o.frequency.value = f;
      const t = ctx.currentTime + d;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(ok ? 0.3 : 0.12, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + len + 0.02);
    });
  }

  function open(id) {
    let r;
    if (id === "fake") r = { tone: "bad", title: "Not a Fanglle QR", sub: "The code isn't signed by us. It may be edited or from somewhere else." };
    else if (id === "late") {
      const g = guests.find((x) => x.id === "g1");
      r = { tone: "warn", title: "Guestlist closed at 11 pm", sub: `${g.name}, group of ${g.people}. Free entry ended at 11 pm.`, guest: g, override: true };
    } else {
      const g = guests.find((x) => x.id === id);
      if (g.night !== "thu") r = { tone: "warn", title: "Wrong night", sub: `${g.name}'s QR is for Fri 25 Sep, Second Wave.`, guest: g };
      else if (g.inside >= g.people) r = { tone: "bad", title: "Already used", sub: `${g.name}, all ${g.people} checked in${g.usedAt ? ` at ${g.usedAt}` : ""}. This QR can't enter again.`, guest: g };
      else r = { tone: "ok", title: g.kind === "table" ? `Table ${g.table}` : "Welcome in", guest: g };
    }
    setResult(r);
    setCount(r.guest ? Math.max(1, r.guest.people - r.guest.inside) : 1);
    beep(r.tone === "ok");
  }

  function letIn(n, override) {
    const g = result.guest;
    const at = override ? "23:12" : "22:31";
    setGuests(guests.map((x) => (x.id === g.id ? { ...x, inside: x.inside + n, usedAt: x.inside + n >= x.people ? at : x.usedAt } : x)));
    setLog([{ name: g.name, n, at, override }, ...log].slice(0, 5));
    setTotals({ in: totals.in + n, gl: totals.gl + (g.kind === "table" ? 0 : n), tb: totals.tb });
    if (offline) setPending(pending + 1);
    setResult(null);
    setView("scan");
  }

  const q = query.trim().toLowerCase();
  const matches = q.length < 2 ? [] : guests.filter((g) => g.night === "thu" && (g.name.toLowerCase().includes(q) || g.phone.includes(q)));

  const css = `
@import url('https://fonts.googleapis.com/css2?family=Poiret+One&family=Didact+Gothic&display=swap');
:root{
  --obsidian:#0C0812; --surface:#150E1F; --raised:#1E1530; --line:#2E2342; --amethyst-soft:#7A5BA6;
  --text:#EEE9F3; --soft:#C9BDD9; --muted:#A99DB8; --garnet:#A3162F; --garnet-text:#E5566B;
  --ok:#0F6B38; --ok-text:#F2FFF6; --ok-sub:#D2F2DE; --bad:#A3162F; --bad-text:#FBF7FB; --bad-sub:#F6D9DE;
  --warn:#C77A12; --warn-text:#140A00; --warn-sub:#2A1600;
  --head:'Poiret One','Helvetica Neue',Arial,sans-serif; --body:'Didact Gothic','Helvetica Neue',Arial,sans-serif;
}
*{box-sizing:border-box;margin:0;padding:0}
.root{min-height:100vh;background:#050308;padding:20px 12px 170px;display:flex;justify-content:center;font-family:var(--body)}
.dev{position:relative;width:100%;max-width:460px;min-height:820px;background:var(--obsidian);color:var(--text);border:10px solid #000;
  border-radius:28px;overflow:hidden;display:flex;flex-direction:column;font-size:17px;line-height:1.5}
.top{padding:14px 18px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.top .t{font-family:var(--head);font-size:20px;letter-spacing:.06em}
.top .n{font-size:14px;color:var(--muted)}
.sync{padding:8px 18px;font-size:14px;color:var(--muted);border-bottom:1px solid var(--line);display:flex;align-items:center;gap:8px}
.sync.off{color:var(--text);background:var(--raised)}
.dot{width:8px;height:8px;border-radius:50%;background:#3FA66B;flex:none}
.sync.off .dot{background:#C77A12}
.nums{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid var(--line)}
.nums div{padding:12px 10px;text-align:center;border-right:1px solid var(--line)}
.nums div:last-child{border-right:0}
.nums strong{display:block;font-family:var(--head);font-weight:400;font-size:26px}
.nums span{font-size:13px;color:var(--muted)}
.main{flex:1;padding:18px;display:flex;flex-direction:column;gap:14px}
.cam{position:relative;aspect-ratio:1;background:#000;border:1px solid var(--line);display:flex;align-items:center;justify-content:center}
.frame{width:62%;aspect-ratio:1;border:3px solid var(--text);border-radius:10px}
.cam p{position:absolute;bottom:14px;left:0;right:0;text-align:center;font-size:15px;color:var(--soft)}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:56px;padding:12px 18px;font-family:var(--body);
  font-size:17px;border-radius:4px;cursor:pointer;width:100%}
.btn.solid{background:var(--text);color:var(--obsidian);border:1px solid var(--text)}
.btn.line{background:transparent;color:var(--text);border:1px solid var(--amethyst-soft)}
.btn:focus-visible,.cnt button:focus-visible,.sim button:focus-visible,input:focus-visible,.res:focus-visible{outline:3px solid #FFFFFF;outline-offset:3px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.startwrap{flex:1;display:flex;flex-direction:column;justify-content:center;gap:16px;padding:28px}
.startwrap h1{font-family:var(--head);font-weight:400;font-size:32px;line-height:1.15}
.startwrap p{color:var(--muted)}
.field{display:flex;flex-direction:column;gap:6px}
.field input{min-height:56px;padding:10px 14px;background:var(--surface);border:1px solid var(--line);border-radius:4px;color:var(--text);
  font-family:var(--body);font-size:18px}
.list{list-style:none;border-top:1px solid var(--line)}
.list li{border-bottom:1px solid var(--line)}
.list button{width:100%;text-align:left;background:transparent;border:0;color:var(--text);font-family:var(--body);font-size:17px;
  padding:14px 4px;min-height:56px;cursor:pointer;display:flex;justify-content:space-between;gap:10px}
.list button:hover{background:var(--surface)}
.list small{color:var(--muted);font-size:14px}
.hint{font-size:14px;color:var(--muted)}
.log{list-style:none;font-size:15px}
.log li{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line)}
.log span{color:var(--muted)}

.res{position:absolute;inset:0;display:flex;flex-direction:column;padding:28px 22px;gap:16px;z-index:5}
.res.ok{background:var(--ok);color:var(--ok-text)}
.res.bad{background:var(--bad);color:var(--bad-text)}
.res.warn{background:var(--warn);color:var(--warn-text)}
.res .icon{font-family:var(--head);font-size:22px;letter-spacing:.14em}
.res h2{font-family:var(--head);font-weight:400;font-size:42px;line-height:1.1}
.res .sub{font-size:18px}
.res.ok .sub,.res.ok .meta{color:var(--ok-sub)}
.res.bad .sub{color:var(--bad-sub)}
.res.warn .sub{color:var(--warn-sub)}
.res .who{font-size:30px;line-height:1.2}
.meta{font-size:17px}
.idcheck{border:2px solid currentColor;padding:12px 14px;font-size:18px}
.cnt{display:flex;gap:8px;flex-wrap:wrap}
.cnt button{min-width:56px;min-height:56px;font-family:var(--body);font-size:22px;border-radius:4px;cursor:pointer;
  background:transparent;color:inherit;border:2px solid currentColor}
.cnt button[aria-pressed="true"]{background:var(--ok-text);color:var(--ok)}
.res .btn.go{background:var(--ok-text);color:var(--ok);border:0;font-size:19px}
.res .btn.next{background:transparent;color:inherit;border:2px solid currentColor}
.res.bad .btn.next{background:var(--bad-text);color:var(--bad);border:0}
.res.warn .btn.next{background:var(--warn-text);color:var(--warn);border:0}
.res .btn.ovr{background:transparent;color:inherit;border:2px solid currentColor}
.spacer{flex:1}

.sim{position:fixed;left:0;right:0;bottom:0;z-index:30;background:#1C1C1F;color:#E6E6EA;border-top:1px solid #3A3A40;
  font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px}
.simin{max-width:1100px;margin:0 auto;padding:10px 20px;display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}
.simin strong{font-size:13px;color:#B5B5BD}
.simin button{font:inherit;min-height:38px;padding:6px 11px;border-radius:6px;border:1px solid #4A4A52;background:#26262A;color:#E6E6EA;cursor:pointer}
.simin button[aria-pressed="true"]{background:#E6E6EA;color:#1C1C1F;border-color:#E6E6EA}
.simin button:disabled{opacity:.45;cursor:not-allowed}
`;

  const g = result?.guest;
  const remaining = g ? g.people - g.inside : 0;

  return (
    <div className="root">
      <style>{css}</style>
      <div className="dev">
        <div className="top">
          <span className="t">Door</span>
          <span className="n">Descent · Thu 24 Sep</span>
        </div>
        <div className={`sync${offline ? " off" : ""}`} role="status">
          <span className="dot" />
          {offline
            ? `Offline. Tonight's list saved at 21:58. ${pending} check-in${pending === 1 ? "" : "s"} waiting to sync.`
            : pending > 0 ? "Back online. Syncing check-ins..." : "Online. All check-ins synced."}
        </div>
        <div className="nums" aria-label="Tonight">
          <div><strong>{totals.in}</strong><span>Inside</span></div>
          <div><strong>{totals.gl}/200</strong><span>Guestlist</span></div>
          <div><strong>{totals.tb}/16</strong><span>Tables</span></div>
        </div>

        {!started ? (
          <div className="startwrap">
            <h1>Start the door</h1>
            <p>Allows the camera and the scan sounds. Tap once at the start of the night.</p>
            <button className="btn solid" onClick={start}>Start scanning</button>
          </div>
        ) : view === "search" ? (
          <div className="main">
            <div className="field">
              <label htmlFor="q">Search by name or last 4 digits of phone</label>
              <input id="q" autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Ayu or 1234" />
            </div>
            {q.length >= 2 && matches.length === 0 && <p className="hint">No one on tonight's list matches "{query}".</p>}
            {q.length < 2 && <p className="hint">Use this when a phone is dead or a QR won't scan. Check ID before letting anyone in.</p>}
            <ul className="list">
              {matches.map((m) => (
                <li key={m.id}>
                  <button onClick={() => open(m.id)}>
                    <span>{m.name}<br /><small>{m.kind === "table" ? `Table ${m.table}` : m.kind === "person" ? `Guest of ${m.organiser}` : `Group of ${m.people}`} · phone ends {m.phone}</small></span>
                    <small>{m.inside}/{m.people} in</small>
                  </button>
                </li>
              ))}
            </ul>
            <button className="btn line" onClick={() => { setView("scan"); setQuery(""); }}>Back to scanner</button>
          </div>
        ) : (
          <div className="main">
            <div className="cam">
              <div className="frame" />
              <p>Hold the QR inside the frame</p>
            </div>
            <div className="two">
              <button className="btn line" onClick={() => setView("search")}>Search by name</button>
              <button className="btn line" onClick={() => setView(view === "log" ? "scan" : "log")}>Last check-ins</button>
            </div>
            <p className="hint">A handheld scanner plugged into this device also works. Scan straight into this screen.</p>
            <ul className="log" aria-label="Last check-ins">
              {log.map((l, i) => (
                <li key={i}><span>{l.at}</span>{l.name} · {l.n} in{l.override ? " · manager" : ""}</li>
              ))}
            </ul>
          </div>
        )}

        {result && (
          <div className={`res ${result.tone}`} ref={resultRef} tabIndex={-1} role="alert">
            <div className="icon">{result.tone === "ok" ? "VALID" : result.tone === "bad" ? "STOP" : "CHECK"}</div>
            <h2>{result.title}</h2>

            {result.tone === "ok" && g && (
              <>
                <div className="who">{g.name}</div>
                <div className="meta">
                  {g.kind === "table" ? `Table for ${g.people} · ${g.inside} already in` : g.kind === "person" ? `Guest of ${g.organiser}` : `Group of ${g.people} · ${g.inside} already in`}
                </div>
                <div className="idcheck">Check ID: name matches and 21 or over</div>
                {remaining > 1 && (
                  <>
                    <div className="meta">How many are coming in now?</div>
                    <div className="cnt" role="group" aria-label="People entering now">
                      {Array.from({ length: remaining }, (_, i) => i + 1).map((k) => (
                        <button key={k} aria-pressed={count === k} onClick={() => setCount(k)}>{k}</button>
                      ))}
                    </div>
                  </>
                )}
                <div className="spacer" />
                <button className="btn go" onClick={() => letIn(remaining > 1 ? count : 1)}>
                  Let {remaining > 1 ? count : 1} in
                </button>
                <button className="btn next" onClick={() => setResult(null)}>Cancel</button>
              </>
            )}

            {result.tone !== "ok" && (
              <>
                <p className="sub">{result.sub}</p>
                <div className="spacer" />
                {result.override && (
                  <button className="btn ovr" onClick={() => letIn(result.guest.people, true)}>
                    Let in anyway (manager, logged)
                  </button>
                )}
                <button className="btn next" onClick={() => setResult(null)}>Scan next</button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="sim" role="region" aria-label="Kontrol pratinjau">
        <div className="simin">
          <strong>Kontrol pratinjau (tidak ada di versi asli) · Pindai:</strong>
          {SCANS.map(([id, l]) => (
            <button key={id} disabled={!started} onClick={() => { setView("scan"); open(id); }}>{l}</button>
          ))}
          <button aria-pressed={offline} onClick={() => setOffline(!offline)}>Tanpa sinyal</button>
          <button onClick={() => { setGuests(GUESTS); setResult(null); setStarted(false); setLog([{ name: "Putu Ananda", n: 2, at: "22:14" }]); setTotals({ in: 148, gl: 96, tb: 14 }); setPending(0); setOffline(false); }}>
            Mulai ulang
          </button>
        </div>
      </div>
    </div>
  );
}
