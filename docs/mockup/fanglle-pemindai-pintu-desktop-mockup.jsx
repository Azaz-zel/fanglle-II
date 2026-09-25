import React, { useState, useEffect, useRef, useCallback } from "react";

const GUESTS = [
  { id: "g1", token: "FNG2-TH-AYU4", kind: "group", name: "Ayu Pratiwi", phone: "1234", people: 4, inside: 0, night: "thu" },
  { id: "g2", token: "FNG2-TH-KDK1", kind: "person", name: "Kadek Surya", phone: "8821", people: 1, inside: 0, night: "thu", organiser: "Ayu Pratiwi" },
  { id: "g3", token: "FNG2-TH-MWR7", kind: "table", name: "Made Wirawan", phone: "4410", people: 7, inside: 3, night: "thu", table: "B5" },
  { id: "g4", token: "FNG2-TH-PTA2", kind: "group", name: "Putu Ananda", phone: "0937", people: 2, inside: 2, night: "thu", usedAt: "22:14" },
  { id: "g5", token: "FNG2-FR-NYA3", kind: "group", name: "Nyoman Ari", phone: "5563", people: 3, inside: 0, night: "fri" },
  { id: "g6", token: "FNG2-TH-WYD10", kind: "table", name: "Wayan Dharma", phone: "7702", people: 10, inside: 0, night: "thu", table: "B2" },
  { id: "g7", token: "FNG2-TH-LSR1", kind: "person", name: "Luh Sari", phone: "3319", people: 1, inside: 0, night: "thu", organiser: "Wayan Dharma" },
];

const SIM = [
  ["FNG2-TH-AYU4", "Grup valid"], ["FNG2-TH-KDK1", "Per orang"], ["FNG2-TH-MWR7", "Meja"], ["FNG2-TH-PTA2", "Sudah dipakai"],
  ["FNG2-FR-NYA3", "Malam lain"], ["LATE", "Lewat jam 11"], ["XQZ-0000-FAKE", "QR palsu"],
];

const INITIAL_LOG = [
  { at: "22:14", name: "Putu Ananda", n: 2, how: "Scan" },
  { at: "22:09", name: "Gede Pramana", n: 6, how: "Scan · table B1" },
  { at: "22:03", name: "Ni Luh Ayu", n: 1, how: "Search" },
];

