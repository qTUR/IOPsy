// شخصيات كرتونية سعودية ناعمة (ستايل أفلام الأنيميشن): رأس منحوت، شماغ/حجاب منحوتان، بشت وعباءة مفتوحة بتطريز.
import * as THREE from 'three';
import { headGeometry, handGeometry, fistGeometry, footGeometry, shemaghGeometry, hijabGeometry, conformDecal } from './bodyParts';
import { paintedHead, baseHead, beardGeometry, EYE } from './faceSculpt';

export interface Look {
  g: 'm' | 'f';
  c: number;   // لون الثوب / العباءة
  h: number;   // غطاء الرأس
  s: number;   // لون البشرة
  b: number;   // لحية: 0 بدون، 1 سكسوكة، 2 كاملة، 3 شارب، 4 كثيفة
  bag: number; // 0 بدون، 1 كتف/توت، 2 يد
  hr: number;  // شعر (عند بدون غطاء)
  o: number;   // طبقة خارجية للرجال: 0 بدون، 1 بشت بني، 2 بشت أسود، 3 مشلح بيج
  gl: number;  // نظارة
  w: number;   // ساعة
  sc: number;  // لون الحجاب/الشيلة
  sh: number;  // حذاء: 0 سنيكرز، 1 نعال، 2 رسمي
}
export const THOBES = ['#f7f3ea', '#eadfc6', '#c9c6bd', '#33466a', '#6e5239', '#4a6a58'];
export const ABAYAS = ['#15110f', '#1f2c49', '#4b2230', '#2f3b2d'];
export const SHAYLAS = ['#15110f', '#f1e8d4', '#d28ba3', '#2a3b63'];
export const SKINS = ['#f3cfa6', '#e0b080', '#c08a58', '#92613a', '#654027'];
export const OUTERS = ['بدون', 'بشت بني', 'بشت أسود', 'مشلح بيج'];
export const OUTER_COLORS = ['', '#6b4a33', '#14110f', '#d8c7a3'];
export const HEADS_M = ['شماغ أحمر', 'غترة بيضاء', 'شماغ أسود', 'شماغ ملفوف', 'طاقية', 'بدون'];
export const HEADS_F = ['حجاب'];
export const BEARDS = ['بدون', 'سكسوكة', 'لحية كاملة', 'شارب', 'لحية كثيفة'];
export const HAIRS = ['قصير', 'غرّة', 'مجعّد'];
export const GLASSES = ['بدون', 'طبية', 'شمسية'];
export const BAGS = ['بدون', 'شنطة كتف', 'شنطة يد'];
export const SHOES = ['سنيكرز', 'نعال', 'رسمي'];
export const DEFAULT_LOOK: Look = { g: 'm', c: 0, h: 0, s: 1, b: 0, bag: 0, hr: 0, o: 2, gl: 0, w: 0, sc: 0, sh: 2 };
export const DEFAULT_LOOK_F: Look = { g: 'f', c: 0, h: 0, s: 1, b: 0, bag: 1, hr: 0, o: 0, gl: 0, w: 0, sc: 0, sh: 0 };

export type EmoteName = 'wave' | 'chest' | 'clap' | 'nose' | 'thumb';
export type Expression = 'smile' | 'surprise' | 'laugh';

const HIP = 0.98;
const EX = 1.2, EZ = 0.86; // مقطع الجذع بيضاوي: أعرض من العمق
const ellip = <T extends THREE.BufferGeometry>(g: T): T => { g.applyMatrix4(new THREE.Matrix4().makeScale(EX, 1, EZ)); return g; };
const mats = new Map<string, THREE.MeshStandardMaterial>();
function M(color: string, o: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  const k = color + JSON.stringify(o, (_, v) => (v && v.isTexture ? v.uuid : v));
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.62, ...o }));
  return mats.get(k)!;
}
const texCache = new Map<string, THREE.CanvasTexture>();
/** نسيج شماغ بنقاط صغيرة (أحمر/أسود على أبيض) */
function clothTex(kind: 'red' | 'black' | 'white') {
  if (texCache.has(kind)) return texCache.get(kind)!;
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d')!;
  x.fillStyle = '#fbf7f2'; x.fillRect(0, 0, 256, 256);
  if (kind !== 'white') {
    x.fillStyle = kind === 'red' ? '#cf2c33' : '#202024';
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
      const cx = i * 16 + (j % 2) * 8 + 4, cy = j * 16 + 8;
      x.beginPath(); x.arc(cx, cy, 5, 0, Math.PI * 2); x.fill();
      x.fillRect(cx - 1.6, cy - 7.5, 3.2, 15); x.fillRect(cx - 7.5, cy - 1.6, 15, 3.2);
    }
  }
  x.strokeStyle = 'rgba(0,0,0,.05)'; for (let i = 0; i < 256; i += 4) { x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  texCache.set(kind, t); return t;
}
function embroideryTex(rx = 1, ry = 1) {
  if (!texCache.has('emb')) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d')!;
    x.strokeStyle = '#e6c27a'; x.fillStyle = '#e6c27a'; x.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const cx = 32 + i * 64;
      x.beginPath(); x.moveTo(cx, 22); x.lineTo(cx + 24, 64); x.lineTo(cx, 106); x.lineTo(cx - 24, 64); x.closePath(); x.stroke();
      x.beginPath(); x.moveTo(cx, 40); x.lineTo(cx + 12, 64); x.lineTo(cx, 88); x.lineTo(cx - 12, 64); x.closePath(); x.fill();
    }
    x.fillRect(0, 8, 256, 4); x.fillRect(0, 116, 256, 4);
    for (let i = 0; i < 32; i++) { x.beginPath(); x.moveTo(i * 8, 12); x.lineTo(i * 8 + 4, 20); x.lineTo(i * 8 + 8, 12); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; texCache.set('emb', t);
  }
  const t = texCache.get('emb')!.clone(); t.repeat.set(rx, ry); t.needsUpdate = true; return t;
}
const embMat = (rx: number, ry: number) => new THREE.MeshStandardMaterial({ map: embroideryTex(rx, ry), transparent: true, alphaTest: 0.4, roughness: 0.4, metalness: 0.5, side: THREE.DoubleSide });
function weaveBump() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d')!;
  x.fillStyle = '#808080'; x.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 64; i += 4) { x.fillStyle = '#b4b4b4'; x.fillRect(i, 0, 2, 64); x.fillStyle = '#5a5a5a'; x.fillRect(0, i, 64, 2); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(26, 18); return t;
}
const BUMP = weaveBump();

