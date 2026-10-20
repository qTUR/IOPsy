import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { buildAvatar, EmoteName, Look } from './avatarBuilder';

export interface AvatarHandle {
  setMoving: (v: boolean, speed?: number) => void;
  emote: (n: EmoteName) => void;
  setSit: (v: boolean) => void;
  readonly sitting: boolean;
}

/** شخصية كرتونية كاملة الجسم، حركتها بالكود */
const Avatar = forwardRef<AvatarHandle, { look: Look; spin?: boolean }>(function Avatar({ look, spin }, ref) {
  const built = useMemo(() => buildAvatar(look), [look]);
  const holder = useRef<THREE.Group>(null);
  const st = useRef({ moving: false, speed: 1 });
  useImperativeHandle(ref, () => ({
    setMoving: (v, s = 1) => { st.current.moving = v; st.current.speed = s; },
    emote: (n) => built.emote(n),
    setSit: (v) => built.setSit(v),
    get sitting() { return built.sitting; },
  }), [built]);
  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05);
    built.update(dt, st.current.moving, st.current.speed);
    if (spin && holder.current) holder.current.rotation.y += dt * 0.7;
  });
  return (
    <group ref={holder}>
      <primitive object={built.group} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.55, 24]} /><meshBasicMaterial color="#000" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  );
});
export default Avatar;
