import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
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
  ChefHat,
  Heart,
} from 'lucide-react';

const sections = [
  {
    id: 'intro',
    icon: Shield,
    title: 'المقدمة',
    accent: '#F97316',
    content: (
      <>
        <p className="text-sm text-stone-700 leading-relaxed">
          نحن في <strong className="text-orange-700">نَكهة</strong> نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية.
          توضّح هذه السياسة كيف نجمع ونستخدم ونحمي معلوماتك عند استخدام منصتنا.
        </p>
      </>
    ),
  },
  {
    id: 'data',
    icon: Database,
    title: 'البيانات التي نجمعها',
    accent: '#3B82F6',
    content: (
      <>
        <p className="text-sm text-stone-700 mb-3">نجمع البيانات التالية عند استخدامك للمنصة:</p>
        <div className="space-y-2">
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
    accent: '#22C55E',
    content: (
      <>
        <p className="text-sm text-stone-700 mb-3">نستخدم بياناتك حصراً لتوفير خدمات المنصة:</p>
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
    accent: '#8B5CF6',
    content: (
      <>
        <p className="text-sm text-stone-700 mb-3">نستخدم تقنيات أمان متقدمة لحماية بياناتك:</p>
        <ul className="text-xs text-stone-700 space-y-2 mr-4 list-disc">
          <li><strong>التشفير</strong> عند النقل والتخزين</li>
          <li><strong>مصادقة آمنة</strong> عبر Firebase Authentication</li>
          <li>مراجعة دورية للأنظمة وتحديثات أمنية مستمرة</li>
        </ul>
      </>
    ),
  },
  {
    id: 'sharing',
    icon: Share2,
    title: 'مشاركة البيانات',
    accent: '#F59E0B',
    content: (
      <>
        <div className="bg-red-50 border-r-4 border-red-500 rounded-2xl p-3 mb-3">
          <p className="text-xs font-black text-red-700">🚫 لا نبيع بياناتك لأي طرف ثالث، أبداً.</p>
        </div>
        <p className="text-sm text-stone-700 mb-2">قد نشارك بيانات محدودة فقط مع:</p>
        <ul className="text-xs text-stone-700 space-y-2 mr-4 list-disc">
          <li><strong>الطباخة المعنية بطلبك</strong> (اسمك ورقم هاتفك فقط)</li>
          <li><strong>مقدّمي الخدمات التقنية</strong> (Firebase, Cloudinary) لتشغيل المنصة</li>
        </ul>
      </>
    ),
  },
  {
    id: 'rights',
    icon: User,
    title: 'حقوقك',
    accent: '#EC4899',
    content: (
      <>
        <p className="text-sm text-stone-700 mb-3">يحق لك في أي وقت:</p>
        <div className="space-y-2">
          <RightCard emoji="👀" text="الاطلاع على بياناتك المخزّنة" />
          <RightCard emoji="✏️" text="طلب تعديل أي معلومة" />
          <RightCard emoji="🗑️" text="طلب حذف حسابك بالكامل" />
          <RightCard emoji="📤" text="الحصول على نسخة من بياناتك" />
        </div>
        <p className="text-xs text-stone-600 mt-3 leading-relaxed">
          للتواصل بشأن حقوقك، راسلنا على{' '}
          <a href="mailto:contact@nakha.dz" className="font-black text-orange-600 underline">
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
    accent: '#F97316',
    content: (
      <>
        <p className="text-sm text-stone-700 leading-relaxed">
          نستخدم ملفات تعريف الارتباط (Cookies) لحفظ تفضيلاتك مثل محتويات السلة،
          مما يُسهّل تجربتك ويحفظ بياناتك بين الزيارات.
        </p>
      </>
    ),
  },
  {
    id: 'updates',
    icon: RefreshCw,
    title: 'تحديثات السياسة',
    accent: '#3B82F6',
    content: (
      <>
        <p className="text-sm text-stone-700 leading-relaxed">
          قد نحدّث هذه السياسة من وقت لآخر. عند إجراء تغييرات جوهرية، سنُعلمك
          عبر المنصة أو البريد الإلكتروني. ننصحك بمراجعتها بشكل دوري.
        </p>
      </>
    ),
  },
];

const Privacy = () => {
  const [openSection, setOpenSection] = useState('intro');

  const toggle = (id) => setOpenSection(openSection === id ? null : id);

  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF5E6] pb-24 md:pb-8">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-fade-up   { animation: fadeUp 0.6s ease both; }
        .anim-fade-up-2 { animation: fadeUp 0.6s 0.12s ease both; }
        .grain-overlay {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
        }
      `}</style>

      {/* ═══════════════════════════════════════════ */}
      {/* DARK HERO */}
      {/* ═══════════════════════════════════════════ */}
      <section className="relative bg-[#1C0A00] overflow-hidden pt-10 pb-20">
        <div className="grain-overlay absolute inset-0 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(234,88,12,0.2) 0%, transparent 70%)' }} />

        <div className="relative max-w-3xl mx-auto px-5">
          <Link to="/" className="inline-flex items-center gap-2 text-stone-400 hover:text-white text-xs font-bold mb-6 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5 rotate-180" strokeWidth={2.5} />
            الرئيسية
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl"
                 style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
              <Shield className="w-7 h-7 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="anim-fade-up text-3xl md:text-4xl font-black text-white leading-tight">
                سياسة{' '}
                <span style={{ background: 'linear-gradient(135deg, #FBBF24, #F97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  الخصوصية
                </span>
              </h1>
              <p className="anim-fade-up-2 text-stone-400 text-xs mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" strokeWidth={2.4} />
                آخر تحديث: أبريل 2026
              </p>
            </div>
          </div>

          <p className="anim-fade-up-2 text-stone-400 text-sm leading-relaxed mt-4 max-w-lg">
            نلتزم بحماية بياناتك الشخصية والتعامل معها بالشفافية والاحترام الكاملَين.
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
          <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="w-full h-12" fill="#FFF5E6">
            <path d="M0,48 C360,0 1080,0 1440,48 L1440,48 L0,48 Z" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* INTRO CARD */}
      {/* ═══════════════════════════════════════════ */}
      <section className="max-w-3xl mx-auto px-4 -mt-2 mb-6">
        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-5">
          <p className="text-sm text-stone-600 leading-relaxed">
            هذه السياسة تشرح كل شيء ببساطة. اضغط على أي قسم لقراءة تفاصيله.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* ACCORDION */}
      {/* ═══════════════════════════════════════════ */}
      <section className="max-w-3xl mx-auto px-4 space-y-2 mb-6">
        {sections.map((section, idx) => (
          <AccordionSection
            key={section.id}
            section={section}
            index={idx}
            isOpen={openSection === section.id}
            onToggle={() => toggle(section.id)}
          />
        ))}
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* CONTACT CARD */}
      {/* ═══════════════════════════════════════════ */}
      <section className="max-w-3xl mx-auto px-4 mb-8">
        <div className="rounded-3xl p-5 border border-amber-200"
             style={{ background: 'linear-gradient(135deg, #FFF7ED, #FEF3C7)' }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <MessageCircle className="w-5 h-5 text-amber-600" strokeWidth={2.3} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-stone-800 mb-1">عندك سؤال؟</p>
              <p className="text-xs text-stone-600 mb-3 leading-relaxed">
                نحن مستعدون للإجابة على أي استفسار يخص خصوصيتك
              </p>
              <a href="mailto:contact@nakha.dz"
                 className="inline-flex items-center gap-1.5 bg-white text-orange-600 font-black text-xs px-3 py-2 rounded-xl shadow-sm hover:shadow active:scale-95 transition-all">
                <Mail className="w-3.5 h-3.5" strokeWidth={2.5} />
                راسلنا
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ═══════════════════════════════════════════ */}
      <footer className="max-w-3xl mx-auto px-4 text-center py-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #FBBF24, #F97316)' }}>
            <ChefHat className="w-3 h-3 text-white" strokeWidth={2.3} />
          </div>
          <span className="font-black text-stone-600 text-xs">نَكهة</span>
        </div>
        <div className="flex items-center justify-center gap-3 text-[11px] mb-2 flex-wrap">
          <Link to="/terms"   className="text-stone-500 hover:text-orange-600 font-bold transition-colors">الشروط والأحكام</Link>
          <span className="text-stone-300">•</span>
          <Link to="/about"   className="text-stone-500 hover:text-orange-600 font-bold transition-colors">عن نَكهة</Link>
          <span className="text-stone-300">•</span>
          <Link to="/"        className="text-stone-500 hover:text-orange-600 font-bold transition-colors">الرئيسية</Link>
        </div>
        <p className="text-[10px] text-stone-400">© 2026 نَكهة</p>
      </footer>
    </div>
  );
};

function AccordionSection({ section, index, isOpen, onToggle }) {
  const Icon = section.icon;
  return (
    <div className={`bg-white rounded-3xl shadow-sm border overflow-hidden transition-all duration-200 ${isOpen ? 'border-stone-200 shadow-md' : 'border-stone-100'}`}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 active:bg-stone-50 transition-colors"
      >
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
             style={{ background: section.accent + '18', color: section.accent }}>
          <Icon className="w-4 h-4" strokeWidth={2.4} />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="text-[10px] font-bold text-stone-400">القسم {index + 1}</p>
          <h3 className="text-sm font-extrabold text-stone-800 mt-0.5">{section.title}</h3>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-stone-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          strokeWidth={2.4}
        />
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 border-t border-stone-100">
          <div className="pt-3">{section.content}</div>
        </div>
      </div>
    </div>
  );
}

function RightCard({ emoji, text }) {
  return (
    <div className="flex items-center gap-2 bg-stone-50 rounded-xl p-2.5">
      <span className="text-lg">{emoji}</span>
      <p className="text-xs font-bold text-stone-700">{text}</p>
    </div>
  );
}

export default Privacy;
