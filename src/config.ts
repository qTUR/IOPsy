// عنوان الخادم: نفس الأصل افتراضيًا. عند استضافة الواجهة على Cloudflare Pages ضع VITE_SERVER=https://اسمك.duckdns.org عند البناء.
const S = (import.meta.env.VITE_SERVER as string | undefined)?.replace(/\/$/, '') || '';
const wsBase = S ? S.replace(/^http/, 'ws') : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`;
export const API = S; // بادئة طلبات HTTP ('' = نفس الأصل)
export const WS_URL = `${wsBase}/ws`;
export const LK_URL = `${wsBase}/lk`;
