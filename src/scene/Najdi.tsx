import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { duneHeight, colliders } from './terrain';
import * as F from './fabrics';
import { organicGeo } from './rockGeo';

function usePBR(name: 'stucco' | 'brick', repeat: [number, number], tint: string) {
  const [map, normalMap, roughnessMap] = useTexture([`/textures/${name}_albedo.jpg`, `/textures/${name}_normal.jpg`, `/textures/${name}_rough.jpg`]);
  return useMemo(() => {
    for (const t of [map, normalMap, roughnessMap]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = 8; }
    map.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ map, normalMap, roughnessMap, color: tint, roughness: 1, normalScale: new THREE.Vector2(1.2, 1.2) });
  }, [map, normalMap, roughnessMap, repeat, tint]);
}

const merlon = (() => { const g = new THREE.ConeGeometry(0.42, 0.8, 4); g.rotateY(Math.PI / 4); g.translate(0, 0.4, 0); return g; })();

/** مبنى طيني نجدي: جدران سميكة، شرفات مثلثة، نوافذ مثلثية، باب خشبي */
export function NajdiHouse({ position, size = [10, 7, 8], rotation = 0, tint = '#d9b98a', towers = 0 }: { position: [number, number]; size?: [number, number, number]; rotation?: number; tint?: string; towers?: number }) {
  const [w, h, d] = size;
  const mat = usePBR('stucco', [Math.max(1, w / 3), Math.max(1, h / 3)], tint);
  const y = duneHeight(position[0], position[1]) - 0.3;
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ map: F.wood('#4b2c18'), roughness: 0.85 }), []);
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a1b12', roughness: 1 }), []);
  const mer = useMemo(() => {
    const m: THREE.Matrix4[] = [], o = new THREE.Object3D();
    for (let x = -w / 2 + 0.5; x <= w / 2 - 0.4; x += 1.0) for (const z of [d / 2 - 0.25, -d / 2 + 0.25]) { o.position.set(x, h, z); o.updateMatrix(); m.push(o.matrix.clone()); }
    for (let z = -d / 2 + 1.5; z <= d / 2 - 1.4; z += 1.0) for (const x of [w / 2 - 0.25, -w / 2 + 0.25]) { o.position.set(x, h, z); o.updateMatrix(); m.push(o.matrix.clone()); }
    return m;
  }, [w, h, d]);
  const tri = useMemo(() => { const s = new THREE.Shape(); s.moveTo(-0.28, 0); s.lineTo(0.28, 0); s.lineTo(0, 0.7); return new THREE.ShapeGeometry(s); }, []);
  useMemo(() => {
    const c = Math.cos(rotation), s = Math.sin(rotation), hw = (Math.abs(w * c) + Math.abs(d * s)) / 2, hd = (Math.abs(w * s) + Math.abs(d * c)) / 2;
    colliders.boxes.push({ x0: position[0] - hw, x1: position[0] + hw, z0: position[1] - hd, z1: position[1] + hd });
  }, [position, rotation, w, d]);
  return (
    <group position={[position[0], y, position[1]]} rotation={[0, rotation, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow material={mat}><boxGeometry args={[w, h, d]} /></mesh>
      <instancedMesh args={[merlon, mat, mer.length]} castShadow ref={(im) => { if (im) { mer.forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true; } }} />
      {/* واجهة: باب ونوافذ مثلثية */}
      <mesh position={[0, 1.4, d / 2 + 0.05]} material={wood} castShadow><boxGeometry args={[1.8, 2.8, 0.12]} /></mesh>
      <mesh position={[0, 3.1, d / 2 + 0.06]} material={wood}><boxGeometry args={[2.2, 0.25, 0.2]} /></mesh>
      {Array.from({ length: Math.max(2, Math.floor(w / 1.9)) }, (_, i) => {
        const n = Math.max(2, Math.floor(w / 1.9));
        return <mesh key={i} geometry={tri} material={dark} position={[-w / 2 + 1.2 + (i * (w - 2.4)) / (n - 1), h - 1.8, d / 2 + 0.02]} />;
      })}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (w / 2 - 1.8), 2.4, d / 2 + 0.03]}>
          <mesh position={[0, 0, 0]} material={wood}><boxGeometry args={[1.0, 1.4, 0.1]} /></mesh>
          <mesh position={[0, 0, 0.06]}><planeGeometry args={[0.8, 1.2]} /><meshStandardMaterial color="#1a0f08" emissive="#ffb25a" emissiveIntensity={0.9} /></mesh>
        </group>
      ))}
      {towers > 0 && (
        <group position={[w / 2 - 1.6, 0, -d / 2 + 1.6]}>
          <mesh position={[0, (h + 4) / 2, 0]} castShadow material={mat}><boxGeometry args={[3.4, h + 4, 3.4]} /></mesh>
          {[[-1.3, 1.3], [1.3, 1.3], [-1.3, -1.3], [1.3, -1.3], [0, 1.5], [0, -1.5], [1.5, 0], [-1.5, 0]].map(([x, z], i) => <mesh key={i} geometry={merlon} material={mat} position={[x, h + 4, z]} castShadow />)}
        </group>
      )}
    </group>
  );
}

