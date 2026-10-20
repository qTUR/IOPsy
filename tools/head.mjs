// رأس عاري بقرب شديد: node tools/head.mjs
import { chromium } from 'playwright-core';
const out = 'C:/Users/it2rk/IOPsy/work/';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('ERR', m.text()); });
await page.goto('http://localhost:5180/?face', { waitUntil: 'load' });
await page.waitForFunction(() => document.querySelector('.loader.gone'), null, { timeout: 120000 });
await page.addStyleTag({ content: '.join{display:none!important}' });
for (const [k, look] of Object.entries({ m: { g: 'm', h: 5, hr: 9, s: 1, b: 0, o: 0 }, f: { g: 'f', h: 5, hr: 9, s: 1 } })) {
  await page.evaluate((l) => window.__setLook(l), look);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: out + `head_${k}.png`, clip: { x: 200, y: 150, width: 500, height: 520 } });
}
await browser.close();
