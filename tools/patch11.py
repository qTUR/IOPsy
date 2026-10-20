p = 'server/test.mjs'
s = open(p, encoding='utf8').read()
marker = "// إعادة الاتصال"
extra = '''// ===== سباق الهجن =====
G(u1, 'race', 'start'); ok((await next(u1, 'err'))?.c === 'forbidden', 'السباق: لا بدء لمن لم ينضم');
G(u1, 'race', 'join'); G(u2, 'race', 'join'); await wait(250);
G(u1, 'race', 'tap', { side: 'l' }); await wait(150); ok(a.msgs.filter((x) => x.t === 'game' && x.g === 'race').every((x) => x.s.phase !== 'racing'), 'السباق: لا ضربات قبل البدء');
G(u1, 'race', 'start'); let rc = null; for (let i = 0; i < 6 && !rc; i++) { const x = await next(a, 'game', 400); if (x?.g === 'race' && x.s.phase === 'countdown') rc = x; } ok(rc && rc.s.joined.length === 2, 'السباق: عدّ تنازلي بسباقين');
u1.send(JSON.stringify({ t: 'm', x: 1, z: 1, ry: 0, mv: 1, sit: 0 })); await wait(300);
console.log('  (انتظار العدّ التنازلي 4ث…)'); await wait(4300);
const ts = (ws, side) => ws.send(JSON.stringify({ t: 'g', g: 'race', a: 'tap', side }));
// تكرار نفس الجهة بعد التناوب يحسب ربع خطوة فقط، والضغط السريع جدًا يُتجاهل
ts(u2, 'l'); await wait(100); ts(u2, 'l'); ts(u2, 'l'); await wait(120);
let snapR = null; for (let i = 0; i < 5; i++) { const x = await next(a, 'game', 300); if (x?.g === 'race' && x.s.phase === 'racing') snapR = x; }
ok(snapR && snapR.s.progress[w2u.id] > 0 && snapR.s.progress[w2u.id] < 1.6, 'السباق: التكرار من جهة واحدة بطيء والضغط المفرط يُهمل (' + snapR?.s.progress[w2u.id] + ')');
const runner = async (ws, gap) => { for (let i = 0; i < 130; i++) { ts(ws, i % 2 ? 'l' : 'r'); await wait(gap); } };
await Promise.all([runner(u1, 78), runner(u2, 92)]);
let over = null; for (let i = 0; i < 20 && !over; i++) { const x = await next(a, 'game', 500); if (x?.g === 'race' && x.s.phase === 'over') over = x; }
ok(over && over.s.finished.length === 2 && over.s.finished[0].id === w1.id && over.s.finished[0].t < over.s.finished[1].t, 'السباق: الأسرع يفوز والترتيب صحيح');
G(u1, 'race', 'leave'); G(u2, 'race', 'leave'); await wait(300);

'''
if 'سباق الهجن' not in s:
    s = s.replace(marker, extra + marker, 1)
open(p, 'w', encoding='utf8').write(s)
