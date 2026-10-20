import { useGame, type Perm } from '../store';
import { act } from '../net';
import { useT, type Key } from '../i18n';
import { useUI } from './uiStore';

const KINDS: { w: keyof Perm; ic: string; key: Key; gkey: Key }[] = [
  { w: 'mic', ic: '🎤', key: 'tb_mic', gkey: 'everyone_mic' },
  { w: 'cam', ic: '📷', key: 'tb_cam', gkey: 'everyone_cam' },
  { w: 'screen', ic: '🖥', key: 'tb_share', gkey: 'everyone_screen' },
];

/** لوحة إدارة الوسائط (للمدير والمشرفين): كتم الجميع + تقييد الميكروفون/الكاميرا/المشاركة */
export default function Manage() {
  const t = useT();
  const { players, myId, role, gperm } = useGame();
  const setPanel = useUI((s) => s.setPanel);
  const targets = Object.values(players).filter((p) => p.id !== myId && (role === 'owner' ? p.role !== 'owner' : p.role === 'user'));
  return (
    <div className="panel manage">
      <div className="ph"><b>🛡 {t('mng_title')}</b><button onClick={() => setPanel(null)}>✕</button></div>
      <div className="mg-body">
        <button className="bigbtn" onClick={() => act('muteall')}>🔇 {t('mute_all')}</button>
        <div className="mg-sec">
          {KINDS.map((k) => (
            <label key={k.w} className="sw-row">
              <span>{k.ic} {t(k.gkey)}</span>
              <button className={'pill ' + (gperm[k.w] ? 'ok' : 'no')} onClick={() => act('perm', { id: 'all', what: k.w, v: !gperm[k.w] })}>{gperm[k.w] ? t('allowed') : t('blocked')}</button>
            </label>
          ))}
        </div>
        <div className="mg-list">
          {targets.map((p) => (
            <div key={p.id} className="mg-user">
              <div className="mg-nm">{p.name}</div>
              <div className="mg-btns">
                {KINDS.map((k) => (
                  <button key={k.w} className={'pill sm ' + (p.perm[k.w] ? 'ok' : 'no')} title={t(k.key)} onClick={() => act('perm', { id: p.id, what: k.w, v: !p.perm[k.w] })}>{k.ic}{p.perm[k.w] ? '' : '✕'}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