export default function App() {
  const [guests, setGuests] = useState(GUESTS);
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState(null);
  const [count, setCount] = useState(1);
  const [query, setQuery] = useState("");
  const [typing, setTyping] = useState(false);
  const [offline, setOffline] = useState(false);
  const [pending, setPending] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [log, setLog] = useState(INITIAL_LOG);
  const [totals, setTotals] = useState({ in: 148, gl: 96, tb: 14 });
  const audio = useRef(null);
  const buffer = useRef("");
  const lastKey = useRef(0);
  const searchRef = useRef(null);

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

  const beep = useCallback((ok) => {
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
  }, []);

  const openGuest = useCallback((g, late, how) => {
    let r;
    if (!g) r = { tone: "bad", title: "Not a Fanglle QR", sub: "This code isn't signed by us. It may be edited, or from another venue." };
    else if (late) r = { tone: "warn", title: "Guestlist closed at 11 pm", sub: `${g.name}, group of ${g.people}. Free entry ended at 11 pm.`, guest: g, override: true };
    else if (g.night !== "thu") r = { tone: "warn", title: "Wrong night", sub: `${g.name}'s QR is for Fri 25 Sep, Second Wave.`, guest: g };
    else if (g.inside >= g.people) r = { tone: "bad", title: "Already used", sub: `${g.name}: all ${g.people} checked in${g.usedAt ? ` at ${g.usedAt}` : ""}. This QR can't enter again.`, guest: g };
    else r = { tone: "ok", title: g.kind === "table" ? `Table ${g.table}` : "Welcome in", guest: g, how };
    setResult(r);
    setBlocked(false);
    setCount(r.guest ? Math.max(1, r.guest.people - r.guest.inside) : 1);
    beep(r.tone === "ok");
  }, [beep]);

  const scanToken = useCallback((token) => {
    if (result && result.tone === "ok") {
      setBlocked(true);
      beep(false);
      return;
    }
    if (token === "LATE") return openGuest(guests.find((x) => x.id === "g1"), true, "Scan");
    openGuest(guests.find((x) => x.token === token), false, "Scan");
  }, [result, guests, openGuest, beep]);

  function letIn(n, override) {
    const g = result.guest;
    const at = override ? "23:12" : "22:31";
    setGuests(guests.map((x) => (x.id === g.id ? { ...x, inside: x.inside + n, usedAt: x.inside + n >= x.people ? at : x.usedAt } : x)));
    setLog([{ at, name: g.name, n, how: override ? "Manager override" : `${result.how || "Scan"}${g.kind === "table" ? ` · table ${g.table}` : ""}` }, ...log].slice(0, 10));
    setTotals({ in: totals.in + n, gl: totals.gl + (g.kind === "table" ? 0 : n), tb: totals.tb });
    if (offline) setPending(pending + 1);
    setResult(null);
    setBlocked(false);
  }

  useEffect(() => {
    if (!started) return;
    const onKey = (e) => {
      if (typing) {
        if (e.key === "Escape") {
          searchRef.current?.blur();
          setQuery("");
        }
        return;
      }
      const now = performance.now();
      if (e.key === "Enter") {
        const code = buffer.current;
        buffer.current = "";
        e.preventDefault();
        if (code.length >= 6) scanToken(code);
        else if (result && result.tone === "ok") letIn(result.guest.people - result.guest.inside > 1 ? count : 1, false);
        else if (result) setResult(null);
        return;
      }
      if (e.key === "Escape") {
        buffer.current = "";
        setResult(null);
        setBlocked(false);
        return;
      }
      if (result && result.tone === "ok" && /^[1-9]$/.test(e.key) && buffer.current === "") {
        const max = result.guest.people - result.guest.inside;
        const k = Number(e.key);
        if (k <= max) setCount(k);
        lastKey.current = now;
        return;
      }
      if (e.key.length === 1) {
        if (now - lastKey.current > 120) buffer.current = "";
        buffer.current += e.key.toUpperCase();
        lastKey.current = now;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const q = query.trim().toLowerCase();
  const matches = q.length < 2 ? [] : guests.filter((g) => g.night === "thu" && (g.name.toLowerCase().includes(q) || g.phone.includes(q)));
  const g = result?.guest;
  const remaining = g ? g.people - g.inside : 0;

  const css = `
@import url('https://fonts.googleapis.com/css2?family=Poiret+One&family=Didact+Gothic&display=swap');
:root{
  --obsidian:#0C0812; --surface:#150E1F; --raised:#1E1530; --line:#2E2342; --amethyst-soft:#7A5BA6;
  --text:#EEE9F3; --soft:#C9BDD9; --muted:#A99DB8;
  --ok:#0F6B38; --ok-text:#F2FFF6; --ok-sub:#D2F2DE; --bad:#A3162F; --bad-text:#FBF7FB; --bad-sub:#F6D9DE;
  --warn:#C77A12; --warn-text:#140A00; --warn-sub:#2A1600;
  --head:'Poiret One','Helvetica Neue',Arial,sans-serif; --body:'Didact Gothic','Helvetica Neue',Arial,sans-serif;
}
*{box-sizing:border-box;margin:0;padding:0}
.root{min-height:100vh;background:#050308;padding:20px 16px 150px;font-family:var(--body)}
.win{max-width:1280px;min-height:760px;margin:0 auto;background:var(--obsidian);color:var(--text);border:1px solid #2A2A30;border-radius:8px;
  overflow:hidden;display:flex;flex-direction:column;font-size:17px;line-height:1.5}
.top{display:flex;align-items:center;gap:24px;flex-wrap:wrap;padding:14px 24px;border-bottom:1px solid var(--line)}
.top .t{font-family:var(--head);font-size:24px;letter-spacing:.06em}
.top .n{color:var(--muted)}
.nums{display:flex;gap:28px;margin-left:auto}
.nums div{text-align:right}
.nums strong{display:block;font-family:var(--head);font-weight:400;font-size:26px;line-height:1.1}
.nums span{font-size:13px;color:var(--muted)}
.sync{padding:8px 24px;font-size:14px;color:var(--muted);border-bottom:1px solid var(--line);display:flex;align-items:center;gap:8px}
.sync.off{color:var(--text);background:var(--raised)}
.dot{width:9px;height:9px;border-radius:50%;background:#3FA66B;flex:none}
.dot.amber{background:#C77A12}
.body{flex:1;display:grid;grid-template-columns:minmax(0,2fr) minmax(320px,1fr)}
.stage{position:relative;border-right:1px solid var(--line);display:flex;flex-direction:column}
.idle{flex:1;display:flex;flex-direction:column;justify-content:center;gap:18px;padding:48px}
.idle h1{font-family:var(--head);font-weight:400;font-size:56px;line-height:1.1}
.listen{display:flex;align-items:center;gap:12px;font-size:19px}
.listen .dot{width:14px;height:14px}
.idle p{color:var(--muted);max-width:52ch}
.keys{display:flex;gap:18px;flex-wrap:wrap;font-size:15px;color:var(--muted)}
kbd{font-family:var(--body);font-size:14px;border:1px solid currentColor;border-radius:4px;padding:1px 7px;margin-right:6px}

.res{flex:1;display:flex;flex-direction:column;gap:18px;padding:40px 48px}
.res.ok{background:var(--ok);color:var(--ok-text)}
.res.bad{background:var(--bad);color:var(--bad-text)}
.res.warn{background:var(--warn);color:var(--warn-text)}
.res .icon{font-family:var(--head);font-size:26px;letter-spacing:.16em}
.res h2{font-family:var(--head);font-weight:400;font-size:64px;line-height:1.05}
.res .who{font-size:40px;line-height:1.15}
.res .meta{font-size:20px}
.res.ok .meta,.res.ok .sub{color:var(--ok-sub)}
.res.bad .sub{color:var(--bad-sub)}
.res.warn .sub{color:var(--warn-sub)}
.res .sub{font-size:22px;max-width:40ch}
.idcheck{border:2px solid currentColor;padding:12px 16px;font-size:20px;align-self:flex-start}
.cnt{display:flex;gap:10px;flex-wrap:wrap}
.cnt button{min-width:64px;min-height:64px;font-family:var(--body);font-size:26px;border-radius:4px;cursor:pointer;background:transparent;
  color:inherit;border:2px solid currentColor}
.cnt button[aria-pressed="true"]{background:var(--ok-text);color:var(--ok)}
.acts{display:flex;gap:12px;flex-wrap:wrap;margin-top:auto}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:60px;padding:12px 26px;font-family:var(--body);
  font-size:19px;border-radius:4px;cursor:pointer}
.btn kbd{border-color:currentColor}
.btn.solid{background:var(--text);color:var(--obsidian);border:1px solid var(--text)}
.res.ok .btn.go{background:var(--ok-text);color:var(--ok);border:0}
.res .btn.plain{background:transparent;color:inherit;border:2px solid currentColor}
.res.bad .btn.next{background:var(--bad-text);color:var(--bad);border:0}
.res.warn .btn.next{background:var(--warn-text);color:var(--warn);border:0}
.blocked{background:rgba(0,0,0,.28);padding:12px 16px;font-size:18px}
.btn:focus-visible,.cnt button:focus-visible,.sim button:focus-visible,input:focus-visible,.list button:focus-visible{outline:3px solid #FFFFFF;outline-offset:3px}

.side{display:flex;flex-direction:column}
.panel{padding:22px 24px;border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:10px}
.panel h3{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:400}
.panel input{min-height:52px;padding:10px 14px;background:var(--surface);border:1px solid var(--line);border-radius:4px;color:var(--text);
  font-family:var(--body);font-size:17px}
.hint{font-size:14px;color:var(--muted)}
.list{list-style:none}
.list li{border-top:1px solid var(--line)}
.list button{width:100%;text-align:left;background:transparent;border:0;color:var(--text);font-family:var(--body);font-size:16px;
  padding:12px 4px;min-height:52px;cursor:pointer;display:flex;justify-content:space-between;gap:10px}
.list button:hover{background:var(--surface)}
.list small{color:var(--muted);font-size:14px}
.log{list-style:none;font-size:15px}
.log li{display:grid;grid-template-columns:52px 1fr auto;gap:10px;padding:9px 0;border-top:1px solid var(--line)}
.log .at{color:var(--muted)}
.log .how{color:var(--muted);font-size:14px}
.startwrap{flex:1;display:flex;flex-direction:column;justify-content:center;gap:18px;padding:48px;max-width:640px}
.startwrap h1{font-family:var(--head);font-weight:400;font-size:52px;line-height:1.1}
.startwrap p{color:var(--muted)}

.sim{position:fixed;left:0;right:0;bottom:0;z-index:30;background:#1C1C1F;color:#E6E6EA;border-top:1px solid #3A3A40;
  font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px}
.simin{max-width:1280px;margin:0 auto;padding:10px 20px;display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}
.simin strong{font-size:13px;color:#B5B5BD}
.simin button{font:inherit;min-height:38px;padding:6px 11px;border-radius:6px;border:1px solid #4A4A52;background:#26262A;color:#E6E6EA;cursor:pointer}
.simin button[aria-pressed="true"]{background:#E6E6EA;color:#1C1C1F;border-color:#E6E6EA}
.simin button:disabled{opacity:.45;cursor:not-allowed}
.simnote{flex-basis:100%;color:#B5B5BD;font-size:13px}
`;

  return (
    <div className="root">
      <style>{css}</style>
      <div className="win">
        <div className="top">
          <span className="t">Door</span>
          <span className="n">Descent · Thu 24 Sep</span>
          <div className="nums" aria-label="Tonight">
            <div><strong>{totals.in}</strong><span>Inside</span></div>
            <div><strong>{totals.gl}/200</strong><span>Guestlist</span></div>
            <div><strong>{totals.tb}/16</strong><span>Tables</span></div>
          </div>
        </div>
        <div className={`sync${offline ? " off" : ""}`} role="status">
          <span className={`dot${offline ? " amber" : ""}`} />
          {offline
            ? `Offline. Tonight's list saved at 21:58. ${pending} check-in${pending === 1 ? "" : "s"} waiting to sync.`
            : pending > 0 ? "Back online. Syncing check-ins..." : "Online. All check-ins synced."}
        </div>

        {!started ? (
          <div className="startwrap">
            <h1>Start the door</h1>
            <p>Turns on scan sounds and starts listening to the handheld scanner. Click once at the start of the night.</p>
            <button className="btn solid" onClick={start} style={{ alignSelf: "flex-start" }}>Start scanning</button>
          </div>
        ) : (
          <div className="body">
            <section className="stage" aria-label="Scan result">
              {!result ? (
                <div className="idle">
                  <h1>Ready to scan</h1>
                  <div className="listen" role="status">
                    <span className={`dot${typing ? " amber" : ""}`} style={{ width: 14, height: 14 }} />
                    {typing ? "Scanner paused while you type in search. Press Esc to go back." : "Scanner listening. Scan any QR."}
                  </div>
                  <p>The handheld scanner types the code and presses Enter by itself. Nothing needs to be clicked first.</p>
                  <div className="keys">
                    <span><kbd>1–9</kbd>people coming in</span>
                    <span><kbd>Enter</kbd>let in</span>
                    <span><kbd>Esc</kbd>cancel</span>
                  </div>
                </div>
              ) : (
                <div className={`res ${result.tone}`} role="alert">
                  <div className="icon">{result.tone === "ok" ? "VALID" : result.tone === "bad" ? "STOP" : "CHECK"}</div>
                  <h2>{result.title}</h2>

                  {blocked && (
                    <p className="blocked" role="status">
                      A new QR was scanned. Let {g.name} in or cancel first, then scan again.
                    </p>
                  )}

                  {result.tone === "ok" && g ? (
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
                            {Array.from({ length: Math.min(remaining, 9) }, (_, i) => i + 1).map((k) => (
                              <button key={k} aria-pressed={count === k} onClick={() => setCount(k)}>{k}</button>
                            ))}
                          </div>
                        </>
                      )}
                      <div className="acts">
                        <button className="btn go" onClick={() => letIn(remaining > 1 ? count : 1)}>
                          Let {remaining > 1 ? count : 1} in <kbd>Enter</kbd>
                        </button>
                        <button className="btn plain" onClick={() => { setResult(null); setBlocked(false); }}>
                          Cancel <kbd>Esc</kbd>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="sub">{result.sub}</p>
                      <div className="acts">
                        {result.override && (
                          <button className="btn plain" onClick={() => letIn(result.guest.people, true)}>Let in anyway (manager, logged)</button>
                        )}
                        <button className="btn next" onClick={() => setResult(null)}>Scan next <kbd>Enter</kbd></button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>

            <aside className="side">
              <div className="panel">
                <h3>Search by name or phone</h3>
                <input
                  ref={searchRef}
                  value={query}
                  placeholder="e.g. Ayu or 1234"
                  aria-label="Search tonight's list by name or last 4 digits of phone"
                  onFocus={() => setTyping(true)}
                  onBlur={() => setTyping(false)}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {q.length >= 2 && matches.length === 0 && <p className="hint">No one on tonight's list matches "{query}".</p>}
                {q.length < 2 && <p className="hint">For a dead phone or a QR that won't scan. Check ID first.</p>}
                <ul className="list">
                  {matches.map((m) => (
                    <li key={m.id}>
                      <button onMouseDown={(e) => e.preventDefault()} onClick={() => { searchRef.current?.blur(); setQuery(""); openGuest(m, false, "Search"); }}>
                        <span>{m.name}<br /><small>{m.kind === "table" ? `Table ${m.table}` : m.kind === "person" ? `Guest of ${m.organiser}` : `Group of ${m.people}`} · phone ends {m.phone}</small></span>
                        <small>{m.inside}/{m.people} in</small>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="panel" style={{ borderBottom: 0 }}>
                <h3>Last check-ins</h3>
                <ul className="log">
                  {log.map((l, i) => (
                    <li key={i}><span className="at">{l.at}</span><span>{l.name}<br /><span className="how">{l.how}</span></span><span>{l.n} in</span></li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        )}
      </div>

      <div className="sim" role="region" aria-label="Kontrol pratinjau">
        <div className="simin">
          <strong>Kontrol pratinjau (tidak ada di versi asli) · Pindai dengan alat:</strong>
          {SIM.map(([tok, l]) => (
            <button key={tok} disabled={!started || typing} onClick={() => scanToken(tok)}>{l}</button>
          ))}
          <button aria-pressed={offline} onClick={() => setOffline(!offline)}>Tanpa sinyal</button>
          <button onClick={() => { setGuests(GUESTS); setResult(null); setBlocked(false); setStarted(false); setLog(INITIAL_LOG); setTotals({ in: 148, gl: 96, tb: 14 }); setPending(0); setOffline(false); setQuery(""); }}>
            Mulai ulang
          </button>
          <span className="simnote">
            Bisa juga diuji dengan keyboard: klik area kosong, ketik cepat FNG2-TH-AYU4 lalu Enter, persis seperti alat pemindai.
          </span>
        </div>
      </div>
    </div>
  );
}