const G = { sph: new THREE.SphereGeometry(1, 28, 20) };
const smooth = (pts: [number, number][]) => new THREE.SplineCurve(pts.map(([r, y]) => new THREE.Vector2(r, y))).getPoints(110).map((v) => new THREE.Vector2(Math.max(0.001, v.x), v.y));
function foldify(g: THREE.BufferGeometry, amp: number, k1 = 9, k2 = 5) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), r = Math.hypot(x, z), th = Math.atan2(z, x);
    const fade = THREE.MathUtils.smoothstep(1.35 - y, 0.0, 1.2);
    const d = (Math.sin(th * k1 + y * 2.2) * Math.sin(th * k2 - y * 1.3) * 0.7 + Math.sin(th * 3 + y * 6) * 0.3 + Math.sin(th * 13 + y * 4) * 0.25) * amp * fade;
    if (r > 0.01) { p.setX(i, x + (x / r) * d); p.setZ(i, z + (z / r) * d); }
  }
  g.computeVertexNormals(); return g;
}
function latheSplit(pts: [number, number][], seg = 80, amp = 0.012, phiStart = 0, phiLen = Math.PI * 2): [THREE.BufferGeometry, THREE.BufferGeometry] {
  const sm = smooth(pts);
  let i = 0; while (i < sm.length - 1 && sm[i + 1].y < HIP) i++;
  const a = sm[i], b = sm[i + 1], t = (HIP - a.y) / (b.y - a.y || 1);
  const mid = new THREE.Vector2(a.x + (b.x - a.x) * t, HIP);
  const lo = [...sm.slice(0, i + 1), mid], hi = [mid, ...sm.slice(i + 1)];
  return [ellip(foldify(new THREE.LatheGeometry(lo, seg, phiStart, phiLen), amp)), ellip(foldify(new THREE.LatheGeometry(hi, seg, phiStart, phiLen), amp))];
}
const THOBE_P: [number, number][] = [[0.001, 0.1], [0.248, 0.1], [0.252, 0.13], [0.222, 0.55], [0.178, 0.98], [0.18, 1.15], [0.196, 1.3], [0.21, 1.4], [0.11, 1.47], [0.055, 1.5], [0.001, 1.5]];
const INNER_F_P: [number, number][] = [[0.001, 0.1], [0.3, 0.1], [0.304, 0.13], [0.262, 0.55], [0.19, 0.98], [0.188, 1.15], [0.2, 1.3], [0.212, 1.4], [0.11, 1.47], [0.055, 1.5], [0.001, 1.5]];
const BISHT_P: [number, number][] = [[0.001, 0.12], [0.31, 0.12], [0.3, 0.18], [0.262, 0.55], [0.216, 0.98], [0.218, 1.15], [0.234, 1.3], [0.246, 1.4], [0.15, 1.47], [0.08, 1.5], [0.001, 1.51]];
const ABAYA_P: [number, number][] = [[0.001, 0.12], [0.43, 0.12], [0.425, 0.18], [0.345, 0.55], [0.238, 0.98], [0.228, 1.15], [0.238, 1.3], [0.25, 1.4], [0.15, 1.47], [0.08, 1.5], [0.001, 1.51]];
const SHAYLA_DRAPE = ellip(foldify(new THREE.LatheGeometry(smooth([[0.001, 1.16], [0.235, 1.18], [0.27, 1.3], [0.225, 1.46], [0.18, 1.6], [0.15, 1.72], [0.001, 1.8]]), 64), 0.018));
const radiusAt = (pts: [number, number][], y: number) => { let best = 0.2, bd = 9; for (const v of smooth(pts)) { const d = Math.abs(v.y - y); if (d < bd) { bd = d; best = v.x; } } return best; };

function mesh(g: THREE.BufferGeometry, m: THREE.Material, o: { s?: [number, number, number]; p?: [number, number, number]; r?: [number, number, number]; parent?: THREE.Object3D; shadow?: boolean } = {}) {
  const x = new THREE.Mesh(g, m);
  if (o.s) x.scale.set(...o.s); if (o.p) x.position.set(...o.p); if (o.r) x.rotation.set(...o.r);
  x.castShadow = o.shadow !== false; if (o.parent) o.parent.add(x); return x;
}
function capMaterial(base: THREE.MeshStandardMaterial, glslDiscard: string) {
  const m = base.clone();
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vObj;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vObj;').replace('void main() {', `void main() {\n  { float x = vObj.x, y = vObj.y, z = vObj.z; float ax = abs(x); ${glslDiscard} }`);
  };
  m.customProgramCacheKey = () => glslDiscard;
  return m;
}
const FACE_OPEN = 'if (z > 0.02 && pow(ax / 0.142, 2.0) + pow((y + 0.022) / 0.148, 2.0) < 1.0) discard;';
const HAIR_CUT = 'float lim = mix(0.072, -0.045, smoothstep(0.03, -0.09, z)); lim = mix(lim, -0.01, smoothstep(0.11, 0.145, ax) * step(0.0, z)); if (y < lim) discard;';
const BEARD_CUT = [
  '',
  'if (!(y < -0.1 && ax < 0.05 && z > 0.0)) discard;',
  'if (!(y < -0.05 && z > -0.02) || (ax < 0.045 && y > -0.105 && z > 0.09)) discard;',
  'discard;',
  'if (!((y < -0.03 && z > -0.04) || (ax > 0.1 && y < 0.03 && z > -0.02)) || (ax < 0.045 && y > -0.105 && z > 0.09)) discard;',
];

export interface BuiltAvatar {
  group: THREE.Group;
  update(dt: number, moving: boolean, speed: number): void;
  emote(n: EmoteName): void;
  setSit(v: boolean): void;
  setExpression(e: Expression): void;
  readonly sitting: boolean;
}

