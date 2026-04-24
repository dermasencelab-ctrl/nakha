import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  ChefHat,
  ShoppingBag,
  Heart,
  MapPin,
  Mail,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Utensils,
  Shield,
  Users,
  Quote,
  Phone,
} from 'lucide-react';

const About = () => {
  const [stats, setStats] = useState({
    cooks: 0,
    dishes: 0,
    orders: 0,
  });

  // جلب أرقام حقيقية من قاعدة البيانات
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const cooksSnap = await getDocs(
          query(collection(db, 'cooks'), where('status', '==', 'approved'))
        );
        const dishesSnap = await getDocs(collection(db, 'dishes'));
        const ordersSnap = await getDocs(
          query(collection(db, 'orders'), where('status', '==', 'completed'))
        );

        setStats({
          cooks: cooksSnap.size,
          dishes: dishesSnap.size,
          orders: ordersSnap.size,
        });
      } catch (err) {
        console.error('Error loading stats:', err);
      }
    };
    fetchStats();
  }, []);

  const supportWhatsApp =
    'https://wa.me/213549741892?text=السلام عليكم، عندي استفسار عن نَكهة';

  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF8F0] pb-24 md:pb-8">
      {/* ============================================ */}
      {/* Header مع زر رجوع */}
      {/* ============================================ */}
      <header className="sticky top-16 z-20 bg-[#FFF8F0]/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            to="/"
            className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-90 transition"
            aria-label="رجوع"
          >
            <ArrowRight className="w-4 h-4 text-stone-700" strokeWidth={2.4} />
          </Link>
          <h1 className="text-lg font-extrabold text-stone-800">عن نَكهة</h1>
        </div>
      </header>

      {/* ============================================ */}
      {/* Hero هادئ - ليس صاخب */}
      {/* ============================================ */}
      <section className="relative overflow-hidden pt-6 pb-8">
        {/* زخارف ناعمة */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          {/* شعار */}
          <div className="inline-block mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-400/30 rounded-3xl blur-xl" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-xl shadow-orange-500/40 mx-auto">
                <ChefHat className="w-8 h-8 text-white" strokeWidth={2.3} />
              </div>
            </div>
          </div>

          <h2 className="text-3xl md:text-5xl font-black text-stone-800 mb-3 leading-tight">
            من الحي إلى{' '}
            <span className="relative inline-block">
              مائدتك
              <span className="absolute -bottom-1 right-0 w-full h-2 bg-amber-300/60 rounded-full -z-10" />
            </span>
          </h2>

          <p className="text-sm md:text-base text-stone-600 leading-relaxed max-w-xl mx-auto">
            نَكهة منصة جزائرية تربط بين طباخات بشار الموهوبات والعائلات التي تبحث عن طعام بيتي أصيل
          </p>

          {/* موقعنا */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-orange-200 px-3 py-1.5 rounded-full text-xs font-extrabold text-orange-700 mt-4 shadow-sm">
            <MapPin className="w-3 h-3" strokeWidth={2.5} />
            بشار، الجزائر 🇩🇿
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* الأرقام الحقيقية (من DB) */}
      {/* ============================================ */}
      <section className="max-w-4xl mx-auto px-4 mb-8">
        <div className="bg-white rounded-3xl shadow-md shadow-orange-200/30 p-5">
          <div className="grid grid-cols-3 gap-3">
            <StatBox
              icon={ChefHat}
              value={stats.cooks}
              label="طباخة"
              suffix={stats.cooks !== 1 ? '+' : ''}
              color="orange"
            />
            <div className="border-r border-l border-stone-100" />
            <StatBox
              icon={Utensils}
              value={stats.dishes}
              label="طبق"
              suffix={stats.dishes !== 1 ? '+' : ''}
              color="amber"
            />
            <div className="border-r border-stone-100" />
            <StatBox
              icon={Heart}
              value={stats.orders}
              label="طلب سعيد"
              suffix={stats.orders !== 1 ? '+' : ''}
              color="red"
            />
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* قصتنا - بحكاية إنسانية */}
      {/* ============================================ */}
      <section className="max-w-4xl mx-auto px-4 mb-8">
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="w-1.5 h-5 bg-orange-500 rounded-full" />
          <h2 className="text-lg font-extrabold text-stone-800">قصتنا</h2>
        </div>

        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          {/* اقتباس مؤثّر */}
          <div className="relative bg-gradient-to-bl from-amber-50 to-orange-50 p-5 border-b border-orange-100">
            <Quote
              className="absolute top-3 right-3 w-6 h-6 text-orange-300 scale-x-[-1]"
              strokeWidth={2.5}
            />
            <p className="text-stone-800 text-base md:text-lg font-extrabold leading-relaxed pr-6 italic">
              "في كل حي من أحياء بشار، هناك طباخة ماهرة. أكلها كنز لا يصل إلى أحد خارج عائلتها."
            </p>
          </div>

          {/* القصة */}
          <div className="p-5 space-y-3">
            <p className="text-sm text-stone-700 leading-relaxed">
              هذه الفكرة كانت بداية{' '}
              <span className="font-black text-orange-600">نَكهة</span>. أردنا
              أن نربط تلك الطباخات الموهوبات بالعائلات الباحثة عن طعام دافئ
              وأصيل — طعام يشبه طعم الجدة، ليس طعم المطاعم.
            </p>
            <p className="text-sm text-stone-700 leading-relaxed">
              نحن نؤمن أن الطعام البيتي ليس مجرد وجبة، بل{' '}
              <span className="font-bold">ذكرى وعاطفة</span>. ونريد أن نجعل هذا
              الكنز في متناول الجميع، بينما نُمكّن الطباخات من تحويل موهبتهن
              إلى مصدر دخل كريم.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* قيمنا */}
      {/* ============================================ */}
      <section className="max-w-4xl mx-auto px-4 mb-8">
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="w-1.5 h-5 bg-amber-500 rounded-full" />
          <h2 className="text-lg font-extrabold text-stone-800">ما يحرّكنا</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ValueCard
            icon={Heart}
            title="طعام بحب"
            desc="كل طبق مطبوخ كما لو كان لعائلة الطباخة"
            color="red"
          />
          <ValueCard
            icon={Shield}
            title="ثقة مُستحقة"
            desc="طباخات مُوثّقات من فريقنا قبل الانضمام"
            color="green"
          />
          <ValueCard
            icon={Users}
            title="مجتمع أولاً"
            desc="ندعم طباخات الحي، ليس شركات مجهولة"
            color="blue"
          />
          <ValueCard
            icon={Sparkles}
            title="جودة شفافة"
            desc="تقييمات حقيقية من زبائن حقيقيين"
            color="amber"
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* دعوات - طباخة أم زبونة؟ */}
      {/* ============================================ */}
      <section className="max-w-4xl mx-auto px-4 mb-8">
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="w-1.5 h-5 bg-green-500 rounded-full" />
          <h2 className="text-lg font-extrabold text-stone-800">
            كيف تبدأين؟
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* للزبائن */}
          <Link
            to="/cooks"
            className="relative bg-white rounded-3xl overflow-hidden p-5 shadow-sm hover:shadow-lg active:scale-[0.98] transition-all group border border-stone-100"
          >
            <div className="absolute -top-4 -left-4 w-20 h-20 bg-orange-100 rounded-full blur-xl" />
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-md mb-3">
                <ShoppingBag className="w-5 h-5 text-white" strokeWidth={2.3} />
              </div>
              <h3 className="font-black text-stone-800 text-base mb-1">
                أبحث عن طعام
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed mb-3">
                تصفّحي الطباخات واطلبي أطباقك المفضلة
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-black text-orange-600 group-hover:gap-2 transition-all">
                ابدئي الآن
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.8} />
              </span>
            </div>
          </Link>

          {/* للطباخات */}
          <Link
            to="/cook/signup"
            className="relative bg-gradient-to-bl from-amber-50 via-orange-50 to-amber-100 rounded-3xl overflow-hidden p-5 shadow-sm hover:shadow-lg active:scale-[0.98] transition-all group border border-amber-200"
          >
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-300/40 rounded-full blur-xl" />
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-md mb-3">
                <ChefHat className="w-5 h-5 text-white" strokeWidth={2.3} />
              </div>
              <h3 className="font-black text-stone-800 text-base mb-1">
                أنا طباخة
              </h3>
              <p className="text-xs text-stone-700 leading-relaxed mb-3">
                انضمّي وابدئي ببيع أطباقك من بيتك
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-black text-amber-700 group-hover:gap-2 transition-all">
                سجّلي الآن
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.8} />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ============================================ */}
      {/* تواصل معنا */}
      {/* ============================================ */}
      <section className="max-w-4xl mx-auto px-4 mb-8">
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
          <h2 className="text-lg font-extrabold text-stone-800">تواصل معنا</h2>
        </div>

        <div className="bg-white rounded-3xl shadow-sm overflow-hidden divide-y divide-stone-100">
          {/* واتساب */}
          <a
            href={supportWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 hover:bg-green-50 active:bg-green-100 transition-all group"
          >
            <div className="w-11 h-11 bg-green-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-green-500/30">
              <MessageCircle className="w-5 h-5 text-white" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-stone-800">واتساب</p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                الأسرع — نرد خلال ساعة
              </p>
            </div>
            <ArrowLeft
              className="w-4 h-4 text-stone-400 group-hover:-translate-x-1 transition-transform"
              strokeWidth={2.5}
            />
          </a>

          {/* البريد */}
          <a
            href="mailto:contact@nakha.dz"
            className="flex items-center gap-3 p-4 hover:bg-orange-50 active:bg-orange-100 transition-all group"
          >
            <div className="w-11 h-11 bg-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-500/30">
              <Mail className="w-5 h-5 text-white" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-stone-800">
                البريد الإلكتروني
              </p>
              <p
                className="text-[11px] text-orange-600 mt-0.5 font-bold"
                dir="ltr"
                style={{ textAlign: 'right' }}
              >
                contact@nakha.dz
              </p>
            </div>
            <ArrowLeft
              className="w-4 h-4 text-stone-400 group-hover:-translate-x-1 transition-transform"
              strokeWidth={2.5}
            />
          </a>
        </div>
      </section>

      {/* ============================================ */}
      {/* Footer خاص */}
      {/* ============================================ */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="text-center py-4">
          <p className="text-xs text-stone-500 mb-1">
            صُنع في بشار{' '}
            <Heart className="w-3 h-3 inline fill-red-400 text-red-400" /> للجزائر
          </p>
          <div className="flex items-center justify-center gap-3 text-[11px] mt-2">
            <Link
              to="/privacy"
              className="text-stone-600 hover:text-orange-600 font-bold"
            >
              سياسة الخصوصية
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
        </div>
      </section>
    </div>
  );
};

