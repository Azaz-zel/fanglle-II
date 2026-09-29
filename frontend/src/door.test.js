// S6 door logic against PRD Testing 3.4. The PHP to WebCrypto check over 200 signatures (T-P1) runs in the backend
// suite (QrCrossLanguageTest); here WebCrypto signs, which gives the same raw r‖s shape the server sends.
import { createHash } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import {
  applyResults, checkIn, codeHash, guestLine, importKey, judge, keyAction, kindLabel, mergePasses, nightOf, normalizeCode,
  pendingBy, readQr, search, sendQueue, shiftDate, syncLine, tally, typedCode, within, wrongCode, wrongNight,
} from './door.js';
import { offsetOf, wallClock } from './night.js';

const b64url = (buf) => Buffer.from(buf).toString('base64url');

async function signer() {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const { kty, crv, x, y } = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const sign = async (p, e, k) => {
    const payload = b64url(JSON.stringify({ p, e, k }));
    const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, pair.privateKey, new TextEncoder().encode(payload));
    return `FNG2.${payload}.${b64url(sig)}`;
  };
  return { key: await importKey({ kty, crv, x, y }), sign };
}

const EVENT = { date: '2026-09-24', name: 'Descent', guestlist_cutoff: '23:00', close_time: '04:00' };
const pass = (o) => ({ public_id: 'P1', kind: 'group', holder_name: 'Ayu Pratiwi', people: 4, inside_count: 0, phone_last4: '1234', table_code: null, revoked: false, ...o });

describe('QR signature (F10)', () => {
  test('a signed QR reads back its payload', async () => {
    const { key, sign } = await signer();
    expect(await readQr(await sign('01K5AB', '2026-09-24', 'table'), key)).toEqual({ p: '01K5AB', e: '2026-09-24', k: 'table' });
  });

  test('T-P2: one payload character changed fails, and so does anything not FNG2', async () => {
    const { key, sign } = await signer();
    const qr = await sign('01K5AB', '2026-09-24', 'group');
    const [pre, payload, sig] = qr.split('.');
    const tampered = `${pre}.${payload.slice(0, 5)}${payload[5] === 'A' ? 'B' : 'A'}${payload.slice(6)}.${sig}`;
    expect(await readQr(tampered, key)).toBeNull();
    expect(await readQr(`FNG1.${payload}.${sig}`, key)).toBeNull();
    expect(await readQr('XQZ-0000-FAKE', key)).toBeNull();
    expect(await readQr(`${qr}.x`, key)).toBeNull();
    expect(await readQr('FNG2.@@@.###', key)).toBeNull();
  });

  test('a QR signed by another key fails', async () => {
    const a = await signer();
    const b = await signer();
    expect(await readQr(await b.sign('01K5AB', '2026-09-24', 'group'), a.key)).toBeNull();
  });
});

test('T-P3: a QR for another night says which night', () => {
  expect(wrongNight('2026-09-25', { '2026-09-25': 'Second Wave' })).toEqual({
    tone: 'warn', title: 'Wrong night', sub: 'This QR is for Fri 25 Sep, Second Wave.',
  });
  expect(wrongNight('2026-09-17', {}).sub).toBe('This QR is for Thu 17 Sep.');
});

describe('entry code (F17)', () => {
  test('T-P4: every way of typing the same code gives the same hash, which is SHA-256 of the normalized code', async () => {
    const sha = createHash('sha256').update('K7QM4TXP').digest('hex');
    for (const typed of ['k7qm 4txp', 'K7QM-4TXP', 'K7QM4TXP', ' K7QM - 4TXP ']) expect(await codeHash(typed)).toBe(sha);
    // O for 0, I and L for 1
    expect(normalizeCode('K7OM-4TXL')).toBe('K70M4TX1');
    expect(await codeHash('k7om-4txi')).toBe(await codeHash('K70M-4TX1'));
  });

  test('the field upper-cases and puts the hyphen after four characters', () => {
    expect(typedCode('k7q')).toBe('K7Q');
    expect(typedCode('k7qm')).toBe('K7QM');
    expect(typedCode('k7qm4')).toBe('K7QM-4');
    expect(typedCode('K7QM-')).toBe('K7QM');
    expect(typedCode('k7qm 4txp9')).toBe('K7QM-4TXP');
  });

  test('T-P6: the tenth wrong code inside a minute locks the field for 60 seconds; older ones fall away', () => {
    let s = { times: [], lockedUntil: 0 };
    for (let i = 0; i < 9; i++) s = wrongCode(s.times, 1000 + i * 1000);
    expect(s.lockedUntil).toBe(0);
    s = wrongCode(s.times, 20_000);
    expect(s.lockedUntil).toBe(80_000); // the 11th can't be typed until then

    let t = { times: [] };
    for (let i = 0; i < 9; i++) t = wrongCode(t.times, i * 1000);
    t = wrongCode(t.times, 70_000); // the first nine are over a minute old
    expect(t).toEqual({ times: [70_000], lockedUntil: 0 });
  });
});

