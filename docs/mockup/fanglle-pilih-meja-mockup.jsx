import React, { useState, useEffect, useRef } from "react";

const NIGHTS = [
  { key: "thu", day: "Thu", date: "24 Sep", name: "Descent", genre: "Melodic techno", head: "Ilse Varga", with: "Rafi Hartono" },
  { key: "fri", day: "Fri", date: "25 Sep", name: "Second Wave", genre: "Afro house", head: "Marcel Oduya", with: "Bayu Kencana, Lintang, Kirana" },
  { key: "sat", day: "Sat", date: "26 Sep", name: "Fall Line", genre: "Tech house", head: "Nadia Sorrel", with: "Dewa Anom" },
  { key: "sun", day: "Sun", date: "27 Sep", name: "Afterglow", genre: "Deep house", head: "Theo Brandt", with: "Saka" },
];

const ZONES = {
  stage: { name: "Stage front", seats: "Tables for up to 6" },
  booth: { name: "Booths", seats: "Booths for 8 to 12" },
  bar: { name: "Bar tables", seats: "High tables for up to 4" },
};

const MIN = {
  thu: { stage: 10000000, booth: 15000000, bar: 5000000 },
  fri: { stage: 16000000, booth: 24000000, bar: 8000000 },
  sat: { stage: 20000000, booth: 30000000, bar: 10000000 },
  sun: { stage: 8000000, booth: 12000000, bar: 4000000 },
};

const TABLES = [
  { id: "S1", zone: "stage", shape: "round", cap: 6, x: 185, y: 150 },
  { id: "S2", zone: "stage", shape: "round", cap: 6, x: 185, y: 285 },
  { id: "S3", zone: "stage", shape: "round", cap: 6, x: 815, y: 150 },
  { id: "S4", zone: "stage", shape: "round", cap: 6, x: 815, y: 285 },
  { id: "B1", zone: "booth", shape: "booth", cap: 12, x: 72, y: 135 },
  { id: "B2", zone: "booth", shape: "booth", cap: 12, x: 72, y: 265 },
  { id: "B3", zone: "booth", shape: "booth", cap: 8, x: 72, y: 395 },
  { id: "B4", zone: "booth", shape: "booth", cap: 12, x: 928, y: 135 },
  { id: "B5", zone: "booth", shape: "booth", cap: 12, x: 928, y: 265 },
  { id: "B6", zone: "booth", shape: "booth", cap: 8, x: 928, y: 395 },
  ...[300, 380, 460, 540, 620, 700].map((x, i) => ({ id: `T${i + 1}`, zone: "bar", shape: "high", cap: 4, x, y: 462 })),
];

const TAKEN = {
  thu: { booked: ["S1", "B4", "T2"], held: ["B2"] },
  fri: { booked: ["S1", "S2", "S3", "B1", "B2", "B4", "B5", "T1", "T2", "T3", "T5"], held: ["S4"] },
  sat: { booked: TABLES.map((t) => t.id), held: [] },
  sun: { booked: ["T1"], held: [] },
};

