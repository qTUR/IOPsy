export const N: number;
export const idx: (r: number, c: number) => number;
export interface SigaMove { from: number; to: number; cap: number | null }
export function initialBoard(): number[];
export function jumpsFrom(b: number[], i: number, p: number): SigaMove[];
export function stepsFrom(b: number[], i: number): SigaMove[];
export function legalMoves(b: number[], p: number, cont?: number | null): SigaMove[];
export function applyMove(b: number[], m: SigaMove, p: number): { board: number[]; cont: number | null };
export const count: (b: number[], p: number) => number;
