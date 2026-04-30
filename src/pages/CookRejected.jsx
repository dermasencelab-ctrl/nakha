import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { XCircle, ArrowRight, RefreshCw, CheckCircle } from 'lucide-react';

const TIPS = [
  'أضف صوراً عالية الجودة لأعمالك السابقة (5 صور على الأقل)',
  'اكتب وصفاً تفصيلياً عن تخصصك ونوع الطعام الذي تقدمينه',
  'أضف رابط حساب فيسبوك أو إنستغرام يُظهر أعمالك',
  'تأكدي من صحة رقم الهاتف وبيانات التواصل',
  'اختاري حيّاً دقيقاً يعكس منطقة التوصيل الحقيقية',
];

export default function CookRejected() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleRetry = async () => {
    await logout();
    navigate('/cook/signup');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF8F0] flex items-center justify-center p-4">
      {/* Blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-red-100/60 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-100/60 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* أيقونة الرفض */}
        <div className="text-center mb-7">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-red-400/20 rounded-full blur-2xl scale-150" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-red-500/20">
              <XCircle className="w-12 h-12 text-red-500" strokeWidth={1.8} />
            </div>
          </div>
          <h1 className="text-2xl font-black text-stone-800 mb-2">
            لم يُقبل طلب التسجيل
          </h1>
          <p className="text-sm text-stone-500 max-w-xs mx-auto leading-relaxed">
            عذراً، لم نتمكن من قبول ملفك في هذه المرة. يمكنك إعادة المحاولة بعد تحسين البيانات.
          </p>
        </div>

        {/* نصائح التحسين */}
        <div className="bg-white rounded-3xl shadow-xl shadow-stone-900/5 p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-base">💡</span>
            </div>
            <h2 className="font-extrabold text-stone-800 text-sm">نصائح لتحسين طلبك</h2>
          </div>
          <ul className="space-y-3">
            {TIPS.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ border: '1px solid rgba(234,88,12,0.2)' }}>
                  <CheckCircle className="w-3 h-3 text-orange-500" strokeWidth={2.5} />
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">{tip}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* الأزرار */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-l from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3.5 rounded-2xl font-extrabold text-sm shadow-lg shadow-orange-500/30 active:scale-[0.98] transition-all"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={2.5} />
            إعادة التسجيل
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-800 py-3.5 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all"
          >
            <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
            العودة للرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