const HOLD_SECONDS = 15 * 60;
const idr = (n) => `IDR ${n.toLocaleString("en-US")}`;
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function App() {
  const [night, setNight] = useState("thu");
  const [party, setParty] = useState(4);
  const [sel, setSel] = useState(null);
  const [view, setView] = useState("plan");
  const [stage, setStage] = useState("choose");
  const [form, setForm] = useState({ name: "", phone: "", email: "", age: false });
  const [errors, setErrors] = useState({});
  const [left, setLeft] = useState(HOLD_SECONDS);
  const [nextPay, setNextPay] = useState("ok");
  const [payError, setPayError] = useState(false);
  const [code, setCode] = useState("");
  const [note, setNote] = useState(false);
  const panelRef = useRef(null);

  const n = NIGHTS.find((x) => x.key === night);
  const taken = TAKEN[night];
  const locked = stage === "held" || stage === "paying" || stage === "confirmed";
  const soldOut = TABLES.every((t) => taken.booked.includes(t.id) || taken.held.includes(t.id));

  const statusOf = (t) => {
    if (taken.booked.includes(t.id)) return "booked";
    if (taken.held.includes(t.id)) return "held";
    if (t.cap < party) return "small";
    return "free";
  };

  useEffect(() => {
    if (stage !== "held" && stage !== "paying") return;
    const id = setInterval(() => setLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [stage]);

  useEffect(() => {
    if (left === 0 && (stage === "held" || stage === "paying")) setStage("expired");
  }, [left, stage]);

  useEffect(() => {
    if (!note) return;
    const onKey = (e) => e.key === "Escape" && setNote(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [note]);

  function pick(t) {
    if (locked || statusOf(t) !== "free") return;
    setSel(t.id);
    setStage("choose");
    setErrors({});
    setTimeout(() => panelRef.current?.focus(), 0);
  }

  function changeNight(k) {
    if (locked) return;
    setNight(k);
    setSel(null);
    setStage("choose");
  }

  function changeParty(d) {
    if (locked) return;
    const p = Math.min(12, Math.max(1, party + d));
    setParty(p);
    const t = TABLES.find((x) => x.id === sel);
    if (t && t.cap < p) setSel(null);
  }

  function hold(e) {
    e.preventDefault();
    const er = {};
    if (!form.name.trim()) er.name = "Enter the name for the booking.";
    if (!/^\+?[0-9\s-]{9,16}$/.test(form.phone.trim())) er.phone = "Enter your phone number. The door uses it to find your booking.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) er.email = "Enter your email. Your QR is sent there.";
    if (!form.age) er.age = "Everyone in the group must be 21 or over.";
    setErrors(er);
    if (Object.keys(er).length) return;
    setLeft(HOLD_SECONDS);
    setPayError(false);
    setStage("held");
  }

  function pay() {
    setStage("paying");
    setPayError(false);
    setTimeout(() => {
      if (nextPay === "fail") {
        setPayError(true);
        setStage("held");
      } else {
        setCode(`F2-${Math.random().toString(36).slice(2, 6).toUpperCase()}`);
        setStage("confirmed");
      }
    }, 1200);
  }

  function release() {
    setStage("choose");
    setSel(null);
  }

  const t = TABLES.find((x) => x.id === sel);
  const min = t ? MIN[night][t.zone] : 0;
  const deposit = min / 2;

  const css = `
@import url('https://fonts.googleapis.com/css2?family=Poiret+One&family=Didact+Gothic&display=swap');
:root{
  --obsidian:#0C0812; --surface:#150E1F; --raised:#1E1530; --line:#2E2342; --line-soft:#221931;
  --amethyst:#563C7A; --amethyst-deep:#3D2A58; --amethyst-soft:#7A5BA6;
  --text:#EEE9F3; --soft:#C9BDD9; --muted:#A99DB8;
  --garnet:#A3162F; --garnet-hover:#B91C38; --garnet-text:#E5566B; --on-garnet:#FBF7FB;
  --head:'Poiret One','Helvetica Neue',Arial,sans-serif; --body:'Didact Gothic','Helvetica Neue',Arial,sans-serif;
}
*{box-sizing:border-box;margin:0;padding:0}
.site{background:var(--obsidian);color:var(--text);font-family:var(--body);font-size:17px;line-height:1.6;min-height:100vh;padding-bottom:140px}
.head{font-family:var(--head);font-weight:400}
.two{color:var(--garnet-text)}
a{color:inherit}
:focus-visible{outline:2px solid var(--text);outline-offset:3px}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 24px;font-family:var(--body);
  font-size:16px;letter-spacing:.04em;border-radius:2px;cursor:pointer;text-decoration:none;transition:background .2s,border-color .2s}
.btn.solid{background:var(--garnet);color:var(--on-garnet);border:1px solid var(--garnet)}
.btn.solid:hover{background:var(--garnet-hover)}
.btn.line{background:transparent;color:var(--text);border:1px solid var(--amethyst-soft)}
.btn.line:hover{border-color:var(--text)}
.btn:disabled{background:transparent;color:var(--muted);border:1px solid var(--line);cursor:not-allowed}
@media (prefers-reduced-motion:reduce){.btn,.tb{transition:none}}

.nav{border-bottom:1px solid var(--line-soft)}
.navin{max-width:1240px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;gap:20px}
.mark{font-size:20px;letter-spacing:.12em;text-decoration:none;white-space:nowrap}
.back{margin-left:auto;font-size:15px;color:var(--muted);text-decoration:none}
.back:hover{color:var(--text)}

.wrap{max-width:1240px;margin:0 auto;padding:40px 24px 0}
.h1{font-size:clamp(34px,5vw,56px);line-height:1.1;letter-spacing:.02em}
.h1 em{font-style:normal;color:var(--soft)}
.sub{color:var(--muted);margin-top:10px;max-width:60ch}

.bar{display:flex;flex-wrap:wrap;gap:24px 40px;align-items:flex-end;margin-top:32px;padding-bottom:28px;border-bottom:1px solid var(--line)}
.lbl{display:block;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:10px}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{min-height:52px;padding:8px 16px;background:transparent;border:1px solid var(--line);color:var(--text);font-family:var(--body);
  font-size:15px;cursor:pointer;border-radius:2px;text-align:left;line-height:1.3}
.chip small{display:block;color:var(--muted);font-size:13px}
.chip[aria-pressed="true"]{border-color:var(--garnet);background:var(--surface)}
.chip:disabled{cursor:not-allowed;opacity:.55}
.step{display:flex;align-items:center;border:1px solid var(--line);border-radius:2px}
.step button{width:48px;height:52px;background:transparent;border:0;color:var(--text);font-size:22px;cursor:pointer}
.step button:disabled{color:var(--line);cursor:not-allowed}
.step output{min-width:64px;text-align:center;font-size:20px}

.evinfo{display:grid;grid-template-columns:1fr;gap:12px 28px;align-items:center;margin-top:24px;padding:18px 22px;border:1px solid var(--amethyst-deep);background:var(--surface)}
@media (min-width:860px){.evinfo{grid-template-columns:auto minmax(0,1fr) auto}}
.evname{font-size:28px;line-height:1.1;letter-spacing:.04em}
.evmeta{font-size:14px;color:var(--muted);margin-top:4px}
.evhead{display:block;font-size:18px}
.evwith{display:block;font-size:15px;color:var(--muted)}
.evlink{min-height:44px;padding:8px 16px;font-size:15px;justify-self:start}
.grid{display:grid;grid-template-columns:1fr;gap:28px;margin-top:28px}
@media (min-width:1000px){.grid{grid-template-columns:minmax(0,1.7fr) minmax(320px,1fr);align-items:start}}

.viewtoggle{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.viewtoggle p{font-size:15px;color:var(--muted)}
.scroller{overflow-x:auto;border:1px solid var(--line);background:var(--surface)}
.plan{position:relative;min-width:640px;aspect-ratio:1000/620}
.plan svg{position:absolute;inset:0;width:100%;height:100%}
.tb{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;justify-content:center;
  font-family:var(--body);font-size:14px;line-height:1.1;cursor:pointer;border:1px solid var(--amethyst-soft);background:var(--raised);
  color:var(--text);transition:background .15s,border-color .15s}
.tb small{font-size:11px;color:var(--muted);margin-top:2px}
.tb.round{width:7.6%;aspect-ratio:1;border-radius:50%}
.tb.high{width:6.4%;aspect-ratio:1;border-radius:4px}
.tb.booth{width:10%;height:15%;border-radius:22px 22px 6px 6px}
.tb.free:hover{border-color:var(--text);background:var(--amethyst-deep)}
.tb.sel{background:var(--garnet);border-color:var(--garnet);color:var(--on-garnet)}
.tb.sel small{color:var(--on-garnet)}
.tb.booked{background:var(--obsidian);border-color:var(--line);color:var(--muted);cursor:not-allowed;text-decoration:line-through}
.tb.held{background:var(--obsidian);border:1px dashed var(--amethyst-soft);color:var(--muted);cursor:not-allowed}
.tb.small{background:var(--obsidian);border-color:var(--line);color:var(--muted);cursor:not-allowed}
.tb[aria-disabled="true"]:hover{background:var(--obsidian)}
.legend{display:flex;flex-wrap:wrap;gap:8px 20px;margin-top:12px;font-size:14px;color:var(--muted)}
.legend span{display:inline-flex;align-items:center;gap:8px}
.sw{width:14px;height:14px;border:1px solid var(--amethyst-soft);background:var(--raised)}
.sw.sel{background:var(--garnet);border-color:var(--garnet)}
.sw.held{background:var(--obsidian);border-style:dashed}
.sw.booked{background:var(--obsidian);border-color:var(--line)}

.list{list-style:none;border:1px solid var(--line)}
.list li{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 16px;border-top:1px solid var(--line)}
.list li:first-child{border-top:0}
.list .who{font-size:15px;color:var(--muted)}

.panel{border:1px solid var(--amethyst-deep);background:var(--surface);padding:28px 24px;display:flex;flex-direction:column;gap:18px}
.panel:focus{outline:none}
.panel:focus-visible{outline:2px solid var(--text);outline-offset:3px}
.panel h2{font-size:32px;line-height:1.1}
.facts{display:grid;grid-template-columns:auto 1fr;gap:6px 16px;font-size:15px}
.facts dt{color:var(--muted)}
.facts dd{text-align:right}
.facts .big{font-size:18px}
.hint{font-size:14px;color:var(--muted)}
.zones{list-style:none;display:flex;flex-direction:column;gap:10px;font-size:15px}
.zones li{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid var(--line);padding-bottom:10px}
.zones span{color:var(--muted)}
.field{display:flex;flex-direction:column;gap:6px}
.field label{font-size:15px}
.field input[type=text],.field input[type=tel],.field input[type=email]{min-height:48px;padding:10px 12px;background:var(--obsidian);
  border:1px solid var(--line);border-radius:2px;color:var(--text);font-family:var(--body);font-size:16px}
.field input:focus-visible{border-color:var(--text)}
.field input[aria-invalid="true"]{border-color:var(--garnet-text)}
.err{font-size:14px;color:var(--garnet-text)}
.check{flex-direction:row;align-items:flex-start;gap:12px}
.check input{width:22px;height:22px;margin-top:2px;accent-color:var(--garnet);flex:none}
.timer{border:1px solid var(--garnet);padding:16px;display:flex;justify-content:space-between;align-items:center;gap:12px}
.timer strong{font-family:var(--head);font-size:40px;font-weight:400;letter-spacing:.06em}
.alert{border-left:2px solid var(--garnet-text);padding:10px 14px;background:var(--raised);font-size:15px}
.row{display:flex;gap:10px;flex-wrap:wrap}
.code{font-family:var(--head);font-size:30px;letter-spacing:.12em}
.soldout{border:1px solid var(--line);padding:40px 28px;text-align:center}
.soldout h2{font-size:32px;margin-bottom:10px}
.soldout p{color:var(--muted);max-width:44ch;margin:0 auto 20px}

.scrim{position:fixed;inset:0;background:rgba(12,8,18,.88);display:flex;align-items:center;justify-content:center;padding:24px;z-index:40}
.dlg{background:var(--surface);border:1px solid var(--amethyst-deep);max-width:440px;width:100%;padding:28px}
.dlg .tag{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.dlg h2{font-size:26px;margin:8px 0 10px}
.dlg p{color:var(--soft);margin-bottom:20px}

.sim{position:fixed;left:0;right:0;bottom:0;z-index:30;background:#1C1C1F;color:#E6E6EA;border-top:1px solid #3A3A40;
  font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px}
.simin{max-width:1240px;margin:0 auto;padding:12px 24px;display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center}
.simin strong{font-size:13px;color:#B5B5BD}
.simin button{font:inherit;min-height:40px;padding:8px 12px;border-radius:6px;border:1px solid #4A4A52;background:#26262A;color:#E6E6EA;cursor:pointer}
.simin button[aria-pressed="true"]{background:#E6E6EA;color:#1C1C1F;border-color:#E6E6EA}
.simin button:disabled{opacity:.45;cursor:not-allowed}
.simin button:focus-visible{outline:2px solid #E6E6EA;outline-offset:2px}
`;

  const planButtons = TABLES.map((tb) => {
    const st = tb.id === sel ? "sel" : statusOf(tb);
    const label =
      st === "booked" ? `${tb.id}, booked` : st === "held" ? `${tb.id}, held by another guest` : st === "small" ? `${tb.id}, seats ${tb.cap}, too small for ${party}` : `${tb.id}, ${ZONES[tb.zone].name}, seats ${tb.cap}, minimum spend ${idr(MIN[night][tb.zone])}`;
    return (
      <button
        key={tb.id}
        className={`tb ${tb.shape} ${st}`}
        style={{ left: `${tb.x / 10}%`, top: `${tb.y / 6.2}%` }}
        aria-label={label}
        aria-pressed={tb.id === sel}
        aria-disabled={st !== "free" && st !== "sel" ? "true" : locked ? "true" : undefined}
        onClick={() => pick(tb)}
      >
        {tb.id}
        <small>{st === "booked" ? "Booked" : st === "held" ? "Held" : `Seats ${tb.cap}`}</small>
      </button>
    );
  });

  let panel;
  if (soldOut) {
    panel = null;
  } else if (stage === "confirmed" && t) {
    panel = (
      <>
        <div className="lbl">Booking confirmed</div>
        <h2 className="head">You're <span className="two">in</span></h2>
        <dl className="facts">
          <dt>Booking code</dt><dd className="code">{code}</dd>
          <dt>Night</dt><dd>{n.name}, {n.day} {n.date}</dd>
          <dt>Table</dt><dd>{t.id}, {ZONES[t.zone].name}</dd>
          <dt>Deposit paid</dt><dd>{idr(deposit)}</dd>
          <dt>Still to spend at the club</dt><dd className="big">{idr(min - deposit)}</dd>
        </dl>
        <p className="hint">We emailed your QR to {form.email}. Show it at the door with your ID.</p>
        <button className="btn solid" onClick={() => setNote("qr")}>View your QR</button>
      </>
    );
  } else if (stage === "expired" && t) {
    panel = (
      <>
        <div className="lbl">Hold expired</div>
        <h2 className="head">{t.id} was released</h2>
        <p className="hint">The deposit wasn't paid within 15 minutes, so the table is open to other guests again. Nothing was charged.</p>
        <button className="btn solid" onClick={release}>Choose a table again</button>
      </>
    );
  } else if ((stage === "held" || stage === "paying") && t) {
    panel = (
      <>
        <div className="lbl">Table held for you</div>
        <h2 className="head">{t.id} · {ZONES[t.zone].name}</h2>
        <div className="timer" role="timer" aria-live="off">
          <span>Pay the deposit within</span>
          <strong>{mmss(left)}</strong>
        </div>
        {payError && (
          <p className="alert" role="alert">The payment didn't go through. Your table is still held; try again or use another card.</p>
        )}
        <dl className="facts">
          <dt>Minimum spend</dt><dd>{idr(min)}</dd>
          <dt>Deposit now</dt><dd className="big">{idr(deposit)}</dd>
        </dl>
        <p className="hint">The full deposit goes toward your minimum spend. It isn't refunded if you cancel or don't come. Test mode through Xendit: no real money moves.</p>
        <div className="row">
          <button className="btn solid" onClick={pay} disabled={stage === "paying"}>
            {stage === "paying" ? "Processing payment..." : `Pay ${idr(deposit)}`}
          </button>
          <button className="btn line" onClick={release} disabled={stage === "paying"}>Release table</button>
        </div>
      </>
    );
  } else if (t) {
    panel = (
      <form onSubmit={hold} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="lbl">Your table</div>
        <h2 className="head">{t.id} · {ZONES[t.zone].name}</h2>
        <dl className="facts">
          <dt>Seats</dt><dd>Up to {t.cap}</dd>
          <dt>Minimum spend</dt><dd>{idr(min)}</dd>
          <dt>Deposit to hold it</dt><dd className="big">{idr(deposit)}</dd>
        </dl>
        <div className="field">
          <label htmlFor="nm">Name for the booking</label>
          <input id="nm" type="text" autoComplete="name" value={form.name} aria-invalid={!!errors.name} aria-describedby={errors.name ? "nm-e" : undefined}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {errors.name && <span id="nm-e" className="err">{errors.name}</span>}
        </div>
        <div className="field">
          <label htmlFor="ph">Phone number</label>
          <input id="ph" type="tel" autoComplete="tel" inputMode="tel" placeholder="+62 812 3456 7890" value={form.phone} aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "ph-e" : undefined} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          {errors.phone && <span id="ph-e" className="err">{errors.phone}</span>}
        </div>
        <div className="field">
          <label htmlFor="em">Email, for your QR</label>
          <input id="em" type="email" autoComplete="email" value={form.email} aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "em-e" : undefined} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {errors.email && <span id="em-e" className="err">{errors.email}</span>}
        </div>
        <div className="field check">
          <input id="ag" type="checkbox" checked={form.age} aria-invalid={!!errors.age} aria-describedby={errors.age ? "ag-e" : undefined}
            onChange={(e) => setForm({ ...form, age: e.target.checked })} />
          <div>
            <label htmlFor="ag">Everyone in my group is 21 or over and will bring ID</label>
            {errors.age && <div id="ag-e" className="err">{errors.age}</div>}
          </div>
        </div>
        <button type="submit" className="btn solid">Hold this table for 15 minutes</button>
        <p className="hint">Holding is free. You pay the deposit on the next step. Deposits aren't refunded for cancellations or no-shows.</p>
      </form>
    );
  } else {
    panel = (
      <>
        <div className="lbl">Minimum spend on {n.name}</div>
        <ul className="zones">
          {Object.entries(ZONES).map(([k, z]) => (
            <li key={k}><div>{z.name}<br /><span>{z.seats}</span></div><div>{idr(MIN[night][k])}</div></li>
          ))}
        </ul>
        <p className="hint">Choose a table on the plan. Tables too small for {party} {party === 1 ? "person" : "people"} are dimmed.</p>
      </>
    );
  }

  return (
    <div className="site">
      <style>{css}</style>

      <header className="nav">
        <div className="navin">
          <a href="#top" className="mark head">THE FANGLLE <span className="two">II</span></a>
          <a href="#top" className="back">Back to home</a>
        </div>
      </header>

      <main className="wrap" id="top">
        <h1 className="h1 head">Choose your <em>table</em></h1>
        <p className="sub">Pick the night and your group size, then choose a table on the floor plan.</p>

        <div className="bar">
          <div>
            <span className="lbl" id="night-l">Night</span>
            <div className="chips" role="group" aria-labelledby="night-l">
              {NIGHTS.map((x) => {
                const out = TABLES.every((tb) => TAKEN[x.key].booked.includes(tb.id) || TAKEN[x.key].held.includes(tb.id));
                return (
                  <button key={x.key} className="chip" aria-pressed={night === x.key} disabled={locked} onClick={() => changeNight(x.key)}>
                    {x.day} {x.date}
                    <small>{out ? "Sold out" : x.name}</small>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <span className="lbl" id="party-l">Group size</span>
            <div className="step" role="group" aria-labelledby="party-l">
              <button aria-label="One fewer person" disabled={locked || party <= 1} onClick={() => changeParty(-1)}>−</button>
              <output aria-live="polite">{party}</output>
              <button aria-label="One more person" disabled={locked || party >= 12} onClick={() => changeParty(1)}>+</button>
            </div>
          </div>
        </div>

        <section className="evinfo" aria-live="polite" aria-label="About the selected night">
          <div>
            <div className="evname head">{n.name}</div>
            <div className="evmeta">{n.day} {n.date} · {n.genre}</div>
          </div>
          <div className="evline">
            <span className="evhead">{n.head}</span>
            <span className="evwith">with {n.with}</span>
          </div>
          <button className="btn line evlink" onClick={() => setNote("night")}>See the full night</button>
        </section>

        {soldOut ? (
          <div className="soldout" style={{ marginTop: 28 }}>
            <h2 className="head">{n.name} is fully booked</h2>
            <p>Every table for {n.day} {n.date} is taken, and the guestlist is full too. Try another night.</p>
            <button className="btn line" onClick={() => changeNight("sun")}>See Sunday, Afterglow</button>
          </div>
        ) : (
          <div className="grid">
            <div>
              <div className="viewtoggle">
                <p>{locked ? "Release your table to choose a different one." : "Stage at the top, bar at the bottom."}</p>
                <button className="btn line" style={{ minHeight: 44, padding: "8px 16px", fontSize: 15 }}
                  onClick={() => setView(view === "plan" ? "list" : "plan")}>
                  {view === "plan" ? "Show as a list" : "Show the floor plan"}
                </button>
              </div>

              {view === "plan" ? (
                <>
                  <div className="scroller">
                    <div className="plan">
                      <svg viewBox="0 0 1000 620" aria-hidden="true">
                        <rect x="380" y="22" width="240" height="60" fill="#1E1530" stroke="#3D2A58" />
                        <text x="500" y="58" textAnchor="middle" fill="#A99DB8" fontSize="18" fontFamily="Didact Gothic">DJ booth</text>
                        <rect x="270" y="105" width="460" height="265" fill="none" stroke="#2E2342" strokeDasharray="6 6" />
                        <text x="500" y="245" textAnchor="middle" fill="#563C7A" fontSize="22" fontFamily="Poiret One" letterSpacing="4">DANCE FLOOR</text>
                        <rect x="250" y="545" width="500" height="46" fill="#1E1530" stroke="#3D2A58" />
                        <text x="500" y="575" textAnchor="middle" fill="#A99DB8" fontSize="18" fontFamily="Didact Gothic">Bar</text>
                        <text x="72" y="72" textAnchor="middle" fill="#A99DB8" fontSize="15" fontFamily="Didact Gothic">Booths</text>
                        <text x="928" y="72" textAnchor="middle" fill="#A99DB8" fontSize="15" fontFamily="Didact Gothic">Booths</text>
                        <text x="500" y="418" textAnchor="middle" fill="#A99DB8" fontSize="15" fontFamily="Didact Gothic">Bar tables</text>
                        <text x="60" y="600" fill="#A99DB8" fontSize="15" fontFamily="Didact Gothic">Entrance</text>
                      </svg>
                      {planButtons}
                    </div>
                  </div>
                  <div className="legend" aria-hidden="true">
                    <span><i className="sw" />Available</span>
                    <span><i className="sw sel" />Your choice</span>
                    <span><i className="sw held" />Held by another guest</span>
                    <span><i className="sw booked" />Booked or too small</span>
                  </div>
                </>
              ) : (
                <ul className="list">
                  {TABLES.map((tb) => {
                    const st = tb.id === sel ? "sel" : statusOf(tb);
                    return (
                      <li key={tb.id}>
                        <div>
                          {tb.id} · {ZONES[tb.zone].name}
                          <div className="who">Seats {tb.cap} · {idr(MIN[night][tb.zone])}</div>
                        </div>
                        {st === "free" || st === "sel" ? (
                          <button className={`btn ${st === "sel" ? "solid" : "line"}`} style={{ minHeight: 44 }} aria-pressed={st === "sel"}
                            disabled={locked && st !== "sel"} onClick={() => pick(tb)}>
                            {st === "sel" ? "Chosen" : "Choose"}
                          </button>
                        ) : (
                          <span className="who">{st === "booked" ? "Booked" : st === "held" ? "Held" : `Too small for ${party}`}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <aside className="panel" ref={panelRef} tabIndex={-1} aria-live="polite">
              {panel}
            </aside>
          </div>
        )}
      </main>

      {note && (
        <div className="scrim" onClick={(e) => e.target === e.currentTarget && setNote(false)}>
          <div className="dlg" role="dialog" aria-modal="true" aria-labelledby="note-t">
            <div className="tag">Catatan mockup</div>
            <h2 id="note-t" className="head">{note === "night" ? "Detail event" : "Halaman QR tamu"}</h2>
            <p>{note === "night" ? `Membuka halaman Detail event untuk ${n.name}: jadwal set lengkap, deskripsi, dan informasi malam itu.` : "Ada di mockup halaman QR tamu: QR yang tetap tampil tanpa sinyal, dengan nama dan jumlah orang di bawahnya."}</p>
            <button className="btn solid" autoFocus onClick={() => setNote(false)}>Tutup</button>
          </div>
        </div>
      )}

      <div className="sim" role="region" aria-label="Kontrol pratinjau">
        <div className="simin">
          <strong>Kontrol pratinjau (tidak ada di versi asli)</strong>
          <span>Pembayaran berikutnya:</span>
          <button aria-pressed={nextPay === "ok"} onClick={() => setNextPay("ok")}>Berhasil</button>
          <button aria-pressed={nextPay === "fail"} onClick={() => setNextPay("fail")}>Gagal</button>
          <button disabled={stage !== "held"} onClick={() => setLeft(3)}>Habiskan waktu tahan</button>
          <button onClick={() => { setStage("choose"); setSel(null); setForm({ name: "", phone: "", email: "", age: false }); setErrors({}); }}>Mulai ulang</button>
        </div>
      </div>
    </div>
  );
}
