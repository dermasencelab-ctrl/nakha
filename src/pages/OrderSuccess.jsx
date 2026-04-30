import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CheckCircle,
  Package,
  Home,
  ShoppingBag,
  Copy,
  Check,
  Clock,
  ChefHat,
  Truck,
  MessageCircle,
  Sparkles,
} from 'lucide-react';

function OrderSuccess() {
  const { state } = useLocation();
  const orderIds = state?.orderIds || [];
  const phone = state?.phone || null;
  const multipleOrders = orderIds.length > 1;

  const [copiedId, setCopiedId] = useState(null);
  const [showContent, setShowContent] = useState(false);

  // تأخير بسيط لإطلاق التأثيرات بعد تحميل الصفحة
  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // توليد 40 قطعة confetti بقيم عشوائية ثابتة
  const confettiPieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 1.5,
    color: [
      '#f97316', // orange
      '#fbbf24', // amber
      '#10b981', // green
      '#3b82f6', // blue
      '#ef4444', // red
      '#8b5cf6', // violet
    ][Math.floor(Math.random() * 6)],
    size: 6 + Math.random() * 6,
    shape: Math.random() > 0.5 ? 'circle' : 'square',
  }));

  return (
    <div
      dir="rtl"
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-green-50 pb-24 md:pb-8"
    >
      {/* ============================================ */}
      {/* Confetti Effect */}
      {/* ============================================ */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        {confettiPieces.map((piece) => (
          <div
            key={piece.id}
            className="absolute top-0 animate-confetti"
            style={{
              left: `${piece.left}%`,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              backgroundColor: piece.color,
              borderRadius: piece.shape === 'circle' ? '50%' : '2px',
            }}
          />
        ))}
      </div>

      {/* ============================================ */}
      {/* زخارف خلفية ناعمة */}
      {/* ============================================ */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-green-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-200/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* ============================================ */}
      {/* المحتوى */}
      {/* ============================================ */}
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-8">
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* أيقونة النجاح الكبيرة */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className={`text-center mb-6 ${showContent ? 'animate-success-pop' : 'opacity-0'}`}>
          <div className="relative inline-block">
            {/* حلقات متموجة */}
            <div className="absolute inset-0 rounded-full bg-green-400/30 animate-ping-slow" />
            <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping-slower" />

            {/* الأيقونة */}
            <div className="relative w-28 h-28 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40 mx-auto">
              <CheckCircle className="w-16 h-16 text-white" strokeWidth={2.5} />
            </div>

            {/* نجوم متحركة */}
            <div className="absolute -top-1 -right-3 text-3xl animate-star-1">✨</div>
            <div className="absolute top-4 -left-4 text-2xl animate-star-2">🎉</div>
            <div className="absolute -bottom-1 -left-2 text-2xl animate-star-3">⭐</div>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* رسالة التأكيد */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div
          className={`text-center mb-6 ${
            showContent ? 'animate-slide-up' : 'opacity-0'
          }`}
          style={{ animationDelay: '200ms' }}
        >
          <h1 className="text-3xl md:text-4xl font-black text-stone-800 mb-2 leading-tight">
            تم تأكيد طلبك!
          </h1>
          <p className="text-stone-600 text-sm max-w-sm mx-auto leading-relaxed">
            {multipleOrders
              ? `تم إنشاء ${orderIds.length} طلبات منفصلة للطباخات، وستتواصل معك كل واحدة قريباً`
              : 'تم إرسال طلبك للطباخة وستتواصل معك عبر الهاتف قريباً'}
          </p>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* أرقام الطلبات */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {orderIds.length > 0 && (
          <div
            className={`bg-white rounded-3xl shadow-xl shadow-stone-900/5 p-5 mb-4 ${
              showContent ? 'animate-slide-up' : 'opacity-0'
            }`}
            style={{ animationDelay: '350ms' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                <Package className="w-4 h-4 text-orange-600" strokeWidth={2.4} />
              </div>
              <h2 className="text-sm font-extrabold text-stone-800">
                {multipleOrders ? `أرقام طلباتك (${orderIds.length})` : 'رقم طلبك'}
              </h2>
            </div>

            <div className="space-y-2">
              {orderIds.map((id, index) => {
                const shortId = id.slice(0, 8).toUpperCase();
                const isCopied = copiedId === id;
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between bg-gradient-to-l from-orange-50 to-stone-50 rounded-2xl p-3 border border-orange-100"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {multipleOrders && (
                        <div className="flex-shrink-0 w-7 h-7 bg-orange-500 text-white rounded-lg flex items-center justify-center text-xs font-black">
                          {index + 1}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-stone-500 font-semibold leading-none">
                          رقم الطلب
                        </p>
                        <p
                          className="font-black text-stone-800 text-sm mt-1 font-mono tracking-wider"
                          dir="ltr"
                          style={{ textAlign: 'right' }}
                        >
                          #{shortId}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(id)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-all ${
                        isCopied
                          ? 'bg-green-500 text-white'
                          : 'bg-white hover:bg-orange-100 text-stone-600 shadow-sm'
                      }`}
                      aria-label="نسخ"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4" strokeWidth={3} />
                      ) : (
                        <Copy className="w-4 h-4" strokeWidth={2.3} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* الخطوات التالية - Timeline */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div
          className={`bg-white rounded-3xl shadow-xl shadow-stone-900/5 p-5 mb-4 ${
            showContent ? 'animate-slide-up' : 'opacity-0'
          }`}
          style={{ animationDelay: '500ms' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-600" strokeWidth={2.4} />
            </div>
            <h2 className="text-sm font-extrabold text-stone-800">
              ما الخطوة التالية؟
            </h2>
          </div>

          <div className="space-y-3">
            <TimelineStep
              icon={MessageCircle}
              title="مراجعة الطلب"
              desc="الطباخة ستراجع طلبك وتؤكّده"
              color="blue"
              active
            />
            <TimelineStep
              icon={ChefHat}
              title="التحضير"
              desc="ستبدأ بتحضير أطباقك بحب"
              color="orange"
            />
            <TimelineStep
              icon={Truck}
              title="الاستلام"
              desc="سيتم الاتفاق على موعد التسليم"
              color="green"
              last
            />
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* نصيحة */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div
          className={`bg-gradient-to-l from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3.5 mb-6 flex items-start gap-3 ${
            showContent ? 'animate-slide-up' : 'opacity-0'
          }`}
          style={{ animationDelay: '650ms' }}
        >
          <div className="w-8 h-8 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-extrabold text-amber-900 mb-0.5">
              تابع طلبك في أي وقت
            </p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              يمكنك متابعة حالة طلبك والتواصل مع الطباخة من صفحة "طلباتي"
            </p>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* الأزرار */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div
          className={`space-y-2.5 ${showContent ? 'animate-slide-up' : 'opacity-0'}`}
          style={{ animationDelay: '800ms' }}
        >
          <Link
            to="/my-orders"
            className="flex items-center justify-center gap-2 bg-gradient-to-l from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3.5 rounded-2xl font-extrabold text-sm shadow-lg shadow-orange-500/30 active:scale-[0.98] transition-all"
          >
            <Package className="w-4 h-4" strokeWidth={2.4} />
            تتبّع طلباتي
          </Link>

          <Link
            to="/cooks"
            className="flex items-center justify-center gap-2 bg-white hover:bg-orange-50 border-2 border-orange-500 text-orange-600 py-3.5 rounded-2xl font-extrabold text-sm active:scale-[0.98] transition-all"
          >
            <ShoppingBag className="w-4 h-4" strokeWidth={2.4} />
            اطلب المزيد
          </Link>

          <Link
            to="/"
            className="flex items-center justify-center gap-2 text-stone-500 hover:text-stone-700 py-2 text-sm font-semibold active:scale-95 transition"
          >
            <Home className="w-4 h-4" strokeWidth={2.3} />
            العودة للرئيسية
          </Link>
        </div>
      </div>

      {/* ============================================ */}
      {/* Styles للحركات الخاصة */}
      {/* ============================================ */}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }

        @keyframes success-pop {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.15) rotate(10deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        .animate-success-pop {
          animation: success-pop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .animate-ping-slower {
          animation: ping-slow 2.5s cubic-bezier(0, 0, 0.2, 1) infinite 0.3s;
        }

        @keyframes star-float-1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(4px, -6px) rotate(15deg); }
        }
        @keyframes star-float-2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-5px, -4px) rotate(-10deg); }
        }
        @keyframes star-float-3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(3px, 5px) rotate(20deg); }
        }
        .animate-star-1 { animation: star-float-1 2.5s ease-in-out infinite 0.5s; }
        .animate-star-2 { animation: star-float-2 3s ease-in-out infinite 0.8s; }
        .animate-star-3 { animation: star-float-3 2.8s ease-in-out infinite 1.1s; }
      `}</style>
    </div>
  );
}

/* ============================================ */
/* Timeline Step */
/* ============================================ */
function TimelineStep({ icon: Icon, title, desc, color, active, last }) {
  const colors = {
    blue: {
      bg: active ? 'bg-blue-500' : 'bg-blue-100',
      text: active ? 'text-white' : 'text-blue-500',
      line: 'bg-blue-200',
    },
    orange: {
      bg: active ? 'bg-orange-500' : 'bg-orange-100',
      text: active ? 'text-white' : 'text-orange-500',
      line: 'bg-orange-200',
    },
    green: {
      bg: active ? 'bg-green-500' : 'bg-green-100',
      text: active ? 'text-white' : 'text-green-500',
      line: 'bg-green-200',
    },
  };
  const c = colors[color];

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`relative w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${c.bg} ${
            active ? 'shadow-lg' : ''
          }`}
          style={{ boxShadow: active ? '0 0 0 4px rgba(59, 130, 246, 0.15)' : '' }}
        >
          <Icon className={`w-5 h-5 ${c.text}`} strokeWidth={2.3} />
          {active && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white animate-pulse" />
          )}
        </div>
        {!last && (
          <div className={`w-0.5 h-6 mt-1 ${c.line} rounded-full`} />
        )}
      </div>
      <div className="flex-1 pt-1 pb-3">
        <p className="font-extrabold text-stone-800 text-sm leading-none">
          {title}
        </p>
        <p className="text-xs text-stone-500 mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default OrderSuccess;