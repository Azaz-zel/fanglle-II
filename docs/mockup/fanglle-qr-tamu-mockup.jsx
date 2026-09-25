import React, { useState, useEffect, useMemo } from "react";

const TYPES = {
  group: { title: "Guestlist · group", names: ["Ayu Pratiwi"], people: 4, night: "Descent", date: "Thu 24 Sep", until: "Valid until 11 pm", seed: 11 },
  person: { title: "Guestlist · personal", names: ["Kadek Surya"], people: 1, night: "Descent", date: "Thu 24 Sep", until: "Valid until 11 pm", organiser: "Ayu Pratiwi", seed: 29 },
  table: { title: "Table booking", names: ["Made Wirawan"], people: 7, night: "Descent", date: "Thu 24 Sep", until: "Valid all night", table: "B5 · Booths", code: "F2-7K4Q", remaining: "IDR 7,500,000", seed: 47 },
};

function useQrPattern(seed) {
  return useMemo(() => {
    const size = 25;
    let s = seed;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const cells = [];
    const finder = (r, c) =>
      [[0, 0], [0, size - 7], [size - 7, 0]].some(([fr, fc]) => r >= fr && r < fr + 7 && c >= fc && c < fc + 7);
    const finderOn = (r, c) => {
      for (const [fr, fc] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
        if (r >= fr && r < fr + 7 && c >= fc && c < fc + 7) {
          const y = r - fr, x = c - fc;
          if (y === 0 || y === 6 || x === 0 || x === 6) return true;
          if (y >= 2 && y <= 4 && x >= 2 && x <= 4) return true;
          return false;
        }
      }
      return false;
    };
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++) {
        const on = finder(r, c) ? finderOn(r, c) : rnd() > 0.52;
        if (on) cells.push([r, c]);
      }
    return { size, cells };
  }, [seed]);
}

