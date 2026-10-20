import * as THREE from 'three';

/** ارتفاع الكثبان: مسطّح قرب المخيم ثم يرتفع تدريجيًا */
export function duneHeight(x: number, z: number): number {
  const d = Math.hypot(x, z);
  const k = THREE.MathUtils.smoothstep(d, 55, 120);
  const n = Math.sin(x * 0.045 + 1.3) * Math.cos(z * 0.038) * 9 + Math.sin(x * 0.11 + z * 0.07) * 2.5 + Math.sin(z * 0.02 - x * 0.015) * 6;
  return k * (Math.max(0, n) + 3.5 * k);
}
export interface Circle { x: number; z: number; r: number }
export interface Box { x0: number; x1: number; z0: number; z1: number }
export const colliders = { circles: [] as Circle[], boxes: [] as Box[] };
export const zones: { tent?: Box } = {};
