// اختبار حمل خادم الغرف: مدير + 19 مشاركًا (20) يتحركون ويدردشون. node server/loadtest.mjs [seconds]
import { spawn, execFileSync } from 'node:child_process';
import { WebSocket } from 'ws';
const SECS = Number(process.argv[2] || 20), N = 20, PORT = 3998, PW = 'load-pass-12345';
const srv = spawn('node', ['server/index.mjs'], { env: { ...process.env, PORT: String(PORT), ADMIN_PASSWORD: PW, NO_LIVEKIT: '1' }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
const cpuOf = (pid) => Number(execFileSync('powershell', ['-NoProfile', '-Command', `(Get-Process -Id ${pid}).CPU`]).toString().trim().replace(',', '.'));
const memOf = (pid) => Math.round(Number(execFileSync('powershell', ['-NoProfile', '-Command', `(Get-Process -Id ${pid}).WorkingSet64`]).toString().trim()) / 1048576);

const bots = [];
function bot(i) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://localhost:${PORT}/ws`); const b = { ws, id: null, recv: 0, bytes: 0, stateMsgs: 0, last: 0, gaps: [], chatRecv: 0, pos: { x: Math.random() * 20 - 10, z: 10 + Math.random() * 6 }, a: Math.random() * 6 };
    ws.on('open', () => ws.send(JSON.stringify(i === 0 ? { t: 'admin_start', password: PW, name: 'المدير' } : { t: 'join', code: bots[0].code, name: 'bot' + i, look: { g: i % 2 ? 'f' : 'm' } })));
    ws.on('message', (d) => {
      const m = JSON.parse(d); b.recv++; b.bytes += d.length;
      if (m.t === 'welcome') { b.id = m.id; b.code = m.code; resolve(b); }
      if (m.t === 's') { b.stateMsgs++; const now = performance.now(); if (b.last) b.gaps.push(now - b.last); b.last = now; }
      if (m.t === 'chat') b.chatRecv++;
    });
    bots.push(b);
  });
}
await bot(0); const first = bots[0];
const rest = []; for (let i = 1; i < N; i++) rest.push(await bot(i));
console.log(`دخل ${bots.length} متصلًا، الكود ${first.code}`);
const pid = srv.pid, cpu0 = cpuOf(pid), t0 = Date.now();
const mover = setInterval(() => { for (const b of bots) { b.a += 0.08; b.pos.x += Math.cos(b.a) * 0.4; b.pos.z += Math.sin(b.a) * 0.4; b.ws.send(JSON.stringify({ t: 'm', x: b.pos.x, z: b.pos.z, ry: b.a, mv: 1, sit: 0 })); } }, 80);
const chatter = setInterval(() => { const b = bots[Math.floor(Math.random() * bots.length)]; b.ws.send(JSON.stringify({ t: 'chat', text: 'رسالة اختبار ' + Math.random().toFixed(3) })); }, 700);
await new Promise((r) => setTimeout(r, SECS * 1000));
clearInterval(mover); clearInterval(chatter);
const cpu1 = cpuOf(pid), secs = (Date.now() - t0) / 1000, mem = memOf(pid);
const allGaps = bots.flatMap((b) => b.gaps).sort((a, b) => a - b), p = (q) => allGaps[Math.floor(allGaps.length * q)] ?? 0;
const totalBytes = bots.reduce((a, b) => a + b.bytes, 0);
console.log(`المدة ${secs.toFixed(0)}ث | وحدة المعالجة للخادم: ${(((cpu1 - cpu0) / secs) * 100).toFixed(1)}% من نواة واحدة | الذاكرة ${mem}MB`);
console.log(`رسائل الحالة لكل متصل: ${(bots.reduce((a, b) => a + b.stateMsgs, 0) / bots.length / secs).toFixed(1)}/ث | فاصل بين التحديثات: وسيط ${p(0.5).toFixed(0)}ms، p95 ${p(0.95).toFixed(0)}ms، p99 ${p(0.99).toFixed(0)}ms`);
console.log(`حركة الشبكة من الخادم: ${(totalBytes / secs / 1024).toFixed(0)} KB/ث إجمالًا (${(totalBytes / secs / 1024 / bots.length).toFixed(1)} KB/ث لكل متصل) | رسائل دردشة مستلمة/متصل: ${(bots.reduce((a, b) => a + b.chatRecv, 0) / bots.length).toFixed(0)}`);
const ok = p(0.95) < 250 && ((cpu1 - cpu0) / secs) < 0.5;
console.log(ok ? 'النتيجة: ممتاز لـ 20 متصلًا' : 'النتيجة: يحتاج مراجعة');
srv.kill(); process.exit(ok ? 0 : 1);
