import { useEffect, useRef, useState } from 'react';
import { touch, isTouchDevice } from '../input';
import { bus, sendEmote } from '../net';
import { useGame } from '../store';
import { useT } from '../i18n';
import type { EmoteName } from '../scene/avatarBuilder';

const EMOS: [EmoteName, string][] = [['wave', '👋'], ['chest', '☕'], ['clap', '👏'], ['nose', '🤝'], ['thumb', '👍']];

/** عصا حركة + أزرار للجوال: ركض، جلوس، تحيّات */
export default function TouchControls() {
  const t = useT();
  const [show] = useState(isTouchDevice);
  const [emo, setEmo] = useState(false), [run, setRun] = useState(false);
  const pad = useRef<HTMLDivElement>(null), knob = useRef<HTMLDivElement>(null);
  const counting = useGame((s) => s.games.hs.phase === 'counting' && s.games.hs.seeker === s.myId);

  useEffect(() => {
    if (!show) return;
    const el = pad.current!, kn = knob.current!; let id: number | null = null, cx = 0, cy = 0; const R = 52;
    const set = (e: PointerEvent) => {
      let dx = e.clientX - cx, dy = e.clientY - cy; const l = Math.hypot(dx, dy);
      if (l > R) { dx = (dx / l) * R; dy = (dy / l) * R; }
      kn.style.transform = `translate(${dx}px,${dy}px)`; touch.x = dx / R; touch.z = dy / R;
    };
    const down = (e: PointerEvent) => { if (id !== null) return; id = e.pointerId; el.setPointerCapture(id); const r = el.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; set(e); e.preventDefault(); };
    const move = (e: PointerEvent) => { if (e.pointerId === id) set(e); };
    const up = (e: PointerEvent) => { if (e.pointerId !== id) return; id = null; touch.x = 0; touch.z = 0; kn.style.transform = ''; };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    return () => { el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); touch.x = touch.z = 0; touch.run = false; };
  }, [show]);
  useEffect(() => { touch.run = run; }, [run]);
  const racer = useGame((s) => s.games.race.phase !== 'idle' && s.games.race.joined.includes(s.myId));
  if (!show || counting || racer) return null;
  return (
    <div className="touchctl">
      <div className="joy" ref={pad}><div className="knob" ref={knob} /></div>
      <div className="tc-btns">
        {emo && <div className="tc-emotes">{EMOS.map(([n, ic]) => <button key={n} onClick={() => { sendEmote(n); setEmo(false); }}>{ic}</button>)}</div>}
        <button className={run ? 'on' : ''} onClick={() => setRun(!run)} aria-label={t('hint_run')}>🏃</button>
        <button onClick={() => bus.dispatchEvent(new Event('sit'))} aria-label={t('hint_sit')}>🧎</button>
        <button className={emo ? 'on' : ''} onClick={() => setEmo(!emo)} aria-label={t('hint_emote')}>👋</button>
      </div>
    </div>
  );
}
