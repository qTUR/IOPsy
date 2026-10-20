// اتصال الخادم: يدخل الغرفة، يزامن الشخصيات والصلاحيات والعارض، ويعيد الاتصال تلقائيًا
import { useGame, live, IDLE_PROJ, IDLE_HS, IDLE_RACE, type Remote, type Perm } from './store';
import type { EmoteName, Look } from './scene/avatarBuilder';
import { t, ERR_KEY, type Key } from './i18n';
import { connectMedia, disconnectMedia, forceStop } from './media';
import { setSkew } from './projector';

import { WS_URL } from './config';
const wsUrl = () => WS_URL;
const TOKEN_KEY = 'iopsy.token';
export const EMOTE_TEXT: Record<EmoteName, string> = { wave: 'السلام عليكم 👋', chest: 'حيّاك الله ☕', clap: 'ما شاء الله 👏', nose: 'هلا والله 🤝', thumb: 'الله يعطيك العافية 👍' };
const EMOTE_TEXT_EN: Record<EmoteName, string> = { wave: 'Peace be upon you 👋', chest: 'Welcome ☕', clap: 'Mashallah 👏', nose: 'Hello there 🤝', thumb: 'Thank you 👍' };

export const bus = new EventTarget();
const emit = (name: string, detail: unknown) => bus.dispatchEvent(new CustomEvent(name, { detail }));

let ws: WebSocket | null = null;
let intentionalClose = false;
let retryTimer = 0;
const errText = (c: string) => t(ERR_KEY[c] ?? 'err_generic');

/* eslint-disable @typescript-eslint/no-explicit-any */
const mkRemote = (p: any): Remote => ({ id: p.id, name: p.name, look: p.look, role: p.role, on: p.on !== false, perm: p.perm });

function applyWelcome(m: any) {
  sessionStorage.setItem(TOKEN_KEY, m.token);
  const players: Record<string, Remote> = {};
  live.clear();
  for (const p of m.players) { players[p.id] = mkRemote(p); live.set(p.id, { x: p.x, z: p.z, ry: p.ry, mv: p.mv, sit: p.sit }); }
  const mine = players[m.id];
  useGame.setState({ myId: m.id, token: m.token, role: m.role, roomCode: m.code, locked: m.locked, players, phase: 'play', conn: { status: 'in' }, chat: [], perm: mine?.perm ?? { mic: true, cam: true, screen: false }, gperm: m.gperm, proj: m.proj ?? IDLE_PROJ });
  setSkew(m.now);
  useGame.setState({ games: { siga: m.games?.siga ?? null, hs: m.games?.hs ?? IDLE_HS, race: m.games?.race ?? IDLE_RACE } });
  if (m.lk?.token) void connectMedia(m.lk.token);
  emit('welcome', {});
}

function setPerm(id: string, perm: Perm) {
  const S = useGame.getState(); const p = S.players[id];
  useGame.setState({ players: p ? { ...S.players, [id]: { ...p, perm } } : S.players, perm: id === S.myId ? perm : S.perm });
}

function handle(m: any) {
  const S = useGame.getState();
  switch (m.t) {
    case 'joined':
      useGame.setState({ players: { ...S.players, [m.p.id]: mkRemote(m.p) } });
      live.set(m.p.id, { x: m.p.x, z: m.p.z, ry: m.p.ry, mv: m.p.mv, sit: m.p.sit }); break;
    case 'left': { const rest = { ...S.players }; delete rest[m.id]; live.delete(m.id); useGame.setState({ players: rest }); break; }
    case 'away': case 'back': { const p = S.players[m.id]; if (p) useGame.setState({ players: { ...S.players, [m.id]: { ...p, on: m.t === 'back' } } }); break; }
    case 's':
      for (const [id, x, z, ry, mv, sit] of m.p) {
        if (id === S.myId) continue;
        const l = live.get(id); if (l) { l.x = x; l.z = z; l.ry = ry; l.mv = mv; l.sit = sit; } else live.set(id, { x, z, ry, mv, sit });
      } break;
    case 'role': {
      const p = S.players[m.id];
      useGame.setState({ players: p ? { ...S.players, [m.id]: { ...p, role: m.role } } : S.players, role: m.id === S.myId ? m.role : S.role });
      if (m.id === S.myId) S.notify(t(m.role === 'mod' ? 'role_mod' : 'role_user') + ' ✓'); break;
    }
    case 'perm': { const before = S.players[m.id]?.perm; setPerm(m.id, m.perm); if (m.id === S.myId && before && JSON.stringify(before) !== JSON.stringify(m.perm)) S.notify(t('perm_changed')); break; }
    case 'gperm': useGame.setState({ gperm: m.gperm }); break;
    case 'proj': setSkew(m.now); useGame.setState({ proj: m.proj }); break;
    case 'forced': void forceStop(m.what); S.notify(t(('forced_' + m.what) as Key), 'warn'); break;
    case 'game': {
      if (m.g === 'hs' || m.g === 'race') setSkew(m.s.now);
      useGame.setState({ games: { ...S.games, [m.g]: m.s } as typeof S.games }); break;
    }
    case 'locked': useGame.setState({ locked: m.v }); break;
    case 'chat': {
      const msg = { id: m.id, name: m.name, text: m.text, ts: m.ts };
      useGame.setState({ chat: [...S.chat.slice(-119), msg], says: { ...S.says, [m.id]: { text: m.text, until: Date.now() + 6500 } } }); break;
    }
    case 'dm': {
      const msg = { id: m.from, name: m.fromName, text: m.text, ts: m.ts, dm: { to: m.to, toName: m.toName } };
      useGame.setState({ chat: [...S.chat.slice(-119), msg] }); emit('dm', msg); break;
    }
    case 'emote': {
      const text = (S.settings.lang === 'en' ? EMOTE_TEXT_EN : EMOTE_TEXT)[m.n as EmoteName] ?? '';
      useGame.setState({ says: { ...S.says, [m.id]: { text, until: Date.now() + 3200 } } });
      emit('emote', { id: m.id, n: m.n }); break;
    }
    case 'kicked': intentionalClose = true; toLobby(t('kicked')); break;
    case 'ended': intentionalClose = true; toLobby(t(m.why === 'ended' ? 'ended' : 'ended_other')); break;
    case 'err': S.notify(errText(m.c), 'warn'); break;
  }
}