function makeShoe(kind: number, f: boolean, skin: THREE.Material): THREE.Group {
  const s = new THREE.Group();
  if (kind === 1) {
    mesh(footGeometry(), skin, { p: [0, 0.016, -0.02], parent: s });
    mesh(new THREE.BoxGeometry(0.1, 0.018, 0.27), M('#7a4a28', { roughness: 0.7 }), { p: [0, 0.009, 0.06], parent: s });
    mesh(new THREE.TorusGeometry(0.047, 0.0065, 8, 22, Math.PI), M('#5a3318', { roughness: 0.6 }), { p: [0, 0.018, 0.05], r: [0, Math.PI / 2, 0], parent: s, shadow: false });
    mesh(new THREE.CapsuleGeometry(0.006, 0.07, 3, 6), M('#5a3318'), { p: [0, 0.046, 0.14], r: [Math.PI / 2 - 0.4, 0, 0], parent: s, shadow: false });
  } else if (kind === 2) { // حذاء جلد أسود لامع بكعب
    const leather = new THREE.MeshPhysicalMaterial({ color: '#0f0d10', roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12 });
    mesh(new THREE.CapsuleGeometry(0.046, 0.16, 8, 14), leather, { s: [1, 0.74, 1.02], p: [0, 0.046, 0.055], r: [Math.PI / 2, 0, 0], parent: s });
    mesh(G.sph, leather, { s: [0.04, 0.045, 0.045], p: [0, 0.07, -0.02], parent: s });
    mesh(new THREE.BoxGeometry(0.098, 0.014, 0.285), M('#0a0a0a'), { p: [0, 0.007, 0.055], parent: s, shadow: false });
    mesh(new THREE.BoxGeometry(0.09, 0.022, 0.05), M('#241812'), { p: [0, 0.011, -0.04], parent: s, shadow: false });
  } else {
    const white = M(f ? '#f6f2ea' : '#fbfbfb', { roughness: 0.45 });
    mesh(new THREE.CapsuleGeometry(0.05, 0.15, 8, 14), white, { s: [1, 0.78, 1], p: [0, 0.052, 0.05], r: [Math.PI / 2, 0, 0], parent: s });
    mesh(G.sph, M(f ? '#e6d9c4' : '#d62b27', { roughness: 0.5 }), { s: [0.05, 0.034, 0.06], p: [0, 0.062, 0.105], parent: s });
    mesh(new THREE.BoxGeometry(0.104, 0.018, 0.285), M(f ? '#e8dcc6' : '#d62b27', { roughness: 0.6 }), { p: [0, 0.009, 0.052], parent: s, shadow: false });
    for (let i = 0; i < 3; i++) mesh(new THREE.CapsuleGeometry(0.003, 0.05, 2, 5), M('#ffffff'), { p: [0, 0.098 - i * 0.002, 0.03 + i * 0.035], r: [0, 0, Math.PI / 2], parent: s, shadow: false });
    mesh(G.sph, white, { s: [0.04, 0.03, 0.025], p: [0, 0.08, -0.04], parent: s });
  }
  return s;
}

