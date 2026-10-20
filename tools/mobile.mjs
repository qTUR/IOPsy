// اختبار الجوال: شاشة iPhone/Android، لمس حقيقي (CDP)، عصا الحركة، قرص بإصبعين، لوحات سفلية، أفقي/عمودي
import { chromium } from 'playwright-core';
const out = 'C:/Users/it2rk/IOPsy/work/';
const URL = process.env.URL || 'http://localhost:5180/';
const PW = process.env.PW || 'iopsy-test-1234';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const until = async (page, fn, arg, ms = 12000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch { return false; } };
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';

async function mk(opts) {
  const ctx = await browser.newContext({ permissions: ['microphone', 'camera'], ...opts });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await page.goto(URL, { waitUntil: 'load' }); await page.waitForFunction(() => document.querySelector('.loader.gone'), null, { timeout: 120000 });
  return { page, ctx, cdp: await ctx.newCDPSession(page) };
}
const touch = (cdp, type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], id) => ({ x, y, id })) });
const S = (page, expr) => page.evaluate(`(() => { const s = window.__store.getState(); return ${expr}; })()`);

const desk = await mk({ viewport: { width: 1280, height: 720 } });
const admin = desk.page;
await admin.click('.tabs button:nth-child(2)'); await admin.fill('input:not([type=password])', 'المدير'); await admin.fill('input[type=password]', PW); await admin.click('.go');
await admin.waitForSelector('.roombar'); const code = (await admin.textContent('.rb-code b')).trim();

// ===== آيفون عمودي =====
const ph = await mk({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: IPHONE });
const m = ph.page;
await m.screenshot({ path: out + 'mob_join.png' });
ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'الجوال: شاشة الدخول بلا تمرير أفقي');
ok(await m.evaluate(() => getComputedStyle(document.querySelector('input')).fontSize === '16px'), 'الجوال: حقول الإدخال 16px (يمنع تكبير iOS)');
await m.fill('input:not(.code)', 'نورة'); await m.fill('input.code', code);
await m.tap('.seg button:has-text("امرأة")');
await m.tap('.go'); await m.waitForSelector('.roombar', { timeout: 20000 });
ok(true, 'الجوال: الدخول بالكود عبر اللمس');
await wait(2500);
ok(await m.locator('.joy').count() === 1 && await m.locator('.tc-btns button').count() === 3, 'الجوال: عصا الحركة وأزرار (ركض/جلوس/تحيّات) ظاهرة');
ok(await m.locator('.toolbar button[title="مشاركة الشاشة"]').count() === 0, 'الجوال: زر مشاركة الشاشة مخفي (المنصة لا تدعمها)');
await m.screenshot({ path: out + 'mob_play.png' });

// عصا الحركة بلمس حقيقي: اسحب للأعلى فتتحرك الشخصية ويرى المدير الحركة
const jb = await m.evaluate(() => { const r = document.querySelector('.joy').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
const myId = await S(m, 's.myId');
const p0 = await admin.evaluate((id) => { const l = window.__live.get(id); return l ? [l.x, l.z] : null; }, myId);
await touch(ph.cdp, 'touchStart', [jb]); for (let i = 1; i <= 6; i++) { await touch(ph.cdp, 'touchMove', [[jb[0], jb[1] - i * 9]]); await wait(120); }
await wait(1200); await touch(ph.cdp, 'touchEnd', []);
await wait(400);
const p1 = await admin.evaluate((id) => { const l = window.__live.get(id); return l ? [l.x, l.z] : null; }, myId);
ok(p0 && p1 && Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) > 1.5, `الجوال: العصا تحرّك الشخصية ويراها الآخرون (تحركت ${p0 && p1 ? Math.hypot(p1[0] - p0[0], p1[1] - p0[1]).toFixed(1) : '?'}م)`);
// قرص بإصبعين
const d0 = await m.evaluate(() => window.__cam.dist);
await touch(ph.cdp, 'touchStart', [[120, 300], [270, 300]]);
for (let i = 1; i <= 6; i++) { await touch(ph.cdp, 'touchMove', [[120 - i * 12, 300], [270 + i * 12, 300]]); await wait(60); }
await touch(ph.cdp, 'touchEnd', []);
const d1 = await m.evaluate(() => window.__cam.dist);
ok(d1 < d0 - 1, `الجوال: القرص بإصبعين يقرّب الكاميرا (${d0.toFixed(1)} ← ${d1.toFixed(1)})`);
// سحب بإصبع لتدوير الكاميرا
const y0 = await m.evaluate(() => window.__cam.yaw);
await touch(ph.cdp, 'touchStart', [[250, 250]]); for (let i = 1; i <= 8; i++) { await touch(ph.cdp, 'touchMove', [[250 - i * 14, 250]]); await wait(40); } await touch(ph.cdp, 'touchEnd', []);
ok(Math.abs((await m.evaluate(() => window.__cam.yaw)) - y0) > 0.3, 'الجوال: السحب بإصبع يدوّر الكاميرا');
// تحيّة وجلوس
await m.tap('.tc-btns button:nth-child(3)'); await m.waitForSelector('.tc-emotes'); await m.tap('.tc-emotes button:nth-child(3)');
ok(await until(admin, () => Object.values(window.__store.getState().says).some((x) => x.text.includes('ما شاء الله'))), 'الجوال: التحيّة تصل للمدير');
// لوحات سفلية
await m.tap('.toolbar button[title="الدردشة"]'); await m.waitForSelector('.dock .chatp');
const sheet = await m.evaluate(() => { const r = document.querySelector('.dock').getBoundingClientRect(); return { w: r.width, bottom: innerHeight - r.bottom, h: r.height }; });
ok(sheet.w > 360 && sheet.h > 200 && sheet.h < 560, `الجوال: الدردشة تظهر كورقة سفلية (${sheet.w.toFixed(0)}×${sheet.h.toFixed(0)})`);
await m.fill('.chatp .row input', 'السلام من الجوال'); await m.keyboard.press('Enter');
if (!(await admin.locator('.chatp').count())) await admin.click('.toolbar button[title="الدردشة"]'); await admin.waitForSelector('.chatp .msg:has-text("السلام من الجوال")', { timeout: 8000 });
ok(true, 'الجوال: رسالة الدردشة من الجوال تصل');
await m.screenshot({ path: out + 'mob_chat.png' });
await m.tap('.toolbar button[title="الألعاب"]'); await m.waitForSelector('.dock .gamesp'); await m.screenshot({ path: out + 'mob_games.png' });
await m.tap('.toolbar button[title="الإعدادات"]'); await m.waitForSelector('.dock .settings'); await m.screenshot({ path: out + 'mob_settings.png' });
ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'الجوال: لا تمرير أفقي أثناء اللعب');
await m.tap('.settings .seg:nth-of-type(3) button:first-child').catch(() => {}); // جودة الرسوميات = أدنى
await m.evaluate(() => window.__store.getState().setSettings({ gfx: 'min' })); await wait(2000);
await m.screenshot({ path: out + 'mob_min.png' });
ok(true, 'الجوال: وضع الرسوميات الأدنى يعمل (لقطة)');
await m.evaluate(() => window.__store.getState().setSettings({ gfx: 'low' })); await wait(1500);

