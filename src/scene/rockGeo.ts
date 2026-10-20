import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** حجر/شجيرة ناعمة بتشوّه عضوي (بدون وجوه مسطّحة) */
export function organicGeo(seed: number, rough = 0.28, detail = 4, squash = 1) {
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g, 1e-4);
  const p = g.attributes.position; const v = new THREE.Vector3();
  const f = (x: number, y: number, z: number) => Math.sin(x * 2.3 + seed) * Math.cos(y * 2.9 + seed * 1.7) + Math.sin(z * 3.7 + seed * 0.6) * 0.6 + Math.sin((x + y + z) * 6.1) * 0.18;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const d = 1 + f(v.x, v.y, v.z) * rough;
    p.setXYZ(i, v.x * d, v.y * d * squash, v.z * d);
  }
  g.computeVertexNormals(); return g;
}
