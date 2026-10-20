import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Avatar, { AvatarHandle } from './Avatar';
import Tag from './Tag';
import { live, useGame, type Remote } from '../store';
import { bus } from '../net';
import { player } from './Player';
import type { EmoteName } from './avatarBuilder';

const angDiff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

/** شخصية لاعب آخر: تتحرك بسلاسة نحو آخر موضع وصل من الخادم */
function RemoteAvatar({ p }: { p: Remote }) {
  const g = useRef<THREE.Group>(null);
  const av = useRef<AvatarHandle>(null);
  const first = useRef(true);
  const [hidden, setHidden] = useState(false);
  const key = JSON.stringify(p.look);
  useEffect(() => {
    const onEmote = (e: Event) => { const d = (e as CustomEvent).detail as { id: string; n: EmoteName }; if (d.id === p.id) { av.current?.setSit(false); av.current?.emote(d.n); } };
    bus.addEventListener('emote', onEmote); return () => bus.removeEventListener('emote', onEmote);
  }, [p.id]);
  useFrame((_, dt) => {
    const t = live.get(p.id), o = g.current; if (!t || !o) return;
    if (first.current) { o.position.set(t.x, 0, t.z); o.rotation.y = t.ry; first.current = false; }
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 10);
    o.position.x += (t.x - o.position.x) * k; o.position.z += (t.z - o.position.z) * k;
    o.rotation.y += angDiff(t.ry, o.rotation.y) * k;
    av.current?.setMoving(!!t.mv, 1);
    const gs = useGame.getState(), hs = gs.games.hs;
    const hide = hs.phase === 'hunting' && hs.seeker === gs.myId && p.id !== gs.myId && !hs.found.includes(p.id) && Math.hypot(o.position.x - player.pos.x, o.position.z - player.pos.z) > 4.5;
    const rc = gs.games.race, racing = rc.phase !== 'idle' && rc.joined.includes(p.id);
    o.visible = !racing;
    if ((hide || racing) !== hidden) setHidden(hide || racing);
    if (!!t.sit !== av.current?.sitting) av.current?.setSit(!!t.sit);
  });
  return (
    <group ref={g}>
      <Avatar key={key} ref={av} look={p.look} />
      <Tag id={p.id} name={p.name} role={p.role} away={!p.on} hidden={hidden} />
    </group>
  );
}

export default function RemotePlayers() {
  const players = useGame((s) => s.players);
  const me = useGame((s) => s.myId);
  return <>{Object.values(players).filter((p) => p.id !== me).map((p) => <RemoteAvatar key={p.id} p={p} />)}</>;
}
