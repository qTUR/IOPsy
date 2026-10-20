// لقطة: PDF معروض على شاشة الخيمة ثلاثية الأبعاد
import { chromium } from 'playwright-core';
const out = 'C:/Users/it2rk/IOPsy/work/';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1360, height: 780 } })).newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto(process.env.URL || 'http://localhost:5180/', { waitUntil: 'load' });
await page.waitForFunction(() => document.querySelector('.loader.gone'), null, { timeout: 120000 });
await page.click('.tabs button:nth-child(2)'); await page.fill('input:not([type=password])', 'المدير'); await page.fill('input[type=password]', 'iopsy-test-1234'); await page.click('.go');
await page.waitForSelector('.roombar'); await page.click('.toolbar button[title="العارض"]');
await page.setInputFiles('.projp input[type=file][accept="application/pdf"]', out + 'test3.pdf');
await page.waitForFunction(() => window.__store.getState().proj.mode === 'pdf', null, { timeout: 15000 });
await page.click('.ph button'); // أغلق اللوحة
await page.evaluate(() => { window.__tp(2.5, -13.5); window.__cam.yaw = Math.PI / 2 + 0.05; window.__cam.pitch = 0.12; window.__cam.dist = 5.5; });
await page.waitForTimeout(3500);
await page.screenshot({ path: out + 'tent_pdf.png' });
await browser.close();
