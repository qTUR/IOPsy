import { useEffect, useState } from 'react';
import { useGame } from '../store';
import { gameAct } from '../net';
import { useT } from '../i18n';
import { serverNow } from '../projector';
import { player } from '../scene/Player';
import { live } from '../store';
import { useUI } from './uiStore';

/** لوحة الألعاب: السيجة + الغميضة */
export default function Games() {
  const t = useT();
  const { games, myId, players, role } = useGame();
  const setPanel = useUI((s) => s.setPanel);
  const siga = games.siga, hs = games.hs;
  const seat = siga ? siga.seats.indexOf(myId) : -1;
  const joined = hs.joined.includes(myId);
  const race = games.race, inRace = race.joined.includes(myId);
  const staff = role === 'owner' || role === 'mod';
  const nm = (id: string | null) => (id ? players[id]?.name ?? '' : '');
  const canStart = hs.phase === 'idle' && hs.joined.length >= 2 && (staff || joined);
  return (
    <div className="panel gamesp">
      <div className="ph"><b>🎲 {t('games_title')}</b><button onClick={() => setPanel(null)}>✕</button></div>
      <div className="gm-body">
        {/* السيجة */}
        <section className="gm-card">
          <h3>🪨 {t('siga_name')}</h3>
          <p>{t('siga_desc')}</p>
          {siga && (
            <>
              <div className="gm-seats">
                {[0, 1].map((k) => (
                  <div key={k} className={'gm-seat s' + k + (siga.turn === k + 1 && siga.status === 'playing' ? ' turn' : '')}>
                    <i className={'stone ' + (k ? 'dark' : 'light')} />
                    <span>{siga.seats[k] ? nm(siga.seats[k]) || siga.names[k] : <button onClick={() => gameAct('siga', 'join')} disabled={seat >= 0}>{t(k ? 'sit_black' : 'sit_white')}</button>}</span>
                  </div>
                ))}
              </div>
              {siga.status === 'waiting' && <p className="note sm">{t('siga_wait')}</p>}
              {siga.status === 'playing' && <p className="gm-status">{siga.turn === seat + 1 ? (siga.cont != null ? t('siga_continue') : t('siga_your_turn')) : t('siga_their_turn', { n: siga.names[siga.turn - 1] })}</p>}
              {siga.status === 'over' && <p className="gm-status win">{siga.winner ? t('siga_won', { n: siga.names[siga.winner - 1] }) : t('siga_draw')}</p>}
              {seat >= 0 && siga.status === 'over' && <button className="bigbtn" onClick={() => gameAct('siga', 'again')}>{t('siga_again')}</button>}
              {seat >= 0 && <button className="bigbtn" onClick={() => gameAct('siga', 'leave')}>{t('stand_up')}</button>}
              {seat < 0 && siga.status === 'playing' && <p className="note sm">{t('siga_spectating')}</p>}
              <p className="note sm">{t('siga_rules')}</p>
            </>
          )}
        </section>

        {/* الغميضة */}
        <section className="gm-card">
          <h3>🙈 {t('hs_name')}</h3>
          <p>{t('hs_desc')}</p>
          <div className="gm-joined"><b>{t('hs_players', { n: String(hs.joined.length) })}</b>{hs.joined.map((id) => <span key={id} className={'chip' + (id === hs.seeker ? ' seeker' : '') + (hs.found.includes(id) ? ' found' : '')}>{id === hs.seeker ? '🔍 ' : hs.found.includes(id) ? '✓ ' : ''}{nm(id)}</span>)}</div>
          {hs.phase === 'idle' && !joined && <button className="bigbtn" onClick={() => gameAct('hs', 'join')}>{t('hs_join')}</button>}
          {hs.phase === 'idle' && joined && <button className="bigbtn" onClick={() => gameAct('hs', 'leave')}>{t('hs_leave')}</button>}
          {hs.phase === 'idle' && <button className="bigbtn on" disabled={!canStart} onClick={() => gameAct('hs', 'start')}>▶ {t('hs_start')}</button>}
          {hs.phase === 'idle' && hs.joined.length < 2 && <p className="note sm">{t('hs_need')}</p>}
          {hs.phase !== 'idle' && joined && hs.phase !== 'over' && <button className="bigbtn" onClick={() => gameAct('hs', 'leave')}>{t('hs_leave')}</button>}
        </section>

        {/* سباق الهجن */}
        <section className="gm-card">
          <h3>🐪 {t('race_name')}</h3>
          <p>{t('race_desc')}</p>
          <div className="gm-joined"><b>{t('race_players', { n: String(race.joined.length) })}</b>{race.joined.map((id) => <span key={id} className="chip">{nm(id)}</span>)}</div>
          {race.phase === 'idle' && !inRace && <button className="bigbtn" onClick={() => gameAct('race', 'join')}>{t('race_join')}</button>}
          {race.phase === 'idle' && inRace && <button className="bigbtn" onClick={() => gameAct('race', 'leave')}>{t('race_leave')}</button>}
          {race.phase === 'idle' && <button className="bigbtn on" disabled={race.joined.length < 2 || !(staff || inRace)} onClick={() => gameAct('race', 'start')}>▶ {t('race_start')}</button>}
          {race.phase === 'idle' && race.joined.length < 2 && <p className="note sm">{t('race_need')}</p>}
        </section>
      </div>
    </div>
  );
}

