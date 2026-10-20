import { useEffect, useState } from 'react';
import { useGame } from '../store';
import { adminAct, leave } from '../net';
import { toggleCam, toggleMic, toggleScreen } from '../media';
import { useT } from '../i18n';
import { useUI } from './uiStore';
import People from './People';
import Chat from './Chat';
import Manage from './Manage';
import Settings from './Settings';
import ProjectorPanel from './ProjectorPanel';
import ProjectorOverlay from './ProjectorOverlay';
import Tiles from './Tiles';
import Games, { GameHud } from './Games';
import RaceHud from './RaceHud';
import { canShareScreen } from '../input';

function RoomBar() {
  const t = useT();
  const { roomCode, role, locked, players } = useGame();
  const [copied, setCopied] = useState(false);
  const count = Object.keys(players).length;
  const copy = async () => {
    const link = `${location.origin}/?code=${roomCode}`;
    try { await navigator.clipboard.writeText(role === 'owner' ? link : roomCode); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* */ }
  };
  return (
    <div className="roombar">
      <div className="rb-code"><small>{t('code_label')}</small><b dir="ltr">{roomCode}</b></div>
      <button className="rb-btn" onClick={copy}>{copied ? t('copied') : role === 'owner' ? t('copy_invite') : t('copy_code')}</button>
      <div className="rb-count">👥 {count}<small>/20</small></div>
      {locked && <div className="rb-lock">{t('locked_badge')}</div>}
    </div>
  );
}

function Toast() {
  const toast = useGame((s) => s.toast); const [, tick] = useState(0);
  useEffect(() => { if (!toast) return; const i = setTimeout(() => tick((n) => n + 1), Math.max(30, toast.until - Date.now())); return () => clearTimeout(i); }, [toast]);
  if (!toast || toast.until < Date.now()) return null;
  return <div className={'toast ' + toast.kind}>{toast.text}</div>;
}

function Toolbar() {
  const t = useT();
  const { role, locked, perm, gperm } = useGame();
  const media = useGame((s) => s.media);
  const proj = useGame((s) => s.proj);
  const { panel, togglePanel, setProjFull } = useUI();
  const staff = role === 'owner' || role === 'mod';
  const can = (w: 'mic' | 'cam' | 'screen') => role === 'owner' || perm[w];
  const blockedAll = role !== 'owner' && !gperm.mic;
  const unread = useGame((s) => s.chat.length);
  const [seen, setSeen] = useState(0);
  useEffect(() => { if (panel === 'chat') setSeen(unread); }, [panel, unread]);
  const B = ({ on, off, ic, label, onClick, cls = '', badge }: { on?: boolean; off?: boolean; ic: string; label: string; onClick: () => void; cls?: string; badge?: number }) => (
    <button className={cls + (on ? ' on' : '') + (off ? ' off' : '')} onClick={onClick} title={label}>{ic}<span>{label}</span>{badge ? <i>{badge}</i> : null}</button>
  );
  return (
    <div className="toolbar">
      <B ic={media.mic ? '🎤' : '🔇'} label={t('tb_mic')} on={media.mic} off={!can('mic')} onClick={() => void toggleMic()} cls={!media.mic ? 'muted' : ''} />
      <B ic={media.cam ? '📷' : '🚫'} label={t('tb_cam')} on={media.cam} off={!can('cam')} onClick={() => void toggleCam()} cls={!media.cam ? 'muted' : ''} />
      {canShareScreen() && <B ic="🖥" label={t('tb_share')} on={media.screen} off={!can('screen')} onClick={() => void toggleScreen()} />}
      <i className="sep" />
      <B ic="👥" label={t('tb_people')} on={panel === 'people'} onClick={() => togglePanel('people')} />
      <B ic="💬" label={t('tb_chat')} on={panel === 'chat'} onClick={() => togglePanel('chat')} badge={panel === 'chat' ? 0 : Math.max(0, unread - seen)} />
      <B ic="🎞" label={t('tb_projector')} on={panel === 'proj' || proj.mode !== 'idle'} onClick={() => (proj.mode !== 'idle' && panel === 'proj' ? setProjFull(true) : togglePanel('proj'))} />
      <B ic="🎲" label={t('tb_games')} on={panel === 'games'} onClick={() => togglePanel('games')} />
      {staff && <B ic="🛡" label={t('tb_manage')} on={panel === 'manage'} onClick={() => togglePanel('manage')} />}
      <B ic="⚙" label={t('tb_settings')} on={panel === 'settings'} onClick={() => togglePanel('settings')} />
      <i className="sep" />
      {role === 'owner' && <B ic={locked ? '🔒' : '🔓'} label={locked ? t('tb_unlock') : t('tb_lock')} on={locked} onClick={() => adminAct(locked ? 'unlock' : 'lock')} />}
      {role === 'owner'
        ? <B ic="⏹" label={t('tb_end')} cls="danger" onClick={() => { if (confirm(t('confirm_end'))) adminAct('end'); }} />
        : <B ic="🚪" label={t('tb_leave')} cls="danger" onClick={() => leave()} />}
      {blockedAll && <small className="tb-note">{t('mic_off_all')}</small>}
    </div>
  );
}

export default function Hud() {
  const t = useT();
  const { conn } = useGame();
  const { panel, projFull } = useUI();
  return (
    <div className="hud">
      <RoomBar />
      <div className="hint"><span><kbd>W A S D</kbd> {t('hint_move')}</span><span><kbd>Shift</kbd> {t('hint_run')}</span><span>{t('hint_drag')}</span><span><kbd>1</kbd>–<kbd>5</kbd> {t('hint_emote')}</span><span><kbd>C</kbd> {t('hint_sit')}</span></div>
      <Tiles />
      <div className="dock">
        {panel === 'people' && <People />}
        {panel === 'chat' && <Chat />}
        {panel === 'proj' && <ProjectorPanel />}
        {panel === 'manage' && <Manage />}
        {panel === 'settings' && <Settings />}
        {panel === 'games' && <Games />}
      </div>
      <Toolbar />
      <GameHud />
      <RaceHud />
      <Toast />
      {projFull && <ProjectorOverlay />}
      {conn.status === 'reconnecting' && <div className="reconnect">{t('reconnecting')}</div>}
    </div>
  );
}
