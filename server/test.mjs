// اختبار بروتوكول الخادم: node server/test.mjs  (يشغّل خادمًا مؤقتًا على منفذ 3999)
import { spawn } from 'node:child_process';
import { WebSocket } from 'ws';
const PW = 'test-pass-12345';
const srv = spawn('node', ['server/index.mjs'], { env: { ...process.env, PORT: '3999', ADMIN_PASSWORD: PW, NO_LIVEKIT: '1' }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const client = () => new Promise((res) => { const ws = new WebSocket('ws://localhost:3999/ws'); ws.msgs = []; ws.on('message', (d) => ws.msgs.push(JSON.parse(d))); ws.on('open', () => res(ws)); });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const next = async (ws, t, ms = 1500) => { const e = Date.now() + ms; while (Date.now() < e) { const i = ws.msgs.findIndex((m) => m.t === t); if (i >= 0) return ws.msgs.splice(i, 1)[0]; await wait(20); } return null; };

const a = await client(); a.send(JSON.stringify({ t: 'admin_start', password: 'wrong', name: 'x' }));
ok((await next(a, 'err'))?.c === 'bad_password', 'كلمة سر خاطئة ترفض');
a.send(JSON.stringify({ t: 'admin_start', password: PW, name: 'المدير' }));
const w = await next(a, 'welcome'); ok(w && w.role === 'owner' && /^[A-Z2-9]{6}$/.test(w.code), 'الأدمن يبدأ جلسة بكود من 6 خانات: ' + w?.code);

const bad = await client(); bad.send(JSON.stringify({ t: 'join', code: 'ZZZZZZ', name: 'ضيف' }));
ok((await next(bad, 'err'))?.c === 'bad_code', 'كود غير صحيح يرفض');

const u1 = await client(); u1.send(JSON.stringify({ t: 'join', code: w.code.toLowerCase(), name: 'سعد', look: { g: 'm', c: 99 } }));
const w1 = await next(u1, 'welcome'); ok(w1 && w1.role === 'user' && w1.players.length === 2, 'مشارك يدخل بالكود (حتى بحروف صغيرة)');
ok(w1.players.every((p) => p.look.c <= 5), 'تنظيف بيانات الشخصية في الخادم');
ok((await next(a, 'joined'))?.p?.name === 'سعد', 'الأدمن يستلم دخول المشارك');

u1.send(JSON.stringify({ t: 'm', x: 3, z: 5, ry: 1, mv: 1, sit: 0 })); await wait(250);
let st = null; for (let i = 0; i < 6 && !st; i++) { const x = await next(a, 's', 400); if (x && x.p.some((r) => r[0] === w1.id && r[1] === 3 && r[2] === 5)) st = x; } ok(!!st, 'مزامنة الحركة');
u1.send(JSON.stringify({ t: 'm', x: 9999, z: 9999, ry: 0, mv: 0, sit: 0 })); await wait(250);
let far = null; for (let i = 0; i < 6 && !far; i++) { const x = await next(a, 's', 400); const row = x?.p.find((r) => r[0] === w1.id && r[1] !== 3); if (row) far = row; } ok(far && Math.hypot(far[1], far[2]) <= 52.01, 'تقييد الحدود في الخادم');

u1.send(JSON.stringify({ t: 'act', a: 'lock' })); ok((await next(u1, 'err'))?.c === 'forbidden', 'المشارك لا يقفل الغرفة');
u1.send(JSON.stringify({ t: 'act', a: 'kick', id: w.id })); ok((await next(u1, 'err'))?.c === 'forbidden', 'المشارك لا يطرد الأدمن');
a.send(JSON.stringify({ t: 'act', a: 'promote', id: w1.id })); ok((await next(u1, 'role'))?.role === 'mod', 'الأدمن يرقّي مشرفًا');
u1.send(JSON.stringify({ t: 'act', a: 'end' })); ok((await next(u1, 'err'))?.c === 'forbidden', 'المشرف لا ينهي الجلسة');
u1.send(JSON.stringify({ t: 'act', a: 'promote', id: w1.id })); ok((await next(u1, 'err'))?.c === 'forbidden', 'المشرف لا يرقّي نفسه');

a.send(JSON.stringify({ t: 'act', a: 'lock' })); await next(a, 'locked');
const late = await client(); late.send(JSON.stringify({ t: 'join', code: w.code, name: 'متأخر' })); ok((await next(late, 'err'))?.c === 'locked', 'الغرفة المقفلة ترفض الدخول');
a.send(JSON.stringify({ t: 'act', a: 'unlock' })); await next(a, 'locked');

// ===== صلاحيات الوسائط والمشرفين =====
const u2 = await client(); u2.send(JSON.stringify({ t: 'join', code: w.code, name: 'ريم' })); const w2u = await next(u2, 'welcome');
u2.send(JSON.stringify({ t: 'act', a: 'mute', id: w1.id })); ok((await next(u2, 'err'))?.c === 'forbidden', 'المشارك لا يكتم غيره');
u1.send(JSON.stringify({ t: 'act', a: 'mute', id: w2u.id })); ok((await next(u2, 'forced'))?.what === 'mic', 'المشرف يكتم مشاركًا');
u1.send(JSON.stringify({ t: 'act', a: 'mute', id: w.id })); ok((await next(u1, 'err'))?.c === 'forbidden', 'المشرف لا يكتم المدير');
u1.send(JSON.stringify({ t: 'act', a: 'stop', id: w2u.id, what: 'cam' })); ok((await next(u2, 'forced'))?.what === 'cam', 'المشرف يوقف كاميرا مشارك');
a.send(JSON.stringify({ t: 'act', a: 'perm', id: w2u.id, what: 'cam', v: false })); const pm = await next(u2, 'perm'); ok(pm && pm.perm.cam === false, 'المدير يقيّد كاميرا مشارك');
u1.send(JSON.stringify({ t: 'act', a: 'perm', id: w2u.id, what: 'cam', v: true })); ok((await next(u1, 'err'))?.c === 'forbidden', 'المشرف لا يتجاوز قيد المدير');
a.send(JSON.stringify({ t: 'act', a: 'perm', id: w2u.id, what: 'cam', v: true })); await next(u2, 'perm');
u1.send(JSON.stringify({ t: 'act', a: 'perm', id: w2u.id, what: 'mic', v: false })); const pm2 = await next(u2, 'perm'); ok(pm2 && pm2.perm.mic === false, 'المشرف يقيّد ميكروفون مشارك');
u1.send(JSON.stringify({ t: 'act', a: 'perm', id: w.id, what: 'mic', v: false })); ok((await next(u1, 'err'))?.c === 'forbidden', 'المشرف لا يقيّد المدير');
u1.send(JSON.stringify({ t: 'act', a: 'perm', id: 'all', what: 'mic', v: false })); ok((await next(u2, 'gperm'))?.gperm.mic === false, 'المشرف يقيّد الميكروفون للجميع');
a.send(JSON.stringify({ t: 'act', a: 'perm', id: 'all', what: 'mic', v: false })); a.send(JSON.stringify({ t: 'act', a: 'perm', id: 'all', what: 'mic', v: true })); await wait(200);
u2.send(JSON.stringify({ t: 'act', a: 'perm', id: 'all', what: 'mic', v: true })); ok((await next(u2, 'err'))?.c === 'forbidden', 'المشارك لا يغيّر الصلاحيات');

// ===== رسائل خاصة =====
a.msgs.length = 0; u2.msgs.length = 0;
u2.send(JSON.stringify({ t: 'dm', to: w1.id, text: 'سرّ' }));
ok((await next(u1, 'dm'))?.text === 'سرّ', 'الرسالة الخاصة تصل للمستلم'); ok(!!(await next(u2, 'dm')), 'والمرسل يستلم نسخته');
await wait(100); ok(!a.msgs.some((x) => x.t === 'dm'), 'المدير لا يرى الرسائل الخاصة');

// ===== العارض =====
u2.send(JSON.stringify({ t: 'proj', a: 'pdf', id: 'x' })); ok((await next(u2, 'err'))?.c === 'forbidden', 'المشارك لا يتحكم بالعارض');
a.send(JSON.stringify({ t: 'proj', a: 'pdf', id: 'nofile' })); ok((await next(a, 'err'))?.c === 'nofile', 'ملف غير موجود يُرفض');
u2.send(JSON.stringify({ t: 'proj', a: 'screen_self' })); ok((await next(u2, 'err'))?.c === 'forbidden', 'مشارك بلا صلاحية مشاركة لا يعرض شاشته');
const pdfBytes = Buffer.from(['%PDF-1.4', '1 0 obj<</Type/Catalog>>endobj', 'trailer<</Root 1 0 R>>', '%%EOF'].join(String.fromCharCode(10)));
const base = 'http://localhost:3999';
let hr = await fetch(base + '/api/upload?kind=pdf&name=a.pdf', { method: 'POST', body: pdfBytes }); ok(hr.status === 403, 'الرفع بلا توكن مرفوض');
hr = await fetch(base + '/api/upload?kind=pdf&name=a.pdf', { method: 'POST', body: pdfBytes, headers: { 'x-token': w1.token } }); ok(hr.status === 403, 'المشرف لا يرفع ملفات (المدير فقط)');
hr = await fetch(base + '/api/upload?kind=pdf&name=bad.pdf', { method: 'POST', body: Buffer.from('not a pdf'), headers: { 'x-token': w.token } }); ok((await hr.json()).error === 'not_pdf', 'ملف غير PDF يُرفض');
hr = await fetch(base + '/api/upload?kind=pdf&name=ok.pdf', { method: 'POST', body: pdfBytes, headers: { 'x-token': w.token } }); const up = await hr.json(); ok(up.id && up.size === pdfBytes.length, 'رفع PDF ينجح');
hr = await fetch(base + up.url, { headers: { 'x-token': w1.token } }); ok(hr.status === 200 && (await hr.text()).startsWith('%PDF-'), 'تقديم الملف لعضو في الغرفة');
hr = await fetch(base + up.url); ok(hr.status === 404, 'الملف غير متاح لمن خارج الغرفة');
for (const bad of ['http://example.com/a.pdf', 'https://127.0.0.1/a.pdf', 'https://localhost/a.pdf', 'https://192.168.1.1/a.pdf', 'not a url', 'https://drive.google.com/nothing']) {
  hr = await fetch(base + '/api/pdf-link', { method: 'POST', body: JSON.stringify({ url: bad }), headers: { 'x-token': w.token } }); ok((await hr.json()).error === 'bad_url', 'رابط مرفوض: ' + bad);
}
hr = await fetch(base + '/api/pdf-link', { method: 'POST', body: JSON.stringify({ url: 'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/view' }), headers: { 'x-token': w.token } });
const dj = await hr.json(); ok(['private', 'unreachable', 'not_pdf'].includes(dj.error), 'رابط Drive غير متاح يعطي خطأ مفهومًا: ' + dj.error);
a.send(JSON.stringify({ t: 'proj', a: 'pdf', id: up.id, name: 'ok.pdf', pages: 5 })); const pj = await next(u2, 'proj'); ok(pj?.proj.mode === 'pdf' && pj.proj.page === 1, 'المدير يفتح PDF ويصل للجميع');
a.send(JSON.stringify({ t: 'proj', a: 'page', page: 99 })); const pg = await next(u2, 'proj'); ok(pg?.proj.page === 5, 'تغيير الصفحة مقيَّد بعدد الصفحات');
u1.send(JSON.stringify({ t: 'proj', a: 'page', page: 2 })); ok((await next(u1, 'err'))?.c === 'forbidden', 'المشرف لا يغيّر الصفحة (المدير فقط)');
a.send(JSON.stringify({ t: 'act', a: 'perm', id: w2u.id, what: 'screen', v: true })); await next(u2, 'perm');
u2.send(JSON.stringify({ t: 'proj', a: 'screen_self' })); ok((await next(u2, 'err'))?.c === 'busy', 'مصدر واحد فقط على العارض');
a.send(JSON.stringify({ t: 'proj', a: 'stop' })); await next(u2, 'proj');
u2.send(JSON.stringify({ t: 'proj', a: 'screen_self' })); const sc = await next(u2, 'proj'); ok(sc?.proj.mode === 'screen' && sc.proj.screenBy === w2u.id, 'مشارك مخوّل يعرض شاشته بعد تفريغ العارض');
a.send(JSON.stringify({ t: 'proj', a: 'stop' })); await next(u2, 'proj');

// ===== الألعاب: السيجة =====
const G = (ws, g, a, extra = {}) => ws.send(JSON.stringify({ t: 'g', g, a, ...extra }));
G(u1, 'siga', 'join'); const sg1 = await next(u2, 'game'); ok(sg1?.s.seats[0] === w1.id, 'السيجة: لاعب يجلس في المقعد الأول');
G(u2, 'siga', 'join'); const sg2 = await next(a, 'game', 800); let sgs = null; for (let i = 0; i < 4 && !sgs; i++) { const x = await next(a, 'game', 300); if (x?.s.status === 'playing') sgs = x; } sgs = sgs || sg2;
ok(sgs?.s.status === 'playing' && sgs.s.turn === 1, 'السيجة: تبدأ عند جلوس لاعبين');
G(a, 'siga', 'join'); ok((await next(a, 'err'))?.c === 'seats_full', 'السيجة: لا مقعد ثالث');
G(u2, 'siga', 'move', { from: 14, to: 12 }); ok((await next(u2, 'err'))?.c === 'not_your_turn', 'السيجة: ليس دور الثاني');
G(u1, 'siga', 'move', { from: 0, to: 24 }); ok((await next(u1, 'err'))?.c === 'bad_move', 'السيجة: حركة غير نظامية ترفض');
G(u1, 'siga', 'move', { from: 11, to: 12 }); let mv1 = null; for (let i = 0; i < 6 && !mv1; i++) { const x = await next(u2, 'game', 400); if (x?.s.last && x.s.last[0] === 11) mv1 = x; } ok(mv1 && mv1.s.turn === 2 && mv1.s.board[12] === 1 && mv1.s.board[11] === 0, 'السيجة: حركة صحيحة تنتقل والدور للثاني');
// الأكل إجباري: الثاني يجب أن يأكل (من 13 يقفز فوق 12 إلى 11)
G(u2, 'siga', 'move', { from: 14, to: 13 }); ok((await next(u2, 'err'))?.c === 'bad_move', 'السيجة: الأكل إجباري');
G(u2, 'siga', 'move', { from: 13, to: 11 }); let cap = null; for (let i = 0; i < 6 && !cap; i++) { const x = await next(u1, 'game', 400); if (x?.s.last && x.s.last[2] === 12) cap = x; } ok(cap && cap.s.board[12] === 0 && cap.s.board[11] === 2, 'السيجة: الأكل بالقفز يزيل الحجر');

// ===== الغميضة =====
G(u1, 'hs', 'join'); G(u2, 'hs', 'join'); await wait(200);
G(u2, 'hs', 'start'); let hsS = null; for (let i = 0; i < 6 && !hsS; i++) { const x = await next(a, 'game', 400); if (x?.g === 'hs' && x.s.phase === 'counting') hsS = x; } ok(hsS && [w1.id, w2u.id].includes(hsS.s.seeker), 'الغميضة: تبدأ بباحث عشوائي من المنضمّين');
const seekerWs = hsS.s.seeker === w1.id ? u1 : u2, hiderId = hsS.s.seeker === w1.id ? w2u.id : w1.id, hiderWs = seekerWs === u1 ? u2 : u1;
seekerWs.send(JSON.stringify({ t: 'm', x: 5, z: 5, ry: 0, mv: 1, sit: 0 })); await wait(250);
hiderWs.send(JSON.stringify({ t: 'm', x: -20, z: -20, ry: 0, mv: 1, sit: 0 })); await wait(250);
G(seekerWs, 'hs', 'tag'); ok((await next(seekerWs, 'err'))?.c === 'forbidden', 'الغميضة: لا اكتشاف أثناء العدّ');
console.log('  (انتظار انتهاء العدّ 15ث…)'); await wait(15500);
G(seekerWs, 'hs', 'tag'); ok((await next(seekerWs, 'err'))?.c === 'nobody_near', 'الغميضة: لا أحد قريب = لا اكتشاف');
hiderWs.send(JSON.stringify({ t: 'm', x: 6, z: 6, ry: 0, mv: 0, sit: 0 })); seekerWs.send(JSON.stringify({ t: 'm', x: 6, z: 8, ry: 0, mv: 0, sit: 0 })); await wait(300);
G(seekerWs, 'hs', 'tag'); let hsEnd = null; for (let i = 0; i < 8 && !hsEnd; i++) { const x = await next(a, 'game', 400); if (x?.g === 'hs' && x.s.phase === 'over') hsEnd = x; } ok(hsEnd?.s.result.seekerWins === true && hsEnd.s.found.includes(hiderId), 'الغميضة: الباحث يكتشف المختبئ القريب ويفوز');
G(hiderWs, 'hs', 'leave'); G(seekerWs, 'hs', 'leave'); await wait(200);
// ===== سباق الهجن =====
G(u2, 'race', 'start'); ok((await next(u2, 'err'))?.c === 'forbidden', 'السباق: لا بدء لمن لم ينضم');
G(u1, 'race', 'join'); G(u2, 'race', 'join'); await wait(250);
G(u1, 'race', 'tap', { side: 'l' }); await wait(150); ok(a.msgs.filter((x) => x.t === 'game' && x.g === 'race').every((x) => x.s.phase !== 'racing'), 'السباق: لا ضربات قبل البدء');
G(u1, 'race', 'start'); let rc = null; for (let i = 0; i < 6 && !rc; i++) { const x = await next(a, 'game', 400); if (x?.g === 'race' && x.s.phase === 'countdown') rc = x; } ok(rc && rc.s.joined.length === 2, 'السباق: عدّ تنازلي بسباقين');
u1.send(JSON.stringify({ t: 'm', x: 1, z: 1, ry: 0, mv: 1, sit: 0 })); await wait(300);
console.log('  (انتظار العدّ التنازلي 4ث…)'); await wait(4300);
const ts = (ws, side) => ws.send(JSON.stringify({ t: 'g', g: 'race', a: 'tap', side }));
// تكرار نفس الجهة بعد التناوب يحسب ربع خطوة فقط، والضغط السريع جدًا يُتجاهل
ts(u2, 'l'); await wait(100); ts(u2, 'l'); ts(u2, 'l'); await wait(120);
await wait(250); const rs = a.msgs.filter((x) => x.t === 'game' && x.g === 'race' && x.s.phase === 'racing'); const snapR = rs[rs.length - 1]; a.msgs.length = 0;
ok(snapR && snapR.s.progress[w2u.id] > 0 && snapR.s.progress[w2u.id] < 1.6, 'السباق: التكرار من جهة واحدة بطيء والضغط المفرط يُهمل (' + snapR?.s.progress[w2u.id] + ')');
const runner = async (ws, gap) => { for (let i = 0; i < 130; i++) { ts(ws, i % 2 ? 'l' : 'r'); await wait(gap); } };
await Promise.all([runner(u1, 78), runner(u2, 92)]);
await wait(600); const raceOver = a.msgs.filter((x) => x.t === 'game' && x.g === 'race' && x.s.phase === 'over').pop(); a.msgs.length = 0;
ok(raceOver && raceOver.s.finished.length === 2 && raceOver.s.finished[0].id === w1.id && raceOver.s.finished[0].t < raceOver.s.finished[1].t, 'السباق: الأسرع يفوز والترتيب صحيح');
G(u1, 'race', 'leave'); G(u2, 'race', 'leave'); await wait(300);

// إعادة الاتصال
u1.close(); await wait(300);
const r = await client(); r.send(JSON.stringify({ t: 'resume', token: w1.token })); const rw = await next(r, 'welcome'); ok(rw && rw.id === w1.id && rw.role === 'mod', 'إعادة الاتصال بنفس الهوية والدور');

// حد 20
const crowd = []; for (let i = 0; i < 17; i++) { const c = await client(); c.send(JSON.stringify({ t: 'join', code: w.code, name: 'p' + i })); const ww = await next(c, 'welcome'); if (ww) crowd.push(c); }
ok(crowd.length === 17, 'قبول حتى 20 مشاركًا (الأدمن + مشرف + مشارك + 17 = 20)');
const over = await client(); over.send(JSON.stringify({ t: 'join', code: w.code, name: 'زائد' })); ok((await next(over, 'err'))?.c === 'full', 'رفض المشارك رقم 21');

a.send(JSON.stringify({ t: 'act', a: 'kick', id: crowd.length ? rw.id : '' })); const kk = await next(r, 'kicked'); ok(!!kk, 'طرد مشارك');

a.send(JSON.stringify({ t: 'act', a: 'end' })); const ended = await next(crowd[0], 'ended'); ok(!!ended, 'إنهاء الجلسة يبلّغ الجميع');
const dead = await client(); dead.send(JSON.stringify({ t: 'join', code: w.code, name: 'بعد النهاية' })); ok((await next(dead, 'err'))?.c === 'bad_code', 'الكود يبطل بعد انتهاء الجلسة');
const a2 = await client(); a2.send(JSON.stringify({ t: 'admin_start', password: PW, name: 'م' })); const w2 = await next(a2, 'welcome'); ok(w2 && w2.code !== w.code, 'الجلسة التالية بكود جديد: ' + w2?.code);

console.log(fails ? `\n${fails} فشل` : '\nكل الاختبارات نجحت'); srv.kill(); process.exit(fails ? 1 : 0);
