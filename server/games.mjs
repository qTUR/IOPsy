// الألعاب التفاعلية: «السيجة» (لاعبان والبقية يتفرجون) و«الغميضة» (جماعية). كل القواعد تُتحقَّق في الخادم.
import { initialBoard, legalMoves, applyMove, count } from '../shared/siga.js';

export const HS = { counting: 15, hunting: 120, tagRange: 3.2, minPlayers: 2, resultMs: 7000 };

export function newGames() {
  return {
    siga: { board: initialBoard(), seats: [null, null], names: ['', ''], turn: 1, status: 'waiting', winner: 0, cont: null, last: null, moves: 0, round: 0 },
    hs: { phase: 'idle', joined: [], seeker: null, found: [], t0: 0, round: 0, result: null, timer: null },
    race: { phase: 'idle', joined: [], progress: {}, last: {}, lastSide: {}, finished: [], t0: 0, round: 0, timer: null, tick: null },
  };
}
const hsPublic = (hs, now = Date.now()) => ({ phase: hs.phase, joined: hs.joined, seeker: hs.seeker, found: hs.found, t0: hs.t0, counting: HS.counting, hunting: HS.hunting, round: hs.round, result: hs.result, now });
export const RACE = { max: 10, countdown: 4, timeout: 60, goal: 100, minGap: 70, minPlayers: 2, resultMs: 9000 };
const racePublic = (r) => ({ phase: r.phase, joined: r.joined, progress: r.progress, finished: r.finished, t0: r.t0, countdown: RACE.countdown, goal: RACE.goal, round: r.round, now: Date.now() });
export const snapshot = (room) => ({ siga: room.games.siga, hs: hsPublic(room.games.hs), race: racePublic(room.games.race) });

export function stopTimers(room) { clearTimeout(room.games.hs.timer); const r = room.games.race; clearTimeout(r.timer); clearInterval(r.tick); }

/** مغادرة لاعب الغرفة أو انقطاعه نهائيًا */
export function playerGone(room, id, broadcast) {
  const g = room.games, s = g.siga;
  const seat = s.seats.indexOf(id);
  if (seat >= 0) { s.seats[seat] = null; s.names[seat] = ''; if (s.status === 'playing') { s.status = 'waiting'; s.board = initialBoard(); s.turn = 1; s.cont = null; s.last = null; s.moves = 0; } broadcast({ t: 'game', g: 'siga', s }); }
  const hs = g.hs;
  if (hs.joined.includes(id)) hsLeave(room, id, broadcast);
  if (g.race.joined.includes(id)) raceLeave(room, id, broadcast);
}

function sigaOver(s, winner) { s.status = 'over'; s.winner = winner; }

export function handleSiga(room, p, m, broadcast) {
  const s = room.games.siga;
  const seat = s.seats.indexOf(p.id);
  switch (m.a) {
    case 'join': {
      if (seat >= 0) return;
      const free = s.seats.indexOf(null); if (free < 0) return { err: 'seats_full' };
      s.seats[free] = p.id; s.names[free] = p.name;
      if (s.seats[0] && s.seats[1] && s.status !== 'playing') { s.status = 'playing'; s.board = initialBoard(); s.turn = 1; s.cont = null; s.last = null; s.moves = 0; s.winner = 0; s.round++; }
      return broadcast({ t: 'game', g: 'siga', s });
    }
    case 'leave': {
      if (seat < 0) return;
      s.seats[seat] = null; s.names[seat] = '';
      s.status = 'waiting'; s.board = initialBoard(); s.turn = 1; s.cont = null; s.last = null; s.moves = 0; s.winner = 0;
      return broadcast({ t: 'game', g: 'siga', s });
    }
    case 'move': {
      if (s.status !== 'playing' || seat < 0 || s.turn !== seat + 1) return { err: 'not_your_turn' };
      const from = Number(m.from), to = Number(m.to);
      const mv = legalMoves(s.board, s.turn, s.cont).find((x) => x.from === from && x.to === to);
      if (!mv) return { err: 'bad_move' };
      const r = applyMove(s.board, mv, s.turn);
      s.board = r.board; s.cont = r.cont; s.last = [from, to, mv.cap]; s.moves++;
      if (s.cont == null) {
        const opp = 3 - s.turn;
        if (count(s.board, opp) === 0 || legalMoves(s.board, opp).length === 0) sigaOver(s, s.turn);
        else if (s.moves >= 300) sigaOver(s, 0);
        else s.turn = opp;
      }
      return broadcast({ t: 'game', g: 'siga', s });
    }
    case 'again': { // إعادة اللعب بعد النهاية (أحد الجالسين)
      if (seat < 0 || s.status !== 'over') return;
      s.board = initialBoard(); s.turn = s.winner === 1 ? 2 : 1; s.cont = null; s.last = null; s.moves = 0; s.winner = 0; s.status = 'playing'; s.round++;
      return broadcast({ t: 'game', g: 'siga', s });
    }
  }
}

