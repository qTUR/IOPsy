import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { colliders } from './terrain';
import * as F from './fabrics';
import { organicGeo } from './rockGeo';

function flameTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256; const x = c.getContext('2d')!;
  const draw = (r0: number, r1: number, col: string) => {
    const g = x.createRadialGradient(64, 190, r0, 64, 170, r1); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,60,0,0)');
    x.save(); x.translate(64, 0); x.scale(0.55, 1); x.translate(-64, 0); x.fillStyle = g; x.fillRect(0, 0, 128, 256); x.restore();
  };
  draw(2, 120, 'rgba(255,90,10,.85)'); draw(2, 85, 'rgba(255,170,30,.9)'); draw(1, 48, 'rgba(255,240,170,.95)');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function smokeTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d')!;
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(120,110,100,.55)'); g.addColorStop(1, 'rgba(120,110,100,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** حفرة نار حجرية مع جلسة خشبية ومساند حولها */
export default function FirePit({ position = [0, 0, 3] as [number, number, number] }) {
  const flame = useMemo(flameTexture, []);
  const smoke = useMemo(smokeTexture, []);
  const sprites = useRef<THREE.Sprite[]>([]);
  const smokes = useRef<THREE.Sprite[]>([]);
  const light = useRef<THREE.PointLight>(null);
  const glow = useRef<THREE.Mesh>(null);
  const woodMap = useMemo(() => F.wood('#4a3322'), []);
  const [px, , pz] = position;
  useEffect(() => { colliders.circles.push({ x: px, z: pz, r: 1.7 }); }, [px, pz]);

  const stoneG = useMemo(() => organicGeo(5, 0.18, 4), []);
  const stones = useMemo(() => Array.from({ length: 15 }, (_, i) => {
    const a = (i / 15) * Math.PI * 2, r = 1.15 + Math.sin(i * 7) * 0.06;
    return { p: [Math.cos(a) * r, 0.2, Math.sin(a) * r] as [number, number, number], s: [0.36 + (i % 3) * 0.05, 0.26 + (i % 2) * 0.06, 0.34] as [number, number, number], ry: i * 1.3 };
  }), []);
  const logs = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ ry: i * 0.9, rz: 0.5 + (i % 3) * 0.1 })), []);
  const stools = useMemo(() => Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2 + 0.2; return { p: [Math.cos(a) * 3.1, 0, Math.sin(a) * 3.1] as [number, number, number], ry: -a }; }), []);

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime;
    sprites.current.forEach((s, i) => {
      if (!s) return;
      const k = Math.sin(t * (9 + i * 1.7) + i * 2.1), k2 = Math.sin(t * (13 + i) + i);
      s.scale.set(0.8 + k * 0.1 - i * 0.08, 1.45 + k2 * 0.3 + i * 0.12, 1);
      s.position.set(Math.sin(t * 2 + i) * 0.14, 1.0 + k2 * 0.1, Math.cos(t * 2.3 + i * 2) * 0.14);
      (s.material as THREE.SpriteMaterial).rotation = k * 0.1;
    });
    smokes.current.forEach((s, i) => {
      if (!s) return;
      const u = (t * 0.18 + i / 12) % 1;
      s.position.set(Math.sin(t * 0.4 + i) * 0.4 * u + u * 0.9, 2 + u * 7, Math.cos(t * 0.3 + i) * 0.4 * u);
      s.scale.setScalar(1.2 + u * 4.5); (s.material as THREE.SpriteMaterial).opacity = Math.sin(u * Math.PI) * 0.22;
    });
    if (light.current) light.current.intensity = 95 + Math.sin(t * 17) * 14 + Math.sin(t * 7.3) * 9 + Math.sin(t * 29) * 5;
    if (glow.current) (glow.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.2 + Math.sin(t * 5) * 0.5;
    void camera;
  });

  return (
    <group position={position}>
      {stones.map((s, i) => (
        <mesh key={i} position={s.p} scale={s.s} rotation={[0.3 * i, s.ry, 0.2]} castShadow receiveShadow>
          <primitive object={stoneG} attach="geometry" /><meshStandardMaterial color={['#8a7a68', '#7a6a5a', '#94836d'][i % 3]} roughness={1} />
        </mesh>
      ))}
      <mesh ref={glow} position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[1.05, 28]} /><meshStandardMaterial color="#1a0d06" emissive="#ff5a12" emissiveIntensity={2.2} roughness={1} /></mesh>
      {logs.map((l, i) => (
        <mesh key={i} position={[Math.cos(l.ry) * 0.25, 0.42, Math.sin(l.ry) * 0.25]} rotation={[0, l.ry, Math.PI / 2 - l.rz]} castShadow>
          <cylinderGeometry args={[0.09, 0.11, 1.5, 9]} /><meshStandardMaterial map={woodMap} color="#7a5a3a" roughness={0.95} emissive="#ff4a08" emissiveIntensity={0.25} />
        </mesh>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <sprite key={i} ref={(r) => { if (r) sprites.current[i] = r; }} center={[0.5, 0]}>
          <spriteMaterial map={flame} blending={THREE.AdditiveBlending} transparent depthWrite={false} fog={false} opacity={0.62} />
        </sprite>
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <sprite key={`s${i}`} ref={(r) => { if (r) smokes.current[i] = r; }}><spriteMaterial map={smoke} transparent depthWrite={false} opacity={0.2} /></sprite>
      ))}
      <pointLight ref={light} position={[0, 1.4, 0]} color="#ff8a3c" intensity={95} distance={32} decay={2} />
      <Sparkles count={46} speed={1.1} size={5} scale={[1.6, 5, 1.6]} position={[0, 2.8, 0]} color="#ffb347" opacity={0.9} />
      {/* جلسات: جذوع ومساند */}
      {stools.map((s, i) => (
        <group key={i} position={s.p} rotation={[0, s.ry, 0]}>
          {i % 2 === 0 ? (
            <mesh position={[0, 0.22, 0]} castShadow receiveShadow><cylinderGeometry args={[0.36, 0.4, 0.44, 14]} /><meshStandardMaterial map={woodMap} roughness={0.95} /></mesh>
          ) : (
            <RoundedBox args={[1.1, 0.26, 1.1]} radius={0.1} smoothness={4} position={[0, 0.14, 0]} castShadow receiveShadow><meshStandardMaterial map={F.cushion(['#8f1d1d', '#1f6f6b', '#c88a2b', '#5a2433'][i % 4])} roughness={0.92} /></RoundedBox>
          )}
        </group>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]} receiveShadow><ringGeometry args={[1.5, 4.4, 56]} /><meshStandardMaterial map={F.sadu([6, 1])} roughness={1} /></mesh>
    </group>
  );
}
