import * as THREE from 'three';

/** رمل واقعي: خريطة ألوان + نورمال لتموّجات الرياح (قابلة للتكرار بدون خطوط) */
export function sandMaps(repeat = 90) {
  const S = 512;
  const h = new Float32Array(S * S);
  let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const grain = new Float32Array(S * S); for (let i = 0; i < grain.length; i++) grain[i] = rnd();
  const TAU = Math.PI * 2;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = (x / S) * TAU, v = (y / S) * TAU;
    const warp = 1.4 * Math.sin(2 * v + 0.7) + 0.7 * Math.sin(5 * v - u);
    let r = Math.sin(9 * u + warp) * 0.4 + Math.sin(19 * u + 2 * warp + 1) * 0.18 + Math.sin(4 * u - 1.5 * Math.sin(3 * v)) * 0.3;
    r += (grain[y * S + x] - 0.5) * 0.25;
    h[y * S + x] = r;
  }
  const albedo = document.createElement('canvas'); albedo.width = albedo.height = S;
  const normal = document.createElement('canvas'); normal.width = normal.height = S;
  const a = albedo.getContext('2d')!, n = normal.getContext('2d')!;
  const ai = a.createImageData(S, S), ni = n.createImageData(S, S);
  const H = (x: number, y: number) => h[((y + S) % S) * S + ((x + S) % S)];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = (y * S + x) * 4, hv = H(x, y);
    const dx = H(x + 1, y) - H(x - 1, y), dy = H(x, y + 1) - H(x, y - 1);
    let nx = -dx * 0.75, ny = -dy * 0.75, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    ni.data[i] = (nx * 0.5 + 0.5) * 255; ni.data[i + 1] = (ny * 0.5 + 0.5) * 255; ni.data[i + 2] = (nz * 0.5 + 0.5) * 255; ni.data[i + 3] = 255;
    const t = 0.5 + hv * 0.28, g = grain[y * S + x];
    ai.data[i] = 226 * (0.84 + t * 0.3) + (g - 0.5) * 14; ai.data[i + 1] = 188 * (0.84 + t * 0.3) + (g - 0.5) * 12; ai.data[i + 2] = 134 * (0.84 + t * 0.3) + (g - 0.5) * 10; ai.data[i + 3] = 255;
  }
  a.putImageData(ai, 0, 0); n.putImageData(ni, 0, 0);
  const mk = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 16;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  return { map: mk(albedo, true), normalMap: mk(normal, false) };
}
