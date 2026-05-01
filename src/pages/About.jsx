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
  ArrowLeft,
  Sparkles,
  Utensils,
  Shield,
  Users,
  Quote,
} from 'lucide-react';

const About = () => {
  const [stats, setStats] = useState({ cooks: 0, dishes: 0, orders: 0 });
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [cooksSnap, dishesSnap, ordersSnap] = await Promise.all([
          getDocs(query(collection(db, 'cooks'), where('status', '==', 'approved'))),
          getDocs(collection(db, 'dishes')),
          getDocs(query(collection(db, 'orders'), where('status', '==', 'completed'))),
        ]);
        setStats({ cooks: cooksSnap.size, dishes: dishesSnap.size, orders: ordersSnap.size });
      } catch (err) {
        console.error('Error loading stats:', err);
      } finally {
        setStatsLoaded(true);
      }
    };
    fetchStats();
  }, []);

  const supportWhatsApp =
    'https://wa.me/213549741892?text=السلام عليكم، عندي استفسار عن نَكهة';

  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF5E6] pb-24 md:pb-8">
      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(3deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-float { animation: heroFloat 6s ease-in-out infinite; }
        .anim-fade-up { animation: fadeUp 0.7s ease both; }
        .anim-fade-up-2 { animation: fadeUp 0.7s 0.15s ease both; }
        .anim-fade-up-3 { animation: fadeUp 0.7s 0.3s ease both; }
        .grain-overlay {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
        }
      `}</style>

      {/* ═══════════════════════════════════════════ */}
      {/* DARK HERO */}
      {/* ═══════════════════════════════════════════ */}
      <section className="relative bg-[#1C0A00] overflow-hidden pt-10 pb-20">
        {/* grain */}
        <div className="grain-overlay absolute inset-0 pointer-events-none" />
        {/* warm glows */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.18) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(234,88,12,0.22) 0%, transparent 70%)' }} />

        <div className="relative max-w-4xl mx-auto px-5 text-center">
          {/* floating icon */}
          <div className="anim-float inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-5 shadow-2xl shadow-orange-900/50"
               style={{ background: 'linear-gradient(135deg, #FBBF24, #F97316)' }}>
            <ChefHat className="w-8 h-8 text-white" strokeWidth={2.2} />
          </div>

          <h1 className="anim-fade-up text-4xl md:text-6xl font-black text-white leading-tight mb-4">
            من الحي إلى{' '}
            <span style={{ background: 'linear-gradient(135deg, #FBBF24, #F97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              مائدتك
            </span>
          </h1>

          <p className="anim-fade-up-2 text-stone-400 text-base leading-relaxed max-w-lg mx-auto mb-6">
            نَكهة منصة جزائرية تربط بين طباخات بشار الموهوبات والعائلات التي تبحث عن طعام بيتي أصيل
          </p>

          <div className="anim-fade-up-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-amber-300 border border-amber-800/60"
               style={{ background: 'rgba(251,191,36,0.08)' }}>
            <MapPin className="w-3.5 h-3.5" strokeWidth={2.5} />
            بشار، الجزائر 🇩🇿
          </div>
        </div>

        {/* curved bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
          <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="w-full h-12" fill="#FFF5E6">
            <path d="M0,48 C360,0 1080,0 1440,48 L1440,48 L0,48 Z" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* STATS */}
      {/* ═══════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 -mt-2 mb-10">
        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <StatBox icon={ChefHat} value={stats.cooks} label="طباخة" color="orange" loaded={statsLoaded} />
            <div className="border-r border-l border-stone-100" />
            <StatBox icon={Utensils} value={stats.dishes} label="طبق" color="amber" loaded={statsLoaded} />
            <div className="col-span-3 border-t border-stone-100 -mx-6" />
            <div className="col-span-3">
              <StatBox icon={Heart} value={stats.orders} label="طلب سعيد" color="red" loaded={statsLoaded} fullWidth />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* STORY */}
      {/* ═══════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 mb-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full" />
          <h2 className="text-lg font-extrabold text-stone-800">قصتنا</h2>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="relative p-6 border-b border-orange-100" style={{ background: 'linear-gradient(135deg, #FFF7ED, #FEF3C7)' }}>
            <Quote className="absolute top-4 right-4 w-7 h-7 text-orange-300 scale-x-[-1]" strokeWidth={2} />
            <p className="text-stone-800 text-base md:text-lg font-extrabold leading-relaxed pr-8 italic">
              "في كل حي من أحياء بشار، هناك طباخة ماهرة. أكلها كنز لا يصل إلى أحد خارج عائلتها."
            </p>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm text-stone-700 leading-relaxed">
              هذه الفكرة كانت بداية{' '}
              <span className="font-black" style={{ background: 'linear-gradient(135deg, #FBBF24, #F97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                نَكهة
              </span>
              . أردنا أن نربط تلك الطباخات الموهوبات بالعائلات الباحثة عن طعام دافئ وأصيل — طعام يشبه طعم الجدة، ليس طعم المطاعم.
            </p>
            <p className="text-sm text-stone-700 leading-relaxed">
              نحن نؤمن أن الطعام البيتي ليس مجرد وجبة، بل{' '}
              <span className="font-bold text-orange-700">ذكرى وعاطفة</span>. ونريد أن نجعل هذا الكنز في متناول الجميع، بينما نُمكّن الطباخات من تحويل موهبتهن إلى مصدر دخل كريم.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* VALUES */}
      {/* ═══════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 mb-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
          <h2 className="text-lg font-extrabold text-stone-800">ما يحرّكنا</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ValueCard icon={Heart}    title="طعام بحب"       desc="كل طبق مطبوخ كما لو كان لعائلة الطباخة"          accent="#F43F5E" />
          <ValueCard icon={Shield}   title="ثقة مُستحقة"   desc="طباخات مُوثّقات من فريقنا قبل الانضمام"          accent="#22C55E" />
          <ValueCard icon={Users}    title="مجتمع أولاً"   desc="ندعم طباخات الحي، ليس شركات مجهولة"              accent="#3B82F6" />
          <ValueCard icon={Sparkles} title="جودة شفافة"    desc="تقييمات حقيقية من زبائن حقيقيين"                accent="#F59E0B" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* CTA — dark brick */}
      {/* ═══════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 mb-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-gradient-to-b from-green-400 to-emerald-600 rounded-full" />
          <h2 className="text-lg font-extrabold text-stone-800">كيف تبدئين؟</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* customer CTA */}
          <Link to="/cooks"
                className="relative bg-white rounded-3xl overflow-hidden p-5 shadow-sm border border-stone-100 hover:shadow-lg active:scale-[0.98] transition-all group">
            <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full opacity-30 pointer-events-none"
                 style={{ background: 'radial-gradient(circle, #FB923C, transparent)' }} />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md mb-3"
                   style={{ background: 'linear-gradient(135deg, #FB923C, #EA580C)' }}>
                <ShoppingBag className="w-5 h-5 text-white" strokeWidth={2.3} />
              </div>
              <h3 className="font-black text-stone-800 text-base mb-1">أبحث عن طعام</h3>
              <p className="text-xs text-stone-500 leading-relaxed mb-3">
                تصفّحي الطباخات واطلبي أطباقك المفضلة
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-black text-orange-600 group-hover:gap-2 transition-all">
                ابدئي الآن
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.8} />
              </span>
            </div>
          </Link>

          {/* cook CTA */}
          <Link to="/cook/signup"
                className="relative rounded-3xl overflow-hidden p-5 shadow-sm hover:shadow-lg active:scale-[0.98] transition-all group"
                style={{ background: 'linear-gradient(135deg, #7C2800, #3D1200)' }}>
            {/* dot pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-20"
                 style={{ backgroundImage: 'radial-gradient(circle, rgba(251,191,36,0.6) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md mb-3"
                   style={{ background: 'linear-gradient(135deg, #FBBF24, #F97316)' }}>
                <ChefHat className="w-5 h-5 text-white" strokeWidth={2.3} />
              </div>
              <h3 className="font-black text-white text-base mb-1">أنا طباخة</h3>
              <p className="text-xs text-amber-300/80 leading-relaxed mb-3">
                انضمّي وابدئي ببيع أطباقك من بيتك
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-black text-amber-300 group-hover:gap-2 transition-all">
                سجّلي الآن
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.8} />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* CONTACT */}
      {/* ═══════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 mb-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full" />
          <h2 className="text-lg font-extrabold text-stone-800">تواصل معنا</h2>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden divide-y divide-stone-100">
          <a href={supportWhatsApp} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-4 p-4 hover:bg-green-50 active:bg-green-100 transition-all group">
            <div className="w-11 h-11 bg-green-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-green-500/30">
              <MessageCircle className="w-5 h-5 text-white" strokeWidth={2.4} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-extrabold text-stone-800">واتساب</p>
              <p className="text-[11px] text-stone-500 mt-0.5">الأسرع — نرد خلال ساعة</p>
            </div>
            <ArrowLeft className="w-4 h-4 text-stone-400 group-hover:-translate-x-1 transition-transform" strokeWidth={2.5} />
          </a>

          <a href="mailto:contact@nakha.dz"
             className="flex items-center gap-4 p-4 hover:bg-orange-50 active:bg-orange-100 transition-all group">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-500/30"
                 style={{ background: 'linear-gradient(135deg, #FB923C, #EA580C)' }}>
              <Mail className="w-5 h-5 text-white" strokeWidth={2.4} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-extrabold text-stone-800">البريد الإلكتروني</p>
              <p className="text-[11px] text-orange-600 mt-0.5 font-bold" dir="ltr" style={{ textAlign: 'right' }}>
                contact@nakha.dz
              </p>
            </div>
            <ArrowLeft className="w-4 h-4 text-stone-400 group-hover:-translate-x-1 transition-transform" strokeWidth={2.5} />
          </a>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ═══════════════════════════════════════════ */}
      <footer className="max-w-4xl mx-auto px-4 text-center py-6">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #FBBF24, #F97316)' }}>
            <ChefHat className="w-3.5 h-3.5 text-white" strokeWidth={2.3} />
          </div>
          <span className="font-black text-stone-700 text-sm">نَكهة</span>
        </div>
        <p className="text-[11px] text-stone-500 mb-2">صُنع في بشار <Heart className="w-3 h-3 inline fill-red-400 text-red-400" /> للجزائر</p>
        <div className="flex items-center justify-center gap-3 text-[11px] mb-2 flex-wrap">
          <Link to="/privacy" className="text-stone-500 hover:text-orange-600 font-bold transition-colors">سياسة الخصوصية</Link>
          <span className="text-stone-300">•</span>
          <Link to="/terms" className="text-stone-500 hover:text-orange-600 font-bold transition-colors">الشروط والأحكام</Link>
          <span className="text-stone-300">•</span>
          <Link to="/" className="text-stone-500 hover:text-orange-600 font-bold transition-colors">الرئيسية</Link>
        </div>
        <p className="text-[10px] text-stone-400">© 2026 نَكهة</p>
      </footer>
    </div>
  );
};

function StatBox({ icon: Icon, value, label, color, loaded, fullWidth }) {
  const palette = {
    orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
    amber:  { bg: 'bg-amber-100',  text: 'text-amber-600'  },
    red:    { bg: 'bg-red-100',    text: 'text-red-500'    },
  };
  const c = palette[color];
  return (
    <div className={`text-center py-2 ${fullWidth ? 'pt-4' : ''}`}>
      <div className={`w-10 h-10 ${c.bg} ${c.text} rounded-xl mx-auto mb-2 flex items-center justify-center`}>
        <Icon className="w-4 h-4" strokeWidth={2.4} />
      </div>
      {loaded ? (
        <p className="text-2xl font-black text-stone-800 leading-none">
          {value}<span className="text-sm font-bold text-stone-400">+</span>
        </p>
      ) : (
        <div className="h-7 w-12 bg-stone-100 rounded-lg mx-auto animate-pulse" />
      )}
      <p className="text-[10px] text-stone-500 font-bold mt-1">{label}</p>
    </div>
  );
}

function ValueCard({ icon: Icon, title, desc, accent }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
           style={{ background: accent + '20' }}>
        <Icon className="w-5 h-5" style={{ color: accent }} strokeWidth={2.3} />
      </div>
      <div>
        <p className="font-extrabold text-stone-800 text-sm">{title}</p>
        <p className="text-[11px] text-stone-500 leading-relaxed mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export default About;
