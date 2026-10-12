import { useEffect, useMemo, useRef, useState } from 'react';
import { NIGHT_KEYS } from './night.js';
import './stage.css';

// The lit room and its crystals (docs/design/Crystals.dc.html). night: 0 Thursday, 1 Friday, 2 Saturday, 3 Sunday (gelOf).

// One composition per night, in % of the room, each ordered left to right. Layer: 0 back, 1 mid, 2 front.
// Thursday, Descent: long shards hanging deep from the rig.
const DESCENT = [
  [0, 'back', -4, -6, 16, -6, 7, 58], [2, 'bright', 12, -2, 15, -2, 13.5, 24], [1, 'deep', 20, -4, 30, -4, 25, 48],
  [2, 'bright', 28, 30, 30, 30, 29, 42], [1, 'mid', 33, -6, 44, -6, 38, 22], [2, 'work', 37, -4, 38.2, -4, 37.6, 34],
  [2, 'dark', 45, -4, 53, -4, 49, 30], [0, 'back', 54, -8, 76, -8, 66, 56], [2, 'bright', 62, -2, 65, -2, 63.5, 40],
  [1, 'deep', 72, -4, 78, -4, 75, 26], [1, 'mid', 80, -6, 92, -6, 86, 44], [2, 'work', 88, -2, 89, -2, 88.5, 20],
  [0, 'back', 92, -8, 108, -8, 100, 52], [1, 'deep', 96, -4, 103, -4, 99.5, 30],
];
// Friday, Second Wave: shards pointing up and down in turn along a swell.
const WAVE = Array.from({ length: 14 }, (_, j) => {
  const cx = -2 + j * 8;
  const cy = 20 + 12 * Math.sin(j * 0.9);
  const w = 9 + (j % 3) * 3;
  const h = 22 + (j % 2) * 8;
  const layer = [1, 2, 0][j % 3];
  const tone = layer === 0 ? 'back' : layer === 1 ? (j % 4 === 1 ? 'mid' : 'deep') : j === 8 ? 'work' : j % 6 === 2 ? 'dark' : 'bright';
  return j % 2 === 0
    ? [layer, tone, cx - w / 2, cy + h / 2, cx + w / 2, cy + h / 2, cx, cy - h / 2]
    : [layer, tone, cx - w / 2, cy - h / 2, cx + w / 2, cy - h / 2, cx, cy + h / 2];
});
// Saturday, Fall Line: one steep diagonal band, every shard leaning about 30 degrees, a long white line as the fall line.
const FALL = [
  [0, 'back', 8, -6, 24, -6, -2, 44], [2, 'work', 14, -4, 15, -4, 4, 30], [2, 'bright', 20, 16, 23, 16, 14, 36],
  [1, 'deep', 28, 4, 36, 4, 18, 40], [0, 'back', 40, -8, 62, -8, 26, 48], [2, 'dark', 46, 12, 52, 12, 40, 32],
  [2, 'work', 55, -4, 56.2, -4, 40, 38], [1, 'mid', 60, 0, 70, 0, 50, 34], [2, 'bright', 72, 8, 75, 8, 64, 34],
  [0, 'back', 78, -10, 104, -10, 66, 40], [2, 'dark', 82, -4, 88, -4, 76, 20], [2, 'bright', 86, 26, 88, 26, 83, 36],
  [1, 'deep', 90, -6, 98, -6, 80, 30], [1, 'mid', 96, 10, 100, 8, 90, 30],
];
// Sunday, Afterglow: long low beams converging on a sun just set off the right edge, one white horizon line.
const GLOW = [
  [0, 'back', -10, -12, -10, 14, 110, 24], [0, 'back', -10, 30, -10, 50, 108, 30], [2, 'work', -6, 22, -6, 23.4, 104, 27.5],
  [1, 'deep', 0, 16, 0, 26, 106, 27], [2, 'bright', 8, 4, 8, 7, 60, 16], [1, 'mid', 10, 36, 10, 42, 106, 30],
  [2, 'dark', 18, 26, 18, 32, 70, 28], [0, 'back', 20, -14, 60, -14, 112, 22], [1, 'deep', 30, 2, 30, 10, 108, 25],
  [2, 'bright', 40, 12, 40, 16, 102, 25], [2, 'work', 50, 40, 50, 41, 104, 31], [1, 'mid', 55, -6, 55, 2, 110, 23],
  [2, 'bright', 60, 32, 60, 35, 104, 29], [2, 'bright', 76, 18, 76, 21, 98, 25],
];
const COMP = [DESCENT, WAVE, FALL, GLOW];

