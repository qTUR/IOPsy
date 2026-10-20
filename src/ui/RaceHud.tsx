import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store';
import { gameAct } from '../net';
import { useT } from '../i18n';
import { serverNow } from '../projector';
import { player } from '../scene/Player';
import { useUI } from './uiStore';

const MEDAL = ['🥇', '🥈', '🥉'];

/** واجهة سباق الهجن: العدّ التنازلي، أزرار الضغط (لمس/لوحة مفاتيح)، شريط التقدّم، والنتيجة */
export default function RaceHud() {
  const t = useT();
  const race = useGame((s) => s.games.race), myId = useGame((s) => s.myId), players = useGame((s) => s.players);
  const raceCam = useUI((s) => s.raceCam), setRaceCam = useUI((s) => s.setRaceCam);
  const [, tick] = useState(0);
  const [flash, setFlash] = useState<'l' | 'r' | null>(null);
  const side = useRef<'l' | 'r'>('l');
  const setPanel = useUI((s) => s.setPanel);
  const mine = race.joined.includes(myId), running = race.phase === 'racing', me = race.progress[myId] ?? 0;
  useEffect(() => { if (mine && race.phase === 'countdown') setPanel(null); }, [mine, race.phase, setPanel]);
  const done = race.finished.some((f) => f.id === myId);
  useEffect(() => { const i = setInterval(() => tick((n) => n + 1), 100); return () => clearInterval(i); }, []);

  const tap = (s: 'l' | 'r') => { if (!running || !mine || done) return; gameAct('race', 'tap', { side: s }); setFlash(s); setTimeout(() => setFlash(null), 90); side.current = s === 'l' ? 'r' : 'l'; };
  useEffect(() => {
    if (!mine || !running) return;
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || e.repeat) return;
      const key = e.key.toLowerCase();
      if (['a', 'arrowleft', 'z'].includes(key)) { e.preventDefault(); tap('l'); }
      else if (['d', 'arrowright', 'x'].includes(key)) { e.preventDefault(); tap('r'); }
      else if (key === ' ') { e.preventDefault(); tap(side.current); }
    };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  if (race.phase === 'idle') return null;
  const left = Math.max(0, Math.ceil(race.countdown - (serverNow() - race.t0) / 1000));
  const rank = [...race.joined].sort((a, b) => (race.progress[b] ?? 0) - (race.progress[a] ?? 0)).indexOf(myId) + 1;
  const nm = (id: string) => players[id]?.name ?? '';
  const first = race.finished[0];
  return (
    <>
      {race.phase === 'countdown' && <div className="race-count" key={left}>{left > 0 ? left : t('race_go')}</div>}
      {race.phase === 'countdown' && mine && <div className="race-sub">{t('race_ready')} · {t('race_tap_hint')}</div>}
      {running && mine && !done && (
        <div className="race-pad">
          <div className="race-bar"><i style={{ width: `${me}%` }} /><b>{t('race_rank', { n: String(rank) })}</b></div>
          <div className="race-btns">
            <button className={flash === 'l' ? 'hit' : ''} onPointerDown={(e) => { e.preventDefault(); tap('l'); }}>◀ {t('race_left')}</button>
            <button className={flash === 'r' ? 'hit' : ''} onPointerDown={(e) => { e.preventDefault(); tap('r'); }}>{t('race_right')} ▶</button>
          </div>
          <small>{t('race_tap_hint')}</small>
        </div>
      )}
      {running && !mine && (
        <div className="race-watch">
          <b>🐪 {t('race_running')}</b>
          <button onClick={() => { player.pos.set(0, 0, 21); }}>{t('race_goto')}</button>
          <button className={raceCam ? 'on' : ''} onClick={() => setRaceCam(!raceCam)}>🎥 {t('race_cam')}</button>
        </div>
      )}
      {race.phase === 'over' && (
        <div className="race-results">
          <h3>🏁 {t('race_results')}</h3>
          {first && first.id === myId && <div className="win">{t('race_you_won')}</div>}
          <ol>{race.finished.map((f, i) => <li key={f.id} className={f.id === myId ? 'me' : ''}><span>{MEDAL[i] ?? i + 1}</span><b>{nm(f.id)}</b><em>{f.t != null ? t('race_time', { s: (f.t / 1000).toFixed(1) }) : t('race_dnf')}</em></li>)}</ol>
        </div>
      )}
    </>
  );
}
