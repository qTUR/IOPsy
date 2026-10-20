def rw(p, fn):
    s = open(p, encoding='utf8').read()
    open(p, 'w', encoding='utf8').write(fn(s))

def html(s):
    s = s.replace('<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />',
                  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />\n  <meta name="theme-color" content="#170c2c" />\n  <meta name="mobile-web-app-capable" content="yes" />\n  <meta name="apple-mobile-web-app-capable" content="yes" />\n  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />\n  <meta name="apple-mobile-web-app-title" content="IOPsy" />\n  <link rel="manifest" href="/manifest.webmanifest" />\n  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />')
    return s
rw('index.html', html)

def main(s):
    if 'mobile.css' not in s:
        s = s.replace("import './ui/hud2.css';", "import './ui/hud2.css';\nimport './ui/mobile.css';")
    if 'serviceWorker' not in s:
        s += "\nif ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && !import.meta.env.DEV) navigator.serviceWorker.register('/sw.js').catch(() => {});\n"
    return s
rw('src/main.tsx', main)
