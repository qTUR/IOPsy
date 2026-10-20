// تشغيل الاجتماع بأمر واحد: يبني الواجهة إن لزم، ثم يشغّل الخادم (ومعه LiveKit) ويطبع العناوين.  npm run meeting
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const newest = (dir) => { let m = 0; for (const f of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, f.name); m = Math.max(m, f.isDirectory() ? newest(p) : fs.statSync(p).mtimeMs); } return m; };
const distOk = fs.existsSync('dist/index.html') && fs.statSync('dist/index.html').mtimeMs > newest('src');
if (!distOk) { console.log('جارٍ بناء الواجهة (مرة واحدة)…'); const r = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true }); if (r.status !== 0) process.exit(1); }

const port = process.env.PORT || 3002;
const lan = Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address);
console.log('\n=============== IOPsy ===============');
console.log(` على جهازك:        http://localhost:${port}`);
for (const ip of lan) console.log(` من نفس الشبكة:    http://${ip}:${port}`);
console.log(' للمشاركين من الإنترنت: شغّل النفق (انظر HOSTING.md) ثم أرسل لهم رابطه + كود الجلسة');
console.log(' دخول المدير: تبويب «المدير» ← كلمة السر (أول تشغيل تُطبع هنا مرة واحدة)');
console.log('=====================================\n');
const child = spawn('node', ['server/index.mjs'], { stdio: 'inherit', env: process.env });
child.on('exit', (c) => process.exit(c ?? 0));
process.on('SIGINT', () => child.kill());
