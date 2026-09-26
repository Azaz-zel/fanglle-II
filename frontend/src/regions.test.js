// Proof for S1 "Lulus": opening /p/:id loads no admin or door code. Reads the build manifest, so run `npm run build` first.
import { readdirSync, readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const app = new URL('../../backend/public/app/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('.vite/manifest.json', app), 'utf8'));
const entry = Object.keys(manifest).find((k) => manifest[k].isEntry);

// Everything the browser fetches for a chunk: the chunk plus its static imports, recursively.
const graph = (keys, seen = new Set()) => {
  for (const k of keys) {
    if (seen.has(k)) continue;
    seen.add(k);
    graph(manifest[k].imports ?? [], seen);
  }
  return seen;
};

test('each region is its own lazily loaded chunk', () => {
  for (const region of ['src/Public.jsx', 'src/Pass.jsx', 'src/Login.jsx', 'src/Door.jsx', 'src/Admin.jsx']) {
    expect(manifest[region]?.isDynamicEntry, region).toBe(true);
    expect(manifest[entry].dynamicImports).toContain(region);
  }
});

test('/p/:id loads the entry and the pass chunk, and nothing from admin, door or login', () => {
  const loaded = graph([entry, 'src/Pass.jsx']);
  const names = [...loaded].map((k) => manifest[k].name);
  const files = [...loaded].map((k) => manifest[k].file);
  console.log('/p/:id loads:', files.join(', '));

  // staff = the shared sign-in gate used only by Door and Admin
  for (const staffOnly of ['Admin', 'Door', 'Login', 'staff']) expect(names, staffOnly).not.toContain(staffOnly);
  for (const region of ['src/Admin.jsx', 'src/Door.jsx']) {
    expect(files).not.toContain(manifest[region].file);
    expect(graph([region]).size).toBeGreaterThan(1); // sanity: the graph walk sees their imports
  }
});

// qrcode and idb are bundled into the pass chunk; these strings come from inside each library.
const QRCODE = 'too big to be stored in a QR Code';
const IDB = 'upgradeneeded';
const text = (k) => readFileSync(new URL(manifest[k].file, app), 'utf8');

test('qrcode and idb load only with /p/:id, never with the entry or another region', () => {
  const pass = [...graph(['src/Pass.jsx'])].map(text).join('');
  expect(pass).toContain(QRCODE);
  expect(pass).toContain(IDB);
  for (const region of [entry, 'src/Public.jsx', 'src/Login.jsx', 'src/Door.jsx', 'src/Admin.jsx'])
    for (const k of graph([region])) {
      expect(text(k), manifest[k].file).not.toContain(QRCODE);
      expect(text(k), manifest[k].file).not.toContain(IDB);
    }
});

test('the service worker precaches the /p/:id shell and fonts, and no admin, door or login code', () => {
  const sw = readFileSync(new URL('../sw.js', app), 'utf8');
  const urls = [...sw.matchAll(/url:"([^"]+)"/g)].map((m) => m[1]).sort();
  const shell = [...graph([entry, 'src/Pass.jsx'])].flatMap((k) => [manifest[k].file, ...(manifest[k].css ?? [])]);
  const fonts = readdirSync(new URL('fonts/', app)).filter((f) => f.endsWith('.woff2')).map((f) => `/app/fonts/${f}`);
  expect(urls).toEqual(['/p', ...shell.map((f) => `/app/${f}`), ...fonts].sort());
  expect(sw.includes('allowlist:[/^\\/p\\//]')).toBe(true); // offline navigations to /p/* get the cached page
});
