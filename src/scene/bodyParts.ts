// أجزاء منحوتة بنعومة: رأس بوجه كرتوني، أيدٍ بأصابع، أقدام
import * as THREE from 'three';
import { SDF, capsule, ellipsoid, smax, smin, surfaceNets } from './sdf';

let headG: THREE.BufferGeometry | null = null;
let handG: THREE.BufferGeometry | null = null;
let fistG: THREE.BufferGeometry | null = null;
let footG: THREE.BufferGeometry | null = null;

/** رأس كرتوني ناعم: جمجمة بيضاوية، خدود ممتلئة، فك رفيع، أنف صغير، أذنان */
export const headSdf: SDF = (x, y, z) => {
    const ax = Math.abs(x);
    let d = ellipsoid(x, y, z, 0, 0.02, -0.008, 0.138, 0.172, 0.148);
    d = smin(d, ellipsoid(x, y, z, 0, -0.092, 0.03, 0.086, 0.1, 0.096), 0.07);
    d = smin(d, ellipsoid(ax, y, z, 0.07, -0.058, 0.066, 0.05, 0.05, 0.052), 0.05);
    d = smin(d, ellipsoid(x, y, z, 0, -0.152, 0.066, 0.036, 0.036, 0.04), 0.04);
    d = smin(d, ellipsoid(x, y, z, 0, 0.078, 0.122, 0.1, 0.022, 0.04), 0.035);
    d = smin(d, ellipsoid(x, y, z, 0, -0.032, 0.153, 0.0135, 0.012, 0.0135), 0.016);
    d = smin(d, ellipsoid(x, y, z, 0, -0.008, 0.147, 0.0065, 0.018, 0.0075), 0.018);
    d = smin(d, ellipsoid(ax, y, z, 0.0115, -0.037, 0.146, 0.0075, 0.007, 0.0075), 0.01);
    d = smin(d, ellipsoid(x, y, z, 0, -0.068, 0.146, 0.038, 0.014, 0.012), 0.012);
    d = smin(d, ellipsoid(ax, y, z, 0.147, -0.004, -0.006, 0.013, 0.03, 0.022), 0.02);
    // محجر العين الضحل + نتوء الحاجب
    return d;
  };

export function headGeometry() {
  if (headG) return headG;
  const sdf = headSdf;
  headG = surfaceNets(sdf, [-0.2, -0.22, -0.2], [0.2, 0.21, 0.2], [76, 80, 76]);
  const p = headG.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = Math.atan2(p.getX(i), p.getZ(i)) / (Math.PI * 2) + 0.5; uv[i * 2 + 1] = p.getY(i) * 2.2 + 0.5; }
  headG.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return headG;
}

type Seg = [number, number, number, number, number, number, number, number];
/** يد يمنى بأصابع منحنية قليلًا (الإبهام جهة -x) — اليسرى بالانعكاس */
export function handGeometry() {
  if (handG) return handG;
  const fingers: Seg[][] = [];
  for (let k = 0; k < 4; k++) {
    const x = (k - 1.5) * 0.0172, L = [0.9, 1.0, 0.97, 0.78][k], r = 0.0088 - (k === 3 ? 0.0006 : 0);
    fingers.push([
      [x, -0.058, 0, x, -0.058 - 0.034 * L, 0.004, r, r * 0.95],
      [x, -0.058 - 0.034 * L, 0.004, x, -0.058 - 0.058 * L, 0.016, r * 0.95, r * 0.9],
      [x, -0.058 - 0.058 * L, 0.016, x, -0.058 - 0.073 * L, 0.03, r * 0.9, r * 0.82],
    ]);
  }
  const thumb: Seg[] = [[-0.03, -0.028, 0.004, -0.045, -0.052, 0.014, 0.0112, 0.0102], [-0.045, -0.052, 0.014, -0.05, -0.073, 0.026, 0.0102, 0.009]];
  const sdf: SDF = (x, y, z) => {
    let d = ellipsoid(x, y, z, 0, -0.03, 0, 0.034, 0.038, 0.0165);
    d = smin(d, ellipsoid(x, y, z, 0, -0.058, 0, 0.034, 0.014, 0.014), 0.014);
    for (const f of fingers) for (const s of f) d = smin(d, capsule(x, y, z, s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7]), 0.008);
    for (const s of thumb) d = smin(d, capsule(x, y, z, s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7]), 0.01);
    return d;
  };
  handG = surfaceNets(sdf, [-0.075, -0.16, -0.045], [0.06, 0.05, 0.065], [46, 72, 38]);
  return handG;
}
/** قبضة مع إبهام لأعلى (👍) */
export function fistGeometry() {
  if (fistG) return fistG;
  const sdf: SDF = (x, y, z) => {
    let d = ellipsoid(x, y, z, 0, -0.045, 0.008, 0.036, 0.046, 0.028);
    d = smin(d, ellipsoid(x, y, z, 0, -0.07, 0.025, 0.034, 0.02, 0.02), 0.01);
    d = smin(d, capsule(x, y, z, -0.028, -0.035, 0.012, -0.034, -0.0, 0.016, 0.0112, 0.0102), 0.01);
    d = smin(d, capsule(x, y, z, -0.034, 0.0, 0.016, -0.033, 0.024, 0.016, 0.0102, 0.0092), 0.01);
    return d;
  };
  fistG = surfaceNets(sdf, [-0.075, -0.13, -0.045], [0.06, 0.05, 0.065], [46, 60, 38]);
  return fistG;
}
/** قدم عارية بأصابع (للنعال) */
export function footGeometry() {
  if (footG) return footG;
  const sdf: SDF = (x, y, z) => {
    let d = ellipsoid(x, y, z, 0, 0.03, 0.035, 0.043, 0.026, 0.1);
    d = smin(d, ellipsoid(x, y, z, 0, 0.032, 0.115, 0.045, 0.02, 0.05), 0.02);
    for (let i = 0; i < 5; i++) d = smin(d, ellipsoid(x, y, z, -0.028 + i * 0.014, 0.022, 0.158 - Math.abs(i - 1) * 0.004 - (i === 4 ? 0.012 : 0), 0.0085, 0.0085, 0.013), 0.006);
    return d;
  };
  footG = surfaceNets(sdf, [-0.07, -0.01, -0.09], [0.07, 0.09, 0.2], [40, 28, 82]);
  return footG;
}

