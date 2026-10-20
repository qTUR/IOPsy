// وجهان منحوتان من الصفر (رجل / امرأة) بأسلوب أفلام الأنيميشن: جمجمة مدوّرة، خدود ممتلئة،
// أنف صغير، شفتان مجسّمتان، تجويف عين حقيقي (العين كرة + جفون تُبنى في avatarBuilder).
import * as THREE from 'three';
import { SDF, capsule, ellipsoid, smax, smin, surfaceNets } from './sdf';

export const EYE = { x: 0.062, y: 0.006, z: 0.09, R: 0.04 };

export function makeHeadSdf(female: boolean): SDF {
  const jawW = female ? 0.082 : 0.1, chinW = female ? 0.028 : 0.04;
  const R = EYE.R * (female ? 1.06 : 1);
  return (x, y, z) => {
    const ax = Math.abs(x);
    let d = ellipsoid(x, y, z, 0, 0.032, -0.01, 0.14, 0.136, 0.14);                  // الجمجمة المدوّرة
    d = smin(d, ellipsoid(x, y, z, 0, -0.04, 0.03, 0.128, 0.1, 0.11), 0.06);          // منتصف الوجه
    d = smin(d, ellipsoid(ax, y, z, 0.078, -0.052, 0.066, 0.054, 0.05, 0.052), 0.05); // الخدود الممتلئة
    d = smin(d, ellipsoid(x, y, z, 0, -0.085, 0.04, jawW, 0.056, 0.082), 0.05);       // الفك
    d = smin(d, ellipsoid(x, y, z, 0, -0.117, 0.06, chinW, 0.027, 0.032), 0.03);      // الذقن
    d = smin(d, ellipsoid(x, y, z, 0, 0.052, 0.108, 0.1, 0.018, 0.036), 0.03);        // نتوء الحاجبين
    // أنف صغير: جسر + طرف + جناحان
    d = smin(d, ellipsoid(x, y, z, 0, 0.002, 0.123, 0.0072, 0.02, 0.011), 0.02);
    d = smin(d, ellipsoid(x, y, z, 0, -0.03, 0.138, 0.0125, 0.0105, 0.0125), 0.016);
    d = smin(d, ellipsoid(ax, y, z, 0.0122, -0.034, 0.128, 0.0072, 0.0068, 0.0078), 0.009);
    // الأذنان
    d = smin(d, ellipsoid(ax, y, z, 0.138, -0.01, -0.01, 0.011, 0.028, 0.021), 0.018);
    // الشفتان
    d = smin(d, ellipsoid(x, y, z, 0, -0.066, 0.125, female ? 0.03 : 0.029, 0.0074, 0.011), 0.008);
    d = smin(d, ellipsoid(x, y, z, 0, -0.079, 0.122, female ? 0.0245 : 0.0235, 0.0094, 0.012), 0.008);
    // خط الفم المبتسم
    const g1 = capsule(x, y, z, -0.038, -0.0605, 0.125, 0, -0.0705, 0.139, 0.0022);
    const g2 = capsule(x, y, z, 0.038, -0.0605, 0.125, 0, -0.0705, 0.139, 0.0022);
    d = smax(d, -Math.min(g1, g2), 0.003);
    // محجر العين
    d = smax(d, -ellipsoid(ax, y, z, EYE.x, EYE.y, EYE.z + 0.014, R + 0.004, R * 1.03 + 0.004, R + 0.003), 0.004);
    return d;
  };
}

const geoCache = new Map<string, THREE.BufferGeometry>();
export function baseHead(female: boolean) {
  const k = female ? 'f' : 'm';
  if (!geoCache.has(k)) geoCache.set(k, surfaceNets(makeHeadSdf(female), [-0.18, -0.17, -0.18], [0.18, 0.2, 0.18], [108, 112, 108]));
  return geoCache.get(k)!;
}

const sstep = (a: number, b: number, v: number) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

