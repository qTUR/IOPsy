import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store';
import { proj as projSend } from '../net';
import { pdfFromLink, uploadFile, ApiError } from '../api';
import { loadPdf, serverNow } from '../projector';
import { toggleScreen } from '../media';
import { useT } from '../i18n';
import { useUI } from './uiStore';
import { canShareScreen } from '../input';

/** لوحة العارض: للمدير تحكم كامل، وللمشارك المخوّل زر عرض شاشته */
export default function ProjectorPanel() {
  const t = useT();
  const { role, proj, players, myId, perm } = useGame();
  useGame((s) => s.media.v);
  const media = useGame((s) => s.media);
  const { setPanel, setProjFull } = useUI();
  const owner = role === 'owner';
  const [link, setLink] = useState(''), [vurl, setVurl] = useState(''), [busy, setBusy] = useState(''), [err, setErr] = useState('');
  const pdfIn = useRef<HTMLInputElement>(null), vidIn = useRef<HTMLInputElement>(null);

  const openPdf = async (up: { id: string; name: string; url: string }) => {
    const doc = await loadPdf({ id: up.id, url: up.url, name: up.name, pages: 0 });
    projSend('pdf', { id: up.id, name: up.name, pages: doc.numPages });
  };
  const run = async (label: string, fn: () => Promise<void>) => { setErr(''); setBusy(label); try { await fn(); } catch (e) { setErr(e instanceof ApiError ? e.message : (e as Error).message); } finally { setBusy(''); } };

  // مشاركة شاشتي على العارض
  const presentingMe = proj.mode === 'screen' && proj.screenBy === myId;
  const presentMine = async () => {
    if (presentingMe) { projSend('screen_end'); await toggleScreen(false); return; }
    await toggleScreen(true);
    if (useGame.getState().media.screen) projSend(owner ? 'screen' : 'screen_self', { id: myId });
  };
  useEffect(() => {
    const onEnd = () => { const s = useGame.getState(); if (s.proj.mode === 'screen' && s.proj.screenBy === s.myId) projSend('screen_end'); };
    window.addEventListener('iopsy:screen-ended', onEnd); return () => window.removeEventListener('iopsy:screen-ended', onEnd);
  }, []);
  const sharers = Object.values(players).filter((p) => p.id !== myId && p.perm.screen);

  const v = proj.video;
  const vcur = v ? v.pos + (v.playing ? (serverNow() - v.at) / 1000 : 0) : 0;

  return (
    <div className="panel projp">
      <div className="ph"><b>🎞 {t('proj_title')}</b><button onClick={() => setPanel(null)}>✕</button></div>
      <div className="pj-body">
        <div className="pj-state">
          {proj.mode === 'idle' && <span>{t('proj_idle')}</span>}
          {proj.mode === 'pdf' && proj.pdf && <span>📄 {proj.pdf.name} — {t('page')} {proj.page} {t('of')} {proj.pdf.pages}</span>}
          {proj.mode === 'screen' && <span>🖥 {t('screen_of', { n: players[proj.screenBy ?? '']?.name ?? '' })}</span>}
          {proj.mode === 'video' && v && <span>🎬 {v.name}</span>}
          {proj.mode !== 'idle' && <button className="pill sm" onClick={() => setProjFull(true)}>{t('proj_open')}</button>}
        </div>

        {canShareScreen() && (owner || perm.screen) && (
          <button className={'bigbtn' + (presentingMe ? ' on' : '')} onClick={() => void presentMine()}>🖥 {presentingMe ? t('stop_present') : t('present_mine')}</button>
        )}

        {owner && (
          <>
            <div className="pj-sec">
              <input ref={pdfIn} type="file" accept="application/pdf" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void run('pdf', async () => openPdf(await uploadFile('pdf', f))); }} />
              <button className="bigbtn" disabled={!!busy} onClick={() => pdfIn.current?.click()}>📄 {busy === 'pdf' ? t('uploading') : t('pdf_upload')}</button>
              <div className="row">
                <input value={link} placeholder={t('pdf_link')} dir="ltr" onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />
                <button disabled={!link.trim() || !!busy} onClick={() => void run('link', async () => openPdf(await pdfFromLink(link.trim())))}>{busy === 'link' ? '…' : t('pdf_show')}</button>
              </div>
            </div>

            {proj.mode === 'pdf' && proj.pdf && (
              <div className="pj-nav">
                <button onClick={() => projSend('page', { page: proj.page - 1 })} disabled={proj.page <= 1}>◀ {t('prev')}</button>
                <input type="number" min={1} max={proj.pdf.pages} value={proj.page} onChange={(e) => projSend('page', { page: +e.target.value })} onKeyDown={(e) => e.stopPropagation()} />
                <button onClick={() => projSend('page', { page: proj.page + 1 })} disabled={proj.page >= proj.pdf.pages}>{t('next')} ▶</button>
              </div>
            )}

            <div className="pj-sec">
              <input ref={vidIn} type="file" accept="video/mp4,video/webm" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void run('vid', async () => { const up = await uploadFile('video', f); projSend('video', { id: up.id, name: up.name }); }); }} />
              <button className="bigbtn" disabled={!!busy} onClick={() => vidIn.current?.click()}>🎬 {busy === 'vid' ? t('uploading') : t('video_upload')}</button>
              <div className="row">
                <input value={vurl} placeholder={t('video_url')} dir="ltr" onChange={(e) => setVurl(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />
                <button disabled={!/^https:\/\//i.test(vurl.trim())} onClick={() => { projSend('video', { url: vurl.trim(), name: 'Video' }); setVurl(''); }}>{t('pdf_show')}</button>
              </div>
            </div>
            {proj.mode === 'video' && v && (
              <div className="pj-nav">
                <button onClick={() => projSend('vctl', { pos: Math.max(0, vcur - 10) })}>⏪ 10</button>
                <button onClick={() => projSend('vctl', { playing: !v.playing, pos: vcur })}>{v.playing ? '⏸ ' + t('pause') : '▶ ' + t('play')}</button>
                <button onClick={() => projSend('vctl', { pos: vcur + 10 })}>10 ⏩</button>
              </div>
            )}

            {sharers.length > 0 && (
              <div className="pj-sec">
                {sharers.map((p) => <button key={p.id} className="pill" onClick={() => projSend('screen', { id: p.id })}>🖥 {t('show_screen_of', { n: p.name })}</button>)}
              </div>
            )}
            {proj.mode !== 'idle' && <button className="bigbtn danger" onClick={() => projSend('stop')}>⏹ {t('proj_stop')}</button>}
          </>
        )}
        {err && <div className="err">{err}</div>}
        <p className="note sm">{t('proj_hint')}</p>
        {media.state === 'off' && <p className="note sm">{t('media_unavailable')}</p>}
      </div>
    </div>
  );
}
