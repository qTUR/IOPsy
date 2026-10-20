import re

# ---- i18n: خيارات الشخصية ----
p = 'src/i18n.ts'
s = open(p, encoding='utf8').read()
if 'OPTION_EN' not in s:
    s += '''
const OPTION_EN: Record<string, string> = {
  'بدون': 'None', 'بشت بني': 'Brown bisht', 'بشت أسود': 'Black bisht', 'مشلح بيج': 'Beige mishlah',
  'شماغ أحمر': 'Red shemagh', 'غترة بيضاء': 'White ghutra', 'شماغ أسود': 'Black shemagh', 'شماغ ملفوف': 'Wrapped shemagh', 'طاقية': 'Taqiyah cap', 'حجاب': 'Hijab',
  'سكسوكة': 'Goatee', 'لحية كاملة': 'Full beard', 'شارب': 'Moustache', 'لحية كثيفة': 'Thick beard', 'قصير': 'Short', 'غرّة': 'Fringe', 'مجعّد': 'Curly',
  'طبية': 'Prescription', 'شمسية': 'Sunglasses', 'شنطة كتف': 'Shoulder bag', 'شنطة يد': 'Handbag', 'سنيكرز': 'Sneakers', 'نعال': 'Sandals', 'رسمي': 'Formal',
};
/** تسمية خيارات الشخصية حسب اللغة */
export function useOpt() {
  const lang = useGame((s) => s.settings.lang);
  return (ar: string) => (lang === 'en' ? OPTION_EN[ar] ?? ar : ar);
}
'''
open(p, 'w', encoding='utf8').write(s)

# ---- Tag: تحدّث/كتم + أدوار مترجمة ----
p = 'src/scene/Tag.tsx'
s = open(p, encoding='utf8').read()
s = s.replace("import { useGame } from '../store';", "import { useGame } from '../store';\nimport { useT } from '../i18n';")
s = s.replace("const ROLE_LABEL = { owner: 'المدير', mod: 'مشرف', user: '' } as const;\n", "")
s = s.replace("  const say = useGame((s) => s.says[id]);", "  const t = useT();\n  const say = useGame((s) => s.says[id]);\n  const speaking = useGame((s) => !!s.media.speaking[id]);\n  const micOff = useGame((s) => s.media.state === 'on' && s.media.micOn[id] === false);")
s = s.replace("<div className={'tag' + (away ? ' away' : '') + (role !== 'user' ? ' r-' + role : '')}>", "<div className={'tag' + (away ? ' away' : '') + (role !== 'user' ? ' r-' + role : '') + (speaking ? ' speaking' : '')}>")
s = re.sub(r"\{role !== 'user' && <span className=\"badge\">\{ROLE_LABEL\[role\]\}</span>\}\s*\{name\}\{away \? ' \(غير متصل\)' : ''\}",
          "{role !== 'user' && <span className=\"badge\">{t(role === 'owner' ? 'role_owner' : 'role_mod')}</span>}\n        {speaking ? <span className=\"mic-on\">🎤</span> : micOff ? <span className=\"mic-off\">🔇</span> : null}{name}{away ? ` (${t('offline')})` : ''}", s)
open(p, 'w', encoding='utf8').write(s)

# ---- audio: تشغيل/إيقاف الأجواء ----
p = 'src/audio.ts'
s = open(p, encoding='utf8').read()
if 'setAmbientEnabled' not in s:
    s += "\n/** تشغيل/إيقاف أجواء الخيمة (رياح + نار + موسيقى) */\nexport function setAmbientEnabled(on: boolean) { muted = !on; if (master && ctx) master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.1); if (music) music.muted = !on; }\n"
open(p, 'w', encoding='utf8').write(s)

# ---- main.tsx: تطبيق اللغة والأنماط ----
p = 'src/main.tsx'
s = open(p, encoding='utf8').read()
if 'applyLang' not in s:
    s = s.replace("import { useGame } from './store';", "import { useGame } from './store';\nimport { applyLang } from './i18n';")
    s = s.replace("createRoot(", "applyLang(useGame.getState().settings.lang);\ncreateRoot(")
open(p, 'w', encoding='utf8').write(s)