// ---------------- الغميضة ----------------
function hsPublicBroadcast(room, broadcast) { broadcast({ t: 'game', g: 'hs', s: hsPublic(room.games.hs) }); }
function hsFinish(room, broadcast, seekerWins) {
  const hs = room.games.hs; clearTimeout(hs.timer);
  hs.phase = 'over'; hs.result = { seekerWins, seeker: hs.seeker, hiders: hs.joined.filter((x) => x !== hs.seeker), found: [...hs.found] };
  hsPublicBroadcast(room, broadcast);
  hs.timer = setTimeout(() => { hs.phase = 'idle'; hs.seeker = null; hs.found = []; hs.result = null; hsPublicBroadcast(room, broadcast); }, HS.resultMs);
}
function hsLeave(room, id, broadcast) {
  const hs = room.games.hs;
  hs.joined = hs.joined.filter((x) => x !== id); hs.found = hs.found.filter((x) => x !== id);
  if ((hs.phase === 'counting' || hs.phase === 'hunting')) {
    if (id === hs.seeker || hs.joined.length < HS.minPlayers) { clearTimeout(hs.timer); hs.phase = 'idle'; hs.seeker = null; hs.found = []; hs.result = null; }
    else if (hs.joined.filter((x) => x !== hs.seeker).every((x) => hs.found.includes(x))) return hsFinish(room, broadcast, true);
  }
  hsPublicBroadcast(room, broadcast);
}

export function handleHs(room, p, m, broadcast) {
  const hs = room.games.hs; const joined = hs.joined.includes(p.id);
  const staff = p.role === 'owner' || p.role === 'mod';
  switch (m.a) {
    case 'join': if (!joined && hs.phase === 'idle') { hs.joined.push(p.id); hsPublicBroadcast(room, broadcast); } return;
    case 'leave': if (joined) hsLeave(room, p.id, broadcast); return;
    case 'start': {
      if (hs.phase !== 'idle') return { err: 'busy' };
      if (!(staff || joined)) return { err: 'forbidden' };
      const live = hs.joined.filter((id) => room.players.has(id));
      if (live.length < HS.minPlayers) return { err: 'need_players' };
      hs.joined = live; hs.seeker = live[Math.floor(Math.random() * live.length)]; hs.found = []; hs.phase = 'counting'; hs.t0 = Date.now(); hs.round++; hs.result = null;
      clearTimeout(hs.timer);
      hs.timer = setTimeout(() => {
        hs.phase = 'hunting'; hs.t0 = Date.now(); hsPublicBroadcast(room, broadcast);
        hs.timer = setTimeout(() => hsFinish(room, broadcast, false), HS.hunting * 1000);
      }, HS.counting * 1000);
      return hsPublicBroadcast(room, broadcast);
    }
    case 'tag': { // الباحث يكتشف أقرب مختبئ ضمن المدى
      if (hs.phase !== 'hunting' || p.id !== hs.seeker) return { err: 'forbidden' };
      let best = null, bd = HS.tagRange;
      for (const id of hs.joined) {
        if (id === hs.seeker || hs.found.includes(id)) continue;
        const q = room.players.get(id); if (!q) continue;
        const d = Math.hypot(q.x - p.x, q.z - p.z); if (d <= bd) { bd = d; best = id; }
      }
      if (!best) return { err: 'nobody_near' };
      hs.found.push(best);
      if (hs.joined.filter((x) => x !== hs.seeker).every((x) => hs.found.includes(x))) return hsFinish(room, broadcast, true);
      return hsPublicBroadcast(room, broadcast);
    }
  }
}

/** هل الحركة مقفولة؟ الباحث لا يتحرك أثناء العدّ */
export const movementLocked = (room, id) => {
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
}