function toLobby(msg: string) {
  useGame.setState({ games: { siga: null, hs: IDLE_HS, race: IDLE_RACE } });
  sessionStorage.removeItem(TOKEN_KEY); live.clear(); disconnectMedia();
  useGame.setState({ phase: 'join', myId: '', role: 'user', roomCode: '', token: '', players: {}, chat: [], says: {}, proj: IDLE_PROJ, conn: { status: 'idle', error: msg || undefined } });
}

function open(first: object): Promise<void> {
  return new Promise((resolve, reject) => {
    intentionalClose = false;
    ws?.close();
    const sock = new WebSocket(wsUrl()); ws = sock;
    let settled = false;
    const fail = (why: string) => { if (!settled) { settled = true; reject(new Error(why)); } };
    sock.onopen = () => sock.send(JSON.stringify(first));
    sock.onerror = () => fail(t('err_connect'));
    sock.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.t === 'welcome') { applyWelcome(m); if (!settled) { settled = true; resolve(); } return; }
      if (m.t === 'err' && !settled) { fail(errText(m.c)); return; }
      handle(m);
    };
    sock.onclose = () => {
      fail(t('err_dropped'));
      const S = useGame.getState();
      if (settled && S.phase === 'play' && !intentionalClose && ws === sock) scheduleResume(0);
    };
  });
}

function scheduleResume(attempt: number) {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token || attempt > 8) { toLobby(t('err_dropped')); return; }
  useGame.setState({ conn: { status: 'reconnecting' } });
  clearTimeout(retryTimer);
  retryTimer = window.setTimeout(() => { open({ t: 'resume', token }).catch(() => scheduleResume(attempt + 1)); }, Math.min(500 * (attempt + 1), 3000));
}

const fromError = (e: unknown) => useGame.setState({ conn: { status: 'idle', error: (e as Error).message } });
export async function startAsAdmin(password: string, name: string, look: Look) {
  useGame.setState({ conn: { status: 'connecting' } });
  try { await open({ t: 'admin_start', password, name, look }); } catch (e) { fromError(e); }
}
export async function joinRoom(code: string, name: string, look: Look) {
  useGame.setState({ conn: { status: 'connecting' } });
  try { await open({ t: 'join', code, name, look }); } catch (e) { fromError(e); }
}
export function leave() { intentionalClose = true; try { ws?.send(JSON.stringify({ t: 'leave' })); } catch { /* */ } ws?.close(); toLobby(''); }

const send = (m: object) => { if (ws?.readyState === 1) ws.send(JSON.stringify(m)); };
export const sendMove = (x: number, z: number, ry: number, mv: boolean, sit: boolean) => send({ t: 'm', x, z, ry, mv: mv ? 1 : 0, sit: sit ? 1 : 0 });
export const sendChat = (text: string) => send({ t: 'chat', text });
export const sendDm = (to: string, text: string) => send({ t: 'dm', to, text });
export const sendEmote = (n: EmoteName) => send({ t: 'emote', n });
export const act = (a: string, extra: Record<string, unknown> = {}) => send({ t: 'act', a, ...extra });
export const adminAct = (a: 'lock' | 'unlock' | 'end' | 'promote' | 'demote' | 'kick', id?: string) => act(a, { id });
export const proj = (a: string, extra: Record<string, unknown> = {}) => send({ t: 'proj', a, ...extra });

export const gameAct = (g: 'siga' | 'hs' | 'race', a: string, extra: Record<string, unknown> = {}) => send({ t: 'g', g, a, ...extra });
