// عربي / إنجليزي — العربية هي المرجع، واللغة تُحفظ في الإعدادات
import { useGame } from './store';

export const AR = {
  app_tagline: 'اجتماعاتك في مخيم سعودي ثلاثي الأبعاد',
  tab_join: 'دخول بكود', tab_admin: '🔑 المدير',
  your_name: 'اسمك', name_ph: 'مثال: أبو سعود', session_code: 'كود الجلسة', admin_password: 'كلمة سر المدير',
  character: 'الشخصية', man: 'رجل', woman: 'امرأة', thobe_color: 'لون الثوب', abaya_color: 'لون العباءة',
  headwear: 'غطاء الرأس', hijab: 'الحجاب', hijab_color: 'لون الحجاب', outer: 'طبقة خارجية', beard: 'اللحية', hair: 'الشعر',
  skin: 'لون البشرة', glasses: 'النظارة', shoes: 'الحذاء', accessories: 'الإكسسوارات', watch: 'ساعة',
  enter_camp: 'ادخل المخيم', start_session: 'ابدأ جلسة جديدة', entering: 'جارٍ الدخول…',
  note_user: 'لا نطلب أي بيانات شخصية. الاسم يظهر فقط أثناء الجلسة.', note_admin: 'سيُولَّد كود جديد لكل جلسة ويبطل بانتهائها.',
  loading_camp: 'جارٍ تجهيز المخيم…', language: 'English',
  // أخطاء
  err_bad_password: 'كلمة سر الأدمن غير صحيحة', err_bad_code: 'الكود غير صحيح أو انتهت الجلسة', err_locked: 'الغرفة مقفلة من قبل المدير',
  err_full: 'الغرفة ممتلئة (الحد 20 مشاركًا)', err_rate: 'محاولات كثيرة، حاول بعد دقيقة', err_gone: 'انتهت صلاحية الجلسة',
  err_forbidden: 'ما عندك صلاحية لهذا الإجراء', err_busy: 'العارض مشغول بمصدر آخر', err_nofile: 'الملف غير موجود', err_bad_url: 'الرابط غير صالح',
  err_connect: 'تعذّر الاتصال بالخادم', err_dropped: 'انقطع الاتصال بالخادم', err_generic: 'حدث خطأ',
  kicked: 'طردك المدير من الجلسة', ended: 'أنهى المدير الجلسة', ended_other: 'انتهت الجلسة',
  // شريط الغرفة
  code_label: 'كود الجلسة', copy_invite: 'نسخ رابط الدعوة', copy_code: 'نسخ الكود', copied: 'تم النسخ ✓', locked_badge: '🔒 مقفلة',
  // أدوار
  role_owner: 'المدير', role_mod: 'مشرف', role_user: 'مشارك', you: 'أنت', offline: 'غير متصل',
  // أدوات
  tb_people: 'المشاركون', tb_mic: 'الميكروفون', tb_cam: 'الكاميرا', tb_share: 'مشاركة الشاشة', tb_chat: 'الدردشة', tb_projector: 'العارض',
  tb_settings: 'الإعدادات', tb_lock: 'قفل الغرفة', tb_unlock: 'فتح الغرفة', tb_end: 'إنهاء الجلسة', tb_leave: 'مغادرة', tb_manage: 'الإدارة',
  confirm_end: 'إنهاء الجلسة للجميع؟ سيبطل الكود.', confirm_kick: 'إخراج {n} من الجلسة؟',
  reconnecting: 'انقطع الاتصال… جارٍ إعادة المحاولة',
  // مشاركون
  participants: 'المشاركون', promote: 'ترقية إلى مشرف', demote: 'إلغاء الإشراف', kick: 'إخراج من الجلسة', dm: 'رسالة خاصة',
  mute: 'كتم', stop_cam: 'إيقاف الكاميرا', stop_screen: 'إيقاف المشاركة', allow_screen: 'السماح بمشاركة الشاشة', deny_screen: 'منع مشاركة الشاشة',
  restrict_mic: 'منع الميكروفون', allow_mic: 'السماح بالميكروفون', restrict_cam: 'منع الكاميرا', allow_cam: 'السماح بالكاميرا',
  // إدارة
  mng_title: 'إدارة الوسائط', mute_all: 'كتم الجميع', everyone_mic: 'ميكروفون الجميع', everyone_cam: 'كاميرا الجميع', everyone_screen: 'مشاركة الشاشة للجميع',
  allowed: 'مسموح', blocked: 'ممنوع',
  // دردشة
  chat_title: 'الدردشة', chat_ph: 'اكتب رسالة…', send: 'إرسال', to_all: 'إلى: الجميع', to_user: 'إلى: {n} (خاص)', private: 'خاص',
  // وسائط
  media_unavailable: 'خدمة الصوت والفيديو غير متاحة حاليًا', perm_denied: 'ما عندك صلاحية لهذا', device_denied: 'تم رفض إذن الجهاز من المتصفح', device_missing: 'ما لقيت الجهاز (ميكروفون/كاميرا)',
  forced_mic: 'كتمك المدير/المشرف', forced_cam: 'أُوقفت كاميرتك من الإدارة', forced_screen: 'أُوقفت مشاركة شاشتك من الإدارة',
  perm_changed: 'تغيّرت صلاحياتك', you_cam: 'كاميرتك', presenting: 'يعرض شاشته', screen_of: 'شاشة {n}', close: 'إغلاق', enlarge: 'تكبير',
  mic_off_all: 'الميكروفون مقفل للجميع', speaking: 'يتحدث',
  // العارض
  proj_title: 'العارض', proj_idle: 'العارض فارغ', proj_open: 'عرض كامل', proj_stop: 'إيقاف العرض',
  pdf_upload: 'رفع PDF', pdf_link: 'رابط PDF أو Google Drive', pdf_show: 'عرض', video_upload: 'رفع فيديو', video_url: 'رابط فيديو مباشر (mp4/webm)',
  page: 'صفحة', of: 'من', prev: 'السابق', next: 'التالي', present_mine: 'اعرض شاشتي على العارض', show_screen_of: 'اعرض شاشة {n}', stop_present: 'أوقف عرض الشاشة',
  loading: 'جارٍ التحميل…', uploading: 'جارٍ الرفع…', play: 'تشغيل', pause: 'إيقاف مؤقت',
  up_not_pdf: 'الملف ليس PDF صالحًا', up_too_large: 'الملف أكبر من الحد المسموح', up_too_many: 'وصلت الحد الأقصى للملفات في هذه الجلسة',
  link_private: 'الملف خاص — اجعل الرابط «أي شخص لديه الرابط» ثم أعد المحاولة', link_bad: 'الرابط غير مدعوم (استخدم رابط Google Drive أو رابط https مباشر)', link_unreachable: 'تعذّر الوصول للرابط',
  proj_hint: 'سيظهر العرض على شاشة الخيمة، ويمكن للجميع تكبيره.',
  // إعدادات
  set_title: 'الإعدادات', set_lang: 'اللغة', set_devices: 'الأجهزة', set_mic: 'الميكروفون', set_cam: 'الكاميرا', set_spk: 'السماعة', set_vq: 'جودة الفيديو',
  vq_low: 'منخفضة (أخف)', vq_med: 'متوسطة', vq_high: 'عالية', set_gfx: 'جودة الرسوميات', gfx_low: 'خفيفة', gfx_high: 'عالية', set_music: 'موسيقى وأجواء الخيمة', set_volume: 'مستوى صوت الجميع',
  set_default: 'الافتراضي',
  hint_move: 'مشي', hint_run: 'ركض', hint_drag: 'اسحب للدوران', hint_emote: 'تحيّات', hint_sit: 'جلوس',
  // ألعاب
  tb_games: 'الألعاب', games_title: 'ألعاب المخيم', siga_name: 'السيجة', siga_desc: 'لعبة شعبية قديمة تُرسم على الرمل: لاعبان، 12 حجرًا لكل واحد، والأكل بالقفز.', hs_name: 'الغميضة',
  hs_desc: 'الباحث يعدّ ثم يبحث، والبقية يختبئون خلف النخيل والكثبان. اقترب منهم لتكتشفهم!',
  sit_white: 'اجلس (الأبيض)', sit_black: 'اجلس (الأسود)', stand_up: 'قم من اللعب', siga_white: 'الأبيض', siga_black: 'الأسود', siga_wait: 'بانتظار لاعب ثانٍ…', siga_your_turn: 'دورك!', siga_their_turn: 'دور {n}', siga_continue: 'كمّل الأكل بنفس الحجر!',
  siga_won: '🏆 فاز {n}', siga_draw: 'تعادل', siga_again: 'العب مرة أخرى', siga_spectating: 'أنت تتفرّج — شجّع اللاعبين بالتحيّات 👏', siga_rules: 'حرّك حجرًا خطوة واحدة (أعلى/أسفل/يمين/يسار). إن أمكنك الأكل بالقفز فوق حجر الخصم فهو إجباري.',
  hs_join: 'انضم للعبة', hs_leave: 'اخرج من اللعبة', hs_start: 'ابدأ الجولة', hs_players: 'المنضمّون ({n})', hs_need: 'تحتاج لاعبين اثنين على الأقل',
  hs_you_seeker: 'أنت الباحث! أغمض عينيك وعدّ…', hs_count_seeker: 'يختبئ الآخرون الآن… {s}', hs_count_hider: 'اختبئ بسرعة! {n} يعدّ… {s}', hs_hunting_seeker: 'ابحث! اقترب من المختبئ واضغط F أو زر «اكتشف»', hs_hunting_hider: 'اختبئ! لا تتحرك قرب {n}', hs_time_left: 'الوقت {s}ث', hs_found_count: 'مكتشَفون {a} من {b}',
  hs_tag: 'اكتشف! (F)', hs_found_me: 'اكتشفك الباحث — تفرّج على الباقين', hs_seeker_won: '🔍 فاز الباحث {n}! اكتشف الجميع', hs_hiders_won: '🏆 فاز المختبئون! نجوا من {n}', hs_hot3: '🔥 حار جدًا!', hs_hot2: '♨ دافئ', hs_hot1: '🌬 بارد', hs_hot0: '❄ بعيد جدًا', hs_in_game: 'في اللعبة',
  perf_down: 'جهازك بطيء قليلًا — خفّضنا الرسوميات تلقائيًا', gfx_min: 'أدنى (للجوالات القديمة)', tc_hint: 'اسحب الشاشة للدوران، وقرّب بإصبعين',
  race_name: 'سباق الهجن', race_desc: 'رياضة تراثية سعودية: اركض بهجينك! اضغط يمين/يسار بالتناوب بأسرع ما تقدر (التكرار من جهة واحدة بطيء). حتى 10 متسابقين والبقية يشجعون.',
  race_join: 'انضم للسباق', race_leave: 'اخرج من السباق', race_start: 'ابدأ السباق', race_players: 'المتسابقون ({n}/10)', race_need: 'تحتاج متسابقين اثنين على الأقل',
  race_go: 'انطلق!', race_ready: 'استعد…', race_tap_hint: 'بالتناوب: يسار ← يمين ← يسار… (A / D أو ← / → أو مسافة)', race_left: 'يسار', race_right: 'يمين',
  race_results: 'نتيجة السباق', race_time: '{s}ث', race_dnf: 'لم يكمل', race_you_won: '🏆 فزت بالسباق! مبروك', race_running: 'السباق جارٍ — شجّع المتسابقين', race_goto: 'اذهب للمضمار', race_cam: 'كاميرا السباق', race_finish_line: 'خط النهاية', race_start_line: 'خط البداية', race_rank: 'المركز {n}',
  err_race_full: 'السباق ممتلئ (10 متسابقين)',
  err_seats_full: 'المقعدان ممتلئان', err_not_your_turn: 'ليس دورك', err_bad_move: 'حركة غير مسموحة (تذكّر: الأكل إجباري)', err_need_players: 'تحتاج لاعبين اثنين على الأقل', err_nobody_near: 'لا أحد قريب منك',
} as const;
export type Key = keyof typeof AR;

