// ============================================
// إعدادات نَكهة - يمكن تعديلها بسهولة
// ============================================

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

// 🎁 عرض المؤسسين (Founding Members)
export const FOUNDING_MEMBERS = {
  enabled: true,                    // تفعيل/إيقاف العرض
  maxCount: 15,                     // عدد الطباخات المؤسسات
  welcomeBalance: 1000,             // الرصيد الترحيبي (دج)
  freeOrders: 3,                    // عدد الطلبات بدون عمولة
  maxFreeOrderAmount: 3000,         // أقصى قيمة طلب يستفيد من الإعفاء
};