/** عناصر عرض الغميضة فوق المشهد: ستارة العدّ، اللافتة، الحار/البارد، زر الاكتشاف */
export function GameHud() {
  const t = useT();
  const hs = useGame((s) => s.games.hs), myId = useGame((s) => s.myId), players = useGame((s) => s.players);
  const [, tick] = useState(0);
  const [hot, setHot] = useState(0);
  useEffect(() => { const i = setInterval(() => tick((n) => n + 1), 250); return () => clearInterval(i); }, []);
  const seeker = hs.seeker === myId, joined = hs.joined.includes(myId);
  const el = (serverNow() - hs.t0) / 1000;
  const left = Math.max(0, Math.ceil((hs.phase === 'counting' ? hs.counting : hs.hunting) - el));
  useEffect(() => {
    if (hs.phase !== 'hunting' || !seeker) return;
    let best = 99;
    for (const id of hs.joined) { if (id === myId || hs.found.includes(id)) continue; const l = live.get(id); if (l) best = Math.min(best, Math.hypot(l.x - player.pos.x, l.z - player.pos.z)); }
    setHot(best < 3.2 ? 3 : best < 8 ? 2 : best < 18 ? 1 : 0);
  });
  useEffect(() => {
    if (hs.phase !== 'hunting' || !seeker) return;
    const k = (e: KeyboardEvent) => { if (e.key.toLowerCase() === 'f' && (e.target as HTMLElement)?.tagName !== 'INPUT') gameAct('hs', 'tag'); };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, [hs.phase, seeker]);
  if (hs.phase === 'idle' || !joined && hs.phase !== 'over') return null;
  const sName = players[hs.seeker ?? '']?.name ?? '';
  const iAmFound = hs.found.includes(myId);
  const hiders = hs.joined.length - 1;
  return (
    <>
      {hs.phase === 'counting' && seeker && <div className="hs-curtain"><div className="hs-count">{left}</div><div className="hs-msg">{t('hs_you_seeker')}</div><div className="hs-sub">{t('hs_count_seeker', { s: String(left) })}</div></div>}
      <div className="hs-banner">
        {hs.phase === 'counting' && !seeker && <b>{t('hs_count_hider', { n: sName, s: String(left) })}</b>}
        {hs.phase === 'hunting' && seeker && <><b>{t('hs_hunting_seeker')}</b><span>{t('hs_time_left', { s: String(left) })} · {t('hs_found_count', { a: String(hs.found.length), b: String(hiders) })}</span><span className={'hot h' + hot}>{t(('hs_hot' + hot) as 'hs_hot0')}</span><button className="bigbtn on" onClick={() => gameAct('hs', 'tag')}>{t('hs_tag')}</button></>}
        {hs.phase === 'hunting' && !seeker && <><b>{iAmFound ? t('hs_found_me') : t('hs_hunting_hider', { n: sName })}</b><span>{t('hs_time_left', { s: String(left) })} · {t('hs_found_count', { a: String(hs.found.length), b: String(hiders) })}</span></>}
        {hs.phase === 'over' && hs.result && <b>{hs.result.seekerWins ? t('hs_seeker_won', { n: players[hs.result.seeker]?.name ?? '' }) : t('hs_hiders_won', { n: players[hs.result.seeker]?.name ?? '' })}</b>}
      </div>
    </>
  );
}
