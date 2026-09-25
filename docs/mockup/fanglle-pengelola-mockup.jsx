import React, { useState, useEffect, useRef } from "react";

const NOW = "23:34";
const HOURS = [
  ["15:00", 12, 10, 2], ["16:00", 18, 15, 3], ["17:00", 22, 18, 4], ["18:00", 25, 20, 5], ["19:00", 20, 15, 5],
  ["20:00", 14, 9, 5], ["21:00", 9, 5, 4], ["22:00", 18, 6, 12], ["23:00", 10, 0, 10], ["00:00", 0, 0, 0],
];

const BOOKINGS = [
  { id: "F2-4LWX", status: "held", table: "S3", zone: "Stage front", name: "Komang Adi", phone: "1156", people: 5, inside: 0, deposit: 5000000, mins: 6, booked: "23:28", log: ["23:28 Held S3"] },
  { id: "F2-1CVB", status: "paid", table: "S1", zone: "Stage front", name: "Sang Ayu", phone: "2291", people: 6, inside: 0, deposit: 5000000, booked: "18:40", log: ["18:40 Held S1", "18:44 Deposit paid"] },
  { id: "F2-2PZM", status: "paid", table: "B2", zone: "Booths", name: "Wayan Dharma", phone: "7702", people: 10, inside: 0, deposit: 7500000, booked: "16:12", log: ["16:12 Held B2", "16:15 Deposit paid"] },
  { id: "F2-7K4Q", status: "in", table: "B5", zone: "Booths", name: "Made Wirawan", phone: "4410", people: 7, inside: 3, deposit: 7500000, booked: "14:02", log: ["14:02 Held B5", "14:05 Deposit paid", "22:40 3 of 7 arrived"] },
  { id: "F2-9QRT", status: "in", table: "B1", zone: "Booths", name: "Gede Pramana", phone: "3380", people: 6, inside: 6, deposit: 7500000, booked: "12:30", log: ["12:30 Held B1", "12:33 Deposit paid", "22:09 6 of 6 arrived"] },
  { id: "F2-8HJN", status: "expired", table: "T4", zone: "Bar tables", name: "Ketut Rai", phone: "6604", people: 3, inside: 0, deposit: 2500000, booked: "21:10", log: ["21:10 Held T4", "21:25 Released, not paid"] },
];

const GUESTS = [
  { id: "a", name: "Ayu Pratiwi", phone: "1234", qr: "group", people: 4, inside: 2, names: [], log: ["19:20 Signed up, group of 4", "23:12 2 in, manager override"] },
  { id: "b", name: "Kadek Surya", phone: "8821", qr: "personal", people: 1, inside: 0, names: [], organiser: "Ayu Pratiwi", log: ["19:20 Added by Ayu Pratiwi"] },
  { id: "c", name: "Putu Ananda", phone: "0937", qr: "group", people: 2, inside: 2, names: ["Made Arta"], log: ["20:02 Signed up, group of 2", "22:14 2 in"] },
  { id: "d", name: "Luh Sari", phone: "3319", qr: "personal", people: 1, inside: 1, names: [], organiser: "Wayan Dharma", log: ["17:45 Added by Wayan Dharma", "22:31 In"] },
  { id: "e", name: "Nengah Budi", phone: "5170", qr: "personal", people: 1, inside: 0, names: [], organiser: "Nengah Budi", log: ["21:05 Signed up, 6 personal QRs"] },
  { id: "f", name: "Dewi Lestari", phone: "4482", qr: "group", people: 6, inside: 0, names: ["Rina", "Sekar"], log: ["21:40 Signed up, group of 6"] },
];

const DOOR = [
  { at: "23:12", name: "Ayu Pratiwi", n: 2, how: "Manager override", flag: true },
  { at: "22:40", name: "Made Wirawan", n: 3, how: "Scan · table B5" },
  { at: "22:31", name: "Luh Sari", n: 1, how: "Scan" },
  { at: "22:14", name: "Putu Ananda", n: 2, how: "Scan" },
  { at: "22:09", name: "Gede Pramana", n: 6, how: "Scan · table B1" },
  { at: "22:03", name: "Ni Luh Ayu", n: 1, how: "Search by name" },
];

let rowSeq = 1;
const row = (name, role, start, end) => ({ id: rowSeq++, name, role, start, end });
const ROLES = ["Headliner", "Guest star", "Support", "Warm-up", "Closing", "B2B"];

const EVENTS = [
  { key: "2026-09-24", name: "Descent", genre: "Melodic techno", quota: 200, signed: 158, cutoff: "23:00", close: "04:00",
    blurb: "Long, slow builds and a room that gets darker as it gets louder.",
    lineup: [row("Rafi Hartono", "Warm-up", "22:00", "00:00"), row("Ilse Varga", "Headliner", "00:00", "03:00"), row("Rafi Hartono", "Closing", "03:00", "04:00")],
    min: { stage: 10000000, booth: 15000000, bar: 5000000 } },
  { key: "2026-09-25", name: "Second Wave", genre: "Afro house", quota: 200, signed: 194, cutoff: "23:00", close: "04:00",
    blurb: "Percussion from the first record to the last.",
    lineup: [row("Kirana", "Warm-up", "22:00", "23:30"), row("Bayu Kencana", "Guest star", "23:30", "00:30"), row("Marcel Oduya", "Headliner", "00:30", "02:30"),
      row("Lintang", "Guest star", "02:30", "03:30"), row("Kirana", "Closing", "03:30", "04:00")],
    min: { stage: 16000000, booth: 24000000, bar: 8000000 } },
  { key: "2026-09-26", name: "Fall Line", genre: "Tech house", quota: 250, signed: 250, cutoff: "23:00", close: "04:00",
    blurb: "The busiest night of the week.",
    lineup: [row("Dewa Anom", "Warm-up", "22:00", "00:00"), row("Nadia Sorrel", "Headliner", "00:00", "03:00"), row("Dewa Anom", "Closing", "03:00", "04:00")],
    min: { stage: 20000000, booth: 30000000, bar: 10000000 } },
  { key: "2026-09-27", name: "Afterglow", genre: "Deep house", quota: 200, signed: 140, cutoff: "23:30", close: "03:00",
    blurb: "A slower Sunday, with more room to talk at the bar.",
    lineup: [row("Saka", "Warm-up", "22:00", "00:00"), row("Theo Brandt", "Headliner", "00:00", "03:00"), row("Saka", "Closing", "03:00", "04:00")],
    min: { stage: 8000000, booth: 12000000, bar: 4000000 } },
];

const toNight = (t) => { const [h, m] = t.split(":").map(Number); const v = h * 60 + m; return v < 720 ? v + 1440 : v; };
const headOf = (ev) => ev.lineup.filter((r) => r.role === "Headliner").map((r) => r.name).join(" and ") || "Line-up to come";
const othersOf = (ev) => ev.lineup.filter((r) => r.role !== "Headliner").map((r) => r.name).filter((v, i, a) => a.indexOf(v) === i);
function lineupWarnings(rows, close) {
  const w = [];
  const s = rows.filter((r) => r.start && r.end && r.start !== r.end).map((r) => ({ ...r, a: toNight(r.start), b: toNight(r.end) < toNight(r.start) ? toNight(r.end) + 1440 : toNight(r.end) }))
    .sort((x, y) => x.a - y.a);
  for (let i = 1; i < s.length; i++) {
    if (s[i].a < s[i - 1].b && s[i].role !== "B2B" && s[i - 1].role !== "B2B")
      w.push(`${s[i - 1].name || "A set"} and ${s[i].name || "the next set"} overlap. Mark one of them B2B if they play together.`);
  }
  s.forEach((r) => {
    if (r.a < toNight("15:00") || r.b > toNight(close || "04:00")) w.push(`${r.name || "One set"} runs outside opening hours, 3 pm to ${close || "04:00"}.`);
  });
  return w;
}

const STATUS = {
  held: { label: "Held, unpaid", cls: "b-held", rank: 0 },
  paid: { label: "Paid, not arrived", cls: "b-paid", rank: 1 },
  in: { label: "Arrived", cls: "b-in", rank: 2 },
  expired: { label: "Released", cls: "b-off", rank: 3 },
};

