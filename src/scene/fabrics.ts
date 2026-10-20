import * as THREE from 'three';

function tex(c: HTMLCanvasElement, repeat?: [number, number]) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) t.repeat.set(...repeat);
  return t;
}
const canvas = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function rng(seed: number) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

/** قماش بيت الشعر: أشرطة سوداء وبنية وعاجية مع نسيج */
export function goatHair(repeat: [number, number] = [6, 2]) {
  const c = canvas(512, 256), x = c.getContext('2d')!, r = rng(11);
  const bands: [string, number][] = [['#1a130e', 70], ['#3b2a1d', 14], ['#e6d9bd', 12], ['#1a130e', 86], ['#7d3a1f', 12], ['#1a130e', 50], ['#cdbb94', 8], ['#2a1d14', 60], ['#1a130e', 40], ['#e6d9bd', 10], ['#1a130e', 120]];
  let px = 0; const total = bands.reduce((a, b) => a + b[1], 0);
  for (const [col, w] of bands) { const ww = (w / total) * 512; x.fillStyle = col; x.fillRect(px, 0, ww + 1, 256); px += ww; }
  for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '255,235,200' : '0,0,0'},${r() * 0.08})`; x.fillRect(r() * 512, r() * 256, 1 + r() * 3, 1); }
  for (let y = 0; y < 256; y += 4) { x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(0, y, 512, 1); }
  return tex(c, repeat);
}

/** سجاد سدو */
export function sadu(repeat: [number, number] = [4, 3]) {
  const c = canvas(256, 256), x = c.getContext('2d')!;
  const bands: [string, number][] = [['#8f1d1d', 38], ['#f2e4c4', 9], ['#141010', 22], ['#d98a2b', 14], ['#f2e4c4', 8], ['#8f1d1d', 36], ['#141010', 10], ['#d98a2b', 18], ['#8f1d1d', 36], ['#f2e4c4', 10], ['#141010', 15]];
  let y = 0; for (const [col, h] of bands) { x.fillStyle = col; x.fillRect(0, y, 256, h); y += h; }
  x.fillStyle = '#141010'; for (let i = 0; i < 16; i++) { x.beginPath(); x.moveTo(i * 16, 83); x.lineTo(i * 16 + 8, 69); x.lineTo(i * 16 + 16, 83); x.fill(); }
  x.fillStyle = '#f2e4c4'; for (let i = 0; i < 16; i++) { x.beginPath(); x.moveTo(i * 16, 150); x.lineTo(i * 16 + 8, 164); x.lineTo(i * 16 + 16, 150); x.fill(); }
  x.fillStyle = '#d98a2b'; for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(i * 32 + 16, 196); x.lineTo(i * 32 + 24, 208); x.lineTo(i * 32 + 16, 220); x.lineTo(i * 32 + 8, 208); x.fill(); }
  return tex(c, repeat);
}

const cushionCache = new Map<string, THREE.CanvasTexture>();
/** قماش مساند بزخرفة معيّنات ذهبية */
export function cushion(base: string) {
  if (cushionCache.has(base)) return cushionCache.get(base)!;
  const c = canvas(128, 128), x = c.getContext('2d')!;
  x.fillStyle = base; x.fillRect(0, 0, 128, 128);
  x.strokeStyle = 'rgba(240,200,110,.85)'; x.lineWidth = 2;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const cx = 32 + i * 64, cy = 32 + j * 64;
    x.beginPath(); x.moveTo(cx, cy - 26); x.lineTo(cx + 26, cy); x.lineTo(cx, cy + 26); x.lineTo(cx - 26, cy); x.closePath(); x.stroke();
    x.beginPath(); x.moveTo(cx, cy - 12); x.lineTo(cx + 12, cy); x.lineTo(cx, cy + 12); x.lineTo(cx - 12, cy); x.closePath(); x.fillStyle = 'rgba(240,200,110,.8)'; x.fill();
  }
  x.strokeRect(1, 1, 126, 126);
  const t = tex(c); cushionCache.set(base, t); return t;
}

export function wood(base = '#6b4326') {
  const c = canvas(256, 256), x = c.getContext('2d')!, r = rng(5);
  x.fillStyle = base; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8; i++) { x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, i * 32, 256, 2); }
  for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '255,220,170' : '30,15,5'},${r() * 0.12})`; x.fillRect(r() * 256, r() * 256, 20 + r() * 80, 1); }
  return tex(c);
}

/** شاشة العرض (مؤقتًا شعار — يُستبدل بالعرض الحي لاحقًا) */
export function screenIdle() {
  const c = canvas(1024, 576), x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, 1024, 576); g.addColorStop(0, '#1d1236'); g.addColorStop(1, '#3a1d4a');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 576);
  x.strokeStyle = 'rgba(246,217,141,.5)'; x.lineWidth = 6; x.strokeRect(20, 20, 984, 536);
  x.fillStyle = '#f6d98d'; x.textAlign = 'center'; x.font = '700 150px "Reem Kufi", serif'; x.fillText('IOPsy', 512, 300);
  x.font = '500 42px Tajawal, sans-serif'; x.fillStyle = '#e8dcc0'; x.direction = 'rtl'; x.fillText('شاشة العرض — بانتظار المقدّم', 512, 380);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
