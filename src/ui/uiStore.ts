import { create } from 'zustand';
import { isTouchDevice } from '../input';

type PanelName = null | 'people' | 'chat' | 'proj' | 'manage' | 'settings' | 'games';
interface UI {
  panel: PanelName;
  projFull: boolean;
  dmTo: string | null;           // معرّف من نراسله بشكل خاص
  bigTile: string | null;        // مشارك معروض بحجم كبير (كاميرا)
  hideTiles: boolean;
  raceCam: boolean;
  setRaceCam: (v: boolean) => void;
  setPanel: (p: PanelName) => void;
  togglePanel: (p: Exclude<PanelName, null>) => void;
  setProjFull: (v: boolean) => void;
  setDmTo: (id: string | null) => void;
  setBigTile: (id: string | null) => void;
  setHideTiles: (v: boolean) => void;
}
export const useUI = create<UI>((set) => ({
  panel: isTouchDevice() ? null : 'chat', projFull: false, dmTo: null, bigTile: null, hideTiles: false, raceCam: false, setRaceCam: (raceCam) => set({ raceCam }),
  setPanel: (panel) => set({ panel }),
  togglePanel: (p) => set((s) => ({ panel: s.panel === p ? null : p })),
  setProjFull: (projFull) => set({ projFull }),
  setDmTo: (dmTo) => set((s) => ({ dmTo, panel: dmTo ? 'chat' : s.panel })),
  setBigTile: (bigTile) => set({ bigTile }),
  setHideTiles: (hideTiles) => set({ hideTiles }),
}));
