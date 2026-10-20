// إدخال اللمس (عصا افتراضية + ركض) يُدمج مع لوحة المفاتيح في Player
export const touch = { x: 0, z: 0, run: false };

/** جهاز يعمل باللمس (جوال/تابلت) */
export const isTouchDevice = () => typeof window !== 'undefined' && (matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 1);
/** هل المنصة تدعم مشاركة الشاشة؟ (غير متاحة في متصفحات الجوال) */
export const canShareScreen = () => typeof navigator !== 'undefined' && !!navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function' && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
