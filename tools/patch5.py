import re

# uiStore: لوحة الألعاب
p = 'src/ui/uiStore.ts'
s = open(p, encoding='utf8').read()
s = s.replace("'proj' | 'manage' | 'settings';", "'proj' | 'manage' | 'settings' | 'games';")
open(p, 'w', encoding='utf8').write(s)

# Hud: زر + لوحة + عرض الغميضة
p = 'src/ui/Hud.tsx'
s = open(p, encoding='utf8').read()
if 'Games' not in s:
    s = s.replace("import Tiles from './Tiles';", "import Tiles from './Tiles';\nimport Games, { GameHud } from './Games';")
    s = s.replace("      {staff && <B ic=\"🛡\"", "      <B ic=\"🎲\" label={t('tb_games')} on={panel === 'games'} onClick={() => togglePanel('games')} />\n      {staff && <B ic=\"🛡\"")
    s = s.replace("        {panel === 'settings' && <Settings />}", "        {panel === 'settings' && <Settings />}\n        {panel === 'games' && <Games />}")
    s = s.replace("      <Toolbar />\n      <Toast />", "      <Toolbar />\n      <GameHud />\n      <Toast />")
open(p, 'w', encoding='utf8').write(s)

# World: اللوحة
p = 'src/scene/World.tsx'
s = open(p, encoding='utf8').read()
if 'SigaBoard' not in s:
    s = s.replace("import RemotePlayers from './RemotePlayers';", "import RemotePlayers from './RemotePlayers';\nimport SigaBoard from './SigaBoard';")
    s = s.replace("<LightPosts center={[0, 3]} radius={11} />", "<LightPosts center={[0, 3]} radius={11} />\n      {phase === 'play' && <SigaBoard />}")
open(p, 'w', encoding='utf8').write(s)

# Player: قفل الحركة أثناء عدّ الباحث
p = 'src/scene/Player.tsx'
s = open(p, encoding='utf8').read()
if 'seekerLock' not in s:
    s = s.replace("    const l = Math.hypot(ix, iz);\n    const run", "    const gs = useGame.getState(); const seekerLock = gs.games.hs.phase === 'counting' && gs.games.hs.seeker === gs.myId;\n    if (seekerLock) { ix = 0; iz = 0; }\n    const l = Math.hypot(ix, iz);\n    const run")
open(p, 'w', encoding='utf8').write(s)

# Tag: إخفاء/شارات اللعبة
p = 'src/scene/Tag.tsx'
s = open(p, encoding='utf8').read()
if 'hidden' not in s:
    s = s.replace("role: 'owner' | 'mod' | 'user'; away?: boolean })", "role: 'owner' | 'mod' | 'user'; away?: boolean; hidden?: boolean })")
    s = s.replace("{ id, name, role, away }:", "{ id, name, role, away, hidden }:")
    s = s.replace("  const showSay =", "  const hsSeeker = useGame((s) => s.games.hs.phase !== 'idle' && s.games.hs.seeker === id), hsFound = useGame((s) => s.games.hs.phase === 'hunting' && s.games.hs.found.includes(id));\n  const showSay =")
    s = s.replace("  return (\n    <Html", "  if (hidden) return null;\n  return (\n    <Html")
    s = s.replace("{speaking ? <span className=\"mic-on\">", "{hsSeeker && <span className=\"hs-badge\">🔍</span>}{hsFound && <span className=\"hs-badge\">✓</span>}{speaking ? <span className=\"mic-on\">")
open(p, 'w', encoding='utf8').write(s)

# RemotePlayers: يخفي اسم المختبئ عن الباحث
p = 'src/scene/RemotePlayers.tsx'
s = open(p, encoding='utf8').read()
if 'setHidden' not in s:
    s = s.replace("import { useEffect, useRef } from 'react';", "import { useEffect, useRef, useState } from 'react';")
    s = s.replace("import { bus } from '../net';", "import { bus } from '../net';\nimport { player } from './Player';")
    s = s.replace("  const first = useRef(true);", "  const first = useRef(true);\n  const [hidden, setHidden] = useState(false);")
    s = s.replace("    av.current?.setMoving(!!t.mv, 1);", "    av.current?.setMoving(!!t.mv, 1);\n    const gs = useGame.getState(), hs = gs.games.hs;\n    const hide = hs.phase === 'hunting' && hs.seeker === gs.myId && p.id !== gs.myId && !hs.found.includes(p.id) && Math.hypot(o.position.x - player.pos.x, o.position.z - player.pos.z) > 4.5;\n    if (hide !== hidden) setHidden(hide);")
    s = s.replace("<Tag id={p.id} name={p.name} role={p.role} away={!p.on} />", "<Tag id={p.id} name={p.name} role={p.role} away={!p.on} hidden={hidden} />")
