import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ImageUploader from '../components/ImageUploader';

const CookSignup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    neighborhood: '',
    bio: '',
    photo: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signupCook } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePhone = (phone) => {
    // رقم جزائري: 10 أرقام، يبدأ بـ 0
    const phoneRegex = /^0[5-7][0-9]{8}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // التحقق من البيانات
    if (formData.password !== formData.confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (!validatePhone(formData.phone)) {
      setError('رقم الهاتف غير صحيح (10 أرقام، يبدأ بـ 05 أو 06 أو 07)');
      return;
    }

    if (formData.name.trim().length < 2) {
      setError('الاسم قصير جداً');
      return;
    }

    if (formData.neighborhood.trim().length < 2) {
      setError('يرجى إدخال الحي');
      return;
    }

    setLoading(true);

    try {
      await signupCook(formData.email, formData.password, {
        name: formData.name.trim(),
        phone: formData.phone,
        neighborhood: formData.neighborhood.trim(),
        bio: formData.bio.trim(),
        photo: formData.photo,
      });

      // التوجيه لصفحة الانتظار
      navigate('/cook/pending');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('هذا البريد الإلكتروني مسجّل مسبقاً');
      } else if (err.code === 'auth/invalid-email') {
        setError('البريد الإلكتروني غير صحيح');
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة');
      } else {
        setError('حدث خطأ، حاول مرة أخرى');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">انضمي لـ نَكهة 🍽️</h1>
          <p className="text-gray-600">سجّلي كطباخة وابدئي بيع أكلك المنزلي في بشار</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* الاسم الكامل */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">الاسم الكامل *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="فاطمة الزهراء"
            />
          </div>

          {/* البريد الإلكتروني */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">البريد الإلكتروني *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="example@email.com"
              dir="ltr"
            />
          </div>

          {/* رقم الهاتف */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">رقم الهاتف (واتساب) *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              maxLength={10}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="0555123456"
              dir="ltr"
            />
            <p className="text-xs text-gray-500 mt-1">10 أرقام، يبدأ بـ 05 أو 06 أو 07</p>
          </div>

          {/* الحي */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">الحي في بشار *</label>
            <input
              type="text"
              name="neighborhood"
              value={formData.neighborhood}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="مثلاً: حي الفرح"
            />
          </div>

          {/* نبذة */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">نبذة عن أكلك (اختياري)</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="مثلاً: متخصصة في الحلويات التقليدية والمعجنات..."
            />
          </div>

          {/* صورة شخصية */}
          <ImageUploader
            value={formData.photo}
            onChange={(url) => setFormData({ ...formData, photo: url })}
            folder="cooks"
            label="صورتك الشخصية (اختياري)"
          />

          {/* كلمة المرور */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">كلمة المرور *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>

          {/* تأكيد كلمة المرور */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">تأكيد كلمة المرور *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
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
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition disabled:opacity-50 mt-6"
          >
            {loading ? 'جاري التسجيل...' : 'سجّلي الآن'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>عندك حساب بالفعل؟</p>
          <Link to="/login" className="text-orange-600 font-bold hover:underline">
            سجّلي الدخول
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

export default CookSignup;