export default function App() {
  const [type, setType] = useState("group");
  const [state, setState] = useState("ready");
  const [offline, setOffline] = useState(false);
  const [wake, setWake] = useState("off");
  const [note, setNote] = useState(false);
  const t = TYPES[type];
  const qr = useQrPattern(t.seed);

  useEffect(() => {
    setWake("off");
  }, [type, state]);

  async function keepAwake() {
    try {
      if (!("wakeLock" in navigator)) throw new Error("unsupported");
      const lock = await navigator.wakeLock.request("screen");
      setWake("on");
      lock.addEventListener("release", () => setWake("off"));
    } catch {
      setWake("failed");
    }
  }

  const inCount = state === "partial" ? 2 : state === "used" ? t.people : 0;
  const dim = state === "used" || state === "expired";

  const css = `
@import url('https://fonts.googleapis.com/css2?family=Poiret+One&family=Didact+Gothic&display=swap');
:root{
  --obsidian:#0C0812; --surface:#150E1F; --raised:#1E1530; --line:#2E2342;
  --amethyst-soft:#7A5BA6; --text:#EEE9F3; --soft:#C9BDD9; --muted:#A99DB8;
  --garnet:#A3162F; --garnet-text:#E5566B; --on-garnet:#FBF7FB;
  --head:'Poiret One','Helvetica Neue',Arial,sans-serif; --body:'Didact Gothic','Helvetica Neue',Arial,sans-serif;
}
*{box-sizing:border-box;margin:0;padding:0}
.root{min-height:100vh;background:#050308;padding:24px 12px 150px;display:flex;justify-content:center;font-family:var(--body)}
.hp{width:100%;max-width:390px;min-height:780px;background:var(--obsidian);color:var(--text);border:10px solid #000;border-radius:30px;
  overflow:hidden;display:flex;flex-direction:column;font-size:17px;line-height:1.55}
.top{padding:18px 20px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line)}
.mark{font-family:var(--head);font-size:17px;letter-spacing:.12em}
.two{color:var(--garnet-text)}
.kind{font-size:13px;color:var(--muted);letter-spacing:.08em;text-transform:uppercase}
.banner{padding:12px 20px;font-size:15px;background:var(--raised);border-bottom:1px solid var(--line)}
.banner.alert{border-left:3px solid var(--garnet-text)}
.body{flex:1;padding:20px;display:flex;flex-direction:column;gap:16px}
.status{font-size:15px;color:var(--soft)}
.status strong{font-weight:400;color:var(--text)}
.card{background:#FFFFFF;color:#0C0812;border-radius:4px;padding:18px 18px 16px;position:relative}
.qr{display:block;width:100%;aspect-ratio:1}
.card.dim .qr{opacity:.12}
.stamp{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px}
.stamp strong{font-family:var(--head);font-weight:400;font-size:40px;letter-spacing:.08em;color:#0C0812}
.stamp span{font-size:16px;color:#3B3346}
.who{margin-top:12px;text-align:center}
.who .nm{font-size:24px;line-height:1.2}
.who .ct{font-size:15px;color:#3B3346}
.facts{display:grid;grid-template-columns:auto 1fr;gap:4px 14px;font-size:15px}
.facts dt{color:var(--muted)}
.facts dd{text-align:right}
.hint{font-size:14px;color:var(--muted)}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 18px;font-family:var(--body);
  font-size:16px;border-radius:2px;cursor:pointer;width:100%}
.btn.line{background:transparent;color:var(--text);border:1px solid var(--amethyst-soft)}
.btn.line:hover{border-color:var(--text)}
.btn:focus-visible,.sim button:focus-visible{outline:2px solid var(--text);outline-offset:3px}
.msg{font-size:14px;color:var(--soft)}
.center{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px;padding:28px}
.center h1{font-family:var(--head);font-weight:400;font-size:30px;line-height:1.15}
.center p{color:var(--muted);max-width:30ch}
.skel{background:var(--raised);border-radius:4px}

.scrim{position:fixed;inset:0;background:rgba(12,8,18,.88);display:flex;align-items:center;justify-content:center;padding:24px;z-index:40}
.dlg{background:var(--surface);border:1px solid #3D2A58;max-width:420px;width:100%;padding:26px;color:var(--text);font-family:var(--body)}
.dlg .tag{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.dlg h2{font-family:var(--head);font-weight:400;font-size:26px;margin:8px 0 10px}
.dlg p{color:var(--soft);margin-bottom:18px}
.dlg ol{color:var(--soft);margin:0 0 18px 20px}

.sim{position:fixed;left:0;right:0;bottom:0;z-index:30;background:#1C1C1F;color:#E6E6EA;border-top:1px solid #3A3A40;
  font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px}
.simin{max-width:1100px;margin:0 auto;padding:10px 20px;display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center}
.simin strong{font-size:13px;color:#B5B5BD}
.simin button{font:inherit;min-height:38px;padding:6px 11px;border-radius:6px;border:1px solid #4A4A52;background:#26262A;color:#E6E6EA;cursor:pointer}
.simin button[aria-pressed="true"]{background:#E6E6EA;color:#1C1C1F;border-color:#E6E6EA}
.simnote{flex-basis:100%;color:#B5B5BD;font-size:13px}
`;

  let content;
  if (state === "loading") {
    content = (
      <div className="body" role="status" aria-label="Loading your QR">
        <div className="skel" style={{ height: 20, width: "60%" }} />
        <div className="skel" style={{ aspectRatio: "1", width: "100%" }} />
        <div className="skel" style={{ height: 20, width: "80%" }} />
      </div>
    );
  } else if (state === "invalid") {
    content = (
      <div className="center" role="alert">
        <h1>This link doesn't open a QR</h1>
        <p>It may be incomplete or copied wrong. Open the link from the email we sent, or ask the organiser to share it again.</p>
      </div>
    );
  } else {
    const statusText =
      state === "used" ? <>Used at <strong>22:14</strong>. This QR can't be scanned again.</> :
      state === "expired" ? <>The guestlist closed at <strong>11 pm</strong>. Entry now is at the door price.</> :
      state === "partial" ? <><strong>{inCount} of {t.people}</strong> in. The QR still works for the other {t.people - inCount}.</> :
      <>Ready for the door. Show it with your <strong>ID</strong>.</>;

    content = (
      <>
        {offline && (
          <div className="banner" role="status">
            No signal. Showing the copy saved on this phone at 21:40. It still works at the door.
          </div>
        )}
        <div className="body">
          <p className="status" aria-live="polite">{statusText}</p>

          <div className={`card${dim ? " dim" : ""}`}>
            <svg className="qr" viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`} role="img"
              aria-label={dim ? "QR no longer valid" : `Entry QR for ${t.names[0]}`} shapeRendering="crispEdges">
              {qr.cells.map(([r, c]) => <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0C0812" />)}
            </svg>
            {dim && (
              <div className="stamp">
                <strong>{state === "used" ? "USED" : "CLOSED"}</strong>
                <span>{state === "used" ? "Checked in at 22:14" : "Guestlist ended at 11 pm"}</span>
              </div>
            )}
            <div className="who">
              <div className="nm">{t.names[0]}</div>
              <div className="ct">
                {type === "group" ? `Group of ${t.people}` : type === "table" ? `Table for ${t.people}` : `Guest of ${t.organiser}`}
              </div>
            </div>
          </div>

          <dl className="facts">
            <dt>Night</dt><dd>{t.night}, {t.date}</dd>
            {type === "table" && (<><dt>Table</dt><dd>{t.table}</dd><dt>Booking</dt><dd>{t.code}</dd><dt>Still to spend</dt><dd>{t.remaining}</dd></>)}
            <dt>Entry</dt><dd>{t.until}</dd>
          </dl>

          {!dim && (
            <>
              <p className="hint">At the door, turn your screen brightness up. The scanner reads it faster.</p>
              <button className="btn line" onClick={keepAwake} disabled={wake === "on"} aria-pressed={wake === "on"}>
                {wake === "on" ? "Screen will stay on" : "Keep screen on while I queue"}
              </button>
              {wake === "failed" && (
                <p className="msg" role="status">This browser can't keep the screen on. Tap the screen now and then so it doesn't lock.</p>
              )}
              <button className="btn line" onClick={() => setNote(true)}>Save to home screen</button>
            </>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="root">
      <style>{css}</style>
      <div className="hp">
        <div className="top">
          <span className="mark">THE FANGLLE <span className="two">II</span></span>
          <span className="kind">{t.title}</span>
        </div>
        {content}
      </div>

      {note && (
        <div className="scrim" onClick={(e) => e.target === e.currentTarget && setNote(false)}>
          <div className="dlg" role="dialog" aria-modal="true" aria-labelledby="n-t">
            <div className="tag">Save to home screen</div>
            <h2 id="n-t">Open it without signal</h2>
            <p>Saved to your home screen, this page opens even when the club has no signal.</p>
            <ol>
              <li>Tap your browser's share or menu button</li>
              <li>Choose "Add to Home Screen"</li>
            </ol>
            <button className="btn line" autoFocus onClick={() => setNote(false)}>Done</button>
          </div>
        </div>
      )}

      <div className="sim" role="region" aria-label="Kontrol pratinjau">
        <div className="simin">
          <strong>Kontrol pratinjau (tidak ada di versi asli)</strong>
          <span>Jenis:</span>
          {[["group", "Rombongan"], ["person", "Per orang"], ["table", "Meja"]].map(([k, l]) => (
            <button key={k} aria-pressed={type === k} onClick={() => { setType(k); if (k !== "group" && state === "partial") setState("ready"); }}>{l}</button>
          ))}
          <span>Keadaan:</span>
          {[["ready", "Siap"], ["partial", "Sebagian masuk"], ["used", "Sudah dipakai"], ["expired", "Lewat jam 11"], ["invalid", "Tautan rusak"], ["loading", "Memuat"]].map(([k, l]) => (
            <button key={k} aria-pressed={state === k}
              disabled={(k === "partial" && type !== "group") || (k === "expired" && type === "table")}
              onClick={() => setState(k)}>{l}</button>
          ))}
          <button aria-pressed={offline} onClick={() => setOffline(!offline)}>Tanpa sinyal</button>
          <span className="simnote">QR di mockup ini hanya pola contoh dan tidak bisa dipindai. Versi asli membuat QR sungguhan dari token bertanda tangan.</span>
        </div>
      </div>
    </div>
  );
}