const wrinkle = (x: number, y: number, z: number, a: number) => (Math.sin(x * 38 + y * 14 + z * 9) * 0.0016 + Math.sin(y * 26 - z * 17 + x * 6) * 0.0014 + Math.sin(x * 11 - y * 31) * 0.0012) * a;
function boxUV(g: THREE.BufferGeometry, k: number) {
  const p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u: number, v: number;
    if (az >= ax && az >= ay) { u = p.getX(i); v = p.getY(i); } else if (ax >= ay) { u = p.getZ(i); v = p.getY(i); } else { u = p.getX(i); v = p.getZ(i); }
    uv[i * 2] = u * k; uv[i * 2 + 1] = v * k;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g;
}
let shemaghG: THREE.BufferGeometry | null = null;
let hijabG: THREE.BufferGeometry | null = null;

/** شماغ/غترة منسدل: قبّة فوق الرأس + حافة أمامية مدبّبة + جناحان على الكتفين + ذيل خلفي — بدون الوجه */
export function shemaghGeometry() {
  if (shemaghG) return shemaghG;
  const sdf: SDF = (x, y, z) => {
    const ax = Math.abs(x);
    let d = ellipsoid(x, y, z, 0, 0.03, -0.012, 0.168, 0.17, 0.172);
    d = smin(d, ellipsoid(x, y, z, 0, 0.078, 0.122, 0.112, 0.04, 0.058), 0.03);
    d = smin(d, ellipsoid(ax, y, z, 0.158, -0.09, -0.03, 0.05, 0.14, 0.108), 0.05);
    d = smin(d, ellipsoid(ax, y, z, 0.19, -0.235, -0.02, 0.046, 0.1, 0.078), 0.05);
    d = smin(d, ellipsoid(x, y, z, 0, -0.14, -0.148, 0.172, 0.23, 0.05), 0.06);
    d = smin(d, ellipsoid(x, y, z, 0, -0.32, -0.165, 0.205, 0.16, 0.042), 0.06);
    d = smax(d, -ellipsoid(x, y, z, 0, -0.03, 0.17, 0.142, 0.15, 0.1), 0.012);
    return d + wrinkle(x, y, z, 1.4);
  };
  shemaghG = boxUV(surfaceNets(sdf, [-0.3, -0.46, -0.28], [0.3, 0.26, 0.24], [78, 100, 70]), 4.2);
  return shemaghG;
}
/** حجاب ملفوف: يحيط بالوجه ويلتف حول الرقبة ويسقط على الكتفين والصدر والظهر */
export function hijabGeometry() {
  if (hijabG) return hijabG;
  const sdf: SDF = (x, y, z) => {
    const ax = Math.abs(x);
    let d = ellipsoid(x, y, z, 0, 0.026, -0.016, 0.166, 0.17, 0.172);
    d = smin(d, ellipsoid(ax, y, z, 0.12, -0.09, 0.012, 0.05, 0.125, 0.1), 0.04);
    d = smin(d, ellipsoid(x, y, z, 0, -0.17, 0.03, 0.125, 0.075, 0.112), 0.05);
    d = smin(d, ellipsoid(ax, y, z, 0.17, -0.27, -0.01, 0.095, 0.105, 0.125), 0.06);
    d = smin(d, ellipsoid(x, y, z, 0, -0.335, 0.095, 0.16, 0.105, 0.05), 0.06);
    d = smin(d, ellipsoid(x, y, z, 0, -0.28, -0.125, 0.18, 0.31, 0.07), 0.07);
    d = smax(d, -ellipsoid(x, y, z, 0, -0.022, 0.165, 0.14, 0.142, 0.09), 0.012);
    return d + wrinkle(x, y, z, 2.2);
  };
  hijabG = boxUV(surfaceNets(sdf, [-0.3, -0.56, -0.28], [0.3, 0.26, 0.26], [78, 104, 74]), 4);
  return hijabG;
}

/** لوح يلتصق بسطح الوجه تمامًا (لرسم العين/الحاجب/الفم) — الرؤوس نسبةً لمركز اللوح */
export function conformDecal(cx: number, cy: number, w: number, h: number, off = 0.0012, nx = 18, ny = 12) {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  let cz = 0.2;
  const zAt = (x: number, y: number) => {
    let lo = -0.05, hi = 0.3;
    for (let i = 0; i < 28; i++) { const mid = (lo + hi) / 2; if (headSdf(x, y, mid) < 0) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  };
  cz = zAt(cx, cy) + off;
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const u = i / nx, v = j / ny, x = cx + (u - 0.5) * w, y = cy + (v - 0.5) * h;
    pos.push(x - cx, y - cy, zAt(x, y) + off - cz); uv.push(u, v);
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return { geo: g, center: new THREE.Vector3(cx, cy, cz) };
}
