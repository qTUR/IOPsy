// الصوت والكاميرا ومشاركة الشاشة عبر LiveKit (SFU) — لا يوجد اتصال نظير-لنظير بين المشاركين.
import { Room, RoomEvent, Track, VideoPresets, ConnectionState, type RemoteTrack, type RemoteParticipant, type LocalTrackPublication } from 'livekit-client';
import { useGame } from './store';
import { t } from './i18n';

export const trackRefs = new Map<string, { cam?: Track; screen?: Track; screenAudio?: Track }>();
let room: Room | null = null;
const audioEls = new Map<string, HTMLMediaElement[]>();

import { LK_URL } from './config';
const lkUrl = () => LK_URL;
const bump = () => useGame.setState((s) => ({ media: { ...s.media, v: s.media.v + 1 } }));
const setMedia = (p: Partial<ReturnType<typeof useGame.getState>['media']>) => useGame.setState((s) => ({ media: { ...s.media, ...p, v: s.media.v + 1 } }));

const QUALITY = {
  low: { res: VideoPresets.h180.resolution, bitrate: 160_000 },
  med: { res: VideoPresets.h360.resolution, bitrate: 450_000 },
  high: { res: VideoPresets.h720.resolution, bitrate: 1_400_000 },
} as const;

function refresh(p: { identity: string }, tracks: Iterable<{ source: Track.Source; track?: Track | undefined; isMuted?: boolean }>) {
  const ent: { cam?: Track; screen?: Track; screenAudio?: Track } = {};
  let micOn = false;
  for (const pub of tracks) {
    if (pub.source === Track.Source.Camera && pub.track && !pub.isMuted) ent.cam = pub.track;
    else if (pub.source === Track.Source.ScreenShare && pub.track) ent.screen = pub.track;
    else if (pub.source === Track.Source.ScreenShareAudio && pub.track) ent.screenAudio = pub.track;
    else if (pub.source === Track.Source.Microphone) micOn = !!pub.track && !pub.isMuted;
  }
  trackRefs.set(p.identity, ent);
  useGame.setState((s) => ({ media: { ...s.media, micOn: { ...s.media.micOn, [p.identity]: micOn }, v: s.media.v + 1 } }));
}
const refreshRemote = (p: RemoteParticipant) => refresh(p, p.trackPublications.values());

export async function connectMedia(token: string) {
  if (room) return;
  setMedia({ state: 'connecting', error: undefined });
  const q = QUALITY[useGame.getState().settings.videoQuality];
  const r = new Room({
    adaptiveStream: true, dynacast: true,
    videoCaptureDefaults: { resolution: q.res },
    publishDefaults: { simulcast: true, videoSimulcastLayers: [VideoPresets.h180, VideoPresets.h360], videoEncoding: { maxBitrate: q.bitrate, maxFramerate: 24 }, screenShareEncoding: { maxBitrate: 1_800_000, maxFramerate: 15 }, dtx: true, red: true },
    audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  room = r;
  r.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _pub, participant) => {
    if (track.kind === Track.Kind.Audio) {
      const el = track.attach() as HTMLMediaElement; el.style.display = 'none'; el.volume = useGame.getState().settings.volume; document.body.appendChild(el);
      audioEls.set(participant.identity, [...(audioEls.get(participant.identity) || []), el]);
    }
    refreshRemote(participant);
  });
  r.on(RoomEvent.TrackUnsubscribed, (track, _pub, participant) => { track.detach().forEach((e) => e.remove()); refreshRemote(participant); });
  r.on(RoomEvent.TrackMuted, (_pub, p) => { if (p.identity === r.localParticipant.identity) syncLocal(); else refreshRemote(p as RemoteParticipant); });
  r.on(RoomEvent.TrackUnmuted, (_pub, p) => { if (p.identity === r.localParticipant.identity) syncLocal(); else refreshRemote(p as RemoteParticipant); });
  r.on(RoomEvent.TrackPublished, (_pub, p) => refreshRemote(p));
  r.on(RoomEvent.TrackUnpublished, (_pub, p) => refreshRemote(p));
  r.on(RoomEvent.ParticipantDisconnected, (p) => { trackRefs.delete(p.identity); (audioEls.get(p.identity) || []).forEach((e) => e.remove()); audioEls.delete(p.identity); bump(); });
  r.on(RoomEvent.ActiveSpeakersChanged, (sp) => { const m: Record<string, boolean> = {}; for (const s of sp) m[s.identity] = true; useGame.setState((s) => ({ media: { ...s.media, speaking: m } })); });
  r.on(RoomEvent.LocalTrackPublished, syncLocal); r.on(RoomEvent.LocalTrackUnpublished, syncLocal);
  r.on(RoomEvent.Disconnected, () => { if (room === r) { room = null; setMedia({ state: 'off', mic: false, cam: false, screen: false }); } });
  r.on(RoomEvent.ConnectionStateChanged, (st) => { if (st === ConnectionState.Connected) setMedia({ state: 'on' }); });
  r.on(RoomEvent.MediaDevicesError, (e) => useGame.getState().notify(String(e?.message || e), 'warn'));
  try { await r.connect(lkUrl(), token); setMedia({ state: 'on' }); r.remoteParticipants.forEach(refreshRemote); void r.startAudio().catch(() => {}); }
  catch (e) { room = null; setMedia({ state: 'off', error: (e as Error).message }); }
}

