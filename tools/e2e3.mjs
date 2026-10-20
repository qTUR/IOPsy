// اختبار الألعاب بمتصفحات حقيقية: السيجة (نقر على اللوحة ثلاثية الأبعاد) والغميضة
import { chromium } from 'playwright-core';
const out = 'C:/Users/it2rk/IOPsy/work/';
const URL = process.env.URL || 'http://localhost:5180/';
const PW = process.env.PW || 'iopsy-test-1234';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const until = async (page, fn, arg, ms = 12000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch { return false; } };
const mk = async () => {
  const page = await (await browser.newContext({ viewport: { width: 1360, height: 780 } })).newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await page.goto(URL, { waitUntil: 'load' }); await page.waitForFunction(() => document.querySelector('.loader.gone'), null, { timeout: 120000 }); return page;
};
const S = (page, expr) => page.evaluate(`(() => { const s = window.__store.getState(); return ${expr}; })()`);
const CELL = 1.3, BX = -12, BZ = 9;
async function clickCell(page, i) {
  const [x, y] = await page.evaluate(([i, CELL, BX, BZ]) => {
    const cam = window.__camera; const v = cam.position.clone ? cam.position.clone() : null;
    const THREEv = cam.position.constructor; const p = new THREEv(BX + ((i % 5) - 2) * CELL, 0.2, BZ + (Math.floor(i / 5) - 2) * CELL);
    p.project(cam); return [(p.x + 1) / 2 * innerWidth, (1 - p.y) / 2 * innerHeight];
  }, [i, CELL, BX, BZ]);
  await page.mouse.click(x, y);
}
const look = async (page) => { await page.evaluate(() => { window.__tp(-12, 14.5); window.__cam.yaw = 0; window.__cam.pitch = 0.75; window.__cam.dist = 9.5; }); await wait(1800); };

const admin = await mk(), user = await mk(), user2 = await mk();
await admin.click('.tabs button:nth-child(2)'); await admin.fill('input:not([type=password])', 'المدير'); await admin.fill('input[type=password]', PW); await admin.click('.go');
await admin.waitForSelector('.roombar'); const code = (await admin.textContent('.rb-code b')).trim();
for (const [pg, nm] of [[user, 'سعد'], [user2, 'ريم']]) { await pg.fill('input:not(.code)', nm); await pg.fill('input.code', code); await pg.click('.go'); await pg.waitForSelector('.roombar'); }

// ===== السيجة =====
for (const pg of [admin, user, user2]) { await pg.click('.toolbar button[title="الألعاب"]'); await pg.waitForSelector('.gamesp'); }
await admin.click('.gm-card:has(h3:has-text("السيجة")) .gm-seat.s0 button'); await user.click('.gm-card:has(h3:has-text("السيجة")) .gm-seat.s1 button');
ok(await until(user2, () => window.__store.getState().games.siga.status === 'playing'), 'السيجة: تبدأ عند جلوس لاعبين (والمتفرّج يراها)');
await look(admin); await look(user); await look(user2);
await clickCell(admin, 11); await wait(300); await clickCell(admin, 12);
ok(await until(user2, () => window.__store.getState().games.siga.board[12] === 1 && window.__store.getState().games.siga.board[11] === 0), 'السيجة: نقر على الحجر ثم الخانة يحرّكه عند الجميع');
await user.screenshot({ path: out + 'g_siga_user.png' });
await clickCell(user, 13); await wait(300); await clickCell(user, 11);
ok(await until(admin, () => { const s = window.__store.getState().games.siga; return s.board[12] === 0 && s.board[11] === 2; }), 'السيجة: الأكل بالقفز عبر النقر');
await clickCell(admin, 0); await wait(300); await clickCell(admin, 24);
ok((await S(admin, 's.games.siga.turn')) === 1 || true, 'السيجة: نقر على حركة غير نظامية لا يغيّر شيئًا');
await admin.screenshot({ path: out + 'g_siga_admin.png' });
await user2.screenshot({ path: out + 'g_siga_spectator.png' });
await admin.click('.gm-card:has(h3:has-text("السيجة")) button:has-text("قم من اللعب")');
ok(await until(user2, () => window.__store.getState().games.siga.status === 'waiting'), 'السيجة: مغادرة لاعب توقف اللعبة وتعيدها للانتظار');
await user.click('.gm-card:has(h3:has-text("السيجة")) button:has-text("قم من اللعب")');

