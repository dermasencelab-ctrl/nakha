import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  Database,
  Lock,
  Share2,
  FileCheck,
  Cookie,
  RefreshCw,
  User,
  Mail,
  ChevronDown,
  Calendar,
  MessageCircle,
} from 'lucide-react';

// محتوى سياسة الخصوصية - منظّم كأقسام قابلة للطي
const sections = [
  {
    id: 'intro',
    icon: Shield,
    title: 'المقدمة',
    color: 'orange',
    content: (
      <>
        <p>
          نحن في <strong>نَكهة</strong> نحترم خصوصيتك ونلتزم بحماية بياناتك
          الشخصية. توضّح هذه السياسة كيف نجمع ونستخدم ونحمي معلوماتك عند
          استخدام منصتنا.
        </p>
      </>
    ),
  },
  {
    id: 'data',
    icon: Database,
    title: 'البيانات التي نجمعها',
    color: 'blue',
    content: (
      <>
        <p className="mb-3">نجمع البيانات التالية عند استخدامك للمنصة:</p>
        <div className="space-y-3">
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3">
            <p className="font-black text-orange-700 text-xs mb-2 flex items-center gap-1.5">
              <span className="text-base">👩‍🍳</span> للطباخات
            </p>
            <ul className="text-xs text-stone-700 space-y-1 mr-4 list-disc">
              <li>الاسم الكامل والبريد الإلكتروني</li>
              <li>رقم الهاتف والحي</li>
              <li>الصور الشخصية وصور الأطباق</li>
              <li>معلومات المحفظة (رصيد المعاملات)</li>
            </ul>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3">
            <p className="font-black text-blue-700 text-xs mb-2 flex items-center gap-1.5">
              <span className="text-base">🛒</span> للزبائن
            </p>
            <ul className="text-xs text-stone-700 space-y-1 mr-4 list-disc">
              <li>الاسم ورقم الهاتف</li>
              <li>العنوان (اختياري)</li>
              <li>سجل الطلبات والتقييمات</li>
            </ul>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'usage',
    icon: FileCheck,
    title: 'كيف نستخدم بياناتك',
    color: 'green',
    content: (
      <>
        <p className="mb-3">نستخدم بياناتك حصراً لتوفير خدمات المنصة:</p>
        <ul className="text-xs text-stone-700 space-y-2 mr-4 list-disc">
          <li>معالجة الطلبات والتواصل بينك وبين الطباخة</li>
          <li>تحسين تجربة المستخدم وتطوير خدماتنا</li>
          <li>منع الاحتيال وضمان أمان المنصة</li>
          <li>إرسال إشعارات مهمة حول طلباتك</li>
        </ul>
      </>
    ),
  },
  {
    id: 'security',
    icon: Lock,
    title: 'حماية البيانات',
    color: 'purple',
    content: (
      <>
        <p className="mb-3">نستخدم تقنيات أمان متقدمة لحماية بياناتك:</p>
        <ul className="text-xs text-stone-700 space-y-2 mr-4 list-disc">
          <li>
            <strong>التشفير</strong> عند النقل والتخزين
          </li>
          <li>
            <strong>مصادقة آمنة</strong> عبر Firebase Authentication
          </li>
          <li>
            مراجعة دورية للأنظمة وتحديثات أمنية مستمرة
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'sharing',
    icon: Share2,
    title: 'مشاركة البيانات',
    color: 'amber',
    content: (
      <>
        <div className="bg-red-50 border-r-4 border-red-500 rounded-2xl p-3 mb-3">
          <p className="text-xs font-black text-red-700">
            🚫 لا نبيع بياناتك لأي طرف ثالث، أبداً.
          </p>
        </div>
        <p className="mb-2">قد نشارك بيانات محدودة فقط مع:</p>
        <ul className="text-xs text-stone-700 space-y-2 mr-4 list-disc">
          <li>
            <strong>الطباخة المعنية بطلبك</strong> (اسمك ورقم هاتفك فقط)
          </li>
          <li>
            <strong>مقدّمي الخدمات التقنية</strong> (Firebase, Cloudinary)
            لتشغيل المنصة
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'rights',
    icon: User,
    title: 'حقوقك',
    color: 'pink',
    content: (
      <>
        <p className="mb-3">يحق لك في أي وقت:</p>
        <div className="space-y-2">
          <RightCard emoji="👀" text="الاطلاع على بياناتك المخزّنة" />
          <RightCard emoji="✏️" text="طلب تعديل أي معلومة" />
          <RightCard emoji="🗑️" text="طلب حذف حسابك بالكامل" />
          <RightCard emoji="📤" text="الحصول على نسخة من بياناتك" />
        </div>
        <p className="text-xs text-stone-600 mt-3 leading-relaxed">
          للتواصل بشأن حقوقك، راسلنا على{' '}
          <a
            href="mailto:contact@nakha.dz"
            className="font-black text-orange-600 underline"
          >
            contact@nakha.dz
          </a>
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    icon: Cookie,
    title: 'ملفات تعريف الارتباط',
    color: 'orange',
    content: (
      <>
        <p>
          نستخدم ملفات تعريف الارتباط (Cookies) لحفظ تفضيلاتك مثل محتويات السلة
          ورقم هاتفك في صفحة "طلباتي"، مما يُسهّل تجربتك ويحفظ بياناتك بين
          الزيارات.
        </p>
      </>
    ),
  },
  {
    id: 'updates',
    icon: RefreshCw,
    title: 'تحديثات السياسة',
    color: 'blue',
    content: (
      <>
        <p>
          قد نحدّث هذه السياسة من وقت لآخر. عند إجراء تغييرات جوهرية، سنُعلمك
          عبر المنصة أو البريد الإلكتروني. ننصحك بمراجعتها بشكل دوري.
        </p>
      </>
    ),
  },
];

const Privacy = () => {
  // أول قسم مفتوح افتراضياً
  const [openSection, setOpenSection] = useState('intro');

  const toggleSection = (id) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF8F0] pb-24 md:pb-8">
      {/* ============================================ */}
      {/* Header */}
      {/* ============================================ */}
      <header className="sticky top-16 z-20 bg-[#FFF8F0]/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            to="/"
            className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-90 transition"
          >
            <ArrowRight className="w-4 h-4 text-stone-700" strokeWidth={2.4} />
          </Link>
          <h1 className="text-lg font-extrabold text-stone-800">
            سياسة الخصوصية
          </h1>
        </div>
      </header>

      {/* ============================================ */}
      {/* Hero مختصر */}
      {/* ============================================ */}
      <section className="max-w-3xl mx-auto px-4 pt-4 pb-6">
        <div className="bg-gradient-to-bl from-blue-50 via-white to-stone-50 rounded-3xl p-5 border border-blue-100 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/30 flex-shrink-0">
              <Shield className="w-5 h-5 text-white" strokeWidth={2.3} />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-800 leading-tight">
                خصوصيتك أمانة
              </h2>
              <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" strokeWidth={2.4} />
                آخر تحديث: أبريل 2026
              </p>
            </div>
          </div>
          <p className="text-sm text-stone-700 leading-relaxed">
            نلتزم بحماية بياناتك الشخصية والتعامل معها بالشفافية والاحترام
            الكاملَين. هذه السياسة تشرح كل شيء ببساطة.
          </p>
        </div>
      </section>

      {/* ============================================ */}
      {/* الأقسام القابلة للطي */}
      {/* ============================================ */}
      <section className="max-w-3xl mx-auto px-4 space-y-2 mb-6">
        {sections.map((section, idx) => (
          <AccordionSection
            key={section.id}
            section={section}
            index={idx}
            isOpen={openSection === section.id}
            onToggle={() => toggleSection(section.id)}
          />
        ))}
      </section>

      {/* ============================================ */}
      {/* بطاقة تواصل */}
      {/* ============================================ */}
      <section className="max-w-3xl mx-auto px-4 mb-6">
        <div className="bg-gradient-to-bl from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-3xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <MessageCircle
                className="w-5 h-5 text-amber-600"
                strokeWidth={2.3}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-stone-800 mb-1">
                عندك سؤال؟
              </p>
              <p className="text-xs text-stone-600 mb-3 leading-relaxed">
                نحن مستعدون للإجابة على أي استفسار يخص خصوصيتك
              </p>
              <a
                href="mailto:contact@nakha.dz"
                className="inline-flex items-center gap-1.5 bg-white text-orange-600 font-black text-xs px-3 py-2 rounded-xl shadow-sm hover:shadow active:scale-95 transition-all"
              >
                <Mail className="w-3.5 h-3.5" strokeWidth={2.5} />
                راسلنا
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* روابط الأسفل */}
      {/* ============================================ */}
      <section className="max-w-3xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-3 text-[11px]">
          <Link
            to="/about"
            className="text-stone-600 hover:text-orange-600 font-bold"
          >
            عن نَكهة
          </Link>
          <span className="text-stone-300">•</span>
          <Link
            to="/"
            className="text-stone-600 hover:text-orange-600 font-bold"
          >
            الرئيسية
          </Link>
        </div>
        <p className="text-[10px] text-stone-400 mt-2">© 2026 نَكهة</p>
      </section>
    </div>
  );
};

/* ============================================ */
/* قسم قابل للطي */
/* ============================================ */
function AccordionSection({ section, index, isOpen, onToggle }) {
  const Icon = section.icon;
  const colors = {
    orange: 'bg-orange-100 text-orange-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
    pink: 'bg-pink-100 text-pink-600',
  };

  return (
    <div
      className={`bg-white rounded-3xl shadow-sm overflow-hidden transition-all ${
        isOpen ? 'shadow-md' : ''
      }`}
    >
      {/* Header - قابل للنقر */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 active:bg-stone-50 transition"
      >
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            colors[section.color]
          }`}
        >
          <Icon className="w-4 h-4" strokeWidth={2.4} />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="text-[10px] font-bold text-stone-400">
            القسم {index + 1}
          </p>
          <h3 className="text-sm font-extrabold text-stone-800 mt-0.5">
            {section.title}
          </h3>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-stone-400 flex-shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
          strokeWidth={2.4}
        />
      </button>

      {/* Content - قابل للطي */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 pt-0 border-t border-stone-100 text-sm text-stone-700 leading-relaxed">
          <div className="pt-3">{section.content}</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================ */
/* بطاقة حق (للمستخدم) */
/* ============================================ */
function RightCard({ emoji, text }) {
  return (
    <div className="flex items-center gap-2 bg-stone-50 rounded-xl p-2.5">
      <span className="text-lg">{emoji}</span>
      <p className="text-xs font-bold text-stone-700">{text}</p>
    </div>
  );
}

export default Privacy;