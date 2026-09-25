// Proof for S1 "Lulus": opening /p/:id loads no admin or door code. Reads the build manifest, so run `npm run build` first.
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const manifest = JSON.parse(readFileSync(new URL('../../backend/public/app/.vite/manifest.json', import.meta.url), 'utf8'));
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
  for (const region of ['src/Public.jsx', 'src/Login.jsx', 'src/Door.jsx', 'src/Admin.jsx']) {
    expect(manifest[region]?.isDynamicEntry, region).toBe(true);
    expect(manifest[entry].dynamicImports).toContain(region);
  }
});

test('/p/:id loads the entry and the public chunk, and nothing from admin, door or login', () => {
  const loaded = graph([entry, 'src/Public.jsx']);
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
