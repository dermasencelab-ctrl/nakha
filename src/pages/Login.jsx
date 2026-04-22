import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ChefHat,
  AlertCircle,
  Loader2,
  LogIn,
} from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user, profile } = await login(email, password);

      if (!profile) {
        setError('لم يتم العثور على حساب مرتبط');
        setLoading(false);
        return;
      }

      if (profile.role === 'admin') {
        navigate('/admin');
      } else if (profile.role === 'cook') {
        const cookDoc = await getDoc(doc(db, 'cooks', profile.cookId));
        if (cookDoc.exists() && cookDoc.data().status === 'approved') {
          navigate('/cook/dashboard');
        } else {
          navigate('/cook/pending');
        }
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (err.code === 'auth/user-not-found') {
        setError('لا يوجد حساب بهذا البريد');
      } else if (err.code === 'auth/too-many-requests') {
        setError('محاولات كثيرة خاطئة، انتظر قليلاً ثم حاول مرة أخرى');
      } else {
        setError('حدث خطأ، حاول مرة أخرى');
      }
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex items-center justify-center p-4"
    >
      {/* زخارف خلفية */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-orange-300/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-300/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* زر الرجوع */}
      <Link
        to="/"
        className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md active:scale-90 transition z-10"
        aria-label="الرجوع"
      >
        <ArrowLeft className="w-4 h-4 text-stone-700 rotate-180" strokeWidth={2.4} />
      </Link>

      {/* بطاقة الدخول */}
      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* شعار */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-3">
            <div className="absolute inset-0 bg-orange-400/40 rounded-3xl blur-xl" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-xl shadow-orange-500/40 mx-auto">
              <ChefHat className="w-10 h-10 text-white" strokeWidth={2.3} />
            </div>
          </div>
          <h1 className="text-3xl font-black text-stone-800 mb-1">نَكهة</h1>
          <p className="text-sm text-stone-600">أهلاً بعودتك 👋</p>
        </div>

        {/* البطاقة */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-stone-900/10 p-6 md:p-7">
          <div className="mb-5">
            <h2 className="text-xl font-extrabold text-stone-800">
              تسجيل الدخول
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              أدخل بياناتك للوصول إلى حسابك
            </p>
          </div>

          {/* رسالة الخطأ */}
          {error && (
            <div className="bg-red-50 border-r-4 border-red-500 rounded-2xl p-3 mb-4 flex items-start gap-2.5 animate-slide-up">
              <div className="w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <p className="text-xs font-bold text-red-700 flex-1 pt-1">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* البريد الإلكتروني */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-stone-700 mb-1.5">
                <Mail className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-2xl text-sm font-medium text-stone-700 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:bg-white transition"
                  placeholder="example@email.com"
                  style={{ textAlign: 'right' }}
                />
              </div>
            </div>

            {/* كلمة المرور */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-stone-700 mb-1.5">
                <Lock className="w-4 h-4 text-orange-500" strokeWidth={2.4} />
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  dir="ltr"
                  className="w-full px-4 py-3 pl-12 bg-stone-50 border-2 border-stone-200 rounded-2xl text-sm font-medium text-stone-700 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:bg-white transition"
                  placeholder="••••••••"
                  style={{ textAlign: 'right' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl hover:bg-stone-100 flex items-center justify-center active:scale-90 transition"
                  aria-label={showPassword ? 'إخفاء' : 'إظهار'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-stone-500" strokeWidth={2.3} />
                  ) : (
                    <Eye className="w-4 h-4 text-stone-500" strokeWidth={2.3} />
                  )}
                </button>
              </div>
            </div>

            {/* زر الدخول */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-l from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3.5 rounded-2xl font-extrabold text-sm shadow-lg shadow-orange-500/30 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-wait mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                  جاري الدخول...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" strokeWidth={2.5} />
                  دخول
                </>
              )}
            </button>
          </form>

          {/* فاصل */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[11px] font-bold text-stone-400">
                أو
              </span>
            </div>
          </div>

          {/* رابط تسجيل طباخة */}
          <Link
            to="/cook/signup"
            className="w-full flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 text-amber-800 py-3 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all group"
          >
            <ChefHat className="w-4 h-4 text-amber-600" strokeWidth={2.4} />
            <span>هل أنتِ طباخة؟</span>
            <span className="text-amber-700 font-black group-hover:underline">
              سجّلي الآن
            </span>
          </Link>
        </div>

        {/* روابط سفلية */}
        <div className="text-center mt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-700 text-xs font-semibold active:scale-95 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 rotate-180" strokeWidth={2.3} />
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;