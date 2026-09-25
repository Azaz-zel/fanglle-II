import React, { useState, useEffect, useRef } from "react";

const NIGHTS = [
  {
    key: "thu", day: "Thursday", short: "Thu", date: "24 Sep", name: "Descent", genre: "Melodic techno",
    blurb: "Long, slow builds and a room that gets darker as it gets louder. Descent is for the ones who came to listen first and dance second.",
    sets: [["22:00", "00:00", "Rafi Hartono", "Warm-up"], ["00:00", "03:00", "Ilse Varga", "Headliner"], ["03:00", "04:00", "Rafi Hartono", "Closing"]],
    tables: "open", min: { stage: 10000000, booth: 15000000, bar: 5000000 }, guest: 42,
  },
  {
    key: "fri", day: "Friday", short: "Fri", date: "25 Sep", name: "Second Wave", genre: "Afro house",
    blurb: "Percussion from the first record to the last. Second Wave starts the weekend loud and keeps the floor moving until close.",
    sets: [["22:00", "00:00", "Kirana", "Warm-up"], ["00:00", "03:00", "Marcel Oduya", "Headliner"], ["03:00", "04:00", "Kirana", "Closing"]],
    tables: "few", min: { stage: 16000000, booth: 24000000, bar: 8000000 }, guest: 6,
  },
  {
    key: "sat", day: "Saturday", short: "Sat", date: "26 Sep", name: "Fall Line", genre: "Tech house",
    blurb: "The busiest night of the week. Fall Line is fully booked, so arrive with a booking or not at all.",
    sets: [["22:00", "00:00", "Dewa Anom", "Warm-up"], ["00:00", "03:00", "Nadia Sorrel", "Headliner"], ["03:00", "04:00", "Dewa Anom", "Closing"]],
    tables: "sold", min: { stage: 20000000, booth: 30000000, bar: 10000000 }, guest: 0,
  },
  {
    key: "sun", day: "Sunday", short: "Sun", date: "27 Sep", name: "Afterglow", genre: "Deep house",
    blurb: "A slower Sunday. Deep house, softer light, and more room to talk at the bar before the week starts again.",
    sets: [["22:00", "00:00", "Saka", "Warm-up"], ["00:00", "03:00", "Theo Brandt", "Headliner"], ["03:00", "04:00", "Saka", "Closing"]],
    tables: "open", min: { stage: 8000000, booth: 12000000, bar: 4000000 }, guest: 60,
  },
];

const SHARDS = [
  { p: "120,-40 210,-40 180,90", f: "#2A1D3D", d: 0 }, { p: "300,-60 380,-20 330,140", f: "#3D2A58", d: 0.08 },
  { p: "520,-30 600,10 560,60 500,40", f: "#221931", d: 0.16 }, { p: "700,-50 800,-50 760,120", f: "#563C7A", d: 0.04 },
  { p: "900,-20 980,30 930,190", f: "#2A1D3D", d: 0.2 }, { p: "1080,-60 1170,-10 1120,110", f: "#3D2A58", d: 0.12 },
  { p: "640,150 700,180 660,300 620,230", f: "#7A1024", d: 0.32 }, { p: "1000,220 1040,250 1015,330", f: "#7A5BA6", d: 0.36 },
];

const idr = (n) => `IDR ${n.toLocaleString("en-US")}`;

