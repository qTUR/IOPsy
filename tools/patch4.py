import re

# ---------- i18n ----------
p = 'src/i18n.ts'
s = open(p, encoding='utf8').read()
ar_add = """  // ألعاب
  tb_games: 'الألعاب', games_title: 'ألعاب المخيم', siga_name: 'السيجة', siga_desc: 'لعبة شعبية قديمة تُرسم على الرمل: لاعبان، 12 حجرًا لكل واحد، والأكل بالقفز.', hs_name: 'الغميضة',
  hs_desc: 'الباحث يعدّ ثم يبحث، والبقية يختبئون خلف النخيل والكثبان. اقترب منهم لتكتشفهم!',
  sit_white: 'اجلس (الأبيض)', sit_black: 'اجلس (الأسود)', stand_up: 'قم من اللعب', siga_white: 'الأبيض', siga_black: 'الأسود', siga_wait: 'بانتظار لاعب ثانٍ…', siga_your_turn: 'دورك!', siga_their_turn: 'دور {n}', siga_continue: 'كمّل الأكل بنفس الحجر!',
  siga_won: '🏆 فاز {n}', siga_draw: 'تعادل', siga_again: 'العب مرة أخرى', siga_spectating: 'أنت تتفرّج — شجّع اللاعبين بالتحيّات 👏', siga_rules: 'حرّك حجرًا خطوة واحدة (أعلى/أسفل/يمين/يسار). إن أمكنك الأكل بالقفز فوق حجر الخصم فهو إجباري.',
  hs_join: 'انضم للعبة', hs_leave: 'اخرج من اللعبة', hs_start: 'ابدأ الجولة', hs_players: 'المنضمّون ({n})', hs_need: 'تحتاج لاعبين اثنين على الأقل',
  hs_you_seeker: 'أنت الباحث! أغمض عينيك وعدّ…', hs_count_seeker: 'يختبئ الآخرون الآن… {s}', hs_count_hider: 'اختبئ بسرعة! {n} يعدّ… {s}', hs_hunting_seeker: 'ابحث! اقترب من المختبئ واضغط F أو زر «اكتشف»', hs_hunting_hider: 'اختبئ! لا تتحرك قرب {n}', hs_time_left: 'الوقت {s}ث', hs_found_count: 'مكتشَفون {a} من {b}',
  hs_tag: 'اكتشف! (F)', hs_found_me: 'اكتشفك الباحث — تفرّج على الباقين', hs_seeker_won: '🔍 فاز الباحث {n}! اكتشف الجميع', hs_hiders_won: '🏆 فاز المختبئون! نجوا من {n}', hs_hot3: '🔥 حار جدًا!', hs_hot2: '♨ دافئ', hs_hot1: '🌬 بارد', hs_hot0: '❄ بعيد جدًا', hs_in_game: 'في اللعبة',
  err_seats_full: 'المقعدان ممتلئان', err_not_your_turn: 'ليس دورك', err_bad_move: 'حركة غير مسموحة (تذكّر: الأكل إجباري)', err_need_players: 'تحتاج لاعبين اثنين على الأقل', err_nobody_near: 'لا أحد قريب منك', err_busy: 'العارض مشغول بمصدر آخر',
"""
en_add = """  tb_games: 'Games', games_title: 'Camp games', siga_name: 'Siga', siga_desc: 'A classic Gulf game drawn in the sand: two players, 12 stones each, capture by jumping.', hs_name: 'Hide & Seek',
  hs_desc: 'The seeker counts, then hunts while everyone hides behind palms and dunes. Get close to find them!',
  sit_white: 'Sit (White)', sit_black: 'Sit (Black)', stand_up: 'Leave the game', siga_white: 'White', siga_black: 'Black', siga_wait: 'Waiting for a second player…', siga_your_turn: 'Your turn!', siga_their_turn: '{n}’s turn', siga_continue: 'Keep capturing with the same stone!',
  siga_won: '🏆 {n} wins', siga_draw: 'Draw', siga_again: 'Play again', siga_spectating: 'You are watching — cheer with greetings 👏', siga_rules: 'Move a stone one step (up/down/left/right). If you can jump over an enemy stone, you must.',
  hs_join: 'Join the game', hs_leave: 'Leave the game', hs_start: 'Start round', hs_players: 'Players ({n})', hs_need: 'At least two players needed',
  hs_you_seeker: 'You are the seeker! Close your eyes and count…', hs_count_seeker: 'Others are hiding now… {s}', hs_count_hider: 'Hide quickly! {n} is counting… {s}', hs_hunting_seeker: 'Hunt! Get close to a hider and press F or “Tag”', hs_hunting_hider: 'Hide! Stay away from {n}', hs_time_left: '{s}s left', hs_found_count: 'Found {a} of {b}',
  hs_tag: 'Tag! (F)', hs_found_me: 'You were found — watch the others', hs_seeker_won: '🔍 Seeker {n} wins! Everyone was found', hs_hiders_won: '🏆 Hiders win! They escaped {n}', hs_hot3: '🔥 Very hot!', hs_hot2: '♨ Warm', hs_hot1: '🌬 Cold', hs_hot0: '❄ Far away', hs_in_game: 'in game',
  err_seats_full: 'Both seats are taken', err_not_your_turn: 'Not your turn', err_bad_move: 'Illegal move (captures are mandatory)', err_need_players: 'At least two players needed', err_nobody_near: 'Nobody is close to you', err_busy: 'The projector is busy',
"""
if 'tb_games' not in s:
    # العربية: قبل نهاية AR
    s = s.replace("} as const;\nexport type Key", ar_add + "} as const;\nexport type Key", 1)
    s = s.replace("  hint_move: 'move', hint_run: 'run', hint_drag: 'drag to rotate', hint_emote: 'greetings', hint_sit: 'sit',\n};", "  hint_move: 'move', hint_run: 'run', hint_drag: 'drag to rotate', hint_emote: 'greetings', hint_sit: 'sit',\n" + en_add + "};", 1)
    s = s.replace("forbidden: 'err_forbidden', busy: 'err_busy', nofile: 'err_nofile', bad_url: 'err_bad_url',", "forbidden: 'err_forbidden', busy: 'err_busy', nofile: 'err_nofile', bad_url: 'err_bad_url',\n  seats_full: 'err_seats_full', not_your_turn: 'err_not_your_turn', bad_move: 'err_bad_move', need_players: 'err_need_players', nobody_near: 'err_nobody_near',", 1)
