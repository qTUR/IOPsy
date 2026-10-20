import { create } from 'zustand';
import { DEFAULT_LOOK, DEFAULT_LOOK_F, Look } from './scene/avatarBuilder';

export type Role = 'owner' | 'mod' | 'user';
export type Perm = { mic: boolean; cam: boolean; screen: boolean };
export interface Remote { id: string; name: string; look: Look; role: Role; on: boolean; perm: Perm }
export interface ChatMsg { id: string; name: string; text: string; ts: number; dm?: { to: string; toName: string } }
export interface Proj {
  mode: 'idle' | 'pdf' | 'screen' | 'video';
  pdf: { id: string; url: string; name: string; pages: number } | null;
  page: number;
  screenBy: string | null;
  video: { src: string; name: string; playing: boolean; pos: number; at: number } | null;
}
export const IDLE_PROJ: Proj = { mode: 'idle', pdf: null, page: 1, screenBy: null, video: null };
export type Lang = 'ar' | 'en';
export interface SigaState { board: number[]; seats: (string | null)[]; names: string[]; turn: number; status: 'waiting' | 'playing' | 'over'; winner: number; cont: number | null; last: [number, number, number | null] | null; moves: number; round: number }
export interface HsState { phase: 'idle' | 'counting' | 'hunting' | 'over'; joined: string[]; seeker: string | null; found: string[]; t0: number; counting: number; hunting: number; round: number; now: number; result: { seekerWins: boolean; seeker: string; hiders: string[]; found: string[] } | null }
export interface RaceState { phase: 'idle' | 'countdown' | 'racing' | 'over'; joined: string[]; progress: Record<string, number>; finished: { id: string; t: number | null }[]; t0: number; countdown: number; goal: number; round: number; now: number }
export const IDLE_RACE: RaceState = { phase: 'idle', joined: [], progress: {}, finished: [], t0: 0, countdown: 4, goal: 100, round: 0, now: 0 };
export const IDLE_HS: HsState = { phase: 'idle', joined: [], seeker: null, found: [], t0: 0, counting: 15, hunting: 120, round: 0, now: 0, result: null };
export interface Settings { lang: Lang; videoQuality: 'low' | 'med' | 'high'; gfx: 'min' | 'low' | 'high'; music: boolean; volume: number }

/** حالة لحظية (حركة الآخرين): خارج React لتجنّب إعادة الرسم كل إطار */
export const live = new Map<string, { x: number; z: number; ry: number; mv: number; sit: number }>();
(window as unknown as { __live: unknown }).__live = live;

const loadSettings = (): Settings => {
  const d: Settings = { lang: 'ar', videoQuality: 'med', gfx: matchMedia('(pointer:coarse)').matches ? 'low' : 'high', music: true, volume: 1 };
  try { return { ...d, ...JSON.parse(localStorage.getItem('iopsy.settings') || '{}') }; } catch { return d; }
};

interface State {
  phase: 'join' | 'play';
  mode: 'user' | 'admin';
  name: string;
  look: Look;
  settings: Settings;
  conn: { status: 'idle' | 'connecting' | 'in' | 'reconnecting'; error?: string };
  myId: string;
  role: Role;
  roomCode: string;
  locked: boolean;
  token: string;
  players: Record<string, Remote>;
  chat: ChatMsg[];
  says: Record<string, { text: string; until: number }>;
  perm: Perm;
  gperm: Perm;
  proj: Proj;
  media: { mic: boolean; cam: boolean; screen: boolean; speaking: Record<string, boolean>; micOn: Record<string, boolean>; v: number; error?: string; state: 'off' | 'connecting' | 'on' };
  toast: { text: string; until: number; kind: 'info' | 'warn' } | null;
  games: { siga: SigaState | null; hs: HsState; race: RaceState };
  setMode: (m: 'user' | 'admin') => void;
  setName: (n: string) => void;
  setLook: (p: Partial<Look>) => void;
  setSettings: (p: Partial<Settings>) => void;
  notify: (text: string, kind?: 'info' | 'warn') => void;
}
export const useGame = create<State>((set) => ({
  phase: 'join', mode: 'user', name: '', look: DEFAULT_LOOK, settings: loadSettings(),
  conn: { status: 'idle' }, myId: '', role: 'user', roomCode: '', locked: false, token: '', players: {}, chat: [], says: {},
  perm: { mic: true, cam: true, screen: false }, gperm: { mic: true, cam: true, screen: true }, proj: IDLE_PROJ,
  media: { mic: false, cam: false, screen: false, speaking: {}, micOn: {}, v: 0, state: 'off' },
  toast: null,
  games: { siga: null, hs: IDLE_HS, race: IDLE_RACE },
  setMode: (mode) => set({ mode, conn: { status: 'idle' } }),
  setName: (name) => set({ name }),
  setLook: (p) => set((s) => ({ look: p.g && p.g !== s.look.g ? { ...(p.g === 'f' ? DEFAULT_LOOK_F : DEFAULT_LOOK), ...p, s: s.look.s } : { ...s.look, ...p } })),
  setSettings: (p) => set((s) => { const settings = { ...s.settings, ...p }; try { localStorage.setItem('iopsy.settings', JSON.stringify(settings)); } catch { /* */ } return { settings }; }),
  notify: (text, kind = 'info') => set({ toast: { text, until: Date.now() + 4200, kind } }),
}));

(window as unknown as { __store: unknown }).__store = useGame;
