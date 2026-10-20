import { useFrame } from '@react-three/fiber';
import { Sky, Stars, Environment, Lightformer } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, N8AO, ToneMapping, HueSaturation, BrightnessContrast, SMAA } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import Ground from './Ground';
import Mountains from './Mountains';
import Avatar from './Avatar';
import Player from './Player';
import RemotePlayers from './RemotePlayers';
import SigaBoard from './SigaBoard';
import RaceTrack from './RaceTrack';
import { Camel } from './Props';
import BedouinTent from './BedouinTent';
import FirePit from './FirePit';
import { PalmGrove, AcaciaTrees } from './Palms';
import { Village, Well, Scatter, LightPosts } from './Najdi';
import { useGame } from '../store';

const SUN: [number, number, number] = [-80, 12, -42];
const Q = new URLSearchParams(location.search);

/** كاميرا سينمائية أثناء شاشة الدخول */
function JoinCamera() {
  useFrame(({ camera, clock }) => {
    if (Q.has('face')) { camera.position.set(0.0, 1.52, 15.55); camera.lookAt(0, 1.52, 14.5); return; }
    if (Q.has('mid')) { camera.position.set(0.2, 1.25, 17.4); camera.lookAt(0, 1.05, 14.5); return; }
    if (Q.has('body')) { camera.position.set(0, 1.0, 19.2); camera.lookAt(0, 0.95, 14.5); return; }
    const t = clock.elapsedTime * 0.1;
    camera.position.set(Math.sin(t) * 1.5 - 1, 1.9, 19.5);
    camera.lookAt(2.3, 1.4, 14.5);
  });
  return null;
}

export default function World() {
  const phase = useGame((s) => s.phase);
  const look = useGame((s) => s.look);
  const gfx = useGame((s) => s.settings.gfx), low = gfx !== 'high', min = gfx === 'min';
  return (
    <>
      <color attach="background" args={['#f0a878']} />
      <fog attach="fog" args={['#e3a070', 60, 420]} />
      <Sky distance={450000} sunPosition={SUN} turbidity={8} rayleigh={2.4} mieCoefficient={0.005} mieDirectionalG={0.96} />
      <Stars radius={300} depth={40} count={2200} factor={5} fade />
      {/* إضاءة بيئية دافئة للانعكاسات */}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={7} color="#ffb070" scale={[40, 14, 1]} position={[-40, 8, -22]} rotation-y={Math.PI / 2.4} />
        <Lightformer form="rect" intensity={1.6} color="#7e78c9" scale={[80, 80, 1]} position={[0, 40, 0]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.1} color="#d9965a" scale={[80, 80, 1]} position={[0, -10, 0]} rotation-x={-Math.PI / 2} />
        <Lightformer form="rect" intensity={1.8} color="#e8885a" scale={[60, 10, 1]} position={[40, 6, 30]} rotation-y={-Math.PI / 2.4} />
      </Environment>
      <hemisphereLight args={['#9a90d0', '#d9a46a', 0.7]} />
      <directionalLight
        position={SUN} intensity={4.2} color="#ffb877" castShadow
        shadow-mapSize={min ? [512, 512] : low ? [1024, 1024] : [4096, 4096]} shadow-bias={-0.0002} shadow-normalBias={0.035} shadow-radius={3}
        shadow-camera-left={-42} shadow-camera-right={42} shadow-camera-top={42} shadow-camera-bottom={-42} shadow-camera-near={10} shadow-camera-far={230}
      />
      <Ground />
      <Mountains />
      <Scatter />
      <PalmGrove />
      <AcaciaTrees />
      <Village />
      <Well position={[20, 14]} />
      <BedouinTent position={[0, 0, -14]} />
      <FirePit position={[0, 0, 3]} />
      <LightPosts center={[0, 3]} radius={11} />
      {phase === 'play' && <SigaBoard />}
      <RaceTrack />
      <Camel position={[16, 0, 2]} rotation={-1.2} />
      <Camel position={[-17, 0, 7]} rotation={1.9} anim="Idle_02" />
      <Camel position={[-24, 0, -8]} rotation={0.6} />
      {phase === 'join' ? (
        <>
          <JoinCamera />
          <group position={[0, 0, 14.5]}><Avatar look={look} spin={!Q.has('face') && !Q.has('body') && !Q.has('mid')} /></group>
        </>
      ) : <><Player /><RemotePlayers /></>}
      {!min && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <N8AO aoRadius={1.6} distanceFalloff={1.2} intensity={low ? 0 : 2.6} quality="performance" halfRes />
          <Bloom intensity={low ? 0.5 : 0.7} luminanceThreshold={0.9} luminanceSmoothing={0.25} mipmapBlur={!low} radius={0.7} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <HueSaturation saturation={0.04} />
          <BrightnessContrast contrast={0.08} />
          <Vignette eskil={false} offset={0.22} darkness={0.5} />
          {low ? <></> : <SMAA />}
        </EffectComposer>
      )}
    </>
  );
}