const STAFF = [
  { id: 1, name: "Manager (you)", email: "manager@thefanglle.example", role: "manager", status: "active", last: "Now", you: true },
  { id: 2, name: "Door staff A", email: "door.a@thefanglle.example", role: "door", status: "active", last: "Today, 23:31" },
  { id: 3, name: "Door staff B", email: "door.b@thefanglle.example", role: "door", status: "active", last: "Today, 22:58" },
  { id: 4, name: "Manager B", email: "manager.b@thefanglle.example", role: "manager", status: "invited", last: "Invite sent 2 days ago" },
  { id: 5, name: "Former door staff", email: "door.old@thefanglle.example", role: "door", status: "disabled", last: "12 Sep" },
];
const ROLE_LABEL = { manager: "Manager", door: "Door staff" };
const STAFF_STATUS = { active: ["Active", "b-paid"], invited: ["Invite pending", "b-held"], disabled: ["Disabled", "b-off"] };

const NAV = [
  ["Tonight", [["tonight", "Overview"]]],
  ["Operations", [["tables", "Table bookings"], ["guestlist", "Guestlist"], ["door", "Door log"]]],
  ["Setup", [["events", "Events"], ["team", "Team"]]],
];

const idr = (n) => `IDR ${Number(n).toLocaleString("en-US")}`;
const dayLabel = (iso) => {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
};
const blankEvent = () => ({ key: "", name: "", genre: "", blurb: "", quota: "200", signed: 0, cutoff: "23:00", close: "04:00",
  lineup: [row("", "Headliner", "00:00", "03:00")], min: { stage: "", booth: "", bar: "" } });

