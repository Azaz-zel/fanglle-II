// T-P1: verifies QR strings signed by PHP with the same WebCrypto calls a browser at the door makes.
// Usage: node verify-qr.mjs fixture.json   (fixture: { jwk, items: [{ qr }] })
// Prints { verified, failed, results: [bool...] } as JSON.
import { readFile } from 'node:fs/promises';

const fromB64url = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

const { jwk, items } = JSON.parse(await readFile(process.argv[2], 'utf8'));
const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);

const results = [];
for (const { qr } of items) {
  const [prefix, payload, sig] = qr.split('.');
  const ok = prefix === 'FNG2' && await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' }, key, fromB64url(sig), new TextEncoder().encode(payload),
  );
  results.push(ok);
}

const verified = results.filter(Boolean).length;
console.log(JSON.stringify({ verified, failed: results.length - verified, results }));
