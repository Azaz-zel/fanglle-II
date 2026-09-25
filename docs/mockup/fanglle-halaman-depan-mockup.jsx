import React, { useState, useEffect, useRef } from "react";

const NIGHTS = [
  { day: "Thu", date: "24", month: "Sep", name: "Descent", headliner: "Ilse Varga", support: "Rafi Hartono", genre: "Melodic techno", tables: "open", from: "5,000,000", guest: "open" },
  { day: "Fri", date: "25", month: "Sep", name: "Second Wave", headliner: "Marcel Oduya", support: "Kirana", genre: "Afro house", tables: "few", from: "8,000,000", guest: "open" },
  { day: "Sat", date: "26", month: "Sep", name: "Fall Line", headliner: "Nadia Sorrel", support: "Dewa Anom", genre: "Tech house", tables: "sold", from: "10,000,000", guest: "full" },
  { day: "Sun", date: "27", month: "Sep", name: "Afterglow", headliner: "Theo Brandt", support: "Saka", genre: "Deep house", tables: "open", from: "4,000,000", guest: "open" },
];

const SHARDS = [
  { p: "120,-40 210,-40 180,90", f: "#2A1D3D", d: 0 },
  { p: "300,-60 380,-20 330,140", f: "#3D2A58", d: 0.08 },
  { p: "520,-30 600,10 560,60 500,40", f: "#221931", d: 0.16 },
  { p: "700,-50 800,-50 760,120", f: "#563C7A", d: 0.04 },
  { p: "900,-20 980,30 930,190", f: "#2A1D3D", d: 0.2 },
  { p: "1080,-60 1170,-10 1120,110", f: "#3D2A58", d: 0.12 },
  { p: "220,160 260,190 230,270", f: "#563C7A", d: 0.28 },
  { p: "640,150 700,180 660,300 620,230", f: "#7A1024", d: 0.32 },
  { p: "1000,220 1040,250 1015,330", f: "#7A5BA6", d: 0.36 },
  { p: "420,260 450,280 435,340", f: "#7A5BA6", d: 0.4 },
];

function Shards() {
  return (
    <svg className="shards" viewBox="0 0 1200 360" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      {SHARDS.map((s, i) => (
        <polygon key={i} points={s.p} fill={s.f} style={{ animationDelay: `${s.d}s` }} />
      ))}
    </svg>
  );
}

function Divider() {
  return (
    <div className="divider" aria-hidden="true">
      <span className="rule" />
      <svg viewBox="0 0 20 28" className="mini"><polygon points="4,0 16,0 10,28" fill="#7A1024" /></svg>
      <span className="rule" />
    </div>
  );
}

function Mark() {
  return <>THE FANGLLE <span className="two">II</span></>;
}

