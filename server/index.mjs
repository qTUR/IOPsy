// IOPsy — خادم الغرف: كود متغيّر لكل جلسة، حساب أدمن واحد، أدوار، مزامنة، صلاحيات الوسائط، العارض.
// كل الصلاحيات تُتحقَّق هنا في الخادم فقط. لا حسابات للمشاركين ولا قاعدة بيانات: كل شيء في الذاكرة.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { startLiveKit, livekitRunning, makeToken, updatePerms, muteSource, kickFromLK, closeLKRoom, proxyHttp, proxyUpgrade } from './livekit.mjs';
import { newGames, snapshot as gamesSnapshot, handleSiga, handleHs, handleRace, playerGone, stopTimers, movementLocked } from './games.mjs';
import { handleUpload, fetchPdfFromLink, serveFile, dropRoomFiles, fileExists } from './files.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT || 3002);
const MAX_PLAYERS = 20;
const RESUME_GRACE_MS = 25_000;
const OWNER_GRACE_MS = 10 * 60_000;
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const BOUND = 52;
const MEDIA = ['mic', 'cam', 'screen'];
// عند نشر الواجهة على نطاق آخر (Cloudflare Pages): ALLOWED_ORIGIN=https://iopsy.pages.dev (يمكن فصل عدة نطاقات بفاصلة)
const ORIGINS = (process.env.ALLOWED_ORIGIN || '').split(',').map((x) => x.trim()).filter(Boolean);
const originOk = (o) => !ORIGINS.length || !o || ORIGINS.includes(o) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);

// ---------- كلمة سر الأدمن (مُشفّرة، لا تظهر في كود الواجهة) ----------
const ADMIN_FILE = path.join(__dirname, 'admin.json');
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');
function loadAdmin() {
  if (process.env.ADMIN_PASSWORD) { const salt = crypto.randomBytes(16).toString('hex'); return { salt, hash: hashPw(process.env.ADMIN_PASSWORD, salt) }; }
  if (fs.existsSync(ADMIN_FILE)) return JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
  const pw = crypto.randomBytes(9).toString('base64url');
  const salt = crypto.randomBytes(16).toString('hex');
  const rec = { salt, hash: hashPw(pw, salt) };
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(rec));
  console.log('\n==================================================');
  console.log(' أول تشغيل: تم إنشاء كلمة سر الأدمن (تظهر مرة واحدة فقط):');
  console.log('   ' + pw);
  console.log(' لتغييرها: npm run admin:setpass -- <كلمة-السر-الجديدة>');
  console.log('==================================================\n');
  return rec;
}
const admin = loadAdmin();
function checkPassword(pw) {
  const a = Buffer.from(hashPw(String(pw || ''), admin.salt), 'hex'), b = Buffer.from(admin.hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---------- تحديد المعدّل ----------
const buckets = new Map();
function hit(key, limit, windowMs) {
  const now = Date.now(); let b = buckets.get(key);
  if (!b || b.reset < now) { b = { n: 0, reset: now + windowMs }; buckets.set(key, b); }
  b.n++; return b.n <= limit;
}
setInterval(() => { const now = Date.now(); for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k); }, 60_000).unref();

// ---------- الحالة ----------
/** @type {Map<string, any>} */ const rooms = new Map();
/** @type {Map<string, any>} */ const byToken = new Map();
let nextId = 1;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const cleanName = (s) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 16) || 'زائر';
const cleanLook = (l = {}) => {
  const n = (v, max) => clamp(Number.isInteger(v) ? v : 0, 0, max - 1);
  const g = l.g === 'f' ? 'f' : 'm';
  return { g, c: n(l.c, g === 'm' ? 6 : 4), h: n(l.h, g === 'm' ? 6 : 2), s: n(l.s, 5), b: n(l.b, 5), bag: n(l.bag, 3), hr: n(l.hr, 3), o: n(l.o, 4), gl: n(l.gl, 3), w: n(l.w, 2), sc: n(l.sc, 4), sh: n(l.sh, 3) };
};
function newCode() {
  for (let i = 0; i < 50; i++) {
    let c = ''; for (let k = 0; k < 6; k++) c += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
    if (!rooms.has(c)) return c;
  }
  throw new Error('code space exhausted');
}
const pub = (p) => ({ id: p.id, name: p.name, look: p.look, role: p.role, x: p.x, z: p.z, ry: p.ry, mv: p.mv, sit: p.sit, on: !p.gone, perm: effPerm(null, p) });
const send = (ws, m) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); };
function toRoom(room, m, exceptId) { const s = JSON.stringify(m); for (const p of room.players.values()) if (!p.gone && p.id !== exceptId && p.ws?.readyState === 1) p.ws.send(s); }
const isStaff = (p) => p.role === 'owner' || p.role === 'mod';

