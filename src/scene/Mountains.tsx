import { useMemo } from 'react';
import * as THREE from 'three';

/** جروف رملية بعيدة على شكل أطراف طويق: قمم مسطّحة وطبقات صخرية */
export default function Mountains() {
  const geo = useMemo(() => {
    const SEG = 360, ROWS = 26, R = 330;
    const pos: number[] = [], col: number[] = [], idx: number[] = [];
    const n = (a: number) => Math.sin(a * 3.1 + 1) * 0.55 + Math.sin(a * 7.3 + 2) * 0.3 + Math.sin(a * 17.9 + 4) * 0.15;
    const c1 = new THREE.Color('#9b6b47'), c2 = new THREE.Color('#c58d5c'), c3 = new THREE.Color('#e0b27c'), c = new THREE.Color();
    for (let j = 0; j <= ROWS; j++) {
      const t = j / ROWS;
      for (let i = 0; i <= SEG; i++) {
        const a = (i / SEG) * Math.PI * 2;
        const ridge = Math.max(0, n(a) * 0.9 + 0.35);
        const H = 22 + ridge * 62 + Math.sin(a * 41) * 2;
        const prof = 1 - Math.pow(1 - t, 2.4);
        const rr = R + (1 - t) * 40 + Math.sin(a * 23 + t * 3) * 6 * t + n(a * 2) * 12;
        const y = prof * H - 6;
        pos.push(Math.cos(a) * rr, y, Math.sin(a) * rr);
        const band = Math.sin(y * 0.9 + Math.sin(a * 9) * 2) * 0.5 + 0.5;
        c.copy(t < 0.45 ? c3.clone().lerp(c2, t / 0.45) : c2.clone().lerp(c1, (t - 0.45) / 0.55)).multiplyScalar(0.86 + band * 0.22);
        col.push(c.r, c.g, c.b);
      }
    }
    for (let j = 0; j < ROWS; j++) for (let i = 0; i < SEG; i++) {
      const a = j * (SEG + 1) + i, b = a + 1, d = a + SEG + 1, e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals(); return g;
  }, []);
  return <mesh geometry={geo}><meshStandardMaterial vertexColors roughness={1} side={THREE.DoubleSide} flatShading /></mesh>;
}