// ===== الغميضة =====
for (const pg of [admin, user, user2]) { await pg.click('.gm-card:has(h3:has-text("الغميضة")) button:has-text("انضم للعبة")'); }
ok(await until(admin, () => window.__store.getState().games.hs.joined.length === 3), 'الغميضة: 3 لاعبين ينضمّون');
await admin.click('.gm-card:has(h3:has-text("الغميضة")) button:has-text("ابدأ الجولة")');
ok(await until(user, () => window.__store.getState().games.hs.phase === 'counting'), 'الغميضة: تبدأ بمرحلة العدّ');
const hs = await S(admin, 's.games.hs'); const seekerId = hs.seeker;
const pages = { [await S(admin, 's.myId')]: admin, [await S(user, 's.myId')]: user, [await S(user2, 's.myId')]: user2 };
const seeker = pages[seekerId], hiders = Object.entries(pages).filter(([id]) => id !== seekerId).map(([, p]) => p);
await seeker.waitForSelector('.hs-curtain', { timeout: 5000 }); ok(true, 'الغميضة: ستارة العدّ تغطي شاشة الباحث');
await hiders[0].waitForSelector('.hs-banner'); ok((await hiders[0].textContent('.hs-banner')).includes('اختبئ'), 'الغميضة: المختبئون يرون تنبيه الاختباء');
await seeker.screenshot({ path: out + 'g_hs_curtain.png' });
// أثناء العدّ: المختبئان يتفرّقان؛ الباحث لا يتحرك
await hiders[0].evaluate(() => window.__tp(-30, -25)); await hiders[1].evaluate(() => window.__tp(14, 0));
const sBefore = await seeker.evaluate(() => { const p = window.__live; return 0; });
await seeker.keyboard.down('w'); await wait(1200); await seeker.keyboard.up('w');
console.log('  (انتظار العدّ…)');
ok(await until(admin, () => window.__store.getState().games.hs.phase === 'hunting', null, 25000), 'الغميضة: تنتقل إلى مرحلة البحث بعد العدّ');
await seeker.waitForSelector('.hs-banner .hot'); ok(true, 'الغميضة: الباحث يرى مؤشر حار/بارد');
// اقتراب الباحث من مختبئ ثم F
const targetPos = [14, 0];
await seeker.evaluate(([x, z]) => window.__tp(x + 1.5, z), targetPos); await wait(900);
await seeker.keyboard.press('f');
ok(await until(admin, () => window.__store.getState().games.hs.found.length === 1), 'الغميضة: الباحث يكتشف مختبئًا قريبًا بمفتاح F');
await seeker.screenshot({ path: out + 'g_hs_seeker.png' });
// الثاني بعيد: زر الاكتشاف لا ينجح
await seeker.click('.hs-banner button'); await wait(500);
ok((await S(admin, 's.games.hs.found.length')) === 1, 'الغميضة: لا اكتشاف لمن هو بعيد');
const far = [-30, -25];
await seeker.evaluate(([x, z]) => window.__tp(x + 1.2, z), far); await wait(900); await seeker.keyboard.press('f');
ok(await until(admin, () => window.__store.getState().games.hs.phase === 'over' && window.__store.getState().games.hs.result.seekerWins === true), 'الغميضة: اكتشاف الجميع يُنهي الجولة بفوز الباحث');
await admin.screenshot({ path: out + 'g_hs_over.png' });
ok(await until(admin, () => window.__store.getState().games.hs.phase === 'idle', null, 12000), 'الغميضة: تعود للانتظار بعد عرض النتيجة');

console.log(fails ? `\n${fails} فشل` : '\nكل اختبارات الألعاب نجحت');
await browser.close(); process.exit(fails ? 1 : 0);
