import { chromium } from 'playwright-core';
const out = 'C:/Users/it2rk/IOPsy/work/';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 700, height: 700 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto('http://localhost:5180/?face', { waitUntil: 'load' });
await page.waitForFunction(() => document.querySelector('.loader.gone'), null, { timeout: 120000 });
await page.addStyleTag({ content: '.join{display:none!important}' });
const looks = {
  a: { g: 'm', h: 0, s: 1, b: 0, o: 2, sh: 2 }, b: { g: 'm', h: 1, s: 2, b: 2, o: 1, gl: 1 }, c: { g: 'm', h: 5, hr: 2, s: 0, b: 1, o: 0 },
  d: { g: 'f', h: 0, s: 1, sc: 0 }, e: { g: 'f', h: 0, s: 3, sc: 2 },
};
for (const [k, l] of Object.entries(looks)) { await page.evaluate((x) => window.__setLook(x), l); await page.waitForTimeout(2200); await page.screenshot({ path: out + `f_${k}.png` }); }
await browser.close();
