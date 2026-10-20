import { useEffect, useState } from 'react';
import { useGame } from '../store';
import { listDevices, setOutputVolume, useDevice } from '../media';
import { setAmbientEnabled } from '../audio';
import { applyLang, useT } from '../i18n';
import { useUI } from './uiStore';

export default function Settings() {
  const t = useT();
  const { settings, setSettings } = useGame();
  const setPanel = useUI((s) => s.setPanel);
  const [dev, setDev] = useState<{ mic: MediaDeviceInfo[]; cam: MediaDeviceInfo[]; spk: MediaDeviceInfo[] }>({ mic: [], cam: [], spk: [] });
  useEffect(() => { void listDevices().then(setDev); }, []);
  const lang = (l: 'ar' | 'en') => { setSettings({ lang: l }); applyLang(l); };
  const opt = (list: MediaDeviceInfo[]) => list.map((d, i) => <option key={d.deviceId + i} value={d.deviceId}>{d.label || `${d.kind} ${i + 1}`}</option>);
  return (
    <div className="panel settings">
      <div className="ph"><b>⚙ {t('set_title')}</b><button onClick={() => setPanel(null)}>✕</button></div>
      <div className="st-body">
        <label>{t('set_lang')}</label>
        <div className="seg"><button className={settings.lang === 'ar' ? 'sel' : ''} onClick={() => lang('ar')}>العربية</button><button className={settings.lang === 'en' ? 'sel' : ''} onClick={() => lang('en')}>English</button></div>
        <label>{t('set_devices')}</label>
        <select onChange={(e) => void useDevice('audioinput', e.target.value)} defaultValue=""><option value="">{t('set_mic')} — {t('set_default')}</option>{opt(dev.mic)}</select>
        <select onChange={(e) => void useDevice('videoinput', e.target.value)} defaultValue=""><option value="">{t('set_cam')} — {t('set_default')}</option>{opt(dev.cam)}</select>
        <select onChange={(e) => void useDevice('audiooutput', e.target.value)} defaultValue=""><option value="">{t('set_spk')} — {t('set_default')}</option>{opt(dev.spk)}</select>
        <label>{t('set_vq')}</label>
        <div className="seg">{(['low', 'med', 'high'] as const).map((q) => <button key={q} className={settings.videoQuality === q ? 'sel' : ''} onClick={() => setSettings({ videoQuality: q })}>{t(q === 'low' ? 'vq_low' : q === 'med' ? 'vq_med' : 'vq_high')}</button>)}</div>
        <label>{t('set_gfx')}</label>
        <div className="seg">{(['min', 'low', 'high'] as const).map((q) => <button key={q} className={settings.gfx === q ? 'sel' : ''} onClick={() => setSettings({ gfx: q })}>{t(q === 'min' ? 'gfx_min' : q === 'low' ? 'gfx_low' : 'gfx_high')}</button>)}</div>
        <label className="chk"><input type="checkbox" checked={settings.music} onChange={(e) => { setSettings({ music: e.target.checked }); setAmbientEnabled(e.target.checked); }} /> {t('set_music')}</label>
        <label>{t('set_volume')}</label>
        <input type="range" min={0} max={1} step={0.05} value={settings.volume} onChange={(e) => { const v = +e.target.value; setSettings({ volume: v }); setOutputVolume(v); }} />
      </div>
    </div>
  );
}