open(p, 'w', encoding='utf8').write(s)

# CSS
p = 'src/ui/hud2.css'
s = open(p, encoding='utf8').read()
if '.gm-body' not in s:
    s += """
/* ===== الألعاب ===== */
.gm-body { padding: 12px 14px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
.gm-card { padding: 12px; border-radius: 14px; background: rgba(255, 255, 255, .06); border: 1px solid rgba(246, 217, 141, .2); display: flex; flex-direction: column; gap: 8px; }
.gm-card h3 { margin: 0; font: 700 18px var(--kufi); color: var(--gold2); }
.gm-card p { margin: 0; font-size: 13px; opacity: .85; }
.gm-seats { display: flex; gap: 8px; }
.gm-seat { flex: 1; display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 12px; background: rgba(0, 0, 0, .25); border: 2px solid transparent; font-size: 13px; font-weight: 700; }
.gm-seat.turn { border-color: #7fe0a0; box-shadow: 0 0 12px rgba(127, 224, 160, .5); }
.gm-seat button { padding: 5px 10px; border-radius: 10px; border: 0; background: var(--gold); color: #2a1a10; font: 700 12px var(--font); cursor: pointer; }
.gm-seat button:disabled { opacity: .4; }
.stone { width: 22px; height: 22px; border-radius: 50%; flex: none; }
.stone.light { background: radial-gradient(circle at 35% 30%, #fff, #d8ccb4); }
.stone.dark { background: radial-gradient(circle at 35% 30%, #5a4a40, #1c1612); }
.gm-status { font-weight: 800; color: #7fe0a0; } .gm-status.win { color: var(--gold2); font-size: 16px; }
.gm-joined { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.chip { padding: 2px 10px; border-radius: 99px; background: rgba(255, 255, 255, .12); font-size: 12px; font-weight: 700; }
.chip.seeker { background: #e8a23a; color: #2a1a10; } .chip.found { background: #4a9e6a; }
.board-label { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 16px; border-radius: 14px; background: rgba(24, 12, 36, .85); border: 1px solid rgba(246, 217, 141, .5); color: var(--sand); font-family: var(--font); white-space: nowrap; }
.board-label b { font: 700 16px var(--kufi); color: var(--gold2); } .board-label small { font-size: 12px; }
.board-label button { padding: 4px 12px; border-radius: 10px; border: 0; background: var(--gold); color: #2a1a10; font: 700 12px var(--font); cursor: pointer; }
.hs-badge { margin-inline-end: 4px; }
.hs-curtain { position: fixed; inset: 0; z-index: 30; background: #05030a; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; pointer-events: auto; text-align: center; padding: 20px; }
.hs-count { font: 800 140px/1 var(--kufi); color: var(--gold2); text-shadow: 0 0 40px rgba(246, 217, 141, .5); }
.hs-msg { font: 700 28px var(--kufi); } .hs-sub { opacity: .7; }
.hs-banner { position: absolute; top: 74px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 14px; flex-wrap: wrap; justify-content: center; padding: 10px 20px; border-radius: 16px; background: rgba(24, 12, 36, .88); border: 1px solid rgba(246, 217, 141, .55); max-width: min(760px, 94vw); pointer-events: auto; font-size: 14px; }
.hs-banner b { font-size: 16px; color: var(--gold2); }
.hot { font-weight: 800; padding: 3px 12px; border-radius: 99px; background: rgba(255, 255, 255, .1); }
.hot.h3 { background: #e8504a; } .hot.h2 { background: #e8a23a; color: #2a1a10; } .hot.h1 { background: #3a8ec2; } .hot.h0 { background: #34495e; }
"""
open(p, 'w', encoding='utf8').write(s)
