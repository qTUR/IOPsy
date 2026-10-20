import { useEffect, useState } from 'react';
import { useGame } from '../store';
import { joinRoom, startAsAdmin } from '../net';
import { startAudio } from '../audio';
import { applyLang, useOpt, useT } from '../i18n';
import { ABAYAS, BAGS, BEARDS, GLASSES, HAIRS, HEADS_F, HEADS_M, OUTERS, SHAYLAS, SHOES, SKINS, THOBES } from '../scene/avatarBuilder';

function Swatches({ colors, value, onPick }: { colors: string[]; value: number; onPick: (i: number) => void }) {
  return <div className="sws">{colors.map((c, i) => <button key={i} className={'sw' + (value === i ? ' sel' : '')} style={{ background: c }} onClick={() => onPick(i)} />)}</div>;
}
function Opts({ items, value, onPick }: { items: string[]; value: number; onPick: (i: number) => void }) {
  const o = useOpt();
  return <div className="seg wrap">{items.map((h, i) => <button key={h} className={value === i ? 'sel' : ''} onClick={() => onPick(i)}>{o(h)}</button>)}</div>;
}

const SAVE = 'iopsy.profile';

export default function Join() {
  const t = useT(); const o = useOpt();
  const { name, look, mode, conn, settings, setName, setLook, setMode, setSettings } = useGame();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const f = look.g === 'f';
  const busy = conn.status === 'connecting';

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem(SAVE) || 'null'); if (s) { if (s.name) setName(s.name); if (s.look) setLook({ ...s.look }); } } catch { /* */ }
    const q = new URLSearchParams(location.search).get('code'); if (q) setCode(q.toUpperCase().slice(0, 8));
  }, [setName, setLook]);

  const canGo = !!name.trim() && !busy && (mode === 'admin' ? password.length > 0 : code.trim().length >= 4);
  const go = () => {
    if (!canGo) return;
    try { localStorage.setItem(SAVE, JSON.stringify({ name, look })); } catch { /* */ }
    startAudio();
    if (mode === 'admin') void startAsAdmin(password, name.trim(), look); else void joinRoom(code, name.trim(), look);
  };
  const other = settings.lang === 'ar' ? 'en' : 'ar';

  return (
    <div className="join">
      <div className="card" onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') go(); }}>
        <div className="frieze" />
        <button className="langbtn" onClick={() => { setSettings({ lang: other }); applyLang(other); }}>{t('language')}</button>
        <h1>IOPsy</h1>
        <p className="sub">{t('app_tagline')}</p>

        <div className="seg tabs">
          <button className={mode === 'user' ? 'sel' : ''} onClick={() => setMode('user')}>{t('tab_join')}</button>
          <button className={mode === 'admin' ? 'sel' : ''} onClick={() => setMode('admin')}>{t('tab_admin')}</button>
        </div>

        <label>{t('your_name')}</label>
        <input value={name} maxLength={16} placeholder={t('name_ph')} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        {mode === 'user' ? (
          <>
            <label>{t('session_code')}</label>
            <input className="code" value={code} maxLength={8} placeholder="ABC123" dir="ltr" onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} autoComplete="off" />
          </>
        ) : (
          <>
            <label>{t('admin_password')}</label>
            <input type="password" value={password} dir="ltr" onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </>
        )}
        {conn.error && <div className="err">{conn.error}</div>}

        <label>{t('character')}</label>
        <div className="seg">
          <button className={!f ? 'sel' : ''} onClick={() => setLook({ g: 'm' })}>{t('man')}</button>
          <button className={f ? 'sel' : ''} onClick={() => setLook({ g: 'f' })}>{t('woman')}</button>
        </div>
        <label>{f ? t('abaya_color') : t('thobe_color')}</label>
        <Swatches colors={f ? ABAYAS : THOBES} value={look.c} onPick={(c) => setLook({ c })} />
        <label>{f ? t('hijab') : t('headwear')}</label>
        <Opts items={f ? HEADS_F : HEADS_M} value={look.h} onPick={(h) => setLook({ h })} />
        {f && <><label>{t('hijab_color')}</label><Swatches colors={SHAYLAS} value={look.sc} onPick={(sc) => setLook({ sc })} /></>}
        {!f && <>
          <label>{t('outer')}</label><Opts items={OUTERS} value={look.o} onPick={(v) => setLook({ o: v })} />
          <label>{t('beard')}</label><Opts items={BEARDS} value={look.b} onPick={(b) => setLook({ b })} />
          {look.h === 5 && <><label>{t('hair')}</label><Opts items={HAIRS} value={look.hr} onPick={(hr) => setLook({ hr })} /></>}
        </>}
        <label>{t('skin')}</label>
        <Swatches colors={SKINS} value={look.s} onPick={(s) => setLook({ s })} />
        <label>{t('glasses')}</label><Opts items={GLASSES} value={look.gl} onPick={(gl) => setLook({ gl })} />
        <label>{t('shoes')}</label><Opts items={SHOES} value={look.sh} onPick={(sh) => setLook({ sh })} />
        <label>{t('accessories')}</label>
        <div className="seg wrap">
          {BAGS.map((h, i) => <button key={h} className={look.bag === i ? 'sel' : ''} onClick={() => setLook({ bag: i })}>{o(h)}</button>)}
          <button className={look.w ? 'sel' : ''} onClick={() => setLook({ w: look.w ? 0 : 1 })}>{t('watch')}</button>
        </div>

        <button className="go" disabled={!canGo} onClick={go}>{busy ? t('entering') : mode === 'admin' ? t('start_session') : t('enter_camp')}</button>
        <p className="note">{mode === 'admin' ? t('note_admin') : t('note_user')}</p>
        <div className="frieze bottom" />
      </div>
    </div>
  );
}
