import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '../store';
import { gameAct } from '../net';
import { useT } from '../i18n';
import { legalMoves, N } from '../../shared/siga.js';
import { organicGeo } from './rockGeo';
import { player } from './Player';

export const SIGA_POS: [number, number] = [-12, 9];
const CELL = 1.3;
const cellXZ = (i: number): [number, number] => [((i % N) - 2) * CELL, (Math.floor(i / N) - 2) * CELL];

function Stone({ p, i, from }: { p: number; i: number; from: number | null }) {
  const ref = useRef<THREE.Mesh>(null);
  const [tx, tz] = cellXZ(i);
  const init = useMemo(() => (from != null ? cellXZ(from) : [tx, tz]), []); // eslint-disable-line react-hooks/exhaustive-deps
  const geo = useMemo(() => organicGeo(p * 3, 0.07, 3, 0.55), [p]);
  useFrame((_, dt) => {
    const m = ref.current; if (!m) return; const k = 1 - Math.exp(-dt * 11);
    m.position.x += (tx - m.position.x) * k; m.position.z += (tz - m.position.z) * k;
    const lift = Math.min(0.5, Math.hypot(tx - m.position.x, tz - m.position.z)) * 0.5; m.position.y = 0.15 + lift;
  });
  return (
    <mesh ref={ref} geometry={geo} position={[init[0], 0.15, init[1]]} scale={[0.4, 0.4, 0.4]} castShadow receiveShadow>
      <meshStandardMaterial color={p === 1 ? '#efe6d2' : '#2d2420'} roughness={p === 1 ? 0.7 : 0.55} />
    </mesh>
  );
}

/** لوحة «السيجة» المرسومة على الرمل مع أحجارها — تفاعلية بالنقر */
export default function SigaBoard() {
  const t = useT();
  const siga = useGame((s) => s.games.siga), myId = useGame((s) => s.myId);
  const [sel, setSel] = useState<number | null>(null);
  const [near, setNear] = useState(false);
  const seat = siga ? siga.seats.indexOf(myId) : -1;
  const me = seat + 1; // 0 = متفرّج
  const myTurn = !!siga && siga.status === 'playing' && me > 0 && siga.turn === me;
  const moves = useMemo(() => (siga && myTurn ? legalMoves(siga.board, me, siga.cont) : []), [siga, myTurn, me]);
  useEffect(() => { setSel(siga?.cont ?? null); }, [siga?.moves, siga?.cont]); // eslint-disable-line react-hooks/exhaustive-deps
  useFrame(() => { const d = Math.hypot(player.pos.x - SIGA_POS[0], player.pos.z - SIGA_POS[1]); if ((d < 26) !== near) setNear(d < 26); });

  const lines = useMemo(() => {
    const out: { p: [number, number]; s: [number, number] }[] = [];
    const L = 4 * CELL;
    for (let k = 0; k < N; k++) { out.push({ p: [0, (k - 2) * CELL], s: [L + 0.1, 0.1] }); out.push({ p: [(k - 2) * CELL, 0], s: [0.1, L + 0.1] }); }
    return out;
  }, []);
  const target = (i: number) => { // نقر على خلية
    if (!siga || !myTurn) return;
    const mine = siga.board[i] === me;
    const mv = moves.find((m) => m.from === sel && m.to === i);
    if (mv) { gameAct('siga', 'move', { from: mv.from, to: mv.to }); setSel(null); return; }
    if (mine && (siga.cont == null || siga.cont === i)) setSel(i === sel ? null : i);
  };
  if (!siga) return null;
  const pieceMoves = (i: number) => moves.filter((m) => m.from === i);
  const hasMovable = (i: number) => myTurn && siga.board[i] === me && pieceMoves(i).length > 0;

  return (
    <group position={[SIGA_POS[0], 0, SIGA_POS[1]]}>
      {/* أرضية رمل مدكوك + حافة */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow><planeGeometry args={[7.2, 7.2]} /><meshStandardMaterial color="#e3c597" roughness={1} /></mesh>
      {[[0, -3.6, 7.4, 0.14], [0, 3.6, 7.4, 0.14], [-3.6, 0, 0.14, 7.4], [3.6, 0, 0.14, 7.4]].map(([x, z, w, d], k) => (
        <mesh key={k} position={[x, 0.04, z]} castShadow receiveShadow><boxGeometry args={[w, 0.08, d]} /><meshStandardMaterial color="#c9a46f" roughness={1} /></mesh>
      ))}
      {lines.map((l, k) => <mesh key={k} position={[l.p[0], 0.03, l.p[1]]}><boxGeometry args={[l.s[0], 0.025, l.s[1]]} /><meshStandardMaterial color="#6d4c2f" roughness={1} /></mesh>)}
      {Array.from({ length: N * N }, (_, i) => { const [x, z] = cellXZ(i); return <mesh key={i} position={[x, 0.035, z]}><cylinderGeometry args={[0.09, 0.09, 0.03, 12]} /><meshStandardMaterial color="#5a3d25" roughness={1} /></mesh>; })}

      {siga.board.map((v, i) => v ? <Stone key={`${i}-${v}-${siga.round}`} p={v} i={i} from={siga.last && siga.last[1] === i ? siga.last[0] : null} /> : null)}

      {/* تمييز المسار الأخير */}
      {siga.last && [siga.last[0], siga.last[1]].map((i, k) => { const [x, z] = cellXZ(i); return <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.05, z]}><ringGeometry args={[0.46, 0.52, 28]} /><meshBasicMaterial color={k ? '#ffe08a' : '#b8a070'} transparent opacity={0.55} /></mesh>; })}
      {/* القطع القابلة للتحريك والحركات المتاحة */}
      {Array.from({ length: N * N }, (_, i) => hasMovable(i) ? (() => { const [x, z] = cellXZ(i); return <mesh key={'m' + i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.06, z]}><ringGeometry args={[0.5, 0.57, 28]} /><meshBasicMaterial color={sel === i ? '#ffd34d' : '#7fe0a0'} transparent opacity={sel === i ? 1 : 0.55} /></mesh>; })() : null)}
      {sel != null && pieceMoves(sel).map((m) => { const [x, z] = cellXZ(m.to); return <mesh key={'t' + m.to} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.07, z]}><circleGeometry args={[0.24, 20]} /><meshBasicMaterial color={m.cap != null ? '#ff7a5a' : '#7fe0a0'} transparent opacity={0.85} /></mesh>; })}
      {/* مساحات نقر غير مرئية */}
      {Array.from({ length: N * N }, (_, i) => { const [x, z] = cellXZ(i); return (
        <mesh key={'c' + i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.2, z]} onClick={(e) => { e.stopPropagation(); target(i); }}>
          <circleGeometry args={[0.62, 16]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>); })}

      {near && (
        <Html position={[0, 1.6, -3.9]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'auto' }}>
          <div className="board-label" onPointerDown={(e) => e.stopPropagation()}>
            <b>🎲 {t('siga_name')}</b>
            {siga.status === 'waiting' && <small>{t('siga_wait')}</small>}
            {siga.status === 'playing' && <small>{myTurn ? t('siga_your_turn') : t('siga_their_turn', { n: siga.names[siga.turn - 1] })}</small>}
            {siga.status === 'over' && <small>{siga.winner ? t('siga_won', { n: siga.names[siga.winner - 1] }) : t('siga_draw')}</small>}
            {seat < 0 && siga.status !== 'playing' && <button onClick={() => gameAct('siga', 'join')}>{t('hs_join')}</button>}
          </div>
        </Html>
      )}
    </group>
  );
}
