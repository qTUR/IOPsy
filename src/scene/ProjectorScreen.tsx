import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../store';
import { attachScreen, canvasTexture, drawIdle, drawPdfPage, fileTexture, fileVideo, projCanvas, screenTexture, stopFileVideo, syncFileVideo } from '../projector';

/** سطح عرض الشاشة داخل الخيمة: يعرض مصدر العارض الحالي */
export default function ProjectorScreen() {
  const proj = useGame((s) => s.proj);
  const mediaV = useGame((s) => s.media.v);
  const lang = useGame((s) => s.settings.lang);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const last = useRef(0);

  const setMap = (tex: THREE.Texture) => { const m = mat.current; if (!m) return; if (m.map !== tex) { m.map = tex; m.emissiveMap = tex; m.needsUpdate = true; } };

  useEffect(() => {
    if (proj.mode !== 'video') stopFileVideo();
    if (proj.mode !== 'screen') attachScreen(null);
    if (proj.mode === 'idle') { drawIdle(projCanvas); setMap(canvasTexture); }
    else if (proj.mode === 'pdf' && proj.pdf) { setMap(canvasTexture); drawIdle(projCanvas, '…'); void drawPdfPage(projCanvas, proj.pdf, proj.page).catch(() => drawIdle(projCanvas, '⚠ PDF')); }
    else if (proj.mode === 'screen') { attachScreen(proj.screenBy); setMap(screenTexture); }
    else if (proj.mode === 'video' && proj.video) { syncFileVideo(proj.video); setMap(fileTexture); }
  }, [proj, mediaV, lang]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (proj.mode === 'video' && proj.video && t - last.current > 2) { last.current = t; syncFileVideo(proj.video); }
    if (proj.mode === 'video' && fileVideo.readyState >= 2) fileTexture.needsUpdate = true;
  });

  return (
    <mesh position={[0, 0, 0.03]}>
      <planeGeometry args={[4, 2.25]} />
      <meshStandardMaterial ref={mat} color="#000000" map={canvasTexture} emissiveMap={canvasTexture} emissive="#ffffff" emissiveIntensity={0.78} roughness={0.5} toneMapped={false} />
    </mesh>
  );
}
