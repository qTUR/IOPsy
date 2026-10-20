// تكامل LiveKit: تشغيل الخادم المحلي، إصدار التوكنات، وإجراءات الإدارة (كتم/إيقاف/صلاحيات).
// قاعدة أمان: لا توجد هنا أي دالة تُفعّل ميكروفون/كاميرا/مشاركة أحد عن بُعد — فقط كتم وسحب صلاحية.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import net from 'node:net';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { AccessToken, RoomServiceClient, TrackSource } from 'livekit-server-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
export const LK_PORT = Number(process.env.LIVEKIT_PORT || 7880);
const KEYS_FILE = path.join(__dirname, 'lk-keys.json');

function loadKeys() {
  if (process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET) return { key: process.env.LIVEKIT_API_KEY, secret: process.env.LIVEKIT_API_SECRET };
  if (fs.existsSync(KEYS_FILE)) return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
  const k = { key: 'iopsy' + crypto.randomBytes(5).toString('hex'), secret: crypto.randomBytes(24).toString('base64url') };
  fs.writeFileSync(KEYS_FILE, JSON.stringify(k));
  return k;
}
const KEYS = loadKeys();
export const svc = new RoomServiceClient(`http://127.0.0.1:${LK_PORT}`, KEYS.key, KEYS.secret);

export const SOURCES = { mic: [TrackSource.MICROPHONE], cam: [TrackSource.CAMERA], screen: [TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO] };
const SRC_NAME = { [TrackSource.MICROPHONE]: 'mic', [TrackSource.CAMERA]: 'cam', [TrackSource.SCREEN_SHARE]: 'screen', [TrackSource.SCREEN_SHARE_AUDIO]: 'screen' };
const allowedSources = (perm) => Object.entries(perm).filter(([, v]) => v).flatMap(([k]) => SOURCES[k]);

let child = null;
export function startLiveKit() {
  if (process.env.NO_LIVEKIT || process.env.LIVEKIT_EXTERNAL) return null;
  const exe = path.join(ROOT, 'bin', process.platform === 'win32' ? 'livekit-server.exe' : 'livekit-server');
  if (!fs.existsSync(exe)) { console.log('[livekit] لم يُعثر على bin/livekit-server — الصوت والفيديو غير متاحين (انظر HOSTING.md)'); return null; }
  // ملف تشغيل مشتق: LK_EXTERNAL_IP=1 يجعل LiveKit يعلن عنوانك العام للمتصلين من الإنترنت
  let yml = fs.readFileSync(path.join(ROOT, 'livekit.yaml'), 'utf8');
  if (process.env.LK_EXTERNAL_IP === '1') yml = yml.replace('use_external_ip: false', 'use_external_ip: true');
  const cfg = path.join(__dirname, 'livekit.runtime.yaml'); fs.writeFileSync(cfg, yml);
  const args = ['--config', cfg, '--keys', `${KEYS.key}: ${KEYS.secret}`];
  if (process.env.NODE_IP) args.push('--node-ip', process.env.NODE_IP);
  const log = fs.openSync(path.join(__dirname, 'livekit.log'), 'a');
  child = spawn(exe, args, { stdio: ['ignore', log, log], windowsHide: true });
  child.on('exit', (c) => { console.log('[livekit] توقف، الرمز', c); child = null; });
  const stop = () => { try { child?.kill(); } catch { /* */ } };
  process.on('exit', stop); process.on('SIGINT', () => { stop(); process.exit(0); }); process.on('SIGTERM', () => { stop(); process.exit(0); });
  console.log(`[livekit] يعمل على المنفذ ${LK_PORT} (RTC: TCP 7881، UDP 7882)`);
  return child;
}
export const livekitRunning = () => !!child || !!process.env.LIVEKIT_EXTERNAL;

export async function makeToken(roomCode, p, perm) {
  const at = new AccessToken(KEYS.key, KEYS.secret, { identity: p.id, name: p.name, ttl: '8h', metadata: JSON.stringify({ role: p.role }) });
  const srcs = allowedSources(perm);
  at.addGrant({ roomJoin: true, room: roomCode, canSubscribe: true, canPublish: srcs.length > 0, canPublishData: false, canPublishSources: srcs });
  return at.toJwt();
}

export async function updatePerms(roomCode, id, perm) {
  const srcs = allowedSources(perm);
  try { await svc.updateParticipant(roomCode, id, undefined, { canSubscribe: true, canPublish: srcs.length > 0, canPublishData: false, canPublishSources: srcs }); } catch { /* غير متصل بعد */ }
}

/** كتم (لا تفعيل) المسارات المنشورة لمشارك من مصدر معيّن. يُرجع true إذا كان هناك ما كُتم. */
export async function muteSource(roomCode, id, what) {
  let any = false;
  try {
    const part = await svc.getParticipant(roomCode, id);
    for (const t of part.tracks || []) {
      if (SRC_NAME[t.source] === what && !t.muted) { await svc.mutePublishedTrack(roomCode, id, t.sid, true); any = true; }
    }
  } catch { /* */ }
  return any;
}
export async function kickFromLK(roomCode, id) { try { await svc.removeParticipant(roomCode, id); } catch { /* */ } }
export async function closeLKRoom(roomCode) { try { await svc.deleteRoom(roomCode); } catch { /* */ } }

// ---------- وكيل بسيط يمرّر /lk/* إلى LiveKit لتعمل كل الخدمة خلف منفذ HTTPS واحد ----------
export function proxyHttp(req, res) {
  const upstream = http.request({ host: '127.0.0.1', port: LK_PORT, path: req.url.replace(/^\/lk/, '') || '/', method: req.method, headers: { ...req.headers, host: `127.0.0.1:${LK_PORT}` } }, (r) => { res.writeHead(r.statusCode || 502, r.headers); r.pipe(res); });
  upstream.on('error', () => { res.writeHead(502); res.end('livekit unavailable'); });
  req.pipe(upstream);
}
export function proxyUpgrade(req, socket, head) {
  const up = net.connect(LK_PORT, '127.0.0.1', () => {
    const path2 = req.url.replace(/^\/lk/, '') || '/';
    let raw = `${req.method} ${path2} HTTP/1.1\r\n`;
    for (let i = 0; i < req.rawHeaders.length; i += 2) raw += `${req.rawHeaders[i].toLowerCase() === 'host' ? 'Host' : req.rawHeaders[i]}: ${req.rawHeaders[i].toLowerCase() === 'host' ? `127.0.0.1:${LK_PORT}` : req.rawHeaders[i + 1]}\r\n`;
    up.write(raw + '\r\n'); if (head?.length) up.write(head);
    socket.pipe(up).pipe(socket);
  });
  up.on('error', () => socket.destroy()); socket.on('error', () => up.destroy());
}
