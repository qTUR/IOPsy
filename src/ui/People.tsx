import { useGame, type Role } from '../store';
import { act, adminAct } from '../net';
import { trackRefs } from '../media';
import { useT, type Key } from '../i18n';
import { useUI } from './uiStore';

const ROLE_KEY: Record<Role, Key> = { owner: 'role_owner', mod: 'role_mod', user: 'role_user' };

export default function People() {
  const t = useT();
  const { players, myId, role } = useGame();
  const speaking = useGame((s) => s.media.speaking), micOn = useGame((s) => s.media.micOn);
  useGame((s) => s.media.v);
  const { setPanel, setDmTo } = useUI();
  const staff = role === 'owner' || role === 'mod';
  const list = Object.values(players).sort((a, b) => (a.role === 'owner' ? -1 : b.role === 'owner' ? 1 : a.role === b.role ? a.name.localeCompare(b.name) : a.role === 'mod' ? -1 : 1));
  return (
    <div className="panel people">
      <div className="ph"><b>{t('participants')} ({list.length})</b><button onClick={() => setPanel(null)}>✕</button></div>
      <ul>
        {list.map((p) => {
          const hasCam = !!trackRefs.get(p.id)?.cam, hasScr = !!trackRefs.get(p.id)?.screen;
          const canAct = staff && p.id !== myId && (role === 'owner' ? p.role !== 'owner' : p.role === 'user');
          return (
            <li key={p.id} className={p.on ? '' : 'off'}>
              <span className={'dot' + (p.on ? '' : ' off') + (speaking[p.id] ? ' talk' : '')} />
              <span className="nm">{p.name}{p.id === myId ? ` (${t('you')})` : ''}</span>
              <span className="media-ic">{micOn[p.id] ? '🎤' : '🔇'}{hasCam ? '📷' : ''}{hasScr ? '🖥' : ''}</span>
              <span className={'role r-' + p.role}>{t(ROLE_KEY[p.role])}</span>
              <span className="acts">
                {p.id !== myId && <button title={t('dm')} onClick={() => setDmTo(p.id)}>💬</button>}
                {canAct && micOn[p.id] && <button title={t('mute')} onClick={() => act('mute', { id: p.id })}>🔇</button>}
                {canAct && hasCam && <button title={t('stop_cam')} onClick={() => act('stop', { id: p.id, what: 'cam' })}>📷✕</button>}
                {canAct && hasScr && <button title={t('stop_screen')} onClick={() => act('stop', { id: p.id, what: 'screen' })}>🖥✕</button>}
                {role === 'owner' && p.role !== 'owner' && (p.role === 'user'
                  ? <button title={t('promote')} onClick={() => adminAct('promote', p.id)}>⭐</button>
                  : <button title={t('demote')} onClick={() => adminAct('demote', p.id)}>☆</button>)}
                {role === 'owner' && p.role !== 'owner' && <button title={t('kick')} onClick={() => { if (confirm(t('confirm_kick', { n: p.name }))) adminAct('kick', p.id); }}>🚪</button>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