export default function App() {
  const [dialog, setDialog] = useState(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!dialog) return;
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && setDialog(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog]);

  const tablesLabel = (n) =>
    n.tables === "sold" ? "Tables sold out" : n.tables === "few" ? `Last tables · from IDR ${n.from}` : `Tables from IDR ${n.from}`;
  const guestLabel = (n) => (n.guest === "full" ? "Guestlist full" : "Guestlist open until 11 pm");

  const css = `
@import url('https://fonts.googleapis.com/css2?family=Poiret+One&family=Didact+Gothic&display=swap');
:root{
  --obsidian:#0C0812; --surface:#150E1F; --raised:#1E1530;
  --line:#2E2342; --line-soft:#221931;
  --amethyst:#563C7A; --amethyst-deep:#3D2A58;
  --text:#EEE9F3; --soft:#C9BDD9; --muted:#A99DB8;
  --garnet:#A3162F; --garnet-hover:#B91C38; --garnet-text:#E5566B; --on-garnet:#FBF7FB;
  --head:'Poiret One','Helvetica Neue',Arial,sans-serif;
  --body:'Didact Gothic','Helvetica Neue',Arial,sans-serif;
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
.site{background:var(--obsidian);color:var(--text);font-family:var(--body);font-size:17px;line-height:1.65;min-height:100vh}
.serif{font-family:var(--head);font-weight:400}
.two{color:var(--garnet-text)}
a{color:inherit}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 26px;
  font-family:var(--body);font-weight:400;font-size:16px;letter-spacing:.04em;border-radius:2px;cursor:pointer;text-decoration:none;
  transition:background .2s ease,color .2s ease,border-color .2s ease}
.btn.solid{background:var(--garnet);color:var(--on-garnet);border:1px solid var(--garnet)}
.btn.solid:hover{background:var(--garnet-hover);border-color:var(--garnet-hover)}
.btn.line{background:transparent;color:var(--text);border:1px solid #7A5BA6}
.btn.line:hover{border-color:var(--text)}
.btn:disabled{background:transparent;color:var(--muted);border:1px solid var(--line);cursor:not-allowed}
:focus-visible{outline:2px solid var(--text);outline-offset:3px}
@media (prefers-reduced-motion:reduce){.btn{transition:none}}

.nav{position:sticky;top:0;z-index:5;background:var(--obsidian);border-bottom:1px solid var(--line-soft)}
.navin{max-width:1240px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;gap:28px}
.mark{font-size:20px;letter-spacing:.12em;text-decoration:none;white-space:nowrap}
.links{display:none;gap:26px;margin-left:auto;font-size:15px}
.links a{text-decoration:none;color:var(--muted)}
.links a:hover{color:var(--text)}
.nav .btn{margin-left:auto;min-height:44px;padding:10px 18px;font-size:15px}
@media (min-width:860px){.links{display:flex}.nav .btn{margin-left:0}}

.hero{position:relative;overflow:hidden;min-height:92vh;display:flex;align-items:flex-end;border-bottom:1px solid var(--line-soft)}
.shards{position:absolute;inset:0 0 auto 0;width:100%;height:62%}
.shards polygon{animation:fall 1.4s cubic-bezier(.2,.7,.2,1) both}
@keyframes fall{from{transform:translateY(-60px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.shards polygon{animation:none}}
.heroin{position:relative;max-width:1240px;width:100%;margin:0 auto;padding:0 24px 72px}
.kicker{font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:22px}
.word{line-height:1.02;letter-spacing:.12em;font-size:clamp(40px,11vw,160px)}
.word .ln{display:block}
.lede{max-width:34ch;margin-top:30px;font-size:clamp(18px,2.1vw,22px);color:var(--soft)}
.ctas{display:flex;flex-wrap:wrap;gap:14px;margin-top:36px}

.wrap{max-width:1240px;margin:0 auto;padding:0 24px}
section{padding:96px 0}
.h2{font-size:clamp(34px,5vw,58px);line-height:1.1;letter-spacing:.02em}
.h2 em{font-style:normal;color:var(--soft)}
.sub{color:var(--muted);margin-top:14px;max-width:52ch}

.divider{display:flex;align-items:center;gap:16px;max-width:1240px;margin:0 auto;padding:0 24px}
.divider .rule{flex:1;height:1px;background:var(--line)}
.divider .mini{width:14px;height:20px}

.nights{list-style:none;margin-top:48px;border-top:1px solid var(--line)}
.night{display:grid;grid-template-columns:84px minmax(0,1fr);gap:18px 24px;padding:26px 0;border-bottom:1px solid var(--line)}
.dt{line-height:1}
.dt .d{font-size:52px}
.dt .m{display:block;font-family:var(--body);font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-top:8px}
.nm{font-size:clamp(26px,3vw,36px);line-height:1.15}
.nmlink{display:inline-block;text-decoration:none;border-bottom:1px solid transparent}
.nmlink:hover{border-bottom-color:var(--garnet-text)}
.who{color:var(--soft);margin-top:6px}
.who span{color:var(--muted)}
.status{grid-column:2;display:flex;flex-wrap:wrap;gap:8px 22px;font-size:15px;color:var(--muted)}
.status .gone{text-decoration:line-through;text-decoration-color:var(--amethyst)}
.status .last{color:var(--garnet-text)}
.act{grid-column:2}
@media (min-width:860px){
  .night{grid-template-columns:110px minmax(0,1.4fr) minmax(0,1fr) 180px;align-items:center}
  .status{grid-column:auto;flex-direction:column;gap:4px}
  .act{grid-column:auto}
  .act .btn{width:100%}
}

.doors{display:grid;grid-template-columns:1fr;gap:18px;margin-top:48px}
@media (min-width:860px){.doors{grid-template-columns:1.35fr 1fr}}
.door{padding:40px 32px;border:1px solid var(--line);display:flex;flex-direction:column;gap:18px}
.door.main{background:var(--surface);border-color:var(--amethyst-deep);position:relative;overflow:hidden}
.door.main::after{content:"";position:absolute;right:-40px;top:-30px;width:190px;height:190px;
  background:var(--amethyst-deep);clip-path:polygon(30% 0,100% 20%,70% 100%,0 60%)}
.door > *{position:relative;z-index:1}
.door h3{font-size:clamp(28px,3vw,38px);line-height:1.15}
.door p{color:var(--soft);max-width:46ch}
.door ul{list-style:none;display:flex;flex-direction:column;gap:8px;font-size:15px;color:var(--muted)}
.door li::before{content:"";display:inline-block;width:6px;height:6px;margin-right:12px;vertical-align:2px;
  background:var(--amethyst);clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}
.door .btn{align-self:flex-start;margin-top:auto}

.info{display:grid;grid-template-columns:1fr;margin-top:48px;border-top:1px solid var(--line)}
@media (min-width:860px){.info{grid-template-columns:repeat(4,1fr)}}
.cell{padding:26px 24px 26px 0;border-bottom:1px solid var(--line)}
@media (min-width:860px){.cell{border-bottom:0;border-right:1px solid var(--line);padding:28px 24px}.cell:first-child{padding-left:0}.cell:last-child{border-right:0}}
.cell .k{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.cell .v{font-size:20px;margin-top:8px}
.cell .n{font-size:15px;color:var(--muted);margin-top:4px}

.story{text-align:center;padding:120px 0}
.story .q{font-size:clamp(28px,4vw,46px);line-height:1.3;max-width:22ch;margin:0 auto;letter-spacing:.02em}

footer{border-top:1px solid var(--line-soft);padding:40px 0 56px;color:var(--muted);font-size:15px}
.foot{display:flex;flex-wrap:wrap;gap:14px 28px;align-items:baseline}
.foot .mark{font-size:18px;color:var(--text)}
.foot nav{display:flex;gap:22px;flex-wrap:wrap}
.foot nav a{text-decoration:none}
.foot nav a:hover{color:var(--text)}
.fine{margin-top:22px}

.scrim{position:fixed;inset:0;background:rgba(12,8,18,.88);display:flex;align-items:center;justify-content:center;padding:24px;z-index:20}
.dlg{background:var(--surface);border:1px solid var(--amethyst-deep);max-width:460px;width:100%;padding:32px}
.dlg .tag{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.dlg h2{font-size:28px;margin:10px 0 12px}
.dlg p{color:var(--soft);margin-bottom:24px}
`;

  return (
    <div className="site">
      <style>{css}</style>

      <header className="nav">
        <div className="navin">
          <a href="#top" className="mark serif"><Mark /></a>
          <nav className="links" aria-label="Main">
            <a href="#nights">This week</a>
            <a href="#ways-in">Tables</a>
            <a href="#ways-in">Guestlist</a>
            <a href="#gallery" onClick={(e) => { e.preventDefault(); setDialog({ kind: "page", page: "Gallery" }); }}>Gallery</a>
            <a href="#about" onClick={(e) => { e.preventDefault(); setDialog({ kind: "page", page: "About" }); }}>About</a>
            <a href="#visit">Visit</a>
          </nav>
          <a className="btn solid" href="#ways-in">Book a table</a>
        </div>
      </header>

      <main id="top">
        <section className="hero" style={{ padding: 0 }}>
          <Shards />
          <div className="heroin">
            <p className="kicker">Canggu, Bali · Thursday to Sunday</p>
            <h1 className="word serif">
              <span className="ln">THE</span>
              <span className="ln">FANGLLE <span className="two">II</span></span>
            </h1>
            <p className="lede">Named for the second fall: not the one that ends the night, the one that starts it.</p>
            <div className="ctas">
              <a className="btn solid" href="#ways-in">Book a table</a>
              <a className="btn line" href="#ways-in">Join the guestlist</a>
            </div>
          </div>
        </section>

        <section id="nights">
          <div className="wrap">
            <h2 className="h2 serif">This <em>week</em></h2>
            <p className="sub">Doors at 10 pm. Headliners on from midnight.</p>
            <ol className="nights">
              {NIGHTS.map((n) => (
                <li className="night" key={n.date}>
                  <div className="dt">
                    <span className="d serif">{n.date}</span>
                    <span className="m">{n.day} · {n.month}</span>
                  </div>
                  <div>
                    <a href={`#event-${n.date}`} className="nm serif nmlink" onClick={(e) => { e.preventDefault(); setDialog({ kind: "event", night: n }); }}>{n.name}</a>
                    <div className="who">{n.headliner} <span>with {n.support} · {n.genre}</span></div>
                  </div>
                  <div className="status">
                    <span className={n.tables === "sold" ? "gone" : n.tables === "few" ? "last" : ""}>{tablesLabel(n)}</span>
                    <span className={n.guest === "full" ? "gone" : ""}>{guestLabel(n)}</span>
                  </div>
                  <div className="act">
                    <button
                      className="btn line"
                      disabled={n.tables === "sold" && n.guest === "full"}
                      onClick={() => setDialog({ kind: n.tables === "sold" ? "guest" : "table", night: n })}
                    >
                      {n.tables === "sold" && n.guest === "full" ? "Fully booked" : n.tables === "sold" ? "Guestlist only" : "Reserve"}
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <Divider />

        <section id="ways-in">
          <div className="wrap">
            <h2 className="h2 serif">Two ways <em>in</em></h2>
            <p className="sub">Stay the night at your own table, or walk in early on the list.</p>
            <div className="doors">
              <article className="door main">
                <h3 className="serif">Tables and booths</h3>
                <p>Choose your table from the floor plan. A deposit holds it, and the full deposit goes toward your minimum spend on the night.</p>
                <ul>
                  <li>Minimum spend set by zone and by night</li>
                  <li>Held for 15 minutes while you pay the deposit</li>
                  <li>Booths seat up to 12</li>
                </ul>
                <button className="btn solid" onClick={() => setDialog({ kind: "table" })}>Choose a table</button>
              </article>

              <article className="door">
                <h3 className="serif">Guestlist</h3>
                <p>Free entry before 11 pm. Add up to ten names, then take one QR for the group or one for each person.</p>
                <ul>
                  <li>Limited places each night</li>
                  <li>Valid until 11 pm on the night</li>
                  <li>Names checked against ID at the door</li>
                </ul>
                <button className="btn line" onClick={() => setDialog({ kind: "guest" })}>Join the guestlist</button>
              </article>
            </div>
          </div>
        </section>

        <Divider />

        <section id="visit">
          <div className="wrap">
            <h2 className="h2 serif">Before you <em>come</em></h2>
            <div className="info">
              <div className="cell"><div className="k">Age</div><div className="v">21 and over</div><div className="n">Valid ID, every night</div></div>
              <div className="cell"><div className="k">Dress</div><div className="v">Smart</div><div className="n">No sportswear, no flip-flops</div></div>
              <div className="cell"><div className="k">Hours</div><div className="v">10 pm to 4 am</div><div className="n">Thursday to Sunday</div></div>
              <div className="cell"><div className="k">Where</div><div className="v">Canggu, Bali</div><div className="n">Exact location sent with your booking</div></div>
            </div>
          </div>
        </section>

        <section className="story">
          <div className="wrap">
            <p className="q serif">Some fall once. The second time, you choose to.</p>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="foot">
            <span className="mark serif"><Mark /></span>
            <nav aria-label="Footer">
              <a href="#nights">This week</a>
              <a href="#ways-in">Tables</a>
              <a href="#ways-in">Guestlist</a>
              <a href="#gallery" onClick={(e) => { e.preventDefault(); setDialog({ kind: "page", page: "Gallery" }); }}>Gallery</a>
              <a href="#about" onClick={(e) => { e.preventDefault(); setDialog({ kind: "page", page: "About" }); }}>About</a>
              <a href="#visit">Visit</a>
            </nav>
          </div>
          <p className="fine">A fictional venue. Portfolio concept by Ralph de Vinca Group.</p>
        </div>
      </footer>

      {dialog && (
        <div className="scrim" onClick={(e) => e.target === e.currentTarget && setDialog(null)}>
          <div className="dlg" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
            <div className="tag">Catatan mockup</div>
            <h2 id="dlg-title" className="serif">
              {{ table: "Pilih meja dari denah", guest: "Daftar guestlist", page: dialog.page, event: "Detail event" }[dialog.kind]}
            </h2>
            <p>
              {{
                table: `Membuka mockup pilih meja${dialog.night ? ` dengan malam ${dialog.night.name} sudah terpilih` : ""}.`,
                guest: `Membuka mockup guestlist${dialog.night ? ` dengan malam ${dialog.night.name} sudah terpilih` : ""}.`,
                page: `Membuka halaman ${dialog.page} di mockup Detail event, Gallery, dan About.`,
                event: `Membuka Detail event ${dialog.night?.name}: jadwal set lengkap, deskripsi, dan panel pesan.`,
              }[dialog.kind]}
            </p>
            <button ref={closeRef} className="btn solid" onClick={() => setDialog(null)}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
