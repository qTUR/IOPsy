import { useEffect, useRef } from 'react';
import { setListener } from '../audio';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Avatar, { AvatarHandle } from './Avatar';
import type { EmoteName } from './avatarBuilder';
import Tag from './Tag';
import { bus, sendEmote, sendMove } from '../net';
import { useUI } from '../ui/uiStore';
import { touch } from '../input';
import { colliders, zones } from './terrain';
import { useGame, live } from '../store';

const R = 0.45;
export const SPAWN: [number, number, number] = [0, 0, 16];
export const player = { pos: new THREE.Vector3(...SPAWN), yaw: Math.PI };

function resolve(p: THREE.Vector3) {
  for (let it = 0; it < 2; it++) {
    for (const c of colliders.circles) {
      const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = c.r + R;
      if (d < m && d > 1e-5) { const k = (m - d) / d; p.x += dx * k; p.z += dz * k; }
    }
    for (const b of colliders.boxes) {
      if (p.x < b.x0 - R || p.x > b.x1 + R || p.z < b.z0 - R || p.z > b.z1 + R) continue;
      const qx = THREE.MathUtils.clamp(p.x, b.x0, b.x1), qz = THREE.MathUtils.clamp(p.z, b.z0, b.z1);
      const dx = p.x - qx, dz = p.z - qz, d2 = dx * dx + dz * dz;
      if (d2 >= R * R) continue;
      if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (R - d) / d; p.x += dx * k; p.z += dz * k; }
      else {
        const l = p.x - b.x0, r = b.x1 - p.x, t = p.z - b.z0, bt = b.z1 - p.z, mn = Math.min(l, r, t, bt);
        if (mn === l) p.x = b.x0 - R; else if (mn === r) p.x = b.x1 + R; else if (mn === t) p.z = b.z0 - R; else p.z = b.z1 + R;
      }
    }
  }
  const d = Math.hypot(p.x, p.z);
  if (d > 52) { p.x *= 52 / d; p.z *= 52 / d; }
}

(window as unknown as { __tp: unknown }).__tp = (x: number, z: number) => player.pos.set(x, 0, z);