describe('result screen', () => {
  const at = (now, o = {}) => judge({ item: pass(o), kind: o.kind, publicId: 'P1', inside: o.inside_count ?? 0, event: EVENT, now });

  test('green for a group with people still to come, the table code for a table', () => {
    expect(at('22:31')).toMatchObject({ tone: 'ok', title: 'Welcome in' });
    expect(at('02:00', { kind: 'table', table_code: 'B5' })).toMatchObject({ tone: 'ok', title: 'Table B5' });
  });

  test('cancelled beats everything; used up beats the cutoff', () => {
    expect(at('23:30', { revoked: true, inside_count: 4 })).toMatchObject({ tone: 'bad', title: 'Cancelled' });
    expect(at('23:30', { inside_count: 4 })).toMatchObject({
      tone: 'bad', title: 'Already used', sub: "Ayu Pratiwi: all 4 checked in. This QR can't enter again.",
    });
    expect(at('22:00', { people: 1, inside_count: 1 }).sub).toBe("Ayu Pratiwi: already checked in. This QR can't enter again.");
  });

  test('guestlist past the cutoff is amber with the manager override; a table is not', () => {
    expect(at('23:12')).toEqual(expect.objectContaining({
      tone: 'warn', title: 'Guestlist closed at 11 pm', sub: 'Ayu Pratiwi, group of 4. Free entry ended at 11 pm.', override: true,
    }));
    expect(at('23:12', { kind: 'table', table_code: 'B2' }).tone).toBe('ok');
  });

  test('F2: a 00:30 cutoff is still open at 23:45 and 00:15, closed at 00:45', () => {
    const late = (now) => judge({ item: pass(), inside: 0, event: { ...EVENT, guestlist_cutoff: '00:30' }, now }).tone;
    expect([late('23:45'), late('00:15'), late('00:45')]).toEqual(['ok', 'ok', 'warn']);
  });

  test('a signed QR missing from the saved list is let in and asks how many', () => {
    const r = judge({ item: undefined, kind: 'group', publicId: 'NEW', inside: 0, event: EVENT, now: '22:00' });
    expect(r).toMatchObject({ tone: 'ok', title: 'Welcome in', guest: { public_id: 'NEW', people: null, holder_name: null } });
  });
});

describe('T-P9 handheld scanner', () => {
  const QR = 'FNG2.eyJwIjoiUDEifQ.c2ln';
  const type = (text, gap, result, start = 1000) => {
    let s = { buf: '', at: 0 };
    let out;
    [...text, 'Enter'].forEach((k, i) => (out = keyAction(s, k, start + i * gap, result)) && (s = out.state));
    return out;
  };
  const green = { tone: 'ok' };

  test('fast typing then Enter is a scan', () => {
    expect(type(QR, 8, null)).toMatchObject({ act: 'scan', text: QR });
  });

  test('keys 200 ms apart are a person, not a scan', () => {
    expect(type(QR, 200, null).act).toBeNull();
    expect(type(QR, 200, { tone: 'bad' }).act).toBe('close');
  });

  test('Enter alone on a green result lets them in', () => {
    expect(keyAction({ buf: '', at: 0 }, 'Enter', 5000, green).act).toBe('letIn');
  });

  test('a new scan on a waiting green result is refused, never a let-in', () => {
    const out = type(QR, 8, green);
    expect(out.act).toBe('blocked');
    expect(out.act).not.toBe('letIn');
  });

  test('a digit on a green result sets how many; Escape cancels', () => {
    expect(keyAction({ buf: '', at: 0 }, '3', 5000, green)).toMatchObject({ act: 'count', n: 3 });
    expect(keyAction({ buf: '', at: 0 }, 'Escape', 5000, green).act).toBe('close');
  });

  test('a scan on a red or amber result simply replaces it', () => {
    expect(type(QR, 8, { tone: 'warn' }).act).toBe('scan');
  });
});

