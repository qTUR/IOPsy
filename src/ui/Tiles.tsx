import { useEffect, useRef, useState } from 'react';
import type { Track } from 'livekit-client';
import { useGame } from '../store';
import { trackRefs } from '../media';
import { useT } from '../i18n';
import { useUI } from './uiStore';

/** يربط مسار LiveKit بعنصر فيديو */
export function useAttach(track: Track | undefined, muted = true) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el || !track) return;
    el.muted = muted; track.attach(el);
    return () => { track.detach(el); };
  }, [track, muted]);
  return ref;
}

function Tile({ id, big, mirror }: { id: string; big?: boolean; mirror?: boolean }) {
  const players = useGame((s) => s.players), speaking = useGame((s) => s.media.speaking[id]), micOn = useGame((s) => s.media.micOn[id]);
  useGame((s) => s.media.v);
  const me = useGame((s) => s.myId);
  const t = useT(); const setBig = useUI((s) => s.setBigTile);
  const tr = trackRefs.get(id)?.cam; const ref = useAttach(tr);
  const p = players[id];
  return (
    <div className={'tile' + (speaking ? ' speaking' : '') + (big ? ' big' : '')} onClick={() => setBig(big ? null : id)} title={t('enlarge')}>
      <video ref={ref} autoPlay playsInline muted style={mirror ? { transform: 'scaleX(-1)' } : undefined} />
      <div className="tl"><span>{micOn ? '🎤' : '🔇'}</span> {id === me ? t('you_cam') : p?.name}</div>
    </div>
  );
}

const SW_MID = 420; // مستويات النافذة: 0 صغيرة، 1 متوسطة، 2 ملء الشاشة

export function ScreenWindow({ id, onFull }: { id: string; onFull?: () => void }) {
  const t = useT(); useGame((s) => s.media.v);
  const name = useGame((s) => s.players[id]?.name ?? '');
  const tr = trackRefs.get(id)?.screen; const ref = useAttach(tr);
  const [lv, setLv] = useState(0);
  return (
    <div className={'screenwin' + (lv ? ' enl' : '') + (lv === 2 ? ' full' : '')} style={lv === 1 ? { width: `min(${SW_MID}px, calc(100vw - 16px))` } : undefined}>
      <div className="sw-h"><b>🖥 {t('screen_of', { n: name })}</b>
        <span>
          <button onClick={() => setLv(Math.max(0, lv - 1))} disabled={lv === 0} title="−">−</button>
          <button onClick={() => setLv(Math.min(2, lv + 1))} disabled={lv === 2} title="+">+</button>
          <button onClick={() => setLv(lv === 2 ? 1 : 2)} title="⛶">{lv === 2 ? '✕' : '⛶'}</button>
          {onFull && <button onClick={onFull}>{t('proj_open')}</button>}
        </span>
      </div>
      <video ref={ref} autoPlay playsInline muted />
    </div>
  );
}

export default function Tiles() {
  const players = useGame((s) => s.players), speaking = useGame((s) => s.media.speaking), me = useGame((s) => s.myId), proj = useGame((s) => s.proj);
  useGame((s) => s.media.v);
  const hide = useUI((s) => s.hideTiles), big = useUI((s) => s.bigTile), setFull = useUI((s) => s.setProjFull);
  const t = useT();
  const ids = Object.keys(players).filter((id) => trackRefs.get(id)?.cam);
  ids.sort((a, b) => (id2n(speaking[b]) - id2n(speaking[a])) || (a === me ? -1 : b === me ? 1 : players[a].name.localeCompare(players[b].name)));
  const shows = ids.slice(0, 6), more = ids.length - shows.length;
  const sharers = Object.keys(players).filter((id) => trackRefs.get(id)?.screen && !(proj.mode === 'screen' && proj.screenBy === id));
  const hasAny = ids.length > 0 || sharers.length > 0;
  if (!hasAny) return null;
  return (
    <div className="tiles">
      {sharers.slice(0, 1).map((id) => <ScreenWindow key={id} id={id} />)}
      {ids.length > 0 && <button className="tiles-toggle" onClick={() => useUI.getState().setHideTiles(!hide)}>{hide ? '📹' : '▾'} {ids.length}</button>}
      {!hide && (big && ids.includes(big) ? <Tile id={big} big /> : shows.map((id) => <Tile key={id} id={id} mirror={id === me} />))}
      {!hide && more > 0 && !big && <div className="more">+{more}</div>}
      {proj.mode === 'screen' && <button className="tiles-toggle" onClick={() => setFull(true)}>🖥 {t('proj_open')}</button>}
    </div>
  );
}
const id2n = (v: boolean | undefined) => (v ? 1 : 0);