const SHOTS = [
  { cat: "room", ratio: "16 / 9", shot: "Main room from the DJ booth, full crowd, lights low", alt: "The main room seen from the DJ booth, packed dance floor under low violet light" },
  { cat: "night", ratio: "3 / 4", shot: "Ilse Varga behind the decks at Descent", alt: "Ilse Varga playing at Descent, lit from behind" },
  { cat: "room", ratio: "3 / 2", shot: "Dance floor from above, laser lines across the room", alt: "Dance floor from above with laser lines crossing the room" },
  { cat: "tables", ratio: "3 / 2", shot: "Booth set for ten, before doors open", alt: "An empty booth laid out for ten guests before opening" },
  { cat: "night", ratio: "3 / 2", shot: "Hands up at midnight, Second Wave", alt: "Crowd with hands raised as the headliner starts at Second Wave" },
  { cat: "detail", ratio: "3 / 4", shot: "Faceted glass above the bar, close up", alt: "Close up of the faceted glass installation above the bar" },
  { cat: "tables", ratio: "3 / 4", shot: "Bottle service arriving at a booth", alt: "Staff carrying bottle service to a booth" },
  { cat: "room", ratio: "3 / 2", shot: "The bar at 1 am, bartenders mid-pour", alt: "Bartenders pouring drinks at the bar late at night" },
  { cat: "night", ratio: "3 / 4", shot: "Nadia Sorrel, close up, Fall Line", alt: "Nadia Sorrel at the decks during Fall Line" },
  { cat: "detail", ratio: "3 / 2", shot: "Entrance at 10 pm, door staff scanning a QR", alt: "Door staff scanning a guest's QR at the entrance" },
  { cat: "tables", ratio: "3 / 2", shot: "Stage front tables, looking toward the DJ", alt: "Stage front tables with a clear view of the DJ booth" },
  { cat: "night", ratio: "3 / 2", shot: "Afterglow, softer Sunday light at the bar", alt: "A quieter Sunday night at the bar during Afterglow" },
];
const CATS = [["all", "All"], ["room", "The room"], ["night", "Nights"], ["tables", "Tables and booths"], ["detail", "Details"]];

function Shards() {
  return (
    <svg className="shards" viewBox="0 0 1200 360" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      {SHARDS.map((s, i) => <polygon key={i} points={s.p} fill={s.f} style={{ animationDelay: `${s.d}s` }} />)}
    </svg>
  );
}

