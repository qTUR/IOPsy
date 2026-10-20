// فحص الشبكة لاستضافة الاجتماع من بيتك: node scripts/network-check.mjs
// يفحص: العنوان العام، احتمال CGNAT، نوع NAT عبر STUN، وسرعة التنزيل/الرفع الفعلية.
import os from 'node:os';
import dgram from 'node:dgram';
import crypto from 'node:crypto';
import https from 'node:https';
import dns from 'node:dns/promises';

const line = (s = '') => console.log(s);
const ipToInt = (ip) => ip.split('.').reduce((a, b) => (a << 8) + +b, 0) >>> 0;
const inCidr = (ip, base, bits) => (ipToInt(ip) & (~0 << (32 - bits))) >>> 0 === (ipToInt(base) & (~0 << (32 - bits))) >>> 0;

function get(url) { return new Promise((res, rej) => https.get(url, { timeout: 8000 }, (r) => { let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => res(b.trim())); }).on('error', rej)); }

async function stun(host, port = 19302) {
  const ip = (await dns.lookup(host, 4)).address;
  return new Promise((resolve) => {
    const s = dgram.createSocket('udp4'); const tid = crypto.randomBytes(12);
    const msg = Buffer.concat([Buffer.from([0, 1, 0, 0, 0x21, 0x12, 0xa4, 0x42]), tid]);
    const timer = setTimeout(() => { s.close(); resolve(null); }, 3000);
    s.on('message', (m) => {
      clearTimeout(timer); s.close();
      let o = 20; while (o < m.length) {
        const type = m.readUInt16BE(o), len = m.readUInt16BE(o + 2);
        if (type === 0x0020) { const port2 = m.readUInt16BE(o + 6) ^ 0x2112; const a = [0, 1, 2, 3].map((i) => m[o + 8 + i] ^ [0x21, 0x12, 0xa4, 0x42][i]); return resolve({ ip: a.join('.'), port: port2 }); }
        o += 4 + len + ((4 - (len % 4)) % 4);
      }
      resolve(null);
    });
    s.bind(0, () => s.send(msg, port, ip));
  });
}

async function speed() {
  const out = {};
  try {
    const t0 = performance.now(); let n = 0;
    await new Promise((res, rej) => https.get('https://speed.cloudflare.com/__down?bytes=30000000', { timeout: 30000 }, (r) => { r.on('data', (c) => (n += c.length)); r.on('end', res); }).on('error', rej));
    out.down = (n * 8) / ((performance.now() - t0) / 1000) / 1e6;
  } catch { /* */ }
  try {
    const body = crypto.randomBytes(12_000_000); const t0 = performance.now();
    await new Promise((res, rej) => { const r = https.request('https://speed.cloudflare.com/__up', { method: 'POST', headers: { 'content-length': body.length, 'content-type': 'application/octet-stream' }, timeout: 40000 }, (x) => { x.resume(); x.on('end', res); }); r.on('error', rej); r.end(body); });
    out.up = (body.length * 8) / ((performance.now() - t0) / 1000) / 1e6;
  } catch { /* */ }
  return out;
}

line('== فحص الشبكة لاستضافة IOPsy ==\n');
const lan = Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address);
line('عناوين شبكتك المحلية:  ' + (lan.join(', ') || '—'));
let pub = null; try { pub = await get('https://api.ipify.org'); } catch { /* */ }
line('العنوان العام (كما يراه الإنترنت):  ' + (pub || 'تعذّر الحصول عليه (لا إنترنت؟)'));
const s1 = await stun('stun.l.google.com'), s2 = await stun('stun1.l.google.com');
if (s1) line(`STUN (UDP يعمل للخارج): ${s1.ip}:${s1.port}`); else line('STUN: لا رد — قد تكون UDP محجوبة من الشبكة/الجدار الناري');
let natType = '—';
if (s1 && s2) { natType = s1.port === s2.port ? 'مخروطي/مفتوح (جيد)' : 'متماثل Symmetric'; line('نوع NAT التقريبي: ' + natType);
  if (s1.port !== s2.port) { line('  ⚠ NAT متماثل مؤشر قوي على أحد أمرين: (1) CGNAT عند مزوّد الخدمة، أو (2) تشغيل VPN/Cloudflare WARP على هذا الجهاز.'); line('    أوقف الـVPN مؤقتًا (إن وُجد) وأعد الفحص، ثم قارن العنوان العام بعنوان WAN في صفحة الراوتر.'); } }
line('');
const cgnat = pub && (inCidr(pub, '100.64.0.0', 10) || inCidr(pub, '10.0.0.0', 8) || inCidr(pub, '192.168.0.0', 16) || inCidr(pub, '172.16.0.0', 12));
if (cgnat) line('⚠ العنوان العام داخل نطاق CGNAT/خاص: أنت خلف CGNAT مؤكَّدًا — لا يمكن فتح منافذ من الراوتر.');
else {
  line('ملاحظة CGNAT: قارن العنوان أعلاه بعنوان WAN الظاهر في صفحة الراوتر (عادة 192.168.1.1).');
  line('  • إذا تطابقا: عندك عنوان عام حقيقي ← يمكن فتح المنافذ والاستضافة مجانًا من البيت.');
  line('  • إذا اختلفا: أنت خلف CGNAT ← اطلب من مزوّد الخدمة IP عام، أو استخدم حلًّا مجانيًا بديلًا (انظر HOSTING.md).');
}
line('\nجارٍ قياس السرعة الفعلية (تنزيل 30MB ورفع 12MB)…');
const sp = await speed();
line(`سرعة التنزيل: ${sp.down ? sp.down.toFixed(0) + ' Mbps' : 'تعذّر'}`);
line(`سرعة الرفع:   ${sp.up ? sp.up.toFixed(0) + ' Mbps' : 'تعذّر'}   ← هذا هو الرقم المهم للاستضافة (الإرسال لكل المشاركين)`);
if (sp.up) {
  const up = sp.up;
  line('\nالتقدير لـ 20 مشاركًا (قياس فعلي بأداة LiveKit load-test: 6 كاميرات + 20 صوتًا ≈ 1.1 Mbps لكل مستمع):');
  line(`  • اجتماع عادي (6 كاميرات): يحتاج ≈ 25 Mbps رفع ← ${up >= 25 ? 'كافٍ ✅' : 'غير كافٍ ⚠ (خفّض عدد الكاميرات أو الجودة)'}`);
  line(`  • أسوأ حالة (20 كاميرا + مشاركة شاشة): ≈ 80 Mbps رفع ← ${up >= 80 ? 'كافٍ ✅' : 'غير كافٍ — استخدم جودة الفيديو «منخفضة» وحدّد 6–8 كاميرات'}`);
}
line('\nالخلاصة محفوظة أعلاه. أرسلها لي أو راجع HOSTING.md لاختيار الطريق المناسب.');
