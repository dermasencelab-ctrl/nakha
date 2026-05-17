// ============================================
// إعدادات نَكهة - يمكن تعديلها بسهولة
// ============================================

// 📞 Admin / support WhatsApp number (international format, no +)
export const ADMIN_PHONE = '213549741892';

// 💳 معلومات الدفع (BaridiMob)
export const PAYMENT_INFO = {
  rip: '00799999004412274611',  // 
  accountName: 'نَكهة - منصة الأكل المنزلي',
  bankName: 'بريدي موب (Algérie Poste)',
};

// 💰 إعدادات العمولة
export const COMMISSION_RATE = 0.09; // 9%

// 💵 مبالغ الشحن السريعة (دج)
export const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

// 📉 الحد الأدنى للشحن المخصص
export const MIN_TOPUP_AMOUNT = 500;

// ⚠️ الحد الذي يظهر تحته تحذير "رصيدك منخفض"
export const LOW_BALANCE_WARNING = 200;

// 🚫 أقصى رصيد سالب مسموح به (دج)
export const MAX_NEGATIVE_BALANCE = -200;

// 🎬 وضع العرض التوضيحي (Demo Mode)
// When true, the app overlays demo chefs/dishes (marked demo: true) on top
// of real Firestore data — used only for product/TikTok video recording.
// Set to false to fully hide all demo content.
export const DEMO_MODE = true;

// 🔐 نظام الوصول المبكر (Early Access)
export const EARLY_ACCESS = {
  enabled: true,
  partnerCode: 'NAKHA2026',
  betaCode: 'BETA2026',
  maxPartnerCooks: 15,
};

// 🎟️ نظام الدعوات (Invite Codes)
export const INVITE_SYSTEM = {
  enabled: true,
  maxCodes: 15,
  codePrefix: 'NAKHA',
  expirationDays: 30,
  requireAssignment: false,
  tokenTTLMinutes: 60,
  roles: ['cook'],
  campaign: 'founding_bechar_2026',
};

// 🎁 عرض المؤسسين (Founding Members)
export const FOUNDING_MEMBERS = {
  enabled: true,                    // تفعيل/إيقاف العرض
  maxCount: 15,                     // عدد الطباخات المؤسسات
  welcomeBalance: 1000,             // الرصيد الترحيبي (دج)
  freeOrders: 3,                    // عدد الطلبات بدون عمولة
  maxFreeOrderAmount: 3000,         // أقصى قيمة طلب يستفيد من الإعفاء
};