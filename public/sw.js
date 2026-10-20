// خدمة بسيطة لتمكين «تثبيت التطبيق» على الجوال. لا تخزّن شيئًا (الاجتماع حيّ دائمًا).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
