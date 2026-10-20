import { chromium } from 'playwright-core';
import fs from 'node:fs';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--enable-gpu'] });
const page = await browser.newPage();
await page.goto('http://localhost:5180/', { waitUntil: 'load' });
const urls = await page.evaluate(async () => {
  const m = await import('/src/scene/faceTex.ts');
  return { eye: m.eyeTexture(false, false).image.toDataURL(), eyef: m.eyeTexture(true, false).image.toDataURL(), brow: m.browTexture(false, false).image.toDataURL(), mouth: m.mouthTexture(false).image.toDataURL() };
});
for (const [k, v] of Object.entries(urls)) fs.writeFileSync(`C:/Users/it2rk/IOPsy/work/tex_${k}.png`, Buffer.from(v.split(',')[1], 'base64'));
await browser.close();
