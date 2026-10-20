import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import * as F from './fabrics';
import { colliders, zones } from './terrain';
import { player } from './Player';
import ProjectorScreen from './ProjectorScreen';

const HALF_W = 6.8, BACK = -4.4, FRONT = 4.8, RIDGE_Z = -0.5;
const roofY = (x: number, z: number) => {
  const base = z < RIDGE_Z ? 3.5 - (RIDGE_Z - z) * 0.38 : 3.5 - (z - RIDGE_Z) * 0.26;
  return base + 0.16 * Math.cos((x * Math.PI * 2) / 5) * (1 - Math.min(1, Math.abs(z - RIDGE_Z) / 5));
};
const CUSH = ['#8f1d1d', '#c88a2b', '#1f6f6b', '#5a2433', '#b8862f'];

function Roof({ fade }: { fade: React.MutableRefObject<THREE.MeshStandardMaterial | null> }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(HALF_W * 2, FRONT - BACK, 52, 26); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i) + (FRONT + BACK) / 2;
      p.setZ(i, z); p.setY(i, roofY(x, z));
    }
    g.computeVertexNormals(); return g;
  }, []);
  const map = useMemo(() => F.goatHair([7, 3]), []);
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial ref={fade} map={map} side={THREE.DoubleSide} roughness={0.95} transparent />
    </mesh>
  );
}

function GableWall({ side }: { side: -1 | 1 }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(BACK, 0); s.lineTo(FRONT, 0); s.lineTo(FRONT, roofY(side * HALF_W, FRONT) - 0.05);
    for (let z = FRONT; z >= BACK; z -= 0.4) s.lineTo(z, roofY(side * HALF_W, z) - 0.05);
    s.lineTo(BACK, 0);
    const g = new THREE.ShapeGeometry(s);
    const uv = g.attributes.uv, pos = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 6, pos.getY(i) / 3);
    return g;
  }, [side]);
  const map = useMemo(() => F.goatHair([2, 1]), []);
  return <mesh geometry={geo} rotation={[0, -Math.PI / 2, 0]} position={[side * HALF_W, 0, 0]} receiveShadow castShadow><meshStandardMaterial map={map} side={THREE.DoubleSide} roughness={0.95} /></mesh>;
}

function Lantern({ position, light = true }: { position: [number, number, number]; light?: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.01, 0.01, 1, 5]} /><meshStandardMaterial color="#2a1d12" /></mesh>
      <mesh><cylinderGeometry args={[0.16, 0.22, 0.46, 8]} /><meshStandardMaterial color="#1a1008" emissive="#ffb35a" emissiveIntensity={2.6} /></mesh>
      <mesh position={[0, 0.3, 0]}><coneGeometry args={[0.26, 0.22, 8]} /><meshStandardMaterial color="#b88a3a" metalness={0.8} roughness={0.35} /></mesh>
      <mesh position={[0, -0.28, 0]}><coneGeometry args={[0.1, 0.14, 8]} /><meshStandardMaterial color="#b88a3a" metalness={0.8} roughness={0.35} /></mesh>
      {light && <pointLight color="#ffb468" intensity={30} distance={13} decay={2} />}
    </group>
  );
}

