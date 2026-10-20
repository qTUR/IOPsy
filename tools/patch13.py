def rw(p, fn):
    s = open(p, encoding='utf8').read()
    open(p, 'w', encoding='utf8').write(fn(s))

# المضمار يظهر مع المنضمّين حتى في الانتظار
rw('src/scene/RaceTrack.tsx', lambda s: s.replace("{race.phase !== 'idle' && ids.map(", "{ids.map("))

# بطاقة السباق في لوحة الألعاب
def games(s):
    if 'race_name' in s: return s
    s = s.replace("  const joined = hs.joined.includes(myId);", "  const joined = hs.joined.includes(myId);\n  const race = games.race, inRace = race.joined.includes(myId);")
    card = """
        {/* سباق الهجن */}
        <section className="gm-card">
          <h3>🐪 {t('race_name')}</h3>
          <p>{t('race_desc')}</p>
          <div className="gm-joined"><b>{t('race_players', { n: String(race.joined.length) })}</b>{race.joined.map((id) => <span key={id} className="chip">{nm(id)}</span>)}</div>
          {race.phase === 'idle' && !inRace && <button className="bigbtn" onClick={() => gameAct('race', 'join')}>{t('race_join')}</button>}
          {race.phase === 'idle' && inRace && <button className="bigbtn" onClick={() => gameAct('race', 'leave')}>{t('race_leave')}</button>}
          {race.phase === 'idle' && <button className="bigbtn on" disabled={race.joined.length < 2 || !(staff || inRace)} onClick={() => gameAct('race', 'start')}>▶ {t('race_start')}</button>}
          {race.phase === 'idle' && race.joined.length < 2 && <p className="note sm">{t('race_need')}</p>}
        </section>
"""
    s = s.replace("      </div>\n    </div>\n  );\n}\n\n/** عناصر عرض الغميضة", card + "      </div>\n    </div>\n  );\n}\n\n/** عناصر عرض الغميضة", 1)
    return s
rw('src/ui/Games.tsx', games)

def hud(s):
    if 'RaceHud' in s: return s
    s = s.replace("import Games, { GameHud } from './Games';", "import Games, { GameHud } from './Games';\nimport RaceHud from './RaceHud';")
    s = s.replace("      <GameHud />", "      <GameHud />\n      <RaceHud />")
    return s
rw('src/ui/Hud.tsx', hud)

def css(s):
    if '.race-count' in s: return s
    return s + """
/* ===== سباق الهجن ===== */
.race-count { position: fixed; left: 50%; top: 32%; transform: translate(-50%, -50%); font: 800 150px/1 var(--kufi); color: var(--gold2); text-shadow: 0 6px 40px rgba(0,0,0,.7), 0 0 30px rgba(246,217,141,.6); pointer-events: none; z-index: 25; animation: rpop .9s ease-out; }
@keyframes rpop { 0% { transform: translate(-50%, -50%) scale(2); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1); } }
.race-sub { position: fixed; left: 50%; top: 46%; transform: translateX(-50%); padding: 8px 18px; border-radius: 14px; background: rgba(24,12,36,.85); font-weight: 700; text-align: center; max-width: 92vw; z-index: 25; }
.race-pad { position: fixed; left: 50%; bottom: calc(86px + env(safe-area-inset-bottom)); transform: translateX(-50%); width: min(560px, 94vw); display: flex; flex-direction: column; gap: 8px; align-items: stretch; z-index: 25; pointer-events: auto; }
.race-pad small { text-align: center; opacity: .8; text-shadow: 0 1px 3px #000; }
.race-bar { position: relative; height: 26px; border-radius: 99px; background: rgba(24,12,36,.85); border: 1px solid rgba(246,217,141,.5); overflow: hidden; }
.race-bar i { position: absolute; inset: 0 auto 0 0; background: linear-gradient(90deg, #2f9e6a, #7fe0a0); transition: width .1s; }
.race-bar b { position: absolute; inset: 0; display: grid; place-items: center; font-size: 13px; }
.race-btns { display: flex; gap: 12px; }
.race-btns button { flex: 1; height: 86px; border-radius: 22px; border: 3px solid rgba(246,217,141,.7); background: rgba(24,12,36,.88); color: var(--sand); font: 800 24px var(--kufi); touch-action: manipulation; user-select: none; -webkit-user-select: none; }
.race-btns button.hit { background: var(--gold); color: #2a1a10; transform: scale(.96); }
.race-watch { position: fixed; top: calc(70px + env(safe-area-inset-top)); left: 50%; transform: translateX(-50%); display: flex; gap: 10px; align-items: center; flex-wrap: wrap; justify-content: center; padding: 8px 16px; border-radius: 16px; background: rgba(24,12,36,.88); border: 1px solid rgba(246,217,141,.5); z-index: 25; max-width: 94vw; }
.race-watch button { padding: 6px 12px; border-radius: 10px; border: 0; background: var(--gold); color: #2a1a10; font: 700 13px var(--font); cursor: pointer; } .race-watch button.on { background: #7fe0a0; }
.race-results { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(420px, 92vw); padding: 18px 22px; border-radius: 20px; background: rgba(24,12,36,.95); border: 2px solid var(--gold); z-index: 26; text-align: center; box-shadow: 0 20px 60px #000a; }
.race-results h3 { margin: 0 0 10px; font: 700 24px var(--kufi); color: var(--gold2); } .race-results .win { color: #7fe0a0; font-weight: 800; margin-bottom: 8px; }
.race-results ol { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; max-height: 50vh; overflow: auto; }
.race-results li { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 12px; background: rgba(255,255,255,.07); } .race-results li.me { background: rgba(246,217,141,.22); }
.race-results li span { width: 30px; font-size: 20px; } .race-results li b { flex: 1; text-align: start; } .race-results li em { opacity: .8; font-style: normal; font-size: 13px; }
.race-tag { display: flex; align-items: center; gap: 6px; border-width: 2px; } .lane-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
"""
rw('src/ui/hud2.css', css)
