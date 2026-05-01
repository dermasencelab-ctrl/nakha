import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Clock,
  CheckCircle,
  Mail,
  LogOut,
  Home,
  Sparkles,
  Heart,
  MessageCircle,
  Camera,
  ChefHat,
  Star,
  ArrowLeft,
} from 'lucide-react';

const CookPending = () => {
  const { logout, userProfile } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // رقم واتساب الدعم (غيّره لرقمك)
  const supportWhatsApp = 'https://wa.me/213549741892?text=السلام عليكم، سجّلت كطباخة في نَكهة واحتاج استفسار';

  return (
    <div
      dir="rtl"
      className="min-h-screen relative overflow-hidden bg-[#FFF5E6]"
    >
      {/* زخارف خلفية */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-orange-300/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-300/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="relative max-w-lg mx-auto px-4 pt-8 pb-8">
        {/* ============================================ */}
        {/* الأيقونة الكبيرة - انتظار دافئ */}
        {/* ============================================ */}
        <div className="text-center mb-6 animate-success-pop">
          <div className="relative inline-block">
            {/* حلقات نابضة */}
            <div className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping-slow" />

            {/* الأيقونة */}
            <div className="relative w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/40 mx-auto">
              <Clock className="w-12 h-12 text-white" strokeWidth={2.2} />
            </div>

            {/* أيقونات طافية */}
            <div className="absolute -top-1 -right-2 text-2xl animate-star-1">✨</div>
            <div className="absolute -bottom-1 -left-1 text-xl animate-star-2">🌟</div>
          </div>
        </div>

        {/* ============================================ */}
        {/* الرسالة الترحيبية */}
        {/* ============================================ */}
        <div className="text-center mb-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur border border-amber-200 px-3 py-1 rounded-full text-[11px] font-extrabold text-amber-700 mb-3">
            <Heart className="w-3 h-3 fill-amber-500 text-amber-500" />
            أهلاً بكِ في العائلة
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-stone-800 mb-2 leading-tight">
            شكراً لانضمامكِ إلى
            <br />
            <span className="text-orange-600">نَكهة</span>
            <span className="inline-block mx-1">🍲</span>
          </h1>

          <p className="text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
            طلبكِ قيد المراجعة، وسنعلمكِ فور تفعيل حسابكِ
          </p>
        </div>

        {/* ============================================ */}
        {/* بطاقة المعلومات */}
        {/* ============================================ */}
        {userProfile && userProfile.email && (
          <div
            className="bg-white rounded-2xl shadow-sm p-3.5 mb-4 flex items-center gap-3 animate-slide-up"
            style={{ animationDelay: '300ms' }}
          >
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-orange-600" strokeWidth={2.3} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-stone-500 font-bold">
                البريد المسجّل
              </p>
              <p
                className="text-sm font-extrabold text-stone-800 truncate"
                dir="ltr"
                style={{ textAlign: 'right' }}
              >
                {userProfile.email}
              </p>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* Timeline - ما يحدث الآن */}
        {/* ============================================ */}
        <div
          className="bg-white rounded-3xl shadow-xl shadow-stone-900/5 p-5 mb-4 animate-slide-up"
          style={{ animationDelay: '450ms' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-600" strokeWidth={2.4} />
            </div>
            <h2 className="text-sm font-extrabold text-stone-800">
              ماذا يحدث الآن؟
            </h2>
          </div>

          <div className="space-y-0">
            <TimelineStep
              status="done"
              icon={CheckCircle}
              title="تم استلام طلبكِ"
              desc="تسجيلكِ مكتمل ومحفوظ"
            />
            <TimelineStep
              status="active"
              icon={Clock}
              title="المراجعة جارية"
              desc="فريقنا يراجع ملفكِ"
              time="24-48 ساعة"
            />
            <TimelineStep
              status="next"
              icon={CheckCircle}
              title="تفعيل الحساب"
              desc="ستتلقين إشعاراً بالبريد"
              last
            />
          </div>
        </div>

        {/* ============================================ */}
        {/* نصائح مفيدة أثناء الانتظار */}
        {/* ============================================ */}
        <div
          className="bg-gradient-to-bl from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-3xl p-4 mb-4 animate-slide-up"
          style={{ animationDelay: '600ms' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Star
                className="w-4 h-4 text-amber-500 fill-amber-500"
                strokeWidth={2.4}
              />
            </div>
            <h3 className="text-sm font-extrabold text-stone-800">
              جهّزي نفسكِ للنجاح
            </h3>
          </div>

          <div className="space-y-2.5">
            <TipRow
              icon={Camera}
              title="التقطي صوراً جميلة لأطباقكِ"
              desc="الصور الجذابة تبيع أفضل"
            />
            <TipRow
              icon={ChefHat}
              title="اكتبي قائمة أطباقكِ المتخصصة"
              desc="استعدي لإضافتها فور التفعيل"
            />
            <TipRow
              icon={MessageCircle}
              title="جهّزي رسالة ترحيب للزبائن"
              desc="التواصل الدافئ يصنع الفرق"
            />
          </div>
        </div>

        {/* ============================================ */}
        {/* دعم واتساب */}
        {/* ============================================ */}
        <a
          href={supportWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-green-500 hover:bg-green-600 rounded-2xl p-4 mb-4 text-white shadow-lg shadow-green-500/30 active:scale-[0.98] transition-all animate-slide-up"
          style={{ animationDelay: '750ms' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5" strokeWidth={2.4} />
            </div>
            <div className="flex-1">
              <p className="font-extrabold text-sm">
                عندكِ سؤال أو استفسار؟
              </p>
              <p className="text-xs text-white/90 mt-0.5">
                تواصلي معنا مباشرة عبر واتساب
              </p>
            </div>
            <ArrowLeft className="w-4 h-4" strokeWidth={2.8} />
          </div>
        </a>

        {/* ============================================ */}
        {/* الأزرار السفلية */}
        {/* ============================================ */}
        <div
          className="space-y-2 animate-slide-up"
          style={{ animationDelay: '900ms' }}
        >
          <Link
            to="/"
            className="flex items-center justify-center gap-2 bg-white hover:bg-orange-50 border-2 border-orange-200 text-orange-700 py-3 rounded-2xl font-extrabold text-sm active:scale-[0.98] transition-all"
          >
            <Home className="w-4 h-4" strokeWidth={2.4} />
            تصفّح نَكهة
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-stone-500 hover:text-stone-700 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={2.4} />
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* Styles */}
      {/* ============================================ */}
      <style>{`
        @keyframes success-pop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-success-pop {
          animation: success-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @keyframes star-float-1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(3px, -5px) rotate(15deg); }
        }
        @keyframes star-float-2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-4px, 3px) rotate(-15deg); }
        }
        .animate-star-1 {
          animation: star-float-1 2.5s ease-in-out infinite;
        }
        .animate-star-2 {
          animation: star-float-2 2.8s ease-in-out infinite 0.5s;
        }
      `}</style>
    </div>
  );
};

/* ============================================ */
/* مكوّن خطوة Timeline */
/* ============================================ */
function TimelineStep({ status, icon: Icon, title, desc, time, last }) {
  const styles = {
    done: {
      bg: 'bg-green-500',
      iconColor: 'text-white',
      line: 'bg-green-300',
      titleColor: 'text-green-700',
    },
    active: {
      bg: 'bg-amber-500',
      iconColor: 'text-white',
      line: 'bg-stone-200',
      titleColor: 'text-amber-700',
    },
    next: {
      bg: 'bg-stone-200',
      iconColor: 'text-stone-400',
      line: 'bg-stone-200',
      titleColor: 'text-stone-600',
    },
  };
  const s = styles[status];

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`relative w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${s.bg} ${
            status === 'active' ? 'shadow-lg shadow-amber-400/40' : ''
          }`}
        >
          <Icon className={`w-4 h-4 ${s.iconColor}`} strokeWidth={2.5} />
          {status === 'active' && (
            <>
              <span className="absolute inset-0 rounded-2xl bg-amber-400 animate-ping opacity-30" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full ring-2 ring-white animate-pulse" />
            </>
          )}
        </div>
        {!last && (
          <div className={`w-0.5 flex-1 min-h-[20px] ${s.line} rounded-full my-1`} />
        )}
      </div>
      <div className="flex-1 pt-1 pb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className={`font-extrabold text-sm ${s.titleColor}`}>{title}</p>
          {time && (
            <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              {time}
            </span>
          )}
        </div>
        <p className="text-xs text-stone-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

/* ============================================ */
/* نصيحة */
/* ============================================ */
function TipRow({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-2.5 bg-white/70 rounded-2xl p-2.5 backdrop-blur-sm">
      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-amber-700" strokeWidth={2.3} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-extrabold text-stone-800">{title}</p>
        <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}

export default CookPending;