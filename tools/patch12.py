def rw(p, fn):
    s = open(p, encoding='utf8').read()
    open(p, 'w', encoding='utf8').write(fn(s))

# ---------- i18n ----------
def i18n(s):
    if 'race_name' in s: return s
    ar = """  race_name: 'سباق الهجن', race_desc: 'رياضة تراثية سعودية: اركض بهجينك! اضغط يمين/يسار بالتناوب بأسرع ما تقدر (التكرار من جهة واحدة بطيء). حتى 10 متسابقين والبقية يشجعون.',
  race_join: 'انضم للسباق', race_leave: 'اخرج من السباق', race_start: 'ابدأ السباق', race_players: 'المتسابقون ({n}/10)', race_need: 'تحتاج متسابقين اثنين على الأقل',
  race_go: 'انطلق!', race_ready: 'استعد…', race_tap_hint: 'بالتناوب: يسار ← يمين ← يسار… (A / D أو ← / → أو مسافة)', race_left: 'يسار', race_right: 'يمين',
  race_results: 'نتيجة السباق', race_time: '{s}ث', race_dnf: 'لم يكمل', race_you_won: '🏆 فزت بالسباق! مبروك', race_running: 'السباق جارٍ — شجّع المتسابقين', race_goto: 'اذهب للمضمار', race_cam: 'كاميرا السباق', race_finish_line: 'خط النهاية', race_start_line: 'خط البداية', race_rank: 'المركز {n}',
  err_race_full: 'السباق ممتلئ (10 متسابقين)',
"""
    en = """  race_name: 'Camel Race', race_desc: 'A heritage Saudi sport: race your camel! Tap left/right alternately as fast as you can (repeating one side is slow). Up to 10 racers, everyone else cheers.',
  race_join: 'Join the race', race_leave: 'Leave the race', race_start: 'Start race', race_players: 'Racers ({n}/10)', race_need: 'At least two racers are needed',
  race_go: 'Go!', race_ready: 'Get ready…', race_tap_hint: 'Alternate: left → right → left… (A / D, ← / →, or Space)', race_left: 'Left', race_right: 'Right',
  race_results: 'Race results', race_time: '{s}s', race_dnf: 'Did not finish', race_you_won: '🏆 You won the race! Congratulations', race_running: 'Race in progress — cheer the racers', race_goto: 'Go to the track', race_cam: 'Race camera', race_finish_line: 'Finish', race_start_line: 'Start', race_rank: 'Place {n}',
  err_race_full: 'The race is full (10 racers)',
"""
    s = s.replace("  err_seats_full: 'المقعدان ممتلئان',", ar + "  err_seats_full: 'المقعدان ممتلئان',", 1)
    s = s.replace("  err_seats_full: 'Both seats are taken',", en + "  err_seats_full: 'Both seats are taken',", 1)
    s = s.replace("seats_full: 'err_seats_full',", "seats_full: 'err_seats_full', race_full: 'err_race_full',", 1)
    return s
rw('src/i18n.ts', i18n)

# ---------- store ----------
def store(s):
    if 'RaceState' in s: return s
    s = s.replace("export const IDLE_HS: HsState", """export interface RaceState { phase: 'idle' | 'countdown' | 'racing' | 'over'; joined: string[]; progress: Record<string, number>; finished: { id: string; t: number | null }[]; t0: number; countdown: number; goal: number; round: number; now: number }
export const IDLE_RACE: RaceState = { phase: 'idle', joined: [], progress: {}, finished: [], t0: 0, countdown: 4, goal: 100, round: 0, now: 0 };
export const IDLE_HS: HsState""", 1)
    s = s.replace("games: { siga: SigaState | null; hs: HsState };", "games: { siga: SigaState | null; hs: HsState; race: RaceState };")
    s = s.replace("games: { siga: null, hs: IDLE_HS },", "games: { siga: null, hs: IDLE_HS, race: IDLE_RACE },")
    return s
rw('src/store.ts', store)

