import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useGame } from '../store';
import { useT } from '../i18n';
import { FONT_DISPLAY } from './fabricsFonts';

export const TRACK = { x0: -18, x1: 18, z0: 27, gap: 2.2, lanes: 10 };
export const laneZ = (i: number) => TRACK.z0 + i * TRACK.gap;
const LANE_COLORS = ['#c0392b', '#2e86c1', '#27ae60', '#f1c40f', '#8e44ad', '#e67e22', '#16a085', '#d35ba0', '#ecf0f1', '#34495e'];
const CAMEL_YAW = Math.PI / 2; // اتجاه نموذج الجمل نحو +x

function bannerTexture(text: string, bg = '#2b160d') {
  const c = document.createElement('canvas'); c.width = 768; c.height = 192; const x = c.getContext('2d')!;
  x.fillStyle = bg; x.fillRect(0, 0, 768, 192); x.strokeStyle = '#d9a441'; x.lineWidth = 8; x.strokeRect(10, 10, 748, 172);
  x.fillStyle = '#f6d98d'; x.textAlign = 'center'; x.direction = 'rtl'; x.font = `700 110px ${FONT_DISPLAY}`; x.fillText(text, 384, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function checkerTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d')!;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#fff' : '#111'; x.fillRect(i * 16, j * 16, 16, 16); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 10); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** هجين يتحرك حسب تقدّم المتسابق، وسرعة الحركة تتبع سرعة الضغط */
function RaceCamel({ id, lane }: { id: string; lane: number }) {
  const { scene, animations } = useGLTF('/models/camel.glb');
  const obj = useMemo(() => { const o = clone(scene); o.traverse((c) => { if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; }, [scene]);
  const g = useRef<THREE.Group>(null);
  const mixer = useMemo(() => new THREE.AnimationMixer(obj), [obj]);
  const walk = useRef<THREE.AnimationAction | null>(null);
  const st = useRef({ disp: 0, last: 0, speed: 0 });
  const name = useGame((s) => s.players[id]?.name ?? '');
  const t = useT();
  useEffect(() => {
    const clip = animations.find((a) => /WalkCycle/.test(a.name) && /^Armature/.test(a.name)) ?? animations.find((a) => /WalkCycle/.test(a.name));
    if (clip) { const a = mixer.clipAction(clip); a.play(); a.timeScale = 0; walk.current = a; }
    return () => { mixer.stopAllAction(); };
  }, [mixer, animations]);
  useFrame((_, dt) => {
    dt = Math.min(dt, 0.1);
    const rc = useGame.getState().games.race, target = rc.progress[id] ?? 0, s = st.current;
    const prev = s.disp; s.disp += (target - s.disp) * (1 - Math.exp(-dt * 10));
    const inst = Math.abs(s.disp - prev) / Math.max(dt, 1e-3);
    s.speed += (inst - s.speed) * (1 - Math.exp(-dt * 6));
    const o = g.current; if (!o) return;
    const finished = rc.finished.some((f) => f.id === id);
    o.position.set(TRACK.x0 + (s.disp / rc.goal) * (TRACK.x1 - TRACK.x0), 0, laneZ(lane));
    if (walk.current) walk.current.timeScale = finished && rc.phase === 'over' ? 0.4 : THREE.MathUtils.clamp(s.speed / 3.2, 0, 3.4);
    mixer.update(dt);
    o.position.y = Math.abs(Math.sin(performance.now() / 110)) * Math.min(0.18, s.speed * 0.02);
  });
  return (
    <group ref={g} position={[TRACK.x0, 0, laneZ(lane)]}>
      <group rotation={[0, CAMEL_YAW, 0]}>
        <primitive object={obj} />
        <mesh position={[0, 1.78, 0.05]} castShadow><boxGeometry args={[0.95, 0.1, 1.0]} /><meshStandardMaterial color={LANE_COLORS[lane % 10]} roughness={0.7} /></mesh>
      </group>
      <Html position={[0, 3.0, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div className="tag race-tag" style={{ borderColor: LANE_COLORS[lane % 10] }}><span className="lane-dot" style={{ background: LANE_COLORS[lane % 10] }} />{name || t('race_name')}</div>
      </Html>
    </group>
  );
}

/** مضمار سباق الهجن: 10 مسارات، خط بداية ونهاية، وسياج */
export default function RaceTrack() {
  const t = useT();
  const race = useGame((s) => s.games.race);
  const ids = race.joined;
  const sign1 = useMemo(() => bannerTexture(t('race_start_line')), [t]);
  const sign2 = useMemo(() => bannerTexture(t('race_finish_line'), '#1d3326'), [t]);
  const check = useMemo(checkerTexture, []);
  const W = TRACK.lanes * TRACK.gap + 1.2, zc = TRACK.z0 + (TRACK.lanes - 1) * TRACK.gap / 2, L = TRACK.x1 - TRACK.x0 + 6;
  const posts = useMemo(() => Array.from({ length: 16 }, (_, i) => TRACK.x0 - 2 + i * ((L - 2) / 15)), [L]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(TRACK.x0 + TRACK.x1) / 2, 0.025, zc]} receiveShadow>
        <planeGeometry args={[L, W]} /><meshStandardMaterial color="#d6b078" roughness={1} />
      </mesh>
      {Array.from({ length: TRACK.lanes + 1 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[(TRACK.x0 + TRACK.x1) / 2, 0.035, TRACK.z0 - TRACK.gap / 2 + i * TRACK.gap]}>
          <planeGeometry args={[TRACK.x1 - TRACK.x0 + 1, 0.09]} /><meshStandardMaterial color="#f4ead2" roughness={1} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[TRACK.x0 - 0.6, 0.04, zc]}><planeGeometry args={[0.35, W - 1]} /><meshStandardMaterial color="#f4ead2" roughness={1} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[TRACK.x1 + 0.9, 0.04, zc]}><planeGeometry args={[1.0, W - 1]} /><meshStandardMaterial map={check} roughness={1} /></mesh>
      {/* بوابات */}
      {[[TRACK.x0 - 0.8, sign1], [TRACK.x1 + 0.9, sign2]].map(([x, tex], k) => (
        <group key={k} position={[x as number, 0, zc]}>
          {[-1, 1].map((sd) => <mesh key={sd} position={[0, 2.2, sd * (W / 2)]} castShadow><cylinderGeometry args={[0.12, 0.15, 4.4, 10]} /><meshStandardMaterial color="#4a2b17" roughness={0.9} /></mesh>)}
          <mesh position={[0, 4.0, -W / 2 - 0.2]} rotation={[0, Math.PI, 0]}><planeGeometry args={[6, 1.5]} /><meshStandardMaterial map={tex as THREE.Texture} emissiveMap={tex as THREE.Texture} emissive="#ffffff" emissiveIntensity={0.55} /></mesh>
        </group>
      ))}
      {/* سياج خشبي */}
      {[-1, 1].map((sd) => posts.map((x, i) => (
        <mesh key={`${sd}${i}`} position={[x, 0.55, zc + sd * (W / 2 + 0.3)]} castShadow><cylinderGeometry args={[0.07, 0.09, 1.1, 8]} /><meshStandardMaterial color="#6a4a2e" roughness={1} /></mesh>
      )))}
      {[-1, 1].map((sd) => <mesh key={'r' + sd} position={[(TRACK.x0 + TRACK.x1) / 2, 0.85, zc + sd * (W / 2 + 0.3)]}><boxGeometry args={[L - 2, 0.05, 0.05]} /><meshStandardMaterial color="#8a6a42" roughness={1} /></mesh>)}
      {ids.map((id, i) => <RaceCamel key={id + race.round} id={id} lane={i} />)}
    </group>
  );
}
useGLTF.preload('/models/camel.glb');
