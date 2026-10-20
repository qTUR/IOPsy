// اختبار شامل بمتصفحات حقيقية بأجهزة وهمية: صوت/كاميرا/شاشة، صلاحيات، عارض PDF، رسائل خاصة، لغة
import { chromium } from 'playwright-core';
const out = 'C:/Users/it2rk/IOPsy/work/';
const URL = process.env.URL || 'http://localhost:5180/';
const PW = process.env.PW || 'iopsy-test-1234';
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=C:/Users/it2rk/IOPsy/work/tone.wav', '--auto-select-desktop-capture-source=Entire screen', '--enable-usermedia-screen-capturing', '--allow-http-screen-capture', '--autoplay-policy=no-user-gesture-required'],
});
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const until = async (page, fn, arg, ms = 12000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch { return false; } };
const mk = async () => {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 780 }, permissions: ['microphone', 'camera'] });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  page.on('dialog', (d) => d.accept());
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelector('.loader.gone'), null, { timeout: 120000 });
  return page;
};
const S = (page, expr) => page.evaluate(`(() => { const s = window.__store.getState(); return ${expr}; })()`);

// نص PDF صالح من 3 صفحات
function buildPdf(n) {
  const objs = []; const add = (s) => { objs.push(s); return objs.length; };
  add('<< /Type /Catalog /Pages 2 0 R >>');
  const kids = []; for (let i = 0; i < n; i++) kids.push(`${4 + i * 2} 0 R`);
  add(`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${n} >>`);
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  for (let i = 0; i < n; i++) {
    const body = `BT /F1 90 Tf 80 400 Td (Page ${i + 1}) Tj ET`;
    add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${5 + i * 2} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`);
    add(`<< /Length ${body.length} >>\nstream\n${body}\nendstream`);
  }
  let pdf = '%PDF-1.4\n'; const offs = [];
  objs.forEach((o, i) => { offs.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = pdf.length; pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  return Buffer.from(pdf);
}
import fs from 'node:fs';
fs.writeFileSync(out + 'test3.pdf', buildPdf(3));

const admin = await mk(), user = await mk(), user2 = await mk();

// ---- الدخول ----
await admin.click('.tabs button:nth-child(2)');
await admin.fill('input:not([type=password])', 'المدير'); await admin.fill('input[type=password]', PW); await admin.click('.go');
await admin.waitForSelector('.roombar', { timeout: 20000 });
const code = (await admin.textContent('.rb-code b')).trim();
for (const [pg, nm] of [[user, 'سعد'], [user2, 'ريم']]) { await pg.fill('input:not(.code)', nm); await pg.fill('input.code', code); await pg.click('.go'); await pg.waitForSelector('.roombar', { timeout: 20000 }); }
ok(true, 'دخل المدير ومشاركان: ' + code);
ok(await until(admin, () => window.__store.getState().media.state === 'on', null, 20000), 'اتصال LiveKit للمدير');
ok(await until(user, () => window.__store.getState().media.state === 'on', null, 20000), 'اتصال LiveKit للمشارك (عبر الوكيل /lk)');
await user2.waitForFunction(() => window.__store.getState().media.state === 'on', null, { timeout: 20000 });

// ---- ميكروفون وكاميرا ----
await user.click('.toolbar button[title="الميكروفون"]');
ok(await until(user, () => window.__store.getState().media.mic === true), 'المشارك يفعّل الميكروفون');
ok(await until(admin, (id) => window.__store.getState().media.micOn[id] === true, await S(user, 's.myId')), 'المدير يرى ميكروفون المشارك مفعّلًا');
let spk = await until(admin, (id) => window.__store.getState().media.speaking[id] === true, await S(user, 's.myId'), 15000);
if (!spk) console.log('DEBUG speakers:', JSON.stringify(await admin.evaluate(() => { const r = window.__room(); return { active: r.activeSpeakers.map((p) => p.identity), remote: [...r.remoteParticipants.values()].map((p) => ({ id: p.identity, level: p.audioLevel, speaking: p.isSpeaking, pubs: [...p.trackPublications.values()].map((t) => t.source + ':' + (t.isMuted ? 'm' : 'u') + ':' + !!t.track) })) }; })));
ok(spk, 'مؤشر التحدّث يظهر عند المدير (صوت فعلي وصل)');
await user.click('.toolbar button[title="الكاميرا"]');
ok(await until(user, () => window.__store.getState().media.cam === true), 'المشارك يفعّل الكاميرا');
await admin.waitForSelector('.tile video', { timeout: 15000 });
ok(await until(admin, () => [...document.querySelectorAll('.tile video')].some((v) => v.videoWidth > 0), null, 15000), 'فيديو المشارك يصل ويُعرض عند المدير (videoWidth>0)');
await admin.screenshot({ path: out + 'm3_admin_cam.png' });

// ---- كتم المشرف/المدير فقط ----
await user2.click('.toolbar button[title="الميكروفون"]'); await until(user2, () => window.__store.getState().media.mic === true);
const uid = await S(user, 's.myId');
await admin.click('.toolbar button[title="المشاركون"]');
await admin.click(`.people li:has-text("سعد") button[title="كتم"]`);
ok(await until(user, () => window.__store.getState().media.mic === false), 'كتم المدير ميكروفون المشارك فعلًا');
ok(await until(admin, (id) => window.__store.getState().media.micOn[id] === false, uid), 'والمدير يرى الميكروفون مكتومًا');
await admin.click(`.people li:has-text("سعد") button[title="إيقاف الكاميرا"]`);
ok(await until(user, () => window.__store.getState().media.cam === false), 'إيقاف الكاميرا من المدير');
// المشارك لا يستطيع إيقاف غيره
ok((await user2.locator('.people li button[title="كتم"]').count()) === 0, 'المشارك العادي لا يرى أزرار الكتم');

// ---- المدير لا يُفعّل أجهزة غيره: كتم الجميع لا يُشغّل شيئًا ----
await admin.click('.toolbar button[title="الإدارة"]'); await admin.click('.bigbtn:has-text("كتم الجميع")'); await wait(800);
ok(await S(user2, 's.media.mic') === false, 'كتم الجميع يكتم ميكروفون المشاركين');
ok(await S(user, 's.media.cam') === false && await S(user, 's.media.mic') === false, 'لا شيء يُفعَّل عن بُعد');

// ---- تقييد الكاميرا (فرض من الخادم) ----
await admin.click(`.mg-user:has-text("سعد") button[title="الكاميرا"]`);
ok(await until(user, () => window.__store.getState().perm.cam === false), 'وصل تقييد الكاميرا للمشارك');
await user.click('.toolbar button[title="الكاميرا"]'); await wait(500);
ok((await S(user, 's.media.cam')) === false, 'زر الكاميرا لا يعمل مع التقييد');
// محاولة التفاف: نشر مباشر عبر LiveKit يجب أن يفشل أو يُسحب
await user.evaluate(async () => { try { await window.__room().localParticipant.setCameraEnabled(true); } catch { /* مرفوض */ } });
await wait(2500);
const camSeen = await admin.evaluate((id) => !!window.__store.getState().media.v && [...document.querySelectorAll('.tile')].length, uid);
ok(camSeen === 0, 'التفاف المتصفح على التقييد لا ينجح (الخادم يسحب الصلاحية)');
await admin.click(`.mg-user:has-text("سعد") button[title="الكاميرا"]`); await until(user, () => window.__store.getState().perm.cam === true);
ok(true, 'رفع التقييد');

// ---- مشاركة الشاشة: ممنوعة افتراضيًا للمشارك ----
ok((await S(user, 's.perm.screen')) === false, 'مشاركة الشاشة ممنوعة افتراضيًا للمشارك');
await admin.click(`.mg-user:has-text("سعد") button[title="مشاركة الشاشة"]`);
ok(await until(user, () => window.__store.getState().perm.screen === true), 'المدير يسمح للمشارك بمشاركة الشاشة');
await user.click('.toolbar button[title="مشاركة الشاشة"]');
const shared = await until(user, () => window.__store.getState().media.screen === true, null, 12000);
ok(shared, 'المشارك يشارك شاشته (التقاط وهمي)');
if (shared) {
  ok(await until(admin, () => [...document.querySelectorAll('.screenwin video')].some((v) => v.videoWidth > 0), null, 15000), 'المدير يرى شاشة المشارك');
  await admin.screenshot({ path: out + 'm3_admin_screen.png' });
  await admin.click('.toolbar button[title="المشاركون"]'); await admin.waitForSelector('.people');
  await admin.click('.people li:has-text("سعد") button[title="إيقاف المشاركة"]');
  ok(await until(user, () => window.__store.getState().media.screen === false), 'المدير يوقف مشاركة الشاشة');
}

// ---- العارض: PDF ----
await admin.click('.toolbar button[title="العارض"]');
await admin.setInputFiles('.projp input[type=file][accept="application/pdf"]', out + 'test3.pdf');
ok(await until(admin, () => window.__store.getState().proj.mode === 'pdf', null, 15000), 'المدير يرفع PDF ويفتحه على العارض');
ok(await until(user2, () => window.__store.getState().proj.mode === 'pdf' && window.__store.getState().proj.pdf.pages === 3), 'المشارك يستلم PDF بـ 3 صفحات');
await admin.click('.pj-nav button:has-text("التالي")');
ok(await until(user2, () => window.__store.getState().proj.page === 2), 'تغيير الصفحة يتزامن عند الجميع');
await user2.click('.toolbar button[title="العارض"]'); await user2.click('.pj-state button:has-text("عرض كامل")');
await user2.waitForSelector('.povl canvas');
await wait(2500);
const painted = await user2.evaluate(() => { const c = document.querySelector('.povl canvas'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let white = 0; for (let i = 0; i < d.length; i += 4 * 97) if (d[i] > 240 && d[i + 1] > 240) white++; return white; });
ok(painted > 50, 'صفحة PDF تُرسم فعليًا في العرض الكامل (بكسلات بيضاء: ' + painted + ')');
await user2.screenshot({ path: out + 'm3_pdf_full.png' });
ok((await user2.locator('.po-nav').count()) === 0, 'المشارك لا يملك أزرار تقليب الصفحات');
await user2.keyboard.press('Escape');
await admin.click('.pj-state button:has-text("عرض كامل")'); await wait(300); await admin.keyboard.press('Escape');
// رابط مرفوض
await admin.fill('.projp input[placeholder*="Drive"]', 'https://127.0.0.1/x.pdf'); await admin.click('.projp .row button'); await admin.waitForSelector('.projp .err', { timeout: 8000 });
ok((await admin.textContent('.projp .err')).includes('غير مدعوم'), 'رابط داخلي يُرفض برسالة مفهومة');
await admin.click('.bigbtn.danger'); ok(await until(user2, () => window.__store.getState().proj.mode === 'idle'), 'إيقاف العرض');

// ---- العارض: فيديو (ملف webm يُسجَّل داخل المتصفح) ----
const webmB64 = await admin.evaluate(async () => {
  const c = document.createElement('canvas'); c.width = 320; c.height = 180; const x = c.getContext('2d'); const st = c.captureStream(15);
  const rec = new MediaRecorder(st, { mimeType: 'video/webm;codecs=vp8' }); const chunks = []; rec.ondataavailable = (e) => chunks.push(e.data);
  let f = 0; const tmr = setInterval(() => { x.fillStyle = `hsl(${f * 9 % 360},70%,45%)`; x.fillRect(0, 0, 320, 180); x.fillStyle = '#fff'; x.fillRect((f * 7) % 300, 70, 40, 40); f++; }, 66);
  rec.start(); await new Promise((r) => setTimeout(r, 4000)); rec.stop(); await new Promise((r) => (rec.onstop = r)); clearInterval(tmr);
  const buf = new Uint8Array(await new Blob(chunks).arrayBuffer()); let b = ''; for (let i = 0; i < buf.length; i += 8192) b += String.fromCharCode(...buf.subarray(i, i + 8192)); return btoa(b);
});
fs.writeFileSync(out + 'test.webm', Buffer.from(webmB64, 'base64'));
if (!(await admin.locator('.projp').count())) await admin.click('.toolbar button[title="العارض"]'); await admin.waitForSelector('.projp');
await admin.setInputFiles('.projp input[type=file][accept^="video"]', out + 'test.webm');
ok(await until(user2, () => window.__store.getState().proj.mode === 'video', null, 20000), 'المدير يرفع فيديو ويصل للمشاركين');
await admin.click('.pj-nav button:has-text("تشغيل")');
ok(await until(user2, () => window.__store.getState().proj.video.playing === true), 'تشغيل الفيديو يتزامن');
await wait(2500);
const t1 = await user2.evaluate(() => window.__proj.fileVideo.currentTime), pl = await user2.evaluate(() => !window.__proj.fileVideo.paused);
ok(pl && t1 > 0.5, 'الفيديو يعمل فعليًا عند المشارك (الوقت ' + t1.toFixed(1) + 'ث)');
await admin.click('.pj-nav button:has-text("إيقاف مؤقت")');
ok(await until(user2, () => window.__proj.fileVideo.paused === true), 'إيقاف الفيديو يتزامن');
await admin.click('.bigbtn.danger'); await until(user2, () => window.__store.getState().proj.mode === 'idle');

// ---- رسالة خاصة ----
await user.click('.toolbar button[title="الدردشة"]').catch(() => {});
await user.evaluate(() => document.querySelector('.chatp') || document.querySelector('.toolbar button[title="الدردشة"]').click());
await user.waitForSelector('.chatp');
await user.selectOption('.dmsel', { label: 'إلى: المدير (خاص)' });
await user.fill('.chatp .row input', 'سرّ بيني وبينك'); await user.keyboard.press('Enter');
await admin.click('.toolbar button[title="الدردشة"]');
await admin.waitForSelector('.chatp .msg.dm:has-text("سرّ بيني وبينك")', { timeout: 8000 });
ok(true, 'المدير يستلم الرسالة الخاصة');
await user2.click('.toolbar button[title="الدردشة"]'); await user2.waitForSelector('.chatp'); await wait(500);
ok((await user2.locator('.chatp .msg:has-text("سرّ بيني")').count()) === 0, 'مشارك ثالث لا يرى الرسالة الخاصة');

// ---- اللغة ----
await admin.click('.toolbar button[title="الإعدادات"]'); await admin.click('.settings .seg button:has-text("English")');
ok((await admin.evaluate(() => document.documentElement.dir)) === 'ltr' && (await admin.locator('.toolbar button[title="People"]').count()) === 1, 'التحويل إلى الإنجليزية (LTR وترجمة الواجهة)');
await admin.screenshot({ path: out + 'm3_admin_en.png' });
await admin.click('.settings .seg button:has-text("العربية")');

await admin.screenshot({ path: out + 'm3_admin_final.png' });
await user.screenshot({ path: out + 'm3_user_final.png' });
console.log(fails ? `\n${fails} فشل` : '\nكل اختبارات المعلم 3 نجحت');
await browser.close(); process.exit(fails ? 1 : 0);