export function buildAvatar(look: Look): BuiltAvatar {
  const f = look.g === 'f';
  const root = new THREE.Group(); root.scale.setScalar(0.9);
  const body = new THREE.Group(); root.add(body);
  const lower = new THREE.Group(); body.add(lower);
  const U = new THREE.Group(); U.position.y = HIP; body.add(U);
  const ub = new THREE.Group(); ub.position.y = -HIP; U.add(ub);

  const skin = new THREE.MeshPhysicalMaterial({ color: SKINS[look.s % SKINS.length], roughness: 0.5, sheen: 0.25, sheenColor: new THREE.Color('#e9a590'), sheenRoughness: 0.7 });
  const cloth = (col: string) => new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.8, bumpMap: BUMP, bumpScale: 0.6, sheen: 0.7, sheenRoughness: 0.5, sheenColor: new THREE.Color(col).lerp(new THREE.Color('#ffffff'), 0.45) });
  const outerOn = f || look.o > 0;
  const innerColor = f ? '#f2ede2' : THOBES[look.c % THOBES.length];
  const outerColor = f ? ABAYAS[look.c % ABAYAS.length] : OUTER_COLORS[look.o];
  const dress = cloth(innerColor);                // الثوب / الفستان الداخلي
  const outerMat = outerOn ? cloth(outerColor) : dress;
  const gold = M('#c99a3a', { metalness: 0.85, roughness: 0.36 });
  const trimMat = look.o === 3 && !f ? M('#8a6a2a', { metalness: 0.7, roughness: 0.4 }) : gold;
  const stitch = M(new THREE.Color(innerColor).multiplyScalar(0.72).getStyle(), { roughness: 0.9 });
  const INNER_P = f ? INNER_F_P : THOBE_P;
  const OP = f ? ABAYA_P : BISHT_P;
  const R = (y: number) => radiusAt(INNER_P, y) * EZ;
  const RX = (y: number) => radiusAt(INNER_P, y) * EX;

  // ---------- الثوب الداخلي ----------
  const [lowG, upG] = latheSplit(INNER_P);
  mesh(lowG, dress, { parent: lower });
  mesh(upG, dress, { parent: ub });
  if (!f) {
    const collar = new THREE.CylinderGeometry(0.066, 0.074, 0.036, 28, 1, true);
    mesh(collar, new THREE.MeshPhysicalMaterial({ color: innerColor, roughness: 0.75, side: THREE.DoubleSide, bumpMap: BUMP, bumpScale: 0.5 }), { p: [0, 1.46, 0.004], parent: ub });
    mesh(new THREE.TorusGeometry(0.07, 0.006, 6, 28), stitch, { p: [0, 1.478, 0.004], r: [Math.PI / 2, 0, 0], parent: ub, shadow: false });
    mesh(new THREE.BoxGeometry(0.036, 0.3, 0.004), stitch, { p: [0, 1.33, R(1.31) + 0.002], parent: ub, shadow: false });
    for (const y of [1.44, 1.37, 1.3]) mesh(new THREE.SphereGeometry(1, 14, 10), M('#e6dfcf', { roughness: 0.3, metalness: 0.2 }), { s: [0.0085, 0.0085, 0.0055], p: [0, y, R(y) + 0.005], parent: ub, shadow: false });
    mesh(new THREE.CylinderGeometry(0.006, 0.0045, 0.13, 8), M('#b8b0a0'), { p: [0, 1.4, R(1.4) + 0.009], parent: ub, shadow: false });
    if (!outerOn) {
      const pocket = new THREE.Group(); pocket.position.set(RX(1.2) * 0.42, 1.2, R(1.2) * 0.9 + 0.002); pocket.rotation.y = 0.42; ub.add(pocket);
      mesh(new THREE.BoxGeometry(0.066, 0.08, 0.005), dress, { parent: pocket, shadow: false });
      for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.002, 0.08, 0.0065), stitch, { p: [sx * 0.033, 0, 0], parent: pocket, shadow: false });
      mesh(new THREE.BoxGeometry(0.066, 0.002, 0.0065), stitch, { p: [0, 0.04, 0], parent: pocket, shadow: false });
      for (const sx of [-1, 1]) mesh(new THREE.CapsuleGeometry(0.0022, 0.12, 2, 5), M(new THREE.Color(innerColor).multiplyScalar(0.55).getStyle()), { p: [sx * RX(0.78) * 0.72, 0.78, R(0.78) * 0.7], r: [0, sx * 0.75, sx * 0.3], parent: lower, shadow: false });
    }
  }

  // ---------- الطبقة الخارجية: بشت / عباءة مفتوحة بحواف مطرّزة ----------
  if (outerOn) {
    const gap = f ? 0.78 : 0.9;
    const [oL, oU] = latheSplit(OP, 80, 0.016, gap / 2, Math.PI * 2 - gap);
    mesh(oL, outerMat, { parent: lower }); mesh(oU, outerMat, { parent: ub });
    for (const sgn of [-1, 1]) {
      const ang = sgn * (gap / 2);
      const mk = (y0: number, y1: number, par: THREE.Object3D, off: number) => {
        const pts: THREE.Vector3[] = [];
        for (let y = y0; y <= y1 + 1e-6; y += (y1 - y0) / 8) { const Rr = radiusAt(OP, y) + 0.004 + off; const a2 = ang + sgn * off * 2; pts.push(new THREE.Vector3(Rr * Math.sin(a2) * EX, y, Rr * Math.cos(a2) * EZ)); }
        mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.0085, 6), trimMat, { parent: par, shadow: false });
      };
      mk(0.14, 0.97, lower, 0); mk(0.99, 1.44, ub, 0);
      // شريط تطريز عريض بجوار الحافة
      const a0 = sgn > 0 ? gap / 2 + 0.012 : -(gap / 2) - 0.012 - (f ? 0.15 : 0.13);
      const w = f ? 0.15 : 0.13;
      const strip = (y0: number, y1: number) => smooth(OP).filter((v) => v.y > y0 && v.y < y1).map((v) => new THREE.Vector2(v.x + 0.007, v.y));
      mesh(ellip(new THREE.LatheGeometry(strip(0.14, 0.975), 10, a0, w)), embMat(1, f ? 3.2 : 2.4), { parent: lower, shadow: false });
      mesh(ellip(new THREE.LatheGeometry(strip(0.985, 1.43), 10, a0, w)), embMat(1, f ? 1.6 : 1.3), { parent: ub, shadow: false });
    }
    mesh(ellip(new THREE.TorusGeometry(0.1, 0.012, 8, 32)), trimMat, { p: [0, 1.46, 0], r: [Math.PI / 2, 0, 0], parent: ub, shadow: false });
    const hemTube = new THREE.TorusGeometry(radiusAt(OP, 0.12) * 0.995, 0.007, 6, 60, Math.PI * 2 - gap); hemTube.rotateX(Math.PI / 2); hemTube.rotateY(Math.PI + gap / 2 * 0 + 0);
    mesh(ellip(hemTube), trimMat, { p: [0, 0.125, 0], parent: lower, shadow: false });
    if (!f) { // شرابات ذهبية معلّقة على الصدر
      for (const sx of [-1, 1]) {
        const tg = new THREE.Group(); tg.position.set(sx * 0.2, 1.3, radiusAt(BISHT_P, 1.3) * EZ + 0.045); tg.rotation.y = sx * 0.3; ub.add(tg);
        mesh(new THREE.CapsuleGeometry(0.004, 0.17, 2, 5), trimMat, { p: [0, -0.1, 0], parent: tg, shadow: false });
        for (const y of [-0.1, -0.15]) mesh(G.sph, trimMat, { s: [0.014, 0.014, 0.014], p: [0, y, 0], parent: tg, shadow: false });
        mesh(new THREE.ConeGeometry(0.019, 0.07, 10), trimMat, { p: [0, -0.215, 0], parent: tg, shadow: false });
        for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; mesh(new THREE.CapsuleGeometry(0.0022, 0.06, 2, 4), trimMat, { p: [Math.cos(a) * 0.012, -0.275, Math.sin(a) * 0.012], parent: tg, shadow: false }); }
      }
    }
  }

  mesh(new THREE.CylinderGeometry(0.05, 0.058, 0.17, 16), skin, { p: [0, 1.5, 0], parent: ub });

  // ---------- الرأس ----------
  const head = new THREE.Group(); head.position.set(0, 1.69, 0); head.scale.setScalar(1.0); ub.add(head);
  const faceMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.5, sheen: 0.3, sheenColor: new THREE.Color('#ffb59f'), sheenRoughness: 0.6 });
  mesh(paintedHead(f, SKINS[look.s % SKINS.length]), faceMat, { parent: head });

  // ---------- عيون ثلاثية الأبعاد: كرة + قزحية + جفنان حقيقيان + رموش ----------
  const ER = EYE.R * (f ? 1.07 : 1);
  const irisGeo = new THREE.SphereGeometry(ER * 1.004, 40, 24, 0, Math.PI * 2, 0, 0.66); irisGeo.rotateX(Math.PI / 2);
  { // تدرّج القزحية بألوان الرؤوس: بؤبؤ ← حلقة لونية ← حافة داكنة
    const p = irisGeo.attributes.position, cl = new Float32Array(p.count * 3), cc = new THREE.Color();
    const pup = new THREE.Color('#050302'), inner = new THREE.Color('#c27a3a'), mid = new THREE.Color('#6a3a18'), edge = new THREE.Color('#1a0c05');
    for (let i = 0; i < p.count; i++) {
      const th = Math.acos(Math.min(1, p.getZ(i) / (ER * 1.004)));
      if (th < 0.2) cc.copy(pup); else if (th < 0.27) cc.copy(pup).lerp(inner, (th - 0.2) / 0.07); else if (th < 0.5) cc.copy(inner).lerp(mid, (th - 0.27) / 0.23); else cc.copy(mid).lerp(edge, (th - 0.5) / 0.16);
      cl[i * 3] = cc.r; cl[i * 3 + 1] = cc.g; cl[i * 3 + 2] = cc.b;
    }
    irisGeo.setAttribute('color', new THREE.BufferAttribute(cl, 3));
  }
  const scleraMat = new THREE.MeshPhysicalMaterial({ color: '#fbf7f3', roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.04 });
  const irisMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.03, emissive: '#2a1206', emissiveIntensity: 0.25 });
  const lidMat = new THREE.MeshPhysicalMaterial({ color: SKINS[look.s % SKINS.length], roughness: 0.5, sheen: 0.3, sheenColor: new THREE.Color('#ffb59f'), sheenRoughness: 0.6 });
  const lashMat = M(f ? '#0c0706' : '#140d09', { roughness: 0.6 });
  const upperLids: THREE.Group[] = [], eyeGroups: THREE.Group[] = [];
  const LIDL = 1.08;
  for (const sx of [-1, 1]) {
    const eg = new THREE.Group(); eg.position.set(sx * EYE.x, EYE.y, EYE.z); eg.rotation.z = sx * 0.07; eg.rotation.y = sx * 0.05; head.add(eg); eyeGroups.push(eg);
    mesh(new THREE.SphereGeometry(ER, 40, 28), scleraMat, { parent: eg, shadow: false });
    mesh(irisGeo, irisMat, { parent: eg, shadow: false });
    mesh(new THREE.SphereGeometry(ER * 0.2, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }), { p: [sx * -0.0035 + 0.009, 0.0105, ER * 1.02], parent: eg, shadow: false });
    mesh(new THREE.SphereGeometry(ER * 0.085, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }), { p: [sx * -0.0035 - 0.0075, -0.0105, ER * 1.015], parent: eg, shadow: false });
    // الجفن العلوي (غطاء كروي) على محور يدور للرمش
    const up = new THREE.Group(); eg.add(up); upperLids.push(up);
    mesh(new THREE.SphereGeometry(ER * 1.075, 40, 24, 0, Math.PI * 2, 0, LIDL), lidMat, { parent: up, shadow: false });
    // حافة الجفن (خط الرموش) — قوس يتبع حافة الغطاء
    const rr = ER * 1.075, pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 16; k++) {
      const a = -1.35 + (k / 16) * 2.7; const wing = f && k > 12 ? (k - 12) * 0.0035 : 0;
      pts.push(new THREE.Vector3(Math.sin(a) * rr * Math.sin(LIDL) * (1 + wing * 5) * sx * -1 * -1, Math.cos(LIDL) * rr + wing, Math.cos(a) * rr * Math.sin(LIDL)));
    }
    const lash = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 36, f ? 0.0033 : 0.0024, 6), lashMat, { parent: up, shadow: false });
    lash.scale.setScalar(1.0);
    if (f) for (let k = 3; k <= 15; k += 3) { const a = -1.2 + (k / 16) * 2.4; const base = new THREE.Vector3(Math.sin(a) * rr * Math.sin(LIDL), Math.cos(LIDL) * rr, Math.cos(a) * rr * Math.sin(LIDL)); const dir = base.clone().normalize().multiplyScalar(1).add(new THREE.Vector3(Math.sign(a) * 0.15, 0.55, 0.4)).normalize(); mesh(new THREE.CapsuleGeometry(0.0013, 0.012, 2, 4), lashMat, { p: [base.x + dir.x * 0.006, base.y + dir.y * 0.006, base.z + dir.z * 0.006], r: [dir.z * 0.9, 0, -dir.x * 1.3], parent: up, shadow: false }); }
    // الجفن السفلي ثابت
    mesh(new THREE.SphereGeometry(ER * 1.07, 36, 20, 0, Math.PI * 2, Math.PI - 1.12, 1.12), lidMat, { parent: eg, shadow: false });
  }
  const mouth = new THREE.Group(); mouth.position.set(0, -0.073, 0.128); head.add(mouth);
  const openM = mesh(G.sph, M('#3a0b10', { roughness: 0.5 }), { s: [0.026, 0.026, 0.01], p: [0, 0, -0.002], parent: mouth, shadow: false }); openM.visible = false;
  const teeth = mesh(new THREE.BoxGeometry(0.038, 0.008, 0.004), M('#fbfbf5'), { p: [0, 0.007, 0.003], parent: mouth, shadow: false }); teeth.visible = false;
  const browsDummy: THREE.Mesh[] = [];

  // ---------- الشعر واللحية ----------
  const hairMat = new THREE.MeshStandardMaterial({ color: '#17110d', roughness: 0.78, side: THREE.DoubleSide });
  const bare = look.hr === 9; // وضع الاختبار: رأس عاري
  const covered = !f && look.h <= 2;
  if (!f) {
    if (!covered && !bare) mesh(baseHead(f), capMaterial(hairMat, HAIR_CUT), { s: [1.05, 1.04, 1.05], p: [0, 0.006, -0.004], parent: head });
    if (look.h === 5) {
      if (look.hr === 1) mesh(G.sph, hairMat, { s: [0.085, 0.034, 0.055], p: [0.045, 0.158, 0.098], r: [0.5, 0, -0.55], parent: head, shadow: false });
      if (look.hr === 2) for (let i = 0; i < 30; i++) { const a = i * 2.4, r = 0.1 + (i % 3) * 0.022; mesh(G.sph, hairMat, { s: [0.047, 0.047, 0.047], p: [Math.cos(a) * r, 0.1 + (i % 5) * 0.024, Math.sin(a) * r - 0.025], parent: head }); }
    }
    if (look.b > 0) mesh(beardGeometry(look.b), hairMat, { parent: head });
  }

  // ---------- غطاء الرأس ----------
  const tail = new THREE.Group(); tail.visible = false; head.add(tail);
  if (f) {
    const col = SHAYLAS[look.sc % SHAYLAS.length];
    const shBase = new THREE.MeshStandardMaterial({ color: col, roughness: 0.86, side: THREE.DoubleSide });
    if (bare) { /* اختبار */ } else if (look.h >= 0) {
      mesh(hijabGeometry(), new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.85, sheen: 0.6, sheenColor: new THREE.Color(col).lerp(new THREE.Color('#ffffff'), 0.4), bumpMap: BUMP, bumpScale: 0.4, side: THREE.DoubleSide }), { parent: head });
    } else {
      mesh(baseHead(f), capMaterial(shBase, FACE_OPEN), { s: [1.07, 1.06, 1.09], p: [0, 0.01, -0.016], parent: head });
      for (const [Rr, t, y, tilt] of [[0.15, 0.024, 0.12, 0.18], [0.125, 0.024, 0.17, -0.1]] as [number, number, number, number][]) mesh(new THREE.TorusGeometry(Rr, t, 12, 36), shBase, { p: [0, y, -0.01], r: [Math.PI / 2 + tilt, 0, 0], parent: head });
      mesh(SHAYLA_DRAPE, shBase, { p: [0, -1.704, -0.05], s: [1 / 0.86, 1 / 0.86, 1 / 0.86], parent: head });
    }
  } else if (look.h <= 2) {
    const kind = look.h === 0 ? 'red' : look.h === 1 ? 'white' : 'black';
    mesh(shemaghGeometry(), new THREE.MeshStandardMaterial({ map: clothTex(kind), roughness: 0.92, side: THREE.DoubleSide }), { parent: head });
    for (const [y, rr] of [[0.108, 0.148], [0.146, 0.138]] as [number, number][]) { const ag = mesh(new THREE.TorusGeometry(rr, 0.02, 12, 44), M('#0d0b0c', { roughness: 0.45 }), { p: [0, y, -0.012], r: [Math.PI / 2 - 0.1, 0, 0], parent: head }); ag.scale.set(1.0, 1.06, 1); }
  } else if (look.h === 3) {
    const clothMat = M('#ffffff', { map: clothTex('red'), roughness: 0.9 });
    for (const [Rr, t, y, tilt] of [[0.158, 0.05, 0.128, 0.1], [0.138, 0.048, 0.185, -0.1], [0.105, 0.046, 0.232, 0.12]] as [number, number, number, number][]) {
      const ring = mesh(new THREE.TorusGeometry(Rr, t, 14, 36), clothMat, { p: [0, y, -0.005], r: [Math.PI / 2 + tilt, 0, 0], parent: head }); ring.scale.set(1, 1.03, 1);
    }
    mesh(G.sph, clothMat, { s: [0.125, 0.08, 0.125], p: [0, 0.262, -0.01], parent: head });
    tail.position.set(0.12, 0.12, 0.03); tail.visible = true;
    mesh(new THREE.BoxGeometry(0.085, 0.4, 0.016, 2, 6, 1), clothMat, { p: [0, -0.2, 0], r: [0.05, 0, 0.04], parent: tail });
  } else if (look.h === 4) {
    mesh(new THREE.SphereGeometry(1, 24, 14, 0, Math.PI * 2, 0, 1.2), M('#fdfbf5', { roughness: 0.9 }), { s: [0.158, 0.185, 0.165], p: [0, 0.02, -0.008], parent: head });
    mesh(new THREE.TorusGeometry(0.152, 0.007, 6, 40), M('#d7ccb4'), { p: [0, 0.095, -0.01], r: [Math.PI / 2 - 0.05, 0, 0], parent: head, shadow: false });
  }

  if (look.gl > 0) {
    const fr = M('#15110f', { roughness: 0.3, metalness: 0.5 });
    for (const sx of [-1, 1]) {
      if (look.gl === 1) { mesh(new THREE.TorusGeometry(0.052, 0.0035, 8, 36), fr, { p: [sx * 0.062, 0.006, 0.152], parent: head, shadow: false }); mesh(new THREE.CircleGeometry(0.052, 32), new THREE.MeshPhysicalMaterial({ color: '#cfe6ff', transparent: true, opacity: 0.1, roughness: 0.05, clearcoat: 1, depthWrite: false }), { p: [sx * 0.062, 0.006, 0.152], parent: head, shadow: false }); }
      else mesh(new THREE.CylinderGeometry(0.054, 0.054, 0.006, 32), new THREE.MeshPhysicalMaterial({ color: '#0b0b10', roughness: 0.08, metalness: 0.3, clearcoat: 1 }), { p: [sx * 0.062, 0.006, 0.154], r: [Math.PI / 2, 0, 0], parent: head, shadow: false });
    }
    mesh(new THREE.TorusGeometry(0.014, 0.0032, 6, 14, Math.PI), fr, { p: [0, 0.014, 0.152], r: [0, 0, 0], parent: head, shadow: false });
    for (const sx of [-1, 1]) mesh(new THREE.CapsuleGeometry(0.0032, 0.14, 2, 6), fr, { p: [sx * 0.114, 0.01, 0.082], r: [Math.PI / 2, 0, 0], parent: head, shadow: false });
  }

  // ---------- الذراعان ----------
  const arms: { sh: THREE.Group; el: THREE.Group }[] = [];
  const hands: { open: THREE.Mesh; fist: THREE.Mesh }[] = [];
  const upperR = f ? 0.052 : outerOn ? 0.06 : 0.047, innerR = f ? 0.04 : 0.044;
  for (const sx of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(sx * 0.25, 1.4, 0); ub.add(sh);
    mesh(G.sph, outerMat, { s: [upperR * 1.04, upperR * 1.04, upperR * 1.04], parent: sh });
    mesh(new THREE.CylinderGeometry(upperR * 1.08, upperR * (outerOn ? 1.55 : 1.0), 0.34, 22, 6), outerMat, { p: [0, -0.17, 0], parent: sh });
    const el = new THREE.Group(); el.position.set(0, -0.33, 0); sh.add(el);
    mesh(G.sph, outerOn ? outerMat : dress, { s: [upperR * 1.1, upperR * 1.1, upperR * 1.1], parent: el });
    if (outerOn) {
      // كم داخلي أبيض يظهر عند المعصم + كم خارجي واسع بشريط تطريز
      mesh(new THREE.CylinderGeometry(innerR * 1.02, innerR * 0.9, 0.33, 18, 3), dress, { p: [0, -0.165, 0], parent: el });
      mesh(new THREE.TorusGeometry(innerR * 0.92, 0.009, 6, 16), stitch, { p: [0, -0.3, 0], r: [Math.PI / 2, 0, 0], parent: el, shadow: false });
      mesh(new THREE.CylinderGeometry(upperR * 1.5, upperR * 1.95, 0.22, 22, 3), outerMat, { p: [0, -0.115, 0], parent: el });
      mesh(new THREE.CylinderGeometry(upperR * 1.96, upperR * 1.98, 0.075, 24, 1, true), embMat(2, 1), { p: [0, -0.2, 0], parent: el, shadow: false });
      mesh(new THREE.TorusGeometry(upperR * 1.97, 0.008, 6, 24), trimMat, { p: [0, -0.228, 0], r: [Math.PI / 2, 0, 0], parent: el, shadow: false });
    } else {
      mesh(new THREE.CylinderGeometry(innerR * 1.02, innerR * 0.9, 0.3, 20, 4), dress, { p: [0, -0.15, 0], parent: el });
      mesh(new THREE.TorusGeometry(innerR * 0.93, 0.011, 8, 18), stitch, { p: [0, -0.295, 0], r: [Math.PI / 2, 0, 0], parent: el, shadow: false });
      mesh(new THREE.TorusGeometry(innerR * 0.93, 0.008, 6, 18), dress, { p: [0, -0.27, 0], r: [Math.PI / 2, 0, 0], parent: el, shadow: false });
    }
    const hand = new THREE.Group(); hand.position.set(0, -0.325, 0.004); el.add(hand);
    const open = mesh(handGeometry(), skin, { parent: hand });
    const fist = mesh(fistGeometry(), skin, { parent: hand }); fist.visible = false;
    if (sx < 0) { open.scale.x = -1; fist.scale.x = -1; }
    hands.push({ open, fist });
    arms.push({ sh, el });
  }
  if (look.w) {
    const el = arms[1].el;
    mesh(new THREE.TorusGeometry(0.047, 0.008, 8, 20), M('#15110f', { roughness: 0.5 }), { p: [0, -0.31, 0], r: [Math.PI / 2, 0, 0], parent: el, shadow: false });
    mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.01, 20), M('#c9a24a', { metalness: 0.9, roughness: 0.25 }), { p: [0.052, -0.31, 0], r: [0, 0, Math.PI / 2], parent: el, shadow: false });
  }

  // ---------- الأحذية + أرجل الجلوس ----------
  const shoes: THREE.Group[] = [];
  for (const sx of [-1, 1]) { const s = makeShoe(look.sh, f, skin); s.position.set(sx * 0.09, 0, 0.03); root.add(s); shoes.push(s); }
  const legs = new THREE.Group(); legs.visible = false; body.add(legs);
  for (const sx of [-1, 1]) {
    mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.42, 16), outerOn && f ? outerMat : dress, { p: [sx * 0.2, 0.2, 0.2], r: [Math.PI / 2 - 0.1, 0, sx * 0.35], parent: legs });
    mesh(G.sph, outerOn && f ? outerMat : dress, { s: [0.095, 0.085, 0.095], p: [sx * 0.29, 0.2, 0.38], parent: legs });
  }

  // ---------- الشنطة ----------
  const leather = M('#c07a3a', { roughness: 0.62 });
  if (look.bag === 1 && f) { // شنطة توت على الكتف
    const bagG = new THREE.Group(); bagG.position.set(0.34, 0.86, 0.03); ub.add(bagG);
    mesh(new THREE.BoxGeometry(0.2, 0.26, 0.08), leather, { parent: bagG });
    mesh(new THREE.BoxGeometry(0.2, 0.012, 0.082), M('#a8642a'), { p: [0, 0.126, 0], parent: bagG, shadow: false });
    mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.004, 12), M('#e6c27a', { metalness: 0.8 }), { p: [0, 0.085, 0.042], r: [Math.PI / 2, 0, 0], parent: bagG, shadow: false });
    mesh(new THREE.BoxGeometry(0.05, 0.03, 0.004), M('#e6c27a', { metalness: 0.7 }), { p: [0, -0.02, 0.042], parent: bagG, shadow: false });
    for (const z of [-0.025, 0.025]) {
      const c = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.05, 0.13, z), new THREE.Vector3(-0.07, 0.3, z * 0.6), new THREE.Vector3(-0.08, 0.52, 0.0), new THREE.Vector3(0.0, 0.58, 0.0), new THREE.Vector3(0.04, 0.3, z * 0.6), new THREE.Vector3(0.05, 0.13, z)]);
      mesh(new THREE.TubeGeometry(c, 20, 0.0085, 6), M('#a8642a', { roughness: 0.6 }), { parent: bagG, shadow: false });
    }
  } else if (look.bag === 1) {
    const bagG = new THREE.Group(); bagG.position.set(0.33, 0.9, 0.05); ub.add(bagG);
    mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.24, 18), leather, { parent: bagG });
    mesh(new THREE.TorusGeometry(0.1, 0.01, 8, 20), M('#8a4a14'), { p: [0, 0.12, 0], r: [Math.PI / 2, 0, 0], parent: bagG, shadow: false });
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.2, 1.44, 0.02), new THREE.Vector3(-0.11, 1.3, 0.17), new THREE.Vector3(0.1, 1.13, 0.2), new THREE.Vector3(0.27, 1.03, 0.13), new THREE.Vector3(0.33, 1.02, 0.05)]);
    mesh(new THREE.TubeGeometry(curve, 24, 0.014, 6), M('#8a4a14', { roughness: 0.7 }), { parent: ub, shadow: false });
  } else if (look.bag === 2) {
    const bg = new THREE.Group(); bg.position.set(0, -0.34, 0.1); arms[0].el.add(bg);
    mesh(new THREE.BoxGeometry(0.22, 0.17, 0.09), f ? M('#f1e8d4', { roughness: 0.45 }) : leather, { p: [0, -0.1, 0.02], parent: bg });
    mesh(new THREE.TorusGeometry(0.07, 0.008, 8, 18, Math.PI), gold, { p: [0, -0.02, 0.02], parent: bg, shadow: false });
  }

  // ---------- الحركة ----------
  const st = { phase: Math.random() * 6, blend: 0, run: 0, sit: 0, sitT: 0, blink: 2 + Math.random() * 3, blinkT: 0, t: Math.random() * 10, em: null as null | { n: EmoteName; t: number; d: number }, expr: 'smile' as Expression, exprT: 0 };
  const lerp = THREE.MathUtils.lerp;
  const applyExpr = () => {
    openM.visible = st.expr !== 'smile'; teeth.visible = st.expr === 'laugh';
    openM.scale.set(st.expr === 'surprise' ? 0.014 : 0.027, st.expr === 'surprise' ? 0.02 : 0.016, 0.01);
  };
  applyExpr();

  const api: BuiltAvatar = {
    group: root,
    get sitting() { return st.sitT > 0.5; },
    setSit(v) { st.sitT = v ? 1 : 0; },
    setExpression(e) { st.expr = e; st.exprT = 2.5; applyExpr(); },
    emote(n) {
      st.em = { n, t: 0, d: n === 'clap' ? 3 : n === 'thumb' ? 2.2 : 2.4 };
      api.setExpression(n === 'clap' || n === 'wave' ? 'laugh' : 'smile');
    },
    update(dt, moving, speed) {
      const run = speed > 1.2 ? 1 : 0;
      st.blend += ((moving ? 1 : 0) - st.blend) * Math.min(1, dt * 9);
      st.run += (run * (moving ? 1 : 0) - st.run) * Math.min(1, dt * 6);
      st.sit += (st.sitT - st.sit) * Math.min(1, dt * 7);
      st.phase += dt * (moving ? lerp(8.5, 12.5, st.run) : 0);
      st.t += dt;
      if (st.exprT > 0 && (st.exprT -= dt) <= 0) { st.expr = 'smile'; applyExpr(); }
      const w = Math.sin(st.phase), b = st.blend, sit = st.sit;
      const breathe = Math.sin(st.t * 1.8) * (1 - b);
      let e = 0, en: EmoteName = 'wave';
      if (st.em) { st.em.t += dt; if (st.em.t >= st.em.d) st.em = null; else { e = Math.sin(Math.PI * Math.min(1, st.em.t / st.em.d)) ** 0.5; en = st.em.n; } }

      body.position.y = Math.abs(Math.cos(st.phase)) * lerp(0.03, 0.06, st.run) * b + breathe * 0.004;
      body.rotation.z = w * 0.02 * b;
      lower.scale.set(1 + 0.45 * sit, 1 - 0.74 * sit, 1 + 0.45 * sit);
      U.position.y = lerp(HIP, 0.27, sit) + breathe * 0.003;
      legs.visible = sit > 0.35; legs.scale.setScalar(Math.max(0.01, sit));
      U.rotation.x = lerp(0.05, 0.2, st.run) * b + 0.08 * sit;
      head.rotation.y = Math.sin(st.t * 0.6) * 0.12 * (1 - b); head.rotation.x = -0.04 * b + Math.sin(st.t * 0.9) * 0.02 * (1 - b);
      head.rotation.z = -w * 0.02 * b;
      const swing = lerp(0.65, 1.1, st.run) * b;
      let r0x = w * swing, r1x = -w * swing, r0z = 0.07, r1z = -0.07;
      let e0 = -0.2 - Math.max(0, -w) * lerp(0.4, 1.5, st.run) * b, e1 = -0.2 - Math.max(0, w) * lerp(0.4, 1.5, st.run) * b;
      r0x = lerp(r0x, -0.75, sit); r1x = lerp(r1x, -0.75, sit); e0 = lerp(e0, -0.55, sit); e1 = lerp(e1, -0.55, sit);
      let bow = 0, headBow = 0;
      if (e > 0) {
        if (en === 'wave') { r1z = lerp(r1z, -2.55 + Math.sin(st.t * 14) * 0.18, e); r1x = lerp(r1x, 0, e); e1 = lerp(e1, -0.35 + Math.sin(st.t * 14) * 0.5, e); }
        else if (en === 'chest') { r1x = lerp(r1x, -0.55, e); r1z = lerp(r1z, 0.25, e); e1 = lerp(e1, -2.1, e); headBow = 0.3 * e; bow = 0.12 * e; }
        else if (en === 'clap') { const c = Math.sin(st.t * 15); r0x = lerp(r0x, -1.05, e); r1x = lerp(r1x, -1.05, e); r0z = lerp(r0z, -0.18 + c * 0.1, e); r1z = lerp(r1z, 0.18 - c * 0.1, e); e0 = lerp(e0, -1.0, e); e1 = lerp(e1, -1.0, e); }
        else if (en === 'nose') { bow = 0.4 * e; headBow = 0.25 * e; r1x = lerp(r1x, -0.4, e); e1 = lerp(e1, -1.6, e); }
        else if (en === 'thumb') { r1x = lerp(r1x, -0.9, e); r1z = lerp(r1z, -0.15, e); e1 = lerp(e1, -1.25 + Math.sin(st.t * 10) * 0.1, e); }
      }
      U.rotation.x += bow; head.rotation.x += headBow;
      arms[0].sh.rotation.x = r0x; arms[1].sh.rotation.x = r1x; arms[0].sh.rotation.z = r0z; arms[1].sh.rotation.z = r1z; arms[0].el.rotation.x = e0; arms[1].el.rotation.x = e1;
      const fistOn = e > 0.15 && en === 'thumb'; hands[1].open.visible = !fistOn; hands[1].fist.visible = fistOn;
      const lift = (v: number) => Math.max(0, v) * lerp(0.09, 0.16, st.run) * b;
      const stride = lerp(0.15, 0.24, st.run);
      for (let i = 0; i < 2; i++) {
        const sgn = i === 0 ? 1 : -1;
        shoes[i].position.z = lerp(0.03 + sgn * w * stride * b, 0.46, sit);
        shoes[i].position.x = lerp((i === 0 ? -1 : 1) * 0.09, (i === 0 ? -1 : 1) * 0.1, sit);
        shoes[i].position.y = lerp(lift(sgn * Math.cos(st.phase)), 0.02, sit);
        shoes[i].rotation.y = (i === 0 ? -1 : 1) * 0.35 * sit;
      }
      tail.rotation.z = 0.04 + Math.sin(st.t * 2 + st.phase) * 0.05 + b * 0.12; tail.rotation.x = b * 0.15;
      st.blink -= dt; if (st.blink <= 0) { st.blinkT = 0.14; st.blink = 2.5 + Math.random() * 3.5; }
      let closed = 0;
      if (st.blinkT > 0) { st.blinkT -= dt; closed = Math.sin((1 - st.blinkT / 0.14) * Math.PI); }
      const lidOpen = st.expr === 'surprise' ? -0.3 : st.expr === 'laugh' ? 0.28 : 0;
      const lidRot = lerp(lidOpen, 0.78, closed);
      upperLids.forEach((u) => { u.rotation.x = lidRot; });
      void eyeGroups; void browsDummy;
    },
  };
  return api;
}