describe('check-in queue (F12)', () => {
  // The server as the contract has it: idempotent per client_uuid, inside_count may pass people (conflict).
  function server(passes) {
    const seen = new Map();
    const inside = Object.fromEntries(passes.map((p) => [p.public_id, 0]));
    const people = Object.fromEntries(passes.map((p) => [p.public_id, p.people]));
    const post = async (items) => ({
      results: items.map((c) => {
        if (!seen.has(c.client_uuid)) {
          inside[c.public_id] += c.count;
          seen.set(c.client_uuid, { ...c, conflict: inside[c.public_id] > people[c.public_id] });
        }
        return { client_uuid: c.client_uuid, inside_count: inside[c.public_id], conflict: seen.get(c.client_uuid).conflict };
      }),
    });
    return { post, seen, inside };
  }

  test('M5 without signal: two scans and one typed code, a failed send, then signal: three check-ins, no duplicates', async () => {
    const list = { A: pass({ public_id: 'A', people: 2 }), B: pass({ public_id: 'B', people: 1, kind: 'personal' }), C: pass({ public_id: 'C', people: 4 }) };
    const srv = server(Object.values(list));
    let queue = [checkIn('A', 2, 'scan'), checkIn('B', 1, 'scan'), checkIn('C', 3, 'code')];
    const uuids = queue.map((c) => c.client_uuid);

    const offline = async () => {
      throw new TypeError('Failed to fetch');
    };
    await expect(sendQueue(queue, offline)).rejects.toThrow('Failed to fetch');
    expect(queue).toHaveLength(3); // nothing lost

    // Signal back, but the answer is lost on the way: the server counted, the device didn't hear.
    await sendQueue(queue, srv.post);
    const results = await sendQueue(queue, srv.post); // the retry, same uuids
    const after = applyResults(list, queue, results);
    queue = after.queue;

    expect(queue).toEqual([]);
    expect([...srv.seen.keys()]).toEqual(uuids);
    expect([...srv.seen.values()].map((c) => c.method)).toEqual(['scan', 'scan', 'code']);
    expect(srv.inside).toEqual({ A: 2, B: 1, C: 3 });
    expect(after.passes.C.inside_count).toBe(3);
  });

  test('T-P7: the same client_uuid three times counts once', async () => {
    const srv = server([pass({ public_id: 'A', people: 4 })]);
    const c = checkIn('A', 2, 'scan');
    for (let i = 0; i < 3; i++) await sendQueue([c], srv.post);
    expect(srv.inside.A).toBe(2);
  });

  test('unsynced check-ins count on this device until the server answers', () => {
    const list = { A: pass({ public_id: 'A', people: 4, inside_count: 1 }) };
    const queue = [checkIn('A', 2, 'scan')];
    expect(pendingBy(queue)).toEqual({ A: 2 });
    expect(tally(list, pendingBy(queue))).toMatchObject({ inside: 3, gl: 3, glOf: 4 });
  });

  test('a lone check-in answered 409 (cancelled since the last sync) leaves the queue and marks the pass', async () => {
    const list = { A: pass({ public_id: 'A' }) };
    const queue = [checkIn('A', 1, 'scan')];
    const refused = async () => {
      throw Object.assign(new Error("This pass was cancelled. Don't let them in."), { status: 409 });
    };
    const out = applyResults(list, queue, await sendQueue(queue, refused));
    expect(out.queue).toEqual([]);
    expect(out.passes.A.revoked).toBe(true);
    expect(out.revoked.map((p) => p.public_id)).toEqual(['A']);
  });

  test('other errors keep the queue for the next try', async () => {
    const queue = [checkIn('A', 1, 'scan')];
    const down = async () => {
      throw Object.assign(new Error('Server error'), { status: 500 });
    };
    await expect(sendQueue(queue, down)).rejects.toMatchObject({ status: 500 });
  });

  test('inside_count never goes back when an older manifest read lands after a check-in answer', () => {
    const list = { A: pass({ public_id: 'A', inside_count: 3 }) };
    expect(mergePasses(list, [pass({ public_id: 'A', inside_count: 1, revoked: true })]).A).toMatchObject({ inside_count: 3, revoked: true });
  });
});

test('header numbers: arrived of signed up, tables arrived of tables booked, cancelled passes out of the totals', () => {
  const list = {
    a: pass({ public_id: 'a', people: 4, inside_count: 2 }),
    b: pass({ public_id: 'b', kind: 'personal', people: 1, inside_count: 0, revoked: true }),
    t: pass({ public_id: 't', kind: 'table', people: 7, inside_count: 3, table_code: 'B5' }),
    u: pass({ public_id: 'u', kind: 'table', people: 6, inside_count: 0, table_code: 'B1' }),
  };
  expect(tally(list, {})).toEqual({ inside: 5, gl: 2, glOf: 4, tb: 1, tbOf: 2 });
});