open(p, 'w', encoding='utf8').write(s)

# ---------- store ----------
p = 'src/store.ts'
s = open(p, encoding='utf8').read()
if 'SigaState' not in s:
    s = s.replace("export type Lang = 'ar' | 'en';", """export type Lang = 'ar' | 'en';
export interface SigaState { board: number[]; seats: (string | null)[]; names: string[]; turn: number; status: 'waiting' | 'playing' | 'over'; winner: number; cont: number | null; last: [number, number, number | null] | null; moves: number; round: number }
export interface HsState { phase: 'idle' | 'counting' | 'hunting' | 'over'; joined: string[]; seeker: string | null; found: string[]; t0: number; counting: number; hunting: number; round: number; now: number; result: { seekerWins: boolean; seeker: string; hiders: string[]; found: string[] } | null }
export const IDLE_HS: HsState = { phase: 'idle', joined: [], seeker: null, found: [], t0: 0, counting: 15, hunting: 120, round: 0, now: 0, result: null };""", 1)
    s = s.replace("  toast: { text: string; until: number; kind: 'info' | 'warn' } | null;\n  setMode", "  toast: { text: string; until: number; kind: 'info' | 'warn' } | null;\n  games: { siga: SigaState | null; hs: HsState };\n  setMode", 1)
    s = s.replace("  toast: null,\n  setMode", "  toast: null,\n  games: { siga: null, hs: IDLE_HS },\n  setMode", 1)
open(p, 'w', encoding='utf8').write(s)

# ---------- net ----------
p = 'src/net.ts'
s = open(p, encoding='utf8').read()
if "case 'game'" not in s:
    s = s.replace("import { useGame, live, IDLE_PROJ,", "import { useGame, live, IDLE_PROJ, IDLE_HS,", 1)
    s = s.replace("  setSkew(m.now);\n  if (m.lk?.token)", "  setSkew(m.now);\n  useGame.setState({ games: { siga: m.games?.siga ?? null, hs: m.games?.hs ?? IDLE_HS } });\n  if (m.lk?.token)", 1)
    s = s.replace("    case 'locked': useGame.setState({ locked: m.v }); break;", """    case 'game': {
      if (m.g === 'hs') setSkew(m.s.now);
      useGame.setState({ games: { ...S.games, [m.g]: m.s } as typeof S.games }); break;
    }
    case 'locked': useGame.setState({ locked: m.v }); break;""", 1)
    s = s.replace("toLobby(msg: string) {\n  sessionStorage.removeItem(TOKEN_KEY);", "toLobby(msg: string) {\n  useGame.setState({ games: { siga: null, hs: IDLE_HS } });\n  sessionStorage.removeItem(TOKEN_KEY);", 1)
    s += "\nexport const gameAct = (g: 'siga' | 'hs', a: string, extra: Record<string, unknown> = {}) => send({ t: 'g', g, a, ...extra });\n"
open(p, 'w', encoding='utf8').write(s)