// ----- الصلاحيات: p.perm (فردية) و room.gperm (عامة)، كل منها {mic,cam,screen} و*By = من قيّدها -----
const defaultPerm = (role) => ({ mic: true, cam: true, screen: role !== 'user' });
let roomForEff = null;
function effPerm(room, p) {
  const r = room || roomForEff || rooms.get(p.room);
  if (p.role === 'owner') return { mic: true, cam: true, screen: true };
  const g = r?.gperm || { mic: true, cam: true, screen: true };
  return { mic: g.mic && p.perm.mic, cam: g.cam && p.perm.cam, screen: (p.role === 'mod' ? true : g.screen) && p.perm.screen };
}
async function applyPerms(room, p, notifyStopped = true) {
  const eff = effPerm(room, p);
  send(p.ws, { t: 'perm', id: p.id, perm: eff });
  toRoom(room, { t: 'perm', id: p.id, perm: eff }, p.id);
  await updatePerms(room.code, p.id, eff);
  if (notifyStopped) for (const w of MEDIA) if (!eff[w] && (await muteSource(room.code, p.id, w))) send(p.ws, { t: 'forced', what: w });
}

function spawnPos() { const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 3; return { x: Math.cos(a) * r, z: 14 + Math.sin(a) * r * 0.6 }; }

function addPlayer(room, ws, name, look, role) {
  const id = String(nextId++), token = crypto.randomBytes(18).toString('base64url');
  const names = [...room.players.values()].map((p) => p.name);
  let nm = cleanName(name), k = 2; while (names.includes(nm)) nm = cleanName(name).slice(0, 13) + ' ' + k++;
  const sp = spawnPos();
  const p = { id, token, ws, name: nm, look: cleanLook(look), role, x: sp.x, z: sp.z, ry: Math.PI, mv: 0, sit: 0, room: room.code, lastChat: 0, gone: 0, dirty: true, perm: defaultPerm(role), permBy: {} };
  room.players.set(id, p); byToken.set(token, p); ws._p = p; return p;
}
function projStop(room) { room.proj = { mode: 'idle', pdf: null, page: 1, screenBy: null, video: null }; toRoom(room, { t: 'proj', proj: room.proj, now: Date.now() }); }
function removePlayer(room, p, reason) {
  room.players.delete(p.id); byToken.delete(p.token);
  playerGone(room, p.id, (m) => toRoom(room, m));
  toRoom(room, { t: 'left', id: p.id, reason });
  if (room.proj.mode === 'screen' && room.proj.screenBy === p.id) projStop(room);
  void kickFromLK(room.code, p.id);
}
function endRoom(room, why = 'ended') {
  toRoom(room, { t: 'ended', why });
  for (const p of room.players.values()) { byToken.delete(p.token); try { p.ws?.close(4000, why); } catch { /* */ } }
  stopTimers(room); rooms.delete(room.code); dropRoomFiles(room.code); void closeLKRoom(room.code);
}
async function welcome(room, p) {
  const lk = livekitRunning() ? { token: await makeToken(room.code, p, effPerm(room, p)) } : null;
  return { t: 'welcome', id: p.id, token: p.token, code: room.code, role: p.role, locked: room.locked, players: [...room.players.values()].map(pub), max: MAX_PLAYERS, gperm: room.gperm, proj: room.proj, lk, now: Date.now(), games: gamesSnapshot(room) };
}