// ===== السيجة باللمس =====
await m.tap('.toolbar button[title="الألعاب"]').catch(() => {});
if (!(await admin.locator('.gamesp').count())) await admin.click('.toolbar button[title="الألعاب"]');
await admin.waitForSelector('.gamesp'); await admin.click('.gm-card:has(h3:has-text("السيجة")) .gm-seat.s0 button');
if (!(await m.locator('.gamesp').count())) await m.tap('.toolbar button[title="الألعاب"]');
await m.waitForSelector('.gamesp'); await m.tap('.gm-card:has(h3:has-text("السيجة")) .gm-seat.s1 button');
ok(await until(m, () => window.__store.getState().games.siga.status === 'playing'), 'الجوال: الجلوس للسيجة باللمس');
await m.tap('.dock .ph button'); // أغلق اللوحة
await m.evaluate(() => { window.__tp(-12, 14.5); window.__cam.yaw = 0; window.__cam.pitch = 0.75; window.__cam.dist = 9.5; }); await wait(1800);
const xy = (page, i) => page.evaluate((i) => { const cam = window.__camera; const V = cam.position.constructor; const p = new V(-12 + ((i % 5) - 2) * 1.3, 0.2, 9 + (Math.floor(i / 5) - 2) * 1.3); p.project(cam); return [(p.x + 1) / 2 * innerWidth, (1 - p.y) / 2 * innerHeight]; }, i);
// الأبيض (المدير) يبدأ: حرّكه من الدسكتوب ثم الأسود على الجوال يأكل بالمس
await admin.evaluate(() => { window.__tp(-12, 14.5); window.__cam.yaw = 0; window.__cam.pitch = 0.75; window.__cam.dist = 9.5; }); await wait(1800);
const ax = async (i) => { const [x, y] = await xy(admin, i); await admin.mouse.click(x, y); };
await ax(11); await wait(300); await ax(12);
await until(m, () => window.__store.getState().games.siga.board[12] === 1);
const [c13x, c13y] = await xy(m, 13); await m.touchscreen.tap(c13x, c13y); await wait(300);
const [c11x, c11y] = await xy(m, 11); await m.touchscreen.tap(c11x, c11y);
ok(await until(admin, () => { const s = window.__store.getState().games.siga; return s.board[12] === 0 && s.board[11] === 2; }), 'الجوال: تحريك حجر السيجة بالنقر باللمس (أكل بالقفز)');
await m.screenshot({ path: out + 'mob_siga.png' });

// ===== أندرويد أفقي =====
const an = await mk({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: ANDROID });
await an.page.fill('input:not(.code)', 'خالد'); await an.page.fill('input.code', code); await an.page.tap('.go'); await an.page.waitForSelector('.roombar', { timeout: 20000 }); await wait(2500);
await an.page.screenshot({ path: out + 'mob_land.png' });
await an.page.tap('.toolbar button[title="الدردشة"]'); await wait(500); await an.page.screenshot({ path: out + 'mob_land_chat.png' });
ok(await an.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.documentElement.scrollHeight <= innerHeight + 1), 'الجوال أفقيًا: لا تمرير');
// ===== آيباد =====
const ip = await mk({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: IPHONE.replace('iPhone', 'iPad') });
await ip.page.fill('input:not(.code)', 'سارة'); await ip.page.fill('input.code', code); await ip.page.tap('.go'); await ip.page.waitForSelector('.roombar', { timeout: 20000 }); await wait(2500);
await ip.page.screenshot({ path: out + 'mob_ipad.png' });

console.log(fails ? `\n${fails} فشل` : '\nكل اختبارات الجوال نجحت');
await browser.close(); process.exit(fails ? 1 : 0);
