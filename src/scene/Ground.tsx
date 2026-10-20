import { useMemo } from 'react';
import * as THREE from 'three';
import { duneHeight } from './terrain';
import { sandMaps } from './sand';

export default function Ground() {
  const { geo, maps } = useMemo(() => {
    const g = new THREE.PlaneGeometry(700, 700, 260, 260); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position; const cols: number[] = [];
    const a = new THREE.Color('#f3d9a8'), b = new THREE.Color('#d9a36a'), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), h = duneHeight(x, z); p.setY(i, h - 0.03);
      c.copy(a).lerp(b, Math.min(1, h / 14)).offsetHSL(0, 0, Math.sin(x * 0.21 + z * 0.13) * 0.018 + Math.sin(x * 0.05 - z * 0.07) * 0.02);
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.computeVertexNormals();
    return { geo: g, maps: sandMaps(190) };
  }, []);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors map={maps.map} normalMap={maps.normalMap} normalScale={new THREE.Vector2(0.8, 0.8)} roughness={0.96} metalness={0} />
    </mesh>
  );
}
