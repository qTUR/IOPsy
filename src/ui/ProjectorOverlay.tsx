import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store';
import { proj as projSend } from '../net';
import { trackRefs } from '../media';
import { drawIdle, drawPdfPage, syncFileVideo } from '../projector';
import { useT } from '../i18n';
import { useUI } from './uiStore';
import { useAttach } from './Tiles';

/** عرض كامل للعارض: PDF أو شاشة مشارك أو فيديو، مع تحكم المدير */
export default function ProjectorOverlay() {
  const t = useT();
  const { proj, role, players } = useGame();
  useGame((s) => s.media.v);
  const setFull = useUI((s) => s.setProjFull);
  const owner = role === 'owner';
  const canvas = useRef<HTMLCanvasElement>(null), box = useRef<HTMLDivElement>(null), vid = useRef<HTMLVideoElement>(null);
  const [size, setSize] = useState({ w: 1280, h: 720 });

  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => { const r = el.getBoundingClientRect(); const dpr = Math.min(devicePixelRatio, 2); setSize({ w: Math.floor(r.width * dpr), h: Math.floor(r.height * dpr) }); });
    ro.observe(el); return () => ro.disconnect();
  }, []);
  useEffect(() => { // PDF
    const c = canvas.current; if (!c || proj.mode !== 'pdf' || !proj.pdf) return;
    c.width = size.w; c.height = size.h; drawIdle(c, '…'); void drawPdfPage(c, proj.pdf, proj.page).catch(() => drawIdle(c, '⚠ PDF'));
  }, [proj.mode, proj.pdf, proj.page, size]);
  const screenTrack = proj.mode === 'screen' ? trackRefs.get(proj.screenBy ?? '')?.screen : undefined;
  const sref = useAttach(screenTrack);
  useEffect(() => { // فيديو ملف
    const el = vid.current; if (!el || proj.mode !== 'video' || !proj.video) return;
    syncFileVideo(proj.video, el); const i = setInterval(() => proj.video && syncFileVideo(proj.video, el), 2000); return () => { clearInterval(i); el.pause(); };
  }, [proj.mode, proj.video]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false); if (owner && proj.mode === 'pdf') { if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') projSend('page', { page: proj.page + 1 }); if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') projSend('page', { page: proj.page - 1 }); } }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [owner, proj, setFull]);

  return (
    <div className="povl" onClick={(e) => { if (e.target === e.currentTarget) setFull(false); }}>
      <div className="po-h">
        <b>{proj.mode === 'pdf' ? `📄 ${proj.pdf?.name}` : proj.mode === 'screen' ? `🖥 ${t('screen_of', { n: players[proj.screenBy ?? '']?.name ?? '' })}` : proj.mode === 'video' ? `🎬 ${proj.video?.name}` : t('proj_idle')}</b>
        {owner && proj.mode === 'pdf' && proj.pdf && (
          <span className="po-nav">
            <button disabled={proj.page <= 1} onClick={() => projSend('page', { page: proj.page - 1 })}>◀</button>
            <input type="number" min={1} max={proj.pdf.pages} value={proj.page} onChange={(e) => projSend('page', { page: +e.target.value })} onKeyDown={(e) => e.stopPropagation()} /> / {proj.pdf.pages}
            <button disabled={proj.page >= proj.pdf.pages} onClick={() => projSend('page', { page: proj.page + 1 })}>▶</button>
          </span>
        )}
        {!owner && proj.mode === 'pdf' && proj.pdf && <span>{t('page')} {proj.page} {t('of')} {proj.pdf.pages}</span>}
        <button onClick={() => setFull(false)}>✕ {t('close')}</button>
      </div>
      <div className="po-b" ref={box}>
        {proj.mode === 'pdf' && <canvas ref={canvas} style={{ width: '100%', height: '100%' }} />}
        {proj.mode === 'screen' && <video ref={sref} autoPlay playsInline muted />}
        {proj.mode === 'video' && <video ref={vid} playsInline />}
        {proj.mode === 'idle' && <div className="po-idle">{t('proj_idle')}</div>}
      </div>
    </div>
  );
}
