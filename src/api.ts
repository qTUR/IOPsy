// طلبات HTTP للمدير: رفع ملفات العارض وجلب PDF من رابط
import { useGame } from './store';
import { t, type Key } from './i18n';
import { API } from './config';

export interface Uploaded { id: string; name: string; size: number; kind: 'pdf' | 'video'; url: string }
const ERR: Record<string, Key> = { not_pdf: 'up_not_pdf', too_large: 'up_too_large', too_many: 'up_too_many', private: 'link_private', bad_url: 'link_bad', unreachable: 'link_unreachable', forbidden: 'err_forbidden', rate: 'err_rate' };
export class ApiError extends Error {}
const fail = (code: string) => new ApiError(t(ERR[code] ?? 'err_generic'));

export function uploadFile(kind: 'pdf' | 'video', file: File, onProgress?: (p: number) => void): Promise<Uploaded> {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open('POST', `${API}/api/upload?kind=${kind}&name=${encodeURIComponent(file.name)}`);
    x.setRequestHeader('x-token', useGame.getState().token);
    x.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(e.loaded / e.total); };
    x.onload = () => { let j: any; try { j = JSON.parse(x.responseText); } catch { j = {}; } x.status === 200 ? resolve(j) : reject(fail(j.error)); };
    x.onerror = () => reject(fail('unreachable'));
    x.send(file);
  });
}
export async function pdfFromLink(url: string): Promise<Uploaded> {
  const r = await fetch(`${API}/api/pdf-link`, { method: 'POST', headers: { 'x-token': useGame.getState().token, 'content-type': 'application/json' }, body: JSON.stringify({ url }) });
  const j = await r.json().catch(() => ({}));
  if (r.status !== 200) throw fail(j.error); return j;
}
/** ملفات الغرفة تحتاج توكن العضو */
export const fileUrl = (url: string) => `${API}${url}?k=${encodeURIComponent(useGame.getState().token)}`;
