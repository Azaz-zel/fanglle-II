import { useEffect, useRef, useState } from 'react';
import fang from './assets/fang.jpg';
import './stage.css';

// Sorot (DESIGN.md): one glass fang in the dark, tinted in the night's gel, and a lamp that follows you. The object is the same
// grey photograph every night; the gel and its pose (stage.css, [data-night]) are what change.

// The lamp: a dark sheet with a soft hole, moved on transform only. It glides toward a mouse like a lamp on a slow arm, jumps to
// a tap, and rests on the crown of the fang. at: the rest point as a share of the room's width and height.
function useLamp(at) {
  const box = useRef(null);
  const shade = useRef(null);
  const [ax, ay] = at;
  useEffect(() => {
    const el = box.current;
    const sh = shade.current;
    if (!el || !sh) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const L = { x: 0, y: 0, tx: 0, ty: 0, w: el.offsetWidth, h: el.offsetHeight };
    let raf = 0;
    const draw = () => (sh.style.transform = `translate3d(${L.x - L.w / 2}px, ${L.y - L.h / 2}px, 0)`);
    const tick = () => {
      const k = reduce ? 1 : 0.11;
      L.x += (L.tx - L.x) * k;
      L.y += (L.ty - L.y) * k;
      draw();
      raf = Math.abs(L.tx - L.x) + Math.abs(L.ty - L.y) > 0.4 ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => (raf ||= requestAnimationFrame(tick));
    const home = (snap) => {
      L.tx = L.w * ax;
      L.ty = L.h * ay;
      if (!snap) return kick();
      L.x = L.tx;
      L.y = L.ty;
      draw();
    };
    const to = (e) => {
      const r = el.getBoundingClientRect();
      L.tx = e.clientX - r.left;
      L.ty = e.clientY - r.top;
      kick();
    };
    const move = (e) => e.pointerType === 'mouse' && !reduce && to(e);
    const down = (e) => e.pointerType !== 'mouse' && !reduce && to(e);
    const leave = () => home(false);
    const ro = new ResizeObserver(() => {
      L.w = el.offsetWidth;
      L.h = el.offsetHeight;
      home(true);
    });
    ro.observe(el);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointerleave', leave);
    };
  }, [ax, ay]);
  return { box, shade };
}

// The object in its light: the fang, the gel tint over it, and the floor fading it into the page. out: dipped to black while the
// night changes. pose: which framing of the fang (stage.css). Decoration only.
export const Lit = ({ out, pose = 'hero', shade, className = '', children }) => (
  <div className={`lit ${className}`} aria-hidden="true">
    <div className={`dip${out ? ' out' : ''}`}>
      <img className={`obj ${pose}`} src={fang} alt="" decoding="async" />
    </div>
    <div className="tint" />
    {shade !== undefined && <div className="shade" ref={shade} />}
    <div className="floor" />
    {children}
  </div>
);

// A room lit by one night's gel, with the lamp. gel: 'thu' | 'fri' | 'sat' | 'sun'. at: where the lamp rests.
export function Room({ gel, out, pose, at = [0.52, 0.24], lamp = true, className = '', children, ...rest }) {
  const { box, shade } = useLamp(at);
  return (
    <section ref={box} className={`room gel-${gel} ${className}`} data-night={gel} {...rest}>
      <Lit out={out} pose={pose} shade={lamp ? shade : undefined} />
      {children}
    </section>
  );
}

// The pointer dot: follows a mouse a little behind, and stands up tall over anything you can press. Hidden on touch and for
// reduced motion (stage.css).
export function Dot() {
  const dot = useRef(null);
  useEffect(() => {
    const el = dot.current;
    if (!el || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const L = { x: -100, y: -100, tx: -100, ty: -100 };
    let raf = 0;
    const tick = () => {
      L.x += (L.tx - L.x) * 0.24;
      L.y += (L.ty - L.y) * 0.24;
      el.style.transform = `translate3d(${L.x}px, ${L.y}px, 0)`;
      raf = Math.abs(L.tx - L.x) + Math.abs(L.ty - L.y) > 0.4 ? requestAnimationFrame(tick) : 0;
    };
    const move = (e) => {
      if (e.pointerType !== 'mouse') return;
      L.tx = e.clientX;
      L.ty = e.clientY;
      el.classList.toggle('tall', !!e.target.closest?.('a,button,[role="tab"],label,summary'));
      raf ||= requestAnimationFrame(tick);
    };
    addEventListener('pointermove', move, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', move);
    };
  }, []);
  return <div ref={dot} className="dot" aria-hidden="true" />;
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
