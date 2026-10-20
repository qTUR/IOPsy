import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store';
import { sendChat, sendDm } from '../net';
import { useT } from '../i18n';
import { useUI } from './uiStore';

export default function Chat() {
  const t = useT();
  const chat = useGame((s) => s.chat), myId = useGame((s) => s.myId), players = useGame((s) => s.players), lang = useGame((s) => s.settings.lang);
  const { dmTo, setDmTo, setPanel } = useUI();
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView(); }, [chat.length]);
  useEffect(() => { if (dmTo && !players[dmTo]) setDmTo(null); }, [dmTo, players, setDmTo]);
  const submit = () => { const v = text.trim(); if (!v) return; if (dmTo) sendDm(dmTo, v); else sendChat(v); setText(''); };
  const fmt = (ts: number) => new Date(ts).toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  const others = Object.values(players).filter((p) => p.id !== myId);
  return (
    <div className="panel chatp">
      <div className="ph"><b>💬 {t('chat_title')}</b><button onClick={() => setPanel(null)}>✕</button></div>
      <div className="log">
        {chat.map((m, i) => (
          <div key={i} className={'msg' + (m.id === myId ? ' mine' : '') + (m.dm ? ' dm' : '')}>
            <b>{m.name}</b>{m.dm && <span className="lock"> 🔒 {m.id === myId ? '→ ' + m.dm.toName : t('private')}</span>} <small>{fmt(m.ts)}</small>
            <div dir="auto">{m.text}</div>
          </div>
        ))}
        <div ref={end} />
      </div>
      <select className="dmsel" value={dmTo ?? ''} onChange={(e) => setDmTo(e.target.value || null)}>
        <option value="">{t('to_all')}</option>
        {others.map((p) => <option key={p.id} value={p.id}>{t('to_user', { n: p.name })}</option>)}
      </select>
      <div className="row">
        <input value={text} maxLength={300} placeholder={t('chat_ph')} dir="auto" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') submit(); }} />
        <button onClick={submit}>{t('send')}</button>
      </div>
    </div>
  );
}
