import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
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
} from 'lucide-react';

const sections = [
  {
    id: 'eligibility',
    icon: User,
    title: 'شروط الاستخدام',
    color: 'orange',
    content: (
      <>
        <p className="mb-3">
          باستخدامك منصة <strong>نَكهة</strong>، فإنك تقرّ بقبول هذه الشروط
          والالتزام بها كاملةً.
        </p>
        <div className="space-y-2">
          <TermCard
            emoji="✅"
            text="يحق لأي شخص استخدام المنصة لتصفح الطباخات وتقديم الطلبات"
          />
          <TermCard
            emoji="✅"
            text="يجب تقديم معلومات صحيحة عند الطلب (الاسم ورقم الهاتف)"
          />
          <TermCard
            emoji="🚫"
            text="يُحظر استخدام المنصة لأغراض غير مشروعة أو احتيالية"
          />
          <TermCard
            emoji="🚫"
            text="يُحظر نشر محتوى مسيء أو مضلّل في التقييمات أو الملاحظات"
          />
        </div>
      </>
    ),
  },
  {
    id: 'orders',
    icon: ShoppingBag,
    title: 'الطلبات والإلغاء',
    color: 'blue',
    content: (
      <>
        <p className="mb-3">
          تُعدّ الطلبات المُقدَّمة عبر المنصة عقداً ملزِماً بين الزبون
          والطباخة. يُرجى مراعاة ما يلي:
        </p>
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3">
            <p className="font-black text-blue-700 text-xs mb-2">
              مراحل الطلب
            </p>
            <ol className="text-xs text-stone-700 space-y-1.5 mr-4 list-decimal">
              <li>
                تُقدّم طلبك وتنتظر قبول الطباخة
              </li>
              <li>تبدأ الطباخة بالتحضير بعد القبول</li>
              <li>تُعلمك الطباخة عند جاهزية طلبك</li>
              <li>يُعدّ الطلب مُكتملاً بعد تأكيد التسليم</li>
            </ol>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3">
            <p className="font-black text-amber-700 text-xs mb-2">
              إلغاء الطلب
            </p>
            <ul className="text-xs text-stone-700 space-y-1 mr-4 list-disc">
              <li>
                يمكن إلغاء الطلب فقط قبل قبول الطباخة له (مرحلة "قيد
                الانتظار")
              </li>
              <li>
                لا يحق للزبون إلغاء الطلب بعد انتقاله إلى مرحلة "قيد
                التحضير"
              </li>
              <li>
                تحتفظ الطباخة بحق الرفض قبل بدء التحضير دون أي التزامات
              </li>
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
    color: 'green',
    content: (
      <>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-3 mb-3">
          <p className="font-black text-green-700 text-xs mb-1 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
            مدة المطالبة: 4 أيام عمل من تاريخ الاستلام
          </p>
        </div>
        <p className="mb-3 text-xs text-stone-700 leading-relaxed">
          نظراً لطبيعة المنتجات الغذائية الطازجة، تنطبق سياسة الإرجاع في
          الحالات التالية فقط:
        </p>
        <div className="space-y-2 mb-3">
          <TermCard emoji="✅" text="الطلب لم يصل إطلاقاً مع وجود دليل" />
          <TermCard
            emoji="✅"
            text="الطلب مغاير كلياً لما تم طلبه (صنف مختلف)"
          />
          <TermCard
            emoji="✅"
            text="وجود غلطة واضحة في الكمية أو المكونات المتفق عليها"
          />
          <TermCard
            emoji="🚫"
            text="لا يُقبل الإرجاع بسبب تغيير الرأي بعد الاستلام"
          />
          <TermCard
            emoji="🚫"
            text="لا يُقبل الإرجاع بعد انقضاء 4 أيام عمل من تاريخ الاستلام"
          />
        </div>
        <p className="text-xs text-stone-600 leading-relaxed">
          لتقديم شكوى، تواصل معنا خلال المهلة المحددة عبر{' '}
          <a
            href="mailto:contact@nakha.dz"
            className="font-black text-orange-600 underline"
          >
            contact@nakha.dz
          </a>{' '}
          مع إرفاق صورة الطلب ووصف المشكلة.
        </p>
      </>
    ),
  },
  {
    id: 'payment',
    icon: CreditCard,
    title: 'طرق الدفع',
    color: 'purple',
    content: (
      <>
        <p className="mb-3">تدعم منصة نَكهة طرق الدفع التالية:</p>
        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-stone-50 rounded-2xl p-3">
            <span className="text-xl">💵</span>
            <div>
              <p className="text-xs font-black text-stone-800">
                الدفع عند الاستلام (نقداً)
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                تُسلّم المبلغ مباشرةً للطباخة عند استلام طلبك — الطريقة
                الافتراضية حالياً
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-stone-50 rounded-2xl p-3">
            <span className="text-xl">📱</span>
            <div>
              <p className="text-xs font-black text-stone-800">
                BaridiMob / CCP
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                متاح لإعادة شحن رصيد الطباخات — يُستخدم عبر طلب إيداع في
                قسم المحفظة
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
    color: 'amber',
    content: (
      <>
        <p className="mb-3">تضطلع منصة نَكهة بالمسؤوليات التالية:</p>
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
            <li>
              نَكهة وسيط تقني فقط — لا تمتلك المطبخ ولا تُشغّل التوصيل
              مباشرةً
            </li>
            <li>
              لا تتحمّل المنصة المسؤولية عن جودة الطعام التي تقع على الطباخة
              حصراً
            </li>
            <li>
              لا تتحمّل المنصة المسؤولية عن أي تأخير ناجم عن ظروف خارجة عن
              إرادتها
            </li>
          </ul>
        </div>
      </>
    ),
  },
  {
    id: 'rights',
    icon: User,
    title: 'حقوق المستخدم والتزاماته',
    color: 'pink',
    content: (
      <>
        <p className="mb-3 text-xs text-stone-700">
          تحترم نَكهة حقوقك الكاملة كمستخدم، وفي المقابل نطلب منك الالتزام
          بسلوك محترم داخل المنصة.
        </p>
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-green-50 border border-green-100 rounded-2xl p-3">
            <p className="font-black text-green-700 text-xs mb-2">
              حقوقك كمستخدم
            </p>
            <div className="space-y-1.5">
              <TermCard emoji="👁" text="الاطلاع على كامل معلومات طلبك وحالته" />
              <TermCard emoji="⭐" text="تقييم الطباخة بعد كل طلب مكتمل" />
              <TermCard emoji="🗑️" text="طلب حذف حسابك وبياناتك في أي وقت" />
              <TermCard emoji="📞" text="التواصل مع الدعم عند أي مشكلة" />
            </div>
          </div>
          <div className="bg-stone-50 border border-stone-100 rounded-2xl p-3">
            <p className="font-black text-stone-700 text-xs mb-2">
              التزاماتك
            </p>
            <ul className="text-xs text-stone-700 space-y-1 mr-4 list-disc">
              <li>تقديم معلومات تواصل صحيحة وقابلة للتحقق</li>
              <li>الالتزام بموعد استلام الطلب أو إشعار الطباخة مبكراً</li>
              <li>الامتناع عن التقييمات الكيدية أو المضلّلة</li>
              <li>احترام الطباخة والتعامل معها باحترام وأدب</li>
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
    color: 'blue',
    content: (
      <>
        <p className="mb-3 text-xs text-stone-700 leading-relaxed">
          تحتفظ منصة نَكهة بحق تعديل هذه الشروط والأحكام في أي وقت. سيتم
          إعلامك بأي تغييرات جوهرية عبر:
        </p>
        <div className="space-y-2">
          <TermCard emoji="📧" text="إشعار على البريد الإلكتروني المسجّل" />
          <TermCard emoji="📢" text="إعلان داخل المنصة عند تسجيل الدخول" />
        </div>
        <p className="text-xs text-stone-600 mt-3 leading-relaxed">
          استمرارك في استخدام المنصة بعد نشر التعديلات يُعدّ موافقةً ضمنية
          عليها. إن لم توافق، يحق لك التوقف عن الاستخدام وطلب حذف حسابك.
        </p>
      </>
    ),
  },
];

const Terms = () => {
  const [openSection, setOpenSection] = useState('eligibility');

  const toggleSection = (id) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF8F0] pb-24 md:pb-8">
      {/* Header */}
      <header className="sticky top-16 z-20 bg-[#FFF8F0]/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            to="/"
            className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-90 transition"
            aria-label="رجوع"
          >
            <ArrowRight className="w-4 h-4 text-stone-700" strokeWidth={2.4} />
          </Link>
          <h1 className="text-lg font-extrabold text-stone-800">
            الشروط والأحكام
          </h1>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pt-4 pb-6">
        <div className="bg-gradient-to-bl from-orange-50 via-white to-amber-50 rounded-3xl p-5 border border-orange-100 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-md shadow-orange-500/30 flex-shrink-0">
              <FileText className="w-5 h-5 text-white" strokeWidth={2.3} />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-800 leading-tight">
                شروط استخدام نَكهة
              </h2>
              <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" strokeWidth={2.4} />
                آخر تحديث: أبريل 2026
              </p>
            </div>
          </div>
          <p className="text-sm text-stone-700 leading-relaxed">
            قبل استخدام المنصة، يُرجى قراءة هذه الشروط بعناية. استخدامك للمنصة
            يعني موافقتك التلقائية على جميع البنود الواردة أدناه.
          </p>
        </div>
      </section>

      {/* الأقسام */}
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

      {/* بطاقة تواصل */}
      <section className="max-w-3xl mx-auto px-4 mb-6">
        <div className="bg-gradient-to-bl from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-3xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <Mail className="w-5 h-5 text-amber-600" strokeWidth={2.3} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-stone-800 mb-1">
                استفسار قانوني؟
              </p>
              <p className="text-xs text-stone-600 mb-3 leading-relaxed">
                فريقنا مستعد للإجابة على أسئلتك حول الشروط والأحكام
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

      {/* روابط الأسفل */}
      <section className="max-w-3xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-3 text-[11px]">
          <Link
            to="/privacy"
            className="text-stone-600 hover:text-orange-600 font-bold"
          >
            سياسة الخصوصية
          </Link>
          <span className="text-stone-300">•</span>
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
            البند {index + 1}
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

function TermCard({ emoji, text }) {
  return (
    <div className="flex items-center gap-2 bg-stone-50 rounded-xl p-2.5">
      <span className="text-base">{emoji}</span>
      <p className="text-xs font-bold text-stone-700">{text}</p>
    </div>
  );
}

export default Terms;
