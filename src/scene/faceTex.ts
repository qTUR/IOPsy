// رسم تفاصيل الوجه (عين لوزية بجفن وأهداب، حاجب، فم) كنسيج شفاف يلتصق بسطح الوجه
import * as THREE from 'three';

const cache = new Map<string, THREE.CanvasTexture>();
function make(key: string, w: number, h: number, draw: (x: CanvasRenderingContext2D) => void, mirror: boolean) {
  const k = key + (mirror ? 'm' : '');
  if (cache.has(k)) return cache.get(k)!;
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d')!;
  if (mirror) { x.translate(w, 0); x.scale(-1, 1); }
  draw(x);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true;
  cache.set(k, t); return t;
}

/** عين مفتوحة — الزاوية الداخلية يسارًا (للعين اليسرى للشخصية؛ تُعكس لليمنى) */
export function eyeTexture(f: boolean, mirror: boolean, irisHex = '#4a2610') {
  return make(`eye${f}${irisHex}`, 512, 320, (x) => {
    const upper = (o = 0) => { x.moveTo(36, 192 + o); x.bezierCurveTo(112, 34 + o, 350, 4 + o, 488, 152 + o); };
    // الشكل اللوزي
    x.save(); x.beginPath(); upper(); x.bezierCurveTo(410, 272, 150, 294, 36, 192); x.closePath(); x.clip();
    const sc = x.createLinearGradient(0, 40, 0, 260); sc.addColorStop(0, '#d9cfc9'); sc.addColorStop(0.35, '#fffdfb'); sc.addColorStop(1, '#f1e8e2');
    x.fillStyle = sc; x.fillRect(0, 0, 512, 320);
    // قزحية كبيرة داكنة
    const ir = x.createRadialGradient(272, 170, 8, 272, 160, 118);
    ir.addColorStop(0, '#a8662c'); ir.addColorStop(0.35, irisHex); ir.addColorStop(0.82, '#1d0d05'); ir.addColorStop(1, '#0d0603');
    x.fillStyle = ir; x.beginPath(); x.ellipse(272, 160, 108, 120, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#080403'; x.beginPath(); x.ellipse(272, 160, 46, 52, 0, 0, Math.PI * 2); x.fill();
    // ظل الجفن العلوي على القزحية
    const sh = x.createLinearGradient(0, 40, 0, 150); sh.addColorStop(0, 'rgba(20,8,4,.65)'); sh.addColorStop(1, 'rgba(20,8,4,0)');
    x.fillStyle = sh; x.fillRect(0, 40, 512, 120);
    // لمعات
    x.fillStyle = 'rgba(255,255,255,.97)'; x.beginPath(); x.ellipse(312, 112, 32, 36, -0.3, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(255,255,255,.75)'; x.beginPath(); x.arc(232, 214, 13, 0, Math.PI * 2); x.fill();
    x.restore();
    // خط الجفن العلوي (أسمك عند الخارج) + جناح
    x.lineCap = 'round'; x.strokeStyle = '#120907';
    x.lineWidth = f ? 20 : 16; x.beginPath(); upper(); x.stroke();
    x.lineWidth = f ? 14 : 10; x.beginPath(); x.moveTo(470, 144); x.quadraticCurveTo(502, 132, f ? 512 : 504, f ? 98 : 112); x.stroke();
    if (f) { x.lineWidth = 5; for (let i = 0; i < 6; i++) { const t = 0.35 + i * 0.12; const px = 36 + (488 - 36) * t, py = 182 - Math.sin(t * Math.PI) * 126 + 10; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 14 + i * 2, py - 30 - i * 2); x.stroke(); } }
    // جفن سفلي ناعم + ثنية الجفن
    x.strokeStyle = 'rgba(90,45,30,.5)'; x.lineWidth = 4; x.beginPath(); x.moveTo(60, 212); x.bezierCurveTo(160, 290, 380, 286, 470, 176); x.stroke();
    x.strokeStyle = 'rgba(70,32,20,.42)'; x.lineWidth = 5; x.beginPath(); upper(-34); x.stroke();
  }, mirror);
}
/** عين مغمضة (رمشة) */
export function closedEyeTexture(f: boolean, mirror: boolean) {
  return make(`closed${f}`, 512, 320, (x) => {
    x.lineCap = 'round'; x.strokeStyle = '#120907'; x.lineWidth = f ? 18 : 15;
    x.beginPath(); x.moveTo(40, 170); x.bezierCurveTo(150, 240, 380, 240, 488, 150); x.stroke();
    if (f) { x.lineWidth = 5; for (let i = 0; i < 6; i++) { const t = 0.3 + i * 0.12, px = 40 + 448 * t, py = 170 + Math.sin(t * Math.PI) * 68; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 10, py + 26); x.stroke(); } }
  }, mirror);
}
/** حاجب كثيف مقوّس يتدرّج من السميك (داخلي) إلى الرفيع (خارجي) */
export function browTexture(f: boolean, mirror: boolean, hex = '#17100b') {
  return make(`brow${f}${hex}`, 512, 160, (x) => {
    const th = f ? 0.62 : 1;
    x.fillStyle = hex; x.shadowColor = hex; x.shadowBlur = 5;
    x.beginPath();
    x.moveTo(34, 118);
    x.bezierCurveTo(60, 52, 200, 14, 330, 34);
    x.bezierCurveTo(420, 48, 470, 84, 494, 124);
    x.bezierCurveTo(450, 100, 410, 88, 340, 80 + 14 * (1 - th));
    x.bezierCurveTo(240, 72, 140, 90 + 12 * (1 - th), 34 + 4, 118 + 34 * th);
    x.closePath(); x.fill();
    // شعيرات خفيفة
    x.shadowBlur = 0; x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 2;
    for (let i = 0; i < 26; i++) { const t = i / 26, px = 50 + t * 430, py = 90 - Math.sin(t * Math.PI) * 54; x.beginPath(); x.moveTo(px, py + 26); x.lineTo(px + 12, py - 4); x.stroke(); }
  }, mirror);
}
/** فم مبتسم مغلق بشفتين */
export function mouthTexture(f: boolean) {
  return make(`mouth${f}`, 512, 192, (x) => {
    const lip = f ? '#c2434f' : '#b5604f';
    // الشفة السفلية
    x.fillStyle = f ? 'rgba(214,92,104,.92)' : 'rgba(190,100,84,.8)';
    x.beginPath(); x.moveTo(70, 82); x.bezierCurveTo(150, 150, 360, 150, 442, 82); x.bezierCurveTo(360, 118, 150, 118, 70, 82); x.fill();
    x.fillStyle = 'rgba(255,255,255,.22)'; x.beginPath(); x.ellipse(256, 116, 54, 8, 0, 0, Math.PI * 2); x.fill();
    // الشفة العلوية
    x.fillStyle = lip; x.beginPath(); x.moveTo(60, 78); x.bezierCurveTo(130, 50, 200, 52, 256, 66); x.bezierCurveTo(312, 52, 382, 50, 452, 78); x.bezierCurveTo(380, 92, 130, 92, 60, 78); x.fill();
    // خط الفم
    x.lineCap = 'round'; x.strokeStyle = '#3a1410'; x.lineWidth = 7; x.beginPath(); x.moveTo(52, 76); x.bezierCurveTo(150, 100, 360, 100, 460, 76); x.stroke();
    // غمازتان
    x.lineWidth = 5; x.strokeStyle = 'rgba(90,40,30,.55)'; x.beginPath(); x.moveTo(44, 64); x.quadraticCurveTo(34, 78, 48, 96); x.stroke(); x.beginPath(); x.moveTo(468, 64); x.quadraticCurveTo(478, 78, 464, 96); x.stroke();
  }, false);
}