export default function App() {
  const [page, setPage] = useState("tonight");
  const [bookings, setBookings] = useState(BOOKINGS);
  const [guests, setGuests] = useState(GUESTS);
  const [events, setEvents] = useState(EVENTS);
  const [bFilter, setBFilter] = useState("all");
  const [bSort, setBSort] = useState("urgency");
  const [bq, setBq] = useState("");
  const [gType, setGType] = useState("all");
  const [gArr, setGArr] = useState("any");
  const [gq, setGq] = useState("");
  const [onlyOverrides, setOnlyOverrides] = useState(false);
  const [bar, setBar] = useState(3);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [note, setNote] = useState(null);
  const [flash, setFlash] = useState("");
  const [load, setLoad] = useState("ok");
  const [out, setOut] = useState(false);
  const [editKey, setEditKey] = useState("2026-09-25");
  const [creating, setCreating] = useState(false);
  const [startFrom, setStartFrom] = useState("blank");
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState("");
  const [staff, setStaff] = useState(STAFF);
  const [inviting, setInviting] = useState(false);
  const [inv, setInv] = useState({ name: "", email: "", role: "door" });
  const [invErr, setInvErr] = useState({});

  const activeManagers = staff.filter((s) => s.role === "manager" && s.status === "active").length;

  function sendInvite(e) {
    e.preventDefault();
    const er = {};
    if (!inv.name.trim()) er.name = "Add their name.";
    if (!/^\S+@\S+\.\S+$/.test(inv.email.trim())) er.email = "Enter a valid email. The invite link goes there.";
    else if (staff.some((s) => s.email.toLowerCase() === inv.email.trim().toLowerCase())) er.email = "That email already has an account.";
    setInvErr(er);
    if (Object.keys(er).length) {
      setTimeout(() => document.querySelector(".invite [aria-invalid='true']")?.focus(), 0);
      return;
    }
    setStaff([...staff, { id: Date.now(), name: inv.name.trim(), email: inv.email.trim(), role: inv.role, status: "invited", last: "Invite sent just now" }]);
    setFlash(`Invite sent to ${inv.email.trim()}. The link works for 48 hours.`);
    setInv({ name: "", email: "", role: "door" });
    setInviting(false);
  }

  function changeRole(s, role) {
    if (s.role === "manager" && s.status === "active" && role !== "manager" && activeManagers === 1) {
      setFlash("Keep at least one active manager. Make someone else a manager first.");
      return;
    }
    setStaff(staff.map((x) => (x.id === s.id ? { ...x, role } : x)));
    setFlash(`${s.name} is now ${ROLE_LABEL[role]}. It applies the next time they sign in.`);
  }

  function copyInvite(s) {
    const link = `https://thefanglle.example/invite/${s.id}`;
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(link).then(() => setFlash(`Invite link for ${s.name} copied.`), () => setFlash(`Copy failed. The link is ${link}`));
    else setFlash(`The link is ${link}`);
  }
  const drawerRef = useRef(null);

  const tonight = events[0];

  useEffect(() => {
    if (creating) return;
    const ev = events.find((e) => e.key === editKey);
    if (ev) setDraft({ ...ev, quota: String(ev.quota), min: { ...ev.min }, lineup: ev.lineup.map((r) => ({ ...r })) });
    setErrors({});
  }, [editKey, creating]);

  useEffect(() => {
    if (!drawer && !confirm && !note) return;
    if (drawer) drawerRef.current?.focus();
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (confirm) setConfirm(null);
      else if (note) setNote(null);
      else setDrawer(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer, confirm, note]);

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(""), 4000);
    return () => clearTimeout(id);
  }, [flash]);

  function go(p) { setPage(p); setDrawer(null); }

  function doConfirm() {
    const c = confirm;
    if (c.kind === "release" || c.kind === "noshow") {
      setBookings(bookings.map((b) => (b.id === c.id ? { ...b, status: "expired", log: [...b.log, `${NOW} ${c.kind === "release" ? "Released by manager" : "Marked no-show"}`] } : b)));
      setFlash(c.kind === "release" ? `Table ${c.table} is open again.` : `${c.name} marked no-show. Table ${c.table} is open for walk-ins.`);
    }
    if (c.kind === "remove") {
      setGuests(guests.filter((g) => g.id !== c.id));
      setEvents(events.map((e, i) => (i === 0 ? { ...e, signed: e.signed - c.people } : e)));
      setFlash(`${c.name} removed. ${c.people} ${c.people === 1 ? "place" : "places"} back on the list.`);
    }
    if (c.kind === "disable") {
      setStaff(staff.map((s) => (s.id === c.id ? { ...s, status: "disabled", last: "Disabled just now" } : s)));
      setFlash(`${c.name} can't sign in any more. Their past check-ins stay in the door log.`);
    }
    if (c.kind === "uninvite") {
      setStaff(staff.filter((s) => s.id !== c.id));
      setFlash(`Invite for ${c.name} cancelled. The link no longer works.`);
    }
    setConfirm(null);
    setDrawer(null);
  }

  function startCreate() {
    setCreating(true);
    setStartFrom("blank");
    setDraft(blankEvent());
    setErrors({});
    setSaved("");
  }

  function applyStart(v) {
    setStartFrom(v);
    if (v === "blank") setDraft(blankEvent());
    else {
      const src = events.find((e) => e.key === v);
      setDraft({ ...blankEvent(), genre: src.genre, cutoff: src.cutoff, quota: String(src.quota), min: { ...src.min } });
    }
  }

  function setRow(id, k, v) {
    setDraft({ ...draft, lineup: draft.lineup.map((r) => (r.id === id ? { ...r, [k]: v } : r)) });
    setSaved("");
  }

  function addRow() {
    const last = draft.lineup[draft.lineup.length - 1];
    const start = last?.end || "22:00";
    const endMin = (toNight(start) + 60) % 1440;
    const end = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
    const r = row("", "Guest star", start, end);
    setDraft({ ...draft, lineup: [...draft.lineup, r] });
    setSaved("");
    setTimeout(() => document.getElementById(`ln-${r.id}`)?.focus(), 0);
  }

  function removeRow(id) {
    if (draft.lineup.length === 1) return;
    setDraft({ ...draft, lineup: draft.lineup.filter((r) => r.id !== id) });
    setSaved("");
  }

  function saveEvent(e) {
    e.preventDefault();
    const er = {};
    if (creating) {
      if (!draft.key) er.key = "Choose the date.";
      else if (events.some((x) => x.key === draft.key)) er.key = `There's already an event on ${dayLabel(draft.key)}.`;
    }
    if (!draft.name.trim()) er.name = "Give the night a name.";
    draft.lineup.forEach((r) => {
      if (!r.name.trim()) er[`ln-${r.id}`] = "Add the performer's name, or remove this row.";
      if (!r.start || !r.end) er[`lt-${r.id}`] = "Add a start and end time.";
      else if (r.start === r.end) er[`lt-${r.id}`] = "The set can't start and end at the same time.";
    });
    if (!draft.lineup.some((r) => r.role === "Headliner")) er.lineup = "Mark at least one performer as Headliner.";
    if (!draft.close) er.close = "Set the closing time.";
    else if (toNight(draft.close) <= toNight("15:00")) er.close = "Closing has to be after the 3 pm opening.";
    if (draft.blurb.length > 220) er.blurb = "Keep it under 220 characters.";
    const q = Number(draft.quota);
    if (!Number.isInteger(q) || q < 1) er.quota = "Enter a whole number of places.";
    else if (q < draft.signed) er.quota = `At least ${draft.signed}. That many people are already on the list.`;
    ["stage", "booth", "bar"].forEach((z) => {
      if (!(Number(draft.min[z]) > 0)) er[z] = "Enter an amount above zero.";
    });
    setErrors(er);
    if (Object.keys(er).length) {
      setTimeout(() => document.querySelector("form [aria-invalid='true']")?.focus(), 0);
      return;
    }
    const sorted = [...draft.lineup].sort((a, b) => toNight(a.start) - toNight(b.start));
    const clean = { ...draft, lineup: sorted, quota: q, min: { stage: +draft.min.stage, booth: +draft.min.booth, bar: +draft.min.bar } };
    if (creating) {
      setEvents([...events, clean].sort((a, b) => a.key.localeCompare(b.key)));
      setCreating(false);
      setEditKey(clean.key);
      setSaved(`${clean.name} added for ${dayLabel(clean.key)}. It shows on the public site now.`);
    } else {
      setEvents(events.map((x) => (x.key === clean.key ? clean : x)));
      setSaved("Saved. The public site shows the change now.");
    }
  }

  const bRows = bookings
    .filter((b) => bFilter === "all" || b.status === bFilter)
    .filter((b) => { const s = bq.trim().toLowerCase(); return !s || [b.name, b.id, b.table].some((v) => v.toLowerCase().includes(s)); })
    .sort((a, b) => (bSort === "table" ? a.table.localeCompare(b.table) : STATUS[a.status].rank - STATUS[b.status].rank));
  const gArrOf = (g) => (g.inside === 0 ? "none" : g.inside >= g.people ? "all" : "part");
  const gRows = guests
    .filter((g) => gType === "all" || g.qr === gType)
    .filter((g) => gArr === "any" || gArrOf(g) === gArr)
    .filter((g) => { const s = gq.trim().toLowerCase(); return !s || g.name.toLowerCase().includes(s) || g.phone.includes(s); });

  const inside = HOURS.reduce((a, h) => a + h[1], 0);
  const cap = 600;
  const maxBar = Math.max(...HOURS.map((h) => h[1]));
  const paidTables = bookings.filter((b) => b.status === "paid" || b.status === "in").length + 8;
  const notArrived = bookings.filter((b) => b.status === "paid").length;
  const deposits = bookings.filter((b) => b.status === "paid" || b.status === "in").reduce((a, b) => a + b.deposit, 0) + 60000000;
  const arrivedGl = guests.reduce((a, g) => a + g.inside, 0) + 88;
  const held = bookings.find((b) => b.status === "held");
  const dr = drawer && (drawer.kind === "booking" ? bookings.find((b) => b.id === drawer.id) : guests.find((g) => g.id === drawer.id));

  const css = `
@import url('https://fonts.googleapis.com/css2?family=Poiret+One&family=Didact+Gothic&display=swap');
:root{
  --obsidian:#0C0812; --surface:#150E1F; --raised:#1E1530; --line:#2E2342; --line-soft:#221931;
  --amethyst:#563C7A; --amethyst-deep:#3D2A58; --amethyst-soft:#7A5BA6;
  --text:#EEE9F3; --soft:#C9BDD9; --muted:#A99DB8;
  --garnet:#A3162F; --garnet-hover:#B91C38; --garnet-text:#E5566B; --on-garnet:#FBF7FB;
  --held:#F0B55A; --paid:#6FD49A;
  --head:'Poiret One','Helvetica Neue',Arial,sans-serif; --body:'Didact Gothic','Helvetica Neue',Arial,sans-serif;
}
*{box-sizing:border-box;margin:0;padding:0}
.app{min-height:100vh;background:var(--obsidian);color:var(--text);font-family:var(--body);font-size:16px;line-height:1.5;
  display:grid;grid-template-columns:1fr;padding-bottom:80px}
@media (min-width:960px){.app{grid-template-columns:248px minmax(0,1fr)}}
.head{font-family:var(--head);font-weight:400}
.two{color:var(--garnet-text)}
:focus-visible{outline:2px solid var(--text);outline-offset:3px}
button{font-family:var(--body)}

.side{background:var(--surface);border-right:1px solid var(--line-soft);display:flex;flex-direction:column;padding:20px 14px}
@media (max-width:959px){.side{flex-direction:row;align-items:center;gap:8px;overflow-x:auto;padding:10px 14px;border-right:0;border-bottom:1px solid var(--line-soft)}}
.brand{font-size:18px;letter-spacing:.12em;padding:4px 10px 22px;white-space:nowrap}
@media (max-width:959px){.brand{padding:0 8px 0 0}}
.grp{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);padding:14px 10px 6px}
@media (max-width:959px){.grp{display:none}}
.navbtn{display:flex;justify-content:space-between;align-items:center;width:100%;text-align:left;background:transparent;border:0;border-radius:6px;
  color:var(--soft);font-size:16px;padding:10px 12px;min-height:44px;cursor:pointer;white-space:nowrap;gap:10px}
@media (max-width:959px){.navbtn{width:auto}}
.navbtn:hover{background:var(--raised);color:var(--text)}
.navbtn[aria-current="page"]{background:var(--raised);color:var(--text)}
.count{font-size:12px;min-width:22px;padding:1px 7px;border-radius:10px;background:var(--garnet);color:var(--on-garnet);text-align:center}
.spacer{flex:1}
@media (max-width:959px){.spacer{display:none}}
.out{margin-top:16px;min-height:44px;border:1px solid var(--line);background:transparent;color:var(--soft);border-radius:6px;font-size:15px;cursor:pointer}
@media (max-width:959px){.out{margin:0;padding:0 14px}}

.main{min-width:0}
.topbar{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:14px 28px;border-bottom:1px solid var(--line-soft);
  font-size:15px;color:var(--muted)}
.content{padding:28px 24px;display:flex;flex-direction:column;gap:22px;max-width:1120px;margin:0 auto}
.title{font-size:clamp(30px,4vw,42px);line-height:1.1}
.sub{color:var(--muted);margin-top:4px}
.flash{border:1px solid var(--amethyst-soft);background:var(--raised);padding:12px 16px;border-radius:8px}

.over{display:grid;grid-template-columns:1fr;gap:14px}
@media (min-width:1000px){.over{grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)}}
.hero{background:var(--surface);border:1px solid var(--amethyst-deep);border-radius:12px;padding:26px;display:flex;flex-direction:column;gap:20px}
.hero .k{font-size:14px;color:var(--muted)}
.big{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
.big strong{font-family:var(--head);font-weight:400;font-size:clamp(56px,7vw,84px);line-height:1}
.big span{color:var(--muted);font-size:18px}
.cap{height:10px;background:var(--raised);border-radius:5px;overflow:hidden}
.cap i{display:block;height:100%;background:var(--amethyst-soft)}
.line{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;border-top:1px solid var(--line);padding-top:14px}
.step{font-size:14px;color:var(--muted)}
.step b{display:block;font-weight:400;font-size:16px;color:var(--text)}
.step.done b{color:var(--muted);text-decoration:line-through;text-decoration-color:var(--amethyst)}
.step.next b{color:var(--garnet-text)}
.urgent{display:grid;grid-template-columns:minmax(0,1fr) 128px;gap:16px;align-items:center;border:1px solid var(--garnet);border-radius:8px;padding:14px 16px}
.urgent small{display:block;color:var(--muted);font-size:14px}
.urgent .act{width:100%}
.minis{display:grid;grid-template-columns:1fr;gap:14px}
.mini{width:100%;text-align:left;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:18px;color:var(--text);cursor:pointer;
  display:flex;flex-direction:column;gap:4px;transition:border-color .15s}
.mini:hover{border-color:var(--amethyst-soft)}
.mini .k{font-size:14px;color:var(--muted)}
.mini .v{font-family:var(--head);font-size:32px;line-height:1.1}
.mini .n{font-size:14px;color:var(--soft)}
.mini .go{font-size:14px;color:var(--muted);margin-top:4px}
.meter{height:6px;background:var(--raised);border-radius:3px;overflow:hidden;margin-top:6px}
.meter i{display:block;height:100%;background:var(--amethyst-soft)}
@media (prefers-reduced-motion:reduce){.mini{transition:none}}

.pair{display:grid;grid-template-columns:1fr;gap:14px}
@media (min-width:1000px){.pair{grid-template-columns:minmax(0,1.4fr) minmax(0,1fr)}}
.card{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:20px}
.card h2{font-size:15px;color:var(--soft);font-weight:400;margin-bottom:14px}
.chart{display:flex;align-items:flex-end;gap:8px;height:160px}
.barbtn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;height:100%;background:transparent;border:0;color:var(--text);cursor:pointer;border-radius:6px;padding:0 2px}
.barbtn i{display:block;width:100%;max-width:44px;background:var(--amethyst);border-radius:4px 4px 0 0;min-height:2px}
.barbtn[aria-pressed="true"] i{background:var(--garnet)}
.barbtn span{font-size:12px;color:var(--muted)}
.barbtn b{font-weight:400;font-size:13px}
.readout{margin-top:12px;font-size:15px;color:var(--soft);border-top:1px solid var(--line);padding-top:12px}
.attn{list-style:none}
.attn li{display:grid;grid-template-columns:minmax(0,1fr) 128px;gap:16px;align-items:center;padding:14px 0;border-top:1px solid var(--line)}
.attn li:first-child{border-top:0;padding-top:0}
.attn small{display:block;color:var(--muted);font-size:14px}
.attn .act{width:100%}
.flag{color:var(--garnet-text)}

.summary{display:flex;gap:18px;flex-wrap:wrap;align-items:center;font-size:15px;color:var(--soft)}
.summary .meter{width:220px;margin:0}
.toolbar{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end}
.toolbar .grow{flex:1;min-width:220px}
.lab{display:block;font-size:13px;color:var(--muted);margin-bottom:6px}
.search,.select{min-height:44px;padding:8px 12px;background:var(--surface);border:1px solid var(--line);border-radius:8px;color:var(--text);font-family:var(--body);font-size:15px;width:100%}
.chips{display:flex;gap:6px;flex-wrap:wrap}
.chip{min-height:40px;padding:6px 14px;border-radius:20px;border:1px solid var(--line);background:transparent;color:var(--soft);font-size:15px;cursor:pointer}
.chip[aria-pressed="true"]{background:var(--raised);color:var(--text);border-color:var(--amethyst-soft)}
.chip em{font-style:normal;color:var(--muted);margin-left:4px}
.tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
table{width:100%;border-collapse:collapse;min-width:720px}
th{text-align:left;font-weight:400;font-size:13px;color:var(--muted);padding:12px 16px;border-bottom:1px solid var(--line)}
td{padding:12px 16px;border-bottom:1px solid var(--line-soft);font-size:15px;vertical-align:middle}
th.c,td.c{text-align:center}
tr:last-child td{border-bottom:0}
tbody tr:hover{background:var(--raised)}
td small{display:block;color:var(--muted);font-size:13px}
.badge{display:inline-block;font-size:13px;padding:3px 10px;border-radius:12px;background:var(--raised);white-space:nowrap}
.b-held{color:var(--held)}.b-paid{color:var(--paid)}.b-in{color:var(--soft)}.b-off{color:var(--muted)}
.act{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:6px 14px;border-radius:6px;border:1px solid var(--amethyst-soft);
  background:transparent;color:var(--text);font-size:14px;line-height:1.2;cursor:pointer;white-space:nowrap;transition:background .15s,border-color .15s}
.act:hover{border-color:var(--text);background:var(--raised)}
.act.danger{border-color:var(--garnet-text);color:var(--garnet-text)}
.empty,.error{padding:36px 20px;text-align:center;color:var(--muted)}
.empty button{margin-top:10px}
.error{color:var(--text)}
.skel{height:14px;border-radius:4px;background:var(--raised);margin:16px}

.scrim{position:fixed;inset:0;background:rgba(12,8,18,.7);z-index:40}
.drawer{position:fixed;top:0;right:0;bottom:0;width:min(440px,100%);background:var(--surface);border-left:1px solid var(--amethyst-deep);z-index:41;
  display:flex;flex-direction:column;overflow-y:auto}
.drawer:focus{outline:none}
.drawer:focus-visible{outline:2px solid var(--text);outline-offset:-3px}
.dh{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:22px;border-bottom:1px solid var(--line)}
.dh h2{font-size:28px;line-height:1.15}
.db{padding:22px;display:flex;flex-direction:column;gap:18px}
.facts{display:grid;grid-template-columns:auto 1fr;gap:6px 16px;font-size:15px}
.facts dt{color:var(--muted)}
.facts dd{text-align:right}
.tl{list-style:none;border-left:1px solid var(--amethyst);margin-left:4px}
.tl li{padding:0 0 12px 16px;font-size:15px;position:relative}
.tl li::before{content:"";position:absolute;left:-4px;top:8px;width:7px;height:7px;background:var(--amethyst-soft);clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}
.drow{display:flex;gap:10px;flex-wrap:wrap}
.dlg{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(440px,calc(100% - 32px));background:var(--surface);border:1px solid var(--garnet);
  border-radius:12px;padding:24px;z-index:50;display:flex;flex-direction:column;gap:14px}
.dlg h2{font-size:26px}
.dlg p{color:var(--soft)}
.dlgscrim{position:fixed;inset:0;background:rgba(12,8,18,.8);z-index:49}

.roles{display:grid;grid-template-columns:1fr;gap:14px}
@media (min-width:760px){.roles{grid-template-columns:1fr 1fr}}
.roles b{display:block;font-weight:400;font-size:18px}
.roles p{color:var(--muted);font-size:15px;margin-top:4px}
.rowacts{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}
.evgrid{display:grid;grid-template-columns:1fr;gap:14px}
@media (min-width:900px){.evgrid{grid-template-columns:minmax(220px,290px) minmax(0,1fr);align-items:start}}
.evlist{list-style:none;display:flex;flex-direction:column;gap:6px}
.evitem{width:100%;text-align:left;background:transparent;border:1px solid var(--line);border-radius:8px;color:var(--text);font-size:15px;padding:12px 14px;cursor:pointer;min-height:56px}
.evitem[aria-current="true"]{border-color:var(--garnet);background:var(--raised)}
.evitem small{display:block;color:var(--muted)}
.newbtn{min-height:48px;border-radius:8px;border:1px dashed var(--amethyst-soft);background:transparent;color:var(--text);font-size:15px;cursor:pointer;margin-bottom:6px}
.newbtn:hover{border-style:solid}
.form{display:grid;grid-template-columns:1fr;gap:16px}
@media (min-width:760px){.form{grid-template-columns:1fr 1fr}}
.form h2{grid-column:1/-1;font-size:26px}
.field{display:flex;flex-direction:column;gap:6px}
.field.full{grid-column:1/-1}
.field label{font-size:15px}
.field label span{color:var(--muted);font-size:14px}
.field input,.field select,.field textarea{min-height:46px;padding:8px 12px;background:var(--obsidian);border:1px solid var(--line);border-radius:8px;color:var(--text);font-family:var(--body);font-size:16px}
.field textarea{resize:vertical;line-height:1.5}
.field textarea[aria-invalid="true"]{border-color:var(--garnet-text)}
.hintline{font-size:14px;color:var(--muted)}
.lineup{grid-column:1/-1;border:0;display:flex;flex-direction:column;gap:10px}
.lineup legend{font-size:15px;color:var(--soft);margin-bottom:8px}
.lineup legend span{color:var(--muted)}
.lrow{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px;border:1px solid var(--line);border-radius:10px;background:var(--obsidian)}
.lrow .field:first-child{grid-column:1/-1}
.lrow .field input,.lrow .field select{background:var(--surface)}
.lrow .act{grid-column:1/-1;justify-self:start}
.lrow .act:disabled{opacity:.45;cursor:not-allowed}
.rowerr{grid-column:1/-1}
@media (min-width:860px){
  .lrow{grid-template-columns:minmax(0,2fr) minmax(0,1.3fr) 118px 118px auto;align-items:end}
  .lrow .field:first-child{grid-column:auto}
  .lrow .act{grid-column:auto;min-height:46px}
}
.addrow{align-self:flex-start}
.warns{list-style:none;border:1px solid var(--held);border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:6px;font-size:15px;color:var(--held)}
.field input[aria-invalid="true"]{border-color:var(--garnet-text)}
.err{font-size:14px;color:var(--garnet-text)}
.fs{border:0;grid-column:1/-1;display:grid;grid-template-columns:1fr;gap:12px}
@media (min-width:760px){.fs{grid-template-columns:repeat(3,1fr)}}
.fs legend{font-size:14px;color:var(--soft);margin-bottom:8px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:10px 22px;border-radius:8px;font-size:16px;
  line-height:1.2;white-space:nowrap;cursor:pointer;border:1px solid transparent;transition:background .15s,border-color .15s}
.btn.solid{background:var(--garnet);color:var(--on-garnet);border-color:var(--garnet)}
.btn.solid:hover{background:var(--garnet-hover);border-color:var(--garnet-hover)}
.btn.line{background:transparent;color:var(--text);border-color:var(--amethyst-soft)}
.btn.line:hover{background:var(--raised);border-color:var(--text)}
@media (prefers-reduced-motion:reduce){.btn,.act{transition:none}}
.ok{color:var(--paid);font-size:15px}

.sim{position:fixed;left:0;right:0;bottom:0;z-index:30;background:#1C1C1F;color:#E6E6EA;border-top:1px solid #3A3A40;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px}
.simin{padding:8px 20px;display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center}
.simin strong{font-size:13px;color:#B5B5BD}
.simin button{font:inherit;min-height:34px;padding:4px 10px;border-radius:6px;border:1px solid #4A4A52;background:#26262A;color:#E6E6EA;cursor:pointer}
.simin button[aria-pressed="true"]{background:#E6E6EA;color:#1C1C1F}
.simin span{color:#B5B5BD;font-size:13px}
`;

  if (out) {
    return (
      <div className="app" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <style>{css}</style>
        <div className="card" style={{ maxWidth: 420, display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="brand head" style={{ padding: 0 }}>THE FANGLLE <span className="two">II</span></div>
          <h1 className="head" style={{ fontSize: 30 }}>Signed out</h1>
          <p className="sub">Door devices use their own account, so scanning at the door keeps working.</p>
          <button className="btn solid" onClick={() => setOut(false)}>Sign in again</button>
        </div>
      </div>
    );
  }

  let body;
  if (page === "tonight") {
    const sel = HOURS[bar];
    body = (
      <>
        <div>
          <h1 className="title head">{tonight.name} <span className="two">tonight</span></h1>
          <p className="sub">{dayLabel(tonight.key)} · {headOf(tonight)}{othersOf(tonight).length > 0 && ` with ${othersOf(tonight).join(", ")}`}</p>
        </div>
        <div className="over">
          <section className="hero" aria-labelledby="h-in">
            <div>
              <div className="k" id="h-in">Inside right now</div>
              <div className="big"><strong>{inside}</strong><span>of {cap} capacity</span></div>
            </div>
            <div className="cap" role="img" aria-label={`${Math.round((inside / cap) * 100)} percent full`}><i style={{ width: `${(inside / cap) * 100}%` }} /></div>
            <div className="line" aria-label="Tonight's timeline">
              <div className="step done"><b>15:00</b>Doors</div>
              <div className="step done"><b>23:00</b>Guestlist closed</div>
              <div className="step next"><b>00:00</b>Headliner, in 26 min</div>
              <div className="step"><b>{tonight.close}</b>Close</div>
            </div>
            {held && (
              <div className="urgent">
                <div>Table {held.table} is held but not paid<small>{held.name} · released automatically in {held.mins} min</small></div>
                <button className="act" onClick={() => setDrawer({ kind: "booking", id: held.id })}>Review</button>
              </div>
            )}
          </section>
          <div className="minis">
            <button className="mini" onClick={() => go("guestlist")}>
              <span className="k">Guestlist</span>
              <span className="v">{arrivedGl} <span style={{ fontSize: 18, color: "var(--muted)" }}>of {tonight.signed} arrived</span></span>
              <span className="meter"><i style={{ width: `${(arrivedGl / tonight.signed) * 100}%` }} /></span>
              <span className="go">Open guestlist</span>
            </button>
            <button className="mini" onClick={() => go("tables")}>
              <span className="k">Tables</span>
              <span className="v">{paidTables} <span style={{ fontSize: 18, color: "var(--muted)" }}>of 16 booked</span></span>
              <span className="n">{notArrived} paid tables still to arrive</span>
              <span className="go">Open table bookings</span>
            </button>
            <button className="mini" onClick={() => go("tables")}>
              <span className="k">Deposits tonight</span>
              <span className="v" style={{ fontSize: 26 }}>{idr(deposits)}</span>
              <span className="n">Test mode, no real payments</span>
              <span className="go">See who paid</span>
            </button>
          </div>
        </div>
        <div className="pair">
          <section className="card" aria-labelledby="c-arr">
            <h2 id="c-arr">When did people arrive? Every hour, tonight</h2>
            <div className="chart" role="group" aria-label="Arrivals per 30 minutes. Choose a bar for details.">
              {HOURS.map(([h, v], i) => (
                <button key={h} className="barbtn" aria-pressed={bar === i} aria-label={`${h}: ${v} arrived`} onClick={() => setBar(i)}>
                  <b>{v || ""}</b>
                  <i style={{ height: `${(v / maxBar) * 110}px` }} />
                  <span>{h}</span>
                </button>
              ))}
            </div>
            <p className="readout" aria-live="polite">
              {sel[1] === 0 ? `${sel[0]} hasn't happened yet.` : `${sel[0]} to the next hour: ${sel[1]} arrived. ${sel[2]} from the guestlist, ${sel[3]} from tables.`}
            </p>
          </section>
          <section className="card" aria-labelledby="c-att">
            <h2 id="c-att">Needs you</h2>
            <ul className="attn">
              <li><div>Friday guestlist almost full<small>194 of 200 places taken</small></div><button className="act" onClick={() => { setCreating(false); setEditKey("2026-09-25"); go("events"); }}>Add places</button></li>
              <li><div>{notArrived} paid tables not here yet<small>Headliner starts at midnight</small></div><button className="act" onClick={() => { setBFilter("paid"); go("tables"); }}>Show tables</button></li>
              <li><div><span className="flag">1 manager override tonight</span><small>Ayu Pratiwi, 2 people at 23:12</small></div><button className="act" onClick={() => { setOnlyOverrides(true); go("door"); }}>Open door log</button></li>
            </ul>
          </section>
        </div>
      </>
    );
  } else if (page === "tables") {
    body = (
      <>
        <div><h1 className="title head">Table <span className="two">bookings</span></h1><p className="sub">{tonight.name}, {dayLabel(tonight.key)}. Most urgent first.</p></div>
        <div className="toolbar">
          <div className="grow">
            <label className="lab" htmlFor="bq">Search</label>
            <input id="bq" className="search" placeholder="Guest, table or booking code" value={bq} onChange={(e) => setBq(e.target.value)} />
          </div>
          <div style={{ minWidth: 180 }}>
            <label className="lab" htmlFor="bs">Sort by</label>
            <select id="bs" className="select" value={bSort} onChange={(e) => setBSort(e.target.value)}>
              <option value="urgency">Needs action first</option>
              <option value="table">Table number</option>
            </select>
          </div>
        </div>
        <div className="chips" role="group" aria-label="Filter by status">
          {[["all", "All"], ["held", "Held, unpaid"], ["paid", "Paid, not arrived"], ["in", "Arrived"], ["expired", "Released"]].map(([k, l]) => (
            <button key={k} className="chip" aria-pressed={bFilter === k} onClick={() => setBFilter(k)}>
              {l}<em>{k === "all" ? bookings.length : bookings.filter((b) => b.status === k).length}</em>
            </button>
          ))}
        </div>
        <div className="tablewrap">
          {load === "loading" ? (
            <div role="status" aria-label="Loading tonight's table bookings">{[0, 1, 2, 3].map((i) => <div key={i} className="skel" />)}</div>
          ) : load === "error" ? (
            <div className="error" role="alert">Tonight's bookings didn't load. Check the connection, then try again.<br /><button className="act" style={{ marginTop: 12 }} onClick={() => setLoad("ok")}>Try again</button></div>
          ) : bRows.length === 0 ? (
            <div className="empty">No bookings match these filters.<br /><button className="act" onClick={() => { setBFilter("all"); setBq(""); }}>Clear filters</button></div>
          ) : (
            <table>
              <thead><tr><th>Status</th><th className="c">Table</th><th>Guest</th><th className="c">Arrived</th><th>Deposit</th><th>Booking</th><th className="c"><span style={{ position: "absolute", left: -9999 }}>Actions</span></th></tr></thead>
              <tbody>
                {bRows.map((b) => (
                  <tr key={b.id}>
                    <td><span className={`badge ${STATUS[b.status].cls}`}>{STATUS[b.status].label}{b.status === "held" ? ` · ${b.mins} min` : ""}</span></td>
                    <td className="c">{b.table}<small>{b.zone}</small></td>
                    <td>{b.name}<small>Phone ends {b.phone}</small></td>
                    <td className="c">{b.status === "expired" ? "·" : `${b.inside} / ${b.people}`}</td>
                    <td>{idr(b.deposit)}</td>
                    <td>{b.id}</td>
                    <td className="c"><button className="act" onClick={() => setDrawer({ kind: "booking", id: b.id })}>Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>
    );
  } else if (page === "guestlist") {
    body = (
      <>
        <div><h1 className="title head">Guest<span className="two">list</span></h1><p className="sub">{tonight.name} · free entry closed at {tonight.cutoff}</p></div>
        <div className="summary">
          <span>{tonight.signed} of {tonight.quota} places taken</span>
          <span className="meter"><i style={{ width: `${(tonight.signed / tonight.quota) * 100}%` }} /></span>
          <button className="act" onClick={() => { setCreating(false); setEditKey(tonight.key); go("events"); }}>Change places or closing time</button>
        </div>
        <div className="toolbar">
          <div className="grow">
            <label className="lab" htmlFor="gq">Search</label>
            <input id="gq" className="search" placeholder="Name or last 4 digits of phone" value={gq} onChange={(e) => setGq(e.target.value)} />
          </div>
        </div>
        <div className="toolbar" style={{ gap: 24 }}>
          <div>
            <span className="lab" id="qt">QR type</span>
            <div className="chips" role="group" aria-labelledby="qt">
              {[["all", "All"], ["group", "Group QR"], ["personal", "Personal QR"]].map(([k, l]) => (
                <button key={k} className="chip" aria-pressed={gType === k} onClick={() => setGType(k)}>
                  {l}<em>{k === "all" ? guests.length : guests.filter((g) => g.qr === k).length}</em>
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="lab" id="ar">Arrival</span>
            <div className="chips" role="group" aria-labelledby="ar">
              {[["any", "All"], ["none", "Not yet"], ["part", "Partly in"], ["all", "All in"]].map(([k, l]) => (
                <button key={k} className="chip" aria-pressed={gArr === k} onClick={() => setGArr(k)}>
                  {l}<em>{k === "any" ? guests.length : guests.filter((g) => gArrOf(g) === k).length}</em>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="tablewrap">
          {(() => {
            const list = gRows;
            if (list.length === 0)
              return <div className="empty">No one on tonight's list matches these filters.<br /><button className="act" onClick={() => { setGType("all"); setGArr("any"); setGq(""); }}>Clear filters</button></div>;
            return (
              <table>
                <thead><tr><th>Arrival</th><th>Name</th><th className="c">QR type</th><th className="c">People</th><th className="c"><span style={{ position: "absolute", left: -9999 }}>Actions</span></th></tr></thead>
                <tbody>
                  {list.map((g) => {
                    const a = gArrOf(g);
                    return (
                      <tr key={g.id}>
                        <td><span className={`badge ${a === "all" ? "b-in" : a === "part" ? "b-held" : "b-off"}`}>{a === "all" ? "All in" : a === "part" ? `${g.inside} of ${g.people} in` : "Not yet"}</span></td>
                        <td>{g.name}<small>{g.qr === "personal" && g.organiser !== g.name ? `With ${g.organiser}` : `Phone ends ${g.phone}`}</small></td>
                        <td className="c">{g.qr === "group" ? "Group" : "Personal"}</td>
                        <td className="c">{g.people}</td>
                        <td className="c"><button className="act" onClick={() => setDrawer({ kind: "guest", id: g.id })}>Details</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()}
        </div>
      </>
    );
  } else if (page === "door") {
    const rows = onlyOverrides ? DOOR.filter((d) => d.flag) : DOOR;
    body = (
      <>
        <div><h1 className="title head">Door <span className="two">log</span></h1><p className="sub">Every check-in tonight, newest first.</p></div>
        <div className="chips" role="group" aria-label="Show">
          <button className="chip" aria-pressed={!onlyOverrides} onClick={() => setOnlyOverrides(false)}>Everything<em>{DOOR.length}</em></button>
          <button className="chip" aria-pressed={onlyOverrides} onClick={() => setOnlyOverrides(true)}>Manager overrides<em>{DOOR.filter((d) => d.flag).length}</em></button>
        </div>
        <div className="tablewrap">
          <table>
            <thead><tr><th className="c">Time</th><th>Guest</th><th className="c">People</th><th>How they got in</th></tr></thead>
            <tbody>{rows.map((d, i) => (
              <tr key={i}><td className="c">{d.at}</td><td>{d.name}</td><td className="c">{d.n}</td><td className={d.flag ? "flag" : ""}>{d.how}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </>
    );
  } else if (page === "team") {
    body = (
      <>
        <div><h1 className="title head"><span className="two">Team</span></h1><p className="sub">Who can sign in, and what they can do.</p></div>
        <div className="roles">
          <div className="card"><b>Manager</b><p>Everything in this panel: bookings, guestlist, events and the team.</p></div>
          <div className="card"><b>Door staff</b><p>The door scanner only. Every check-in is logged under their name.</p></div>
        </div>
        <div className="toolbar">
          <button className="btn solid" onClick={() => { setInviting(!inviting); setInvErr({}); }} aria-expanded={inviting}>
            {inviting ? "Close invite" : "Invite someone"}
          </button>
        </div>
        {inviting && (
          <form className="card form invite" onSubmit={sendInvite} noValidate>
            <h2 className="head">Invite to the team</h2>
            <div className="field">
              <label htmlFor="i-name">Name</label>
              <input id="i-name" autoFocus value={inv.name} aria-invalid={!!invErr.name} aria-describedby={invErr.name ? "ie-name" : undefined}
                onChange={(e) => setInv({ ...inv, name: e.target.value })} />
              {invErr.name && <span id="ie-name" className="err">{invErr.name}</span>}
            </div>
            <div className="field">
              <label htmlFor="i-email">Email</label>
              <input id="i-email" type="email" value={inv.email} aria-invalid={!!invErr.email} aria-describedby={invErr.email ? "ie-email" : undefined}
                onChange={(e) => setInv({ ...inv, email: e.target.value })} />
              {invErr.email && <span id="ie-email" className="err">{invErr.email}</span>}
            </div>
            <div className="field">
              <label htmlFor="i-role">Role</label>
              <select id="i-role" value={inv.role} onChange={(e) => setInv({ ...inv, role: e.target.value })}>
                <option value="door">Door staff</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div className="field full" style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <button type="submit" className="btn solid">Send invite</button>
              <button type="button" className="btn line" onClick={() => setInviting(false)}>Cancel</button>
              <span className="hintline">They set their own password from the email. The link works for 48 hours.</span>
            </div>
          </form>
        )}
        <div className="tablewrap">
          <table>
            <thead><tr><th>Person</th><th>Role</th><th className="c">Status</th><th>Last active</th><th className="c"><span style={{ position: "absolute", left: -9999 }}>Actions</span></th></tr></thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}<small>{s.email}</small></td>
                  <td>
                    {s.you || s.status === "disabled" ? (
                      <span>{ROLE_LABEL[s.role]}</span>
                    ) : (
                      <select className="select" style={{ minWidth: 150 }} aria-label={`Role for ${s.name}`} value={s.role} onChange={(e) => changeRole(s, e.target.value)}>
                        <option value="door">Door staff</option>
                        <option value="manager">Manager</option>
                      </select>
                    )}
                  </td>
                  <td className="c"><span className={`badge ${STAFF_STATUS[s.status][1]}`}>{STAFF_STATUS[s.status][0]}</span></td>
                  <td>{s.last}</td>
                  <td className="c">
                    <div className="rowacts">
                      {s.you && <span className="hintline">This is you</span>}
                      {!s.you && s.status === "active" && (
                        <>
                          <button className="act" onClick={() => setFlash(`Password reset link sent to ${s.email}.`)}>Reset password</button>
                          <button className="act danger" onClick={() => setConfirm({ kind: "disable", id: s.id, name: s.name })}>Disable</button>
                        </>
                      )}
                      {s.status === "invited" && (
                        <>
                          <button className="act" onClick={() => setFlash(`Invite sent again to ${s.email}.`)}>Resend invite</button>
                          <button className="act" onClick={() => copyInvite(s)}>Copy link</button>
                          <button className="act danger" onClick={() => setConfirm({ kind: "uninvite", id: s.id, name: s.name })}>Cancel invite</button>
                        </>
                      )}
                      {s.status === "disabled" && (
                        <button className="act" onClick={() => { setStaff(staff.map((x) => (x.id === s.id ? { ...x, status: "active", last: "Enabled just now" } : x))); setFlash(`${s.name} can sign in again.`); }}>Enable</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  } else if (draft) {
    const cur = events.find((x) => x.key === editKey);
    body = (
      <>
        <div><h1 className="title head"><span className="two">Events</span></h1><p className="sub">Line-up, guestlist places and minimum spend for each night.</p></div>
        <div className="evgrid">
          <div>
            <button className="newbtn" style={{ width: "100%" }} onClick={startCreate} aria-pressed={creating}>+ New event</button>
            <ul className="evlist">
              {events.map((x) => (
                <li key={x.key}>
                  <button className="evitem" aria-current={!creating && x.key === editKey} onClick={() => { setCreating(false); setEditKey(x.key); setSaved(""); }}>
                    {x.name}<small>{dayLabel(x.key)} · {x.signed}/{x.quota} on list</small>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <form className="card form" onSubmit={saveEvent} noValidate>
            <h2 className="head">{creating ? "New event" : `Edit ${cur?.name}`}</h2>
            {creating && (
              <>
                <div className="field">
                  <label htmlFor="f-from">Start from</label>
                  <select id="f-from" value={startFrom} onChange={(e) => applyStart(e.target.value)}>
                    <option value="blank">A blank event</option>
                    {events.map((x) => <option key={x.key} value={x.key}>Copy of {x.name} (prices and places)</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="f-key">Date</label>
                  <input id="f-key" type="date" value={draft.key} aria-invalid={!!errors.key} aria-describedby={errors.key ? "e-key" : undefined}
                    onChange={(e) => { setDraft({ ...draft, key: e.target.value }); setSaved(""); }} />
                  {errors.key && <span id="e-key" className="err">{errors.key}</span>}
                </div>
              </>
            )}
            {[["name", "Night name"], ["genre", "Genre"]].map(([k, l]) => (
              <div className="field" key={k}>
                <label htmlFor={`f-${k}`}>{l}{k === "genre" && <span> (optional)</span>}</label>
                <input id={`f-${k}`} value={draft[k]} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `e-${k}` : undefined}
                  onChange={(e) => { setDraft({ ...draft, [k]: e.target.value }); setSaved(""); }} />
                {errors[k] && <span id={`e-${k}`} className="err">{errors[k]}</span>}
              </div>
            ))}
            <div className="field full">
              <label htmlFor="f-blurb">Short description <span>(shown on the event page)</span></label>
              <textarea id="f-blurb" rows={2} value={draft.blurb} aria-invalid={!!errors.blurb} aria-describedby="c-blurb"
                onChange={(e) => { setDraft({ ...draft, blurb: e.target.value }); setSaved(""); }} />
              <span id="c-blurb" className={draft.blurb.length > 220 ? "err" : "hintline"}>
                {errors.blurb || `${draft.blurb.length} of 220 characters`}
              </span>
            </div>

            <fieldset className="lineup" aria-describedby={errors.lineup ? "e-lineup" : undefined}>
              <legend>Line-up <span>({draft.lineup.length} {draft.lineup.length === 1 ? "performer" : "performers"})</span></legend>
              {errors.lineup && <span id="e-lineup" className="err">{errors.lineup}</span>}
              {draft.lineup.map((r, i) => (
                <div className="lrow" key={r.id}>
                  <div className="field">
                    <label htmlFor={`ln-${r.id}`}>Performer {i + 1}</label>
                    <input id={`ln-${r.id}`} value={r.name} aria-invalid={!!errors[`ln-${r.id}`]} aria-describedby={errors[`ln-${r.id}`] ? `eln-${r.id}` : undefined}
                      onChange={(e) => setRow(r.id, "name", e.target.value)} />
                    {errors[`ln-${r.id}`] && <span id={`eln-${r.id}`} className="err">{errors[`ln-${r.id}`]}</span>}
                  </div>
                  <div className="field">
                    <label htmlFor={`lr-${r.id}`}>Role</label>
                    <select id={`lr-${r.id}`} value={r.role} onChange={(e) => setRow(r.id, "role", e.target.value)}>
                      {ROLES.map((x) => <option key={x}>{x}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor={`ls-${r.id}`}>Start</label>
                    <input id={`ls-${r.id}`} type="time" value={r.start} aria-invalid={!!errors[`lt-${r.id}`]} aria-describedby={errors[`lt-${r.id}`] ? `elt-${r.id}` : undefined}
                      onChange={(e) => setRow(r.id, "start", e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor={`le-${r.id}`}>End</label>
                    <input id={`le-${r.id}`} type="time" value={r.end} aria-invalid={!!errors[`lt-${r.id}`]} aria-describedby={errors[`lt-${r.id}`] ? `elt-${r.id}` : undefined}
                      onChange={(e) => setRow(r.id, "end", e.target.value)} />
                  </div>
                  <button type="button" className="act" onClick={() => removeRow(r.id)} disabled={draft.lineup.length === 1}
                    aria-label={`Remove ${r.name || `performer ${i + 1}`}`}>Remove</button>
                  {errors[`lt-${r.id}`] && <span id={`elt-${r.id}`} className="err rowerr">{errors[`lt-${r.id}`]}</span>}
                </div>
              ))}
              <button type="button" className="btn line addrow" onClick={addRow}>+ Add performer</button>
              {lineupWarnings(draft.lineup, draft.close).length > 0 && (
                <ul className="warns" role="status">
                  {lineupWarnings(draft.lineup, draft.close).map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              )}
              <p className="hintline">Sets are sorted by start time when you save. Times after midnight belong to the same night.</p>
            </fieldset>
            <div className="field">
              <label htmlFor="f-quota">Guestlist places{draft.signed > 0 && <span> ({draft.signed} signed up)</span>}</label>
              <input id="f-quota" inputMode="numeric" value={draft.quota} aria-invalid={!!errors.quota} aria-describedby={errors.quota ? "e-quota" : undefined}
                onChange={(e) => { setDraft({ ...draft, quota: e.target.value.replace(/\D/g, "") }); setSaved(""); }} />
              {errors.quota && <span id="e-quota" className="err">{errors.quota}</span>}
            </div>
            <div className="field">
              <label htmlFor="f-cut">Free entry until</label>
              <input id="f-cut" type="time" value={draft.cutoff} onChange={(e) => { setDraft({ ...draft, cutoff: e.target.value }); setSaved(""); }} />
            </div>
            <div className="field">
              <label htmlFor="f-close">Closes at <span>(doors open at 3 pm every night)</span></label>
              <input id="f-close" type="time" value={draft.close} aria-invalid={!!errors.close} aria-describedby={errors.close ? "e-close" : undefined}
                onChange={(e) => { setDraft({ ...draft, close: e.target.value }); setSaved(""); }} />
              {errors.close && <span id="e-close" className="err">{errors.close}</span>}
            </div>
            <fieldset className="fs">
              <legend>Minimum spend per table, IDR</legend>
              {[["stage", "Stage front"], ["booth", "Booths"], ["bar", "Bar tables"]].map(([z, l]) => (
                <div className="field" key={z}>
                  <label htmlFor={`f-${z}`}>{l}</label>
                  <input id={`f-${z}`} inputMode="numeric" value={draft.min[z]} aria-invalid={!!errors[z]} aria-describedby={errors[z] ? `e-${z}` : undefined}
                    onChange={(e) => { setDraft({ ...draft, min: { ...draft.min, [z]: e.target.value.replace(/\D/g, "") } }); setSaved(""); }} />
                  {errors[z] && <span id={`e-${z}`} className="err">{errors[z]}</span>}
                </div>
              ))}
            </fieldset>
            <div className="field full" style={{ flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <button type="submit" className="btn solid">{creating ? "Add event" : `Save ${draft.name || "event"}`}</button>
              {creating && <button type="button" className="btn line" onClick={() => { setCreating(false); setSaved(""); }}>Cancel</button>}
              {saved && <span className="ok" role="status">{saved}</span>}
            </div>
          </form>
        </div>
      </>
    );
  }

  const heldCount = bookings.filter((b) => b.status === "held").length;

  return (
    <div className="app">
      <style>{css}</style>
      <nav className="side" aria-label="Manager">
        <div className="brand head">THE FANGLLE <span className="two">II</span></div>
        {NAV.map(([grp, items]) => (
          <React.Fragment key={grp}>
            <div className="grp">{grp}</div>
            {items.map(([k, l]) => (
              <button key={k} className="navbtn" aria-current={page === k ? "page" : undefined} onClick={() => go(k)}>
                {l}
                {k === "tables" && heldCount > 0 && <span className="count" aria-label={`${heldCount} held`}>{heldCount}</span>}
              </button>
            ))}
          </React.Fragment>
        ))}
        <div className="spacer" />
        <button className="out" onClick={() => setOut(true)}>Sign out</button>
      </nav>
      <div className="main">
        <div className="topbar"><span>Signed in as manager</span><span>{dayLabel(tonight.key)} · {NOW}</span></div>
        <div className="content">
          {flash && <div className="flash" role="status">{flash}</div>}
          {body}
        </div>
      </div>

      {drawer && dr && (
        <>
          <div className="scrim" onClick={() => setDrawer(null)} />
          <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="dr-t" tabIndex={-1} ref={drawerRef}>
            <div className="dh">
              <div>
                <div className="sub" style={{ marginTop: 0 }}>{drawer.kind === "booking" ? `Booking ${dr.id}` : dr.qr === "group" ? "Group QR" : "Personal QR"}</div>
                <h2 id="dr-t" className="head">{drawer.kind === "booking" ? `Table ${dr.table}` : dr.name}</h2>
              </div>
              <button className="act" onClick={() => setDrawer(null)}>Close</button>
            </div>
            <div className="db">
              {drawer.kind === "booking" ? (
                <dl className="facts">
                  <dt>Status</dt><dd><span className={`badge ${STATUS[dr.status].cls}`}>{STATUS[dr.status].label}</span></dd>
                  <dt>Guest</dt><dd>{dr.name}</dd>
                  <dt>Phone</dt><dd>ends {dr.phone}</dd>
                  <dt>Zone</dt><dd>{dr.zone}</dd>
                  <dt>Arrived</dt><dd>{dr.inside} of {dr.people}</dd>
                  <dt>Deposit</dt><dd>{idr(dr.deposit)}</dd>
                </dl>
              ) : (
                <dl className="facts">
                  <dt>People</dt><dd>{dr.people}</dd>
                  <dt>Arrived</dt><dd>{dr.inside} of {dr.people}</dd>
                  <dt>Phone</dt><dd>ends {dr.phone}</dd>
                  {dr.qr === "personal" && dr.organiser !== dr.name && (<><dt>Added by</dt><dd>{dr.organiser}</dd></>)}
                  {dr.names.length > 0 && (<><dt>Other names</dt><dd>{dr.names.join(", ")}</dd></>)}
                </dl>
              )}
              <div>
                <div className="lab">What happened</div>
                <ul className="tl">{dr.log.map((l, i) => <li key={i}>{l}</li>)}</ul>
              </div>
              <div className="drow">
                {drawer.kind === "booking" && dr.status === "held" && (
                  <button className="act danger" onClick={() => setConfirm({ kind: "release", id: dr.id, table: dr.table, name: dr.name })}>Release table now</button>
                )}
                {drawer.kind === "booking" && dr.status === "paid" && (
                  <button className="act danger" onClick={() => setConfirm({ kind: "noshow", id: dr.id, table: dr.table, name: dr.name })}>Mark no-show</button>
                )}
                {drawer.kind === "guest" && dr.inside === 0 && (
                  <button className="act danger" onClick={() => setConfirm({ kind: "remove", id: dr.id, name: dr.name, people: dr.people })}>Remove from list</button>
                )}
                <button className="act" onClick={() => setNote(`Opens a WhatsApp chat with ${dr.name}. The full number is only shown inside WhatsApp, not on this screen.`)}>Message on WhatsApp</button>
                {drawer.kind === "guest" && <button className="act" onClick={() => setNote(`Sends ${dr.name}'s QR link again to the same number. Limited to a few times per hour.`)}>Resend QR</button>}
              </div>
            </div>
          </aside>
        </>
      )}

      {confirm && (
        <>
          <div className="dlgscrim" onClick={() => setConfirm(null)} />
          <div className="dlg" role="alertdialog" aria-modal="true" aria-labelledby="cf-t" aria-describedby="cf-d">
            <h2 id="cf-t" className="head">
              {{
                release: `Release table ${confirm.table}?`,
                noshow: `Mark ${confirm.name} as no-show?`,
                remove: `Remove ${confirm.name}?`,
                disable: `Disable ${confirm.name}?`,
                uninvite: `Cancel the invite for ${confirm.name}?`,
              }[confirm.kind]}
            </h2>
            <p id="cf-d">
              {{
                release: `${confirm.name} hasn't paid yet. The table opens for other guests straight away.`,
                noshow: `Table ${confirm.table} opens for walk-ins and the guest's QR stops working. The deposit is kept, as the booking terms say.`,
                remove: `${confirm.people} ${confirm.people === 1 ? "place goes" : "places go"} back on the list, and their QR stops working.`,
                disable: "They're signed out of every device straight away. Their past check-ins stay in the door log.",
                uninvite: "The invite link stops working. You can invite them again later.",
              }[confirm.kind]}
            </p>
            <div className="drow">
              <button className="btn solid" autoFocus onClick={doConfirm}>
                {{ release: "Release table", noshow: "Mark no-show", remove: "Remove from list", disable: "Disable account", uninvite: "Cancel invite" }[confirm.kind]}
              </button>
              <button className="btn line" onClick={() => setConfirm(null)}>Keep it</button>
            </div>
          </div>
        </>
      )}

      {note && (
        <>
          <div className="dlgscrim" onClick={() => setNote(null)} />
          <div className="dlg" role="dialog" aria-modal="true" aria-labelledby="nt-t" style={{ borderColor: "var(--amethyst-deep)" }}>
            <div className="lab">Catatan mockup</div>
            <h2 id="nt-t" className="head" style={{ fontSize: 22 }}>{note}</h2>
            <button className="btn line" autoFocus onClick={() => setNote(null)}>Close</button>
          </div>
        </>
      )}

      <div className="sim" role="region" aria-label="Kontrol pratinjau">
        <div className="simin">
          <strong>Kontrol pratinjau (tidak ada di versi asli)</strong>
          <span>Tabel booking:</span>
          {[["ok", "Normal"], ["loading", "Memuat"], ["error", "Gagal memuat"]].map(([k, l]) => (
            <button key={k} aria-pressed={load === k} onClick={() => { setLoad(k); go("tables"); }}>{l}</button>
          ))}
          <button onClick={() => { setBookings(BOOKINGS); setGuests(GUESTS); setEvents(EVENTS); setBFilter("all"); setGType("all"); setGArr("any"); setLoad("ok"); setFlash(""); }}>Mulai ulang</button>
          <span>Semua nama, angka, dan jam adalah data contoh.</span>
        </div>
      </div>
    </div>
  );
}
