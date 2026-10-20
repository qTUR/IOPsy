import { chromium } from 'playwright-core';
const out = 'C:/Users/it2rk/IOPsy/work/';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
async function open(q) {
  await page.goto('http://localhost:5180/?' + q, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelector('.loader.gone'), null, { timeout: 90000 });
  await page.addStyleTag({ content: '.join{display:none!important}' });
}
const looks = {
  a: { g: 'm', c: 0, h: 0, s: 1, b: 0, bag: 0, o: 2, gl: 0, w: 0, sh: 2 },
  b: { g: 'm', c: 1, h: 1, s: 2, b: 2, bag: 1, o: 1, gl: 2, w: 1, sh: 1 },
  c: { g: 'm', c: 3, h: 5, s: 0, b: 1, bag: 2, hr: 2, o: 0, gl: 1, w: 1, sh: 0 },
  d: { g: 'f', c: 0, h: 0, s: 1, bag: 1, sc: 0, sh: 0 },
  e: { g: 'f', c: 1, h: 1, s: 3, bag: 2, sc: 2, sh: 0 },
};
for (const [k, look] of Object.entries(looks)) {
  await open(process.argv[2] || 'body');
  await page.evaluate((l) => window.__setLook(l), look);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out + `v_${k}.png`, clip: process.argv[2] === 'mid' ? { x: 100, y: 60, width: 700, height: 800 } : { x: 150, y: 80, width: 600, height: 760 } });
}
await browser.close();