function syncLocal() {
  if (!room) return;
  const lp = room.localParticipant;
  refresh(lp, lp.trackPublications.values() as Iterable<LocalTrackPublication>);
  setMedia({ mic: lp.isMicrophoneEnabled, cam: lp.isCameraEnabled, screen: lp.isScreenShareEnabled });
}

export function disconnectMedia() {
  const r = room; room = null; trackRefs.clear();
  audioEls.forEach((l) => l.forEach((e) => e.remove())); audioEls.clear();
  try { void r?.disconnect(); } catch { /* */ }
  setMedia({ state: 'off', mic: false, cam: false, screen: false, micOn: {}, speaking: {} });
}

async function toggle(what: 'mic' | 'cam' | 'screen', on?: boolean) {
  const S = useGame.getState();
  if (!room) return S.notify(t('media_unavailable'), 'warn');
  if (!S.perm[what] && S.role !== 'owner') return S.notify(t('perm_denied'), 'warn');
  const lp = room.localParticipant;
  const want = on ?? !(what === 'mic' ? lp.isMicrophoneEnabled : what === 'cam' ? lp.isCameraEnabled : lp.isScreenShareEnabled);
  try {
    if (what === 'mic') await lp.setMicrophoneEnabled(want);
    else if (what === 'cam') await lp.setCameraEnabled(want);
    else await lp.setScreenShareEnabled(want, want ? { audio: true, resolution: { width: 1920, height: 1080, frameRate: 15 }, contentHint: 'detail', selfBrowserSurface: 'exclude' } : undefined);
  } catch (e) {
    const err = e as Error;
    S.notify(/denied|NotAllowed|Permission/i.test(String(err.name + err.message)) ? t('device_denied') : /NotFound|Requested device/i.test(err.name + err.message) ? t('device_missing') : err.message, 'warn');
  }
  syncLocal();
  if (what === 'screen' && !want) window.dispatchEvent(new CustomEvent('iopsy:screen-ended'));
}
export const toggleMic = (on?: boolean) => toggle('mic', on);
export const toggleCam = (on?: boolean) => toggle('cam', on);
export const toggleScreen = (on?: boolean) => toggle('screen', on);
/** الخادم أمر بإيقاف مصدر: نوقفه محليًا (الخادم نفّذ الكتم فعليًا) */
export async function forceStop(what: 'mic' | 'cam' | 'screen') { if (!room) return; await toggle(what, false); }

export async function listDevices() {
  const out = { mic: [] as MediaDeviceInfo[], cam: [] as MediaDeviceInfo[], spk: [] as MediaDeviceInfo[] };
  try {
    out.mic = await Room.getLocalDevices('audioinput', false); out.cam = await Room.getLocalDevices('videoinput', false); out.spk = await Room.getLocalDevices('audiooutput', false);
  } catch { /* */ }
  return out;
}
export async function useDevice(kind: 'audioinput' | 'videoinput' | 'audiooutput', id: string) { try { await room?.switchActiveDevice(kind, id); } catch (e) { useGame.getState().notify((e as Error).message, 'warn'); } }
export function setOutputVolume(v: number) { audioEls.forEach((l) => l.forEach((e) => { e.volume = v; })); }
export const mediaRoom = () => room;

(window as unknown as { __room: unknown }).__room = () => room;
