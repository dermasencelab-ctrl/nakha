import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  ShoppingBag,
  RotateCcw,
  CreditCard,
  Shield,
  User,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Calendar,
  Mail,
  CheckCircle,
  ChefHat,
} from 'lucide-react';

const sections = [
  {
    id: 'eligibility',
    icon: User,
    title: 'شروط الاستخدام',
    accent: '#F97316',
    content: (
      <>
        <p className="text-sm text-stone-700 mb-3">
          باستخدامك منصة <strong className="text-orange-700">نَكهة</strong>، فإنك تقرّ بقبول هذه الشروط والالتزام بها كاملةً.
        </p>
        <div className="space-y-2">
          <TermCard emoji="✅" text="يحق لأي شخص استخدام المنصة لتصفح الطباخات وتقديم الطلبات" />
          <TermCard emoji="✅" text="يجب تقديم معلومات صحيحة عند الطلب (الاسم ورقم الهاتف)" />
          <TermCard emoji="🚫" text="يُحظر استخدام المنصة لأغراض غير مشروعة أو احتيالية" />
          <TermCard emoji="🚫" text="يُحظر نشر محتوى مسيء أو مضلّل في التقييمات أو الملاحظات" />
        </div>
      </>
    ),
  },
  {
    id: 'orders',
    icon: ShoppingBag,
    title: 'الطلبات والإلغاء',
    accent: '#3B82F6',
    content: (
      <>
        <p className="text-sm text-stone-700 mb-3">
          تُعدّ الطلبات المُقدَّمة عبر المنصة عقداً ملزِماً بين الزبون والطباخة.
        </p>
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3">
            <p className="font-black text-blue-700 text-xs mb-2">مراحل الطلب</p>
            <ol className="text-xs text-stone-700 space-y-1.5 mr-4 list-decimal">
              <li>تُقدّم طلبك وتنتظر قبول الطباخة</li>
              <li>تبدأ الطباخة بالتحضير بعد القبول</li>
              <li>تُعلمك الطباخة عند جاهزية طلبك</li>
              <li>يُعدّ الطلب مُكتملاً بعد تأكيد التسليم</li>
            </ol>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3">
            <p className="font-black text-amber-700 text-xs mb-2">إلغاء الطلب</p>
            <ul className="text-xs text-stone-700 space-y-1 mr-4 list-disc">
              <li>يمكن إلغاء الطلب فقط قبل قبول الطباخة له</li>
              <li>لا يحق للزبون إلغاء الطلب بعد انتقاله إلى مرحلة "قيد التحضير"</li>
              <li>تحتفظ الطباخة بحق الرفض قبل بدء التحضير</li>
            </ul>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'returns',
    icon: RotateCcw,
    title: 'سياسة الإرجاع',
    accent: '#22C55E',
    content: (
      <>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-3 mb-3">
          <p className="font-black text-green-700 text-xs flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
            مدة المطالبة: 4 أيام عمل من تاريخ الاستلام
          </p>
        </div>
        <p className="text-sm text-stone-700 mb-3 leading-relaxed">
          نظراً لطبيعة المنتجات الغذائية الطازجة، تنطبق سياسة الإرجاع في الحالات التالية فقط:
        </p>
        <div className="space-y-2 mb-3">
          <TermCard emoji="✅" text="الطلب لم يصل إطلاقاً مع وجود دليل" />
          <TermCard emoji="✅" text="الطلب مغاير كلياً لما تم طلبه (صنف مختلف)" />
          <TermCard emoji="✅" text="وجود غلطة واضحة في الكمية أو المكونات المتفق عليها" />
          <TermCard emoji="🚫" text="لا يُقبل الإرجاع بسبب تغيير الرأي بعد الاستلام" />
          <TermCard emoji="🚫" text="لا يُقبل الإرجاع بعد انقضاء 4 أيام عمل" />
        </div>
        <p className="text-xs text-stone-600 leading-relaxed">
          لتقديم شكوى، تواصل معنا عبر{' '}
          <a href="mailto:contact@nakha.dz" className="font-black text-orange-600 underline">
            contact@nakha.dz
          </a>
        </p>
      </>
    ),
  },
  {
    id: 'payment',
    icon: CreditCard,
    title: 'طرق الدفع',
    accent: '#8B5CF6',
    content: (
      <>
        <p className="text-sm text-stone-700 mb-3">تدعم منصة نَكهة طرق الدفع التالية:</p>
        <div className="space-y-2">
          <div className="flex items-start gap-3 bg-stone-50 rounded-2xl p-3">
            <span className="text-xl">💵</span>
            <div>
              <p className="text-xs font-black text-stone-800">الدفع عند الاستلام (نقداً)</p>
              <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                تُسلّم المبلغ مباشرةً للطباخة عند استلام طلبك — الطريقة الافتراضية حالياً
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-stone-50 rounded-2xl p-3">
            <span className="text-xl">📱</span>
            <div>
              <p className="text-xs font-black text-stone-800">BaridiMob / CCP</p>
              <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                متاح لإعادة شحن رصيد الطباخات عبر طلب إيداع في قسم المحفظة
              </p>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 border-r-4 border-orange-500 rounded-2xl p-3 mt-3">
          <p className="text-[11px] text-orange-700 leading-relaxed">
            <strong>تنبيه:</strong> المنصة لا تتعامل بالبطاقات البنكية حالياً.
            جميع المدفوعات تتم مباشرةً بين الزبون والطباخة.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'responsibility',
    icon: Shield,
    title: 'مسؤولية المنصة',
    accent: '#F59E0B',
    content: (
      <>
        <p className="text-sm text-stone-700 mb-3">تضطلع منصة نَكهة بالمسؤوليات التالية:</p>
        <div className="space-y-2 mb-3">
          <TermCard emoji="✅" text="التحقق من هوية الطباخات قبل الموافقة على انضمامهن" />
          <TermCard emoji="✅" text="توفير بيئة آمنة ومشفّرة لحماية بياناتك" />
          <TermCard emoji="✅" text="ضمان وصول الطلبات وإشعارات الحالة في الوقت المناسب" />
          <TermCard emoji="✅" text="التوسط في حل النزاعات البسيطة بين الأطراف" />
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-3">
          <p className="font-black text-red-700 text-xs mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.5} />
            حدود المسؤولية
          </p>
          <ul className="text-xs text-stone-700 space-y-1 mr-4 list-disc">
            <li>نَكهة وسيط تقني فقط — لا تمتلك المطبخ ولا تُشغّل التوصيل مباشرةً</li>
            <li>لا تتحمّل المنصة المسؤولية عن جودة الطعام التي تقع على الطباخة حصراً</li>
            <li>لا تتحمّل المنصة المسؤولية عن أي تأخير ناجم عن ظروف خارجة عن إرادتها</li>
          </ul>
        </div>
      </>
    ),
  },
  {
    id: 'rights',
    icon: User,
    title: 'حقوق المستخدم والتزاماته',
    accent: '#EC4899',
    content: (
      <>
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-green-50 border border-green-100 rounded-2xl p-3">
            <p className="font-black text-green-700 text-xs mb-2">حقوقك كمستخدم</p>
            <div className="space-y-1.5">
              <TermCard emoji="👁" text="الاطلاع على كامل معلومات طلبك وحالته" />
              <TermCard emoji="⭐" text="تقييم الطباخة بعد كل طلب مكتمل" />
              <TermCard emoji="🗑️" text="طلب حذف حسابك وبياناتك في أي وقت" />
              <TermCard emoji="📞" text="التواصل مع الدعم عند أي مشكلة" />
            </div>
          </div>
          <div className="bg-stone-50 border border-stone-100 rounded-2xl p-3">
            <p className="font-black text-stone-700 text-xs mb-2">التزاماتك</p>
            <ul className="text-xs text-stone-700 space-y-1 mr-4 list-disc">
              <li>تقديم معلومات تواصل صحيحة وقابلة للتحقق</li>
              <li>الالتزام بموعد استلام الطلب أو إشعار الطباخة مبكراً</li>
              <li>الامتناع عن التقييمات الكيدية أو المضلّلة</li>
              <li>احترام الطباخة والتعامل معها بأدب</li>
            </ul>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'updates',
    icon: RefreshCw,
    title: 'تعديل الشروط',
    accent: '#3B82F6',
    content: (
      <>
        <p className="text-sm text-stone-700 mb-3 leading-relaxed">
          تحتفظ منصة نَكهة بحق تعديل هذه الشروط في أي وقت. سيتم إعلامك بأي تغييرات جوهرية عبر:
        </p>
        <div className="space-y-2">
          <TermCard emoji="📧" text="إشعار على البريد الإلكتروني المسجّل" />
          <TermCard emoji="📢" text="إعلان داخل المنصة عند تسجيل الدخول" />
        </div>
        <p className="text-xs text-stone-600 mt-3 leading-relaxed">
          استمرارك في استخدام المنصة بعد نشر التعديلات يُعدّ موافقةً ضمنية عليها.
        </p>
      </>
    ),
  },
];

const Terms = () => {
  const [openSection, setOpenSection] = useState('eligibility');

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
             style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.18) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(234,88,12,0.2) 0%, transparent 70%)' }} />

        <div className="relative max-w-3xl mx-auto px-5">
          <Link to="/" className="inline-flex items-center gap-2 text-stone-400 hover:text-white text-xs font-bold mb-6 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5 rotate-180" strokeWidth={2.5} />
            الرئيسية
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl"
                 style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
              <FileText className="w-7 h-7 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="anim-fade-up text-3xl md:text-4xl font-black text-white leading-tight">
                الشروط{' '}
                <span style={{ background: 'linear-gradient(135deg, #FBBF24, #F97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  والأحكام
                </span>
              </h1>
              <p className="anim-fade-up-2 text-stone-400 text-xs mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" strokeWidth={2.4} />
                آخر تحديث: أبريل 2026
              </p>
            </div>
          </div>

          <p className="anim-fade-up-2 text-stone-400 text-sm leading-relaxed mt-4 max-w-lg">
            قبل استخدام المنصة، يُرجى قراءة هذه الشروط بعناية. استخدامك للمنصة يعني موافقتك على جميع البنود الواردة أدناه.
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
            اضغط على أي بند لقراءة تفاصيله. إن كان لديك أي استفسار قانوني، تواصل معنا مباشرةً.
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
              <Mail className="w-5 h-5 text-amber-600" strokeWidth={2.3} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-stone-800 mb-1">استفسار قانوني؟</p>
              <p className="text-xs text-stone-600 mb-3 leading-relaxed">
                فريقنا مستعد للإجابة على أسئلتك حول الشروط والأحكام
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
          <Link to="/privacy" className="text-stone-500 hover:text-orange-600 font-bold transition-colors">سياسة الخصوصية</Link>
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
          <p className="text-[10px] font-bold text-stone-400">البند {index + 1}</p>
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

function TermCard({ emoji, text }) {
  return (
    <div className="flex items-center gap-2 bg-stone-50 rounded-xl p-2.5">
      <span className="text-base">{emoji}</span>
      <p className="text-xs font-bold text-stone-700">{text}</p>
    </div>
  );
}

export default Terms;
