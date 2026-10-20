// نحت ناعم بالأشكال الضمنية (SDF) ثم استخراج سطح أملس بخوارزمية Surface Nets
import * as THREE from 'three';

export type SDF = (x: number, y: number, z: number) => number;

/** اتحاد ناعم (يدمج الأشكال كالصلصال) */
export const smin = (a: number, b: number, k: number) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
export const smax = (a: number, b: number, k: number) => -smin(-a, -b, k);

/** مسافة تقريبية إلى مجسّم ناقص */
export function ellipsoid(x: number, y: number, z: number, cx: number, cy: number, cz: number, rx: number, ry: number, rz: number) {
  const px = (x - cx) / rx, py = (y - cy) / ry, pz = (z - cz) / rz;
  const k0 = Math.hypot(px, py, pz);
  const k1 = Math.hypot(px / rx, py / ry, pz / rz);
  if (k1 < 1e-9) return -Math.min(rx, ry, rz);
  return (k0 * (k0 - 1)) / k1;
}
/** كبسولة بين نقطتين بنصف قطر متدرّج */
export function capsule(x: number, y: number, z: number, ax: number, ay: number, az: number, bx: number, by: number, bz: number, ra: number, rb = ra) {
  const pax = x - ax, pay = y - ay, paz = z - az, bax = bx - ax, bay = by - ay, baz = bz - az;
  const h = Math.min(1, Math.max(0, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz + 1e-12)));
  return Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h) - (ra + (rb - ra) * h);
}

export function surfaceNets(sdf: SDF, min: [number, number, number], max: [number, number, number], dims: [number, number, number]): THREE.BufferGeometry {
  const [nx, ny, nz] = dims;
  const sx = (max[0] - min[0]) / (nx - 1), sy = (max[1] - min[1]) / (ny - 1), sz = (max[2] - min[2]) / (nz - 1);
  const val = new Float32Array(nx * ny * nz);
  const at = (x: number, y: number, z: number) => (z * ny + y) * nx + x;
  for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) val[at(x, y, z)] = sdf(min[0] + x * sx, min[1] + y * sy, min[2] + z * sz);

  const cellV = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cid = (x: number, y: number, z: number) => (z * (ny - 1) + y) * (nx - 1) + x;
  const pos: number[] = [];
  const corner = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const cv = new Float32Array(8);
  for (let z = 0; z < nz - 1; z++) for (let y = 0; y < ny - 1; y++) for (let x = 0; x < nx - 1; x++) {
    let mask = 0;
    for (let i = 0; i < 8; i++) { const c = corner[i]; cv[i] = val[at(x + c[0], y + c[1], z + c[2])]; if (cv[i] < 0) mask |= 1 << i; }
    if (mask === 0 || mask === 255) continue;
    let px = 0, py = 0, pz = 0, cnt = 0;
    for (const [a, b] of edges) {
      const va = cv[a], vb = cv[b];
      if ((va < 0) === (vb < 0)) continue;
      const t = va / (va - vb), ca = corner[a], cb = corner[b];
      px += ca[0] + (cb[0] - ca[0]) * t; py += ca[1] + (cb[1] - ca[1]) * t; pz += ca[2] + (cb[2] - ca[2]) * t; cnt++;
    }
    cellV[cid(x, y, z)] = pos.length / 3;
    pos.push(min[0] + (x + px / cnt) * sx, min[1] + (y + py / cnt) * sy, min[2] + (z + pz / cnt) * sz);
  }

  const idx: number[] = [];
  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (flip) idx.push(a, c, b, a, d, c); else idx.push(a, b, c, a, c, d); };
  for (let z = 1; z < nz - 1; z++) for (let y = 1; y < ny - 1; y++) for (let x = 1; x < nx - 1; x++) {
    const v0 = val[at(x, y, z)] < 0;
    if (x < nx - 1 && v0 !== val[at(x + 1, y, z)] < 0) quad(cellV[cid(x, y - 1, z - 1)], cellV[cid(x, y, z - 1)], cellV[cid(x, y, z)], cellV[cid(x, y - 1, z)], v0);
    if (y < ny - 1 && v0 !== val[at(x, y + 1, z)] < 0) quad(cellV[cid(x - 1, y, z - 1)], cellV[cid(x - 1, y, z)], cellV[cid(x, y, z)], cellV[cid(x, y, z - 1)], v0);
    if (z < nz - 1 && v0 !== val[at(x, y, z + 1)] < 0) quad(cellV[cid(x - 1, y - 1, z)], cellV[cid(x, y - 1, z)], cellV[cid(x, y, z)], cellV[cid(x - 1, y, z)], v0);
  }

  // نورمالات ناعمة من تدرّج الـSDF
  const nrm = new Float32Array(pos.length); const e = Math.min(sx, sy, sz) * 0.6;
  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i], y = pos[i + 1], z = pos[i + 2];
    let gx = sdf(x + e, y, z) - sdf(x - e, y, z), gy = sdf(x, y + e, z) - sdf(x, y - e, z), gz = sdf(x, y, z + e) - sdf(x, y, z - e);
    const l = Math.hypot(gx, gy, gz) || 1; gx /= l; gy /= l; gz /= l; nrm[i] = gx; nrm[i + 1] = gy; nrm[i + 2] = gz;
  }
  // تصحيح اتجاه المثلثات حسب النورمال
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
    if (fx * nrm[a] + fy * nrm[a + 1] + fz * nrm[a + 2] < 0) { const tmp = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = tmp; }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  g.setIndex(idx);
  return g;
}