// ---------- HTTP ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.mjs': 'text/javascript' };
const json = (res, code, obj) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
const ownerFromReq = (req) => { const p = byToken.get(String(req.headers['x-token'] || '')); return p && p.role === 'owner' && rooms.get(p.room) ? p : null; };
const readJson = (req, max = 4096) => new Promise((resolve, reject) => { let b = ''; req.on('data', (c) => { b += c; if (b.length > max) { reject(new Error('too_large')); req.destroy(); } }); req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch { reject(new Error('bad_json')); } }); });

const server = http.createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const origin = req.headers.origin;
  if (origin && ORIGINS.length && originOk(origin)) { res.setHeader('access-control-allow-origin', origin); res.setHeader('vary', 'origin'); res.setHeader('access-control-allow-headers', 'x-token, content-type'); res.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS'); }
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (url.startsWith('/lk/') || url === '/lk') return proxyHttp(req, res);
  if (url === '/api/health') return json(res, 200, { ok: true, livekit: livekitRunning(), rooms: rooms.size });
  if (url.startsWith('/api/file/')) {
    const [, , , code, fname] = url.split('/');
    const p = byToken.get(String(req.headers['x-token'] || new URL(req.url, 'http://x').searchParams.get('k') || ''));
    if (!p || p.room !== code || !fileExists(code, fname)) { res.writeHead(404); return res.end(); }
    return serveFile(req, res, code, fname);
  }
  if (url === '/api/upload' && req.method === 'POST') {
    const owner = ownerFromReq(req); if (!owner) return json(res, 403, { error: 'forbidden' });
    if (!hit('up:' + owner.id, 20, 60_000)) return json(res, 429, { error: 'rate' });
    try { const q = new URL(req.url, 'http://x').searchParams; return json(res, 200, await handleUpload(req, owner.room, q.get('kind'), q.get('name'))); }
    catch (e) { return json(res, 400, { error: e.message || 'failed' }); }
  }
  if (url === '/api/pdf-link' && req.method === 'POST') {
    const owner = ownerFromReq(req); if (!owner) return json(res, 403, { error: 'forbidden' });
    if (!hit('lnk:' + owner.id, 12, 60_000)) return json(res, 429, { error: 'rate' });
    try { const b = await readJson(req); return json(res, 200, await fetchPdfFromLink(owner.room, b.url)); }
    catch (e) { return json(res, 400, { error: e.message || 'failed' }); }
  }
  if (!fs.existsSync(DIST)) { res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('IOPsy server — شغّل npm run build لخدمة الواجهة، أو npm run dev للتطوير'); }
  let u = url === '/' ? '/index.html' : url;
  const file = path.normalize(path.join(DIST, u));
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'public, max-age=3600' });
  fs.createReadStream(file).pipe(res);
});

