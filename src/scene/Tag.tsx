import { useEffect, useState } from 'react';
import { Html } from '@react-three/drei';
import { useGame } from '../store';
import { useT } from '../i18n';


/** اسم اللاعب + شارة الدور + فقاعة الكلام فوق الرأس */
export default function Tag({ id, name, role, away, hidden }: { id: string; name: string; role: 'owner' | 'mod' | 'user'; away?: boolean; hidden?: boolean }) {
  const t = useT();
  const say = useGame((s) => s.says[id]);
  const speaking = useGame((s) => !!s.media.speaking[id]);
  const micOff = useGame((s) => s.media.state === 'on' && s.media.micOn[id] === false);
  const [, tick] = useState(0);
  useEffect(() => { if (!say) return; const t = setTimeout(() => tick((n) => n + 1), Math.max(50, say.until - Date.now())); return () => clearTimeout(t); }, [say]);
  const hsSeeker = useGame((s) => s.games.hs.phase !== 'idle' && s.games.hs.seeker === id), hsFound = useGame((s) => s.games.hs.phase === 'hunting' && s.games.hs.found.includes(id));
  const showSay = say && say.until > Date.now() && say.text;
  if (hidden) return null;
  return (
    <Html position={[0, 2.1, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      {showSay && <div className="bubble">{say.text}</div>}
      <div className={'tag' + (away ? ' away' : '') + (role !== 'user' ? ' r-' + role : '') + (speaking ? ' speaking' : '')}>
        {role !== 'user' && <span className="badge">{t(role === 'owner' ? 'role_owner' : 'role_mod')}</span>}
        {hsSeeker && <span className="hs-badge">🔍</span>}{hsFound && <span className="hs-badge">✓</span>}{speaking ? <span className="mic-on">🎤</span> : micOff ? <span className="mic-off">🔇</span> : null}{name}{away ? ` (${t('offline')})` : ''}
      </div>
    </Html>
  );
}