/** قلعة طينية على مشارف الواحة + بيوت متجاورة */
export function Village() {
  return (
    <>
      <NajdiHouse position={[-52, -52]} size={[16, 9, 11]} rotation={0.7} towers={1} tint="#d6b384" />
      <NajdiHouse position={[-66, -40]} size={[11, 6.5, 9]} rotation={0.55} tint="#e0c295" />
      <NajdiHouse position={[-42, -66]} size={[10, 7.5, 9]} rotation={0.85} tint="#cfa874" />
      <NajdiHouse position={[56, -50]} size={[13, 8, 10]} rotation={-0.7} tint="#d9b98a" towers={1} />
      <NajdiHouse position={[70, -36]} size={[10, 6, 8]} rotation={-0.6} tint="#e3c79c" />
      <NajdiHouse position={[-66, 48]} size={[12, 7, 9]} rotation={2.2} tint="#d6b384" />
    </>
  );
}

/** بئر ماء بجرّة ودلو */
export function Well({ position }: { position: [number, number] }) {
  const map = useTexture('/textures/brick_albedo.jpg'); const nm = useTexture('/textures/brick_normal.jpg');
  const mat = useMemo(() => { map.wrapS = map.wrapT = nm.wrapS = nm.wrapT = THREE.RepeatWrapping; map.repeat.set(4, 1); nm.repeat.set(4, 1); map.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map, normalMap: nm, roughness: 1, color: '#d8c4a0' }); }, [map, nm]);
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ map: F.wood('#5a3a22'), roughness: 0.9 }), []);
  useMemo(() => colliders.circles.push({ x: position[0], z: position[1], r: 1.4 }), [position]);
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow material={mat}><cylinderGeometry args={[1.15, 1.25, 1.1, 24, 1, true]} /></mesh>
      <mesh position={[0, 1.1, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat}><ringGeometry args={[0.95, 1.3, 24]} /></mesh>
      <mesh position={[0, 0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.95, 20]} /><meshStandardMaterial color="#0b1a22" roughness={0.1} metalness={0.4} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * 1.0, 1.7, 0]} rotation={[0, 0, s * -0.12]} castShadow material={wood}><boxGeometry args={[0.16, 3.2, 0.16]} /></mesh>)}
      <mesh position={[0, 3.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={wood}><cylinderGeometry args={[0.1, 0.1, 2.4, 10]} /></mesh>
      <mesh position={[0, 2.0, 0]} castShadow><cylinderGeometry args={[0.012, 0.012, 2.4, 5]} /><meshStandardMaterial color="#3a2a1a" /></mesh>
      <mesh position={[0, 0.9, 0]} castShadow><cylinderGeometry args={[0.2, 0.15, 0.3, 12]} /><meshStandardMaterial color="#6a4a2a" roughness={0.8} /></mesh>
    </group>
  );
}