/** نسخة من الوجه بألوان رؤوس: بشرة + حاجب مرسوم + شفتان + خدود + فتحتا الأنف */
export function paintedHead(female: boolean, skinHex: string): THREE.BufferGeometry {
  const g = baseHead(female).clone();
  const p = g.attributes.position, col = new Float32Array(p.count * 3);
  const skin = new THREE.Color(skinHex);
  const lipC = new THREE.Color(female ? '#c24f5d' : '#b46a5c');
  const blush = new THREE.Color(female ? '#e57a78' : '#e3907a');
  const browC = new THREE.Color(female ? '#2a1913' : '#15100c');
  const dark = new THREE.Color('#6a3524');
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), ax = Math.abs(x);
    c.copy(skin);
    // خدود
    const bd = Math.hypot((ax - 0.084) / 0.036, (y + 0.046) / 0.027, (z - 0.09) / 0.07);
    c.lerp(blush, (1 - sstep(0.6, 1.1, bd)) * (female ? 0.4 : 0.26));
    // شفتان
    const ld = Math.hypot(x / 0.036, (y + 0.0715) / 0.0165);
    if (z > 0.1) c.lerp(lipC, (1 - sstep(0.8, 1.05, ld)) * (female ? 0.95 : 0.7));
    // خط الفم المبتسم + غمازتا الزاويتين
    if (z > 0.1) {
      const ym = -0.0705 + 0.0105 * Math.pow(Math.min(1, ax / 0.038), 1.6);
      if (ax < 0.042) c.lerp(new THREE.Color('#4a1d17'), (1 - sstep(0.0016, 0.0042, Math.abs(y - ym))) * (1 - sstep(0.034, 0.042, ax)) * 0.55);
      c.lerp(dark, (1 - sstep(0.002, 0.0045, Math.hypot(ax - 0.044, y + 0.0585))) * 0.5);
    }
    // فتحتا الأنف
    if (z > 0.11) c.lerp(dark, (1 - sstep(0.5, 1, Math.hypot((ax - 0.0075) / 0.006, (y + 0.041) / 0.005))) * 0.7);
    // حاجب لطيف: يبدأ مرتفعًا قليلًا عند الأنف ثم يقوّس للأعلى ويدق عند الطرف
    if (z > 0.05) {
      const u = Math.min(1, Math.max(0, (ax - 0.018) / 0.094));
      const yb = (female ? 0.066 : 0.063) + 0.009 * Math.sin(u * Math.PI * 0.95 + 0.25) - 0.006 * u * u;
      const th = (female ? 0.0052 : 0.0086) * (1 - 0.6 * u * u) * (0.8 + 0.2 * Math.cos(u * 3));
      const along = sstep(0.0, 0.05, u + 0.03) * (1 - sstep(0.9, 1.0, u));
      c.lerp(browC, (1 - sstep(0.5, 1.2, Math.abs(y - yb) / Math.max(th, 1e-4))) * along * (ax > 0.016 ? 1 : 0));
    }
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

/** لحية منحوتة كقشرة ناعمة تلتف حول الفك (بدل القصّ بالمظلّلات): 1 سكسوكة، 2 كاملة، 3 شارب، 4 كثيفة */
const beardCache = new Map<number, THREE.BufferGeometry>();
export function beardGeometry(style: number) {
  if (beardCache.has(style)) return beardCache.get(style)!;
  const head = makeHeadSdf(false);
  const thick = style === 4 ? 0.013 : style === 2 ? 0.009 : 0.0075;
  const region: SDF = (x, y, z) => {
    const ax = Math.abs(x);
    const must = ellipsoid(x, y, z, 0, -0.054, 0.135, 0.036, 0.011, 0.02);                       // شارب
    const goatee = ellipsoid(x, y, z, 0, -0.118, 0.07, 0.036, 0.04, 0.04);                       // سكسوكة
    let full = ellipsoid(x, y, z, 0, -0.075, 0.03, 0.15, 0.095, 0.13);                           // اللحية الكاملة
    full = smax(full, y - (-0.04 + Math.max(0, ax - 0.098) * 1.6), 0.02);                         // خط السوالف يرتفع جانبًا
    full = smax(full, -ellipsoid(x, y, z, 0, -0.07, 0.15, 0.04, 0.022, 0.05), 0.012);             // فتحة الفم
    full = smax(full, -ellipsoid(x, y, z, 0, -0.02, 0.14, 0.05, 0.03, 0.05), 0.012);              // أسفل الأنف
    if (style === 1) return smin(goatee, must, 0.012);
    if (style === 3) return must;
    return smin(full, must, 0.012);
  };
  const shell: SDF = (x, y, z) => { const h = head(x, y, z); return Math.max(Math.max(h - thick, -h + 0.0015), region(x, y, z)); };
  const g = surfaceNets(shell, [-0.17, -0.2, -0.12], [0.17, 0.0, 0.2], [96, 70, 80]);
  beardCache.set(style, g); return g;
}
