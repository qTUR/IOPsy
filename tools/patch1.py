p = 'vite.config.ts'
s = open(p, encoding='utf8').read()
s = s.replace("server: { port: 5180, host: true }", "server: { port: 5180, host: true, proxy: { '/ws': { target: 'ws://localhost:3002', ws: true } } }")
open(p, 'w', encoding='utf8').write(s)

p = 'package.json'
s = open(p, encoding='utf8').read()
if '"server"' not in s:
    s = s.replace('"dev": "vite --host",', '"dev": "node dev.mjs",\n    "server": "node server/index.mjs",\n    "test:server": "node server/test.mjs",\n    "admin:setpass": "node server/setpass.mjs",\n    "start": "node server/index.mjs",')
open(p, 'w', encoding='utf8').write(s)

p = 'src/main.tsx'
s = open(p, encoding='utf8').read()
if 'hud.css' not in s:
    s = s.replace("import './style.css';", "import './style.css';\nimport './ui/hud.css';")
open(p, 'w', encoding='utf8').write(s)

import os
if os.path.exists('src/ui/_old_join.txt'):
    os.remove('src/ui/_old_join.txt')
