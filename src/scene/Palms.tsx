import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { colliders, duneHeight } from './terrain';
import { useGame } from '../store';
import * as F from './fabrics';

/** سعفة نخيل حقيقية: عرق مركزي + وريقات على الجانبين بانحناء وتدلٍّ */
function frondGeometry(len: number, droop: number) {
  const pos: number[] = [], col: number[] = [], idx: number[] = [];
  const SEG = 34;
  const P = (t: number) => new THREE.Vector3(0, t * 0.9 * len * 0.25 - droop * t * t * 0.55 * len * 0.25, t * len);
  const dark = new THREE.Color('#3f6a22'), mid = new THREE.Color('#6f9a34'), tip = new THREE.Color('#a5b94a'), c = new THREE.Color();
  let v = 0;
  const quad = (a: THREE.Vector3, b: THREE.Vector3, w: THREE.Vector3, ca: THREE.Color, cb: THREE.Color) => {
    const p = [a.clone().addScaledVector(w, -1), a.clone().addScaledVector(w, 1), b.clone().addScaledVector(w, 0.35), b.clone().addScaledVector(w, -0.35)];
    for (const q of p) pos.push(q.x, q.y, q.z);
    col.push(ca.r, ca.g, ca.b, ca.r, ca.g, ca.b, cb.r, cb.g, cb.b, cb.r, cb.g, cb.b);
    idx.push(v, v + 1, v + 2, v, v + 2, v + 3); v += 4;
  };
  for (let k = 0; k < SEG; k++) {
    const t = k / SEG, p0 = P(t), p1 = P(t + 1 / SEG), T = p1.clone().sub(p0).normalize();
    const ll = (0.12 + 0.62 * Math.sin(Math.PI * Math.min(1, Math.pow(t * 1.05 + 0.05, 0.8)))) * len * 0.34;
    for (const s of [-1, 1]) {
      const ang = 0.95 - t * 0.35;
      const D = new THREE.Vector3(s * Math.cos(ang) * 0.95, -0.28, Math.sin(ang)).normalize();
      const end = p0.clone().addScaledVector(D, ll); end.y -= ll * 0.22;
      const w = new THREE.Vector3(0, 0, 1).cross(D).normalize().multiplyScalar(0.03 + 0.012 * (1 - t));
      c.copy(dark).lerp(mid, t * 1.3); const ca = c.clone();
      c.copy(mid).lerp(tip, 0.35 + t * 0.4); const cb = c.clone();
      quad(p0, end, new THREE.Vector3(0, 1, 0).multiplyScalar(0.0).add(w), ca, cb);
    }
    // العرق المركزي
    const a = p0.clone(), b = p1.clone(), w = new THREE.Vector3(0.02, 0, 0);
    const rc = new THREE.Color('#7a7a3a');
    quad(a, b, w, rc, rc); void T;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}

function trunkTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256; const x = c.getContext('2d')!;
  x.fillStyle = '#6b5236'; x.fillRect(0, 0, 128, 256);
  let s = 9; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let j = 0; j < 16; j++) for (let i = 0; i < 6; i++) {
    const px = i * 22 + (j % 2) * 11, py = j * 16;
    x.fillStyle = `rgba(${40 + r() * 30},${28 + r() * 20},${16},.65)`;
    x.beginPath(); x.moveTo(px, py + 8); x.lineTo(px + 11, py); x.lineTo(px + 22, py + 8); x.lineTo(px + 11, py + 16); x.closePath(); x.fill();
    x.fillStyle = 'rgba(190,150,100,.25)'; x.fillRect(px + 8, py + 4, 6, 2);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 3); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

let shared: { fronds: THREE.BufferGeometry[]; tex: THREE.CanvasTexture; leaf: THREE.MeshStandardMaterial; wood: THREE.MeshStandardMaterial } | null = null;
function assets() {
  if (!shared) {
    const tex = trunkTexture();
    shared = {
      fronds: [frondGeometry(4.6, 1.6), frondGeometry(4.2, 1.9), frondGeometry(5.0, 1.3)],
      tex,
      leaf: new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.62, metalness: 0 }),
      wood: new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 1.2, roughness: 0.95 }),
    };
  }
  return shared;
}