function Divider() {
  return (
    <div className="divider" aria-hidden="true">
      <span className="rule" /><svg viewBox="0 0 20 28" className="mini"><polygon points="4,0 16,0 10,28" fill="#7A1024" /></svg><span className="rule" />
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("event");
  const [night, setNight] = useState("fri");
  const [note, setNote] = useState(null);
  const [cat, setCat] = useState("all");
  const [view, setView] = useState(null);
  const topRef = useRef(null);
  const n = NIGHTS.find((x) => x.key === night);
  const shots = SHOTS.filter((s) => cat === "all" || s.cat === cat);

  useEffect(() => {
    if (view === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setView(null);
      if (e.key === "ArrowRight") setView((v) => (v + 1) % shots.length);
      if (e.key === "ArrowLeft") setView((v) => (v - 1 + shots.length) % shots.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, shots.length]);

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "start" });
  }, [page, night]);

  useEffect(() => {
    if (!note) return;
    const onKey = (e) => e.key === "Escape" && setNote(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [note]);

  const soldOut = n.tables === "sold";
  const glFull = n.guest === 0;

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
.site{background:var(--obsidian);color:var(--text);font-family:var(--body);font-size:17px;line-height:1.65;min-height:100vh}
.serif{font-family:var(--head);font-weight:400}
.two{color:var(--garnet-text)}
a{color:inherit}
:focus-visible{outline:2px solid var(--text);outline-offset:3px}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 24px;font-family:var(--body);font-size:16px;
  letter-spacing:.04em;border-radius:2px;cursor:pointer;text-decoration:none;border:1px solid transparent;transition:background .2s,border-color .2s;line-height:1.2}
.btn.solid{background:var(--garnet);color:var(--on-garnet);border-color:var(--garnet)}
.btn.solid:hover{background:var(--garnet-hover)}
.btn.line{background:transparent;color:var(--text);border-color:var(--amethyst-soft)}
.btn.line:hover{border-color:var(--text)}
.btn:disabled{background:transparent;color:var(--muted);border-color:var(--line);cursor:not-allowed}
@media (prefers-reduced-motion:reduce){.btn{transition:none}}

.nav{position:sticky;top:0;z-index:5;background:var(--obsidian);border-bottom:1px solid var(--line-soft)}
.navin{max-width:1240px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;gap:26px}
.mark{font-size:20px;letter-spacing:.12em;text-decoration:none;white-space:nowrap;background:none;border:0;color:var(--text);cursor:pointer}
.links{display:none;gap:24px;margin-left:auto;font-size:15px}
.links button{background:none;border:0;color:var(--muted);font-family:var(--body);font-size:15px;cursor:pointer;min-height:44px}
.links button:hover,.links button[aria-current="page"]{color:var(--text)}
.links button[aria-current="page"]{text-decoration:underline;text-underline-offset:6px;text-decoration-color:var(--garnet-text)}
.nav .btn{margin-left:auto;min-height:44px;padding:10px 18px;font-size:15px}
@media (min-width:900px){.links{display:flex}.nav .btn{margin-left:0}}

.hero{position:relative;overflow:hidden;border-bottom:1px solid var(--line-soft)}
.shards{position:absolute;inset:0 0 auto 0;width:100%;height:100%;opacity:.9}
.shards polygon{animation:fall 1.4s cubic-bezier(.2,.7,.2,1) both}
@keyframes fall{from{transform:translateY(-60px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.shards polygon{animation:none}}
.heroin{position:relative;max-width:1240px;margin:0 auto;padding:120px 24px 56px}
.kicker{font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:16px}
.name{font-size:clamp(48px,9vw,120px);line-height:1.02;letter-spacing:.08em}
.meta{display:flex;flex-wrap:wrap;gap:8px 28px;margin-top:22px;color:var(--soft)}
.meta span b{font-weight:400;color:var(--muted);margin-right:8px}

.wrap{max-width:1240px;margin:0 auto;padding:0 24px}
section{padding:72px 0}
.h2{font-size:clamp(30px,4vw,46px);line-height:1.1;letter-spacing:.02em}
.h2 em{font-style:normal;color:var(--soft)}
.lede{font-size:clamp(18px,2vw,21px);color:var(--soft);max-width:48ch;margin-top:16px}

.cols{display:grid;grid-template-columns:1fr;gap:40px}
@media (min-width:1000px){.cols{grid-template-columns:minmax(0,1.5fr) minmax(320px,1fr);align-items:start}}
.sets{list-style:none;margin-top:28px;border-top:1px solid var(--line)}
.sets li{display:grid;grid-template-columns:130px minmax(0,1fr);gap:16px;padding:20px 0;border-bottom:1px solid var(--line);align-items:baseline}
.sets .t{color:var(--muted);font-size:15px}
.sets .dj{font-family:var(--head);font-size:clamp(24px,2.6vw,32px);line-height:1.15}
.sets .role{display:block;font-family:var(--body);font-size:14px;color:var(--muted);margin-top:2px}
.sets li.hl .dj{color:var(--text)}
.sets li.hl .role{color:var(--garnet-text)}

.book{position:sticky;top:90px;border:1px solid var(--amethyst-deep);background:var(--surface);padding:26px;display:flex;flex-direction:column;gap:22px}
.book h3{font-family:var(--head);font-weight:400;font-size:26px}
.opt{display:flex;flex-direction:column;gap:10px;padding-top:20px;border-top:1px solid var(--line)}
.opt:first-of-type{border-top:0;padding-top:0}
.opt .st{font-size:15px;color:var(--soft)}
.opt .st.warn{color:var(--garnet-text)}
.opt .st.gone{color:var(--muted);text-decoration:line-through;text-decoration-color:var(--amethyst)}
.zones{list-style:none;font-size:15px}
.zones li{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid var(--line-soft)}
.zones span{color:var(--muted)}

.divider{display:flex;align-items:center;gap:16px;max-width:1240px;margin:0 auto;padding:0 24px}
.divider .rule{flex:1;height:1px;background:var(--line)}
.divider .mini{width:14px;height:20px}

.know{display:grid;grid-template-columns:1fr;margin-top:32px;border-top:1px solid var(--line)}
@media (min-width:860px){.know{grid-template-columns:repeat(4,1fr)}}
.cell{padding:22px 22px 22px 0;border-bottom:1px solid var(--line)}
@media (min-width:860px){.cell{border-bottom:0;border-right:1px solid var(--line);padding:24px}.cell:first-child{padding-left:0}.cell:last-child{border-right:0}}
.cell .k{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.cell .v{font-size:19px;margin-top:6px}
.cell .n{font-size:15px;color:var(--muted)}

.others{display:grid;grid-template-columns:1fr;gap:10px;margin-top:28px}
@media (min-width:760px){.others{grid-template-columns:repeat(3,1fr)}}
.other{text-align:left;background:transparent;border:1px solid var(--line);color:var(--text);padding:20px;cursor:pointer;font-family:var(--body);display:flex;flex-direction:column;gap:4px;min-height:120px}
.other:hover{border-color:var(--amethyst-soft)}
.other .d{font-size:14px;color:var(--muted);letter-spacing:.08em;text-transform:uppercase}
.other .nm{font-family:var(--head);font-size:26px;line-height:1.15}
.other .s{font-size:14px;color:var(--soft)}

.story{max-width:760px}
.story p{color:var(--soft);font-size:clamp(18px,2vw,20px);margin-top:18px}
.run{list-style:none;margin-top:28px;border-left:1px solid var(--amethyst);margin-left:6px}
.run li{position:relative;padding:0 0 22px 26px}
.run li::before{content:"";position:absolute;left:-5px;top:10px;width:9px;height:9px;background:var(--amethyst-soft);clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}
.run li.key::before{background:var(--garnet-text)}
.run b{display:block;font-weight:400;font-family:var(--head);font-size:26px;line-height:1.2}
.run span{color:var(--muted)}
.rules{list-style:none;margin-top:24px;display:grid;grid-template-columns:1fr;gap:0;border-top:1px solid var(--line)}
@media (min-width:760px){.rules{grid-template-columns:1fr 1fr}}
.rules li{padding:18px 0;border-bottom:1px solid var(--line);padding-right:24px}
.rules b{display:block;font-weight:400;font-size:19px}
.rules span{color:var(--muted);font-size:15px}
.contact{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}

footer{border-top:1px solid var(--line-soft);padding:40px 0 56px;color:var(--muted);font-size:15px}

.chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:24px}
.chip{min-height:44px;padding:8px 16px;border:1px solid var(--line);background:transparent;color:var(--soft);font-family:var(--body);font-size:15px;cursor:pointer;border-radius:2px}
.chip[aria-pressed="true"]{border-color:var(--garnet);color:var(--text);background:var(--surface)}
.chip em{font-style:normal;color:var(--muted);margin-left:6px}
.masonry{columns:1;column-gap:14px;margin-top:28px}
@media (min-width:640px){.masonry{columns:2}}
@media (min-width:1000px){.masonry{columns:3}}
.slot{display:block;width:100%;break-inside:avoid;margin-bottom:14px;position:relative;overflow:hidden;cursor:pointer;text-align:left;
  background:var(--surface);border:1px dashed var(--amethyst);color:var(--text);font-family:var(--body);padding:0;transition:border-color .2s}
.slot:hover{border-color:var(--text);border-style:solid}
.slot::before{content:"";position:absolute;right:-24px;top:-18px;width:110px;height:110px;background:var(--raised);clip-path:polygon(30% 0,100% 20%,70% 100%,0 60%)}
.slot .in{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;gap:6px;padding:18px}
.slot .tag{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--garnet-text)}
.slot .shot{font-size:16px;line-height:1.35}
.slot .spec{font-size:13px;color:var(--muted)}
@media (prefers-reduced-motion:reduce){.slot{transition:none}}
.brief{border:1px solid var(--line);padding:18px 20px;margin-top:28px;color:var(--soft);font-size:15px;max-width:760px}

.viewer{position:fixed;inset:0;background:rgba(12,8,18,.95);z-index:30;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;gap:18px}
.vframe{width:min(900px,100%);max-height:62vh;background:var(--surface);border:1px dashed var(--amethyst-soft);display:flex;align-items:center;justify-content:center;text-align:center;padding:24px}
.vframe .shot{font-family:var(--head);font-size:clamp(22px,3vw,32px);line-height:1.25;max-width:26ch}
.vmeta{width:min(900px,100%);display:grid;grid-template-columns:auto 1fr;gap:6px 16px;font-size:15px}
.vmeta dt{color:var(--muted)}
.vbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:center}
.vcount{color:var(--muted);font-size:15px;min-width:70px;text-align:center}
.foot{display:flex;flex-wrap:wrap;gap:14px 28px;align-items:baseline}
.foot .mark{font-size:18px}
.fine{margin-top:18px}

.scrim{position:fixed;inset:0;background:rgba(12,8,18,.88);display:flex;align-items:center;justify-content:center;padding:24px;z-index:20}
.dlg{background:var(--surface);border:1px solid var(--amethyst-deep);max-width:460px;width:100%;padding:30px}
.dlg .tag{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.dlg h2{font-family:var(--head);font-weight:400;font-size:26px;margin:10px 0 12px}
.dlg p{color:var(--soft);margin-bottom:22px}
`;

  const NOTES = {
    home: ["Halaman depan", "Ada di mockup halaman depan yang sudah ACC. Di versi asli, menu ini kembali ke sana."],
    tables: ["Pilih meja", `Membuka mockup pilih meja dengan malam ${n.name} sudah terpilih. Keterangan event di halaman itu masuk di revisi berikutnya.`],
    guest: ["Guestlist", `Membuka mockup guestlist dengan malam ${n.name} sudah terpilih. Keterangan event di halaman itu masuk di revisi berikutnya.`],
    gallery: ["Gallery", "Menunggu keputusan sumber gambar: foto stok berlisensi, hasil generate AI, atau tanpa foto."],
    mail: ["Email", "Membuka aplikasi email ke alamat private events. Alamat di mockup memakai domain contoh."],
  };

  const eventPage = (
    <>
      <section className="hero" style={{ padding: 0 }}>
        <Shards />
        <div className="heroin">
          <p className="kicker">{n.day} {n.date} · {n.genre}</p>
          <h1 className="name serif">{n.name.toUpperCase()}</h1>
          <div className="meta">
            <span><b>Doors</b>10 pm</span>
            <span><b>Headliner</b>{n.sets[1][2]} from midnight</span>
            <span><b>Close</b>4 am</span>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap cols">
          <div>
            <h2 className="h2 serif">The <em>night</em></h2>
            <p className="lede">{n.blurb}</p>
            <ol className="sets" aria-label="Set times">
              {n.sets.map(([a, b, dj, role]) => (
                <li key={a} className={role === "Headliner" ? "hl" : ""}>
                  <span className="t">{a} to {b}</span>
                  <span><span className="dj">{dj}</span><span className="role">{role}</span></span>
                </li>
              ))}
            </ol>
          </div>

          <aside className="book" aria-labelledby="book-h">
            <h3 id="book-h">Book {n.name}</h3>
            <div className="opt">
              <span className={`st ${soldOut ? "gone" : n.tables === "few" ? "warn" : ""}`}>
                {soldOut ? "Tables sold out" : n.tables === "few" ? "Last tables left" : "Tables available"}
              </span>
              {!soldOut && (
                <ul className="zones" aria-label="Minimum spend per table">
                  <li>Stage front<span>{idr(n.min.stage)}</span></li>
                  <li>Booths<span>{idr(n.min.booth)}</span></li>
                  <li>Bar tables<span>{idr(n.min.bar)}</span></li>
                </ul>
              )}
              <button className="btn solid" disabled={soldOut} onClick={() => setNote("tables")}>
                {soldOut ? "No tables left" : "Choose a table"}
              </button>
            </div>
            <div className="opt">
              <span className={`st ${glFull ? "gone" : n.guest <= 10 ? "warn" : ""}`}>
                {glFull ? "Guestlist full" : `Guestlist: ${n.guest} places left, free until 11 pm`}
              </span>
              <button className="btn line" disabled={glFull} onClick={() => setNote("guest")}>
                {glFull ? "Guestlist full" : "Join the guestlist"}
              </button>
            </div>
          </aside>
        </div>
      </section>

      <Divider />

      <section>
        <div className="wrap">
          <h2 className="h2 serif">Good to <em>know</em></h2>
          <div className="know">
            <div className="cell"><div className="k">Age</div><div className="v">21 and over</div><div className="n">Bring ID, every night</div></div>
            <div className="cell"><div className="k">Dress</div><div className="v">Smart</div><div className="n">No sportswear, no flip-flops</div></div>
            <div className="cell"><div className="k">Last entry</div><div className="v">2 am</div><div className="n">No re-entry after that</div></div>
            <div className="cell"><div className="k">Guestlist</div><div className="v">Until 11 pm</div><div className="n">After that, entry at the door</div></div>
          </div>
        </div>
      </section>

      <Divider />

      <section>
        <div className="wrap">
          <h2 className="h2 serif">Other nights <em>this week</em></h2>
          <div className="others">
            {NIGHTS.filter((x) => x.key !== night).map((x) => (
              <button key={x.key} className="other" onClick={() => setNight(x.key)}>
                <span className="d">{x.short} {x.date}</span>
                <span className="nm">{x.name}</span>
                <span className="s">{x.sets[1][2]} · {x.genre}</span>
                <span className="s" style={{ color: "var(--muted)" }}>
                  {x.tables === "sold" && x.guest === 0 ? "Fully booked" : x.tables === "few" ? "Last tables" : x.guest === 0 ? "Guestlist full" : "Tables and guestlist open"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );

  const aboutPage = (
    <>
      <section className="hero" style={{ padding: 0 }}>
        <Shards />
        <div className="heroin">
          <p className="kicker">Canggu, Bali · Thursday to Sunday</p>
          <h1 className="name serif">ABOUT</h1>
        </div>
      </section>

      <section>
        <div className="wrap story">
          <h2 className="h2 serif">Why the <em>second fall</em></h2>
          <p>Everyone knows the first fall. It happens to you. The second one you choose: you walk in, the doors close behind you, and the night takes over from there.</p>
          <p>The Fanglle II is built around that choice. One room, one sound system, four nights a week, and a door that opens at 10 pm whether the street outside is ready or not.</p>
        </div>
      </section>

      <Divider />

      <section>
        <div className="wrap">
          <h2 className="h2 serif">How a night <em>runs</em></h2>
          <ol className="run">
            <li><b>10 pm</b><span>Doors open. The warm-up set starts and the guestlist is honoured.</span></li>
            <li className="key"><b>11 pm</b><span>Guestlist closes. After this, entry is at the door.</span></li>
            <li className="key"><b>Midnight</b><span>The headliner plays until 3 am.</span></li>
            <li><b>2 am</b><span>Last entry. No re-entry after this point.</span></li>
            <li><b>4 am</b><span>Lights up.</span></li>
          </ol>
        </div>
      </section>

      <Divider />

      <section>
        <div className="wrap">
          <h2 className="h2 serif">House <em>rules</em></h2>
          <ul className="rules">
            <li><b>21 and over</b><span>Valid ID for everyone, every night. No exceptions for tables.</span></li>
            <li><b>Smart dress</b><span>No sportswear, no flip-flops, no swimwear.</span></li>
            <li><b>One QR, one entry</b><span>Each QR works once. Screenshots shared with friends won't get them in.</span></li>
            <li><b>Tables have a minimum spend</b><span>Your deposit counts toward it. The rest is spent on the night.</span></li>
          </ul>
        </div>
      </section>

      <Divider />

      <section>
        <div className="wrap story">
          <h2 className="h2 serif">Private <em>events</em></h2>
          <p>The room can be booked for private nights from Monday to Wednesday. Tell us the date, the number of guests, and what you have in mind.</p>
          <div className="contact">
            <button className="btn line" onClick={() => setNote("mail")}>events@thefanglle.example</button>
          </div>
        </div>
      </section>
    </>
  );

  const galleryPage = (
    <>
      <section className="hero" style={{ padding: 0 }}>
        <Shards />
        <div className="heroin">
          <p className="kicker">The room, the nights, the details</p>
          <h1 className="name serif">GALLERY</h1>
        </div>
      </section>
      <section>
        <div className="wrap">
          <div className="chips" role="group" aria-label="Show photos of">
            {CATS.map(([k, l]) => (
              <button key={k} className="chip" aria-pressed={cat === k} onClick={() => { setCat(k); setView(null); }}>
                {l}<em>{k === "all" ? SHOTS.length : SHOTS.filter((s) => s.cat === k).length}</em>
              </button>
            ))}
          </div>
          <div className="masonry">
            {shots.map((s, i) => (
              <button key={s.shot} className="slot" style={{ aspectRatio: s.ratio }} onClick={() => setView(i)}
                aria-label={`Photo to come: ${s.shot}. Open details.`}>
                <span className="in">
                  <span className="tag">Photo to come</span>
                  <span className="shot">{s.shot}</span>
                  <span className="spec">{s.ratio.replace(" / ", ":")} · {CATS.find((c) => c[0] === s.cat)[1]}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="brief">
            Every frame above is a brief for the real photo: what to shoot, the shape it needs, and the alt text it ships with.
            Replace a frame and the layout stays the same.
          </p>
        </div>
      </section>
    </>
  );

  return (
    <div className="site">
      <style>{css}</style>
      <div ref={topRef} />
      <header className="nav">
        <div className="navin">
          <button className="mark serif" onClick={() => setNote("home")}>THE FANGLLE <span className="two">II</span></button>
          <nav className="links" aria-label="Main">
            <button aria-current={page === "event" ? "page" : undefined} onClick={() => setPage("event")}>This week</button>
            <button aria-current={page === "gallery" ? "page" : undefined} onClick={() => setPage("gallery")}>Gallery</button>
            <button aria-current={page === "about" ? "page" : undefined} onClick={() => setPage("about")}>About</button>
          </nav>
          <button className="btn solid" onClick={() => setNote("tables")}>Book a table</button>
        </div>
      </header>

      <main>{page === "event" ? eventPage : page === "gallery" ? galleryPage : aboutPage}</main>

      <footer>
        <div className="wrap">
          <div className="foot">
            <span className="mark serif" style={{ cursor: "default" }}>THE FANGLLE <span className="two">II</span></span>
            <nav aria-label="Footer" style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <button className="btn line" style={{ minHeight: 40, padding: "6px 14px", fontSize: 14 }} onClick={() => setPage("event")}>This week</button>
              <button className="btn line" style={{ minHeight: 40, padding: "6px 14px", fontSize: 14 }} onClick={() => setPage("gallery")}>Gallery</button>
              <button className="btn line" style={{ minHeight: 40, padding: "6px 14px", fontSize: 14 }} onClick={() => setPage("about")}>About</button>
            </nav>
          </div>
          <p className="fine">A fictional venue. Portfolio concept by Ralph de Vinca Group.</p>
        </div>
      </footer>

      {view !== null && shots[view] && (
        <div className="viewer" role="dialog" aria-modal="true" aria-labelledby="vw-t" onClick={(e) => e.target === e.currentTarget && setView(null)}>
          <div className="vframe"><p id="vw-t" className="shot">{shots[view].shot}</p></div>
          <dl className="vmeta">
            <dt>Status</dt><dd>Photo to come</dd>
            <dt>Shape</dt><dd>{shots[view].ratio.replace(" / ", ":")}</dd>
            <dt>Alt text</dt><dd>{shots[view].alt}</dd>
          </dl>
          <div className="vbar">
            <button className="btn line" onClick={() => setView((view - 1 + shots.length) % shots.length)} aria-label="Previous photo">Previous</button>
            <span className="vcount" aria-live="polite">{view + 1} of {shots.length}</span>
            <button className="btn line" onClick={() => setView((view + 1) % shots.length)} aria-label="Next photo">Next</button>
            <button className="btn solid" autoFocus onClick={() => setView(null)}>Close</button>
          </div>
        </div>
      )}

      {note && (
        <div className="scrim" onClick={(e) => e.target === e.currentTarget && setNote(null)}>
          <div className="dlg" role="dialog" aria-modal="true" aria-labelledby="nt">
            <div className="tag">Catatan mockup</div>
            <h2 id="nt">{NOTES[note][0]}</h2>
            <p>{NOTES[note][1]}</p>
            <button className="btn solid" autoFocus onClick={() => setNote(null)}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
