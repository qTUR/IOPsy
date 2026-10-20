// العارض الافتراضي: مصدر واحد في كل مرة (PDF / مشاركة شاشة / فيديو) يظهر على شاشة الخيمة وفي العرض الكامل
import type { PDFDocumentProxy } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import * as THREE from 'three';
import { useGame, type Proj } from './store';
import { fileUrl } from './api';
import { trackRefs } from './media';
import { FONT_DISPLAY } from './scene/fabricsFonts';
import { t } from './i18n';

let pdfMod: Promise<typeof import('pdfjs-dist')> | null = null;
/** pdf.js يُحمَّل عند أول استخدام فقط (يخفّف الصفحة الأولى) */
const pdfjs = () => (pdfMod ??= import('pdfjs-dist').then((m) => { m.GlobalWorkerOptions.workerSrc = workerSrc; return m; }));

/** فرق الساعة بين الخادم والمتصفح (لمزامنة الفيديو) */
let skew = 0;
export const setSkew = (serverNow: number) => { if (Number.isFinite(serverNow)) skew = serverNow - Date.now(); };
export const serverNow = () => Date.now() + skew;

// ---- قماش الشاشة ثلاثية الأبعاد (PDF أو حالة فارغة) ----
export const projCanvas = Object.assign(document.createElement('canvas'), { width: 1280, height: 720 });
export const canvasTexture = new THREE.CanvasTexture(projCanvas);
canvasTexture.colorSpace = THREE.SRGBColorSpace; canvasTexture.anisotropy = 8;
// ---- عناصر فيديو مشتركة ----
export const screenVideo = Object.assign(document.createElement('video'), { muted: true, playsInline: true, autoplay: true });
export const fileVideo = Object.assign(document.createElement('video'), { playsInline: true, crossOrigin: 'anonymous', preload: 'auto' });
export const screenTexture = new THREE.VideoTexture(screenVideo); screenTexture.colorSpace = THREE.SRGBColorSpace;
export const fileTexture = new THREE.VideoTexture(fileVideo); fileTexture.colorSpace = THREE.SRGBColorSpace;

// ---- PDF ----
const docs = new Map<string, Promise<PDFDocumentProxy>>();
export function loadPdf(p: NonNullable<Proj['pdf']>) {
  if (!docs.has(p.id)) docs.set(p.id, pdfjs().then((m) => m.getDocument({ url: fileUrl(p.url) }).promise));
  return docs.get(p.id)!;
}
const renderToken = new WeakMap<HTMLCanvasElement, number>();
/** يرسم صفحة PDF داخل القماش مع هوامش (نسبة العرض محفوظة) */
export async function drawPdfPage(canvas: HTMLCanvasElement, pdf: NonNullable<Proj['pdf']>, page: number) {
  const my = (renderToken.get(canvas) ?? 0) + 1; renderToken.set(canvas, my);
  const doc = await loadPdf(pdf); if (renderToken.get(canvas) !== my) return;
  const pg = await doc.getPage(Math.min(Math.max(1, page), doc.numPages)); if (renderToken.get(canvas) !== my) return;
  const base = pg.getViewport({ scale: 1 });
  const scale = Math.min(canvas.width / base.width, canvas.height / base.height);
  const vp = pg.getViewport({ scale });
  const off = document.createElement('canvas'); off.width = Math.ceil(vp.width); off.height = Math.ceil(vp.height);
  await pg.render({ canvasContext: off.getContext('2d')!, viewport: vp, canvas: off }).promise;
  if (renderToken.get(canvas) !== my) return;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#17102a'; c.fillRect(0, 0, canvas.width, canvas.height);
  c.fillStyle = '#fff'; c.fillRect((canvas.width - off.width) / 2, (canvas.height - off.height) / 2, off.width, off.height);
  c.drawImage(off, (canvas.width - off.width) / 2, (canvas.height - off.height) / 2);
  if (canvas === projCanvas) canvasTexture.needsUpdate = true;
}
export function drawIdle(canvas: HTMLCanvasElement, line?: string) {
  const c = canvas.getContext('2d')!, w = canvas.width, h = canvas.height;
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#1d1236'); g.addColorStop(1, '#3a1d4a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(246,217,141,.5)'; c.lineWidth = 6; c.strokeRect(20, 20, w - 40, h - 40);
  c.fillStyle = '#f6d98d'; c.textAlign = 'center'; c.font = `700 ${h * 0.21}px ${FONT_DISPLAY}`; c.fillText('IOPsy', w / 2, h * 0.5);
  c.font = `500 ${h * 0.058}px Tajawal, sans-serif`; c.fillStyle = '#e8dcc0'; c.direction = 'rtl'; c.fillText(line ?? t('proj_idle'), w / 2, h * 0.62);
  if (canvas === projCanvas) canvasTexture.needsUpdate = true;
}

/** يربط مسار شاشة مشارك بعنصر الفيديو */
let attached: { id: string; track: import('livekit-client').Track } | null = null;
export function attachScreen(id: string | null) {
  const tr = id ? trackRefs.get(id)?.screen : undefined;
  if (attached && (!tr || attached.track !== tr)) { attached.track.detach(screenVideo); attached = null; }
  if (id && tr && !attached) { tr.attach(screenVideo); attached = { id, track: tr }; void screenVideo.play().catch(() => {}); }
  if (!tr) { screenVideo.srcObject = null; }
}

/** مزامنة فيديو الملف مع حالة الخادم */
export function syncFileVideo(v: NonNullable<Proj['video']>, el: HTMLVideoElement = fileVideo) {
  const src = v.src.startsWith('/api/') ? fileUrl(v.src) : v.src;
  if (el.dataset.src !== src) { el.dataset.src = src; el.src = src; }
  const target = v.pos + (v.playing ? (serverNow() - v.at) / 1000 : 0);
  if (Math.abs(el.currentTime - target) > 1.2 && Number.isFinite(target)) { try { el.currentTime = target; } catch { /* */ } }
  if (v.playing && el.paused) void el.play().catch(() => { el.muted = true; void el.play().catch(() => {}); });
  if (!v.playing && !el.paused) el.pause();
  el.volume = useGame.getState().settings.volume;
}
export function stopFileVideo() { fileVideo.pause(); fileVideo.removeAttribute('src'); delete fileVideo.dataset.src; fileVideo.load(); }

(window as unknown as { __proj: unknown }).__proj = { fileVideo, screenVideo };
