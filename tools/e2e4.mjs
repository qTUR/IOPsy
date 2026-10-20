// اختبار سباق الهجن بمتصفحات حقيقية: انضمام، عدّ تنازلي، ضغط بالتناوب، نتيجة، كاميرا
import { chromium } from 'playwright-core';
const out = 'C:/Users/it2rk/IOPsy/work/';
const URL = process.env.URL || 'http://localhost:5180/';
const PW = process.env.PW || 'iopsy-test-1234';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const until = async (page, fn, arg, ms = 12000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch { return false; } };
const mk = async (extra = {}) => {
  const page = await (await browser.newContext({ viewport: { width: 1360, height: 780 }, ...extra })).newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await page.goto(URL, { waitUntil: 'load' }); await page.waitForFunction(() => document.querySelector('.loader.gone'), null, { timeout: 120000 }); return page;
};
const admin = await mk(), user = await mk(), user2 = await mk(), watcher = await mk();
await admin.click('.tabs button:nth-child(2)'); await admin.fill('input:not([type=password])', 'المدير'); await admin.fill('input[type=password]', PW); await admin.click('.go');
await admin.waitForSelector('.roombar'); const code = (await admin.textContent('.rb-code b')).trim();
for (const [pg, nm] of [[user, 'سعد'], [user2, 'ريم'], [watcher, 'متفرج']]) { await pg.fill('input:not(.code)', nm); await pg.fill('input.code', code); await pg.click('.go'); await pg.waitForSelector('.roombar'); }
for (const pg of [admin, user, user2, watcher]) { if (!(await pg.locator('.gamesp').count())) await pg.click('.toolbar button[title="الألعاب"]'); await pg.waitForSelector('.gamesp'); }
const card = '.gm-card:has(h3:has-text("سباق الهجن"))';
await admin.click(`${card} button:has-text("انضم للسباق")`); await user.click(`${card} button:has-text("انضم للسباق")`); await user2.click(`${card} button:has-text("انضم للسباق")`);
ok(await until(watcher, () => window.__store.getState().games.race.joined.length === 3), 'السباق: 3 متسابقين ينضمّون والمتفرج يرى');
await wait(1500); await watcher.evaluate(() => { window.__tp(0, 22); window.__cam.yaw = Math.PI; window.__cam.pitch = 0.3; window.__cam.dist = 12; });
await wait(1500); await watcher.screenshot({ path: out + 'race_lobby.png' });
ok(!(await user.locator(`${card} button:has-text("ابدأ السباق")`).isDisabled()), 'السباق: زر البدء يتفعّل بوجود متسابقين');
await user.click(`${card} button:has-text("ابدأ السباق")`);
ok(await until(user2, () => window.__store.getState().games.race.phase === 'countdown'), 'السباق: يبدأ العدّ التنازلي');
await user.waitForSelector('.race-count'); await user.screenshot({ path: out + 'race_count.png' });
ok(await until(user, () => window.__store.getState().games.race.phase === 'racing', null, 8000), 'السباق: ينتقل إلى الانطلاق');
await watcher.waitForSelector('.race-watch'); ok(true, 'السباق: المتفرّج يرى شريط المشاهدة');
await watcher.click('.race-watch button:has-text("كاميرا السباق")');
await user.waitForSelector('.race-btns'); ok(true, 'السباق: المتسابق يرى أزرار الضغط');
const runner = async (pg, keys, gap, n) => { for (let i = 0; i < n; i++) { await pg.keyboard.press(keys[i % 2]); await wait(gap); } };
const shot = (async () => { await wait(4000); await watcher.screenshot({ path: out + 'race_mid.png' }); await user.screenshot({ path: out + 'race_racer.png' }); })();
await Promise.all([runner(user, ['a', 'd'], 70, 130), runner(user2, ['ArrowLeft', 'ArrowRight'], 110, 130), shot]);
ok(await until(admin, () => window.__store.getState().games.race.phase === 'racing' || window.__store.getState().games.race.phase === 'over', null, 5000), 'السباق: يجري ويتزامن');
// admin لم يضغط: ينتظر مهلة النهاية أو يكمل: نجعله يضغط أيضًا ببطء ليكتمل
await runner(admin, ['a', 'd'], 150, 120);
ok(await until(watcher, () => window.__store.getState().games.race.phase === 'over', null, 30000), 'السباق: ينتهي عندما يكمل الجميع');
const res = await watcher.evaluate(() => window.__store.getState().games.race.finished.map((f) => [f.id, f.t]));
ok(res.length === 3 && res[0][1] < res[1][1] && res[1][1] < res[2][1], 'السباق: الترتيب بحسب زمن الوصول');
await watcher.waitForSelector('.race-results'); await watcher.screenshot({ path: out + 'race_results.png' });
ok((await watcher.textContent('.race-results li')).includes('سعد'), 'السباق: الأسرع (سعد، يضغط كل 70ms) هو الأول');
ok(await until(admin, () => window.__store.getState().games.race.phase === 'idle', null, 15000), 'السباق: يعود للانتظار بعد النتيجة');
console.log(fails ? `\n${fails} فشل` : '\nكل اختبارات السباق نجحت');
await browser.close(); process.exit(fails ? 1 : 0);