// ---------- WebSocket ----------
const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
server.on('upgrade', (req, socket, head) => {
  const p = (req.url || '').split('?')[0];
  if (!originOk(req.headers.origin)) { socket.destroy(); return; }
  if (p === '/ws') wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  else if (p.startsWith('/lk/') || p === '/lk') proxyUpgrade(req, socket, head);
  else socket.destroy();
});
const ipOf = (req) => (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
const newRoom = (code) => ({ code, locked: false, players: new Map(), created: Date.now(), ownerTimer: null, gperm: { mic: true, cam: true, screen: true }, gBy: {}, proj: { mode: 'idle', pdf: null, page: 1, screenBy: null, video: null }, games: newGames() });

/** هل يحق للمنفّذ تعديل صلاحيات الهدف؟ المشرف: على المشاركين فقط، ولا يتجاوز قيود المدير */
const canTouch = (actor, target) => actor.role === 'owner' ? target.role !== 'owner' : actor.role === 'mod' && target.role === 'user';

async function handleAct(room, p, m) {
  const ws = p.ws;
  const target = room.players.get(String(m.id || ''));
  const owner = p.role === 'owner', staff = isStaff(p);
  const deny = () => send(ws, { t: 'err', c: 'forbidden' });
  switch (m.a) {
    // ---- للمدير فقط ----
    case 'lock': case 'unlock': if (!owner) return deny(); room.locked = m.a === 'lock'; return toRoom(room, { t: 'locked', v: room.locked });
    case 'end': if (!owner) return deny(); return endRoom(room, 'ended');
    case 'promote': case 'demote': {
      if (!owner) return deny(); if (!target || target.role === 'owner') return;
      target.role = m.a === 'promote' ? 'mod' : 'user';
      target.perm.screen = target.role !== 'user' ? true : false; target.permBy = {};
      toRoom(room, { t: 'role', id: target.id, role: target.role });
      return applyPerms(room, target, true);
    }
    case 'kick': {
      if (!owner) return deny(); if (!target || target.role === 'owner') return;
      send(target.ws, { t: 'kicked' }); try { target.ws?.close(4001, 'kicked'); } catch { /* */ } return removePlayer(room, target, 'kicked');
    }
    // ---- للمدير والمشرف ----
    case 'mute': {
      if (!staff) return deny(); if (!target || !canTouch(p, target)) return deny();
      if (await muteSource(room.code, target.id, 'mic')) send(target.ws, { t: 'forced', what: 'mic' }); else send(target.ws, { t: 'forced', what: 'mic' });
      return;
    }
    case 'muteall': {
      if (!staff) return deny();
      for (const t of room.players.values()) if (canTouch(p, t)) { void muteSource(room.code, t.id, 'mic'); send(t.ws, { t: 'forced', what: 'mic' }); }
      return;
    }
    case 'stop': {
      if (!staff || !MEDIA.includes(m.what)) return deny(); if (!target || !canTouch(p, target)) return deny();
      await muteSource(room.code, target.id, m.what); send(target.ws, { t: 'forced', what: m.what });
      if (m.what === 'screen' && room.proj.mode === 'screen' && room.proj.screenBy === target.id) projStop(room);
      return;
    }
    case 'perm': { // تقييد/السماح: فردي أو للجميع (id='all')
      if (!staff || !MEDIA.includes(m.what) || typeof m.v !== 'boolean') return deny();
      if (m.id === 'all') {
        if (room.gBy[m.what] === 'owner' && !owner) return deny();
        room.gperm[m.what] = m.v; room.gBy[m.what] = m.v ? null : (owner ? 'owner' : 'mod');
        toRoom(room, { t: 'gperm', gperm: room.gperm });
        for (const t of room.players.values()) await applyPerms(room, t, true);
        return;
      }
      if (!target || !canTouch(p, target)) return deny();
      if (target.permBy[m.what] === 'owner' && !owner) return deny();   // المشرف لا يتجاوز قيد المدير
      target.perm[m.what] = m.v; target.permBy[m.what] = m.v ? null : (owner ? 'owner' : 'mod');
      return applyPerms(room, target, true);
    }
  }
}

function handleProj(room, p, m) {
  const owner = p.role === 'owner', pr = room.proj;
  const deny = () => send(p.ws, { t: 'err', c: 'forbidden' });
  const upd = () => toRoom(room, { t: 'proj', proj: room.proj, now: Date.now() });
  switch (m.a) {
    case 'pdf': {
      if (!owner) return deny();
      const id = String(m.id || ''); if (!fileExists(room.code, id + '.pdf')) return send(p.ws, { t: 'err', c: 'nofile' });
      room.proj = { mode: 'pdf', pdf: { id, url: `/api/file/${room.code}/${id}.pdf`, name: String(m.name || 'ملف PDF').slice(0, 80), pages: clamp(parseInt(m.pages, 10) || 1, 1, 2000) }, page: 1, screenBy: null, video: null }; return upd();
    }
    case 'page': if (!owner || pr.mode !== 'pdf') return deny(); pr.page = clamp(parseInt(m.page, 10) || 1, 1, pr.pdf.pages); return upd();
    case 'video': {
      if (!owner) return deny();
      let src = null, name = String(m.name || 'فيديو').slice(0, 80);
      if (m.id) { const f = ['mp4', 'webm'].find((e) => fileExists(room.code, `${m.id}.${e}`)); if (!f) return send(p.ws, { t: 'err', c: 'nofile' }); src = `/api/file/${room.code}/${m.id}.${f}`; }
      else if (/^https:\/\//i.test(String(m.url || ''))) src = String(m.url).slice(0, 500);
      if (!src) return send(p.ws, { t: 'err', c: 'bad_url' });
      room.proj = { mode: 'video', pdf: null, page: 1, screenBy: null, video: { src, name, playing: false, pos: 0, at: Date.now() } }; return upd();
    }
    case 'vctl': {
      if (!owner || pr.mode !== 'video') return deny();
      const v = pr.video, now = Date.now(); const cur = v.pos + (v.playing ? (now - v.at) / 1000 : 0);
      v.pos = Number.isFinite(m.pos) ? Math.max(0, m.pos) : cur; v.playing = typeof m.playing === 'boolean' ? m.playing : v.playing; v.at = now; return upd();
    }
    case 'screen': { // المدير يعرض شاشة مشارك محدد (أو شاشته)
      if (!owner) return deny(); const t = room.players.get(String(m.id || p.id)); if (!t || !effPerm(room, t).screen) return send(p.ws, { t: 'err', c: 'forbidden' });
      room.proj = { mode: 'screen', pdf: null, page: 1, screenBy: t.id, video: null }; return upd();
    }
    case 'screen_self': { // مشارك مخوّل يعرض شاشته إن كان العارض فارغًا (مصدر واحد في كل مرة)
      if (!effPerm(room, p).screen) return deny();
      if (pr.mode !== 'idle' && !(pr.mode === 'screen' && pr.screenBy === p.id) && !owner) return send(p.ws, { t: 'err', c: 'busy' });
      room.proj = { mode: 'screen', pdf: null, page: 1, screenBy: p.id, video: null }; return upd();
    }
    case 'screen_end': if (pr.mode === 'screen' && (pr.screenBy === p.id || owner)) projStop(room); return;
    case 'stop': if (!owner) return deny(); return projStop(room);
  }
}

wss.on('connection', (ws, req) => {
  const ip = ipOf(req);
  ws.isAlive = true; ws.on('pong', () => { ws.isAlive = true; });
  if (!hit('conn:' + ip, 120, 60_000)) { ws.close(4429, 'rate'); return; }

  ws.on('message', async (raw) => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m.t !== 'string') return;
    const p = ws._p;

    if (!p) {
      if (m.t === 'admin_start') {
        // نحدّ المحاولات الفاشلة فقط (تخمين كلمة السر): 6 محاولات خاطئة كل 10 دقائق لكل عنوان
        const fb = buckets.get('admfail:' + ip);
        if (fb && fb.n >= 6 && fb.reset > Date.now()) return send(ws, { t: 'err', c: 'rate' });
        if (!checkPassword(m.password)) { hit('admfail:' + ip, 6, 10 * 60_000); return send(ws, { t: 'err', c: 'bad_password' }); }
        const code = newCode(); const room = newRoom(code); rooms.set(code, room);
        const me = addPlayer(room, ws, m.name || 'المدير', m.look, 'owner');
        return send(ws, await welcome(room, me));
      }
      if (m.t === 'join') {
        if (!hit('join:' + ip, 120, 60_000)) return send(ws, { t: 'err', c: 'rate' });
        const code = String(m.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
        const room = rooms.get(code);
        if (!room) return send(ws, hit('bad:' + ip, 10, 60_000) ? { t: 'err', c: 'bad_code' } : { t: 'err', c: 'rate' });
        if (room.locked) return send(ws, { t: 'err', c: 'locked' });
        if (room.players.size >= MAX_PLAYERS) return send(ws, { t: 'err', c: 'full' });
        const me = addPlayer(room, ws, m.name, m.look, 'user');
        send(ws, await welcome(room, me));
        return toRoom(room, { t: 'joined', p: pub(me) }, me.id);
      }
      if (m.t === 'resume') {
        if (!hit('res:' + ip, 20, 60_000)) return send(ws, { t: 'err', c: 'rate' });
        const old = byToken.get(String(m.token || '')); const room = old && rooms.get(old.room);
        if (!old || !room) return send(ws, { t: 'err', c: 'gone' });
        clearTimeout(old.timer); old.gone = 0; old.ws = ws; ws._p = old;
        if (old.role === 'owner') { clearTimeout(room.ownerTimer); room.ownerTimer = null; }
        send(ws, await welcome(room, old));
        return toRoom(room, { t: 'back', id: old.id }, old.id);
      }
      return;
    }
    const room = rooms.get(p.room); if (!room) return;

    switch (m.t) {
      case 'm': {
        if (![m.x, m.z, m.ry].every(Number.isFinite)) return;
        if (movementLocked(room, p.id)) return;
        const d = Math.hypot(m.x, m.z); const k = d > BOUND ? BOUND / d : 1;
        p.x = m.x * k; p.z = m.z * k; p.ry = m.ry; p.mv = m.mv ? 1 : 0; p.sit = m.sit ? 1 : 0; p.dirty = true; return;
      }
      case 'chat': {
        const now = Date.now(); if (now - p.lastChat < 500) return; p.lastChat = now;
        const text = String(m.text || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 300); if (!text) return;
        return toRoom(room, { t: 'chat', id: p.id, name: p.name, text, ts: now });
      }
      case 'dm': { // رسالة خاصة: لا يقرؤها المدير ولا غيره
        const to = room.players.get(String(m.to || '')); if (!to || to.id === p.id) return;
        const now = Date.now(); if (now - p.lastChat < 400) return; p.lastChat = now;
        const text = String(m.text || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 300); if (!text) return;
        const msg = { t: 'dm', from: p.id, fromName: p.name, to: to.id, toName: to.name, text, ts: now };
        send(ws, msg); return send(to.ws, msg);
      }
      case 'emote': {
        if (!['wave', 'chest', 'clap', 'nose', 'thumb'].includes(m.n) || !hit('em:' + p.id, 8, 5000)) return;
        return toRoom(room, { t: 'emote', id: p.id, n: m.n });
      }
      case 'g': {
        const bc = (msg) => toRoom(room, msg);
        const r = m.g === 'siga' ? handleSiga(room, p, m, bc) : m.g === 'hs' ? handleHs(room, p, m, bc) : m.g === 'race' ? handleRace(room, p, m, bc) : null;
        if (r && r.err) send(ws, { t: 'err', c: r.err });
        return;
      }
      case 'act': return handleAct(room, p, m);
      case 'proj': return handleProj(room, p, m);
      case 'lk_refresh': return send(ws, { t: 'lk', token: livekitRunning() ? await makeToken(room.code, p, effPerm(room, p)) : null });
      case 'leave': {
        removePlayer(room, p, 'left'); ws._p = null; try { ws.close(1000); } catch { /* */ }
        if (p.role === 'owner') endRoom(room, 'owner_left'); return;
      }
    }
  });

  ws.on('close', () => {
    const p = ws._p; if (!p || p.ws !== ws) return;
    const room = rooms.get(p.room); if (!room) return;
    p.gone = Date.now(); toRoom(room, { t: 'away', id: p.id }, p.id);
    if (p.role === 'owner') room.ownerTimer = setTimeout(() => { if (rooms.get(room.code) === room) endRoom(room, 'owner_gone'); }, OWNER_GRACE_MS);
    p.timer = setTimeout(() => { if (p.gone && rooms.get(room.code) === room && room.players.has(p.id) && p.role !== 'owner') removePlayer(room, p, 'timeout'); }, RESUME_GRACE_MS);
  });
});

setInterval(() => {
  for (const room of rooms.values()) {
    const list = [];
    for (const p of room.players.values()) if (p.dirty) { p.dirty = false; list.push([p.id, +p.x.toFixed(2), +p.z.toFixed(2), +p.ry.toFixed(2), p.mv, p.sit]); }
    if (list.length) toRoom(room, { t: 's', p: list });
  }
}, 80);
setInterval(() => { for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; try { ws.ping(); } catch { /* */ } } }, 25_000).unref();

startLiveKit();
server.listen(PORT, () => console.log(`IOPsy server: http://localhost:${PORT}  (ws /ws, livekit proxy /lk)`));
export { rooms };
void roomForEff;
