import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../store';
import { t } from '../i18n';

/** حارس الأداء: يخفّض الجودة تلقائيًا إذا كان الجهاز بطيئًا (high → low → min) */
export default function Perf() {
  const acc = useRef({ t: 0, n: 0, slow: 0, wait: 4 });
  useFrame((_, dt) => {
    const a = acc.current; if (dt > 0.5) return; // تجاهل التوقفات
    a.wait -= dt; if (a.wait > 0) return;
    a.t += dt; a.n++;
    if (a.t < 3) return;
    const fps = a.n / a.t; a.t = 0; a.n = 0;
    const S = useGame.getState(); const g = S.settings.gfx;
    if (fps < 24) a.slow++; else a.slow = 0;
    if (a.slow >= 2 && g !== 'min') { // دقيقتان بطيئتان متتاليتان (6 ثوانٍ)
      const next = g === 'high' ? 'low' : 'min'; S.setSettings({ gfx: next }); a.slow = 0; a.wait = 4;
      S.notify(t('perf_down'), 'warn');
    }
  });
  return null;
}
