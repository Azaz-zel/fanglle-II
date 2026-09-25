import React, { useState, useEffect, useRef } from "react";

const NIGHTS = [
  { key: "thu", day: "Thu", date: "24 Sep", name: "Descent", headliner: "Ilse Varga", with: "Rafi Hartono", genre: "Melodic techno", left: 42 },
  { key: "fri", day: "Fri", date: "25 Sep", name: "Second Wave", headliner: "Marcel Oduya", with: "Bayu Kencana, Lintang, Kirana", genre: "Afro house", left: 6 },
  { key: "sat", day: "Sat", date: "26 Sep", name: "Fall Line", headliner: "Nadia Sorrel", with: "Dewa Anom", genre: "Tech house", left: 0 },
  { key: "sun", day: "Sun", date: "27 Sep", name: "Afterglow", headliner: "Theo Brandt", with: "Saka", genre: "Deep house", left: 60 },
];

const emptyForm = { name: "", phone: "", email: "", guests: Array(9).fill(""), age: false };

export default function App() {
  const [night, setNight] = useState("thu");
  const [party, setParty] = useState(4);
  const [qr, setQr] = useState("group");
  const [showNames, setShowNames] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [stage, setStage] = useState("form");
  const [nextResult, setNextResult] = useState("ok");
  const [note, setNote] = useState(null);
  const firstErr = useRef(null);
  const resultRef = useRef(null);

  const n = NIGHTS.find((x) => x.key === night);
  const tooMany = n.left > 0 && party > n.left;
  const namesRequired = qr === "person";
  const namesVisible = namesRequired || showNames;

  useEffect(() => {
    if (stage === "done" || stage === "dupe") resultRef.current?.focus();
  }, [stage]);

  useEffect(() => {
    if (!note) return;
    const onKey = (e) => e.key === "Escape" && setNote(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [note]);

  function setGuest(i, v) {
    const g = [...form.guests];
    g[i] = v;
    setForm({ ...form, guests: g });
  }

  function submit(e) {
    e.preventDefault();
    const er = {};
    if (!form.name.trim()) er.name = "Enter your name as it appears on your ID.";
    if (!/^\+?[0-9\s-]{9,16}$/.test(form.phone.trim())) er.phone = "Enter your phone number. The door uses it to find you on the list.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) er.email = "Enter your email. Your QR is sent there.";
    if (namesRequired) {
      for (let i = 0; i < party - 1; i++) if (!form.guests[i].trim()) er[`g${i}`] = `Enter guest ${i + 2}'s name. Each QR carries one name.`;
    }
    if (!form.age) er.age = "Everyone in the group must be 21 or over.";
    setErrors(er);
    const keys = Object.keys(er);
    if (keys.length) {
      const id = keys[0] === "name" ? "gn" : keys[0] === "phone" ? "gp" : keys[0] === "email" ? "ge" : keys[0] === "age" ? "ga" : `g-${keys[0].slice(1)}`;
      setTimeout(() => document.getElementById(id)?.focus(), 0);
      return;
    }
    setStage("sending");
    setTimeout(() => setStage(nextResult === "dupe" ? "dupe" : "done"), 1000);
  }

  function restart() {
    setStage("form");
    setForm(emptyForm);
    setErrors({});
    setShowNames(false);
  }

  const people = [form.name || "You", ...form.guests.slice(0, party - 1).map((g, i) => g || `Guest ${i + 2}`)];
  const share = (who) =>
    `https://wa.me/?text=${encodeURIComponent(`${who}, here is your entry QR for The Fanglle II, ${n.name}, ${n.day} ${n.date}. Valid until 11 pm with your ID: https://example.com/q/demo`)}`;

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
@media (prefers-reduced-motion:reduce){.btn{transition:none}}

.nav{border-bottom:1px solid var(--line-soft)}
.navin{max-width:1240px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;gap:20px}
.mark{font-size:20px;letter-spacing:.12em;text-decoration:none;white-space:nowrap}
.back{margin-left:auto;font-size:15px;color:var(--muted);text-decoration:none}
.back:hover{color:var(--text)}

.wrap{max-width:1240px;margin:0 auto;padding:40px 24px 0}
.h1{font-size:clamp(34px,5vw,56px);line-height:1.1;letter-spacing:.02em}
.h1 em{font-style:normal;color:var(--soft)}
.sub{color:var(--muted);margin-top:10px;max-width:60ch}
.lbl{display:block;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:10px}

.grid{display:grid;grid-template-columns:1fr;gap:32px;margin-top:32px}
@media (min-width:1000px){.grid{grid-template-columns:minmax(0,1.6fr) minmax(300px,1fr);align-items:start}}

.block{padding:26px 0;border-top:1px solid var(--line)}
.block:first-child{border-top:0;padding-top:0}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{min-height:56px;padding:8px 16px;background:transparent;border:1px solid var(--line);color:var(--text);font-family:var(--body);
  font-size:15px;cursor:pointer;border-radius:2px;text-align:left;line-height:1.3}
.chip small{display:block;color:var(--muted);font-size:13px}
.chip small.low{color:var(--garnet-text)}
.chip[aria-pressed="true"]{border-color:var(--garnet);background:var(--surface)}
.chip:disabled{cursor:not-allowed;opacity:.55}
.step{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:2px}
.step button{width:48px;height:52px;background:transparent;border:0;color:var(--text);font-size:22px;cursor:pointer}
.step button:disabled{color:var(--line);cursor:not-allowed}
.step output{min-width:64px;text-align:center;font-size:20px}
.warn{margin-top:12px;border-left:2px solid var(--garnet-text);padding:8px 12px;background:var(--raised);font-size:15px}

fieldset{border:0}
legend{display:block;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:10px}
.opts{display:grid;grid-template-columns:1fr;gap:10px}
@media (min-width:640px){.opts{grid-template-columns:1fr 1fr}}
.opt{display:flex;gap:14px;align-items:flex-start;padding:16px;border:1px solid var(--line);cursor:pointer}
.opt.on{border-color:var(--garnet);background:var(--surface)}
.opt input{width:22px;height:22px;margin-top:3px;accent-color:var(--garnet);flex:none}
.opt strong{display:block;font-weight:400;font-size:17px}
.opt span{display:block;font-size:14px;color:var(--muted)}

.fields{display:grid;grid-template-columns:1fr;gap:16px}
@media (min-width:640px){.fields.two-col{grid-template-columns:1fr 1fr}}
.field{display:flex;flex-direction:column;gap:6px}
.field label{font-size:15px}
.field label span{color:var(--muted)}
.field input[type=text],.field input[type=tel]{min-height:48px;padding:10px 12px;background:var(--surface);border:1px solid var(--line);
  border-radius:2px;color:var(--text);font-family:var(--body);font-size:16px}
.field input:focus-visible{border-color:var(--text)}
.field input[aria-invalid="true"]{border-color:var(--garnet-text)}
.err{font-size:14px;color:var(--garnet-text)}
.check{flex-direction:row;align-items:flex-start;gap:12px}
.check input{width:22px;height:22px;margin-top:2px;accent-color:var(--garnet);flex:none}
.linkbtn{background:none;border:0;color:var(--soft);font-family:var(--body);font-size:15px;text-decoration:underline;cursor:pointer;
  min-height:44px;padding:0;text-underline-offset:3px}
.hint{font-size:14px;color:var(--muted)}
.submit{display:flex;flex-direction:column;gap:10px;align-items:flex-start;padding-top:26px;border-top:1px solid var(--line)}

.side{border:1px solid var(--amethyst-deep);background:var(--surface);padding:26px 24px;display:flex;flex-direction:column;gap:16px}
.side h2{font-size:30px;line-height:1.1}
.facts{display:grid;grid-template-columns:auto 1fr;gap:6px 16px;font-size:15px}
.facts dt{color:var(--muted)}
.facts dd{text-align:right}
.rules{list-style:none;display:flex;flex-direction:column;gap:8px;font-size:15px;color:var(--soft)}
.rules li::before{content:"";display:inline-block;width:6px;height:6px;margin-right:12px;vertical-align:2px;background:var(--amethyst-soft);
  clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}

.result{max-width:760px;margin-top:32px}
.result:focus{outline:none}
.result:focus-visible{outline:2px solid var(--text);outline-offset:6px}
.result h2{font-size:clamp(32px,4.5vw,48px);line-height:1.1}
.qrlist{list-style:none;margin-top:20px;border-top:1px solid var(--line)}
.qrlist li{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:16px 0;border-bottom:1px solid var(--line)}
.qrlist .who small{display:block;color:var(--muted);font-size:14px}
.row{display:flex;gap:10px;flex-wrap:wrap}
.card{border:1px solid var(--amethyst-deep);background:var(--surface);padding:22px;margin-top:20px;display:flex;flex-direction:column;gap:14px}

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
.simin button:focus-visible{outline:2px solid #E6E6EA;outline-offset:2px}
`;

  const side = (
    <aside className="side">
      <div className="lbl">Your night</div>
      <h2 className="head">{n.name}</h2>
      <dl className="facts">
        <dt>Date</dt><dd>{n.day} {n.date}</dd>
        <dt>Headliner</dt><dd>{n.headliner}</dd>
        <dt>With</dt><dd>{n.with}</dd>
        <dt>Sound</dt><dd>{n.genre}</dd>
        <dt>Free entry</dt><dd>Until 11 pm</dd>
        <dt>Places left</dt><dd>{n.left === 0 ? "None" : n.left}</dd>
      </dl>
      <ul className="rules">
        <li>Arrive before 11 pm. After that, the list closes.</li>
        <li>Bring ID. Names are checked at the door.</li>
        <li>One sign-up per phone number each night.</li>
      </ul>
    </aside>
  );

  let body;
  if (stage === "done") {
    body = (
      <section className="result" ref={resultRef} tabIndex={-1} aria-live="polite">
        <div className="lbl">Signed up</div>
        <h2 className="head">You're on the <span className="two">list</span></h2>
        <p className="sub">
          {party} {party === 1 ? "person" : "people"} for {n.name}, {n.day} {n.date}. Free entry until 11 pm. We emailed your QR to {form.email}. It's also on this page.
        </p>
        {qr === "group" ? (
          <div className="card">
            <div>
              <div style={{ fontSize: 20 }}>One QR for {party} {party === 1 ? "person" : "people"}</div>
              <div className="hint">Organiser: {form.name}. Guests can come in separately; the door counts who has arrived.</div>
            </div>
            <div className="row">
              <button className="btn solid" onClick={() => setNote("qr")}>View your QR</button>
            </div>
          </div>
        ) : (
          <>
            <p className="hint" style={{ marginTop: 16 }}>Send each guest their own QR. It opens WhatsApp from your phone with the link ready.</p>
            <ul className="qrlist">
              {people.map((who, i) => (
                <li key={i}>
                  <div className="who">
                    {who}
                    <small>{i === 0 ? "Your QR" : `Guest ${i + 1}`}</small>
                  </div>
                  <div className="row">
                    <button className="btn line" style={{ minHeight: 44 }} onClick={() => setNote("qr")}>View</button>
                    {i > 0 && (
                      <a className="btn line" style={{ minHeight: 44 }} href={share(who)} target="_blank" rel="noopener noreferrer">
                        Share on WhatsApp
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="row" style={{ marginTop: 24 }}>
          <button className="btn line" onClick={restart}>Sign up for another night</button>
        </div>
      </section>
    );
  } else if (stage === "dupe") {
    body = (
      <section className="result" ref={resultRef} tabIndex={-1} role="alert">
        <div className="lbl">Already on the list</div>
        <h2 className="head">This number is already <span className="two">in</span></h2>
        <p className="sub">
          {form.phone} already has a guestlist spot for {n.name}. Each number can sign up once per night. Your QR is in the email we sent earlier.
        </p>
        <div className="row" style={{ marginTop: 24 }}>
          <button className="btn solid" onClick={() => setNote("resend")}>Send my QR again</button>
          <button className="btn line" onClick={() => setStage("form")}>Choose another night</button>
        </div>
      </section>
    );
  } else {
    body = (
      <div className="grid">
        <form onSubmit={submit} noValidate>
          <div className="block">
            <span className="lbl" id="night-l">Night</span>
            <div className="chips" role="group" aria-labelledby="night-l">
              {NIGHTS.map((x) => (
                <button type="button" key={x.key} className="chip" aria-pressed={night === x.key} disabled={x.left === 0}
                  onClick={() => setNight(x.key)}>
                  {x.day} {x.date}
                  <small className={x.left > 0 && x.left <= 10 ? "low" : ""}>
                    {x.left === 0 ? "Guestlist full" : `${x.left} places left`}
                  </small>
                </button>
              ))}
            </div>
          </div>

          <div className="block">
            <span className="lbl" id="party-l">How many people, including you</span>
            <div className="step" role="group" aria-labelledby="party-l">
              <button type="button" aria-label="One fewer person" disabled={party <= 1} onClick={() => setParty(party - 1)}>−</button>
              <output aria-live="polite">{party}</output>
              <button type="button" aria-label="One more person" disabled={party >= 10} onClick={() => setParty(party + 1)}>+</button>
            </div>
            {tooMany && (
              <p className="warn" role="status">
                Only {n.left} places left on {n.name}. Make your group smaller, or choose another night.
              </p>
            )}
          </div>

          {party > 1 && (
            <div className="block">
              <fieldset>
                <legend>How do you want your QR</legend>
                <div className="opts">
                  <label className={`opt${qr === "group" ? " on" : ""}`}>
                    <input type="radio" name="qr" checked={qr === "group"} onChange={() => setQr("group")} />
                    <div>
                      <strong>One QR for the group</strong>
                      <span>Only your name is needed. The door counts people in as they arrive.</span>
                    </div>
                  </label>
                  <label className={`opt${qr === "person" ? " on" : ""}`}>
                    <input type="radio" name="qr" checked={qr === "person"} onChange={() => setQr("person")} />
                    <div>
                      <strong>One QR per person</strong>
                      <span>Friends can arrive on their own. Each QR carries one name.</span>
                    </div>
                  </label>
                </div>
              </fieldset>
            </div>
          )}

          <div className="block">
            <span className="lbl">Your details</span>
            <div className="fields two-col">
              <div className="field">
                <label htmlFor="gn">Full name, as on your ID</label>
                <input id="gn" type="text" autoComplete="name" value={form.name} aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "gn-e" : undefined} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                {errors.name && <span id="gn-e" className="err">{errors.name}</span>}
              </div>
              <div className="field">
                <label htmlFor="gp">Phone number</label>
                <input id="gp" type="tel" autoComplete="tel" inputMode="tel" placeholder="+62 812 3456 7890" value={form.phone}
                  aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "gp-e" : undefined}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                {errors.phone && <span id="gp-e" className="err">{errors.phone}</span>}
              </div>
              <div className="field">
                <label htmlFor="ge">Email, for your QR</label>
                <input id="ge" type="email" autoComplete="email" value={form.email}
                  aria-invalid={!!errors.email} aria-describedby={errors.email ? "ge-e" : undefined}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
                {errors.email && <span id="ge-e" className="err">{errors.email}</span>}
              </div>
            </div>
          </div>

          {party > 1 && (
            <div className="block">
              <span className="lbl">Guest names</span>
              {!namesVisible ? (
                <>
                  <p className="hint">Optional with one group QR. Names help the door check ID faster.</p>
                  <button type="button" className="linkbtn" onClick={() => setShowNames(true)}>Add guest names</button>
                </>
              ) : (
                <>
                  <p className="hint" style={{ marginBottom: 14 }}>
                    {namesRequired ? "Required: each QR carries the name that will be checked against ID." : "Optional. Leave any of them empty if you don't know yet."}
                  </p>
                  <div className="fields two-col">
                    {Array.from({ length: party - 1 }, (_, i) => (
                      <div className="field" key={i}>
                        <label htmlFor={`g-${i}`}>
                          Guest {i + 2} name {!namesRequired && <span>(optional)</span>}
                        </label>
                        <input id={`g-${i}`} type="text" value={form.guests[i]} aria-invalid={!!errors[`g${i}`]}
                          aria-describedby={errors[`g${i}`] ? `g-${i}-e` : undefined} onChange={(e) => setGuest(i, e.target.value)} />
                        {errors[`g${i}`] && <span id={`g-${i}-e`} className="err">{errors[`g${i}`]}</span>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="block">
            <div className="field check">
              <input id="ga" type="checkbox" checked={form.age} aria-invalid={!!errors.age} aria-describedby={errors.age ? "ga-e" : undefined}
                onChange={(e) => setForm({ ...form, age: e.target.checked })} />
              <div>
                <label htmlFor="ga">Everyone in my group is 21 or over and will bring ID</label>
                {errors.age && <div id="ga-e" className="err">{errors.age}</div>}
              </div>
            </div>
          </div>

          <div className="submit">
            <button type="submit" className="btn solid" disabled={tooMany || stage === "sending"}>
              {stage === "sending" ? "Adding you to the list..." : `Add ${party} ${party === 1 ? "person" : "people"} to the list`}
            </button>
            <p className="hint">No account needed. Your QR shows on the next screen and arrives by email.</p>
          </div>
        </form>
        {side}
      </div>
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
        <h1 className="h1 head">Join the <em>guestlist</em></h1>
        <p className="sub">Free entry before 11 pm. One sign-up covers up to ten people.</p>
        {body}
      </main>

      {note && (
        <div className="scrim" onClick={(e) => e.target === e.currentTarget && setNote(null)}>
          <div className="dlg" role="dialog" aria-modal="true" aria-labelledby="note-t">
            <div className="tag">Catatan mockup</div>
            <h2 id="note-t" className="head">{note === "qr" ? "Halaman QR tamu" : "Kirim ulang QR"}</h2>
            <p>
              {note === "qr"
                ? "Dibangun di mockup nomor 3: QR yang tetap tampil tanpa sinyal, dengan nama dan jumlah orang di bawahnya."
                : "Versi asli mengirim ulang tautan QR ke email yang sama, dengan batas beberapa kali per jam agar tidak disalahgunakan."}
            </p>
            <button className="btn solid" autoFocus onClick={() => setNote(null)}>Tutup</button>
          </div>
        </div>
      )}

      <div className="sim" role="region" aria-label="Kontrol pratinjau">
        <div className="simin">
          <strong>Kontrol pratinjau (tidak ada di versi asli)</strong>
          <span>Hasil kirim berikutnya:</span>
          <button aria-pressed={nextResult === "ok"} onClick={() => setNextResult("ok")}>Berhasil</button>
          <button aria-pressed={nextResult === "dupe"} onClick={() => setNextResult("dupe")}>Nomor sudah terdaftar</button>
          <button onClick={() => { restart(); setNight("thu"); setParty(4); setQr("group"); }}>Mulai ulang</button>
        </div>
      </div>
    </div>
  );
}
