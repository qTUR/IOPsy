import { chromium } from 'playwright-core';
const out = 'C:/Users/it2rk/IOPsy/work/';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p = await ctx.newPage(); await p.goto('http://localhost:5180/'); await p.waitForFunction(() => document.querySelector('.loader.gone')); await p.waitForTimeout(1500);
await p.screenshot({ path: out + 'mob_join.png' });
await p.evaluate(() => document.querySelector('.card').scrollTo(0, 600)); await p.waitForTimeout(400); await p.screenshot({ path: out + 'mob_join2.png' });
await browser.close();