function Dallah({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const geo = useMemo(() => new THREE.LatheGeometry([[0.001, 0], [0.16, 0], [0.2, 0.09], [0.12, 0.3], [0.07, 0.38], [0.055, 0.44], [0.1, 0.5], [0.001, 0.52]].map(([r, y]) => new THREE.Vector2(r, y)), 20), []);
  return (
    <group position={position} scale={scale}>
      <mesh geometry={geo} castShadow><meshStandardMaterial color="#d9a441" metalness={0.9} roughness={0.28} /></mesh>
      <mesh position={[0.2, 0.3, 0]} rotation={[0, 0, -0.9]} castShadow><cylinderGeometry args={[0.02, 0.04, 0.42, 8]} /><meshStandardMaterial color="#d9a441" metalness={0.9} roughness={0.28} /></mesh>
      <mesh position={[-0.18, 0.3, 0]} castShadow><torusGeometry args={[0.1, 0.012, 6, 16, Math.PI]} /><meshStandardMaterial color="#b8862f" metalness={0.9} roughness={0.3} /></mesh>
    </group>
  );
}

function Smoke() {
  const refs = useRef<THREE.Sprite[]>([]);
  const tex = useMemo(() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d')!; const g = x.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(230,225,215,.5)'); g.addColorStop(1, 'rgba(230,225,215,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }, []);
  useFrame(({ clock }) => { const t = clock.elapsedTime; refs.current.forEach((s, i) => { const u = (t * 0.22 + i / 8) % 1; s.position.set(Math.sin(t * 0.8 + i) * 0.12 * u, 0.4 + u * 1.8, Math.cos(t * 0.6 + i) * 0.1 * u); s.scale.setScalar(0.18 + u * 0.7); (s.material as THREE.SpriteMaterial).opacity = Math.sin(u * Math.PI) * 0.35; }); });
  return <>{Array.from({ length: 8 }, (_, i) => <sprite key={i} ref={(r) => { if (r) refs.current[i] = r; }}><spriteMaterial map={tex} transparent depthWrite={false} /></sprite>)}</>;
}

function Seating() {
  const items: { p: [number, number, number]; s: [number, number, number]; r?: [number, number, number]; c: string }[] = [];
  const row = (x0: number, z0: number, dx: number, dz: number, n: number, ry: number, off: number) => {
    for (let i = 0; i < n; i++) {
      const x = x0 + dx * i, z = z0 + dz * i;
      items.push({ p: [x, 0.12, z], s: [dx ? 1.3 : 1.0, 0.22, dx ? 1.0 : 1.3], c: CUSH[(i + off) % CUSH.length] });
      const bx = x + (dz ? Math.sign(ry) * -0.62 : 0), bz = z + (dx ? -0.6 : 0);
      items.push({ p: [dz ? bx : x, 0.5, dx ? bz : z], s: dx ? [1.3, 0.62, 0.2] : [0.2, 0.62, 1.3], r: dx ? [-0.18, 0, 0] : [0, 0, 0.18 * -Math.sign(ry)], c: CUSH[(i + off + 2) % CUSH.length] });
    }
  };
  row(-4.6, -3.45, 1.37, 0, 8, 0, 0);          // الجدار الخلفي
  row(5.55, -2.6, 0, 1.37, 5, 1, 1);           // الجدار الأيمن
  const mats = useMemo(() => CUSH.map((c) => new THREE.MeshStandardMaterial({ color: '#ffffff', map: F.cushion(c), roughness: 0.9 })), []);
  return <>{items.map((it, i) => (
    <RoundedBox key={i} args={it.s} radius={0.07} smoothness={3} position={it.p} rotation={it.r ?? [0, 0, 0]} castShadow receiveShadow material={mats[CUSH.indexOf(it.c)]} />
  ))}</>;
}

export default function BedouinTent({ position = [0, 0, -14] as [number, number, number] }) {
  const fade = useRef<THREE.MeshStandardMaterial | null>(null);
  const coals = useRef<THREE.PointLight>(null);
  const wallMap = useMemo(() => F.goatHair([4, 1]), []);
  const sadu = useMemo(() => F.sadu([4, 3]), []);
  const sadu2 = useMemo(() => F.sadu([2, 1]), []);
  const woodMap = useMemo(() => F.wood(), []);
  const [px, , pz] = position;

  useEffect(() => {
    const circ = (x: number, z: number, r: number) => colliders.circles.push({ x: px + x, z: pz + z, r });
    const box = (x0: number, x1: number, z0: number, z1: number) => colliders.boxes.push({ x0: px + x0, x1: px + x1, z0: pz + z0, z1: pz + z1 });
    box(-HALF_W - 0.2, HALF_W + 0.2, BACK - 0.3, BACK + 0.05);    // الخلف
    box(-HALF_W - 0.3, -HALF_W + 0.1, BACK, FRONT);               // اليسار (الشاشة)
    box(HALF_W - 0.1, HALF_W + 0.3, BACK, FRONT);                 // اليمين
    box(-5.4, 5.6, BACK, -2.85);                                  // مساند الخلف
    box(4.9, HALF_W, -3.0, 3.6);                                  // مساند اليمين
    circ(0, 1.0, 1.0);                                           // موقد القهوة
    box(-4.4, -2.0, 0.5, 1.6);                                    // سفرة التمر
    for (const [x, z] of [[-5, 4.4], [0, 4.4], [5, 4.4], [-5, -0.5], [0, -0.5], [5, -0.5]]) circ(x, z, 0.12);
    zones.tent = { x0: px - HALF_W, x1: px + HALF_W, z0: pz + BACK, z1: pz + FRONT };
  }, [px, pz]);

  useFrame((_, dt) => {
    const t = zones.tent; const inside = !!t && player.pos.x > t.x0 && player.pos.x < t.x1 && player.pos.z > t.z0 && player.pos.z < t.z1;
    if (fade.current) {
      const target = inside ? 0 : 1; const m = fade.current;
      m.opacity += (target - m.opacity) * Math.min(1, dt * 6); m.depthWrite = m.opacity > 0.95; m.visible = m.opacity > 0.03;
    }
    if (coals.current) coals.current.intensity = 14 + Math.sin(performance.now() / 120) * 3;
  });

  return (
    <group position={position}>
      <Roof fade={fade} />
      <GableWall side={-1} /><GableWall side={1} />
      {/* الجدار الخلفي */}
      <mesh position={[0, 1.0, BACK]} receiveShadow castShadow><planeGeometry args={[HALF_W * 2, 2.1]} /><meshStandardMaterial map={wallMap} side={THREE.DoubleSide} roughness={0.95} /></mesh>
      {/* ستارة حافة السقف الأمامية */}
      <mesh position={[0, roofY(0, FRONT) - 0.28, FRONT]} castShadow><planeGeometry args={[HALF_W * 2 + 0.1, 0.56]} /><meshStandardMaterial map={wallMap} side={THREE.DoubleSide} roughness={0.95} /></mesh>
      {/* أعمدة */}
      {[-5, 0, 5].flatMap((x) => [[x, 4.4, 1.9], [x, RIDGE_Z, 3.4]].map(([px2, z, h]) => (
        <mesh key={`${x}-${z}`} position={[px2, h / 2, z]} castShadow><cylinderGeometry args={[0.07, 0.09, h, 10]} /><meshStandardMaterial color="#4a2d1a" map={woodMap} roughness={0.8} /></mesh>
      )))}
      {/* أرضية وسجاد */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0.2]} receiveShadow><planeGeometry args={[HALF_W * 2 - 0.3, FRONT - BACK - 0.2]} /><meshStandardMaterial map={sadu} roughness={1} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0.6]} receiveShadow><planeGeometry args={[7.5, 3.4]} /><meshStandardMaterial map={sadu2} color="#ffd9b0" roughness={1} /></mesh>
      <Seating />
      {/* موقد القهوة */}
      <group position={[0, 0, 1.0]}>
        <mesh position={[0, 0.07, 0]} castShadow receiveShadow><cylinderGeometry args={[0.85, 0.9, 0.1, 28]} /><meshStandardMaterial color="#b87333" metalness={0.8} roughness={0.35} /></mesh>
        <mesh position={[0, 0.17, 0]}><cylinderGeometry args={[0.3, 0.34, 0.12, 14]} /><meshStandardMaterial color="#2a1a10" emissive="#ff5a12" emissiveIntensity={1.8} /></mesh>
        <pointLight ref={coals} position={[0, 0.5, 0]} color="#ff7a30" intensity={14} distance={7} decay={2} />
        <Dallah position={[-0.15, 0.25, 0.05]} scale={1.15} /><Dallah position={[0.28, 0.25, -0.1]} scale={0.9} />
        {[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[Math.cos(i * 1.26) * 0.62, 0.15, Math.sin(i * 1.26) * 0.62]} castShadow><cylinderGeometry args={[0.04, 0.03, 0.06, 10]} /><meshStandardMaterial color="#f1ead8" roughness={0.3} /></mesh>)}
      </group>
      {/* سفرة وتمر */}
      <group position={[-3.2, 0, 1.05]}>
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow><boxGeometry args={[2.2, 0.08, 1.0]} /><meshStandardMaterial map={woodMap} color="#8a5a34" roughness={0.7} /></mesh>
        {[[-1, -0.4], [1, -0.4], [-1, 0.4], [1, 0.4]].map(([x, z]) => <mesh key={`${x}${z}`} position={[x, 0.09, z]}><boxGeometry args={[0.1, 0.18, 0.1]} /><meshStandardMaterial color="#5a3520" /></mesh>)}
        {[-0.7, 0, 0.7].map((x, i) => <group key={x} position={[x, 0.27, 0]}><mesh castShadow><cylinderGeometry args={[0.26, 0.18, 0.1, 18]} /><meshStandardMaterial color={['#f1ead8', '#2f6f6a', '#c9a24a'][i]} roughness={0.35} /></mesh><mesh position={[0, 0.07, 0]}><sphereGeometry args={[0.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={['#4a2a14', '#6a3a1a', '#3a1f10'][i]} roughness={0.6} /></mesh></group>)}
      </group>
      {/* صندوق خشبي نحاسي */}
      <group position={[-5.3, 0, 3.2]} rotation={[0, 0.2, 0]}>
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow><boxGeometry args={[1.2, 0.6, 0.65]} /><meshStandardMaterial map={woodMap} color="#7a4a28" roughness={0.75} /></mesh>
        <mesh position={[0, 0.62, 0]} castShadow><boxGeometry args={[1.24, 0.07, 0.69]} /><meshStandardMaterial color="#9a6a3a" map={woodMap} roughness={0.7} /></mesh>
        {[-0.55, 0.55].map((x) => <mesh key={x} position={[x, 0.3, 0]}><boxGeometry args={[0.07, 0.62, 0.7]} /><meshStandardMaterial color="#b8862f" metalness={0.9} roughness={0.35} /></mesh>)}
        <mesh position={[0, 0.34, 0.34]}><boxGeometry args={[0.14, 0.18, 0.03]} /><meshStandardMaterial color="#d9a441" metalness={0.95} roughness={0.25} /></mesh>
      </group>
      {/* مبخرة */}
      <group position={[3.4, 0, 1.8]}>
        <mesh position={[0, 0.16, 0]} castShadow><cylinderGeometry args={[0.13, 0.08, 0.32, 16]} /><meshStandardMaterial color="#c79a3a" metalness={0.9} roughness={0.3} /></mesh>
        <mesh position={[0, 0.34, 0]} castShadow><sphereGeometry args={[0.15, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#c79a3a" metalness={0.9} roughness={0.3} /></mesh>
        <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.14, 0.14, 0.04, 16]} /><meshStandardMaterial color="#b8862f" metalness={0.9} roughness={0.35} /></mesh>
        <Smoke />
      </group>
      {/* فوانيس معلّقة */}
      <Lantern position={[-3.8, 2.55, 0.3]} /><Lantern position={[3.8, 2.55, 0.3]} /><Lantern position={[0, 2.8, -2.3]} light={false} />
      {/* شاشة العرض على الجدار الأيسر */}
      <group position={[-HALF_W + 0.1, 1.5, -0.5]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0, -0.02]}><boxGeometry args={[4.3, 2.55, 0.08]} /><meshStandardMaterial color="#2a1a10" metalness={0.5} roughness={0.5} /></mesh>
        <ProjectorScreen />
      </group>
    </group>
  );
}