test('search by name or last 4 phone digits, two characters at least (F14: only last4 exists on the device)', () => {
  const list = { a: pass({ public_id: 'a' }), b: pass({ public_id: 'b', holder_name: 'Kadek Surya', phone_last4: '8821' }) };
  expect(search(list, 'a')).toEqual([]);
  expect(search(list, 'kad').map((p) => p.public_id)).toEqual(['b']);
  expect(search(list, '882').map((p) => p.public_id)).toEqual(['b']);
});

test("the club's wall clock comes from the server offset, not the device zone", () => {
  expect(offsetOf('2026-09-24T21:58:03+08:00')).toBe(480);
  expect(wallClock(Date.parse('2026-09-24T14:31:00Z'), 480)).toBe('22:31');
  expect(wallClock(Date.parse('2026-09-24T16:30:00Z'), 480)).toBe('00:30');
});

test('F2: which night a moment belongs to; before noon is still the night before', () => {
  const at = (iso) => nightOf(Date.parse(iso), 480);
  expect(at('2026-09-24T22:00:00+08:00')).toBe('2026-09-24');
  expect(at('2026-09-25T01:30:00+08:00')).toBe('2026-09-24');
  expect(at('2026-09-25T11:59:00+08:00')).toBe('2026-09-24');
  expect(at('2026-09-25T12:00:00+08:00')).toBe('2026-09-25');
  expect(shiftDate('2026-09-24', -6)).toBe('2026-09-18');
  expect(shiftDate('2026-09-28', 5)).toBe('2026-10-03');
});

test('a call that never answers counts as no signal, not as a server error', async () => {
  const never = new Promise(() => {});
  const e = await within(never, 10).catch((x) => x);
  expect(e).toBeInstanceOf(TypeError);
  expect(e.status).toBeUndefined();
  expect(await within(Promise.resolve('ok'), 10)).toBe('ok');
});

test('a personal QR newer than the saved list is one person; a second scan of it is already used', () => {
  const r = (inside) => judge({ item: undefined, kind: 'personal', publicId: 'NEW', inside, event: EVENT, now: '22:00' });
  expect(r(0)).toMatchObject({ tone: 'ok', guest: { people: 1 } });
  expect(r(1)).toMatchObject({ tone: 'bad', title: 'Already used' });
});

test('a cancelled pass counts as inside but not as arrived on the guestlist or tables', () => {
  const list = {
    a: pass({ public_id: 'a', people: 3, inside_count: 3, revoked: true }),
    t: pass({ public_id: 't', kind: 'table', people: 6, inside_count: 2, table_code: 'B1', revoked: true }),
  };
  expect(tally(list, {})).toEqual({ inside: 5, gl: 0, glOf: 0, tb: 0, tbOf: 0 });
});

test('the line under a name: tables and groups say who is in, a personal QR says what it is', () => {
  expect(guestLine({ ...pass({ kind: 'table', people: 7, table_code: 'B5' }), inside: 3 })).toBe('Table for 7 · 3 already in');
  expect(guestLine({ ...pass(), inside: 1 })).toBe('Group of 4 · 1 already in');
  expect(guestLine({ ...pass({ kind: 'personal', people: 1 }), inside: 0 })).toBe('Guestlist · personal');
  expect(guestLine({ holder_name: null, kind: 'group', people: null, inside: 0 })).toMatch(/after this device last synced/);
  expect(kindLabel(pass({ kind: 'table', table_code: 'B5' }))).toBe('Table B5');
  expect(kindLabel(pass())).toBe('Group of 4');
});

test('the sync bar, from the mockup', () => {
  const base = { online: true, trouble: '', waiting: 0, savedAt: '21:58' };
  expect(syncLine(base)).toBe('Online. All check-ins synced.');
  expect(syncLine({ ...base, waiting: 2 })).toBe('Back online. Syncing check-ins...');
  expect(syncLine({ ...base, online: false, waiting: 1 })).toBe("Offline. Tonight's list saved at 21:58. 1 check-in waiting to sync.");
  expect(syncLine({ ...base, online: false, waiting: 3 })).toBe("Offline. Tonight's list saved at 21:58. 3 check-ins waiting to sync.");
  expect(syncLine({ ...base, waiting: 1, trouble: 'Server error.' })).toBe('1 check-in waiting to sync. Server error.');
});
