import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const out = fileURLToPath(new URL('../backend/public/app/', import.meta.url));

// Precache only what /p/:id needs to reload offline: the entry and the pass chunk with their imports and CSS, plus the fonts.
// A guest's phone never downloads admin or door code. index.html goes in under /p, a Laravel URL, so the cached page
// keeps the CSP header the server puts on every page (the static /app/index.html is served without it).
function passShell(entries) {
  const m = JSON.parse(readFileSync(`${out}.vite/manifest.json`, 'utf8'));
  const keep = new Set();
  const walk = (k) => {
    if (keep.has(m[k].file)) return;
    keep.add(m[k].file);
    m[k].css?.forEach((f) => keep.add(f));
    m[k].imports?.forEach(walk);
  };
  walk(Object.keys(m).find((k) => m[k].isEntry));
  walk('src/Pass.jsx');
  const manifest = entries
    .filter((e) => !e.url.startsWith('assets/') || keep.has(e.url))
    .map((e) => ({ ...e, url: e.url === 'index.html' ? '/p' : `/app/${e.url}` }));
  return { manifest };
}

// No @vitejs/plugin-react (not in the PRD package table): Vite's own Oxc transform handles JSX. Dev reloads fully.
export default defineConfig(({ command }) => ({
  // Laravel serves the build from /app/; dev stays on / so /admin, /door and /p/:id resolve on the dev server.
  base: command === 'build' ? '/app/' : '/',
  oxc: { jsx: { runtime: 'automatic' } },
  plugins: [
    VitePWA({
      // Pass.jsx registers the worker itself: nothing is injected into index.html, so no inline script meets the CSP.
      injectRegister: false,
      manifest: false, // public/manifest.webmanifest, linked from index.html
      // sw.js at the site root (backend/public/sw.js): its scope covers /p/:id with no Service-Worker-Allowed header.
      outDir: '../backend/public',
      workbox: {
        globDirectory: out,
        globPatterns: ['index.html', 'assets/*.{js,css}', 'fonts/*.woff2'],
        manifestTransforms: [passShell],
        // /p/* opens from the cached page with or without signal; the pass data comes from IndexedDB, never from here.
        navigateFallback: '/p',
        navigateFallbackAllowlist: [/^\/p\//],
        inlineWorkboxRuntime: true, // one file at the root, no workbox-*.js beside it
      },
    }),
  ],
  build: {
    outDir: '../backend/public/app',
    emptyOutDir: true,
    manifest: true, // read by src/regions.test.js and passShell above
    rolldownOptions: {
      // "use client" in react-router and react-query only matters for server components; this is a browser-only SPA.
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('"use client"')) return;
        warn(warning);
      },
    },
  },
  server: {
    // Open http://localhost:5173, not 127.0.0.1: Sanctum only treats localhost:5173 as first-party.
    proxy: { '/api': 'http://localhost:8000', '/sanctum': 'http://localhost:8000' },
  },
}));
