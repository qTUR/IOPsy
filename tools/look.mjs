// لقطات لشكل الشخصية: node tools/look.mjs
import { chromium } from 'playwright-core';
const out = 'C:/Users/it2rk/IOPsy/work/';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
async function shot(q, name, actions) {
  await page.goto('http://localhost:5180/?' + q, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelector('.loader.gone'), null, { timeout: 90000 });
  await page.addStyleTag({ content: '.join{display:none!important}' });
  if (actions) await actions();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: out + name });
}
await shot('face', 'look_face_m.png');
await shot('body', 'look_body_m.png');
await shot('face', 'look_face_f.png', async () => { await page.evaluate(() => { window.__setLook?.({ g: 'f' }); }); });
await browser.close();
