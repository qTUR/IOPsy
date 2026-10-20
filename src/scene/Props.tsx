import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { colliders } from './terrain';

function shadowAll(o: THREE.Object3D) {
  o.traverse((c) => { if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; } });
}

/** الخيمة السعودية (بيت الشعر) */
export function Tent({ position = [0, 0, -10] as [number, number, number], rotation = 0 }) {
  const { scene } = useGLTF('/models/tent.glb');
  const obj = useMemo(() => { const o = clone(scene); shadowAll(o); return o; }, [scene]);
  useEffect(() => {
    obj.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(obj);
    console.info('[tent] size', b.getSize(new THREE.Vector3()).toArray().map((v) => +v.toFixed(2)));
  }, [obj]);
  return <group position={position} rotation={[0, rotation, 0]}><primitive object={obj} /></group>;
}

/** جمل بحركة Idle */
export function Camel({ position, rotation = 0, anim = 'Idle_01' }: { position: [number, number, number]; rotation?: number; anim?: string }) {
  const { scene, animations } = useGLTF('/models/camel.glb');
  const obj = useMemo(() => { const o = clone(scene); shadowAll(o); return o; }, [scene]);
  const ref = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, ref);
  useEffect(() => {
    const n = names.find((x) => x.startsWith('Armature') && x.endsWith(anim)) ?? names.find((x) => x.endsWith(anim));
    const a = n ? actions[n] : undefined;
    a?.reset().fadeIn(0.3).play();
    if (a) a.time = Math.random() * 3;
    return () => { a?.fadeOut(0.2); };
  }, [actions, names, anim]);
  useEffect(() => { colliders.circles.push({ x: position[0], z: position[2], r: 0.9 }); }, [position]);
  return <group ref={ref} position={position} rotation={[0, rotation, 0]}><primitive object={obj} /></group>;
}

/** نار المخيم مع وميض وشرر */
export function Campfire({ position = [0, 0, 0] as [number, number, number] }) {
  const { scene } = useGLTF('/models/bonfire.glb');
  const obj = useMemo(() => { const o = clone(scene); shadowAll(o); return o; }, [scene]);
  const light = useRef<THREE.PointLight>(null);
  const flame = useRef<THREE.Mesh>(null);
  const sparks = useRef<THREE.Points>(null);
  const N = 60;
  const pos = useMemo(() => new Float32Array(N * 3), []);
  const seed = useMemo(() => Array.from({ length: N }, () => [Math.random(), Math.random() * 6.28]), []);
  useEffect(() => { colliders.circles.push({ x: position[0], z: position[2], r: 1.5 }); }, [position]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (light.current) light.current.intensity = 55 + Math.sin(t * 17) * 10 + Math.sin(t * 7.3) * 6;
    if (flame.current) flame.current.scale.set(1 + Math.sin(t * 15) * 0.1, 1 + Math.sin(t * 21 + 1) * 0.22, 1 + Math.cos(t * 13) * 0.1);
    for (let i = 0; i < N; i++) {
      const u = (t * 0.35 + seed[i][0]) % 1;
      pos[i * 3] = Math.cos(seed[i][1]) * 0.5 * u + Math.sin(t + i) * 0.1;
      pos[i * 3 + 1] = 0.5 + u * 3.2;
      pos[i * 3 + 2] = Math.sin(seed[i][1]) * 0.5 * u;
    }
    if (sparks.current) sparks.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <group position={position}>
      <primitive object={obj} />
      <mesh ref={flame} position={[0, 0.8, 0]}>
        <coneGeometry args={[0.45, 1.3, 8]} />
        <meshBasicMaterial color="#ff8a1c" transparent opacity={0.88} />
      </mesh>
      <mesh position={[0, 0.65, 0]}><coneGeometry args={[0.25, 0.9, 8]} /><meshBasicMaterial color="#ffd36a" transparent opacity={0.9} /></mesh>
      <pointLight ref={light} position={[0, 1.2, 0]} color="#ff8a3c" intensity={55} distance={28} decay={2} />
      <points ref={sparks} frustumCulled={false}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
        <pointsMaterial color="#ffb347" size={0.12} transparent opacity={0.9} depthWrite={false} />
      </points>
    </group>
  );
}

export function Lantern({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.4, 0]} castShadow><cylinderGeometry args={[0.05, 0.07, 2.8, 8]} /><meshStandardMaterial color="#2a1d12" metalness={0.6} roughness={0.5} /></mesh>
      <mesh position={[0, 3, 0]}><cylinderGeometry args={[0.18, 0.26, 0.6, 6]} /><meshStandardMaterial color="#1a1008" emissive="#ffb35a" emissiveIntensity={3} /></mesh>
      <mesh position={[0, 3.4, 0]}><coneGeometry args={[0.3, 0.3, 6]} /><meshStandardMaterial color="#2a1d12" /></mesh>
      <pointLight position={[0, 3, 0]} color="#ffb468" intensity={14} distance={12} decay={2} />
    </group>
  );
}

useGLTF.preload('/models/tent.glb');
useGLTF.preload('/models/camel.glb');
useGLTF.preload('/models/bonfire.glb');
