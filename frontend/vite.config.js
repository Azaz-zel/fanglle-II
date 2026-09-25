import { defineConfig } from 'vite';

// No @vitejs/plugin-react (not in the PRD package table): Vite's own Oxc transform handles JSX. Dev reloads fully.
export default defineConfig(({ command }) => ({
  // Laravel serves the build from /app/; dev stays on / so /admin, /door and /p/:id resolve on the dev server.
  base: command === 'build' ? '/app/' : '/',
  oxc: { jsx: { runtime: 'automatic' } },
  build: {
    outDir: '../backend/public/app',
    emptyOutDir: true,
    manifest: true, // read by src/regions.test.js
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
