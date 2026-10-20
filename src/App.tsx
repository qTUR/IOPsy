import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import * as THREE from 'three';
import World from './scene/World';
import Join from './ui/Join';
import Hud from './ui/Hud';
import { useGame } from './store';
import { useT } from './i18n';
import Perf from './scene/Perf';
import TouchControls from './ui/TouchControls';
import { useEffect } from 'react';

function Loader() {
  const { progress, active } = useProgress();
  return <div className={'loader' + (active ? '' : ' gone')}><div className="spin" /><span>{useT()('loading_camp')} {Math.round(progress)}%</span></div>;
}

export default function App() {
  const phase = useGame((s) => s.phase);
  const gfx = useGame((s) => s.settings.gfx);
  useEffect(() => { // إبقاء الشاشة مضاءة أثناء الاجتماع (الجوال)
    let lock: { release: () => Promise<void> } | null = null;
    const req = async () => { try { lock = await (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null; } catch { /* */ } };
    if (phase === 'play') { void req(); const v = () => { if (document.visibilityState === 'visible') void req(); }; document.addEventListener('visibilitychange', v); return () => { document.removeEventListener('visibilitychange', v); void lock?.release(); }; }
  }, [phase]);
  const lang = useGame((s) => s.settings.lang);
  return (
    <>
      <Canvas
        shadows={gfx !== 'min'} dpr={gfx === 'min' ? [0.7, 0.8] : gfx === 'low' ? [1, 1] : [1, 1.75]} camera={{ fov: 55, near: 0.1, far: 900, position: [0, 3, 22] }}
        gl={{ antialias: false, toneMapping: gfx === 'min' ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}><World /><Perf /></Suspense>
      </Canvas>
      <Loader key={lang} />
      {phase === 'join' ? <Join /> : <><Hud /><TouchControls /></>}
    </>
  );
}