export function Palm({ position, height = 7, seed = 1, lean = 0.1 }: { position: [number, number, number]; height?: number; seed?: number; lean?: number }) {
  const A = assets();
  const gfx = useGame((s) => s.settings.gfx), nF = gfx === 'high' ? 30 : gfx === 'low' ? 16 : 10;
  const { trunk, fronds, dates } = useMemo(() => {
    let s = seed * 9301 + 49297; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const g = new THREE.CylinderGeometry(0.2, 0.34, height, 18, 28);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / height + 0.5;
      p.setX(i, p.getX(i) + Math.sin(y * 2.4) * lean * height * 0.5);
      const ring = 1 + Math.sin(y * height * 9) * 0.02;
      p.setZ(i, p.getZ(i) * ring); p.setX(i, p.getX(i) * ring);
    }
    g.computeVertexNormals();
    const top = new THREE.Vector3(Math.sin(2.4) * lean * height * 0.5, height, 0);
    const list: { g: number; ry: number; rx: number; sc: number }[] = [];
    for (let i = 0; i < nF; i++) {
      const layer = i / nF, ring = i % 3;
      list.push({ g: Math.floor(r() * 3), ry: i * 2.399 + r() * 0.3, rx: -(0.75 - layer * 1.9) + r() * 0.2, sc: 0.9 + r() * 0.35 + (ring === 0 ? 0.1 : 0) });
    }
    const dateList = Array.from({ length: 16 }, () => new THREE.Vector3((r() - 0.5) * 0.7, -0.15 - r() * 0.5, (r() - 0.5) * 0.7));
    return { trunk: { g, top }, fronds: list, dates: dateList };
  }, [height, seed, lean, nF]);
  useEffect(() => { colliders.circles.push({ x: position[0], z: position[2], r: 0.5 }); }, [position]);
  return (
    <group position={position}>
      <mesh geometry={trunk.g} material={A.wood} position={[0, height / 2, 0]} castShadow receiveShadow />
      <group position={trunk.top}>
        {fronds.map((f, i) => (
          <mesh key={i} geometry={A.fronds[f.g]} material={A.leaf} rotation={[f.rx, f.ry, 0, 'YXZ']} scale={f.sc} castShadow />
        ))}
        {(gfx === 'high' ? dates : []).map((d, i) => <mesh key={i} position={d}><sphereGeometry args={[0.07, 8, 6]} /><meshStandardMaterial color="#8a4a1a" roughness={0.5} /></mesh>)}
      </group>
    </group>
  );
}

/** واحة نخيل */
export function PalmGrove() {
  const spots = useMemo(() => {
    const list: [number, number, number, number][] = [];
    const base: [number, number][] = [[26, -6], [30, 2], [24, 10], [34, -12], [29, 14], [37, 6], [22, -14], [33, 22], [40, -2], [-30, 12], [-34, 4], [-27, 20], [-38, 16], [-22, -26], [-30, -20]];
    base.forEach(([x, z], i) => list.push([x, z, 6 + (i % 4) * 1.1, i + 3]));
    return list;
  }, []);
  return <>{spots.map(([x, z, h, s]) => <Palm key={`${x}${z}`} position={[x, duneHeight(x, z), z]} height={h} seed={s} lean={0.05 + (s % 3) * 0.04} />)}</>;
}

/** سدر وسمر (شجر صحراوي بمظلة مسطحة) */
export function AcaciaTrees() {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5d7a35', roughness: 0.9 }), []);
  const bark = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a3524', roughness: 1 }), []);
  const spots: [number, number, number][] = [[-32, 34, 1], [16, -26, 1.2], [-36, -8, 0.9], [42, 18, 1.1], [-20, -34, 1]];
  useFrame(() => {});
  return (
    <>{spots.map(([x, z, s], i) => (
      <group key={i} position={[x, duneHeight(x, z), z]} scale={s}>
        <mesh castShadow position={[0, 1.4, 0]} rotation={[0, 0, 0.1]}><cylinderGeometry args={[0.12, 0.22, 2.8, 8]} /><primitive object={bark} attach="material" /></mesh>
        {[0, 1, 2, 3, 4].map((k) => <mesh key={k} castShadow position={[Math.cos(k * 1.9) * 1.1, 3.0 + (k % 2) * 0.3, Math.sin(k * 1.9) * 1.1]} scale={[1.5, 0.55, 1.5]}><icosahedronGeometry args={[1, 2]} /><primitive object={mat} attach="material" /></mesh>)}
      </group>
    ))}</>
  );
}
void F;