const TONE = {
  back: 'color-mix(in oklab, var(--gel-deep) 40%, var(--blackout))',
  mid: 'color-mix(in oklab, var(--gel-deep) 70%, var(--blackout))',
  deep: 'var(--gel-deep)',
  bright: 'var(--gel-bright)',
  work: 'rgba(241, 236, 228, .82)',
  dark: 'var(--surface)',
};
// Idle motion per layer in the room's own units, so a phone moves in proportion: bob (cqh), sway (cqw), tilt on the shard's
// centre. po, pi: how far (% of the room's width) the layer slides out and in on a change of night.
const LAYER = [
  { op: 0.8, amp: 1.1, ax: 0.9, rot: 1.4, fd: 15, fs: 21, po: 22, pi: 16 },
  { op: 0.92, amp: 1.8, ax: 1.5, rot: 2.4, fd: 10, fs: 14, po: 40, pi: 30 },
  { op: 1, amp: 2.8, ax: 2.3, rot: 3.8, fd: 7, fs: 9, po: 64, pi: 48 },
];

// Deterministic noise: the same night always moves the same way.
const noise = (a) => {
  let t = (a * 2654435761 + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const f = (v) => +v.toFixed(2);

// count: fewer on a phone, picked evenly so the composition still spans the room. reach: how far down the room they hang.
export function shardsFor(night, count = 14, reach = 0.62) {
  const comp = COMP[night] ?? DESCENT;
  const sy = reach / 0.62;
  return Array.from({ length: count }, (_, k) => comp[Math.round((k * (comp.length - 1)) / Math.max(1, count - 1))]).map(
    ([layer, tone, x1, y1, x2, y2, x3, y3], i) => {
      const L = LAYER[layer];
      const pts = [[x1, y1 * sy], [x2, y2 * sy], [x3, y3 * sy]];
      const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3;
      const cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
      // Long shards tilt less, like heavier pieces; a y step counts about 0.65 of an x step in a wide room.
      const span = Math.max(...[[0, 1], [1, 2], [0, 2]].map(([u, w]) => Math.hypot(pts[u][0] - pts[w][0], (pts[u][1] - pts[w][1]) * 0.65)));
      // Each shard is drawn in its own bounding box, so the layer the browser moves is the size of the shard, not of the room.
      const x0 = Math.min(x1, x2, x3);
      const y0 = Math.min(...pts.map((p) => p[1]));
      const w = Math.max(x1, x2, x3) - x0 || 1;
      const h = Math.max(...pts.map((p) => p[1])) - y0 || 1;
      const inBox = (x, y) => `${f(((x - x0) / w) * 100)}% ${f(((y - y0) / h) * 100)}%`;
      const s = night * 31 + i;
      return {
        box: {
          left: `${f(x0)}%`,
          top: `${f(y0)}%`,
          width: `${f(w)}%`,
          height: `${f(h)}%`,
          zIndex: layer + 1,
          '--ed': `${260 + i * 50}ms`,
          '--po': f(L.po + noise(s * 3 + 1) * 8),
          '--pi': f(L.pi + noise(s * 5 + 2) * 8),
          '--pod': `${(2 - layer) * 40}ms`,
          '--pid': `${layer * 90 + Math.round(noise(s * 7 + 3) * 120)}ms`,
        },
        move: { transformOrigin: inBox(cx, cy), opacity: L.op },
        cut: { clipPath: `polygon(${pts.map(([x, y]) => inBox(x, y)).join(', ')})`, background: TONE[tone] },
        // Idle motion in ms, cqh, cqw and degrees. Bright shards also breathe.
        float: { d: f(L.fd + noise(s * 53 + 12) * 4) * 1000, at: -f(noise(s * 59 + 13) * 10) * 1000, amp: f(L.amp * (0.8 + noise(s * 61 + 4) * 0.4)) },
        sway: {
          d: f(L.fs + noise(s * 67 + 14) * 5) * 1000,
          at: -f(noise(s * 71 + 15) * 12) * 1000,
          ax: f(L.ax * (0.8 + noise(s * 73 + 5) * 0.4)),
          rot: f(L.rot * Math.min(1, 30 / span) * (noise(s * 79 + 6) < 0.5 ? -1 : 1)),
        },
        pulse: (tone === 'bright' || tone === 'work') && { d: f(5 + noise(s * 83 + 7) * 4) * 1000, at: -f(noise(s * 89 + 8) * 6) * 1000, lo: f(L.op * 0.62), hi: L.op },
      };
    },
  );
}

// The idle motion runs on the Web Animations API rather than as infinite CSS animations: React listens for animationiteration on
// its root, and with any such listener Chrome wakes the main thread at every iteration to restyle every animated element. These
// fire no events, so they stay on the compositor.
const loop = ({ d, at }) => ({ duration: d, delay: at, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
const idle = (el, s) => [
  el.animate({ translate: [`0 ${-s.float.amp}cqh`, `0 ${s.float.amp}cqh`] }, loop(s.float)),
  el.animate({ transform: [`translateX(${-s.sway.ax}cqw) rotate(${-s.sway.rot}deg)`, `translateX(${s.sway.ax}cqw) rotate(${s.sway.rot}deg)`] }, loop(s.sway)),
  ...(s.pulse ? [el.animate({ opacity: [s.pulse.lo, s.pulse.hi] }, loop(s.pulse))] : []),
];
const still = () => typeof matchMedia !== 'function' || matchMedia('(prefers-reduced-motion: reduce)').matches;

// On a change of night this night's crystals slide far out, then the next night's slide in from the other side. Each set keeps
// its own night's gel while the room cross-fades, so the shards are not repainted on every frame of the change. A change while
// they are still coming in (a page that learns its night after it opens) just swaps them.
export function Crystals({ night = 0, count = 14, reach = 0.62 }) {
  const [shown, setShown] = useState(night);
  const [phase, setPhase] = useState(null);
  const [dir, setDir] = useState(1);
  const was = useRef(night);
  const room = useRef(null);
  const born = useRef(0);
  const shards = useMemo(() => shardsFor(shown, count, reach), [shown, count, reach]);
  useEffect(() => {
    born.current = performance.now();
  }, []);
  useEffect(() => {
    if (night === was.current) return;
    setDir(night > was.current ? 1 : -1);
    was.current = night;
    if (performance.now() - born.current < ENTRANCE) return setShown(night);
    setPhase('out');
    const t = setTimeout(() => {
      setShown(night);
      setPhase('in');
    }, 560);
    return () => clearTimeout(t);
  }, [night]);
  useEffect(() => {
    const boxes = room.current.children;
    if (still() || !boxes[0]?.firstChild.animate) return;
    const runs = shards.flatMap((s, i) => idle(boxes[i].firstChild, s));
    return () => runs.forEach((a) => a.cancel());
  }, [shards]);

  return (
    <div ref={room} className={`crystals gel-${NIGHT_KEYS[shown] ?? 'thu'}`} aria-hidden="true">
      {shards.map((s, i) => (
        <div key={i} className={`shard${phase ? ` pan-${phase}` : ''}`} style={{ ...s.box, '--dir': dir }}>
          <div className="shard-move" style={s.move}>
            <div className="shard-cut" style={s.cut} />
          </div>
        </div>
      ))}
    </div>
  );
}

const ENTRANCE = 1300; // .shard's shardIn, stage.css
const CUE = 900; // --cue, styles.css

// The room's light for each night on stage, in that night's gel. On a change of night the new light fades in over the old one,
// which goes once the fade is done. Only opacity moves, so no light is repainted while the gel changes.
function useLights(gel) {
  const [lights, setLights] = useState(() => [{ gel, id: 0, first: true }]);
  useEffect(() => {
    setLights((l) => (l.at(-1).gel === gel ? l : [...l, { gel, id: l.at(-1).id + 1 }]));
    const t = setTimeout(() => setLights((l) => (l.length > 1 ? l.slice(-1) : l)), CUE);
    return () => clearTimeout(t);
  }, [gel]);
  return lights;
}

// The room: gel wash, crystals, beam, haze, and on first view the house lights going down. gel: 'thu' | 'fri' | 'sat' | 'sun'.
// The wash sits under everything in the room; the beam and haze over the crystals. A newer light fades in; on the beam and
// haze, which are see-through, the older one fades out at the same time.
export function Room({ gel, count, reach, house = true, haze = true, beam = '', className = '', children, ...rest }) {
  const lights = useLights(gel);
  const fade = (l, i) => `gel-${l.gel}${l.first ? ' first' : ''}${i < lights.length - 1 ? ' fade-out' : l.first ? '' : ' fade-in'}`;
  return (
    <section className={`room ${className}`} {...rest}>
      {lights.map((l) => (
        <div key={l.id} className={`light gel-${l.gel}${l.first ? '' : ' fade-in'}`} aria-hidden="true" />
      ))}
      <Crystals night={Math.max(0, NIGHT_KEYS.indexOf(gel))} count={count} reach={reach} />
      {lights.map((l, i) => (
        <div key={l.id} className={`glow ${fade(l, i)}`} aria-hidden="true">
          <div className={`beam ${beam}`} />
          {haze && <div className="haze" />}
        </div>
      ))}
      {house && <div className="house" />}
      {children}
    </section>
  );
}

// A name set letter by letter. delay: ms before the first letter. Screen readers get the name whole.
export function Letters({ text, delay = 0, step = 32 }) {
  let n = 0;
  return (
    <>
      <span className="vh">{text}</span>
      <span aria-hidden="true">
        {text.split(' ').map((w, i) => (
          <span key={i} className="word" style={{ marginRight: '.2em' }}>
            {[...w].map((c, j) => (
              <span key={j} className="letter" style={{ '--d': delay + (n++) * step }}>
                {c}
              </span>
            ))}
          </span>
        ))}
      </span>
    </>
  );
}

// Matches a media query, live. For layouts that change structure, not just style, between phone and desk.
export function useMedia(query) {
  const [on, setOn] = useState(() => typeof matchMedia === 'function' && matchMedia(query).matches);
  useEffect(() => {
    const m = matchMedia(query);
    const fn = () => setOn(m.matches);
    fn();
    m.addEventListener('change', fn);
    return () => m.removeEventListener('change', fn);
  }, [query]);
  return on;
}