# ---------- net ----------
def net(s):
    s = s.replace("import { useGame, live, IDLE_PROJ, IDLE_HS,", "import { useGame, live, IDLE_PROJ, IDLE_HS, IDLE_RACE,")
    s = s.replace("useGame.setState({ games: { siga: m.games?.siga ?? null, hs: m.games?.hs ?? IDLE_HS } });", "useGame.setState({ games: { siga: m.games?.siga ?? null, hs: m.games?.hs ?? IDLE_HS, race: m.games?.race ?? IDLE_RACE } });")
    s = s.replace("      if (m.g === 'hs') setSkew(m.s.now);", "      if (m.g === 'hs' || m.g === 'race') setSkew(m.s.now);")
    s = s.replace("useGame.setState({ games: { siga: null, hs: IDLE_HS } });\n  sessionStorage", "useGame.setState({ games: { siga: null, hs: IDLE_HS, race: IDLE_RACE } });\n  sessionStorage")
    s = s.replace("export const gameAct = (g: 'siga' | 'hs',", "export const gameAct = (g: 'siga' | 'hs' | 'race',")
    return s
rw('src/net.ts', net)

# ---------- uiStore ----------
def ui(s):
    if 'raceCam' in s: return s
    s = s.replace("  hideTiles: boolean;\n  setPanel", "  hideTiles: boolean;\n  raceCam: boolean;\n  setRaceCam: (v: boolean) => void;\n  setPanel")
    s = s.replace("bigTile: null, hideTiles: false,", "bigTile: null, hideTiles: false, raceCam: false, setRaceCam: (raceCam) => set({ raceCam }),")
    return s
rw('src/ui/uiStore.ts', ui)

# ---------- palms: ازالة ما يتعارض مع المضمار ----------
def palms(s):
    s = s.replace("[12, 26], ", "").replace(", [-8, 28]", "")
    s = s.replace("[-14, 24, 1]", "[-32, 34, 1]")
    return s
rw('src/scene/Palms.tsx', palms)

# ---------- World: المضمار ----------
def world(s):
    if 'RaceTrack' in s: return s
    s = s.replace("import SigaBoard from './SigaBoard';", "import SigaBoard from './SigaBoard';\nimport RaceTrack from './RaceTrack';")
    s = s.replace("      {phase === 'play' && <SigaBoard />}", "      {phase === 'play' && <SigaBoard />}\n      <RaceTrack />")
    return s
rw('src/scene/World.tsx', world)

# ---------- RemotePlayers: إخفاء المتسابقين ----------
def rp(s):
    s = s.replace("    if (hide !== hidden) setHidden(hide);", "    const rc = gs.games.race, racing = rc.phase !== 'idle' && rc.joined.includes(p.id);\n    o.visible = !racing;\n    if ((hide || racing) !== hidden) setHidden(hide || racing);")
    return s
rw('src/scene/RemotePlayers.tsx', rp)

# ---------- Player: قفل + كاميرا السباق ----------
def pl(s):
    if 'raceRole' in s: return s
    s = s.replace("import { bus, sendEmote, sendMove } from '../net';", "import { bus, sendEmote, sendMove } from '../net';\nimport { useUI } from '../ui/uiStore';")
    s = s.replace("    if (seekerLock) { ix = 0; iz = 0; }", "    const rc = gs.games.race, raceRole = rc.phase !== 'idle' && rc.joined.includes(gs.myId), raceView = rc.phase !== 'idle' && (raceRole || useUI.getState().raceCam);\n    if (seekerLock || (raceRole && (rc.phase === 'countdown' || rc.phase === 'racing'))) { ix = 0; iz = 0; }\n    if (group.current) group.current.visible = !raceRole;")
    s = s.replace("    // كاميرا ثالثة\n", """    if (raceView) { // كاميرا السباق: لقطة واسعة تُظهر كل المسارات
      const asp = (camera as THREE.PerspectiveCamera).aspect || 1.7, hf = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov) / 2) * asp);
      const dd = Math.max(15, 27 / Math.tan(hf / 2));
      camera.position.lerp(new THREE.Vector3(0, 6 + dd * 0.42, 37 - dd * 0.92), 1 - Math.exp(-dt * 4)); camera.lookAt(0, 0.6, 37.5); return;
    }
    // كاميرا ثالثة
""")
    return s
rw('src/scene/Player.tsx', pl)

# ---------- Tag للاعب نفسه: إخفاء عند السباق ----------
def pl2(s):
    s = s.replace("      <Tag id={myId} name={name || 'زائر'} role={role} />", "      <Tag id={myId} name={name || 'زائر'} role={role} />")
    return s
rw('src/scene/Player.tsx', pl2)
