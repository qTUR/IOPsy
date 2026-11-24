// أجواء صوتية: رياح الصحراء + طقطقة النار + موسيقى هادئة (من مشروع SLMM)
let ctx: AudioContext | null = null;
let fireGain: GainNode | null = null;
let master: GainNode | null = null;
let music: HTMLAudioElement | null = null;
let muted = false;

function noiseBuffer(c: AudioContext, seconds = 3) {
  const b = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate), d = b.getChannelData(0);
  let last = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
  return b;
}

export function startAudio() {
  if (ctx) return;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ctx.destination);
  // رياح
  const wind = ctx.createBufferSource(); wind.buffer = noiseBuffer(ctx, 4); wind.loop = true;
  const wf = ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 420; wf.Q.value = 0.6;
  const wg = ctx.createGain(); wg.gain.value = 0.16;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07; const lg = ctx.createGain(); lg.gain.value = 0.09;
  lfo.connect(lg); lg.connect(wg.gain); wind.connect(wf); wf.connect(wg); wg.connect(master); wind.start(); lfo.start();
  // نار: ضجيج بنّي + فرقعات عشوائية
  fireGain = ctx.createGain(); fireGain.gain.value = 0.0; fireGain.connect(master);
  const fire = ctx.createBufferSource(); fire.buffer = noiseBuffer(ctx, 3); fire.loop = true;
  const ff = ctx.createBiquadFilter(); ff.type = 'lowpass'; ff.frequency.value = 900; const fg = ctx.createGain(); fg.gain.value = 0.35;
  fire.connect(ff); ff.connect(fg); fg.connect(fireGain); fire.start();
  const pop = () => {
    if (!ctx || !fireGain) return;
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx, 0.06);
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1400 + Math.random() * 2500;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.5 + Math.random() * 0.8, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06 + Math.random() * 0.05);
    src.connect(f); f.connect(g); g.connect(fireGain); src.start();
    setTimeout(pop, 60 + Math.random() * 520);
  };
  pop();
  // موسيقى
  music = new Audio('/audio/Soundtrack.mp3'); music.loop = true; music.volume = 0.05; music.muted = muted;
  void music.play().catch(() => {});
}

/** يُستدعى كل إطار: مستوى صوت النار حسب القرب */
export function setListener(x: number, z: number) {
  if (!fireGain || !ctx) return;
  const d = Math.hypot(x - 0, z - 3);
  fireGain.gain.setTargetAtTime(Math.max(0, 1 - d / 22) ** 1.6 * 1.1, ctx.currentTime, 0.2);
}

export function toggleMute() {
  muted = !muted;
  if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.1);
  if (music) music.muted = muted;
  return muted;
}
export const isMuted = () => muted;

/** تشغيل/إيقاف أجواء الخيمة (رياح + نار + موسيقى) */
export function setAmbientEnabled(on: boolean) { muted = !on; if (master && ctx) master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.1); if (music) music.muted = !on; }
