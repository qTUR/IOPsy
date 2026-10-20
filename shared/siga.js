// قواعد «السيجة» (لعبة سعودية/خليجية قديمة تُرسم على الرمل): 5×5، 12 حجرًا لكل لاعب، حركة متعامدة، أكل بالقفز.
// يستخدمها الخادم للتحقق والواجهة لإظهار الحركات المتاحة (ملف مشترك).
export const N = 5;
export const idx = (r, c) => r * N + c;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function initialBoard() {
  const b = Array(N * N).fill(0);
  for (let r = 0; r < 2; r++) for (let c = 0; c < N; c++) b[idx(r, c)] = 1;
  b[idx(2, 0)] = 1; b[idx(2, 1)] = 1;
  for (let r = 3; r < N; r++) for (let c = 0; c < N; c++) b[idx(r, c)] = 2;
  b[idx(2, 3)] = 2; b[idx(2, 4)] = 2;
  return b; // الوسط (2,2) فارغ
}

export function jumpsFrom(b, i, p) {
  const r = (i / N) | 0, c = i % N, out = [];
  for (const [dr, dc] of DIRS) {
    const r1 = r + dr, c1 = c + dc, r2 = r + 2 * dr, c2 = c + 2 * dc;
    if (r2 < 0 || r2 >= N || c2 < 0 || c2 >= N) continue;
    if (b[idx(r1, c1)] === 3 - p && b[idx(r2, c2)] === 0) out.push({ from: i, to: idx(r2, c2), cap: idx(r1, c1) });
  }
  return out;
}
export function stepsFrom(b, i) {
  const r = (i / N) | 0, c = i % N, out = [];
  for (const [dr, dc] of DIRS) {
    const r1 = r + dr, c1 = c + dc;
    if (r1 >= 0 && r1 < N && c1 >= 0 && c1 < N && b[idx(r1, c1)] === 0) out.push({ from: i, to: idx(r1, c1), cap: null });
  }
  return out;
}
/** الحركات النظامية للاعب p. الأكل إجباري، ومن أكل وله أكلة أخرى بنفس الحجر يكمل (cont = موضع الحجر) */
export function legalMoves(b, p, cont = null) {
  if (cont != null) return jumpsFrom(b, cont, p);
  const caps = [], steps = [];
  for (let i = 0; i < b.length; i++) if (b[i] === p) { caps.push(...jumpsFrom(b, i, p)); steps.push(...stepsFrom(b, i)); }
  return caps.length ? caps : steps;
}
export function applyMove(b, m, p) {
  const nb = b.slice(); nb[m.to] = p; nb[m.from] = 0; if (m.cap != null) nb[m.cap] = 0;
  return { board: nb, cont: m.cap != null && jumpsFrom(nb, m.to, p).length > 0 ? m.to : null };
}
export const count = (b, p) => b.reduce((a, v) => a + (v === p ? 1 : 0), 0);