export const EN: Record<Key, string> = {
  app_tagline: 'Your meetings in a 3D Saudi desert camp',
  tab_join: 'Join with code', tab_admin: '🔑 Host',
  your_name: 'Your name', name_ph: 'e.g. Abu Saud', session_code: 'Session code', admin_password: 'Host password',
  character: 'Character', man: 'Man', woman: 'Woman', thobe_color: 'Thobe colour', abaya_color: 'Abaya colour',
  headwear: 'Headwear', hijab: 'Hijab', hijab_color: 'Hijab colour', outer: 'Outer layer', beard: 'Beard', hair: 'Hair',
  skin: 'Skin tone', glasses: 'Glasses', shoes: 'Shoes', accessories: 'Accessories', watch: 'Watch',
  enter_camp: 'Enter the camp', start_session: 'Start a new session', entering: 'Entering…',
  note_user: 'No personal data is requested. Your name only shows during the session.', note_admin: 'A fresh code is generated for every session and expires with it.',
  loading_camp: 'Preparing the camp…', language: 'العربية',
  err_bad_password: 'Wrong host password', err_bad_code: 'Invalid code, or the session has ended', err_locked: 'The room is locked by the host',
  err_full: 'The room is full (20 participants max)', err_rate: 'Too many attempts, try again in a minute', err_gone: 'Session expired',
  err_forbidden: 'You do not have permission for this', err_busy: 'The projector is busy with another source', err_nofile: 'File not found', err_bad_url: 'Invalid link',
  err_connect: 'Could not reach the server', err_dropped: 'Connection to the server was lost', err_generic: 'Something went wrong',
  kicked: 'The host removed you from the session', ended: 'The host ended the session', ended_other: 'The session ended',
  code_label: 'Session code', copy_invite: 'Copy invite link', copy_code: 'Copy code', copied: 'Copied ✓', locked_badge: '🔒 Locked',
  role_owner: 'Host', role_mod: 'Moderator', role_user: 'Participant', you: 'you', offline: 'offline',
  tb_people: 'People', tb_mic: 'Mic', tb_cam: 'Camera', tb_share: 'Share screen', tb_chat: 'Chat', tb_projector: 'Projector',
  tb_settings: 'Settings', tb_lock: 'Lock room', tb_unlock: 'Unlock room', tb_end: 'End session', tb_leave: 'Leave', tb_manage: 'Manage',
  confirm_end: 'End the session for everyone? The code will expire.', confirm_kick: 'Remove {n} from the session?',
  reconnecting: 'Connection lost… retrying',
  participants: 'Participants', promote: 'Make moderator', demote: 'Remove moderator', kick: 'Remove from session', dm: 'Private message',
  mute: 'Mute', stop_cam: 'Stop camera', stop_screen: 'Stop sharing', allow_screen: 'Allow screen sharing', deny_screen: 'Block screen sharing',
  restrict_mic: 'Block microphone', allow_mic: 'Allow microphone', restrict_cam: 'Block camera', allow_cam: 'Allow camera',
  mng_title: 'Media controls', mute_all: 'Mute everyone', everyone_mic: 'Everyone’s mic', everyone_cam: 'Everyone’s camera', everyone_screen: 'Everyone’s screen share',
  allowed: 'Allowed', blocked: 'Blocked',
  chat_title: 'Chat', chat_ph: 'Type a message…', send: 'Send', to_all: 'To: Everyone', to_user: 'To: {n} (private)', private: 'private',
  media_unavailable: 'Voice and video are unavailable right now', perm_denied: 'You do not have permission', device_denied: 'The browser blocked access to the device', device_missing: 'No microphone/camera found',
  forced_mic: 'You were muted by the host/moderator', forced_cam: 'Your camera was stopped by the host', forced_screen: 'Your screen share was stopped by the host',
  perm_changed: 'Your permissions changed', you_cam: 'Your camera', presenting: 'is presenting', screen_of: '{n}’s screen', close: 'Close', enlarge: 'Enlarge',
  mic_off_all: 'Microphones are disabled for everyone', speaking: 'speaking',
  proj_title: 'Projector', proj_idle: 'The projector is empty', proj_open: 'Full view', proj_stop: 'Stop presenting',
  pdf_upload: 'Upload PDF', pdf_link: 'PDF or Google Drive link', pdf_show: 'Show', video_upload: 'Upload video', video_url: 'Direct video link (mp4/webm)',
  page: 'Page', of: 'of', prev: 'Previous', next: 'Next', present_mine: 'Present my screen on the projector', show_screen_of: 'Show {n}’s screen', stop_present: 'Stop screen presentation',
  loading: 'Loading…', uploading: 'Uploading…', play: 'Play', pause: 'Pause',
  up_not_pdf: 'That is not a valid PDF', up_too_large: 'The file is larger than allowed', up_too_many: 'File limit reached for this session',
  link_private: 'The file is private — set the link to “Anyone with the link” and retry', link_bad: 'Unsupported link (use a Google Drive link or a direct https link)', link_unreachable: 'The link could not be reached',
  proj_hint: 'The presentation shows on the tent screen and anyone can enlarge it.',
  set_title: 'Settings', set_lang: 'Language', set_devices: 'Devices', set_mic: 'Microphone', set_cam: 'Camera', set_spk: 'Speaker', set_vq: 'Video quality',
  vq_low: 'Low (lighter)', vq_med: 'Medium', vq_high: 'High', set_gfx: 'Graphics quality', gfx_low: 'Light', gfx_high: 'High', set_music: 'Tent music and ambience', set_volume: 'Everyone’s volume',
  set_default: 'Default',
  hint_move: 'move', hint_run: 'run', hint_drag: 'drag to rotate', hint_emote: 'greetings', hint_sit: 'sit',
  tb_games: 'Games', games_title: 'Camp games', siga_name: 'Siga', siga_desc: 'A classic Gulf game drawn in the sand: two players, 12 stones each, capture by jumping.', hs_name: 'Hide & Seek',
  hs_desc: 'The seeker counts, then hunts while everyone hides behind palms and dunes. Get close to find them!',
  sit_white: 'Sit (White)', sit_black: 'Sit (Black)', stand_up: 'Leave the game', siga_white: 'White', siga_black: 'Black', siga_wait: 'Waiting for a second player…', siga_your_turn: 'Your turn!', siga_their_turn: '{n}’s turn', siga_continue: 'Keep capturing with the same stone!',
  siga_won: '🏆 {n} wins', siga_draw: 'Draw', siga_again: 'Play again', siga_spectating: 'You are watching — cheer with greetings 👏', siga_rules: 'Move a stone one step (up/down/left/right). If you can jump over an enemy stone, you must.',
  hs_join: 'Join the game', hs_leave: 'Leave the game', hs_start: 'Start round', hs_players: 'Players ({n})', hs_need: 'At least two players needed',
  hs_you_seeker: 'You are the seeker! Close your eyes and count…', hs_count_seeker: 'Others are hiding now… {s}', hs_count_hider: 'Hide quickly! {n} is counting… {s}', hs_hunting_seeker: 'Hunt! Get close to a hider and press F or “Tag”', hs_hunting_hider: 'Hide! Stay away from {n}', hs_time_left: '{s}s left', hs_found_count: 'Found {a} of {b}',
  hs_tag: 'Tag! (F)', hs_found_me: 'You were found — watch the others', hs_seeker_won: '🔍 Seeker {n} wins! Everyone was found', hs_hiders_won: '🏆 Hiders win! They escaped {n}', hs_hot3: '🔥 Very hot!', hs_hot2: '♨ Warm', hs_hot1: '🌬 Cold', hs_hot0: '❄ Far away', hs_in_game: 'in game',
  perf_down: 'Your device is a bit slow — graphics were lowered automatically', gfx_min: 'Minimum (older phones)', tc_hint: 'Drag to look around, pinch to zoom',
  race_name: 'Camel Race', race_desc: 'A heritage Saudi sport: race your camel! Tap left/right alternately as fast as you can (repeating one side is slow). Up to 10 racers, everyone else cheers.',
  race_join: 'Join the race', race_leave: 'Leave the race', race_start: 'Start race', race_players: 'Racers ({n}/10)', race_need: 'At least two racers are needed',
  race_go: 'Go!', race_ready: 'Get ready…', race_tap_hint: 'Alternate: left → right → left… (A / D, ← / →, or Space)', race_left: 'Left', race_right: 'Right',
  race_results: 'Race results', race_time: '{s}s', race_dnf: 'Did not finish', race_you_won: '🏆 You won the race! Congratulations', race_running: 'Race in progress — cheer the racers', race_goto: 'Go to the track', race_cam: 'Race camera', race_finish_line: 'Finish', race_start_line: 'Start', race_rank: 'Place {n}',
  err_race_full: 'The race is full (10 racers)',
  err_seats_full: 'Both seats are taken', err_not_your_turn: 'Not your turn', err_bad_move: 'Illegal move (captures are mandatory)', err_need_players: 'At least two players needed', err_nobody_near: 'Nobody is close to you',
};