/* ============================================ */
/* بطاقة إحصائية */
/* ============================================ */
function StatBox({ icon: Icon, value, label, suffix, color }) {
  const colors = {
    orange: 'bg-orange-100 text-orange-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-500',
  };
  return (
    <div className="text-center py-1">
      <div
        className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${colors[color]}`}
      >
        <Icon className="w-4 h-4" strokeWidth={2.4} />
      </div>
      <p className="text-xl font-black text-stone-800 leading-none">
        {value}
        {suffix && <span className="text-sm font-bold text-stone-400">{suffix}</span>}
      </p>
      <p className="text-[10px] text-stone-500 font-bold mt-1">{label}</p>
    </div>
  );
}

/* ============================================ */
/* بطاقة قيمة */
/* ============================================ */
function ValueCard({ icon: Icon, title, desc, color }) {
  const colors = {
    red: {
      bg: 'bg-red-50',
      border: 'border-red-100',
      icon: 'bg-red-500',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-100',
      icon: 'bg-green-500',
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      icon: 'bg-blue-500',
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      icon: 'bg-amber-500',
    },
  };
  const c = colors[color];
  return (
    <div
      className={`${c.bg} border ${c.border} rounded-2xl p-4 flex items-start gap-3`}
    >
      <div
        className={`w-10 h-10 ${c.icon} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}
      >
        <Icon className="w-5 h-5 text-white" strokeWidth={2.3} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-extrabold text-stone-800 text-sm">{title}</p>
        <p className="text-[11px] text-stone-600 leading-relaxed mt-1">
          {desc}
        </p>
      </div>
    </div>
  );
}

export default About;