import { chromium } from 'playwright-core';
const out = 'C:/Users/it2rk/IOPsy/work/';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto('http://localhost:5180/', { waitUntil: 'load' });
await page.waitForFunction(() => document.querySelector('.loader.gone'), null, { timeout: 90000 });
await page.fill('input', 'أبو سعود'); await page.click('.go'); await page.waitForTimeout(1200);
for (const yaw of [Math.PI / 2, -Math.PI / 2]) {
  await page.evaluate((y) => { window.__tp(1.5, -14.5); window.__cam.yaw = y; window.__cam.pitch = 0.12; window.__cam.dist = 6.5; }, yaw);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: out + (yaw > 0 ? 'screen_a.png' : 'screen_b.png') });
}
await page.keyboard.press('1'); await page.waitForTimeout(700);
await page.evaluate(() => { window.__tp(0, 12); window.__cam.yaw = 0.3; window.__cam.pitch = 0.2; window.__cam.dist = 6; });
await page.waitForTimeout(1500); await page.screenshot({ path: out + 'wave.png' });
await browser.close();
