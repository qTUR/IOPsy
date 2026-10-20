// ملفات العارض: رفع PDF/فيديو، جلب PDF من رابط (Google Drive أو رابط مباشر) مع حماية SSRF، وتقديم الملفات بدعم Range.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import net from 'node:net';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.join(__dirname, 'uploads');
export const LIMITS = { pdf: 40 * 1024 * 1024, video: 400 * 1024 * 1024, perRoom: 8 };
fs.rmSync(UPLOAD_DIR, { recursive: true, force: true }); fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MIME = { pdf: 'application/pdf', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/mp4' };
const roomDir = (code) => path.join(UPLOAD_DIR, code.replace(/[^A-Z0-9]/g, ''));
export const dropRoomFiles = (code) => fs.rmSync(roomDir(code), { recursive: true, force: true });

function isPrivateIp(ip) {
  if (net.isIPv6(ip)) return ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80') || ip.startsWith('::ffff:127.') || ip.startsWith('::ffff:10.') || ip.startsWith('::ffff:192.168.');
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || (a === 100 && b >= 64 && b <= 127);
}
async function safeHost(host) {
  const addrs = await dns.lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error('bad_url');
}

/** يحفظ دفقًا في ملف مع حدّ للحجم */
function saveStream(stream, file, limit) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const out = fs.createWriteStream(file); let n = 0, done = false;
    const fail = (e) => { if (done) return; done = true; out.destroy(); fs.rmSync(file, { force: true }); reject(e); };
    stream.on('data', (c) => { n += c.length; if (n > limit) { fail(new Error('too_large')); stream.destroy(); } else out.write(c); });
    stream.on('end', () => { if (done) return; done = true; out.end(() => resolve(n)); });
    stream.on('error', fail); stream.on('aborted', () => fail(new Error('aborted')));
  });
}
const isPdfFile = (file) => { const fd = fs.openSync(file, 'r'); const b = Buffer.alloc(5); fs.readSync(fd, b, 0, 5, 0); fs.closeSync(fd); return b.toString() === '%PDF-'; };
const countFiles = (code) => (fs.existsSync(roomDir(code)) ? fs.readdirSync(roomDir(code)).length : 0);

/** رفع مباشر من المتصفح (جسم الطلب = الملف) */
export async function handleUpload(req, code, kind, name) {
  if (!['pdf', 'video'].includes(kind)) throw new Error('bad_kind');
  if (countFiles(code) >= LIMITS.perRoom) throw new Error('too_many');
  const ext = kind === 'pdf' ? 'pdf' : (/\.webm$/i.test(name) ? 'webm' : 'mp4');
  const id = crypto.randomBytes(12).toString('base64url');
  const file = path.join(roomDir(code), `${id}.${ext}`);
  await saveStream(req, file, LIMITS[kind]);
  if (kind === 'pdf' && !isPdfFile(file)) { fs.rmSync(file, { force: true }); throw new Error('not_pdf'); }
  return { id, name: String(name || 'ملف').slice(0, 80), size: fs.statSync(file).size, kind, url: `/api/file/${code}/${id}.${ext}` };
}

export function driveId(u) {
  const m = u.pathname.match(/\/(?:file\/d|presentation\/d|document\/d)\/([\w-]{10,})/) || [null, u.searchParams.get('id')];
  return m[1] && /^[\w-]{10,}$/.test(m[1]) ? m[1] : null;
}
function fetchOnce(url, redirects = 0) {
  return new Promise(async (resolve, reject) => {
    try {
      const u = new URL(url);
      if (u.protocol !== 'https:') return reject(new Error('bad_url'));
      await safeHost(u.hostname);
      const req = https.get(u, { headers: { 'user-agent': 'Mozilla/5.0 IOPsy', accept: 'application/pdf,*/*' }, timeout: 20000 }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume(); if (redirects > 5) return reject(new Error('unreachable'));
          return resolve(fetchOnce(new URL(res.headers.location, u).toString(), redirects + 1));
        }
        resolve(res);
      });
      req.on('timeout', () => { req.destroy(); reject(new Error('unreachable')); });
      req.on('error', () => reject(new Error('unreachable')));
    } catch (e) { reject(e.message === 'bad_url' ? e : new Error('bad_url')); }
  });
}

/** يجلب PDF من رابط (يدعم روابط Drive بأشكالها). الأخطاء: bad_url، private، not_pdf، too_large، unreachable */
export async function fetchPdfFromLink(code, link) {
  if (countFiles(code) >= LIMITS.perRoom) throw new Error('too_many');
  let u; try { u = new URL(String(link).trim()); } catch { throw new Error('bad_url'); }
  const isDrive = /(^|\.)(drive|docs)\.google\.com$/.test(u.hostname);
  const attempts = [];
  if (isDrive) {
    const id = driveId(u); if (!id) throw new Error('bad_url');
    attempts.push(`https://drive.google.com/uc?export=download&id=${id}`, `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`);
  } else attempts.push(u.toString());
  const id = crypto.randomBytes(12).toString('base64url'), file = path.join(roomDir(code), `${id}.pdf`);
  let lastErr = new Error('not_pdf');
  for (const url of attempts) {
    try {
      const res = await fetchOnce(url);
      if (res.statusCode !== 200) { res.resume(); lastErr = new Error(res.statusCode === 403 || res.statusCode === 401 || res.statusCode === 404 ? 'private' : 'unreachable'); continue; }
      const ct = String(res.headers['content-type'] || '');
      if (/text\/html/i.test(ct)) { res.resume(); lastErr = new Error(isDrive ? 'private' : 'not_pdf'); continue; }
      await saveStream(res, file, LIMITS.pdf);
      if (!isPdfFile(file)) { fs.rmSync(file, { force: true }); lastErr = new Error('not_pdf'); continue; }
      const name = decodeURIComponent((String(res.headers['content-disposition'] || '').match(/filename\*?=(?:UTF-8'')?"?([^";]+)/i) || [])[1] || (isDrive ? 'Google Drive.pdf' : path.basename(u.pathname) || 'ملف.pdf'));
      return { id, name: name.slice(0, 80), size: fs.statSync(file).size, kind: 'pdf', url: `/api/file/${code}/${id}.pdf` };
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

/** تقديم ملف مرفوع مع دعم Range (لازم للفيديو) */
export function serveFile(req, res, code, fname) {
  if (!/^[\w-]+\.(pdf|mp4|webm)$/.test(fname)) { res.writeHead(404); return res.end(); }
  const file = path.join(roomDir(code), fname);
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  const size = fs.statSync(file).size, type = MIME[fname.split('.').pop()] || 'application/octet-stream';
  const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
  if (range) {
    const start = range[1] ? parseInt(range[1], 10) : 0, end = range[2] ? Math.min(parseInt(range[2], 10), size - 1) : size - 1;
    if (start > end || start >= size) { res.writeHead(416, { 'content-range': `bytes */${size}` }); return res.end(); }
    res.writeHead(206, { 'content-type': type, 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${size}`, 'content-length': end - start + 1 });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'content-type': type, 'accept-ranges': 'bytes', 'content-length': size, 'cache-control': 'private, max-age=600' });
  fs.createReadStream(file).pipe(res);
}
export const fileExists = (code, fname) => /^[\w-]+\.(pdf|mp4|webm)$/.test(fname) && fs.existsSync(path.join(roomDir(code), fname));