/** صخور وشجيرات صحراوية موزّعة */
export function Scatter() {
  const { rocks, shrubs } = useMemo(() => {
    let s = 17; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const o = new THREE.Object3D();
    const rocks: THREE.Matrix4[] = [], shrubs: THREE.Matrix4[] = [];
    for (let i = 0; i < 90; i++) {
      const a = r() * Math.PI * 2, d = 14 + Math.pow(r(), 0.7) * 100, x = Math.cos(a) * d, z = Math.sin(a) * d;
      o.position.set(x, duneHeight(x, z) + 0.1, z); o.rotation.set(r() * 3, r() * 6, r() * 3); const sc = 0.25 + Math.pow(r(), 3) * 1.8; o.scale.set(sc * (1 + r()), sc * 0.7, sc * (1 + r())); o.updateMatrix(); rocks.push(o.matrix.clone());
    }
    for (let i = 0; i < 140; i++) {
      const a = r() * Math.PI * 2, d = 12 + r() * 95, x = Math.cos(a) * d, z = Math.sin(a) * d;
      o.position.set(x, duneHeight(x, z), z); o.rotation.set(0, r() * 6, 0); const sc = 0.4 + r() * 0.9; o.scale.set(sc, sc * (0.6 + r() * 0.6), sc); o.updateMatrix(); shrubs.push(o.matrix.clone());
    }
    return { rocks, shrubs };
  }, []);
  const set = (list: THREE.Matrix4[]) => (im: THREE.InstancedMesh | null) => { if (im) { list.forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true; } };
  const rockG = useMemo(() => organicGeo(2, 0.22, 4), []);
  const bushG = useMemo(() => organicGeo(7, 0.38, 3, 0.7), []);
  const nm = useTexture('/textures/brick_normal.jpg');
  useMemo(() => { nm.wrapS = nm.wrapT = THREE.RepeatWrapping; nm.repeat.set(2, 2); }, [nm]);
  return (
    <>
      <instancedMesh args={[rockG, undefined, rocks.length]} castShadow receiveShadow ref={set(rocks)}><meshStandardMaterial color="#9c8264" normalMap={nm} normalScale={new THREE.Vector2(1.4, 1.4)} roughness={1} /></instancedMesh>
      <instancedMesh args={[bushG, undefined, shrubs.length]} castShadow ref={set(shrubs)}><meshStandardMaterial color="#7d8442" roughness={1} /></instancedMesh>
    </>
  );
}

/** أعمدة فوانيس وحبال إضاءة حول الساحة */
export function LightPosts({ center = [0, 3] as [number, number], radius = 10 }) {
  const posts = useMemo(() => Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * Math.PI * 2 + 0.3; return [center[0] + Math.cos(a) * radius, center[1] + Math.sin(a) * radius] as [number, number]; }), [center, radius]);
  const bulbs = useMemo(() => {
    const m: THREE.Matrix4[] = [], o = new THREE.Object3D();
    posts.forEach((p, i) => {
      const q = posts[(i + 1) % posts.length]; const a = new THREE.Vector3(p[0], 3.35, p[1]), b = new THREE.Vector3(q[0], 3.35, q[1]);
      for (let k = 1; k < 18; k++) { const t = k / 18; o.position.lerpVectors(a, b, t); o.position.y -= Math.sin(t * Math.PI) * 0.9; o.updateMatrix(); m.push(o.matrix.clone()); }
    });
    return m;
  }, [posts]);
  const lines = useMemo(() => posts.map((p, i) => {
    const q = posts[(i + 1) % posts.length]; const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 18; k++) { const t = k / 18; pts.push(new THREE.Vector3(p[0] + (q[0] - p[0]) * t, 3.35 - Math.sin(t * Math.PI) * 0.9, p[1] + (q[1] - p[1]) * t)); }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }), [posts]);
  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a1d12', metalness: 0.7, roughness: 0.45 }), []);
  return (
    <>
      {posts.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1.75, 0]} castShadow material={metal}><cylinderGeometry args={[0.05, 0.09, 3.5, 10]} /></mesh>
          <mesh position={[0, 3.45, 0]}><cylinderGeometry args={[0.16, 0.22, 0.42, 8]} /><meshStandardMaterial color="#1a1008" emissive="#ffb35a" emissiveIntensity={3} /></mesh>
          <mesh position={[0, 3.75, 0]} material={metal}><coneGeometry args={[0.28, 0.26, 8]} /></mesh>
          {i % 2 === 0 && <pointLight position={[0, 3.4, 0]} color="#ffb468" intensity={26} distance={13} decay={2} />}
        </group>
      ))}
      {lines.map((g, i) => <line key={i}><primitive object={g} attach="geometry" /><lineBasicMaterial color="#1a120c" /></line>)}
      <instancedMesh args={[undefined, undefined, bulbs.length]} ref={(im) => { if (im) { bulbs.forEach((m, i) => { im.setMatrixAt(i, m); im.setColorAt(i, new THREE.Color().setHSL(0.09 + (i % 3) * 0.015, 1, 0.62)); }); im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; } }}>
        <sphereGeometry args={[0.085, 8, 6]} /><meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>
    </>
  );
}