export default function Player() {
  const look = useGame((s) => s.look), name = useGame((s) => s.name), myId = useGame((s) => s.myId), role = useGame((s) => s.role);
  const { camera, gl } = useThree();
  const group = useRef<THREE.Group>(null);
  const avatar = useRef<AvatarHandle>(null);
  const keys = useRef(new Set<string>());
  const cam = useRef({ yaw: 0, pitch: 0.38, dist: 8.5 });
  const heading = useRef(Math.PI);
  useEffect(() => { (window as unknown as { __cam: unknown; __camera: unknown }).__cam = cam.current; (window as unknown as { __camera: unknown }).__camera = camera; }, [camera]);
  const lastSent = useRef({ t: 0, key: '' });

  useEffect(() => {
    const EMOTES: Record<string, EmoteName> = { '1': 'wave', '2': 'chest', '3': 'clap', '4': 'nose', '5': 'thumb' };
    const kd = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      const em = EMOTES[e.key];
      if (em) { sendEmote(em); return; }
      if (e.key.toLowerCase() === 'c') { avatar.current?.setSit(!avatar.current.sitting); return; }
      keys.current.add(e.key.toLowerCase());
    };
    const ku = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const ptrs = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const el = gl.domElement;
    const pd = (e: PointerEvent) => { ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); try { el.setPointerCapture(e.pointerId); } catch { /* */ } if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); } };
    const pm = (e: PointerEvent) => {
      const prev = ptrs.get(e.pointerId); if (!prev) return;
      if (ptrs.size >= 2) {
        ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch > 0) cam.current.dist = THREE.MathUtils.clamp(cam.current.dist * (pinch / Math.max(d, 1)), 3.5, 20);
        pinch = d; return;
      }
      cam.current.yaw -= (e.clientX - prev.x) * 0.0055;
      cam.current.pitch = THREE.MathUtils.clamp(cam.current.pitch + (e.clientY - prev.y) * 0.004, 0.06, 1.3);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    };
    const pu = (e: PointerEvent) => { ptrs.delete(e.pointerId); pinch = 0; };
    const wh = (e: WheelEvent) => { cam.current.dist = THREE.MathUtils.clamp(cam.current.dist * (1 + Math.sign(e.deltaY) * 0.1), 3.5, 20); };
    addEventListener('keydown', kd); addEventListener('keyup', ku);
    el.addEventListener('pointerdown', pd); el.addEventListener('pointermove', pm); el.addEventListener('pointerup', pu); el.addEventListener('pointercancel', pu); el.addEventListener('wheel', wh, { passive: true });
    return () => {
      removeEventListener('keydown', kd); removeEventListener('keyup', ku);
      el.removeEventListener('pointerdown', pd); el.removeEventListener('pointermove', pm); el.removeEventListener('pointerup', pu); el.removeEventListener('pointercancel', pu); el.removeEventListener('wheel', wh);
    };
  }, [gl]);

  useEffect(() => {
    const onEmote = (e: Event) => { const d = (e as CustomEvent).detail as { id: string; n: EmoteName }; if (d.id === myId) { avatar.current?.setSit(false); avatar.current?.emote(d.n); } };
    const onSit = () => avatar.current?.setSit(!avatar.current.sitting);
    bus.addEventListener('emote', onEmote); bus.addEventListener('sit', onSit);
    const sp = live.get(myId); if (sp) player.pos.set(sp.x, 0, sp.z);
    return () => { bus.removeEventListener('emote', onEmote); bus.removeEventListener('sit', onSit); };
  }, [myId]);

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05);
    const k = keys.current, p = player.pos, c = cam.current;
    let ix = 0, iz = 0;
    if (k.has('w') || k.has('arrowup')) iz -= 1;
    if (k.has('s') || k.has('arrowdown')) iz += 1;
    if (k.has('a') || k.has('arrowleft')) ix -= 1;
    if (k.has('d') || k.has('arrowright')) ix += 1;
    ix += touch.x; iz += touch.z;
    const gs = useGame.getState(); const seekerLock = gs.games.hs.phase === 'counting' && gs.games.hs.seeker === gs.myId;
    const rc = gs.games.race, raceRole = rc.phase !== 'idle' && rc.joined.includes(gs.myId), raceView = rc.phase !== 'idle' && (raceRole || useUI.getState().raceCam);
    if (seekerLock || (raceRole && (rc.phase === 'countdown' || rc.phase === 'racing'))) { ix = 0; iz = 0; }
    if (group.current) group.current.visible = !raceRole;
    const l = Math.hypot(ix, iz);
    const run = k.has('shift') || touch.run;
    if (l > 0.08) {
      const mag = Math.min(1, l); ix /= l; iz /= l;
      const sy = Math.sin(c.yaw), cy = Math.cos(c.yaw);
      const dx = ix * cy + iz * sy, dz = -ix * sy + iz * cy;
      const sp = (avatar.current?.sitting ? 0 : run ? 7.2 : 4.2) * mag;
      p.x += dx * sp * dt; p.z += dz * sp * dt; resolve(p);
      const target = Math.atan2(dx, dz);
      heading.current += Math.atan2(Math.sin(target - heading.current), Math.cos(target - heading.current)) * Math.min(1, dt * 12);
    }
    const moving = l > 0.08;
    if (moving && avatar.current?.sitting) avatar.current.setSit(false);
    avatar.current?.setMoving(moving, run ? 1.35 : 1);
    if (group.current) { group.current.position.copy(p); group.current.rotation.y = heading.current; }
    player.yaw = heading.current;
    setListener(p.x, p.z);
    const sit = !!avatar.current?.sitting, key = `${p.x.toFixed(2)},${p.z.toFixed(2)},${moving},${sit}`, ls = lastSent.current, now = performance.now();
    if (key !== ls.key && now - ls.t > 80) { sendMove(p.x, p.z, heading.current, moving, sit); ls.key = key; ls.t = now; }
    if (raceView) { // كاميرا السباق: لقطة واسعة تُظهر كل المسارات
      const asp = (camera as THREE.PerspectiveCamera).aspect || 1.7, hf = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov) / 2) * asp);
      const dd = Math.max(15, 27 / Math.tan(hf / 2));
      camera.position.lerp(new THREE.Vector3(0, 6 + dd * 0.42, 37 - dd * 0.92), 1 - Math.exp(-dt * 4)); camera.lookAt(0, 0.6, 37.5); return;
    }
    // كاميرا ثالثة
    const zt = zones.tent, inTent = !!zt && p.x > zt.x0 && p.x < zt.x1 && p.z > zt.z0 && p.z < zt.z1;
    const d = inTent ? Math.min(c.dist, 5.2) : c.dist, pitchU = inTent ? Math.max(c.pitch, 0.55) : c.pitch, cp = Math.cos(pitchU);
    const tx = p.x, ty = 1.5, tz = p.z;
    camera.position.lerp(new THREE.Vector3(tx + Math.sin(c.yaw) * cp * d, ty + Math.sin(pitchU) * d + 0.4, tz + Math.cos(c.yaw) * cp * d), 1 - Math.exp(-dt * 12));
    camera.lookAt(tx, ty, tz);
  });

  return (
    <group ref={group} position={SPAWN}>
      <Avatar ref={avatar} look={look} />
      <Tag id={myId} name={name || 'زائر'} role={role} />
    </group>
  );
}