export function t(k: Key, vars?: Record<string, string>): string {
  const lang = useGame.getState().settings.lang;
  let s = (lang === 'en' ? EN[k] : AR[k]) as string;
  if (vars) for (const [a, b] of Object.entries(vars)) s = s.replace(`{${a}}`, b);
  return s;
}
export function useT() {
  const lang = useGame((s) => s.settings.lang);
  return (k: Key, vars?: Record<string, string>) => {
    let s = (lang === 'en' ? EN[k] : AR[k]) as string;
    if (vars) for (const [a, b] of Object.entries(vars)) s = s.replace(`{${a}}`, b);
    return s;
  };
}
export const ERR_KEY: Record<string, Key> = {
  bad_password: 'err_bad_password', bad_code: 'err_bad_code', locked: 'err_locked', full: 'err_full', rate: 'err_rate', gone: 'err_gone',
  forbidden: 'err_forbidden', busy: 'err_busy', nofile: 'err_nofile', bad_url: 'err_bad_url',
  seats_full: 'err_seats_full', race_full: 'err_race_full', not_your_turn: 'err_not_your_turn', bad_move: 'err_bad_move', need_players: 'err_need_players', nobody_near: 'err_nobody_near',
};
export function applyLang(lang: 'ar' | 'en') { document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; document.title = lang === 'ar' ? 'IOPsy — اجتماعات ثلاثية الأبعاد' : 'IOPsy — 3D meetings'; }

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
