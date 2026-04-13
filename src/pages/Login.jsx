import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { LogIn, ChefHat } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      // تحديد الدور والتوجيه
      const adminDoc = await getDoc(doc(db, 'admins', uid));
      if (adminDoc.exists()) {
        navigate('/admin/dashboard');
        return;
      }

      const cookDoc = await getDoc(doc(db, 'cooks', uid));
      if (cookDoc.exists()) {
        if (cookDoc.data().isVerified) {
          navigate('/cook/dashboard');
        } else {
          setError('حسابك في انتظار توثيق الإدارة ⏳');
        }
        return;
      }

      setError('الحساب غير موجود في النظام');
    } catch (err) {
      setError('البريد الإلكتروني أو كلمة السر خاطئة');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <LogIn className="w-16 h-16 text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-dark">تسجيل الدخول</h1>
          <p className="text-gray-600 mt-2">للطباخات والإدارة</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            required
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none"
          />
          <input
            type="password"
            required
            placeholder="كلمة السر"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none"
          />
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-50"
          >
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>
        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-gray-600 text-sm mb-2">طباخة جديدة؟</p>
          <Link to="/cook/signup" className="text-primary font-bold flex items-center justify-center gap-2">
            <ChefHat className="w-5 h-5" />
            سجّلي كطباخة
          </Link>
        </div>
        <Link to="/" className="block text-center text-gray-500 mt-4 text-sm">
          ← العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}

export default Login;