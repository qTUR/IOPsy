p = 'server/index.mjs'
s = open(p, encoding='utf8').read()

s = s.replace("import { handleUpload,", "import { newGames, snapshot as gamesSnapshot, handleSiga, handleHs, playerGone, stopTimers, movementLocked } from './games.mjs';\nimport { handleUpload,", 1)
s = s.replace("proj: { mode: 'idle', pdf: null, page: 1, screenBy: null, video: null } });\n\n/** هل", "proj: { mode: 'idle', pdf: null, page: 1, screenBy: null, video: null }, games: newGames() });\n\n/** هل", 1)
# welcome
s = s.replace("lk, now: Date.now() };", "lk, now: Date.now(), games: gamesSnapshot(room) };", 1)
# removal/end hooks
s = s.replace("function removePlayer(room, p, reason) {\n  room.players.delete(p.id); byToken.delete(p.token);",
              "function removePlayer(room, p, reason) {\n  room.players.delete(p.id); byToken.delete(p.token);\n  playerGone(room, p.id, (m) => toRoom(room, m));",1)
s = s.replace("rooms.delete(room.code); dropRoomFiles(room.code);", "stopTimers(room); rooms.delete(room.code); dropRoomFiles(room.code);", 1)
# movement lock for seeker
s = s.replace("        if (![m.x, m.z, m.ry].every(Number.isFinite)) return;", "        if (![m.x, m.z, m.ry].every(Number.isFinite)) return;\n        if (movementLocked(room, p.id)) return;", 1)
# message routing
s = s.replace("      case 'act': return handleAct(room, p, m);", """      case 'g': {
        const bc = (msg) => toRoom(room, msg);
        const r = m.g === 'siga' ? handleSiga(room, p, m, bc) : m.g === 'hs' ? handleHs(room, p, m, bc) : null;
        if (r && r.err) send(ws, { t: 'err', c: r.err });
        return;
      }
      case 'act': return handleAct(room, p, m);""", 1)
open(p, 'w', encoding='utf8').write(s)

# اختبارات
p = 'server/test.mjs'
s = open(p, encoding='utf8').read()
marker = "// إعادة الاتصال"
extra = '''// ===== الألعاب: السيجة =====
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
hiderWs.send(JSON.stringify({ t: 'm', x: 6, z: 6, ry: 0, mv: 0, sit: 0 })); await wait(250);
G(seekerWs, 'hs', 'tag'); let hsEnd = null; for (let i = 0; i < 8 && !hsEnd; i++) { const x = await next(a, 'game', 400); if (x?.g === 'hs' && x.s.phase === 'over') hsEnd = x; } ok(hsEnd?.s.result.seekerWins === true && hsEnd.s.found.includes(hiderId), 'الغميضة: الباحث يكتشف المختبئ القريب ويفوز');
G(hiderWs, 'hs', 'leave'); G(seekerWs, 'hs', 'leave'); await wait(200);
'''
if 'السيجة' not in s:
    s = s.replace(marker, extra + marker, 1)
open(p, 'w', encoding='utf8').write(s)
