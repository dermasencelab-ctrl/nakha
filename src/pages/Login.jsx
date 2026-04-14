import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

      // التوجيه حسب الدور
      if (profile.role === 'admin') {
        navigate('/admin');
      } else if (profile.role === 'cook') {
        // التحقق من حالة التوثيق
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
      } else {
        setError('حدث خطأ، حاول مرة أخرى');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">نَكهة</h1>
          <p className="text-gray-600">تسجيل الدخول</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2 font-medium">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="example@email.com"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-medium">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition disabled:opacity-50"
          >
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>هل أنت طباخة؟</p>
          <Link to="/cook/signup" className="text-orange-600 font-bold hover:underline">
            سجّلي كطباخة جديدة
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-gray-500 text-sm hover:underline">
            ← العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;