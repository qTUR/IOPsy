import re

def rw(p, fn):
    s = open(p, encoding='utf8').read()
    s2 = fn(s)
    open(p, 'w', encoding='utf8').write(s2)

# ---- store: gfx tiers ----
rw('src/store.ts', lambda s: s.replace("gfx: 'low' | 'high';", "gfx: 'min' | 'low' | 'high';"))

# ---- i18n ----
def i18n(s):
    if 'perf_down' in s: return s
    s = s.replace("  err_seats_full: 'المقعدان ممتلئان',", "  perf_down: 'جهازك بطيء قليلًا — خفّضنا الرسوميات تلقائيًا', gfx_min: 'أدنى (للجوالات القديمة)', tc_hint: 'اسحب الشاشة للدوران، وقرّب بإصبعين',\n  err_seats_full: 'المقعدان ممتلئان',", 1)
    s = s.replace("  err_seats_full: 'Both seats are taken',", "  perf_down: 'Your device is a bit slow — graphics were lowered automatically', gfx_min: 'Minimum (older phones)', tc_hint: 'Drag to look around, pinch to zoom',\n  err_seats_full: 'Both seats are taken',", 1)
    return s
rw('src/i18n.ts', i18n)

# ---- Settings: three tiers ----
def settings(s):
    s = s.replace("{(['low', 'high'] as const).map((q) => <button key={q} className={settings.gfx === q ? 'sel' : ''} onClick={() => setSettings({ gfx: q })}>{t(q === 'low' ? 'gfx_low' : 'gfx_high')}</button>)}",
                  "{(['min', 'low', 'high'] as const).map((q) => <button key={q} className={settings.gfx === q ? 'sel' : ''} onClick={() => setSettings({ gfx: q })}>{t(q === 'min' ? 'gfx_min' : q === 'low' ? 'gfx_low' : 'gfx_high')}</button>)}")
    return s
rw('src/ui/Settings.tsx', settings)

# ---- App: dpr/shadows by tier + touch controls + wake lock + Perf ----
def app(s):
    s = s.replace("import { useT } from './i18n';", "import { useT } from './i18n';\nimport Perf from './scene/Perf';\nimport TouchControls from './ui/TouchControls';\nimport { useEffect } from 'react';")
    s = s.replace("  const low = useGame((s) => s.settings.gfx) === 'low';", "  const gfx = useGame((s) => s.settings.gfx);\n  useEffect(() => { // إبقاء الشاشة مضاءة أثناء الاجتماع (الجوال)\n    let lock: { release: () => Promise<void> } | null = null;\n    const req = async () => { try { lock = await (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null; } catch { /* */ } };\n    if (phase === 'play') { void req(); const v = () => { if (document.visibilityState === 'visible') void req(); }; document.addEventListener('visibilitychange', v); return () => { document.removeEventListener('visibilitychange', v); void lock?.release(); }; }\n  }, [phase]);")
    s = s.replace("shadows dpr={low ? [1, 1] : [1, 1.75]}", "shadows={gfx !== 'min'} dpr={gfx === 'min' ? [0.7, 0.8] : gfx === 'low' ? [1, 1] : [1, 1.75]}")
    s = s.replace("<Suspense fallback={null}><World /></Suspense>", "<Suspense fallback={null}><World /><Perf /></Suspense>")
    s = s.replace("{phase === 'join' ? <Join /> : <Hud />}", "{phase === 'join' ? <Join /> : <><Hud /><TouchControls /></>}")
    return s
rw('src/App.tsx', app)

# ---- World: tiers ----
def world(s):
    s = s.replace("const low = useGame((s) => s.settings.gfx) === 'low';", "const gfx = useGame((s) => s.settings.gfx), low = gfx !== 'high', min = gfx === 'min';")
    s = s.replace("shadow-mapSize={low ? [1024, 1024] : [4096, 4096]}", "shadow-mapSize={min ? [512, 512] : low ? [1024, 1024] : [4096, 4096]}")
    a = s.index("      <EffectComposer"); b = s.index("      </EffectComposer>") + len("      </EffectComposer>")
    new = """      {!min && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <N8AO aoRadius={1.6} distanceFalloff={1.2} intensity={low ? 0 : 2.6} quality="performance" halfRes />
          <Bloom intensity={low ? 0.5 : 0.7} luminanceThreshold={0.9} luminanceSmoothing={0.25} mipmapBlur={!low} radius={0.7} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <HueSaturation saturation={0.04} />
          <BrightnessContrast contrast={0.08} />
          <Vignette eskil={false} offset={0.22} darkness={0.5} />
          {low ? <></> : <SMAA />}
        </EffectComposer>
      )}"""
    s = s[:a] + new + s[b:]
    return s
rw('src/scene/World.tsx', world)

# ---- App: لا تحويل نغمات عندما min بلا composer → نحتاج ACES على المُصيّر ----
def app2(s):
    s = s.replace("toneMapping: THREE.NoToneMapping", "toneMapping: gfx === 'min' ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping")
    return s
rw('src/App.tsx', app2)

# ---- Palms: عدد السعف حسب الجودة ----
def palms(s):
    s = s.replace("export function Palm({ position, height = 7, seed = 1, lean = 0.1 }", "export function Palm({ position, height = 7, seed = 1, lean = 0.1 }")
    s = s.replace("  const A = assets();\n  const { trunk, fronds, dates } = useMemo(() => {", "  const A = assets();\n  const gfx = useGame((s) => s.settings.gfx), nF = gfx === 'high' ? 30 : gfx === 'low' ? 16 : 10;\n  const { trunk, fronds, dates } = useMemo(() => {")
    s = s.replace("for (let i = 0; i < 30; i++) {\n      const layer = i / 30, ring = i % 3;", "for (let i = 0; i < nF; i++) {\n      const layer = i / nF, ring = i % 3;")
    s = s.replace("}, [height, seed, lean]);", "}, [height, seed, lean, nF]);")
    s = s.replace("import { colliders, duneHeight } from './terrain';", "import { colliders, duneHeight } from './terrain';\nimport { useGame } from '../store';")
    s = s.replace("{dates.map((d, i) => <mesh key={i} position={d}>", "{(gfx === 'high' ? dates : []).map((d, i) => <mesh key={i} position={d}>")
    return s
rw('src/scene/Palms.tsx', palms)

# ---- Toolbar: إخفاء مشاركة الشاشة حيث لا تُدعم ----
def hud(s):
    s = s.replace("import Games, { GameHud } from './Games';", "import Games, { GameHud } from './Games';\nimport { canShareScreen } from '../input';")
    s = s.replace("      <B ic=\"🖥\" label={t('tb_share')}", "      {canShareScreen() && <B ic=\"🖥\" label={t('tb_share')}")
    s = s.replace("off={!can('screen')} onClick={() => void toggleScreen()} />", "off={!can('screen')} onClick={() => void toggleScreen()} />}")
    return s
rw('src/ui/Hud.tsx', hud)

def pp(s):
    s = s.replace("import { useUI } from './uiStore';", "import { useUI } from './uiStore';\nimport { canShareScreen } from '../input';", 1)
    s = s.replace("{(owner || perm.screen) && (", "{canShareScreen() && (owner || perm.screen) && (")
    return s
rw('src/ui/ProjectorPanel.tsx', pp)
