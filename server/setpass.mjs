// تغيير كلمة سر الأدمن: node server/setpass.mjs <كلمة-السر-الجديدة>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const pw = process.argv[2];
if (!pw || pw.length < 8) { console.error('اكتب كلمة سر من 8 خانات على الأقل: node server/setpass.mjs <كلمة-السر>'); process.exit(1); }
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync(pw, salt, 32).toString('hex');
fs.writeFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'admin.json'), JSON.stringify({ salt, hash }));
console.log('تم تحديث كلمة سر الأدمن (محفوظة مُشفّرة). أعد تشغيل الخادم.');
