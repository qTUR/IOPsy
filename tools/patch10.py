p = 'server/games.mjs'
s = open(p, encoding='utf8').read()

# ---- حالة السباق ----
s = s.replace("    hs: { phase: 'idle', joined: [], seeker: null, found: [], t0: 0, round: 0, result: null, timer: null },\n  };",
"""    hs: { phase: 'idle', joined: [], seeker: null, found: [], t0: 0, round: 0, result: null, timer: null },
    race: { phase: 'idle', joined: [], progress: {}, last: {}, lastSide: {}, finished: [], t0: 0, round: 0, timer: null, tick: null },
  };""")
s = s.replace("export const snapshot = (room) => ({ siga: room.games.siga, hs: hsPublic(room.games.hs) });",
"""export const RACE = { max: 10, countdown: 4, timeout: 60, goal: 100, minGap: 70, minPlayers: 2, resultMs: 9000 };
const racePublic = (r) => ({ phase: r.phase, joined: r.joined, progress: r.progress, finished: r.finished, t0: r.t0, countdown: RACE.countdown, goal: RACE.goal, round: r.round, now: Date.now() });
export const snapshot = (room) => ({ siga: room.games.siga, hs: hsPublic(room.games.hs), race: racePublic(room.games.race) });""")
s = s.replace("export function stopTimers(room) { clearTimeout(room.games.hs.timer); }", "export function stopTimers(room) { clearTimeout(room.games.hs.timer); const r = room.games.race; clearTimeout(r.timer); clearInterval(r.tick); }")
s = s.replace("  if (hs.joined.includes(id)) hsLeave(room, id, broadcast);\n}", "  if (hs.joined.includes(id)) hsLeave(room, id, broadcast);\n  if (g.race.joined.includes(id)) raceLeave(room, id, broadcast);\n}")
s = s.replace("export const movementLocked = (room, id) => { const hs = room.games.hs; return hs.phase === 'counting' && hs.seeker === id; };",
"""export const movementLocked = (room, id) => {
  const hs = room.games.hs, r = room.games.race;
  return (hs.phase === 'counting' && hs.seeker === id) || ((r.phase === 'countdown' || r.phase === 'racing') && r.joined.includes(id));
};

// ---------------- سباق الهجن ----------------
function raceBroadcast(room, broadcast) { broadcast({ t: 'game', g: 'race', s: racePublic(room.games.race) }); }
function raceReset(room, broadcast) { const r = room.games.race; clearTimeout(r.timer); clearInterval(r.tick); r.phase = 'idle'; r.progress = {}; r.last = {}; r.lastSide = {}; r.finished = []; raceBroadcast(room, broadcast); }
function raceFinish(room, broadcast) {
  const r = room.games.race; clearTimeout(r.timer); clearInterval(r.tick);
  // غير المنتهين يُرتَّبون بحسب تقدمهم
  const rest = r.joined.filter((id) => !r.finished.some((f) => f.id === id)).sort((a, b) => (r.progress[b] || 0) - (r.progress[a] || 0)).map((id) => ({ id, t: null }));
  r.finished = [...r.finished, ...rest]; r.phase = 'over'; raceBroadcast(room, broadcast);
  r.timer = setTimeout(() => raceReset(room, broadcast), RACE.resultMs);
}
function raceLeave(room, id, broadcast) {
  const r = room.games.race; const was = r.joined.includes(id);
  r.joined = r.joined.filter((x) => x !== id); delete r.progress[id]; r.finished = r.finished.filter((f) => f.id !== id);
  if (!was) return;
  if ((r.phase === 'countdown' || r.phase === 'racing') && r.joined.length < RACE.minPlayers) return raceReset(room, broadcast);
  if (r.phase === 'racing' && r.joined.every((x) => r.finished.some((f) => f.id === x))) return raceFinish(room, broadcast);
  raceBroadcast(room, broadcast);
}

export function handleRace(room, p, m, broadcast) {
  const r = room.games.race; const joined = r.joined.includes(p.id);
  const staff = p.role === 'owner' || p.role === 'mod';
  switch (m.a) {
    case 'join': {
      if (joined || r.phase !== 'idle') return;
      if (r.joined.length >= RACE.max) return { err: 'race_full' };
      r.joined.push(p.id); r.progress[p.id] = 0; return raceBroadcast(room, broadcast);
    }
    case 'leave': if (joined) raceLeave(room, p.id, broadcast); return;
    case 'start': {
      if (r.phase !== 'idle') return { err: 'busy' };
      if (!(staff || joined)) return { err: 'forbidden' };
      r.joined = r.joined.filter((id) => room.players.has(id));
      if (r.joined.length < RACE.minPlayers) return { err: 'need_players' };
      r.progress = Object.fromEntries(r.joined.map((id) => [id, 0])); r.last = {}; r.lastSide = {}; r.finished = [];
      r.phase = 'countdown'; r.t0 = Date.now(); r.round++;
      clearTimeout(r.timer); clearInterval(r.tick);
      r.timer = setTimeout(() => {
        r.phase = 'racing'; r.t0 = Date.now(); raceBroadcast(room, broadcast);
        r.tick = setInterval(() => raceBroadcast(room, broadcast), 100);
        r.timer = setTimeout(() => raceFinish(room, broadcast), RACE.timeout * 1000);
      }, RACE.countdown * 1000);
      return raceBroadcast(room, broadcast);
    }
    case 'tap': { // ضربة ركض: التناوب يمين/يسار يعطي كامل الخطوة، والتكرار من جهة واحدة ربعها
      if (r.phase !== 'racing' || !joined) return;
      if (r.finished.some((f) => f.id === p.id)) return;
      const now = Date.now(); if (now - (r.last[p.id] || 0) < RACE.minGap) return; r.last[p.id] = now;
      const side = m.side === 'r' ? 'r' : 'l';
      const step = r.lastSide[p.id] && r.lastSide[p.id] !== side ? 1.0 : 0.25; r.lastSide[p.id] = side;
      r.progress[p.id] = Math.min(RACE.goal, (r.progress[p.id] || 0) + step);
      if (r.progress[p.id] >= RACE.goal) {
        r.finished.push({ id: p.id, t: now - r.t0 });
        if (r.joined.every((x) => r.finished.some((f) => f.id === x))) return raceFinish(room, broadcast);
        raceBroadcast(room, broadcast);
      }
      return;
    }
  }
}""")
open(p, 'w', encoding='utf8').write(s)

p = 'server/index.mjs'
s = open(p, encoding='utf8').read()
s = s.replace("import { newGames, snapshot as gamesSnapshot, handleSiga, handleHs,", "import { newGames, snapshot as gamesSnapshot, handleSiga, handleHs, handleRace,")
s = s.replace("m.g === 'hs' ? handleHs(room, p, m, bc) : null;", "m.g === 'hs' ? handleHs(room, p, m, bc) : m.g === 'race' ? handleRace(room, p, m, bc) : null;")
open(p, 'w', encoding='utf8').write(s)
