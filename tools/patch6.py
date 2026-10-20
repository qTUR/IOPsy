p = 'src/scene/Player.tsx'
s = open(p, encoding='utf8').read()

s = s.replace("import { bus, sendEmote, sendMove } from '../net';", "import { bus, sendEmote, sendMove } from '../net';\nimport { touch } from '../input';")

# مؤشرات متعددة: سحب لتدوير + قرص لتقريب/تبعيد
a = s.index("    let drag = false, lx = 0, ly = 0;")
b = s.index("    const wh = ")
new = """    const ptrs = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const el = gl.domElement;
    const pd = (e: PointerEvent) => { ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); try { el.setPointerCapture(e.pointerId); } catch { /* */ } if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); } };
    const pm = (e: PointerEvent) => {
      const prev = ptrs.get(e.pointerId); if (!prev) return;
      if (ptrs.size >= 2) {
        ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch > 0) cam.current.dist = THREE.MathUtils.clamp(cam.current.dist * (pinch / Math.max(d, 1)), 3.5, 20);
        pinch = d; return;
      }
      cam.current.yaw -= (e.clientX - prev.x) * 0.0055;
      cam.current.pitch = THREE.MathUtils.clamp(cam.current.pitch + (e.clientY - prev.y) * 0.004, 0.06, 1.3);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    };
    const pu = (e: PointerEvent) => { ptrs.delete(e.pointerId); pinch = 0; };
"""
s = s[:a] + new + s[b:]
s = s.replace("el.addEventListener('pointerup', pu); el.addEventListener('wheel', wh, { passive: true });", "el.addEventListener('pointerup', pu); el.addEventListener('pointercancel', pu); el.addEventListener('wheel', wh, { passive: true });")
s = s.replace("el.removeEventListener('pointerup', pu); el.removeEventListener('wheel', wh);", "el.removeEventListener('pointerup', pu); el.removeEventListener('pointercancel', pu); el.removeEventListener('wheel', wh);")
# زر الجلوس من الواجهة
s = s.replace("    const onEmote = (e: Event) => { const d = (e as CustomEvent).detail as { id: string; n: EmoteName }; if (d.id === myId) { avatar.current?.setSit(false); avatar.current?.emote(d.n); } };\n    bus.addEventListener('emote', onEmote);",
              "    const onEmote = (e: Event) => { const d = (e as CustomEvent).detail as { id: string; n: EmoteName }; if (d.id === myId) { avatar.current?.setSit(false); avatar.current?.emote(d.n); } };\n    const onSit = () => avatar.current?.setSit(!avatar.current.sitting);\n    bus.addEventListener('emote', onEmote); bus.addEventListener('sit', onSit);")
s = s.replace("    return () => bus.removeEventListener('emote', onEmote);\n  }, [myId]);", "    return () => { bus.removeEventListener('emote', onEmote); bus.removeEventListener('sit', onSit); };\n  }, [myId]);")
# حركة: دمج اللمس والسرعة التناسبية
s = s.replace("    const gs = useGame.getState(); const seekerLock", "    ix += touch.x; iz += touch.z;\n    const gs = useGame.getState(); const seekerLock")
s = s.replace("    const run = k.has('shift');\n    if (l > 0) {\n      ix /= l; iz /= l;", "    const run = k.has('shift') || touch.run;\n    if (l > 0.08) {\n      const mag = Math.min(1, l); ix /= l; iz /= l;")
s = s.replace("const sp = avatar.current?.sitting ? 0 : run ? 7.2 : 4.2;", "const sp = (avatar.current?.sitting ? 0 : run ? 7.2 : 4.2) * mag;")
s = s.replace("    if (l > 0 && avatar.current?.sitting) avatar.current.setSit(false);\n    avatar.current?.setMoving(l > 0, run ? 1.35 : 1);", "    const moving = l > 0.08;\n    if (moving && avatar.current?.sitting) avatar.current.setSit(false);\n    avatar.current?.setMoving(moving, run ? 1.35 : 1);")
s = s.replace("key = `${p.x.toFixed(2)},${p.z.toFixed(2)},${l > 0},${sit}`", "key = `${p.x.toFixed(2)},${p.z.toFixed(2)},${moving},${sit}`")
s = s.replace("sendMove(p.x, p.z, heading.current, l > 0, sit)", "sendMove(p.x, p.z, heading.current, moving, sit)")
open(p, 'w', encoding='utf8').write(s)
